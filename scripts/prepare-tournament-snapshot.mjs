import {readFile,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';
import {leaderboardRows,normalizeTournamentEvent} from '../src/lib/leaderboard.mjs';
const data=JSON.parse(await readFile('reference/tournaments/open-ratings-live.json','utf8'));
const $=load(await readFile('reference/tournaments/upcoming.html','utf8'));
const events=$('a[href]').filter((_,e)=>/\/v2\/upcoming\//.test($(e).attr('href'))).map((_,e)=>normalizeTournamentEvent({href:$(e).attr('href'),title:$(e).find('h2').text(),dates:$(e).find('p').first().text(),location:$(e).find('p').eq(1).text(),image:$(e).find('img').attr('src')})).get().filter(Boolean);
await writeFile('src/data/tournaments.json',JSON.stringify({year:data.year,generatedAt:data.generatedAt,capturedAt:new Date().toISOString(),source:'https://tournament.hobsonsbaychess.com/v2/leaderboard/open',rows:leaderboardRows(data,2026,20),events},null,2));
console.log('Saved verified '+data.year+' standings and '+events.length+' event summaries.');
