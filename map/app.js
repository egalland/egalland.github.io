import {architecture,architectureView} from './model.js';
import {familyGuide,friendlyNode,discoveryPaths,relatedGraph,connectionWords} from './guide.js';
const $=selector=>document.querySelector(selector),escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const host=$('#scene-host'),viewport=$('.architecture-viewport'),flatHost=$('#flat-host'),network=$('#network'),media=matchMedia('(prefers-reduced-motion: reduce)');
let mode='modules',group='all',query='',selected=null,nearby=true,auto=false,graph={nodes:[],edges:[]},engine=null,loading=false,failed=false,flat=false,inView=true,zoom=1,searchTimer,generation=0;
const nodeById=new Map(architecture.nodes.map(node=>[node.id,node]));
const nodeFor=id=>graph.nodes.find(node=>node.id===id)||nodeById.get(id);
const edgeButtons=(edges,key)=>edges.map(edge=>{const node=nodeFor(edge[key]);return '<li><small>'+escape(key==='target'?(connectionWords[edge.kind]??'Utilise'):'Connexion depuis')+'</small><button type="button" data-pick="'+escape(edge[key])+'">'+escape(node?friendlyNode(node).title:edge[key])+' →</button><code>'+escape(node?.path??'')+'</code></li>';}).join('');
function renderInspector(){
 const current=graph.nodes.find(node=>node.id===selected),focused=document.activeElement?.dataset.select;
 if(current){
  const info=friendlyNode(current),outgoing=graph.edges.filter(edge=>edge.source===current.id),incoming=graph.edges.filter(edge=>edge.target===current.id),family=familyGuide[current.group];
  $('#selection-detail').innerHTML='<div class="architecture-role-icon" style="color:'+architecture.groups[current.group].color+'" aria-hidden="true">'+escape(family?.icon)+'</div><header><small class="architecture-eyebrow">'+escape(family?.hint)+'</small><h3>'+escape(info.title)+'</h3></header><p>'+escape(info.description)+'</p><div class="architecture-link-counts"><span><strong>'+outgoing.length+'</strong> liens utilisés</span><span><strong>'+incoming.length+'</strong> liens vers cet élément</span></div>'+
   (current.id.startsWith('group:')?'<button type="button" class="primary-button" data-open-group="'+current.group+'">Explorer ses '+current.count+' composants →</button>':'<label class="architecture-nearby"><input type="checkbox" id="nearby"'+(nearby?' checked':'')+'> Isoler ses connexions pour mieux lire</label><button type="button" class="secondary-button" data-focus="'+escape(current.id)+'">Zoomer sur cet élément</button><details><summary>Voir les détails techniques</summary><code>'+escape(current.path||current.id)+'</code>'+(current.exports.length?'<p>Fonctions disponibles</p><ul>'+current.exports.map(name=>'<li><code>'+escape(name)+'</code></li>').join('')+'</ul>':'')+'</details>')+
   '<section><h4>Ce qu’il utilise <span>'+outgoing.length+'</span></h4><ul>'+edgeButtons(outgoing,'target')+'</ul>'+(outgoing.length?'':'<p>Aucun lien détecté dans ce sens.</p>')+'</section><section><h4>Ce qui l’utilise <span>'+incoming.length+'</span></h4><ul>'+edgeButtons(incoming,'source')+'</ul>'+(incoming.length?'':'<p>Aucun lien détecté dans ce sens.</p>')+'</section><button type="button" class="secondary-button" data-reset>← Revenir aux familles</button>';
 }else{
  $('#selection-detail').innerHTML='<span class="architecture-eyebrow">Premiers pas</span><h3>Lis la carte comme une équipe.</h3><ol class="architecture-onboarding"><li><b>1</b><span><strong>Chaque couleur a un rôle</strong>Les écrans affichent, les traitements calculent, la mémoire conserve.</span></li><li><b>2</b><span><strong>Clique sur un composant</strong>Découvre son rôle, son fichier et les éléments avec lesquels il travaille.</span></li><li><b>3</b><span><strong>Suis ses liaisons</strong>Le vert montre ce qu’il utilise ; le violet, ce qui utilise ta sélection.</span></li></ol><p>Tu peux aussi commencer par l’un des parcours en haut de la carte.</p>';
 }
 $('#node-list-label').textContent='Choisir un élément · '+graph.nodes.length;
 $('#node-list').innerHTML=graph.nodes.map(node=>'<button type="button" data-select="'+escape(node.id)+'" aria-pressed="'+(node.id===selected)+'"><i style="background:'+architecture.groups[node.group].color+'"></i><span>'+escape(friendlyNode(node).title)+'<small>'+escape(node.count?node.count+' composants · '+familyGuide[node.group]?.hint:node.path||familyGuide[node.group]?.hint)+'</small></span></button>').join('')||'<p>Aucun élément ne correspond à cette recherche.</p>';
 if(focused){const button=[...$('#node-list').querySelectorAll('button')].find(item=>item.dataset.select===focused);button?.focus({preventScroll:true});}
}
// Same clustered positions as the source Three.js scene, projected for the 2D fallback.
function positionsFor(nodes){
 const groups=[...new Set(nodes.map(node=>node.group))],points=new Map();
 for(const family of groups){const index=groups.indexOf(family),items=nodes.filter(node=>node.group===family),angle=index/groups.length*Math.PI*2;
  items.forEach((node,i)=>{
   let x,y,z;if(nodes.length<=12){const a=nodes.indexOf(node)/nodes.length*Math.PI*2;x=Math.cos(a)*42;y=Math.sin(a*2)*10;z=Math.sin(a)*42;}
   else{const a=i*2.399963,rad=Math.sqrt((i+.5)/items.length)*(groups.length===1?36:15),cx=groups.length===1?0:Math.cos(angle)*45,cz=groups.length===1?0:Math.sin(angle)*45;x=cx+Math.cos(a)*rad;y=Math.sin(i*.8)*11+(index%3-1)*9;z=cz+Math.sin(a)*rad;}
   points.set(node.id,{x:500+(x*.81-z*.59)*5.5,y:310+(x*.28+z*.37-y*.88)*5.5});
  });
 }
 return points;
}
function applyZoom(){network.querySelector('.network-layer')?.setAttribute('transform','translate(500 310) scale('+zoom+') translate(-500 -310)');}
function renderFlat(){
 const positions=positionsFor(graph.nodes),connected=new Set(selected?[selected]:[]),focused=!!selected;
 for(const edge of graph.edges)if(edge.source===selected||edge.target===selected){connected.add(edge.source);connected.add(edge.target);}
 const edges=graph.edges.map(edge=>{const a=positions.get(edge.source),b=positions.get(edge.target);if(!a||!b)return '';const direction=edge.source===selected?'is-outgoing':edge.target===selected?'is-incoming':focused?'is-muted':'';return '<line class="network-edge '+direction+'" x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+architecture.groups[nodeFor(edge.source).group].color+'"'+(direction==='is-outgoing'?' marker-end="url(#arrow-out)"':direction==='is-incoming'?' marker-end="url(#arrow-in)"':'')+'><title>'+escape(edge.source+' → '+edge.target+' · '+edge.kind)+'</title></line>';}).join('');
 const nodes=graph.nodes.map(node=>{const p=positions.get(node.id),info=friendlyNode(node),large=graph.nodes.length<=12,radius=large?7:node.id===selected?6:3.6;return '<g class="network-node '+(focused&&!connected.has(node.id)?'is-muted':'')+'" data-map-node="'+escape(node.id)+'" aria-pressed="'+(node.id===selected)+'" transform="translate('+p.x+' '+p.y+')"><title>'+escape(info.title+' — '+(node.path||node.count+' composants'))+'</title><circle r="'+radius+'" fill="'+architecture.groups[node.group].color+'"/><circle r="'+(large?18:8)+'" fill="transparent" stroke="none" style="stroke:none"/>'+((large||node.id===selected)?'<text x="0" y="-17" text-anchor="middle">'+escape(info.title)+'</text>'+(node.count?'<text class="node-count" x="0" y="16" text-anchor="middle">'+node.count+' composants</text>':''):'')+'</g>';}).join('');
 network.innerHTML='<defs><marker id="arrow-out" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M1 1 9 5 1 9" fill="none" stroke="#73efc6" stroke-width="1.5"/></marker><marker id="arrow-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M1 1 9 5 1 9" fill="none" stroke="#c2a2ff" stroke-width="1.5"/></marker></defs><g class="network-layer"><g>'+edges+'</g><g>'+nodes+'</g></g>';
 applyZoom();$('#empty-graph').hidden=graph.nodes.length>0;
 network.dataset.nodeCount=String(graph.nodes.length);network.dataset.edgeCount=String(graph.edges.length);
}
function syncMode(){
 const spatial=!!engine&&!flat&&!failed;viewport.dataset.mapMode=spatial?'3d':'2d';viewport.dataset.motion=auto&&spatial&&inView&&!document.hidden&&!media.matches?'rotating':'paused';
 $('#flat-toggle').textContent=spatial?'Vue 2D':failed?'Réessayer la 3D':'Vue 3D';$('#flat-toggle').setAttribute('aria-pressed',String(!spatial));
 $('#auto-rotate').disabled=!spatial||media.matches;$('#auto-rotate').checked=auto&&!media.matches;
 $('#zoom-in').disabled=spatial;$('#zoom-out').disabled=spatial;
 $('#gestures').textContent=spatial?'Glisser pour tourner · molette pour zoomer · cliquer pour comprendre.':'Même graphe en 2D · clique sur un composant ou utilise la liste pour suivre ses liaisons.';
 engine?.setAutoRotate(auto&&inView&&!document.hidden&&!media.matches);
}
function render(){
 graph=architectureView(mode,group,query);if(nearby)graph=relatedGraph(graph,selected);
 const current=graph.nodes.find(node=>node.id===selected);$('#scene-title').textContent=current?friendlyNode(current).title:'La constellation du site';$('#visible-count').textContent=graph.nodes.length+' éléments · '+graph.edges.length+' liaisons';
 $('#view-mode').value=mode;$('#family').value=group;if($('#query').value!==query)$('#query').value=query;
 document.querySelectorAll('[data-family]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.family===group)));
 document.querySelectorAll('[data-discovery]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.discovery===selected)));
 renderInspector();renderFlat();engine?.setGraph(graph);engine?.select(selected);syncMode();
}
function reset(){selected=null;mode='overview';group='all';query='';zoom=1;auto=false;engine?.reset();render();}
function choose(id,focus=false){if(id.startsWith('group:')){selected=id;render();return;}if(!nodeById.has(id))return;if(focus){mode='modules';group='all';query='';}selected=id;zoom=1;render();if(focus)engine?.focus(id);}
function filterFamily(id){selected=null;query='';mode='modules';group=id;zoom=1;render();}
function showError(message){if(failed)return;failed=true;generation++;auto=false;engine?.dispose();engine=null;$('#render-status').textContent=message||'WebGL indisponible dans ce navigateur : les mêmes composants et liaisons restent visibles en 2D.';syncMode();}
async function startEngine(){
 if(engine||loading||failed||flat||!inView)return;loading=true;const version=++generation;$('#render-status').textContent='Préparation de la carte 3D…';
 try{const {createArchitectureScene}=await import('./scene.js');if(version!==generation||flat||!inView)return;engine=createArchitectureScene(host,architecture.groups,id=>choose(id),message=>showError(message));engine.setGraph(graph);engine.select(selected);$('#render-status').textContent='Carte 3D des dépendances détectées dans le code de Market Plus.';syncMode();}
 catch{showError();}finally{loading=false;}
}
$('#total-nodes').textContent=architecture.nodes.length;$('#total-edges').textContent=architecture.edges.length;
$('.architecture-paths').innerHTML=discoveryPaths.map(path=>'<button type="button" data-discovery="'+escape(path.path)+'" aria-pressed="false"><b aria-hidden="true">'+escape(path.icon)+'</b><span><strong>'+escape(path.title)+'</strong><small>'+escape(path.text)+'</small></span><span aria-hidden="true">↗</span></button>').join('');
for(const [id,family] of Object.entries(architecture.groups)){$('#family').add(new Option(familyGuide[id]?.title??family.label,id));}
$('.architecture-legend').innerHTML=Object.entries(architecture.groups).map(([id,family])=>'<button type="button" data-family="'+id+'" aria-pressed="false"><i style="background:'+family.color+'"></i>'+escape(familyGuide[id]?.title??family.label)+'</button>').join('');
$('#view-mode').addEventListener('change',event=>{mode=event.target.value;selected=null;zoom=1;render();});
$('#family').addEventListener('change',event=>{group=event.target.value;selected=null;zoom=1;render();});
$('#query').addEventListener('input',event=>{clearTimeout(searchTimer);query=event.target.value;searchTimer=setTimeout(()=>{selected=null;zoom=1;render();},120);});
$('#auto-rotate').addEventListener('change',event=>{auto=event.target.checked&&!media.matches;syncMode();});
document.addEventListener('change',event=>{if(event.target.id==='nearby'){nearby=event.target.checked;render();}});
document.addEventListener('click',event=>{
 const mapNode=event.target.closest('[data-map-node]');if(mapNode){choose(mapNode.dataset.mapNode);return;}
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.select)choose(button.dataset.select);
 else if(button.dataset.pick)choose(button.dataset.pick,true);
 else if(button.dataset.discovery)choose(button.dataset.discovery,true);
 else if(button.dataset.openGroup)filterFamily(button.dataset.openGroup);
 else if(button.dataset.family)filterFamily(group===button.dataset.family?'all':button.dataset.family);
 else if(button.dataset.focus){if(engine)engine.focus(button.dataset.focus);else{zoom=1.6;applyZoom();}}
 else if(button.id==='reset'||button.hasAttribute('data-reset'))reset();
 else if(button.id==='fit'){zoom=1;applyZoom();engine?.reset();}
 else if(button.id==='zoom-in'){zoom=Math.min(3,zoom+.25);applyZoom();}
 else if(button.id==='zoom-out'){zoom=Math.max(.5,zoom-.25);applyZoom();}
 else if(button.id==='flat-toggle'){
  if(engine){flat=true;generation++;engine.dispose();engine=null;auto=false;$('#render-status').textContent='Vue 2D · mêmes composants, mêmes dépendances.';}
  else{flat=false;failed=false;}
  syncMode();void startEngine();
 }
});
const tooltip=document.createElement('div');tooltip.className='map-hover-label';tooltip.hidden=true;flatHost.append(tooltip);
network.addEventListener('pointermove',event=>{const element=event.target.closest('[data-map-node]'),node=element?nodeFor(element.dataset.mapNode):null;if(!node){tooltip.hidden=true;return;}tooltip.innerHTML=escape(friendlyNode(node).title)+'<small>'+escape(node.path||node.count+' composants')+'</small>';const box=flatHost.getBoundingClientRect();tooltip.style.transform='translate('+Math.min(box.width-210,Math.max(5,event.clientX-box.left+14))+'px,'+Math.max(42,event.clientY-box.top-45)+'px)';tooltip.hidden=false;});
network.addEventListener('pointerleave',()=>{tooltip.hidden=true;});
const observer=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;syncMode();if(inView)void startEngine();});observer.observe(viewport);
document.addEventListener('visibilitychange',syncMode);media.addEventListener('change',()=>{if(media.matches)auto=false;syncMode();});
window.addEventListener('pagehide',()=>{generation++;engine?.dispose();engine=null;loading=false;});
window.addEventListener('pageshow',event=>{if(event.persisted){syncMode();void startEngine();}});
render();void startEngine();
