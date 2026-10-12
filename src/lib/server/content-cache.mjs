import {getCache} from '@vercel/functions';
import {loadContent} from '../content-source.mjs';
import {contentPaths} from './security.mjs';

const TTL=60*60;
const cacheKey=()=>[process.env.CONTENTFUL_SPACE_ID||process.env.CONTENTFUL_SPACEID,process.env.CONTENTFUL_ENVIRONMENT||'master',process.env.SITE_VARIANT||'v2',process.env.VERCEL_DEPLOYMENT_ID||'local'].join(':');
export const contentCache=()=>getCache({namespace:'hbcc-published-v1'});
const pending=new Map();
export function createSnapshotLoader({cache,load,key='published',ttl=TTL}){
 let inflight,generation=0;
 const read=async()=>{
  const existing=await cache.get(key);
  if(existing)return existing;
  if(!inflight){
   const started=generation;
   const work=(async()=>{const content=await load();if(started===generation)await cache.set(key,content,{ttl,name:'Published Contentful website'});return content;})();
   inflight=work;work.finally(()=>{if(inflight===work)inflight=undefined;}).catch(()=>{});
  }
  return inflight;
 };
 return {read,peek:()=>cache.get(key),invalidate:()=>{generation++;inflight=undefined;return cache.delete(key);}};
}
export function publishedLoader(){
 const key=cacheKey();
 if(!pending.has(key)){
  const cache=contentCache();
  pending.set(key,createSnapshotLoader({cache,key,load:async()=>{
   const content=await loadContent({env:{...process.env,CONTENT_SOURCE:'contentful',CONTENTFUL_USE_PREVIEW:'false'}});
   // Retain prior slugs through webhook retries and unpublish/delete events.
   const known=await cache.get(key+':paths')||[];
   await cache.set(key+':paths',[...new Set([...known,...contentPaths(content)])],{ttl:86400,name:'Published website paths'});
   return content;
  }}));
 }
 return pending.get(key);
}
export const knownPublishedPaths=async()=>await contentCache().get(cacheKey()+':paths')||[];
export const previewContent=()=>loadContent({env:{...process.env,CONTENT_SOURCE:'contentful',CONTENTFUL_USE_PREVIEW:'true'}});
