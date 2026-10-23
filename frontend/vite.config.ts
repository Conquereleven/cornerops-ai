import { build, defineConfig } from 'vite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { publicDocument } from './src/components/public/PublicDocument';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    name: 'cornertech-public-prerender',
    apply: 'build',
    enforce: 'post',
    async generateBundle(_options, bundle) {
      const entry = bundle['index.html'];
      if (!entry || entry.type !== 'asset' || typeof entry.source !== 'string') throw new Error('Missing public HTML');
      const template = entry.source;
      const root = fileURLToPath(new URL('.', import.meta.url));
      const cache = join(root, 'node_modules/.cache');
      mkdirSync(cache, { recursive: true });
      const temporary = mkdtempSync(join(cache, 'ct-public-prerender-'));
      try {
        // Build-time only. No server, sockets, OAuth or runtime SSR service.
        const result = await build({
          configFile: false, root, mode, plugins: [react()], logLevel: 'error',
          ssr: { noExternal: ['react-router-dom', 'react-router'], resolve: { conditions: ['module-sync', 'module', 'node'] } },
          build: { ssr: 'src/components/public/PublicPrerender.tsx', write: false,
            rollupOptions: { output: { format: 'es', entryFileNames: 'render.mjs' } } },
        });
        if (Array.isArray(result) || !('output' in result)) throw new Error('Unexpected prerender output');
        const compiled = result.output.find(item => item.type === 'chunk' && item.isEntry);
        if (!compiled || compiled.type !== 'chunk') throw new Error('Missing prerender entry');
        const entryPath = join(temporary, 'render.mjs');
        writeFileSync(entryPath, compiled.code);
        const { prerenderPublicPages } = await import(pathToFileURL(entryPath).href);
        for (const page of prerenderPublicPages()) {
          const html = publicDocument(template, page);
          if (page.file === 'index.html') entry.source = html;
          else this.emitFile({ type: 'asset', fileName: page.file, source: html });
        }
      } finally { rmSync(temporary, { recursive: true, force: true }); }
    },
  }],
  preview: { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
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
}));
