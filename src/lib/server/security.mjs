import {createHmac,timingSafeEqual} from 'node:crypto';

export const PREVIEW_COOKIE='hbcc_preview';
export const PREVIEW_SECONDS=60*60*2;
export function secretMatches(actual,expected){
 if(typeof actual!=='string'||typeof expected!=='string'||expected.length<24)return false;
 const a=Buffer.from(actual),b=Buffer.from(expected);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export function previewSession(secret,now=Date.now()){
 const expires=Math.floor(now/1000)+PREVIEW_SECONDS;
 return expires+'.'+createHmac('sha256',secret).update('hbcc-preview:'+expires).digest('base64url');
}
export function validPreviewSession(value,secret,now=Date.now()){
 if(!secret||!value)return false;
 const [expiry,signature,...extra]=value.split('.');
 const expires=Number(expiry);
 if(extra.length||!Number.isSafeInteger(expires)||expires<=now/1000||expires>now/1000+PREVIEW_SECONDS)return false;
 return secretMatches(signature,createHmac('sha256',secret).update('hbcc-preview:'+expires).digest('base64url'));
}
export function localReturnPath(value,fallback='/'){
 if(typeof value!=='string'||!/^\/(?:[a-z0-9-]+\/)*(?:[a-z0-9-]+\/?)?$/.test(value)||/^\/(?:api|editor)(?:\/|$)/.test(value))return fallback;
 return value;
}
export function contentPaths(content){
 return [...new Set(['/','/news/','/calendar.ics','/sitemap.xml',...content.pages.map(p=>`/${p.slug}/`),...content.posts.map(p=>`/${p.slug}/`)])];
}
export function webhookEvent(payload,topic,{space,environment}){
 if(!/^ContentManagement\.(Entry|Asset)\.(publish|unpublish|delete)$/.test(topic||''))throw new Error('Unsupported webhook topic.');
 if(payload?.sys?.space?.sys?.id!==space||payload?.sys?.environment?.sys?.id!==environment)throw new Error('Webhook space or environment does not match.');
 if(!/^[a-zA-Z0-9_-]{1,64}$/.test(payload.sys.id||''))throw new Error('Webhook entry ID is invalid.');
 return {id:payload.sys.id,resource:topic.split('.')[1],action:topic.split('.')[2],revision:payload.sys.publishedCounter||payload.sys.revision||null};
}
export function privateHeaders(){return {'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'same-origin'};}
