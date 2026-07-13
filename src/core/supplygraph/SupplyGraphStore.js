const { randomUUID } = require('crypto');
const { camel } = require('../work-queue/PostgresInternalOperationsStore');
const {
  DEMAND_COMMANDS,
  DEMAND_PRIORITIES,
  DEMAND_STATUSES,
  createSupplyGraphError,
  evaluateDemandCompleteness,
  normalizeDemandItem,
  sanitizeMetadata,
} = require('./supplyGraphTypes');

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
const now = () => new Date().toISOString();
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const jsonSafe = (value) => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, jsonSafe(entry)]));
};
const safeCamel = (row) => jsonSafe(camel(row));

const emptyState = () => ({
  suppliers: [], catalogItems: [], offerSnapshots: [], demandRequests: [], demandItems: [], auditEvents: [],
  matchRuns: [], matchItemResults: [], matchCandidates: [], sourcingRecommendations: [],
  evidencePackages: [], factObservations: [], evidenceApplications: [],
});

class SupplyGraphStore {
  constructor({ internalStore, state } = {}) {
    this.internalStore = internalStore;
    this.state = state || null;
  }

  isPostgres() { return Boolean(this.internalStore?.pool && this.internalStore?.withTransaction); }
  isTestMemory() { return Boolean(this.state); }

  assertReady() {
    if (!this.isPostgres() && !this.isTestMemory()) {
      throw createSupplyGraphError(
        'SupplyGraph durable persistence is not configured.',
        'SUPPLYGRAPH_PERSISTENCE_CONFIGURATION_REQUIRED',
        503,
      );
    }
  }

  table(name) {
    this.assertReady();
    return this.internalStore.table(name);
  }

  async health() {
    if (this.isTestMemory()) {
      return { healthy: true, provider: 'memory_test_only', durable: false, schema: 'cornerops_internal' };
    }
    if (!this.isPostgres()) {
      return { healthy: false, provider: 'postgres', durable: true, schema: 'cornerops_internal', errorCode: 'SUPPLYGRAPH_PERSISTENCE_CONFIGURATION_REQUIRED' };
    }
    try {
      const tables = ['supplier_profiles', 'supplier_catalog_items', 'supplier_offer_snapshots', 'demand_requests', 'demand_items'];
      const result = await this.internalStore.pool.query(
        'select bool_and(to_regclass(name) is not null) as ready from unnest($1::text[]) name',
        [tables.map((name) => `cornerops_internal.${name}`)],
      );
      return { healthy: Boolean(result.rows[0]?.ready), provider: 'postgres', durable: true, schema: 'cornerops_internal' };
    } catch (error) {
      return { healthy: false, provider: 'postgres', durable: true, schema: 'cornerops_internal', errorCode: error.code || 'SUPPLYGRAPH_POSTGRES_UNAVAILABLE' };
    }
  }

  async appendAudit(client, event) {
    const safeEvent = { ...event, metadata: sanitizeMetadata(event.metadata) };
    if (this.isTestMemory()) {
      const record = { id: randomUUID(), ...safeEvent, createdAt: now() };
      this.state.auditEvents.push(record);
      return record;
    }
    return this.internalStore.appendAudit(client, safeEvent);
  }

  async syncCatalog(source, context = {}) {
    this.assertReady();
    return this.isTestMemory()
      ? this.syncCatalogMemory(source, context)
      : this.internalStore.withTransaction((client) => this.syncCatalogPostgres(client, source, context));
  }

