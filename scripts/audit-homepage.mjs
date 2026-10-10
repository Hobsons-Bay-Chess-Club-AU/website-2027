import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';

await mkdir('reference/audit', { recursive: true });
const url = 'https://hobsonsbaychess.com/';
const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`Homepage returned ${response.status}`);
const html = await response.text();
await writeFile('reference/audit/wordpress-homepage.html', html);
const $ = load(html);
const text = element => $(element).text().replace(/\s+/g, ' ').trim();
const sections = $('.bt_bb_section').map((_, element) => ({
  heading: $(element).find('h1,h2,h3,h4,h5,h6').map((_, e) => text(e)).get(),
  text: text(element),
  links: $(element).find('a').map((_, e) => ({ label: text(e), href: $(e).attr('href') })).get(),
  images: $(element).find('img').map((_, e) => ({ alt: $(e).attr('alt'), src: $(e).attr('src') || $(e).attr('data-src') })).get(),
  counters: $(element).find('.bt_bb_counter_holder').map((_, e) => ({ value: $(e).find('.onedigit').map((_, d) => $(d).attr('data-digit')).get().join(''), text: $(e).find('.bt_bb_counter_text').text().trim() })).get(),
  icons: $(element).find('[data-ico-fa],[data-ico-fa5]').map((_, e) => $(e).attr('data-ico-fa') || $(e).attr('data-ico-fa5')).get(),
})).get();
const navigation = $('.menuPort nav').html() || $('nav').first().html();
const snapshot = { capturedAt: new Date().toISOString(), source: url, sha256: createHash('sha256').update(html).digest('hex'), sections, navigation };
await writeFile('reference/audit/homepage-inventory.json', JSON.stringify(snapshot, null, 2));
for(const [source,destination] of [['src/data/site.json','reference/audit/first-version-content.json'],['src/pages/index.astro','reference/audit/first-version-homepage.astro']]){
 try{await access(destination);}catch{await copyFile(source,destination);}
}
console.log(JSON.stringify({ capturedAt: snapshot.capturedAt, sections: sections.map((s, i) => ({ i, headings:s.heading, text:s.text.slice(0,180), images:s.images.length, links:s.links.length, counters:s.counters })) }, null, 2));
