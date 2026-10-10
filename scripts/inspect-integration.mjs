import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';
const data=JSON.parse(await readFile('reference/tournaments/open-ratings-live.json','utf8'));
const top=data.players.map(p=>({name:p.name,title:p.title,points:(p.tournaments||[]).filter(t=>t.ratingType==='standard').reduce((sum,t)=>sum+Number(t.score),0)})).sort((a,b)=>b.points-a.points).slice(0,8);
const $=load(await readFile('reference/tournaments/upcoming.html','utf8'));
const events=$('a').filter((_,e)=>/\/upcoming\//.test($(e).attr('href')||'')).map((_,e)=>({href:$(e).attr('href'),title:$(e).find('h2').text(),detail:$(e).find('p').map((_,p)=>$(p).text()).get(),image:$(e).find('img').attr('src')})).get();
console.log(JSON.stringify({year:data.year,generatedAt:data.generatedAt,top,events},null,2));
