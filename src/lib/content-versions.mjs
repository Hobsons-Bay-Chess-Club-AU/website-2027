import {createReviewEntries} from './review-content.mjs';

// Native V2 entries take precedence after promotion. The original review
// overlay remains available for the saved fixture and the GitHub comparison.
export function contentVersion(items,variant='current'){
 const native=items.find(e=>e.type==='siteSettings'&&e.siteVariant===variant);
 const current=items.filter(e=>!e.id.startsWith('v2-')&&e.siteVariant!=='v2');
 if(!native)return variant==='v2'?createReviewEntries(current):current;
 const selected=items.filter(e=>e.type!=='siteSettings'||e.id===native.id);
 if(variant!=='v2')return selected;
 return selected.map(e=>e.id===native.id?{...e,reviewVersion:'v2',reviewCurrentPaths:current.filter(e=>['page','post'].includes(e.type)&&e.enabled!==false&&e.template!=='home').map(e=>`/${e.slug}/`)}:e.type==='page'&&e.siteVariant==='v2'?{...e,slug:e.slug.replace(/^v2-/,'')}:e.type==='calendarSchedule'&&e.enableUpcoming?{...e,reviewVersion:'v2'}:e);
}
