import type {APIRoute} from 'astro';
// Injected only into the Vercel server build.
import {publishedLoader,knownPublishedPaths} from '../../lib/server/content-cache.mjs';
import {secretMatches,webhookEvent,contentPaths,privateHeaders} from '../../lib/server/security.mjs';

export const prerender=false;
const reply=(data:object,status=200)=>new Response(JSON.stringify(data),{status,headers:{...privateHeaders(),'Content-Type':'application/json'}});
export const POST:APIRoute=async({request})=>{
 if(!secretMatches(request.headers.get('x-hbcc-webhook-secret'),process.env.CONTENTFUL_WEBHOOK_SECRET))return reply({error:'Unauthorized'},401);
 if(Number(request.headers.get('content-length')||0)>1024*1024)return reply({error:'Payload too large'},413);
 let event;
 try{
  const text=await request.text();if(Buffer.byteLength(text)>1024*1024)return reply({error:'Payload too large'},413);
  event=webhookEvent(JSON.parse(text),request.headers.get('x-contentful-topic'),{space:process.env.CONTENTFUL_SPACE_ID||process.env.CONTENTFUL_SPACEID,environment:process.env.CONTENTFUL_ENVIRONMENT||'master'});
 }catch{return reply({error:'Invalid Contentful event'},400);}
 try{
  const loader=publishedLoader(),previous=await loader.peek();
  await loader.invalidate();
  let content;
  for(let attempt=0;attempt<5;attempt++){
   content=await loader.read();
   const revision=(event.resource==='Asset'?content.assetRevisions:content.entryRevisions)?.[event.id];
   // Newly uploaded, unlinked assets are absent from an entries/include graph.
   // Their publication cannot affect a page until a referencing entry publishes.
   const unlinkedAsset=event.resource==='Asset'&&revision===undefined&&!previous?.assetRevisions?.[event.id];
   const ready=event.action==='publish'?(!event.revision||revision>=event.revision||unlinkedAsset):revision===undefined;
   if(ready)break;
   await loader.invalidate();
   if(attempt===4)throw new Error('Contentful delivery has not caught up.');
   await new Promise(resolve=>setTimeout(resolve,600*(attempt+1)));
  }
  const paths=[...new Set([...contentPaths(content),...(previous?contentPaths(previous):[]),...await knownPublishedPaths()])];
  const origin=new URL(process.env.SITE_URL||'');
  if(origin.protocol!=='https:'&&!(import.meta.env.DEV&&origin.hostname==='127.0.0.1'))throw new Error('Invalid site origin');
  const failures:string[]=[];
  let index=0;
  await Promise.all(Array.from({length:4},async()=>{
   while(index<paths.length){
    const path=paths[index++];
    try{
     const result=await fetch(new URL(path,origin),{method:'HEAD',redirect:'manual',headers:{'x-prerender-revalidate':process.env.ISR_REVALIDATE_TOKEN||''},signal:AbortSignal.timeout(15000)});
     if(!result.ok&&result.status!==404)failures.push(path);
    }catch{failures.push(path);}
   }
  }));
  if(failures.length)return reply({error:'Some pages could not be revalidated',failedPaths:failures},503);
  return reply({revalidated:true,event:event.action,paths:paths.length});
 }catch{return reply({error:'Revalidation failed; Contentful should retry this delivery.'},503);}
};
export const GET:APIRoute=()=>reply({error:'Use a signed Contentful POST'},405);
