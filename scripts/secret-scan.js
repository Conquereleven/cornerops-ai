// Scans tracked files for credential-shaped strings. Exits 1 on any finding.
// Usage: node scripts/secret-scan.js
const { execFileSync } = require('child_process');
const fs = require('fs');

const PATTERNS = [
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{16,}/],
  ['Supabase publishable key', /\bsb_publishable_[A-Za-z0-9_-]{24,}/],
  ['JWT (possible service-role or anon key)', /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}/],
  ['OpenAI / Anthropic key', /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{32,}/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}/],
  ['Telegram bot token', /\b\d{8,10}:AA[A-Za-z0-9_-]{32,}/],
  ['Railway token assignment', /RAILWAY_(?:API_)?TOKEN\s*[=:]\s*["']?[A-Za-z0-9-]{24,}/],
  ['database URL with password', /\bpostgres(?:ql)?:\/\/[^\s:@/"'`$<{]+:[^\s@/"'`$<{*]{6,}@(?!localhost|127\.0\.0\.1|db\.example|host\b)[^\s/"'`]+/],
];
const SKIP = /(^|\/)(node_modules|dist|coverage)\/|package-lock\.json$|\.(png|jpe?g|gif|ico|pdf|woff2?)$/i;
// A line may opt out when it is a detector or an obviously fake fixture.
const ALLOW = /secret-scan:allow/;

const scan = (files, read = (file) => fs.readFileSync(file, 'utf8')) => {
  const findings = [];
  for (const file of files) {
    if (SKIP.test(file)) continue;
    let content;
    try { content = read(file); } catch (_error) { continue; }
    content.split('\n').forEach((line, index) => {
      if (ALLOW.test(line)) return;
      for (const [label, pattern] of PATTERNS) {
        if (pattern.test(line)) findings.push({ file, line: index + 1, label });
      }
    });
  }
  return findings;
};

if (require.main === module) {
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean);
  const findings = scan(files);
  if (findings.length) {
    // Location and type only: the matched value is never printed.
    for (const finding of findings) console.error(`${finding.file}:${finding.line} ${finding.label}`);
    console.error(`\nSecret scan failed: ${findings.length} finding(s).`);
    process.exit(1);
  }
  console.log(`Secret scan passed for ${files.length} tracked files.`);
}

module.exports = { PATTERNS, scan };
