import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {loadEnv} from './env.mjs';

loadEnv();
const configuration=JSON.parse(await readFile('vercel.json','utf8'));
if(configuration.buildCommand!=='npm run build:vercel'||configuration.outputDirectory)throw new Error('Vercel must use the approved V2 server build with adapter-managed output.');
const token=process.env.VERCEL_API_KEY;
if(!token||!process.env.VERCEL_PROJECT_ID||!process.env.VERCEL_ORG_ID)throw new Error('Set VERCEL_API_KEY, VERCEL_PROJECT_ID and VERCEL_ORG_ID in .env or the deployment environment.');
await mkdir('.vercel',{recursive:true});
await writeFile('.vercel/project.json',JSON.stringify({projectId:process.env.VERCEL_PROJECT_ID,orgId:process.env.VERCEL_ORG_ID}));
const npm=process.env.npm_execpath||join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const args=['exec','--yes','--package=vercel@63.1.2','--','vercel','deploy','--yes','--prod','--token',token];
const dry=process.argv.includes('--dry');
if(dry)args.push('--dry');
const sensitive=Object.entries(process.env).filter(([key,value])=>/TOKEN|SECRET|API_KEY|DELIVERY_API|PREVIEW_API/.test(key)&&value).map(([,value])=>value);
const redact=value=>sensitive.reduce((text,secret)=>text.replaceAll(secret,'[redacted]'),value);
const child=spawn(process.execPath,[npm,...args],{env:process.env,shell:false,stdio:['ignore','pipe','pipe']});
// Buffer complete lines so a credential split across stream chunks cannot leak.
let manifest='';
if(dry)child.stdout.on('data',chunk=>{manifest+=chunk.toString();});
for(const [stream,target] of (dry?[[child.stderr,process.stderr]]:[[child.stdout,process.stdout],[child.stderr,process.stderr]])){
 let pending='';
 stream.on('data',chunk=>{pending+=chunk.toString();const lines=pending.split('\n');pending=lines.pop();for(const line of lines)target.write(redact(line)+'\n');});
 stream.on('end',()=>{if(pending)target.write(redact(pending)+'\n');});
}
child.on('error',()=>{console.error('Could not launch the Vercel CLI.');process.exitCode=1;});
child.on('exit',code=>{
 process.exitCode=code??1;
 if(dry&&code===0){
  const data=JSON.parse(manifest),paths=data.files.map(file=>file.path.replaceAll('\\','/'));
  const privateFiles=paths.filter(path=>/^(?:\.env(?:\.|$)|reference\/|contentful\/|\.git\/)|\.docx$/i.test(path));
  if(privateFiles.length){console.error('Private files were included in the deployment manifest.');process.exitCode=1;return;}
  console.log(JSON.stringify({framework:data.framework,fileCount:data.fileCount,totalSize:data.totalSize,privateFiles:privateFiles.length,includesBuildRunner:paths.includes('scripts/run-astro.mjs'),includesAudit:paths.includes('docs/ALL-PAGES-AUDIT.md')}));
 }
});
