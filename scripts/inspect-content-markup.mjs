import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';
const data=JSON.parse(await readFile('src/data/site.json','utf8'));
for(const slug of ['membership','sponsors','tournaments']){
 const $=load(data.pages.find(p=>p.slug===slug).bodyHtml);
 console.log(JSON.stringify({slug,counter:$('.bt_bb_counter_holder').first().html(),price:$('.bt_bb_price_list_price').first().html(),postDate:$('.bt_bb_latest_posts_item_date').first().html(),time:$('time').first().parent().html()},null,2));
}
