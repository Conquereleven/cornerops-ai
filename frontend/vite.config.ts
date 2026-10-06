import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Canonical identity comes from VITE_PUBLIC_SITE_URL. Without it (local, or
// before a domain is chosen) no canonical URL, og:url or sitemap is emitted, so
// a provider hostname never becomes the site's canonical identity.
const publicSiteUrl = (raw: string | undefined) => {
  try {
    const url = new URL(String(raw || '').trim());
    return url.protocol === 'https:' ? url.origin : '';
  } catch { return ''; }
};

const siteIdentity = (siteUrl: string): Plugin => ({
  name: 'cornerops-site-identity',
  transformIndexHtml: () => (siteUrl ? [
    { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
    { tag: 'meta', attrs: { property: 'og:url', content: `${siteUrl}/` }, injectTo: 'head' },
  ] : []),
  generateBundle() {
    if (!siteUrl) return;
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`,
    });
  },
});

export default defineConfig(({ mode }) => {
  const siteUrl = publicSiteUrl(loadEnv(mode, process.cwd(), 'VITE_').VITE_PUBLIC_SITE_URL);
  return {
    plugins: [react(), siteIdentity(siteUrl)],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      globals: true,
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/api': 'http://127.0.0.1:3000',
        '/health': 'http://127.0.0.1:3000',
      },
    },
  };
});
