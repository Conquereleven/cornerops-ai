// Inspect the actual Express stacks; fail if a new mount cannot be identified.
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
const app = require('../src/app');
const mounts = [...source.matchAll(/app\.use\('(\/api[^']*)', (\w+Routes)\)/g)].map(([, prefix, name]) => {
  const match = source.match(new RegExp(`const ${name} = require\\('([^']+)'\\)`));
  const file = path.resolve(__dirname, '../src', match[1]);
  return { prefix, file, router: require(file) };
});
const baseline = (p) => {
  if (/^\/api\/intelligence(?:\/|$)|^\/api\/control-tower\/frontend\/v1(?:\/|$)/.test(p)) return 'Frontend enable/safety flags; optional operator hash auth; CORS/rate limit/sanitizer; POST/PATCH additionally founder auth';
  if (/^\/api\/actions(?:\/|$)|^\/api\/operator\/v0.8(?:\/|$)|^\/api\/control-tower\/v(?:0.8|0.9|1.0|1.1)(?:\/|$)/.test(p)) return 'Web-console feature/local-only/origin/safety flags; optional console token; control-tower conditional internalAuth';
  if (p.startsWith('/api/operator-channel/')) return 'Telegram feature flags; constant-time configured webhook secret; actor policy';
  if (/^\/api\/(internal|openclaw|operator)(?:\/|$)/.test(p)) return 'internalAuth (test bypass; ALLOW_INTERNAL_NO_KEY bypass); operator feature flag';
  if (p.startsWith('/api/control-tower/')) return 'Conditional internalAuth only';
  if (p === '/api/github/webhook') return 'GitHub HMAC on reserialized JSON, missing secret denied';
  if (p === '/api/webhooks/whatsapp') return 'GET optional verify token (unconfigured placeholder); POST no identity guard';
  return p.includes('/health') && !p.startsWith('/api/context') ? 'See route handlers; public only /health and /api/health' : 'No route-wide identity guard';
};
const policy = (p, method) => {
  if (p === '/health' && method === 'OPTIONS') return ['PUBLIC','Non-API CORS preflight; no health handler', '204'];
  if (['/health', '/api/health'].includes(p) && ['GET', 'HEAD'].includes(method)) return ['PUBLIC','public health', '200'];
  if (p === '/api/webhooks/whatsapp' || p === '/api/github/webhook' || p === '/api/operator-channel/telegram/webhook') return ['PROVIDER_CALLBACK','Configured provider verification; invalid 401/403; missing config 503; disabled Telegram 404', '401/403/404/503; unsupported methods 405'];
  if (/^\/api\/intelligence(?:\/|$)|^\/api\/control-tower\/frontend\/v1(?:\/|$)/.test(p)) return ['INTERNAL','Mandatory existing operator hash auth + safety flags; existing founder auth on mutations; origin-checked OPTIONS only (no handler)', '401/403/503; OPTIONS 204/403'];
  if (/^\/api\/actions(?:\/|$)|^\/api\/operator\/v0.8(?:\/|$)|^\/api\/control-tower\/v(?:0.8|0.9|1.0|1.1)(?:\/|$)/.test(p)) return ['PRIVATE_DISABLED','Mandatory console token and existing feature/local/safety flags', '404/401/403/503'];
  return ['INTERNAL','Mandatory INTERNAL_API_KEY; missing configuration 503; no test/no-key bypass', '401/503'];
};
const rows=[];
for (const layer of app._router.stack) {
  const mount=mounts.find(m=>m.router===layer.handle);
  if (layer.handle.stack && !mount) throw new Error('Unclassified router mount');
  const layers=mount ? layer.handle.stack : [layer];
  for (const child of layers) {
    if (!child.route) {
      if (child.handle?.stack) throw new Error('Nested router requires explicit inventory support');
      continue;
    }
    let p=(mount?.prefix||'')+(child.route.path==='/' ? '' : child.route.path);
    if (p==='*') continue;
    const methods=Object.keys(child.route.methods).map(m=>m.toUpperCase());
    if(methods.includes('GET')&&!methods.includes('HEAD')) methods.push('HEAD');
    methods.push('OPTIONS');
    for(const method of methods) {
      const [category,guard,anonymousStatus]=policy(p,method);
      rows.push({path:p,method,category,baselineGuard:baseline(p),guard,anonymousStatus,source:mount?path.relative(path.join(__dirname,'..'),mount.file)+'.js':'src/app.js',handlers:child.route.stack.map(s=>s.handle.name||'anonymous')});
    }
  }
}
const inventory={schemaVersion:1,baseSha:'f74b5dcfe920ac5849b352745ebdc5f83ae37bc2',mounts:mounts.map(m=>({prefix:m.prefix,source:path.relative(path.join(__dirname,'..'),m.file)+'.js',routerUseDeclarations:fs.readFileSync(m.file+'.js','utf8').match(/(?:if[^\n]+ )?router\.use\([\s\S]*?\);/g)||[]})),routes:rows.filter((row,index)=>rows.findIndex(r=>r.path===row.path&&r.method===row.method)===index),fallthrough:[{path:'/*',methods:'OPTIONS',category:'PUBLIC',guard:'Non-API generic CORS preflight returns 204 without a route handler; literal /api requests first pass the API boundary, including the origin-checked bridge exception'},{path:'/api/*',methods:'ALL',category:'INTERNAL',guard:'Default internal key boundary before CORS and fallback; authenticated unknown paths 404'}, {path:'/*',methods:'GET,HEAD',category:'PUBLIC',guard:'Static files and SPA only when enabled and built; no API handlers; otherwise 404'}],routing:'Express case-insensitive, optional trailing slash; GET implies HEAD. OPTIONS on private routes passes authentication before generic CORS; bridge preflight is origin checked and never invokes business handlers. Unsupported callback verbs denied. Encoded literal paths do not match Express API mounts; API-looking decoded paths return 404 before static serving. JSON parser rejects malformed/oversize/compressed payloads with 400/413/415 before handlers. Provider unsupported methods return 405.'};
if(require.main===module) process.stdout.write(JSON.stringify(inventory,null,2)+'\n');
module.exports=inventory;
