import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';

const origin = 'https://hobsonsbaychess.com';
const capturedAt = new Date().toISOString();
const manifest = { capturedAt, origin, scope: 'Public pages, published REST records, and assets referenced by captured pages. Not a database/server backup.', pages: [], assets: [], apis: {}, errors: [] };
const seenAssets = new Set();
const assetQueue = [];
const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 HBCC-Migration-Reference/1.0' };
await Promise.all(['reference/html', 'reference/api', 'reference/styles', 'public/wp-assets'].map(p => mkdir(p, { recursive: true })));
const existingFiles = new Map();
for (const dir of ['reference/styles', 'public/wp-assets']) for (const name of await readdir(dir)) existingFiles.set(name.slice(0, 10), `${dir}/${name}`);

function slug(url) {
  return decodeURIComponent(new URL(url).pathname).replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-') || 'home';
}
async function get(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > 25000000) throw new Error('File exceeds 25 MB capture limit');
  return response;
}
function enqueueAsset(value, base) {
  if (!value || value.startsWith('data:') || value.startsWith('#')) return;
  try {
    const decoded=value.replace(/&amp;/g,'&').replace(/&#0?39;|&quot;|&#0?34;/g,'').replace(/^['"]+|['"]+$/g,'');
    const url = new URL(decoded, base).href;
    const u = new URL(url);
    if (!['https:', 'http:'].includes(u.protocol)) return;
    if (!/hobsonsbaychess\.com$|wp\.com$|wordpress\.com$|googleapis\.com$|gstatic\.com$/.test(u.hostname)) return;
    if (seenAssets.has(url)) return;
    seenAssets.add(url); assetQueue.push(url);
  } catch {}
}
function inspectAssets(html, base) {
  const $ = load(html);
  $('img').each((_, el) => {
    for (const attr of ['src', 'data-src', 'data-lazy-src']) enqueueAsset($(el).attr(attr), base);
    // Preserve the original/largest image where a responsive image is used.
    const srcset = $(el).attr('srcset') || $(el).attr('data-srcset');
    if (srcset) enqueueAsset(srcset.split(',').at(-1)?.trim().split(/\s+/)[0], base);
  });
  $('link[rel="stylesheet"]').each((_, el) => enqueueAsset($(el).attr('href'), base));
  $('link[rel="icon"]').each((_, el) => enqueueAsset($(el).attr('href'), base));
  $('a[href]').each((_, el) => { if (/\.(pdf|docx?|xlsx?|pgn)(\?|$)/i.test($(el).attr('href'))) enqueueAsset($(el).attr('href'), base); });
  inspectCSS(html, base);
  for (const match of html.matchAll(/https?:\/\/hobsonsbaychess\.com\/wp-content\/[^"'<>\s\\]+/g)) {
    if (/\.(png|jpe?g|webp|svg|gif|pdf|woff2?|ttf|otf)(\?|$)/i.test(match[0])) enqueueAsset(match[0], base);
  }
}
function inspectCSS(css, base) {
  for (const match of css.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) enqueueAsset(match[1], base);
}
async function capturePage(url) {
  try {
    const captureUrl = new URL(url);
    captureUrl.searchParams.set('hbcc_migration_reference', '20261010');
    const response = await get(captureUrl.href);
    const html = await response.text();
    const path = `reference/html/${slug(url)}.html`;
    await writeFile(path, html);
    const $ = load(html);
    manifest.pages.push({ url, requestedUrl: captureUrl.href, path, title: $('title').text(), status: response.status, sha256: createHash('sha256').update(html).digest('hex') });
    inspectAssets(html, url);
    return $;
  } catch (error) { manifest.errors.push({ url, error: error.message }); return null; }
}
const home = await capturePage(`${origin}/`);
if (!home) throw new Error('Cannot capture the source homepage');
const urls = new Set();
home('a[href]').each((_, el) => {
  try {
    const u = new URL(home(el).attr('href'), origin);
    if (u.origin === origin && u.pathname !== '/' && !u.pathname.match(/\.(png|jpe?g|webp|pdf|svg)$/i) && !u.pathname.startsWith('/wp-') && !u.search) urls.add(u.href.split('#')[0]);
  } catch {}
});
for (const type of ['pages', 'posts', 'media', 'categories']) {
  const all = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const url = `${origin}/wp-json/wp/v2/${type}?per_page=100&page=${page}`;
    try {
      const response = await get(url);
      totalPages = Number(response.headers.get('x-wp-totalpages')) || 1;
      const batch = await response.json();
      if (!Array.isArray(batch)) throw new Error('REST endpoint did not return an array');
      all.push(...batch);
    } catch (error) { manifest.errors.push({ url, error: error.message }); break; }
  }
  manifest.apis[type] = { count: all.length, path: `reference/api/${type}.json` };
  await writeFile(`reference/api/${type}.json`, JSON.stringify(all, null, 2));
  console.log(`${type}: ${all.length} published records captured`);
  if (['pages', 'posts'].includes(type)) for (const item of all) {
    if (item.link && new URL(item.link).origin === origin && new URL(item.link).pathname !== '/') urls.add(item.link);
  }
}
await writeFile('reference/navigation.json', JSON.stringify(home('.menuPort, .btVerticalMenuTrigger, nav').find('a[href]').map((_, el) => ({ label: home(el).text().trim(), href: home(el).attr('href') })).get().filter(a => a.label), null, 2));
const pageUrls = [...urls].slice(0, 100);
for (let i = 0; i < pageUrls.length; i += 4) await Promise.all(pageUrls.slice(i, i + 4).map(capturePage));
console.log(`HTML: ${manifest.pages.length} pages captured`);
// Follow CSS resources to preserve font/image references, bounded to the assets actually used.
for (let i = 0; i < assetQueue.length && i < 900; i += 6) {
  await Promise.all(assetQueue.slice(i, i + 6).map(async (url) => {
    try {
      const parsed = new URL(url);
      const hash = createHash('sha256').update(url).digest('hex').slice(0, 10);
      if (existingFiles.has(hash)) {
        const path = existingFiles.get(hash);
        const data = await readFile(path);
        if (path.endsWith('.css')) inspectCSS(data.toString('utf8'), url);
        manifest.assets.push({ url, path, localUrl: path.startsWith('public/') ? `/${path.slice(7)}` : null, contentType: path.endsWith('.css') ? 'text/css' : 'application/octet-stream', bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
        return;
      }
      let name = decodeURIComponent(parsed.pathname.split('/').at(-1) || 'asset').replace(/[^a-zA-Z0-9._-]+/g, '-');
      const response = await get(url);
      const type = response.headers.get('content-type') || '';
      if (type.includes('text/html')) return;
      if (type.includes('text/css') && !name.endsWith('.css')) name += '.css';
      const path = `${type.includes('text/css') ? 'reference/styles' : 'public/wp-assets'}/${hash}-${name}`;
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length > 25000000) throw new Error('File exceeds 25 MB capture limit');
      await writeFile(path, data);
      if (type.includes('text/css')) inspectCSS(data.toString('utf8'), url);
      manifest.assets.push({ url, path, localUrl: path.startsWith('public/') ? `/${path.slice(7)}` : null, contentType: type, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
    } catch (error) { manifest.errors.push({ url, error: error.message }); }
  }));
  if (i % 60 === 0) console.log(`Assets: ${manifest.assets.length} downloaded`);
}
manifest.skippedAssetUrls = assetQueue.slice(900);
await writeFile('reference/manifest.json', JSON.stringify(manifest, null, 2));
await writeFile('reference/asset-map.json', JSON.stringify(Object.fromEntries(manifest.assets.filter(a => a.localUrl).map(a => [a.url, a.localUrl])), null, 2));
console.log(JSON.stringify({ pages: manifest.pages.length, assets: manifest.assets.length, bytes: manifest.assets.reduce((n, a) => n + a.bytes, 0), errors: manifest.errors.length, manifest: 'reference/manifest.json' }));
