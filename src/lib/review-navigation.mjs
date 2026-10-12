import {normalizeBase,withBase} from './site-url.mjs';

// Compare the same published page; V2-only pages return to the current homepage.
export function reviewNavigation({review=false,basePath='/',pathname='/',sharedPaths=[]}={}) {
 const base=normalizeBase(basePath);
 if(review&&!base.endsWith('/v2/'))throw new Error('V2 review navigation needs a /v2/ base path.');
 const currentBase=review?normalizeBase(base.slice(0,-3)):base;
 const reviewBase=withBase('/v2/',currentBase);
 const localPath=pathname.startsWith(base)?'/'+pathname.slice(base.length):'/';
 const page=['/','/news/',...sharedPaths].includes(localPath)?localPath:'/';
 return {
  otherVersion:review?'current':'v2',
  switchHref:withBase(page,review?currentBase:reviewBase),
  changesHref:withBase('/review/',reviewBase),
 };
}
