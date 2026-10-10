import { readFile, writeFile } from 'node:fs/promises';
const players=JSON.parse(await readFile('reference/tournaments/v2__public__open-ratings.json','utf8'));
const data=JSON.parse(await readFile('reference/tournaments/v2__public__data.json','utf8'));
console.log(JSON.stringify({ playerRoot:Array.isArray(players)?'array':Object.keys(players), playerExample:Array.isArray(players)?players[0]:Object.values(players)[0], tournamentRoot:Array.isArray(data)?'array':Object.keys(data), tournamentExample:Array.isArray(data)?data[0]:Object.values(data)[0] },null,2).slice(0,7000));
const page=await fetch('https://tournament.hobsonsbaychess.com/v2/upcoming');
const text=await page.text(); await writeFile('reference/tournaments/upcoming.html',text);
const json=await fetch('https://tournament.hobsonsbaychess.com/open-ratings.json');
console.log(JSON.stringify({liveDataStatus:json.status,contentType:json.headers.get('content-type'),cors:json.headers.get('access-control-allow-origin')}));
if(json.ok && json.headers.get('content-type')?.includes('json')) await writeFile('reference/tournaments/open-ratings-live.json',await json.text());
