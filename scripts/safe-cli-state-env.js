const os = require('os');
const path = require('path');

const root = path.join(os.tmpdir(), 'cornerops-cli-state');

const setScriptValue = (key, value) => {
  process.env[key] = value;
};

setScriptValue('CORNEROPS_PERSISTENCE_ROOT', path.join(root, 'state'));
setScriptValue('CORNEROPS_PERSISTENCE_PROVIDER', 'memory');
setScriptValue('CORNEROPS_APPROVAL_STORE_PROVIDER', 'memory');
setScriptValue('CORNEROPS_AUDIT_STORE_PROVIDER', 'memory');
setScriptValue('CORNEROPS_SESSION_STORE_PROVIDER', 'memory');
setScriptValue('CORNEROPS_REPLAY_STORE_PROVIDER', 'memory');
setScriptValue('CORNEROPS_REJECTION_STORE_PROVIDER', 'memory');
setScriptValue('CORNEROPS_RATE_LIMIT_STORE_PROVIDER', 'memory');
setScriptValue('CORNEROPS_BACKUP_ROOT', path.join(root, 'backups'));
setScriptValue('CORNEROPS_REPLAY_STORE_PATH', path.join(root, 'security', 'replay-store.json'));
setScriptValue('CORNEROPS_REJECTION_STORE_PATH', path.join(root, 'security', 'rejections.json'));
setScriptValue('CORNEROPS_RATE_LIMIT_STORE_PATH', path.join(root, 'security', 'rate-limits.json'));
setScriptValue('CONTROL_TOWER_FRONTEND_TOKEN_PATH', path.join(root, 'local-secrets', 'control-tower-frontend-token.txt'));
setScriptValue('CLAWSAFE_ROOT', root);
setScriptValue('CLAWSAFE_ALLOW_OUTSIDE_ROOT', 'true');
setScriptValue('CORNEROPS_CONTEXT_LAYER_ENABLED', 'false');
setScriptValue('CORNEROPS_LOCAL_ARCHIVES_ENABLED', 'false');
setScriptValue('NATIVE_TOOLS_ENABLED', 'false');

module.exports = { root };
