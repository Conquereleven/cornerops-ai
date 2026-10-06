const { ENTITIES, OPEN_STAGES, STAGES, salesError, toApi, validate } = require('./salesSchema');

const notFound = (what) => salesError(`${what} not found.`, 'SALES_NOT_FOUND', 404);
const isOpen = (opportunity) => OPEN_STAGES.includes(opportunity.stage);
const time = (value) => (value ? new Date(value).getTime() : null);

// Internal sales records for one workspace. Nothing in this service contacts a
// prospect: an activity is a note about something that already happened.
class SalesService {
  constructor({ store }) { this.store = store; }

  audit(ops, context, action, entityType, row, columns) {
    return ops.audit({
      eventType: `sales_${entityType}_${action}`,
      entityType: `sales_${entityType}`,
      entityId: row.id,
      actorType: 'user',
      actorId: context.userId,
      correlationId: context.correlationId || null,
      // Ids and field names only: contact details never enter the audit trail.
      metadata: {
        workspaceId: context.workspaceId,
        accountId: row.account_id || row.id,
        fields: Object.keys(columns).sort(),
        result: 'success',
        externalSendPerformed: false,
      },
    });
  }

  async summary(context) {
    return this.store.transaction(context.workspaceId, async (ops) => {
      const [accounts, opportunities] = await Promise.all([ops.list('sales_accounts'), ops.list('sales_opportunities')]);
      const names = new Map(accounts.map((account) => [account.id, account.name]));
      const open = opportunities.filter(isOpen);
      const now = Date.now();
      const brief = (opportunity) => ({
        opportunityId: opportunity.id, accountId: opportunity.account_id, accountName: names.get(opportunity.account_id) || null,
        stage: opportunity.stage, nextStep: opportunity.next_step, nextStepAt: opportunity.next_step_at,
      });
      const valued = open.filter((opportunity) => opportunity.estimated_value !== null && opportunity.estimated_value !== undefined);
      const byCurrency = new Map();
      for (const opportunity of valued) {
        const entry = byCurrency.get(opportunity.currency) || { currency: opportunity.currency, total: 0, opportunities: 0 };
        entry.total = Math.round((entry.total + Number(opportunity.estimated_value)) * 100) / 100;
        entry.opportunities += 1;
        byCurrency.set(opportunity.currency, entry);
      }
      return {
        accounts: { total: accounts.length },
        opportunities: {
          total: opportunities.length,
          open: open.length,
          byStage: Object.fromEntries(STAGES.map((stage) => [stage, opportunities.filter((item) => item.stage === stage).length])),
        },
        nextActionsDue: open.filter((item) => time(item.next_step_at) !== null && time(item.next_step_at) <= now)
          .sort((left, right) => time(left.next_step_at) - time(right.next_step_at)).slice(0, 20).map(brief),
        needingFollowUp: open.filter((item) => !item.next_step || !item.next_step_at).slice(0, 20).map(brief),
        // Only values someone entered. Opportunities without a value are counted, never estimated.
        pipelineValue: [...byCurrency.values()].sort((left, right) => left.currency.localeCompare(right.currency)),
        valueCoverage: { withValue: valued.length, withoutValue: open.length - valued.length },
      };
    });
  }

  async listAccounts(context) {
    return this.store.transaction(context.workspaceId, async (ops) => {
      const [accounts, contacts, opportunities, activities] = await Promise.all([
        ops.list('sales_accounts'),
        ops.list('sales_contacts', { where: { is_primary: true } }),
        ops.list('sales_opportunities'),
        ops.list('sales_activities', { order: 'occurred' }),
      ]);
      return accounts.map((account) => {
        const primary = contacts.find((contact) => contact.account_id === account.id);
        const latest = activities.find((activity) => activity.account_id === account.id);
        const next = opportunities.filter((item) => item.account_id === account.id && isOpen(item) && item.next_step)
          .sort((left, right) => (time(left.next_step_at) ?? Infinity) - (time(right.next_step_at) ?? Infinity))[0];
        return {
          ...toApi(account),
          primaryContact: primary ? { id: primary.id, name: primary.name, title: primary.title } : null,
          latestActivity: latest ? { type: latest.type, occurredAt: latest.occurred_at, outcome: latest.outcome } : null,
          nextStep: next ? { text: next.next_step, at: next.next_step_at, stage: next.stage } : null,
          openOpportunities: opportunities.filter((item) => item.account_id === account.id && isOpen(item)).length,
        };
      });
    });
  }

  async getAccount(context, accountId) {
    return this.store.transaction(context.workspaceId, async (ops) => {
      const account = await ops.get('sales_accounts', accountId);
      if (!account) throw notFound('Account');
      const where = { account_id: account.id };
      const [contacts, opportunities, activities] = await Promise.all([
        ops.list('sales_contacts', { where, order: 'created' }),
        ops.list('sales_opportunities', { where }),
        ops.list('sales_activities', { where, order: 'occurred', limit: 200 }),
      ]);
      return {
        account: toApi(account), contacts: contacts.map(toApi), opportunities: opportunities.map(toApi), activities: activities.map(toApi),
      };
    });
  }

