import notes from '../data/review-notes.json';
import {getContent} from '../lib/content.mjs';
import {siteUrl} from '../lib/site-url.mjs';
export async function getStaticPaths(){
 const {settings}=await getContent();
 return settings.reviewVersion?[{params:{reviewFile:'review-notes.md'}}]:[];
}
export async function GET({site}){
 const {settings}=await getContent();
 if(!settings.reviewVersion)return new Response('Review notes are available in /v2/.',{status:404});
 const url=path=>new URL(siteUrl(path),site).href;
 const body=[`# HBCC V2 — Team Review`, `Prepared ${notes.date}`,`Review website: ${url('/')}`,`Changes and checklist: ${url('/review/')}`,
  '## Changes in this version',...notes.changes.map((c,i)=>`${i+1}. **${c.title}** — ${c.detail}${c.path?'\n   '+url(c.path):''}`),
  '## Action links: before and after',['| Action | Current version | V2 proposal |','| --- | --- | --- |',...notes.linkRepairs.map(row=>'| '+row.join(' | ')+' |')].join('\n'),
  '## Club input still needed',...notes.pending.map(p=>`- **${p.title}** (${p.owner}): ${p.detail}`),
  '## Review checklist',...notes.checks.map(c=>'- [ ] '+c),
  '## Feedback','Reply to the person who shared the link. Include the page URL, device, expected behaviour and suggested change. Checkboxes on the website do not submit feedback.',
  'The current published CMS content and WordPress production domain are unchanged. Accepted changes can be promoted into Contentful after club review.',
 ].join('\n\n')+'\n';
 return new Response(body,{headers:{'Content-Type':'text/markdown; charset=utf-8'}});
}
