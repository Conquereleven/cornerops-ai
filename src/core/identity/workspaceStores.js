const { randomUUID } = require('crypto');
const { MEMBERSHIP_STATUSES, ROLES, identityError, isSlug, isUuid } = require('./policy');

const assertGrant = ({ workspaceSlug, authUserId, role, status = 'active' }) => {
  if (!isSlug(workspaceSlug)) throw identityError('Workspace slug is invalid.', 'WORKSPACE_SLUG_INVALID', 400);
  if (!isUuid(authUserId)) throw identityError('User id must be a UUID.', 'WORKSPACE_USER_ID_INVALID', 400);
  if (!ROLES.includes(role)) throw identityError('Role is not allowed.', 'WORKSPACE_ROLE_INVALID', 400);
  if (!MEMBERSHIP_STATUSES.includes(status)) throw identityError('Status is not allowed.', 'WORKSPACE_STATUS_INVALID', 400);
};

const mapMembership = (row) => ({ id: row.workspace_id, slug: row.slug, name: row.name, role: row.role });

class UnavailableWorkspaceStore {
  async listActiveMemberships() {
    throw identityError('Workspace authorization is unavailable.', 'WORKSPACE_LOOKUP_UNAVAILABLE', 503);
  }
}

// Reads through the runtime connection, which holds SELECT only on these tables.
class PostgresWorkspaceStore {
  constructor({ internalStore }) {
    if (!internalStore?.pool) throw identityError('Workspace authorization is unavailable.', 'WORKSPACE_LOOKUP_UNAVAILABLE', 503);
    this.internalStore = internalStore;
  }

  async listActiveMemberships(authUserId) {
    if (!isUuid(authUserId)) return [];
    try {
      const result = await this.internalStore.pool.query(
        `select m.workspace_id, w.slug, w.name, m.role
           from ${this.internalStore.table('workspace_memberships')} m
           join ${this.internalStore.table('workspaces')} w on w.id = m.workspace_id
          where m.auth_user_id = $1 and m.status = 'active' and w.status = 'active'
          order by w.slug`,
        [authUserId],
      );
      return result.rows.map(mapMembership);
    } catch (error) {
      // Log only non-sensitive classification fields for staging diagnostics.
      // Never log the connection string, error message, SQL or user identity.
      if (process.env.CORNERTECH_STAGING_DB_DIAGNOSTICS === 'true') {
        console.error('cornertech_workspace_db_query_failed', {
          code: typeof error?.code === 'string' ? error.code : 'UNKNOWN',
          name: typeof error?.name === 'string' ? error.name : 'Error',
          causeCode: typeof error?.cause?.code === 'string' ? error.cause.code : undefined,
        });
      }
      throw identityError('Workspace authorization is unavailable.', 'WORKSPACE_LOOKUP_UNAVAILABLE', 503);
    }
  }

  // Administrative write. Callers pass a client from an administrative connection.
  static async grantMembership(client, schema, grant, { actorId = 'operator-cli' } = {}) {
    assertGrant(grant);
    const { workspaceSlug, authUserId, role, status = 'active' } = grant;
    const workspace = await client.query(`select id from ${schema}.workspaces where slug = $1`, [workspaceSlug]);
    if (!workspace.rows[0]) throw identityError('Workspace does not exist.', 'WORKSPACE_NOT_FOUND', 404);
    const workspaceId = workspace.rows[0].id;
    const result = await client.query(
      `insert into ${schema}.workspace_memberships (workspace_id, auth_user_id, role, status)
       values ($1, $2, $3, $4)
       on conflict (workspace_id, auth_user_id)
       do update set role = excluded.role, status = excluded.status, updated_at = now()
       returning id, role, status`,
      [workspaceId, authUserId, role, status],
    );
    await client.query(
      `insert into ${schema}.audit_events (event_type, entity_type, entity_id, actor_type, actor_id, metadata)
       values ('workspace_membership_granted', 'workspace_membership', $1, 'operator', $2, $3::jsonb)`,
      [result.rows[0].id, actorId, JSON.stringify({ workspaceId, authUserId, role, status })],
    );
    return { membershipId: result.rows[0].id, workspaceId, role, status };
  }
}

class MemoryWorkspaceStore {
  constructor({ workspaces = [{ slug: 'cornerops-ai', name: 'CornerOps AI' }] } = {}) {
    this.workspaces = workspaces.map((workspace) => ({ id: randomUUID(), status: 'active', ...workspace }));
    this.memberships = [];
  }

  workspace(slug) { return this.workspaces.find((item) => item.slug === slug); }

  grant(grant) {
    assertGrant(grant);
    const workspace = this.workspace(grant.workspaceSlug);
    if (!workspace) throw identityError('Workspace does not exist.', 'WORKSPACE_NOT_FOUND', 404);
    this.memberships = this.memberships
      .filter((item) => !(item.workspaceId === workspace.id && item.authUserId === grant.authUserId));
    this.memberships.push({ workspaceId: workspace.id, authUserId: grant.authUserId, role: grant.role, status: grant.status || 'active' });
    return workspace;
  }

  async listActiveMemberships(authUserId) {
    return this.memberships
      .filter((item) => item.authUserId === authUserId && item.status === 'active')
      .map((item) => ({ membership: item, workspace: this.workspaces.find((workspace) => workspace.id === item.workspaceId) }))
      .filter(({ workspace }) => workspace?.status === 'active')
      .map(({ membership, workspace }) => ({ id: workspace.id, slug: workspace.slug, name: workspace.name, role: membership.role }))
      .sort((left, right) => left.slug.localeCompare(right.slug));
  }
}

module.exports = { MemoryWorkspaceStore, PostgresWorkspaceStore, UnavailableWorkspaceStore, assertGrant };
