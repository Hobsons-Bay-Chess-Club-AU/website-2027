// A navigation link may point back to a page which is already published. That
// is a valid editorial graph, not a recursive render. New content dependencies
// still publish first; cycles between nested sections remain an error.
export function publicationOrder(proposals){
 const planned=new Map(proposals.map(p=>[p.id,p])),order=[],visited=new Set(),visiting=new Set();
 const dependencies=v=>v?.sys?.linkType==='Entry'?[v.sys.id]:Array.isArray(v)?v.flatMap(dependencies):v&&typeof v==='object'?Object.values(v).flatMap(dependencies):[];
 const visit=id=>{
  if(visited.has(id))return;
  if(visiting.has(id))throw new Error('Circular publication dependency: '+id);
  visiting.add(id);
  for(const dependency of dependencies(planned.get(id).fields)){
   const p=planned.get(dependency);
   if(p&&!(p.type==='page'&&p.before?.sys.publishedVersion))visit(dependency);
  }
  visiting.delete(id);visited.add(id);order.push(id);
 };
 for(const id of planned.keys())visit(id);
 return order;
}