  async syncCatalogMemory(source, context) {
    const summary = this.syncSummary(source);
    let supplier = this.state.suppliers.find((candidate) => candidate.canonicalKey === source.supplier.canonicalKey);
    if (!supplier) {
      supplier = { id: randomUUID(), ...clone(source.supplier), createdAt: now(), updatedAt: now(), version: 1 };
      this.state.suppliers.push(supplier);
      summary.supplierCreated = true;
      await this.appendAudit(null, { eventType: 'supplygraph_supplier_created', entityType: 'supplier_profile', entityId: supplier.id, ...context });
    } else {
      summary.supplierReused = true;
    }
    for (const sourceItem of source.items) {
      let item = this.state.catalogItems.find(
        (candidate) => candidate.supplierId === supplier.id && candidate.identityKey === sourceItem.identityKey,
      );
      const catalogFields = { ...sourceItem };
      delete catalogFields.offer;
      if (!item) {
        item = { id: randomUUID(), supplierId: supplier.id, ...clone(catalogFields), createdAt: now(), updatedAt: now(), version: 1 };
        this.state.catalogItems.push(item);
        summary.createdCatalogItems += 1;
        await this.appendAudit(null, { eventType: 'supplygraph_catalog_item_created', entityType: 'supplier_catalog_item', entityId: item.id, ...context });
      } else if (!same(this.catalogComparable(item), this.catalogComparable(catalogFields))) {
        Object.assign(item, clone(catalogFields), { updatedAt: now(), version: item.version + 1 });
        summary.updatedCatalogItems += 1;
        await this.appendAudit(null, { eventType: 'supplygraph_catalog_item_updated', entityType: 'supplier_catalog_item', entityId: item.id, ...context });
      } else summary.reusedCatalogItems += 1;
      const existingSnapshot = this.state.offerSnapshots.find(
        (snapshot) => snapshot.idempotencyKey === sourceItem.offer.idempotencyKey,
      );
      if (!existingSnapshot) {
        const snapshot = { id: randomUUID(), supplierCatalogItemId: item.id, ...clone(sourceItem.offer), createdAt: now() };
        this.state.offerSnapshots.push(snapshot);
        summary.createdOfferSnapshots += 1;
        await this.appendAudit(null, { eventType: 'supplygraph_offer_snapshot_created', entityType: 'supplier_offer_snapshot', entityId: snapshot.id, ...context });
      } else summary.unchangedOfferSnapshots += 1;
    }
    await this.appendAudit(null, {
      eventType: 'supplygraph_intermex_sync_completed', entityType: 'supplier_profile', entityId: supplier.id,
      ...context, metadata: this.safeSyncMetadata(summary),
    });
    return { supplier: clone(supplier), ...summary };
  }

  async syncCatalogPostgres(client, source, context) {
    const summary = this.syncSummary(source);
    let supplierResult = await client.query(
      `select * from ${this.table('supplier_profiles')} where canonical_key=$1 for update`,
      [source.supplier.canonicalKey],
    );
    let supplier = supplierResult.rows[0];
    if (!supplier) {
      supplierResult = await client.query(
        `insert into ${this.table('supplier_profiles')}
         (canonical_key,canonical_name,legal_name,supplier_type,country_code,emirate,status,website,
          source_type,source_reference,observed_at,verified_at,verification_status,metadata)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb) returning *`,
        [source.supplier.canonicalKey, source.supplier.canonicalName, source.supplier.legalName,
          source.supplier.supplierType, source.supplier.countryCode, source.supplier.emirate,
          source.supplier.status, source.supplier.website, source.supplier.sourceType,
          source.supplier.sourceReference, source.supplier.observedAt, source.supplier.verifiedAt,
          source.supplier.verificationStatus, JSON.stringify(sanitizeMetadata(source.supplier.metadata))],
      );
      supplier = supplierResult.rows[0];
      summary.supplierCreated = true;
      await this.appendAudit(client, { eventType: 'supplygraph_supplier_created', entityType: 'supplier_profile', entityId: supplier.id, ...context });
    } else summary.supplierReused = true;

    for (const sourceItem of source.items) {
      let catalogResult = await client.query(
        `select * from ${this.table('supplier_catalog_items')}
         where supplier_id=$1 and identity_key=$2 for update`,
        [supplier.id, sourceItem.identityKey],
      );
      let item = catalogResult.rows[0];
      const catalogFields = { ...sourceItem };
      delete catalogFields.offer;
      if (!item) {
        catalogResult = await client.query(
          `insert into ${this.table('supplier_catalog_items')}
           (supplier_id,identity_key,external_product_id,supplier_sku,normalized_name,display_name,brand,
            category,pack_size,unit_of_measure,temperature_zone,source_type,source_reference,
            source_checksum,active_observation)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning *`,
          [supplier.id, sourceItem.identityKey, sourceItem.externalProductId, sourceItem.supplierSku,
            sourceItem.normalizedName, sourceItem.displayName, sourceItem.brand, sourceItem.category,
            sourceItem.packSize, sourceItem.unitOfMeasure, sourceItem.temperatureZone,
            sourceItem.sourceType, sourceItem.sourceReference, sourceItem.sourceChecksum,
            sourceItem.activeObservation],
        );
        item = catalogResult.rows[0];
        summary.createdCatalogItems += 1;
        await this.appendAudit(client, { eventType: 'supplygraph_catalog_item_created', entityType: 'supplier_catalog_item', entityId: item.id, ...context });
      } else if (!same(this.catalogComparable(safeCamel(item)), this.catalogComparable(catalogFields))) {
        catalogResult = await client.query(
          `update ${this.table('supplier_catalog_items')} set
             external_product_id=$3,supplier_sku=$4,normalized_name=$5,display_name=$6,brand=$7,
             category=$8,pack_size=$9,unit_of_measure=$10,temperature_zone=$11,source_type=$12,
             source_reference=$13,source_checksum=$14,active_observation=$15,
             updated_at=now(),version=version+1
           where supplier_id=$1 and identity_key=$2 returning *`,
          [supplier.id, sourceItem.identityKey, sourceItem.externalProductId, sourceItem.supplierSku,
            sourceItem.normalizedName, sourceItem.displayName, sourceItem.brand, sourceItem.category,
            sourceItem.packSize, sourceItem.unitOfMeasure, sourceItem.temperatureZone,
            sourceItem.sourceType, sourceItem.sourceReference, sourceItem.sourceChecksum,
            sourceItem.activeObservation],
        );
        item = catalogResult.rows[0];
        summary.updatedCatalogItems += 1;
        await this.appendAudit(client, { eventType: 'supplygraph_catalog_item_updated', entityType: 'supplier_catalog_item', entityId: item.id, ...context });
      } else summary.reusedCatalogItems += 1;

      const offer = sourceItem.offer;
      const snapshot = await client.query(
        `insert into ${this.table('supplier_offer_snapshots')}
         (supplier_catalog_item_id,idempotency_key,currency,unit_price,stock_status,stock_quantity,
          minimum_order_quantity,minimum_order_unit,lead_time_days,shelf_life_days,valid_until,
          observed_at,source_type,source_reference,source_checksum,verification_status,metadata)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)
         on conflict (idempotency_key) do nothing returning *`,
        [item.id, offer.idempotencyKey, offer.currency, offer.unitPrice, offer.stockStatus,
          offer.stockQuantity, offer.minimumOrderQuantity, offer.minimumOrderUnit, offer.leadTimeDays,
          offer.shelfLifeDays, offer.validUntil, offer.observedAt, offer.sourceType,
          offer.sourceReference, offer.sourceChecksum, offer.verificationStatus,
          JSON.stringify(sanitizeMetadata(offer.metadata))],
      );
      if (snapshot.rows[0]) {
        summary.createdOfferSnapshots += 1;
        await this.appendAudit(client, { eventType: 'supplygraph_offer_snapshot_created', entityType: 'supplier_offer_snapshot', entityId: snapshot.rows[0].id, ...context });
      } else summary.unchangedOfferSnapshots += 1;
    }
    await this.appendAudit(client, {
      eventType: 'supplygraph_intermex_sync_completed', entityType: 'supplier_profile', entityId: supplier.id,
      ...context, metadata: this.safeSyncMetadata(summary),
    });
    return { supplier: safeCamel(supplier), ...summary };
  }

