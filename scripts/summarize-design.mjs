import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';
const $=load(await readFile('reference/html/home-fresh.html','utf8'));
console.log('backgrounds', $('.btLazyLoadBackground').map((_,e)=>$(e).attr('data-background_image_src')).get());
console.log('stats', $('.bt_bb_counter_holder').map((_,e)=>({number:$(e).find('.onedigit').map((_,d)=>$(d).attr('data-digit')).get().join(''), text:$(e).find('.bt_bb_counter_text').text()})).get());
console.log('social', $('.btIconWidget a').map((_,e)=>({text:$(e).text(),href:$(e).attr('href')})).get());
console.log('navigation', $('.menuPort nav > ul > li').map((_,e)=>({label:$(e).children('a').text(),href:$(e).children('a').attr('href')})).get());
console.log('home sections', $('.bt_bb_section').map((_,e)=>({heading:$(e).find('h1,h2,h3').first().text().replace(/\s+/g,' ').trim(), text:$(e).text().replace(/\s+/g,' ').trim().slice(0,250)})).get());
const pages=JSON.parse(await readFile('reference/api/pages.json','utf8'));
for(const path of ['/play-chess/','/membership/','/calendar/','/contact/','/policies/']){
 const p=pages.find(p=>new URL(p.link).pathname===path);const dom=load(p.content.rendered);console.log('page',path,'header',dom('.bt_bb_section').first().text().replace(/\s+/g,' ').trim().slice(0,1000),'accordion',dom('.bt_bb_accordion_item').first().html()?.slice(0,1200),'embed',dom('iframe').map((_,e)=>dom(e).attr('src')).get());
}
