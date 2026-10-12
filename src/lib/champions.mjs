import {safeUrl} from './sanitize.mjs';

export function orderedChampions(entries){
 const seen=new Set();
 return entries.filter(e=>e.enabled!==false).map(e=>{
  if(!Number.isInteger(e.year)||e.year<1974||e.year>2100||!e.playerName?.trim())throw new Error('A published club champion needs a valid year and player name.');
  if(seen.has(e.year))throw new Error('Duplicate club championship year '+e.year+'. Use one winner record per year.');
  seen.add(e.year);
  if(e.standingsUrl&&(!/^https?:\/\//.test(e.standingsUrl)||!safeUrl(e.standingsUrl,'')))throw new Error('A club champion needs a valid public standings URL.');
  return {...e};
 }).sort((a,b)=>b.year-a.year);
}