  syncSummary(source) {
    return {
      sourceType: 'repo_catalog_snapshot',
      sourceChecksum: source.sourceChecksum,
      scannedItems: source.scannedItems,
      supplierCreated: false,
      supplierReused: false,
      createdCatalogItems: 0,
      updatedCatalogItems: 0,
      reusedCatalogItems: 0,
      createdOfferSnapshots: 0,
      unchangedOfferSnapshots: 0,
      skippedItems: source.skipped.length,
      errors: [],
      cornerMexMutations: false,
      externalActions: false,
    };
  }

  safeSyncMetadata(summary) {
    const { sourceChecksum, ...safe } = summary;
    return { ...safe, sourceChecksumFingerprint: String(sourceChecksum).slice(0, 12) };
  }

  catalogComparable(item) {
    return {
      externalProductId: item.externalProductId || null,
      supplierSku: item.supplierSku || null,
      normalizedName: item.normalizedName,
      displayName: item.displayName,
      brand: item.brand || null,
      category: item.category || null,
      packSize: item.packSize || null,
      unitOfMeasure: item.unitOfMeasure || null,
      temperatureZone: item.temperatureZone || null,
      sourceType: item.sourceType,
      sourceReference: item.sourceReference || null,
      sourceChecksum: item.sourceChecksum || null,
      activeObservation: Boolean(item.activeObservation),
    };
  }

  async createDemand(demand, context = {}) {
    this.assertReady();
    return this.isTestMemory()
      ? this.createDemandMemory(demand, context)
      : this.internalStore.withTransaction((client) => this.createDemandPostgres(client, demand, context));
  }

