const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';

const baseUrl = (process.env.CONTROL_TOWER_FRONTEND_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const token = process.env.CONTROL_TOWER_FRONTEND_OPERATOR_TOKEN || '';
const origin = process.env.CONTROL_TOWER_FRONTEND_TEST_ORIGIN || 'http://localhost:3000';
const disallowedOrigin = process.env.CONTROL_TOWER_FRONTEND_DISALLOWED_TEST_ORIGIN || 'https://evil.example';

const safeFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_error) { json = null; }
    return { ok: true, status: response.status, headers: response.headers, json, text };
  } catch (error) {
    return { ok: false, error };
  } finally {
    clearTimeout(timeout);
  }
};

const hasNoSecrets = (payload) => !/(ghp_|github_pat_|sk-[A-Za-z0-9_-]{20,}|[0-9]{6,}:[A-Za-z0-9_-]{20,}|service_role_[A-Za-z0-9_-]{20,})/i
  .test(JSON.stringify(payload || {}));

async function run() {
  const endpoint = `${baseUrl}/api/control-tower/frontend/v1/connection-test`;
  const health = await safeFetch(`${baseUrl}/api/health`);
  if (!health.ok) {
    process.stdout.write(`Control Tower backend is not reachable at ${baseUrl}.\n`);
    process.stdout.write('Start it with: npm run dev or npm start\n');
    return { status: 'server_missing', baseUrl };
  }

  const missing = await safeFetch(endpoint, { headers: { Origin: origin } });
  const invalid = await safeFetch(endpoint, {
    headers: { Origin: origin, Authorization: 'Bearer invalid-control-tower-token' },
  });
  const preflight = await safeFetch(endpoint, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization',
    },
  });
  const disallowed = await safeFetch(endpoint, { headers: { Origin: disallowedOrigin } });

  let valid = { status: 'skipped', reason: 'CONTROL_TOWER_FRONTEND_OPERATOR_TOKEN is not set.' };
  if (token) {
    valid = await safeFetch(endpoint, {
      headers: { Origin: origin, Authorization: `Bearer ${token}` },
    });
  }

  const summary = {
    status: 'completed',
    baseUrl,
    checks: {
      missingTokenStatus: missing.status,
      invalidTokenStatus: invalid.status,
      validTokenStatus: valid.status,
      preflightStatus: preflight.status,
      disallowedOriginStatus: disallowed.status,
      validPayloadHasAuditId: Boolean(valid.json?.auditId),
      validPayloadWritesBlocked: valid.json?.writesBlocked === true || valid.json?.data?.writesBlocked === true,
      validPayloadExternalSendsBlocked: valid.json?.externalSendsBlocked === true || valid.json?.data?.externalSendsBlocked === true,
      noSecretsExposed: hasNoSecrets([missing.json, invalid.json, valid.json]),
    },
    notes: [
      'Raw operator tokens are never printed by this check.',
      token ? 'Valid-token check executed.' : 'Valid-token check skipped because no local token was provided.',
    ],
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(`Control Tower frontend API check failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { run };
