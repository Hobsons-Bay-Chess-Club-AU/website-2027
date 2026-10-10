import { readFile, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
const pages = JSON.parse(await readFile('reference/api/pages.json', 'utf8'));
for (const page of pages.filter(p => ['/', '/play-chess/', '/juniors/', '/tournaments/', '/membership/', '/about-us/', '/sponsors/', '/history/', '/calendar/', '/contact/', '/policies/', '/champions/'].includes(new URL(p.link).pathname))) {
  const $ = load(page.content.rendered);
  const headings = $('h1,h2,h3,h4,h5').map((_, e) => $(e).text().replace(/\s+/g, ' ').trim()).get();
  console.log(JSON.stringify({path:new URL(page.link).pathname, title:page.title.rendered, headings: headings.slice(0, 22), hasClub: page.content.rendered.includes('Hobsons Bay'), imageUrls:$('img').map((_,e)=>$(e).attr('src')).get().filter(v=>v?.includes('2025')).slice(0,5)}));
}
const response = await fetch('https://hobsonsbaychess.com/?hbcc_migration_reference=20261010', {signal:AbortSignal.timeout(30000)});
const html = await response.text();
await writeFile('reference/html/home-fresh.html',html);
const $ = load(html);
console.log('Fresh root', response.status, $('h1,h2,h3,h4,h5').map((_,e)=>$(e).text().replace(/\s+/g,' ').trim()).get().slice(0,20));
console.log('Fresh backgrounds', $('[data-background-image]').map((_,e)=>$(e).attr('data-background-image')).get());
console.log('Fresh images', $('img').map((_,e)=>({src:$(e).attr('src'), alt:$(e).attr('alt')})).get().filter(v=>/2025|2026/.test(v.src)).slice(0,30));
console.log('Fresh counters', $('.bt_bb_counter').map((_,e)=>$(e).attr()).get());
console.log('Background holders', $('.btLazyLoadBackground').map((_,e)=>Object.fromEntries(Object.entries($(e).attr()).filter(([k])=>k!=='class'))).get());
console.log('Counter numbers', $('.bt_bb_counter').map((_,e)=>$(e).html().slice(-1100)).get());
