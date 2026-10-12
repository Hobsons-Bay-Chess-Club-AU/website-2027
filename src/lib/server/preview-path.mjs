const refs=value=>value?.sys?.linkType==='Entry'?[value.sys.id]:Array.isArray(value)?value.flatMap(refs):value&&typeof value==='object'?Object.values(value).flatMap(refs):[];
export function previewPath(content,id){
 const pages=new Map([[content.home.id,'/'],...content.pages.map(p=>[p.id,`/${p.slug}/`]),...content.posts.map(p=>[p.id,`/${p.slug}/`])]);
 if(pages.has(id))return pages.get(id);
 const visited=new Set(),queue=[id];
 while(queue.length){
  const target=queue.shift();if(visited.has(target))continue;visited.add(target);
  if(pages.has(target))return pages.get(target);
  if(target===content.settings.id)return '/';
  for(const entry of Object.values(content.entries))if(refs(entry).includes(target))queue.push(entry.id);
 }
 return null;
}
