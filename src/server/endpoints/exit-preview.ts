import type {APIRoute} from 'astro';
import {PREVIEW_COOKIE,localReturnPath,privateHeaders} from '../../lib/server/security.mjs';
export const prerender=false;
export const GET:APIRoute=({cookies,url})=>{
 cookies.delete(PREVIEW_COOKIE,{path:'/'});cookies.delete('__prerender_bypass',{path:'/'});
 return new Response(null,{status:303,headers:{...privateHeaders(),Location:localReturnPath(url.searchParams.get('next'))}});
};
