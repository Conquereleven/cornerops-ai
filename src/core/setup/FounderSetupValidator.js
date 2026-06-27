const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { FileJsonStore } = require('../persistence/FileJsonStore');
const { createCheck, SETUP_STATUS, worstStatus } = require('./setupTypes');

const bool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const commandAvailable = (command, args = ['--version']) => {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe' });
  return result.status === 0;
};

const safeRelative = (root, target) => path.relative(root, target).replace(/\\/g, '/');

class FounderSetupValidator {
  constructor({ config = {}, cwd = process.cwd(), env = process.env, now = () => new Date() } = {}) {
    this.config = config;
    this.cwd = cwd;
    this.env = env;
    this.now = now;
  }

  run() {
    const checks = [
      this.checkNode(),
      this.checkNpm(),
      this.checkDependencies('backend dependencies', 'node_modules/jest', 'npm install'),
      this.checkDependencies('frontend dependencies', 'frontend/node_modules/vite', 'npm --prefix frontend install'),
      this.checkEnvFile(),
      this.checkWebConsoleAuth(),
      this.checkBindHost(),
      this.checkBoolean('web console local-only', 'corneropsWebConsoleLocalOnly', true, 'Set CORNEROPS_WEB_CONSOLE_LOCAL_ONLY=true.'),
      this.checkBoolean('web console read-only', 'corneropsWebConsoleReadOnly', true, 'Set CORNEROPS_WEB_CONSOLE_READ_ONLY=true.'),
      this.checkBoolean('web console dry-run', 'corneropsWebConsoleDryRun', true, 'Set CORNEROPS_WEB_CONSOLE_DRY_RUN=true.'),
      this.checkBoolean('operator read-only', 'corneropsOperatorReadOnly', true, 'Set CORNEROPS_OPERATOR_READ_ONLY=true.'),
      this.checkBoolean('operator dry-run', 'corneropsOperatorDryRun', true, 'Set CORNEROPS_OPERATOR_DRY_RUN=true.'),
      this.checkBoolean('writes blocked', 'corneropsRequireApprovalForWrites', true, 'Set CORNEROPS_REQUIRE_APPROVAL_FOR_WRITES=true.'),
      this.checkExternalSends(),
      this.checkOpenClaw(),
      this.checkTelegram(),
      this.checkGitHubIssueCreation(),
      ...this.checkStores(),
    ];
    const status = worstStatus(checks);
    return {
      version: 'v1.0',
      generatedAt: this.now().toISOString(),
      status,
      ok: status !== SETUP_STATUS.BLOCKED,
      counts: {
        ok: checks.filter((check) => check.status === SETUP_STATUS.OK).length,
        warning: checks.filter((check) => check.status === SETUP_STATUS.WARNING).length,
        blocked: checks.filter((check) => check.status === SETUP_STATUS.BLOCKED).length,
      },
      checks,
      secretsPrinted: false,
    };
  }

  checkNode() {
    const major = Number.parseInt(process.versions.node.split('.')[0], 10);
    return createCheck({
      id: 'node',
      label: 'Node.js runtime',
      status: major >= 18 ? SETUP_STATUS.OK : SETUP_STATUS.BLOCKED,
      message: `Node ${process.versions.node} detected.`,
      fix: major >= 18 ? undefined : 'Install Node.js 18 or newer.',
    });
  }

  checkNpm() {
    const available = commandAvailable('npm');
    return createCheck({
      id: 'npm',
      label: 'npm command',
      status: available ? SETUP_STATUS.OK : SETUP_STATUS.WARNING,
      message: available ? 'npm is available on PATH.' : 'npm is not available on PATH in this shell.',
      fix: available ? undefined : 'Use the bundled runtime in Codex or install/activate npm locally.',
    });
  }

  checkDependencies(label, relativePath, fix) {
    const exists = fs.existsSync(path.join(this.cwd, relativePath));
    return createCheck({
      id: relativePath.replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
      label,
      status: exists ? SETUP_STATUS.OK : SETUP_STATUS.BLOCKED,
      message: exists ? `${relativePath} is present.` : `${relativePath} is missing.`,
      fix: exists ? undefined : fix,
    });
  }

  checkEnvFile() {
    const envPath = path.join(this.cwd, '.env');
    const examplePath = path.join(this.cwd, '.env.example');
    const founderExamplePath = path.join(this.cwd, '.env.founder.local.example');
    if (fs.existsSync(envPath)) {
      return createCheck({
        id: 'env-file',
        label: 'Local environment file',
        status: SETUP_STATUS.OK,
        message: '.env exists. Secrets were not inspected or printed.',
      });
    }
    const hasTemplate = fs.existsSync(founderExamplePath) || fs.existsSync(examplePath);
    return createCheck({
      id: 'env-file',
      label: 'Local environment file',
      status: hasTemplate ? SETUP_STATUS.WARNING : SETUP_STATUS.BLOCKED,
      message: hasTemplate ? '.env is missing; a safe template is available.' : '.env and templates are missing.',
      fix: hasTemplate ? 'Run cp .env.founder.local.example .env and set a private local token.' : 'Restore .env.example before setup.',
    });
  }

  checkWebConsoleAuth() {
    const enabled = this.config.corneropsWebConsoleEnabled === true;
    const required = this.config.corneropsWebConsoleRequireAuth !== false;
    const configured = Boolean(this.config.corneropsWebConsoleAuthToken);
    return createCheck({
      id: 'web-console-auth',
      label: 'Web console auth token',
      status: !enabled || !required || configured ? SETUP_STATUS.OK : SETUP_STATUS.BLOCKED,
      message: enabled && required
        ? (configured ? 'Web console auth is configured.' : 'Web console auth is required but no token is configured.')
        : 'Web console auth is not required by current config.',
      fix: configured ? undefined : 'Set CORNEROPS_WEB_CONSOLE_AUTH_TOKEN to a long private local token.',
    });
  }