  async createDemandMemory(demand, context) {
    const existing = this.state.demandRequests.find((item) => item.idempotencyKey === demand.idempotencyKey);
    if (existing) return { request: clone(existing), items: await this.getDemandItemsMemory(existing.id), created: false };
    const timestamp = now();
    const request = { id: randomUUID(), ...clone(demand), createdAt: timestamp, updatedAt: timestamp, closedAt: null, version: 1 };
    delete request.items;
    this.state.demandRequests.push(request);
    const items = demand.items.map((item) => ({ id: randomUUID(), demandRequestId: request.id, ...clone(item), createdAt: timestamp, updatedAt: timestamp, version: 1 }));
    this.state.demandItems.push(...items);
    await this.appendAudit(null, { eventType: 'supplygraph_demand_created', entityType: 'demand_request', entityId: request.id, ...context, metadata: { itemCount: items.length, status: request.status } });
    for (const item of items) await this.appendAudit(null, { eventType: 'supplygraph_demand_item_created', entityType: 'demand_item', entityId: item.id, ...context, metadata: { demandRequestId: request.id, itemKey: item.itemKey } });
    return { request: clone(request), items: clone(items), created: true };
  }

  async createDemandPostgres(client, demand, context) {
    const existing = await client.query(
      `select * from ${this.table('demand_requests')} where idempotency_key=$1`, [demand.idempotencyKey],
    );
    if (existing.rows[0]) {
      const items = await client.query(`select * from ${this.table('demand_items')} where demand_request_id=$1 order by created_at`, [existing.rows[0].id]);
      return { request: safeCamel(existing.rows[0]), items: items.rows.map(safeCamel), created: false };
    }
    const inserted = await client.query(
      `insert into ${this.table('demand_requests')}
       (idempotency_key,customer_reference,customer_segment,emirate,status,priority,required_by,
        requested_currency,source_type,source_reference,internal_notes,missing_fields,created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13) returning *`,
      [demand.idempotencyKey, demand.customerReference, demand.customerSegment, demand.emirate,
        demand.status, demand.priority, demand.requiredBy, demand.requestedCurrency, demand.sourceType,
        demand.sourceReference, demand.internalNotes, JSON.stringify(demand.missingFields), demand.createdBy],
    );
    const request = inserted.rows[0];
    const items = [];
    for (const item of demand.items) {
      const result = await client.query(
        `insert into ${this.table('demand_items')}
         (demand_request_id,item_key,product_query,normalized_query,requested_quantity,requested_unit,
          pack_preference,brand_required,preferred_brand,substitutes_allowed,maximum_unit_price,
          temperature_zone,notes,active)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning *`,
        [request.id, item.itemKey, item.productQuery, item.normalizedQuery, item.requestedQuantity,
          item.requestedUnit, item.packPreference, item.brandRequired, item.preferredBrand,
          item.substitutesAllowed, item.maximumUnitPrice, item.temperatureZone, item.notes, item.active],
      );
      items.push(result.rows[0]);
      await this.appendAudit(client, { eventType: 'supplygraph_demand_item_created', entityType: 'demand_item', entityId: result.rows[0].id, ...context, metadata: { demandRequestId: request.id, itemKey: item.itemKey } });
    }
    await this.appendAudit(client, { eventType: 'supplygraph_demand_created', entityType: 'demand_request', entityId: request.id, ...context, metadata: { itemCount: items.length, status: request.status } });
    return { request: safeCamel(request), items: items.map(safeCamel), created: true };
  }

  async updateDemand(id, command, context = {}) {
    this.assertReady();
    if (!DEMAND_COMMANDS.includes(command.command)) {
      throw createSupplyGraphError('Demand command is not allowed.', 'SUPPLYGRAPH_DEMAND_COMMAND_DENIED', 403);
    }
    return this.isTestMemory()
      ? this.updateDemandMemory(id, command, context)
      : this.internalStore.withTransaction((client) => this.updateDemandPostgres(client, id, command, context));
  }

  async updateDemandMemory(id, command, context) {
    const request = this.state.demandRequests.find((item) => item.id === id);
    if (!request) return null;
    if (Number(command.version) !== request.version) throw createSupplyGraphError('Demand request version is stale.', 'SUPPLYGRAPH_VERSION_CONFLICT', 409);
    const items = this.state.demandItems.filter((item) => item.demandRequestId === id);
    await this.applyDemandCommand({ request, items, command, mutateItem: async () => {} });
    request.version += 1;
    request.updatedAt = now();
    await this.appendAudit(null, { eventType: `supplygraph_demand_${command.command}`, entityType: 'demand_request', entityId: id, ...context, metadata: { reason: command.reason || null, version: request.version } });
    return { request: clone(request), items: clone(items) };
  }

