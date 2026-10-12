import type {APIRoute} from 'astro';
import {previewContent} from '../../lib/server/content-cache.mjs';
import {PREVIEW_COOKIE,PREVIEW_SECONDS,secretMatches,previewSession,validPreviewSession,localReturnPath,privateHeaders} from '../../lib/server/security.mjs';
import {previewPath} from '../../lib/server/preview-path.mjs';

export const prerender=false;
function redirect(path:string){return new Response(null,{status:303,headers:{...privateHeaders(),Location:path}});}
function cookieOptions(request:Request){return {path:'/',httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:(new URL(request.url).protocol==='https:'?'none':'lax') as 'none'|'lax',maxAge:PREVIEW_SECONDS};}
export const GET:APIRoute=async({request,url,cookies})=>{
 const id=url.searchParams.get('entryId')||'';
 const env=url.searchParams.get('env');
 if(env&&env!==(process.env.CONTENTFUL_ENVIRONMENT||'master'))return new Response('Preview environment does not match.',{status:400,headers:privateHeaders()});
 if(id&&!/^[a-zA-Z0-9_-]{1,64}$/.test(id))return new Response('Invalid entry.',{status:400,headers:privateHeaders()});
 if(!validPreviewSession(cookies.get(PREVIEW_COOKIE)?.value,process.env.CONTENTFUL_PREVIEW_SECRET))return redirect('/editor/login/?'+new URLSearchParams({entryId:id,next:localReturnPath(url.searchParams.get('next'))}));
 try{
  const content=await previewContent(),target=id?previewPath(content,id):localReturnPath(url.searchParams.get('next'));
  if(!target)return new Response('This entry has no enabled page to preview.',{status:404,headers:privateHeaders()});
  cookies.set('__prerender_bypass',process.env.ISR_REVALIDATE_TOKEN||'',cookieOptions(request));
  return redirect(target);
 }catch{return new Response('Save the entry and its required linked content, then try preview again.',{status:503,headers:privateHeaders()});}
};
export const POST:APIRoute=async(context)=>{
 const {request,cookies}=context;
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response('Invalid origin.',{status:403,headers:privateHeaders()});
 if(Number(request.headers.get('content-length')||0)>4096)return new Response('Request too large.',{status:413,headers:privateHeaders()});
 const text=await request.text();if(text.length>4096)return new Response('Request too large.',{status:413,headers:privateHeaders()});
 const values=new URLSearchParams(text);
 const next=localReturnPath(values.get('next'));
 const id=values.get('entryId')||'';
 if(!secretMatches(values.get('code'),process.env.CONTENTFUL_PREVIEW_SECRET))return redirect('/editor/login/?'+new URLSearchParams({entryId:id,next,error:'invalid'}));
 if(!process.env.ISR_REVALIDATE_TOKEN||!process.env.CONTENTFUL_PREVIEW_TOKEN&&!process.env.CONTENTFUL_PREVIEW_API)return new Response('Editor preview is not configured.',{status:503,headers:privateHeaders()});
 cookies.set(PREVIEW_COOKIE,previewSession(process.env.CONTENTFUL_PREVIEW_SECRET),cookieOptions(request));
 cookies.set('__prerender_bypass',process.env.ISR_REVALIDATE_TOKEN,cookieOptions(request));
 return redirect('/api/preview/?'+new URLSearchParams({entryId:id,next}));
};
