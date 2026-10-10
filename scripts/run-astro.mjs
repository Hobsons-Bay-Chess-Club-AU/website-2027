import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {loadEnv} from './env.mjs';
loadEnv();
const packageUrl=new URL('../node_modules/astro/package.json',import.meta.url);
const pkg=JSON.parse(await readFile(packageUrl,'utf8'));
const executable=fileURLToPath(new URL(typeof pkg.bin==='string'?pkg.bin:pkg.bin.astro,packageUrl));
const mode=process.argv[2];
const env={...process.env};
let args;
if(mode==='production'){env.CONTENT_SOURCE='contentful';args=['build'];}
else if(mode==='cms-preview'){env.CONTENTFUL_USE_PREVIEW='true';env.CONTENT_SOURCE='contentful';args=['dev','--host','127.0.0.1','--port','4328'];}
else throw new Error('Choose production or cms-preview.');
const child=spawn(process.execPath,[executable,...args],{env,stdio:'inherit',shell:false});
child.on('error',()=>{console.error('Could not launch Astro. Run npm ci first.');process.exitCode=1;});
child.on('exit',(code)=>{process.exitCode=code??1;});