  async updateDemandPostgres(client, id, command, context) {
    const requestResult = await client.query(`select * from ${this.table('demand_requests')} where id=$1 for update`, [id]);
    if (!requestResult.rows[0]) return null;
    const request = safeCamel(requestResult.rows[0]);
    if (Number(command.version) !== request.version) throw createSupplyGraphError('Demand request version is stale.', 'SUPPLYGRAPH_VERSION_CONFLICT', 409);
    const itemResult = await client.query(`select * from ${this.table('demand_items')} where demand_request_id=$1 order by created_at for update`, [id]);
    const items = itemResult.rows.map(safeCamel);
    const itemEvents = [];
    await this.applyDemandCommand({
      request,
      items,
      command,
      mutateItem: async (operation, item) => {
        if (operation === 'insert') {
          const inserted = await client.query(
            `insert into ${this.table('demand_items')}
             (demand_request_id,item_key,product_query,normalized_query,requested_quantity,requested_unit,
              pack_preference,brand_required,preferred_brand,substitutes_allowed,maximum_unit_price,
              temperature_zone,notes,active)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true) returning *`,
            [id, item.itemKey, item.productQuery, item.normalizedQuery, item.requestedQuantity,
              item.requestedUnit, item.packPreference, item.brandRequired, item.preferredBrand,
              item.substitutesAllowed, item.maximumUnitPrice, item.temperatureZone, item.notes],
          );
          Object.assign(item, safeCamel(inserted.rows[0]));
        } else {
          const updated = await client.query(
            `update ${this.table('demand_items')} set
               item_key=$2,product_query=$3,normalized_query=$4,requested_quantity=$5,requested_unit=$6,
               pack_preference=$7,brand_required=$8,preferred_brand=$9,substitutes_allowed=$10,
               maximum_unit_price=$11,temperature_zone=$12,notes=$13,active=$14,
               updated_at=now(),version=version+1 where id=$1 returning *`,
            [item.id, item.itemKey, item.productQuery, item.normalizedQuery, item.requestedQuantity,
              item.requestedUnit, item.packPreference, item.brandRequired, item.preferredBrand,
              item.substitutesAllowed, item.maximumUnitPrice, item.temperatureZone, item.notes, item.active],
          );
          Object.assign(item, safeCamel(updated.rows[0]));
        }
        itemEvents.push(item);
      },
    });
    const updated = await client.query(
      `update ${this.table('demand_requests')} set
         status=$3,priority=$4,required_by=$5,missing_fields=$6::jsonb,closed_at=$7,
         updated_at=now(),version=version+1
       where id=$1 and version=$2 returning *`,
      [id, command.version, request.status, request.priority, request.requiredBy,
        JSON.stringify(request.missingFields), request.closedAt],
    );
    if (!updated.rows[0]) throw createSupplyGraphError('Demand request version is stale.', 'SUPPLYGRAPH_VERSION_CONFLICT', 409);
    for (const item of itemEvents) await this.appendAudit(client, { eventType: `supplygraph_demand_item_${command.command}`, entityType: 'demand_item', entityId: item.id, ...context, metadata: { demandRequestId: id, itemKey: item.itemKey } });
    await this.appendAudit(client, { eventType: `supplygraph_demand_${command.command}`, entityType: 'demand_request', entityId: id, ...context, metadata: { reason: command.reason || null, version: updated.rows[0].version } });
    return { request: safeCamel(updated.rows[0]), items };
  }

