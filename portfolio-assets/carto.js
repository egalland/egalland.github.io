import {flowNodes,flowLinks,flowStages,flowJourneys,flowConnections,flowLinkKey,journeyLinks,flowPath} from './carto-data.js';
const root=document.querySelector('#market-carto');
if(root){
 const $=selector=>root.querySelector(selector),all=selector=>[...root.querySelectorAll(selector)];
 const host=$('.carto-scene'),viewport=$('.carto-viewport'),status=$('.carto-status'),detail=$('.carto-detail');
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let selected=null,journeyId='all',step=0,wantsMotion=!media.matches,flat=false,engine=null,loading=false,inView=false,failed=false,interactive=false,generation=0;
 const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const nodesById=new Map(flowNodes.map(node=>[node.id,node]));
 const built=()=>root.dataset.construction==='done'||!root.classList.contains('construction-unit');
 const journey=()=>flowJourneys.find(item=>item.id===journeyId);
 const related=()=>{
  const route=journey();if(route)return {nodes:route.nodes,links:journeyLinks(route)};
  if(!selected)return {nodes:[],links:[]};
  const connection=flowConnections(selected),links=[...connection.inputs,...connection.outputs];
  return {nodes:[selected,...connection.inputs.map(link=>link.source),...connection.outputs.map(link=>link.target)],links:links.map(flowLinkKey)};
 };
 function renderDetails(){
  if(!selected){
   detail.innerHTML='<span class="carto-detail-stage">LE CIRCUIT COMPLET</span><h4>Un point, quatre étapes.</h4><p class="carto-description">Sélectionne un module sur la carte pour voir ce qu’il reçoit, ce qu’il produit et les outils auxquels il est relié.</p><div class="carto-overview-stages">'+flowStages.map((stage,i)=>'<div><strong style="color:'+stage.color+'">0'+(i+1)+' / '+escape(stage.title.toUpperCase())+'</strong><p>'+escape(stage.hint)+'</p></div>').join('')+'</div>';return;
  }
  const node=nodesById.get(selected),connection=flowConnections(selected);
  detail.innerHTML='<span class="carto-detail-stage" style="color:'+node.color+'">0'+(node.stage+1)+' / '+escape(flowStages[node.stage].title.toUpperCase())+'</span><h4>'+escape(node.title)+'</h4><p class="carto-description">'+escape(node.description)+'</p><div class="carto-io">'+[['REÇOIT',node.reads],['PRODUIT',node.produces]].map(([label,values])=>'<div><h5>'+label+'</h5><ul>'+values.map(value=>'<li>'+escape(value)+'</li>').join('')+'</ul></div>').join('')+'</div><div class="carto-connections"><span>MODULES CONNECTÉS</span>'+[...new Set([...connection.inputs.map(link=>link.source),...connection.outputs.map(link=>link.target)])].map(id=>'<button type="button" data-related="'+id+'">'+escape(nodesById.get(id).title)+' ↗</button>').join('')+'</div>';
 }
 function renderRoute(){
  const route=journey();$('.carto-tour').hidden=!route;
  if(!route)return;
  $('.carto-tour-steps').innerHTML=route.nodes.map((id,i)=>'<button type="button" data-step="'+i+'"'+(i===step?' aria-current="step"':'')+'><b>'+(i+1)+'</b><span>'+escape(nodesById.get(id).title)+'</span></button>').join('');
  $('.carto-tour-caption p').textContent=route.steps[step];$('#carto-prev').disabled=step===0;$('#carto-next').disabled=step===route.nodes.length-1;
 }
 function renderFlat(){
  const highlighted=related().links;
  $('.carto-flat-links').innerHTML='<defs><marker id="carto-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 9 5 1 9" fill="none" stroke="#86d6c0" stroke-width="1.5"/></marker></defs>'+flowLinks.map(link=>{
   const active=!highlighted.length||highlighted.includes(flowLinkKey(link));
   return '<g class="'+(active?'is-route':'is-dim')+'"><path class="carto-pipe" d="'+flowPath(link)+'" marker-end="url(#carto-arrow)"/><path class="carto-pulse" d="'+flowPath(link)+'"/></g>';
  }).join('');
 }
 function sync(){
  const set=related(),moving=wantsMotion&&!media.matches&&inView&&built()&&!document.hidden;
  viewport.dataset.motion=moving?'playing':'paused';viewport.dataset.cartoMode=engine&&!flat&&!failed?'3d':'flat';
  all('[data-flow-node]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.flowNode===selected));button.classList.toggle('is-muted',set.nodes.length>0&&!set.nodes.includes(button.dataset.flowNode));});
  all('[data-journey]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.journey===journeyId)));
  $('#carto-motion').textContent=wantsMotion?'Ⅱ Flux':'▷ Flux';$('#carto-motion').setAttribute('aria-pressed',String(wantsMotion));$('#carto-motion').disabled=media.matches;
  $('#carto-mode').textContent=flat||failed?'Vue 3D':'Vue à plat';$('#carto-mode').setAttribute('aria-pressed',String(flat||failed));
  $('#carto-interact').textContent=interactive?'Quitter la rotation':'Manipuler la 3D';$('#carto-interact').setAttribute('aria-pressed',String(interactive));$('#carto-interact').disabled=!engine||flat||failed;
  $('#carto-reset').disabled=!engine||flat||failed;
  $('.carto-drag-hint').textContent=interactive?'Glisser : tourner · molette : zoomer.':'Sélectionne un module · défilement de la page libre.';
  engine?.update({selected,nodes:set.nodes,links:set.links,animate:moving,interactive:interactive&&inView});
 }
 function update(){renderDetails();renderRoute();renderFlat();sync();}
 function chooseNode(id){
  const route=journey(),index=route?.nodes.indexOf(id)??-1;
  if(route&&index<0)journeyId='all';else if(index>=0)step=index;
  selected=id;update();
 }
 function chooseJourney(id){journeyId=id;step=0;selected=journey()?.nodes[0]??null;engine?.reset();update();}
 function fail(){if(failed)return;failed=true;generation++;engine?.dispose();engine=null;status.textContent='3D indisponible · la carte à plat reste interactive.';sync();}
 async function start3D(){
  if(flat||failed||engine||loading||!inView||!built())return;
  loading=true;const version=++generation;status.textContent='Préparation de la vue 3D…';
  try{
   const {createFlowScene}=await import('./carto-scene.js');
   if(version!==generation||flat||failed||!inView){loading=false;return;}
   engine=createFlowScene(host,fail);status.textContent='Carte 3D · 11 modules · sélectionne un module';sync();
  }catch{fail();}finally{loading=false;}
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||!root.contains(button))return;
  if(button.dataset.flowNode)chooseNode(button.dataset.flowNode);
  else if(button.dataset.related)chooseNode(button.dataset.related);
  else if(button.dataset.journey)chooseJourney(button.dataset.journey);
  else if(button.dataset.step!==undefined){const route=journey();step=Number(button.dataset.step);selected=route.nodes[step];update();}
  else if(button.id==='carto-motion'){wantsMotion=!wantsMotion;sync();}
  else if(button.id==='carto-mode'){
   if(failed){failed=false;flat=false;}else flat=!flat;
   if(flat){generation++;engine?.dispose();engine=null;loading=false;interactive=false;status.textContent='Carte à plat · sélectionne un module';}
   sync();void start3D();
  }else if(button.id==='carto-interact'){interactive=!interactive;sync();}
  else if(button.id==='carto-reset'){engine?.reset();interactive=false;sync();}
  else if(button.id==='carto-prev'||button.id==='carto-next'){
   const route=journey();step=Math.max(0,Math.min(route.nodes.length-1,step+(button.id==='carto-next'?1:-1)));selected=route.nodes[step];update();
  }
 });
 const observer=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;if(!inView)interactive=false;sync();void start3D();},{rootMargin:'0px'});observer.observe(viewport);
 const construction=new MutationObserver(()=>{sync();void start3D();});construction.observe(root,{attributes:true,attributeFilter:['data-construction']});
 document.addEventListener('visibilitychange',()=>{sync();if(!document.hidden)void start3D();});
 media.addEventListener('change',()=>{wantsMotion=!media.matches;sync();});
 // Native touch scrolling stays free until the visitor explicitly manipulates the view.
 update();
}
