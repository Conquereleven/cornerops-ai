// Grants or updates a workspace membership for a verified auth user id.
//
//   npm run workspace:grant -- --workspace cornerops-ai --user-id <uuid> \
//     --role founder --environment staging --confirm
//
// Intentional operator action: it needs an administrative database URL that the
// web runtime never has, the environment must be named twice (flag + variable),
// and nothing is written without --confirm.
const fs = require('fs');
const { Pool } = require('pg');
const { PostgresWorkspaceStore, assertGrant } = require('../src/core/identity/workspaceStores');

const SCHEMA = 'cornerops_internal';
const ENVIRONMENTS = ['local', 'staging', 'production'];

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    if (key === '--confirm') args.confirm = true;
    else { args[key.slice(2)] = argv[index + 1]; index += 1; }
  }
  return args;
};

const defaultPoolFactory = (connectionString, caPath) => {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
  const ca = caPath ? fs.readFileSync(caPath, 'utf8') : undefined;
  return new Pool({ connectionString, max: 1, ssl: local ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) } });
};

const run = async (argv, { env = process.env, poolFactory = defaultPoolFactory, log = console.log } = {}) => {
  const args = parseArgs(argv);
  const grant = { workspaceSlug: args.workspace, authUserId: args['user-id'], role: args.role, status: args.status || 'active' };
  assertGrant(grant);
  if (!ENVIRONMENTS.includes(args.environment)) throw new Error(`--environment must be one of: ${ENVIRONMENTS.join(', ')}`);
  if (env.CORNEROPS_WORKSPACE_ADMIN_ENVIRONMENT !== args.environment) {
    throw new Error('--environment does not match CORNEROPS_WORKSPACE_ADMIN_ENVIRONMENT. Refusing to continue.');
  }
  const connectionString = env.CORNEROPS_WORKSPACE_ADMIN_DATABASE_URL;
  if (!connectionString) throw new Error('CORNEROPS_WORKSPACE_ADMIN_DATABASE_URL is not set.');
  const summary = { environment: args.environment, workspace: grant.workspaceSlug, userId: grant.authUserId, role: grant.role, status: grant.status };
  if (!args.confirm) {
    log(JSON.stringify({ dryRun: true, wouldGrant: summary, note: 'Re-run with --confirm to apply.' }));
    return { dryRun: true, ...summary };
  }
  const pool = poolFactory(connectionString, env.CORNEROPS_INTERNAL_DATABASE_CA_PATH);
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await PostgresWorkspaceStore.grantMembership(client, SCHEMA, grant, { actorId: env.CORNEROPS_OPERATOR_ID || 'operator-cli' });
    await client.query('commit');
    log(JSON.stringify({ granted: true, ...summary, membershipId: result.membershipId }));
    return { granted: true, ...summary, membershipId: result.membershipId };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  run(process.argv.slice(2)).catch((error) => {
    // Message only: never print connection strings or driver detail.
    console.error(`workspace:grant failed: ${error.code || 'ERROR'} ${error.message}`);
    process.exit(1);
  });
}

module.exports = { parseArgs, run };