  async applyDemandCommand({ request, items, command, mutateItem }) {
    if (request.status === 'closed' && command.command !== 'set_priority') {
      throw createSupplyGraphError('Closed demand request cannot be modified.', 'SUPPLYGRAPH_DEMAND_CLOSED', 409);
    }
    if (command.command === 'set_priority') {
      if (!DEMAND_PRIORITIES.includes(command.priority)) throw createSupplyGraphError('Demand priority is invalid.', 'SUPPLYGRAPH_PRIORITY_INVALID');
      request.priority = command.priority;
    } else if (command.command === 'set_required_by') {
      const requiredBy = new Date(command.requiredBy);
      if (Number.isNaN(requiredBy.getTime())) throw createSupplyGraphError('requiredBy is invalid.', 'SUPPLYGRAPH_REQUIRED_BY_INVALID');
      request.requiredBy = requiredBy.toISOString();
    } else if (command.command === 'add_item') {
      const item = { id: randomUUID(), demandRequestId: request.id, ...normalizeDemandItem(command.item, `item-${items.length + 1}`), createdAt: now(), updatedAt: now(), version: 1 };
      if (items.some((candidate) => candidate.active !== false && candidate.itemKey === item.itemKey)) throw createSupplyGraphError('Active itemKey already exists.', 'SUPPLYGRAPH_ITEM_CONFLICT', 409);
      items.push(item);
      await mutateItem('insert', item);
    } else if (command.command === 'update_item') {
      const item = items.find((candidate) => candidate.active !== false && (candidate.id === command.itemId || candidate.itemKey === command.itemKey));
      if (!item) throw createSupplyGraphError('Demand item not found.', 'SUPPLYGRAPH_ITEM_NOT_FOUND', 404);
      Object.assign(item, normalizeDemandItem({ ...item, ...(command.item || {}) }, item.itemKey));
      await mutateItem('update', item);
    } else if (command.command === 'deactivate_item') {
      if (!String(command.reason || '').trim()) throw createSupplyGraphError('Item deactivation reason is required.', 'SUPPLYGRAPH_REASON_REQUIRED');
      const item = items.find((candidate) => candidate.active !== false && (candidate.id === command.itemId || candidate.itemKey === command.itemKey));
      if (!item) throw createSupplyGraphError('Demand item not found.', 'SUPPLYGRAPH_ITEM_NOT_FOUND', 404);
      item.active = false;
      await mutateItem('update', item);
    } else if (command.command === 'close_request') {
      if (!String(command.reason || '').trim()) throw createSupplyGraphError('Closure reason is required.', 'SUPPLYGRAPH_REASON_REQUIRED');
      request.status = 'closed';
      request.closedAt = now();
    }
    const completeness = evaluateDemandCompleteness(request, items);
    request.missingFields = completeness;
    if (command.command === 'mark_ready_for_matching'
      || (command.command === 'set_status' && command.status === 'ready_for_matching')) {
      if (!completeness.completeForMatching) throw createSupplyGraphError('Demand request still has required missing fields.', 'SUPPLYGRAPH_DEMAND_INCOMPLETE', 409);
      request.status = 'ready_for_matching';
    } else if (command.command === 'set_status') {
      if (!DEMAND_STATUSES.includes(command.status) || command.status === 'closed') throw createSupplyGraphError('Demand status is invalid for set_status.', 'SUPPLYGRAPH_STATUS_INVALID');
      request.status = command.status;
    } else if (request.status !== 'closed') {
      request.status = completeness.completeForMatching ? 'ready_for_matching' : 'needs_information';
    }
  }

  async listSuppliers(filters = {}) {
    this.assertReady();
    const limit = Math.max(1, Math.min(Number(filters.limit) || 50, 100));
    if (this.isTestMemory()) return clone(this.state.suppliers.filter((item) => (!filters.status || item.status === filters.status) && (!filters.supplierType || item.supplierType === filters.supplierType) && (!filters.countryCode || item.countryCode === filters.countryCode) && (!filters.verificationStatus || item.verificationStatus === filters.verificationStatus)).slice(0, limit));
    const values = [];
    const clauses = [];
    const add = (column, value) => { if (value) { values.push(value); clauses.push(`${column}=$${values.length}`); } };
    add('status', filters.status); add('supplier_type', filters.supplierType); add('country_code', filters.countryCode); add('verification_status', filters.verificationStatus);
    values.push(limit);
    const result = await this.internalStore.pool.query(`select * from ${this.table('supplier_profiles')} ${clauses.length ? `where ${clauses.join(' and ')}` : ''} order by canonical_name limit $${values.length}`, values);
    return result.rows.map(safeCamel);
  }

  async getSupplier(id) {
    this.assertReady();
    if (this.isTestMemory()) return clone(this.state.suppliers.find((item) => item.id === id) || null);
    const result = await this.internalStore.pool.query(`select * from ${this.table('supplier_profiles')} where id=$1`, [id]);
    return result.rows[0] ? safeCamel(result.rows[0]) : null;
  }

