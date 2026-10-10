import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('reference/tournaments', { recursive: true });
const api = 'https://api.github.com/repos/Hobsons-Bay-Chess-Club-AU/tournaments/git/trees/main?recursive=1';
const response = await fetch(api, { headers: { 'User-Agent':'HBCC-migration-audit' }, signal: AbortSignal.timeout(30000) });
if(!response.ok) throw new Error(`Repository tree: ${response.status}`);
const tree = await response.json();
await writeFile('reference/tournaments/tree.json', JSON.stringify(tree, null, 2));
console.log(JSON.stringify({ truncated:tree.truncated, files:tree.tree.filter(e => /^(v2\/(app|src|components|public)|src\/|scripts\/)/.test(e.path) && !/\.json$/.test(e.path) && /leaderboard|calendar|upcoming|schedule|timeline|tournament|prepare-data/.test(e.path)).map(e=>({path:e.path,size:e.size})), dataFiles:tree.tree.filter(e=>/^v2\/public\/.+\.json$/.test(e.path)).map(e=>({path:e.path,size:e.size})) }, null, 2));
const selected = tree.tree.filter(e => e.type==='blob' && (/^v2\/src\//.test(e.path) && /[Ll]eaderboard|upcoming-events|calendar\/page|upcoming\/page|lib\/data|lib\/player/.test(e.path) || /^v2\/public\/(data|open-ratings)\.json$/.test(e.path) || e.path==='README.md'));
for(const file of selected){
  const response=await fetch(`https://raw.githubusercontent.com/Hobsons-Bay-Chess-Club-AU/tournaments/main/${file.path}`);
  if(!response.ok) throw new Error(`${file.path}: ${response.status}`);
  const name=file.path.replaceAll('/','__');
  await writeFile(`reference/tournaments/${name}`, await response.text());
}
console.log(`Saved ${selected.length} relevant repository files.`);
