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
  outDir: process.env.SITE_VARIANT === 'v2' ? './dist/v2/' : './dist/',
  trailingSlash: 'always',
  redirects: {
    '/blog': withBase('/news/',base),
    '/author/boldthemes': withBase('/news/',base),
    '/category/hbcc-chess': withBase('/news/',base),
    '/about/club-history': withBase('/history/',base),
    '/alonso-already-looking-ahead-after-goal-feast': withBase('/news/',base),
    '/horstweg-can-be-a-double-gameweek-hero': withBase('/news/',base),
    '/pre-match-briefing-hammers-vs-eagles': withBase('/news/',base),
    '/video-highlights-eagles-24-21-rhinos': withBase('/news/',base),
    '/watch-the-highlights-and-goals-against-seagulls': withBase('/news/',base),
  },
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4327 },
});