  async listCatalog(filters = {}) {
    this.assertReady();
    const limit = Math.max(1, Math.min(Number(filters.limit) || 50, 100));
    const offset = Math.max(0, Number(filters.offset || filters.cursor) || 0);
    if (this.isTestMemory()) return clone(this.state.catalogItems.filter((item) => (!filters.supplierId || item.supplierId === filters.supplierId) && (!filters.category || item.category === filters.category) && (!filters.brand || item.brand === filters.brand)).slice(offset, offset + limit));
    const values = [];
    const clauses = [];
    const add = (column, value) => { if (value) { values.push(value); clauses.push(`c.${column}=$${values.length}`); } };
    add('supplier_id', filters.supplierId); add('category', filters.category); add('brand', filters.brand);
    if (filters.verificationStatus) { values.push(filters.verificationStatus); clauses.push(`o.verification_status=$${values.length}`); }
    if (filters.stockStatus) { values.push(filters.stockStatus); clauses.push(`o.stock_status=$${values.length}`); }
    if (filters.observedBefore) { values.push(filters.observedBefore); clauses.push(`o.observed_at<$${values.length}`); }
    if (filters.observedAfter) { values.push(filters.observedAfter); clauses.push(`o.observed_at>$${values.length}`); }
    values.push(limit, offset);
    const result = await this.internalStore.pool.query(
      `select c.*, row_to_json(o) as latest_offer from ${this.table('supplier_catalog_items')} c
       left join lateral (select currency,unit_price,stock_status,stock_quantity,minimum_order_quantity,
         minimum_order_unit,lead_time_days,shelf_life_days,valid_until,observed_at,source_type,
         source_reference,verification_status from ${this.table('supplier_offer_snapshots')}
         where supplier_catalog_item_id=c.id order by observed_at desc,created_at desc limit 1) o on true
       ${clauses.length ? `where ${clauses.join(' and ')}` : ''}
       order by c.normalized_name limit $${values.length - 1} offset $${values.length}`,
      values,
    );
    return result.rows.map((row) => {
      const item = safeCamel(row);
      return { ...item, latestOffer: item.latestOffer ? safeCamel(item.latestOffer) : null };
    });
  }

  async getCatalogEvidenceInputs(id) {
    this.assertReady();
    if (this.isTestMemory()) {
      const catalogItem = this.state.catalogItems.find((item) => item.id === id);
      if (!catalogItem) return null;
      const latestOffer = this.state.offerSnapshots.filter((item) => item.supplierCatalogItemId === id)
        .sort((a, b) => `${b.observedAt}:${b.createdAt}`.localeCompare(`${a.observedAt}:${a.createdAt}`))[0] || null;
      return { catalogItem: clone(catalogItem), latestOffer: clone(latestOffer) };
    }
    const result = await this.internalStore.pool.query(
      `select c.*,row_to_json(o) latest_offer from ${this.table('supplier_catalog_items')} c
       left join lateral (select * from ${this.table('supplier_offer_snapshots')} s where s.supplier_catalog_item_id=c.id order by observed_at desc,created_at desc limit 1) o on true
       where c.id=$1`, [id],
    );
    if (!result.rows[0]) return null;
    const catalogItem = safeCamel(result.rows[0]);
    return { catalogItem: { ...catalogItem, latestOffer: undefined }, latestOffer: catalogItem.latestOffer ? safeCamel(catalogItem.latestOffer) : null };
  }

  async listDemands(filters = {}) {
    this.assertReady();
    const limit = Math.max(1, Math.min(Number(filters.limit) || 50, 100));
    const offset = Math.max(0, Number(filters.offset || filters.cursor) || 0);
    if (this.isTestMemory()) return clone(this.state.demandRequests.filter((item) => (!filters.status || item.status === filters.status) && (!filters.priority || item.priority === filters.priority) && (!filters.emirate || item.emirate === filters.emirate) && (!filters.customerSegment || item.customerSegment === filters.customerSegment) && (!filters.sourceType || item.sourceType === filters.sourceType)).slice(offset, offset + limit));
    const values = [];
    const clauses = [];
    const add = (column, value) => { if (value) { values.push(value); clauses.push(`${column}=$${values.length}`); } };
    add('status', filters.status); add('priority', filters.priority); add('emirate', filters.emirate); add('customer_segment', filters.customerSegment); add('source_type', filters.sourceType);
    values.push(limit, offset);
    const result = await this.internalStore.pool.query(`select * from ${this.table('demand_requests')} ${clauses.length ? `where ${clauses.join(' and ')}` : ''} order by created_at desc limit $${values.length - 1} offset $${values.length}`, values);
    return result.rows.map(safeCamel);
  }

  async getDemand(id) {
    this.assertReady();
    if (this.isTestMemory()) {
      const request = this.state.demandRequests.find((item) => item.id === id);
      return request ? { request: clone(request), items: await this.getDemandItemsMemory(id) } : null;
    }
    const [request, items] = await Promise.all([
      this.internalStore.pool.query(`select * from ${this.table('demand_requests')} where id=$1`, [id]),
      this.internalStore.pool.query(`select * from ${this.table('demand_items')} where demand_request_id=$1 order by created_at`, [id]),
    ]);
    return request.rows[0] ? { request: safeCamel(request.rows[0]), items: items.rows.map(safeCamel) } : null;
  }

