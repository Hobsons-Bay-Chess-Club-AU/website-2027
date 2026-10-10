import {load} from 'cheerio';
import snapshot from '../data/tournaments.json' with {type:'json'};
import {leaderboardRows,tournamentDataUrl,normalizeTournamentEvent} from './leaderboard.mjs';
const cache=new Map();
export function parseUpcomingEvents(html){
 const $=load(html);
 return $('a[href]').filter((_,e)=>/\/v2\/upcoming\//.test($(e).attr('href'))).map((_,e)=>normalizeTournamentEvent({href:$(e).attr('href'),title:$(e).find('h2').text(),dates:$(e).find('p').first().text(),location:$(e).find('p').eq(1).text(),image:$(e).find('img').attr('src')})).get().filter(Boolean);
}
export async function loadTournamentData(feed,{fetch:fetcher=fetch}={}){
 const dataUrl=tournamentDataUrl(feed.dataUrl),upcomingUrl=tournamentDataUrl(feed.upcomingUrl,'upcoming');
 const results=await Promise.allSettled([
  fetcher(dataUrl,{redirect:'error',signal:AbortSignal.timeout(12000)}).then(async r=>{if(!r.ok)throw new Error('Leaderboard request failed');const data=await r.json();return {rows:leaderboardRows(data,feed.year,feed.rows),generatedAt:data.generatedAt};}),
  fetcher(upcomingUrl,{redirect:'error',signal:AbortSignal.timeout(12000)}).then(async r=>{if(!r.ok)throw new Error('Upcoming request failed');return parseUpcomingEvents(await r.text());})
 ]);
 const leaderboard=results[0].status==='fulfilled'?results[0].value:String(snapshot.year)===String(feed.year)?{rows:snapshot.rows.slice(0,feed.rows),generatedAt:snapshot.generatedAt}:null;
 const events=results[1].status==='fulfilled'?results[1].value:snapshot.events;
 return {rows:leaderboard?.rows||[],generatedAt:leaderboard?.generatedAt||null,events:events.slice(0,feed.eventsLimit),snapshot:results.some(r=>r.status==='rejected'),eventsCapturedAt:results[1].status==='fulfilled'?new Date().toISOString():snapshot.capturedAt};
}
export const getTournamentData=feed=>{
 const key=JSON.stringify([feed.dataUrl,feed.upcomingUrl,feed.year,feed.rows,feed.eventsLimit]);let cached=cache.get(key);
 if(!cached||Date.now()-cached.at>300000){cached={at:Date.now(),promise:loadTournamentData(feed)};cache.set(key,cached);}return cached.promise;
};
