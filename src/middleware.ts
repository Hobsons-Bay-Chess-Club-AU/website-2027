import {defineMiddleware} from 'astro:middleware';
import {withContentRequest} from './lib/content.mjs';
import {publishedLoader,previewContent} from './lib/server/content-cache.mjs';
import {PREVIEW_COOKIE,validPreviewSession,privateHeaders} from './lib/server/security.mjs';

export const onRequest=defineMiddleware(async(context,next)=>{
 if(import.meta.env.SITE_DEPLOY_TARGET!=='vercel'||context.isPrerendered)return next();
 if(/^\/(api|editor)(?:\/|$)/.test(context.url.pathname))return next();
 const preview=validPreviewSession(context.cookies.get(PREVIEW_COOKIE)?.value,process.env.CONTENTFUL_PREVIEW_SECRET);
 context.locals.contentPreview=preview;
 try{
  const response=await withContentRequest(preview?previewContent:publishedLoader().read,next);
  if(preview){for(const [name,value] of Object.entries(privateHeaders()))response.headers.set(name,value);}
  response.headers.set('X-Content-Mode',preview?'draft':'published');
  return response;
 }catch(error){
  console.error('HBCC rendering failed:',error instanceof Error?error.message:'Unknown content error');
  return new Response('Content is temporarily unavailable. Please try again shortly.',{status:503,headers:privateHeaders()});
 }
});
