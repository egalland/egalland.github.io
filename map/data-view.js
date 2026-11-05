import {selectModel,visibleColumns,layoutModel,relationPath,normalize} from './data-layout.js';
const root=document.querySelector('#data-view'),$=selector=>root.querySelector(selector),escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const response=await fetch(new URL('./data-model.json',import.meta.url));if(!response.ok)throw Error('Modèle indisponible');
const model=await response.json();
const byId=new Map(model.tables.map(table=>[table.id,table])),groups=new Map(model.groups.map(group=>[group.id,group]));
const scroller=$('#data-scroll'),world=$('#data-world'),size=$('#data-size');
let domain='all',query='',logical=false,full=false,selected='market_definitions',zoom=.85,current,layout,first=true,searchTimer;
function allRelations(){return model.relations.filter(rel=>logical||rel.kind==='foreign-key');}
function physicalField(table,name){return model.relations.filter(rel=>rel.kind==='foreign-key'&&rel.source===table.id&&rel.sourceFields.includes(name));}
function badges(table,column){return (column.primary?'<b class="erd-key erd-primary">PK</b>':'')+(physicalField(table,column.name).length?'<b class="erd-key erd-foreign">FK</b>':'')+(column.unique?'<b class="erd-key erd-unique">UQ</b>':'');}
function renderTables(){
 const connected=new Set(selected?[selected]:[]);for(const rel of current.relations)if(rel.source===selected||rel.target===selected){connected.add(rel.source);connected.add(rel.target);}
 $('#data-tables').innerHTML=[...layout.items.values()].map(item=>{
  const {table,fields}=item,color=groups.get(table.group).color;
  return '<article class="erd-table'+(table.id===selected?' is-selected':'')+(selected&&!connected.has(table.id)?' is-muted':'')+'" data-erd-table="'+table.id+'" style="left:'+item.x+'px;top:'+item.y+'px;width:'+item.width+'px;height:'+item.height+'px;--entity-color:'+color+'"><header><button type="button" data-erd-select="'+table.id+'" aria-pressed="'+(selected===table.id)+'"><span>'+escape(table.label)+'</span><code>'+escape(table.id)+'</code></button><small>'+escape(groups.get(table.group).label)+(table.definition==='runtime'?' · à la demande':'')+'</small></header><div class="erd-fields">'+fields.map(column=>'<div class="erd-field" data-erd-column="'+escape(column.name)+'"><span class="erd-field-name">'+badges(table,column)+'<code>'+escape(column.name)+'</code></span><span class="erd-field-type">'+(column.json?'<i title="Document JSON sérialisé dans une colonne TEXT">JSON</i>':'')+escape(column.type)+(column.notNull?'<b title="NOT NULL déclaré">*</b>':'')+'</span></div>').join('')+'</div><button class="erd-table-foot" type="button" data-erd-detail="'+table.id+'">'+(fields.length===table.columns.length?table.columns.length+' colonnes':fields.length+' / '+table.columns.length+' colonnes')+' <span>Voir le détail →</span></button></article>';
 }).join('');
}
function renderLinks(){
 const svg=$('#data-links');svg.setAttribute('width',layout.width);svg.setAttribute('height',layout.height);svg.setAttribute('viewBox','0 0 '+layout.width+' '+layout.height);
 svg.innerHTML='<defs><marker id="erd-one" viewBox="0 0 16 16" refX="14" refY="8" markerWidth="16" markerHeight="16" orient="auto"><path d="M7 2V14M12 2V14" fill="none" stroke="#8ddfc4" stroke-width="1.5"/></marker><marker id="erd-many" viewBox="0 0 24 18" refX="1" refY="9" markerWidth="24" markerHeight="18" orient="auto-start-reverse"><path d="M2 2 13 9 2 16M2 9H13" fill="none" stroke="#8ddfc4" stroke-width="1.5"/><circle cx="19" cy="9" r="3" fill="#0d1727" stroke="#8ddfc4" stroke-width="1.5"/></marker></defs>'+current.relations.map((rel,index)=>{
  const route=relationPath(rel,layout,index);if(!route)return '';
  const isLogical=rel.kind==='application',active=rel.source===selected||rel.target===selected;
  return '<g class="erd-relation'+(isLogical?' is-logical':'')+(active?' is-active':selected?' is-muted':'')+'" data-erd-relation="'+escape(rel.id)+'"><title>'+escape(rel.source+'.'+rel.sourceFields.join(', ')+' → '+rel.target+'.'+rel.targetFields.join(', ')+(isLogical?' · référence applicative':' · clé étrangère SQL'))+'</title><path d="'+route.path+'"'+(isLogical?'':' marker-start="url(#erd-many)" marker-end="url(#erd-one)"')+'/>'+(!isLogical?'<text x="'+route.sourceLabelX+'" y="'+(route.source.y-9)+'">'+escape(rel.childCardinality)+'</text><text x="'+route.targetLabelX+'" y="'+(route.target.y-9)+'">'+escape(rel.parentCardinality)+'</text>':'')+'</g>';
 }).join('');
 svg.dataset.foreignKeys=String(current.relations.filter(rel=>rel.kind==='foreign-key').length);svg.dataset.applicationLinks=String(current.relations.filter(rel=>rel.kind==='application').length);
}
function relationDetails(table,rel){
 const outgoing=rel.source===table.id,other=byId.get(outgoing?rel.target:rel.source),physical=rel.kind==='foreign-key';
 return '<li><span class="data-relation-kind '+(physical?'is-fk':'is-code')+'">'+(physical?'FK SQL':'Référence applicative')+'</span><button type="button" data-erd-select="'+other.id+'">'+escape(other.label)+(outgoing?' ↗':' ↙')+'</button><code>'+escape(rel.source+'.'+rel.sourceFields.join(', ')+' → '+rel.target+'.'+rel.targetFields.join(', '))+'</code><p>'+(physical?escape('1 '+byId.get(rel.target).label+' → '+rel.childCardinality+' '+byId.get(rel.source).label+'. Suppression : '+rel.onDelete+'.'):escape(rel.description+' Cardinalité non imposée par SQLite.'))+'</p>'+(rel.condition?'<small>Condition : <code>'+escape(rel.condition)+'</code></small>':'')+'</li>';
}
function renderDetail(){
 const table=byId.get(selected);const detail=$('#data-detail');
 if(!table){detail.innerHTML='<span class="architecture-eyebrow">Modèle logique des données</span><h3>Choisis une table.</h3><p>Les champs, clés, index et relations de la table apparaissent ici. Les références gérées par le code sont facultatives et restent distinctes des contraintes SQL.</p>';return;}
 const relations=allRelations().filter(rel=>rel.source===table.id||rel.target===table.id),pks=table.columns.filter(column=>column.primary).sort((a,b)=>a.primaryOrder-b.primaryOrder),unique=table.indexes.filter(index=>index.unique);
 detail.innerHTML='<span class="architecture-eyebrow" style="color:'+groups.get(table.group).color+'">'+escape(groups.get(table.group).label)+'</span><h3>'+escape(table.label)+'</h3><code class="data-table-name">'+escape(table.id)+'</code><p>'+escape(table.description)+'</p><div class="data-detail-badges"><span>'+table.columns.length+' colonnes</span><span>'+escape(table.definition==='runtime'?'SQL à la demande':'Drizzle + migrations')+'</span></div><button type="button" class="secondary-button" data-erd-center="'+table.id+'">Centrer cette table</button><section class="data-key-summary"><h4>Clé primaire</h4><p>'+(pks.length?'<code>'+escape(pks.map(column=>column.name).join(' + '))+'</code>':'Aucune PK déclarée. '+(unique.length?'L’unicité est assurée par un index composite.':''))+'</p></section><details class="data-columns-detail" open><summary>Colonnes · '+table.columns.length+'</summary><div class="data-columns-scroll"><table><caption class="sr-model-only">Colonnes de '+escape(table.id)+'</caption><thead><tr><th>Champ / clé</th><th>Type</th><th>NOT NULL</th></tr></thead><tbody>'+table.columns.map(column=>'<tr><td>'+badges(table,column)+'<code>'+escape(column.name)+'</code>'+(column.json?'<small>Document JSON dans TEXT</small>':'')+'</td><td>'+escape(column.type)+'</td><td>'+(column.notNull?'Oui':column.primary&&column.type==='INTEGER'&&pks.length===1?'PK / rowid':'Non déclaré')+'</td></tr>').join('')+'</tbody></table></div></details><details class="data-indexes" open><summary>Index · '+table.indexes.length+'</summary>'+table.indexes.map(index=>'<p><b>'+escape(index.unique?'UNIQUE':'INDEX')+'</b> <code>'+escape(index.columns.join(' + '))+'</code><small>'+escape(index.name)+'</small></p>').join('')+(table.indexes.length?'':'<p>Aucun index additionnel déclaré.</p>')+'</details><section><h4>Relations · '+relations.length+'</h4><ul class="data-relation-list">'+relations.map(rel=>relationDetails(table,rel)).join('')+'</ul>'+(relations.length?'':'<p>Aucune clé étrangère déclarée pour cette table.'+(!logical?' Active « Liens applicatifs » pour voir les références traitées par le code.':'')+'</p>')+'</section>'+
  (['weekly_points','analyst_weekly_points','point_drafts'].includes(table.id)?'<details class="data-json-detail"><summary>Que contient le JSON payload ?</summary><p>'+escape(model.documents[0].note)+'</p><div>'+model.documents[0].fields.map(field=>'<code>'+escape(field)+'</code>').join('')+'</div><small>'+escape(model.documents[0].source)+'</small></details>':'')+
  '<details class="data-source-detail"><summary>Définitions dans le code</summary>'+table.sources.map(source=>'<code>'+escape(source)+'</code>').join('')+'</details>';
}
function renderList(){
 const previous=document.activeElement?.dataset.erdSelect;
 $('#data-list-title').textContent='Choisir une table · '+current.tables.length;
 $('#data-list').innerHTML=current.tables.map(table=>'<button type="button" data-erd-select="'+table.id+'" aria-pressed="'+(table.id===selected)+'"><i style="background:'+groups.get(table.group).color+'"></i><span>'+escape(table.label)+'<code>'+escape(table.id)+'</code></span></button>').join('')||'<p>Aucune table ne correspond.</p>';
 if(previous){const match=[...$('#data-list').querySelectorAll('button')].find(button=>button.dataset.erdSelect===previous);match?.focus({preventScroll:true});}
}
function applyZoom(anchor){
 const center=anchor??{x:(scroller.scrollLeft+scroller.clientWidth/2)/(Number(world.dataset.zoom)||zoom),y:(scroller.scrollTop+scroller.clientHeight/2)/(Number(world.dataset.zoom)||zoom)};
 world.style.width=layout.width+'px';world.style.height=layout.height+'px';world.style.transform='scale('+zoom+')';world.dataset.zoom=String(zoom);size.style.width=layout.width*zoom+'px';size.style.height=layout.height*zoom+'px';$('#data-zoom-label').value=Math.round(zoom*100)+' %';
 scroller.scrollTo({left:Math.max(0,center.x*zoom-scroller.clientWidth/2),top:Math.max(0,center.y*zoom-scroller.clientHeight/2),behavior:'instant'});
}
function centerTable(id,readable=false){
 const item=layout.items.get(id);if(!item)return;if(readable)zoom=Math.max(.85,Math.min(zoom,1.25));
 applyZoom({x:item.x+item.width/2,y:item.y+Math.min(item.height/2,220)});
}
function render(center=false){
 const active=document.activeElement,focusId=active?.dataset.erdSelect??active?.dataset.erdDetail,focusInPlan=!!active?.closest('#data-tables');
 current=selectModel(model,{domain,query,logical});layout=layoutModel(current.tables,current.relations,full);
 if(!current.tables.some(table=>table.id===selected))selected=null;
 renderTables();renderLinks();renderDetail();renderList();
 if(focusId){const target=focusInPlan?[...$('#data-tables').querySelectorAll('[data-erd-select]')].find(button=>button.dataset.erdSelect===focusId):[...$('#data-list').querySelectorAll('[data-erd-select]')].find(button=>button.dataset.erdSelect===focusId);target?.focus({preventScroll:true});}
 $('#data-visible-count').textContent=current.tables.length+' tables · '+current.relations.filter(rel=>rel.kind==='foreign-key').length+' FK'+(logical?' · '+current.relations.filter(rel=>rel.kind==='application').length+' références applicatives':'');
 $('#data-empty').hidden=current.tables.length>0;$('#data-size').hidden=current.tables.length===0;
 $('#data-status').textContent='Schéma extrait du code V150 · '+(full?'toutes les colonnes visibles':'clés et champs utiles visibles')+' · * = NOT NULL déclaré.';
 root.dataset.modelReady='true';root.dataset.visibleTables=String(current.tables.length);
 applyZoom();if(center&&selected)centerTable(selected,first);first=false;
}
function selectTable(id,focus=true){
 if(!byId.has(id))return;
 if(!current.tables.some(table=>table.id===id)){domain='all';query='';$('#data-domain').value=domain;$('#data-query').value='';}
 selected=id;render();if(focus)centerTable(id,true);
}
$('#data-table-count').textContent=model.tables.length;$('#data-column-count').textContent=model.tables.reduce((total,table)=>total+table.columns.length,0);$('#data-fk-count').textContent=model.relations.filter(rel=>rel.kind==='foreign-key').length;
for(const group of model.groups)$('#data-domain').add(new Option(group.label,group.id));
$('#data-other-storage').innerHTML=model.otherStorage.map(item=>'<article><h3>'+escape(item.label)+'</h3><p>'+escape(item.description)+'</p><details><summary>Références</summary>'+item.sources.map(source=>'<code>'+escape(source)+'</code>').join('')+'</details></article>').join('');
$('#data-domain').addEventListener('change',event=>{domain=event.target.value;selected=null;scroller.scrollTo(0,0);render();});
$('#data-query').addEventListener('input',event=>{clearTimeout(searchTimer);query=event.target.value;searchTimer=setTimeout(()=>{selected=null;scroller.scrollTo(0,0);render();},120);});
$('#data-logical').addEventListener('change',event=>{logical=event.target.checked;render(true);});
$('#data-full').addEventListener('change',event=>{full=event.target.checked;render(true);});
root.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.erdSelect)selectTable(button.dataset.erdSelect);
 else if(button.dataset.erdDetail){selectTable(button.dataset.erdDetail);if(innerWidth<850)root.querySelector('.data-inspector').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 else if(button.dataset.erdCenter)centerTable(button.dataset.erdCenter,true);
 else if(button.id==='data-zoom-in'){zoom=Math.min(1.8,zoom+.15);applyZoom();}
 else if(button.id==='data-zoom-out'){zoom=Math.max(.16,zoom-.15);applyZoom();}
 else if(button.id==='data-fit'){zoom=Math.min(1.05,Math.max(.16,(scroller.clientWidth-20)/layout.width));applyZoom({x:layout.width/2,y:scroller.clientHeight/(2*zoom)});}
 else if(button.id==='data-reset'){domain='all';query='';logical=false;full=false;selected=null;$('#data-query').value='';$('#data-domain').value='all';$('#data-logical').checked=false;$('#data-full').checked=false;render();zoom=Math.min(1.05,Math.max(.16,(scroller.clientWidth-20)/layout.width));applyZoom({x:layout.width/2,y:scroller.clientHeight/(2*zoom)});}
});
root.addEventListener('dblclick',event=>{const button=event.target.closest('[data-erd-select]');if(button){zoom=1;selectTable(button.dataset.erdSelect);}});
const resize=new ResizeObserver(()=>{if(scroller.clientWidth>0&&first)render(true);});resize.observe(scroller);
render(true);