  async createAccount(context, input) {
    const columns = validate('account', input);
    return this.store.transaction(context.workspaceId, async (ops) => {
      const row = await ops.insert('sales_accounts', { status: 'prospect', ...columns, created_by: context.userId, updated_by: context.userId });
      await this.audit(ops, context, 'created', 'account', row, columns);
      return toApi(row);
    });
  }

  async updateAccount(context, accountId, input) {
    const columns = validate('account', input, { partial: true });
    return this.store.transaction(context.workspaceId, async (ops) => {
      const row = await ops.update('sales_accounts', accountId, { ...columns, updated_by: context.userId });
      if (!row) throw notFound('Account');
      await this.audit(ops, context, 'updated', 'account', row, columns);
      return toApi(row);
    });
  }

  async clearPrimary(ops, context, accountId, exceptId) {
    const primaries = await ops.list('sales_contacts', { where: { account_id: accountId, is_primary: true } });
    for (const contact of primaries.filter((item) => item.id !== exceptId)) {
      await ops.update('sales_contacts', contact.id, { is_primary: false, updated_by: context.userId });
    }
  }

  async createContact(context, accountId, input) {
    const columns = validate('contact', input);
    return this.store.transaction(context.workspaceId, async (ops) => {
      const account = await ops.get('sales_accounts', accountId);
      if (!account) throw notFound('Account');
      if (columns.is_primary) await this.clearPrimary(ops, context, account.id, null);
      const row = await ops.insert('sales_contacts', { is_primary: false, ...columns, account_id: account.id, created_by: context.userId, updated_by: context.userId });
      await this.audit(ops, context, 'created', 'contact', row, columns);
      return toApi(row);
    });
  }

  async updateContact(context, contactId, input) {
    const columns = validate('contact', input, { partial: true });
    return this.store.transaction(context.workspaceId, async (ops) => {
      const existing = await ops.get('sales_contacts', contactId);
      if (!existing) throw notFound('Contact');
      if (columns.is_primary) await this.clearPrimary(ops, context, existing.account_id, existing.id);
      const row = await ops.update('sales_contacts', existing.id, { ...columns, updated_by: context.userId });
      await this.audit(ops, context, 'updated', 'contact', row, columns);
      return toApi(row);
    });
  }

  assertValue(next) {
    if (next.estimated_value !== null && next.estimated_value !== undefined && !next.currency) {
      throw salesError('Some fields are invalid.', 'SALES_VALIDATION_FAILED', 400, { currency: 'is required when an estimated value is set' });
    }
  }

  async createOpportunity(context, accountId, input) {
    const columns = validate('opportunity', input);
    this.assertValue(columns);
    return this.store.transaction(context.workspaceId, async (ops) => {
      const account = await ops.get('sales_accounts', accountId);
      if (!account) throw notFound('Account');
      const row = await ops.insert('sales_opportunities', { stage: 'new', ...columns, account_id: account.id, created_by: context.userId, updated_by: context.userId });
      await this.audit(ops, context, 'created', 'opportunity', row, columns);
      return toApi(row);
    });
  }

  async updateOpportunity(context, opportunityId, input) {
    const columns = validate('opportunity', input, { partial: true });
    return this.store.transaction(context.workspaceId, async (ops) => {
      const existing = await ops.get('sales_opportunities', opportunityId);
      if (!existing) throw notFound('Opportunity');
      this.assertValue({ ...existing, ...columns });
      const row = await ops.update('sales_opportunities', existing.id, { ...columns, updated_by: context.userId });
      await this.audit(ops, context, 'updated', 'opportunity', row, columns);
      return toApi(row);
    });
  }

  async createActivity(context, accountId, input) {
    const columns = validate('activity', input);
    return this.store.transaction(context.workspaceId, async (ops) => {
      const account = await ops.get('sales_accounts', accountId);
      if (!account) throw notFound('Account');
      for (const [column, table, label] of [['contact_id', 'sales_contacts', 'Contact'], ['opportunity_id', 'sales_opportunities', 'Opportunity']]) {
        if (!columns[column]) continue;
        const linked = await ops.get(table, columns[column]);
        if (!linked || linked.account_id !== account.id) throw notFound(label);
      }
      const row = await ops.insert('sales_activities', {
        direction: 'internal', ...columns, occurred_at: columns.occurred_at || new Date().toISOString(),
        account_id: account.id, created_by: context.userId,
      });
      await this.audit(ops, context, 'created', 'activity', row, columns);
      return toApi(row);
    });
  }
}

module.exports = { ENTITIES, SalesService };
