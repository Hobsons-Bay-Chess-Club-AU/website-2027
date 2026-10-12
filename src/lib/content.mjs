import {AsyncLocalStorage} from 'node:async_hooks';
import {getContent as getBuildContent} from './content-source.mjs';
export {loadContent,normalizeContent,resolveEntries,referenceContent,pageUrl} from './content-source.mjs';
const requestContent=new AsyncLocalStorage();
export const withContentRequest=(load,render)=>requestContent.run({load,promise:null},render);
export const getContent=()=>{
 const scope=requestContent.getStore();
 if(!scope)return getBuildContent();
 return scope.promise||(scope.promise=scope.load());
};
