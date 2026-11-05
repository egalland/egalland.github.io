const tabs=[...document.querySelectorAll('[data-map-view]')];
const panels={components:document.querySelector('#components-view'),data:document.querySelector('#data-view')};
const pending={};
function load(view){
 if(pending[view])return pending[view];
 pending[view]=import(view==='data'?'./data-view.js':'./app.js').catch(()=>{
  const status=document.querySelector(view==='data'?'#data-status':'#render-status');
  status.textContent=view==='data'?'Le modèle n’a pas pu être chargé. Réessaie dans quelques instants.':'La carte n’a pas pu être chargée. Réessaie dans quelques instants.';
  status.setAttribute('role','alert');
  const retry=document.querySelector(view==='data'?'#data-retry':'#load-retry');retry.hidden=false;retry.addEventListener('click',()=>location.reload(),{once:true});
 });
 return pending[view];
}
function activate(view,updateAddress=false){
 if(!(view in panels))view='components';
 tabs.forEach(tab=>{const active=tab.dataset.mapView===view;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
 for(const [id,panel] of Object.entries(panels))panel.hidden=id!==view;
 document.documentElement.dataset.mapView=view;
 if(updateAddress)history.replaceState(null,'',view==='data'?'#data':'#components');
 void load(view);
}
for(const [index,tab] of tabs.entries()){
 tab.addEventListener('click',()=>activate(tab.dataset.mapView,true));
 tab.addEventListener('keydown',event=>{
  let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
  if(next===undefined)return;event.preventDefault();tabs[next].focus();activate(tabs[next].dataset.mapView,true);
 });
}
window.addEventListener('hashchange',()=>activate(location.hash==='#data'?'data':'components'));
activate(location.hash==='#data'?'data':'components');
