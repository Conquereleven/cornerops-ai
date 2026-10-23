// @vitest-environment node
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Test-only parser: never imported by the public entry or build output.
const externals = new Set(['react', 'react-dom/client', 'react-router-dom', 'lucide-react', 'react/jsx-runtime']);
const permitted = /^(main\.tsx|PublicApp\.tsx|routes\/PublicLanding\.tsx|components\/public\/.*\.[jt]sx?|config\/(publicContent|siteConfig)\.ts)$/;
const forbiddenNetwork = new Set(['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon']);
type Load = (name: string) => string | undefined;

function audit(load: Load, entry = 'main.tsx') {
  const visited = new Set<string>();
  function visit(file: string) {
    if (visited.has(file)) return;
    if (!permitted.test(file)) throw new Error(`Private or unapproved public dependency: ${file}`);
    const text = load(file);
    if (text === undefined) throw new Error(`Unresolved dependency: ${file}`);
    visited.add(file);
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function dependency(spec: ts.Expression) {
      if (!ts.isStringLiteralLike(spec)) throw new Error('Nonliteral import cannot be proven public');
      const name = spec.text;
      if (name.endsWith('.css')) {
        // Only the existing bootstrap styles are allowed; no arbitrary style import escape.
        if (!['main.tsx:./styles/globals.css', 'routes/PublicLanding.tsx:../styles/cornertech.css'].includes(`${file}:${name}`)) {
          throw new Error(`Unapproved stylesheet: ${name}`);
        }
        return;
      }
      if (!name.startsWith('.')) {
        if (!externals.has(name)) throw new Error(`Unapproved external dependency: ${name}`);
        return;
      }
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), name));
      const candidates = /\.[jt]sx?$/.test(target) ? [target] :
        [target + '.ts', target + '.tsx', target + '.js', target + '.jsx', target + '/index.ts', target + '/index.tsx'];
      const resolved = candidates.find(candidate => load(candidate) !== undefined);
      if (!resolved) throw new Error(`Unresolved dependency: ${name}`);
      visit(resolved);
    }
    function walk(node: ts.Node) {
      if (ts.isIdentifier(node) && forbiddenNetwork.has(node.text)) {
        throw new Error(`Public network reference: ${node.text}`);
      }
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
        dependency(node.moduleSpecifier);
      }
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const expression = node.expression;
        const name = ts.isIdentifier(expression) ? expression.text :
          ts.isPropertyAccessExpression(expression) ? expression.name.text :
            ts.isElementAccessExpression(expression) && ts.isStringLiteralLike(expression.argumentExpression)
              ? expression.argumentExpression.text : '';
        if (forbiddenNetwork.has(name)) throw new Error(`Public network call: ${name}`);
        if (ts.isCallExpression(node) && (expression.kind === ts.SyntaxKind.ImportKeyword || name === 'require')) {
          if (node.arguments.length !== 1) throw new Error('Unbounded dynamic dependency');
          dependency(node.arguments[0]);
        }
      }
      ts.forEachChild(node, walk);
    }
    walk(source);
  }
  visit(entry);
  return [...visited].sort();
}

const synthetic = (files: Record<string, string>) => (name: string) => files[name];
describe('V2-200 transitive public import entry gate', () => {
  it('traverses the actual public entry without private runtime or network modules', () => {
    const src = path.resolve(process.cwd(), 'src');
    const graph = audit(name => {
      const file = path.join(src, name);
      return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
    });
    expect(graph).toContain('components/public/CornerTechSite.tsx');
    expect(graph).toContain('config/siteConfig.ts');
  });
  it('follows reexports, literal dynamic imports and cycles', () => {
    expect(audit(synthetic({
      'main.tsx': "export * from './components/public/A';",
      'components/public/A.tsx': "import('./B');",
      'components/public/B.tsx': "export * from './A';",
    }))).toHaveLength(3);
  });
  it.each(['auth/session', 'services/apiClient', 'App', 'components/Sales'])('rejects transitive private dependency %s', target => {
    expect(() => audit(synthetic({
      'main.tsx': "export * from './components/public/Bridge';",
      'components/public/Bridge.tsx': `export * from '../../${target}';`,
      [target + '.tsx']: 'export const privateData = 1;',
    }))).toThrow(/Private or unapproved/);
  });
  it.each(['@supabase/supabase-js', 'axios', 'https://example.invalid/module.js'])('rejects external network/auth module %s', module => {
    expect(() => audit(synthetic({ 'main.tsx': `import '${module}';` }))).toThrow(/Unapproved external/);
  });
  it.each(['fetch("/api/private")', 'window.fetch("/api/private")', 'new XMLHttpRequest()',
    'new WebSocket("wss://example.invalid")', 'navigator.sendBeacon("/collect")', 'window["fetch"]("/api/private")', 'const send = fetch; send("/api/private")'])
  ('rejects network action %s', statement => {
    expect(() => audit(synthetic({ 'main.tsx': statement }))).toThrow(/Public network (call|reference)/);
  });
  it('rejects arbitrary stylesheet import escapes', () => {
    expect(() => audit(synthetic({ 'main.tsx': "import './private.css';" }))).toThrow(/Unapproved stylesheet/);
  });
  it('rejects computed import targets instead of silently skipping them', () => {
    expect(() => audit(synthetic({ 'main.tsx': 'import(target);' }))).toThrow(/Nonliteral/);
  });
});
