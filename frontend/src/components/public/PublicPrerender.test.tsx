// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { prerenderPublicPages } from './PublicPrerender';
import { publicDocument } from './PublicDocument';
import { publicMetadata, publicRobots, publicRoutes } from './PublicRouteManifest';

const template = '<!doctype html><html lang="en"><head><title>old</title><meta name="robots" content="noindex"><meta property="og:title" content="old"><link rel="canonical" href="https://old.invalid/"><script type="module" src="/assets/current.js"></script></head><body><div id="root"></div></body></html>';

test('initial HTML contains each route copy, real content, current assets and unique canonical metadata', () => {
  const pages = prerenderPublicPages();
  expect(pages.map(p => p.file)).toEqual(['index.html','products/commerce/index.html','solutions/index.html','404.html']);
  for (const page of pages) {
    const html = publicDocument(template, page);
    expect(html).toContain('<h1');
    expect(html).toContain('/assets/current.js');
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/name="robots"/g)).toHaveLength(1);
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html).not.toContain('old.invalid');
    if (page.indexable) {
      expect(html).toContain('content="index, follow"');
      expect(html).toContain(`href="https://cornertech.ae${page.path}"`);
      expect(page.markup).toContain(publicRoutes.find(r => r.path === page.path)!.copy.h1);
    } else {
      expect(html).toContain('content="noindex, nofollow"');
      expect(html).not.toContain('rel="canonical"');
      expect(page.markup).toContain('Page unavailable');
    }
    expect(page.markup).not.toMatch(/Tres Leches|CornerOps|\/api\/|<form/i);
  }
});

test('production routes can index; previews and all private/unknown routes cannot', () => {
  for (const route of publicRoutes) for (const host of ['cornertech.ae','www.cornertech.ae']) {
    expect(publicRobots(route.path,host)).toBe('index, follow');
  }
  for (const host of ['localhost','127.0.0.1','preview.up.railway.app','cornertech.ae.evil.invalid']) {
    expect(publicRobots('/',host)).toBe('noindex, nofollow');
  }
  for (const path of ['/login','/api/products','/app/sales','/unknown','/constructor']) {
    expect(publicRobots(path,'cornertech.ae')).toBe('noindex, nofollow');
    expect(publicMetadata(path).indexable).toBe(false);
  }
});

test('metadata escapes markup and unexpected document templates fail closed', () => {
  const html = publicDocument(template, {title:'<script>&"',description:'" onload="x',path:'/',indexable:true,markup:'<main>safe</main>'});
  expect(html).toContain('&lt;script&gt;&amp;&quot;');
  expect(html).toContain('content="&quot; onload=&quot;x"');
  expect(() => publicDocument('<div></div>',{title:'',description:'',path:'/',indexable:true,markup:''})).toThrow();
});


test('crawler allowlist and sitemap cover exactly the three released public routes', () => {
  const robots = readFileSync(new URL('../../../public/robots.txt', import.meta.url), 'utf8');
  const sitemap = readFileSync(new URL('../../../public/sitemap.xml', import.meta.url), 'utf8');
  for (const route of publicRoutes) {
    expect(robots).toContain(`Allow: ${route.path}$`);
    expect(sitemap).toContain(`<loc>https://cornertech.ae${route.path}</loc>`);
  }
  expect(sitemap.match(/<loc>/g)).toHaveLength(3);
  expect(robots).toContain('Disallow: /');
  expect(robots).not.toMatch(/Allow: \/(?:api|app|login)/);
});


test('prerender content remains hydration-stable across a calendar-year rollover', () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date('2026-12-31T23:59:00Z'));
    const before = prerenderPublicPages().map(page => page.markup);
    vi.setSystemTime(new Date('2027-01-01T00:01:00Z'));
    expect(prerenderPublicPages().map(page => page.markup)).toEqual(before);
  } finally { vi.useRealTimers(); }
});
