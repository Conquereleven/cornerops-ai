// @vitest-environment node
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Test-only parser: never imported by the public entry or build output.
const externals = new Set(['react', 'react-dom/client', 'react-router-dom', 'lucide-react', 'react/jsx-runtime']);
const permitted = /^(main\.tsx|PublicApp\.tsx|routes\/PublicLanding\.tsx|components\/public\/.*\.[jt]sx?|config\/(publicContent|siteConfig)\.ts)$/;
const forbiddenNetwork = new Set(['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon', 'Worker', 'SharedWorker', 'serviceWorker', 'RTCPeerConnection', 'Image', 'importScripts', 'eval', 'Function']);
type Load = (name: string) => string | undefined;
const srcRoot = fileURLToPath(new URL('../../', import.meta.url));
const frontendRoot = path.resolve(srcRoot, '..');
const remote = (value: string) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value.trim()) && !value.startsWith('data:image/');
function auditCss(text: string) {
  if (/@import\b/i.test(text)) throw new Error('CSS imports require review');
  for (const match of text.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)) {
    if (remote(match[1]) || match[1].includes('\\')) throw new Error('Remote or escaped CSS URL');
  }
}
function auditMarkup(text: string, entry = false) {
  if (/<!DOCTYPE[^>]+(?:SYSTEM|PUBLIC)|<!ENTITY/i.test(text)) throw new Error('External XML entity');
  for (const match of text.matchAll(/<([a-z][\w:-]*)\b([^<>]*)>/gi)) {
    const tag = match[1].toLowerCase(), attrs = match[2];
    if (['iframe', 'form', 'object', 'embed', 'base'].includes(tag)) throw new Error('Active embedded element');
    if (tag === 'script' && (!entry || !/src=["']\/src\/main\.tsx["']/.test(attrs))) throw new Error('Unapproved script');
    for (const attr of attrs.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)) {
      const name = attr[1].toLowerCase(), value = attr[3];
      if (/^on/.test(name) || name === 'srcdoc') throw new Error('Embedded executable attribute');
      if (['src', 'srcset', 'poster', 'data', 'action', 'formaction', 'xlink:href', 'href'].includes(name)) {
        if (tag === 'link' && /rel=["']canonical["']/.test(attrs)) continue;
        if (remote(value)) throw new Error('Remote asset reference');
      }
    }
  }
  auditCss(text);
}

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
        const stylesheet = path.posix.normalize(path.posix.join(path.posix.dirname(file), name));
        const css = load(stylesheet);
        if (css === undefined) throw new Error(`Unresolved stylesheet: ${name}`);
        auditCss(css);
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
      if (ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword) {
        const parent = node.parent;
        if (!ts.isPropertyAccessExpression(parent) || parent.name.text !== 'env') throw new Error('Unapproved import.meta use');
      }
      if (ts.isStringLiteralLike(node) && forbiddenNetwork.has(node.text)) throw new Error('Public network alias');
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(source);
        if (['iframe', 'script', 'form', 'object', 'embed', 'base', 'link'].includes(tag)) throw new Error('Active embedded JSX');
        for (const attribute of node.attributes.properties) {
          if (!ts.isJsxAttribute(attribute)) continue;
          const name = attribute.name.getText(source), init = attribute.initializer;
          if (name === 'dangerouslySetInnerHTML' || name === 'srcDoc') throw new Error('Embedded executable JSX');
          const literal = init && ts.isStringLiteralLike(init) ? init.text :
            init && ts.isJsxExpression(init) && init.expression && ts.isStringLiteralLike(init.expression) ? init.expression.text : undefined;
          if (['src', 'srcSet', 'poster', 'data', 'action', 'formAction'].includes(name)) {
            if (literal === undefined || remote(literal)) throw new Error('Unproven or remote JSX asset');
          }
          if (name === 'href' && literal && /^(?:javascript|vbscript|data):/i.test(literal)) throw new Error('Unsafe link scheme');
        }
      }
      if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
        if (!node.moduleReference.expression) throw new Error('Unbounded import-equals dependency');
        dependency(node.moduleReference.expression);
      }
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
    const src = srcRoot;
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
    expect(() => audit(synthetic({ 'main.tsx': statement }))).toThrow(/Public network (call|reference|alias)/);
  });
  it('follows TypeScript import-equals references instead of skipping private dependencies', () => {
    expect(() => audit(synthetic({
      'main.tsx': "import hidden = require('./auth/session');",
      'auth/session.ts': 'export const secret = 1;',
    }))).toThrow(/Private or unapproved/);
  });
  it('rejects arbitrary stylesheet import escapes', () => {
    expect(() => audit(synthetic({ 'main.tsx': "import './private.css';" }))).toThrow(/Unapproved stylesheet/);
  });

  it.each(["import.meta.glob('../auth/*.ts')", 'const meta = import.meta;'])('rejects unbounded Vite expansion %s', statement => {
    expect(() => audit(synthetic({ 'main.tsx': statement }))).toThrow(/import.meta/);
  });
  it.each(['<img src="https://tracker.invalid/a"/>', '<img src={url}/>', '<iframe/>', '<form action="/submit"/>', '<script/>', '<link rel="prefetch"/>', '<a href="javascript:run()"/>'])('rejects embedded/automatic network path %s', statement => {
    expect(() => audit(synthetic({ 'main.tsx': statement }))).toThrow();
  });
  it.each(['new Worker("/worker.js")', 'new SharedWorker("/worker.js")', 'navigator.serviceWorker.register("/worker.js")', 'new RTCPeerConnection()', 'const f = window["fetch"]; f()'])('rejects alternative network API %s', statement => {
    expect(() => audit(synthetic({ 'main.tsx': statement }))).toThrow(/Public network/);
  });
  it.each(['@import "https://tracker.invalid/font";', 'body{background:url(//tracker.invalid/a)}'])('rejects remote stylesheet dependency %s', css => {
    expect(() => auditCss(css)).toThrow();
  });
  it.each(['<script src="https://tracker.invalid/a"></script>', '<link rel="preconnect" href="//tracker.invalid">', '<svg><image href="https://tracker.invalid/a"/></svg>'])('rejects markup/static asset network dependency %s', markup => {
    expect(() => auditMarkup(markup, true)).toThrow();
  });
  it('audits actual index and public SVG/HTML assets, excluding harmless XML namespace declarations', () => {
    auditMarkup(readFileSync(path.join(frontendRoot, 'index.html'), 'utf8'), true);
    function walk(directory: string) {
      for (const item of readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, item.name);
        if (item.isDirectory()) walk(file);
        else if (/\.(svg|html)$/i.test(item.name)) auditMarkup(readFileSync(file, 'utf8'));
      }
    }
    walk(path.join(frontendRoot, 'public'));
  });
  it('rejects computed import targets instead of silently skipping them', () => {
    expect(() => audit(synthetic({ 'main.tsx': 'import(target);' }))).toThrow(/Nonliteral/);
  });
});
