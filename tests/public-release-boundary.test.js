const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const baseline = require('./fixtures/public-release-baseline.json');

// This release may change presentation and its evidence only. Every other
// tracked file must remain byte-identical to the verified production main.
function isPublicReleaseFile(path) {
  return /^(docs\/|design-qa\.md$|tests\/public-release-boundary\.test\.js$|tests\/fixtures\/public-release-baseline\.json$|frontend\/public\/|frontend\/index\.html$|frontend\/src\/((?:App\.test|PublicApp(?:\.test)?|main)\.tsx$|components\/public\/|config\/(siteConfig|publicContent)\.ts$|routes\/PublicLanding(\.test)?\.tsx$|styles\/cornertech\.css$))/.test(path);
}

test('public release leaves backend, migrations, auth, private UI, dependencies and deployment config unchanged', () => {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean).filter(path => !isPublicReleaseFile(path)).sort();
  const hash = createHash('sha256');
  for (const path of files) {
    hash.update(path + '\0');
    hash.update(readFileSync(path));
    hash.update('\0');
  }
  expect(files.length).toBe(baseline.fileCount);
  expect(hash.digest('hex')).toBe(baseline.sha256);
});

test('public presentation cannot import private workspace or authentication modules', () => {
  for (const file of ['frontend/src/routes/PublicLanding.tsx', 'frontend/src/components/public/CornerTechSite.tsx']) {
    const source = readFileSync(file, 'utf8');
    expect(source).not.toMatch(/from\s+['"][^'"]*(?:auth|Sales|AppShell|apiClient|supabase)/i);
    expect(source).not.toMatch(/\bfetch\s*\(/);
  }
  expect(readFileSync('frontend/src/config/siteConfig.ts', 'utf8')).toMatch(/signInEnabled: false/);
});
