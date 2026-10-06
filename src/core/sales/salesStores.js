const { randomUUID } = require('crypto');
const { isUuid } = require('../identity/policy');
const { salesError } = require('./salesSchema');

const TABLES = Object.freeze(['sales_accounts', 'sales_contacts', 'sales_opportunities', 'sales_activities']);
const ORDERS = Object.freeze({ recent: 'updated_at desc', occurred: 'occurred_at desc', created: 'created_at asc' });
const FILTERS = Object.freeze(['account_id', 'is_primary']);
const MAX_ROWS = 2000;

const assertTable = (table) => {
  if (!TABLES.includes(table)) throw salesError('Unknown sales table.', 'SALES_TABLE_DENIED', 500);
  return table;
};
const assertWorkspace = (workspaceId) => {
  if (!isUuid(workspaceId)) throw salesError('Workspace context is required.', 'SALES_WORKSPACE_REQUIRED', 403);
};
const clampLimit = (limit) => Math.max(1, Math.min(Number(limit) || MAX_ROWS, MAX_ROWS));
const filtersOf = (where = {}) => Object.entries(where).filter(([column]) => {
  if (!FILTERS.includes(column)) throw salesError('Unknown sales filter.', 'SALES_FILTER_DENIED', 500);
  return true;
});

// Every operation runs inside transaction(workspaceId, ...). The workspace id
// comes from the server-resolved membership, is bound for row-level security
// and is repeated in every statement.
class PostgresSalesStore {
  constructor({ internalStore }) {
    if (!internalStore?.pool || typeof internalStore.withTransaction !== 'function') {
      throw salesError('Sales persistence is unavailable.', 'SALES_PERSISTENCE_UNAVAILABLE', 503);
    }
    this.internalStore = internalStore;
  }

  async transaction(workspaceId, callback) {
    assertWorkspace(workspaceId);
    const table = (name) => this.internalStore.table(assertTable(name));
    return this.internalStore.withTransaction(async (client) => {
      await client.query("select set_config('app.current_workspace_id', $1, true)", [workspaceId]);
      return callback({
        insert: async (name, columns) => {
          const keys = Object.keys(columns);
          const result = await client.query(
            `insert into ${table(name)} (workspace_id${keys.map((key) => `, ${key}`).join('')})
             values ($1${keys.map((_key, index) => `, $${index + 2}`).join('')}) returning *`,
            [workspaceId, ...keys.map((key) => columns[key])],
          );
          return result.rows[0];
        },
        update: async (name, id, columns) => {
          if (!isUuid(id)) return null;
          const keys = Object.keys(columns);
          const result = await client.query(
            `update ${table(name)} set ${keys.map((key, index) => `${key} = $${index + 3}`).join(', ')}, updated_at = now()
             where workspace_id = $1 and id = $2 returning *`,
            [workspaceId, id, ...keys.map((key) => columns[key])],
          );
          return result.rows[0] || null;
        },
        get: async (name, id) => {
          if (!isUuid(id)) return null;
          const result = await client.query(`select * from ${table(name)} where workspace_id = $1 and id = $2`, [workspaceId, id]);
          return result.rows[0] || null;
        },
        list: async (name, { where, order = 'recent', limit } = {}) => {
          const filters = filtersOf(where);
          const result = await client.query(
            `select * from ${table(name)} where workspace_id = $1${filters.map(([column], index) => ` and ${column} = $${index + 2}`).join('')}
             order by ${ORDERS[order] || ORDERS.recent} limit ${clampLimit(limit)}`,
            [workspaceId, ...filters.map(([, value]) => value)],
          );
          return result.rows;
        },
        audit: (event) => this.internalStore.appendAudit(client, event),
      });
    });
  }
}

class MemorySalesStore {
  constructor() { this.state = { rows: Object.fromEntries(TABLES.map((table) => [table, []])), auditEvents: [] }; }

  async transaction(workspaceId, callback) {
    assertWorkspace(workspaceId);
    const draft = structuredClone(this.state);
    const rows = (name) => draft.rows[assertTable(name)];
    const result = await callback({
      insert: async (name, columns) => {
        const now = new Date().toISOString();
        const row = { id: randomUUID(), workspace_id: workspaceId, ...columns, created_at: now, ...(name === 'sales_activities' ? {} : { updated_at: now }) };
        rows(name).push(row);
        return { ...row };
      },
      update: async (name, id, columns) => {
        const row = rows(name).find((item) => item.workspace_id === workspaceId && item.id === id);
        if (!row) return null;
        Object.assign(row, columns, { updated_at: new Date().toISOString() });
        return { ...row };
      },
      get: async (name, id) => {
        const row = rows(name).find((item) => item.workspace_id === workspaceId && item.id === id);
        return row ? { ...row } : null;
      },
      list: async (name, { where, order = 'recent', limit } = {}) => {
        const filters = filtersOf(where);
        const [column, direction] = (ORDERS[order] || ORDERS.recent).split(' ');
        return rows(name)
          .filter((item) => item.workspace_id === workspaceId && filters.every(([key, value]) => item[key] === value))
          .sort((left, right) => String(left[column]).localeCompare(String(right[column])) * (direction === 'desc' ? -1 : 1))
          .slice(0, clampLimit(limit))
          .map((item) => ({ ...item }));
      },
      audit: async (event) => { draft.auditEvents.push({ id: randomUUID(), ...event }); },
    });
    this.state = draft; // commit only when the callback did not throw
    return result;
  }
}

class UnavailableSalesStore {
  async transaction() { throw salesError('Sales persistence is unavailable.', 'SALES_PERSISTENCE_UNAVAILABLE', 503); }
}

module.exports = { MemorySalesStore, PostgresSalesStore, UnavailableSalesStore };
