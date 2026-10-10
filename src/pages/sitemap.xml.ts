import { getContent } from '../lib/content.mjs';
import { siteUrl } from '../lib/site-url.mjs';
export async function GET({site}) {
  const { pages, posts } = await getContent();
  const paths = ['/', '/news/', ...pages.filter(p=>!p.noindex).map(p=>`/${p.slug}/`), ...posts.filter(p=>!p.noindex).map(p=>`/${p.slug}/`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${new URL(siteUrl(path),site).href}</loc></url>`).join('')}</urlset>`, { headers:{'Content-Type':'application/xml; charset=utf-8'} });
}