  async getDemandItemsMemory(id) { return clone(this.state.demandItems.filter((item) => item.demandRequestId === id)); }

  async metrics(staleAfterHours = 168) {
    this.assertReady();
    if (this.isTestMemory()) {
      const snapshots = this.state.offerSnapshots;
      const latestAt = snapshots.map((item) => item.observedAt).sort().at(-1) || null;
      const latestByItem = new Map();
      snapshots.forEach((item) => { if (!latestByItem.has(item.supplierCatalogItemId) || latestByItem.get(item.supplierCatalogItemId).observedAt < item.observedAt) latestByItem.set(item.supplierCatalogItemId, item); });
      const latest = [...latestByItem.values()];
      return {
        supplierCount: this.state.suppliers.length, catalogItemCount: this.state.catalogItems.length,
        offerSnapshotCount: snapshots.length, demandRequestCount: this.state.demandRequests.length,
        activeDemandItemCount: this.state.demandItems.filter((item) => item.active).length,
        latestSupplierObservation: latestAt,
        staleObservationCount: latest.filter((item) => Date.parse(item.observedAt) < Date.now() - staleAfterHours * 3600000).length,
        itemsMissingPrice: latest.filter((item) => item.unitPrice === null).length,
        itemsMissingStockInformation: latest.filter((item) => item.stockStatus === 'unknown').length,
        itemsMissingMoq: latest.filter((item) => item.minimumOrderQuantity === null).length,
        itemsMissingLeadTime: latest.filter((item) => item.leadTimeDays === null).length,
        itemsMissingShelfLife: latest.filter((item) => item.shelfLifeDays === null).length,
        sourceTypeCounts: this.countBy(snapshots, 'sourceType'),
        verificationStatusCounts: this.countBy(snapshots, 'verificationStatus'),
        demandRequestsNeedingInformation: this.state.demandRequests.filter((item) => item.status === 'needs_information').length,
        demandRequestsReadyForMatching: this.state.demandRequests.filter((item) => item.status === 'ready_for_matching').length,
      };
    }
    const result = await this.internalStore.pool.query(
      `with latest as (
         select distinct on (supplier_catalog_item_id) * from ${this.table('supplier_offer_snapshots')}
         order by supplier_catalog_item_id, observed_at desc, created_at desc
       ) select
         (select count(*)::int from ${this.table('supplier_profiles')}) supplier_count,
         (select count(*)::int from ${this.table('supplier_catalog_items')}) catalog_item_count,
         (select count(*)::int from ${this.table('supplier_offer_snapshots')}) offer_snapshot_count,
         (select count(*)::int from ${this.table('demand_requests')}) demand_request_count,
         (select count(*)::int from ${this.table('demand_items')} where active) active_demand_item_count,
         (select max(observed_at) from latest) latest_supplier_observation,
         (select count(*)::int from latest where observed_at < now()-make_interval(hours=>$1)) stale_observation_count,
         (select count(*)::int from latest where unit_price is null) items_missing_price,
         (select count(*)::int from latest where stock_status='unknown') items_missing_stock_information,
         (select count(*)::int from latest where minimum_order_quantity is null) items_missing_moq,
         (select count(*)::int from latest where lead_time_days is null) items_missing_lead_time,
         (select count(*)::int from latest where shelf_life_days is null) items_missing_shelf_life,
         (select coalesce(jsonb_object_agg(source_type,total),'{}'::jsonb) from (select source_type,count(*)::int total from ${this.table('supplier_offer_snapshots')} group by source_type) s) source_type_counts,
         (select coalesce(jsonb_object_agg(verification_status,total),'{}'::jsonb) from (select verification_status,count(*)::int total from ${this.table('supplier_offer_snapshots')} group by verification_status) v) verification_status_counts,
         (select count(*)::int from ${this.table('demand_requests')} where status='needs_information') demand_requests_needing_information,
         (select count(*)::int from ${this.table('demand_requests')} where status='ready_for_matching') demand_requests_ready_for_matching`,
      [Math.max(1, Number(staleAfterHours) || 168)],
    );
    return safeCamel(result.rows[0]);
  }

  countBy(items, key) { return items.reduce((counts, item) => ({ ...counts, [item[key]]: (counts[item[key]] || 0) + 1 }), {}); }
}

module.exports = { SupplyGraphStore, emptyState, jsonSafe, safeCamel };
