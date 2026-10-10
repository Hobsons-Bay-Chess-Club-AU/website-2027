export function leaderboardRows(data,year,limit=8){
 if(String(data?.year)!==String(year))throw new Error('The tournament data year does not match '+year+'.');
 if(!Array.isArray(data.players)||!Number.isFinite(Date.parse(data.generatedAt)))throw new Error('Invalid tournament leaderboard data.');
 const players=data.players.map(p=>{
  if(typeof p.name!=='string'||!Array.isArray(p.tournaments))throw new Error('Invalid leaderboard player.');
  const points=p.tournaments.filter(t=>t.ratingType==='standard').reduce((sum,t)=>{
   const score=Number(t.score);if(!Number.isFinite(score)||score<0)throw new Error('Invalid classical score.');return sum+score;
  },0);
  return {name:p.name.replace(/,\s*/g,', ').trim(),title:typeof p.title==='string'?p.title:'',points};
 });
 // Stable sort retains the source order for tied scores.
 return players.sort((a,b)=>b.points-a.points).slice(0,Math.max(1,Math.min(20,Number(limit)||8))).map((p,i)=>({...p,rank:i+1}));
}
export function tournamentDataUrl(value,kind='data'){
 const u=new URL(value);
 if(u.protocol!=='https:'||u.hostname!=='tournament.hobsonsbaychess.com'||u.port||u.username||u.password||u.search||u.hash)throw new Error('Use a public HBCC tournament service URL.');
 if(kind==='data'&&u.pathname!=='/open-ratings.json')throw new Error('Use the HBCC Open leaderboard JSON endpoint.');
 if(kind==='upcoming'&&!['/v2/upcoming','/v2/upcoming/'].includes(u.pathname))throw new Error('Use the HBCC upcoming events page.');
 return u.href;
}
export function normalizeTournamentEvent({href,title,dates,location,image}){
 if(!title||!dates)return null;
 const url=new URL(href,'https://tournament.hobsonsbaychess.com');
 if(url.hostname!=='tournament.hobsonsbaychess.com'||!/^\/v2\/upcoming\/[a-z0-9-]+$/.test(url.pathname))return null;
 let safeImage='';
 try{const img=new URL(image);if(img.protocol==='https:'&&['s3.tidyhq.com','tournament.hobsonsbaychess.com'].includes(img.hostname))safeImage=img.href;}catch{}
 const start=dates.split(/\s[–—]\s/)[0].trim();
 return {url:url.href,title:String(title).trim().slice(0,256),dates:String(dates).trim().slice(0,150),location:String(location||'').trim().slice(0,256),image:safeImage,day:start.match(/^\d{1,2}/)?.[0]||'',month:start.match(/\b[A-Za-z]{3}\b/)?.[0]||''};
}
