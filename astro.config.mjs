import { defineConfig } from 'astro/config';
import { loadEnv } from './scripts/env.mjs';
loadEnv();
if (process.argv.includes('build') && process.env.CONTENTFUL_USE_PREVIEW === 'true') {
  throw new Error('Preview content cannot be used for a production build. Unset CONTENTFUL_USE_PREVIEW.');
}
export default defineConfig({
  site: 'https://hobsonsbaychess.com',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  server: { host: '127.0.0.1', port: 4327 },
});
