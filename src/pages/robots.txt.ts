import {siteUrl} from '../lib/site-url.mjs';

export function GET({site}) {
  const staging = import.meta.env.SITE_STAGING === 'true';
  const text = 'User-agent: *\n' + (staging ? 'Disallow: /\n' : 'Allow: /\n') +
    '\nSitemap: ' + new URL(siteUrl('/sitemap.xml'), site).href + '\n';
  return new Response(text, {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
}