  checkBindHost() {
    const safe = this.config.bindHost === '127.0.0.1';
    return createCheck({
      id: 'bind-host',
      label: 'Local bind host',
      status: safe ? SETUP_STATUS.OK : SETUP_STATUS.BLOCKED,
      message: `Bind host is ${this.config.bindHost || 'unset'}.`,
      fix: safe ? undefined : 'Set CORNEROPS_BIND_HOST=127.0.0.1.',
    });
  }

  checkBoolean(label, key, expected, fix) {
    const value = this.config[key];
    return createCheck({
      id: key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`),
      label,
      status: value === expected ? SETUP_STATUS.OK : SETUP_STATUS.BLOCKED,
      message: `${label} is ${value === true ? 'enabled' : value === false ? 'disabled' : 'unset'}.`,
      fix: value === expected ? undefined : fix,
    });
  }

  checkExternalSends() {
    const unsafe = Boolean(
      this.config.whatsappAccessToken
      || this.config.slackOperatorEnabled
      || (this.config.corneropsTelegramRealMode && !this.config.corneropsTelegramDryRun)
      || (this.config.corneropsRealOperatorChannelEnabled && !this.config.corneropsOperatorChannelDryRun)
    );
    return createCheck({
      id: 'external-sends',
      label: 'External sends',
      status: unsafe ? SETUP_STATUS.BLOCKED : SETUP_STATUS.OK,
      message: unsafe ? 'One or more external-send paths appear enabled.' : 'External sends are blocked or dry-run.',
      fix: unsafe ? 'Disable WhatsApp/Slack real sends and keep Telegram/operator replies in dry-run.' : undefined,
    });
  }

  checkOpenClaw() {
    const safe = !this.config.openclawEnabled || this.config.openclawDryRun !== false;
    return createCheck({
      id: 'openclaw-safe-mode',
      label: 'OpenClaw gateway',
      status: safe ? SETUP_STATUS.OK : SETUP_STATUS.BLOCKED,
      message: this.config.openclawEnabled ? 'OpenClaw is enabled; dry-run safety was checked.' : 'OpenClaw is disabled.',
      fix: safe ? undefined : 'Set OPENCLAW_ENABLED=false or OPENCLAW_DRY_RUN=true.',
    });
  }

  checkTelegram() {
    const safe = !this.config.corneropsTelegramRealMode || this.config.corneropsTelegramDryRun || this.config.telegramOperatorDryRun;
    return createCheck({
      id: 'telegram-real-mode',
      label: 'Telegram real mode',
      status: safe ? SETUP_STATUS.OK : SETUP_STATUS.BLOCKED,
      message: safe ? 'Telegram real mode is disabled or dry-run.' : 'Telegram real mode can send non-dry-run replies.',
      fix: safe ? undefined : 'Set CORNEROPS_TELEGRAM_REAL_MODE=false and TELEGRAM_OPERATOR_DRY_RUN=true.',
    });
  }

  checkGitHubIssueCreation() {
    const realEnabled = Boolean(
      this.config.githubEnabled
      && !this.config.githubReadOnly
      && !this.config.githubDryRun
      && this.config.githubAllowIssueCreation
      && this.config.corneropsActionGithubIssueCreateEnabled
      && !this.config.corneropsActionGithubIssueCreateDryRun
    );
    return createCheck({
      id: 'github-issue-real-creation',
      label: 'GitHub real issue creation',
      status: realEnabled ? SETUP_STATUS.WARNING : SETUP_STATUS.OK,
      message: realEnabled ? 'Real GitHub issue creation is enabled.' : 'Real GitHub issue creation is disabled by default.',
      fix: realEnabled ? 'Use only for a supervised pilot with approvals and an Issues-only token.' : undefined,
    });
  }

  checkStores() {
    const root = path.resolve(this.cwd, this.config.corneropsPersistenceRoot || './.cornerops/state');
    const stores = [
      ['persistence-root', 'Persistence root', root, null],
      ['audit-store', 'Audit store', root, 'audit-log.json'],
      ['approval-store', 'Approval store', root, 'human-approvals.json'],
      ['session-store', 'Session store', root, 'operator-sessions.json'],
      ['idempotency-store', 'Idempotency store', root, 'controlled-action-idempotency.json'],
    ];
    return stores.map(([id, label, storeRoot, file]) => {
      try {
        fs.mkdirSync(storeRoot, { recursive: true, mode: 0o700 });
        if (file) {
          const store = new FileJsonStore({
            filePath: file,
            root: storeRoot,
            critical: true,
            initialData: { version: 1, records: [] },
          });
          const health = store.health();
          if (!health.healthy) throw new Error(health.errorCode);
        } else {
          fs.accessSync(storeRoot, fs.constants.W_OK);
        }
        return createCheck({
          id,
          label,
          status: SETUP_STATUS.OK,
          message: `${label} is writable at ${safeRelative(this.cwd, file ? path.join(storeRoot, file) : storeRoot)}.`,
        });
      } catch (error) {
        return createCheck({
          id,
          label,
          status: SETUP_STATUS.BLOCKED,
          message: `${label} is not writable or healthy.`,
          fix: `Check permissions for ${safeRelative(this.cwd, storeRoot)}.`,
        });
      }
    });
  }
}

module.exports = { FounderSetupValidator, bool };
