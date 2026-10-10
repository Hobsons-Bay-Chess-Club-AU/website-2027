import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';

for (const type of ['pages', 'posts']) {
  try {
    const data = JSON.parse(await readFile(`reference/api/${type}.json`, 'utf8'));
    console.log(type, data.map(p => ({ id: p.id, path: new URL(p.link).pathname, title: p.title?.rendered, bytes: p.content?.rendered?.length, featured_media: p.featured_media })));
  } catch {}
}
const $ = load(await readFile('reference/html/home.html', 'utf8'));
console.log('Styles', $('link[rel="stylesheet"]').map((_, el) => $(el).attr('href')).get());
console.log('Backgrounds', $('[style*="background"]').map((_, el) => ({ classes: $(el).attr('class'), style: $(el).attr('style') })).get().slice(0, 24));
console.log('Images', $('img').map((_, el) => ({ src: $(el).attr('src'), alt: $(el).attr('alt'), class: $(el).attr('class') })).get().slice(0, 40));
console.log('Headings', $('h1,h2,h3,h4,h5').map((_, el) => $(el).text()).get());
console.log('Stats', $('.bt_bb_counter').map((_, el) => $(el).attr('data-number')).get());
