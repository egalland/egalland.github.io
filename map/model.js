const source=await fetch(new URL('./architecture.json',import.meta.url)).then(response=>{if(!response.ok)throw new Error('Carte indisponible');return response.json();});
                                                                                                                                 
                                                                       
                                                                                  
export const architecture=source                                                                                                                       ;
export function architectureView(mode                     ,group       ,query       )                  {
 const q=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const shown=architecture.nodes.filter(n=>(group==='all'||n.group===group)&&(!q||[n.label,n.path,n.description,...n.exports].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)));
 if(mode==='modules'||group!=='all'||q){const ids=new Set(shown.map(n=>n.id));return {nodes:shown,edges:architecture.edges.filter(e=>ids.has(e.source)&&ids.has(e.target))};}
 const nodes=Object.entries(architecture.groups).map(([id,g])=>({id:'group:'+id,label:g.label,path:'',group:id,description:`${architecture.nodes.filter(n=>n.group===id).length} composants. Sélectionne « Ouvrir ce groupe » pour les explorer.`,exports:[],count:architecture.nodes.filter(n=>n.group===id).length})).filter(n=>n.count);
 const links=new Map                         ();for(const e of architecture.edges){const a=architecture.nodes.find(n=>n.id===e.source) ,b=architecture.nodes.find(n=>n.id===e.target) ;if(a.group!==b.group)links.set(a.group+'>'+b.group,{source:'group:'+a.group,target:'group:'+b.group,kind:'group'});}
 return {nodes,edges:[...links.values()]};
}
