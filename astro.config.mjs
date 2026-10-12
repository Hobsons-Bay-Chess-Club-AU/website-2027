import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { loadEnv } from './scripts/env.mjs';
import { normalizeBase, withBase } from './src/lib/site-url.mjs';
loadEnv();
if (process.argv.includes('build') && process.env.CONTENTFUL_USE_PREVIEW === 'true') {
  throw new Error('Preview content cannot be used for a production build. Unset CONTENTFUL_USE_PREVIEW.');
}
const base = normalizeBase(process.env.SITE_BASE_PATH);
const server = process.env.SITE_DEPLOY_TARGET === 'vercel';
if(server&&process.argv.includes('build')&&!process.env.ISR_REVALIDATE_TOKEN)throw new Error('Set ISR_REVALIDATE_TOKEN before building for Vercel.');
export default defineConfig({
  site: process.env.SITE_URL || 'https://hobsonsbaychess.com',
  base,
  output: server ? 'server' : 'static',
  // Named-route exclusions omit trailing slashes in the adapter's matcher.
  // Prefix patterns also cover canonical slash URLs before the CMS catch-all,
  // keeping editor queries/cookies and webhook POSTs out of ISR entirely.
  adapter: server ? vercel({isr:{expiration:3600,bypassToken:process.env.ISR_REVALIDATE_TOKEN,exclude:[/^\/api\//,/^\/editor\//,'/api/[...path]','/editor/[...path]','/404','/404/[...path]']},maxDuration:60}) : undefined,
  integrations: server ? [{name:'hbcc-editor-routes',hooks:{'astro:config:setup':({injectRoute})=>{
    for(const [pattern,entrypoint] of [['/api/revalidate','./src/server/endpoints/revalidate.ts'],['/api/preview','./src/server/endpoints/preview.ts'],['/api/exit-preview','./src/server/endpoints/exit-preview.ts'],['/editor/login','./src/server/EditorLogin.astro']])injectRoute({pattern,entrypoint,prerender:false});
  }}}] : [],
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
