import { defineConfig } from 'astro/config';
import { loadEnv } from './scripts/env.mjs';
import { normalizeBase, withBase } from './src/lib/site-url.mjs';
loadEnv();
if (process.argv.includes('build') && process.env.CONTENTFUL_USE_PREVIEW === 'true') {
  throw new Error('Preview content cannot be used for a production build. Unset CONTENTFUL_USE_PREVIEW.');
}
const base = normalizeBase(process.env.SITE_BASE_PATH);
export default defineConfig({
  site: process.env.SITE_URL || 'https://hobsonsbaychess.com',
  base,
  output: 'static',
  trailingSlash: 'always',
  redirects: {
    '/blog': withBase('/news/',base),
    '/author/boldthemes': withBase('/news/',base),
    '/category/hbcc-chess': withBase('/news/',base),
    '/about/club-history': withBase('/history/',base),
  },
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4327 },
});
