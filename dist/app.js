import { CATALOG, GROUPS, WEIGHTS, STITCHES, FIBERS, FORMS, HAS_COLLAR, COLORS, YARN_EXAMPLES, validateMeasures, measureLabel, sizeMeasures } from './catalog.js';
import { PATTERNS } from './textiles.js';
import { createProject, changeKind, applyPattern, copy, makeYarn, parseProject, numberFr, ProjectBook, removeYarn, sampleSignature, knittingDirection } from './projects.js';
import { estimate } from './budget.js';
import { AtelierScene } from './scene.js';
import { paintSwatch } from './fabric.js';
import { floodFill, resizePattern } from './knit.js';
import { esc, icon, button, select, dot, letter, drawGrid, rangeText, meterLabel } from './ui.js';
import { STEPS, LAYOUTS, sectionKind, sectionMeasures, sectionYarn, sectionPattern, sectionPlan } from './steps.js';
import { projectList, nameForm, yarnForm, patternGallery, sampleForm, calculation, exportOptions, resizeForm } from './dialogs.js';
import { pullGuide, pullCoverage } from './pull-guide.js';
import { createPullWorkspace } from './pull-workspace.js';
import { printablePull, usable } from './pull-views.js';

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
let storage;
try{storage=window.localStorage;}catch{storage={get length(){throw Error('Stockage indisponible');}};}
const book=new ProjectBook(storage);
let project=book.startup();
let group=CATALOG[project.kind].group, mobileView='edit', viewMode='rotate', patternGroup='Tous';
let coverage, budget, scene, modalType='', editedYarn=null, editedIndex=-1, sourceProject=null;
let undoStack=[], redoStack=[], dirty=false, saveTimer, noticeTimer, visualFrame=0;
const drawing={tool:'pencil',mirror:false,symbols:false,cursor:null,metrics:null,pointer:null,last:null};
let moveStarted=false,lastSwatch='';
const wholePull=createPullWorkspace({project:()=>project,remember,save:scheduleSave,visual:scheduleVisual,
  panel:renderPanel,change:changed,png:pngDownload,name:baseName,go});
function stepName(i){
  if(project.kind==='pull'&&i===3)return 'Dessin';
  if(project.kind==='pull'&&i===4)return 'Patron';
  return STEPS[i][0];
}
function notice(message){
  const box=$('#notice');box.textContent=message;box.classList.add('show');clearTimeout(noticeTimer);
  noticeTimer=setTimeout(()=>box.classList.remove('show'),3600);
}
function saveStatus(){
  const box=$('#save-line');box.classList.toggle('warn',book.failed);
  box.textContent=book.failed?'Stockage indisponible · téléchargez votre projet':dirty?'Enregistrement en cours…':'Enregistré dans ce navigateur';
}
function flush(force=false){
  clearTimeout(saveTimer);
  if(!dirty&&!force)return !book.failed;
  const result=book.save(project);dirty=false;saveStatus();
  if(result.conflict){$('#project-title').textContent=project.name;notice('Une autre fenêtre a modifié ce projet. Votre version est conservée dans une copie.');}
  if(!result.ok)notice('La sauvegarde locale a échoué. Téléchargez votre projet pour le conserver.');
  return result.ok;
}
function scheduleSave(){dirty=true;saveStatus();clearTimeout(saveTimer);saveTimer=setTimeout(()=>flush(),280);}
window.addEventListener('pagehide',()=>flush());
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
function remember(){undoStack.push(copy(project));if(undoStack.length>45)undoStack.shift();redoStack=[];}
function changed(action,options={}){
  if(options.history!==false)remember();
  const swatch=project.sample.enabled?sampleSignature(project):null;
  action();
  if(swatch&&swatch!==sampleSignature(project)){
    project.sample.enabled=false;
    notice('Le fil ou le point a changé. Pesez un nouvel échantillon pour affiner les pelotes.');
  }
  scheduleSave();
  if(options.panel===false){scheduleVisual();return;}
  render();
}
function restoreHistory(forward){
  const from=forward?redoStack:undoStack,to=forward?undoStack:redoStack;
  if(!from.length)return;to.push(copy(project));const next=from.pop();
  const {id,revision,step,pullWork}=project;project={...next,id,revision,step,pullWork};drawing.cursor=null;group=CATALOG[project.kind].group;
  scheduleSave();render();
}
function updateMobile(value){
  mobileView=value;document.body.dataset.mobileView=value;
  $$('.mobile-switch button').forEach(b=>{const chosen=b.dataset.value===value;b.classList.toggle('chosen',chosen);b.setAttribute('aria-pressed',String(chosen));});
  if(value==='view')requestAnimationFrame(()=>scene?.resize());
  else if(project.step===3&&mobileOnly())requestAnimationFrame(wholePull.drawEditor);
}
function mobileOnly(){return matchMedia('(max-width:740px)').matches;}
function bringToView(el){el.scrollIntoView({block:'start',behavior:'instant'});}
function updateSteps(){
  $('#steps').innerHTML=STEPS.map((_,i)=>'<button class="step '+(i===project.step?'active':i<project.step?'done':'')+'" data-act="step" data-value="'+i+'" '+(i===project.step?'aria-current="step"':'')+'><span class="number" aria-hidden="true">'+(i<project.step?icon('check'):i+1)+'</span><span>'+stepName(i)+'</span></button>').join('');
}
function updateView(){
  $('#view-title').textContent=CATALOG[project.kind].name;
  $('#rotate-mode').classList.toggle('chosen',viewMode==='rotate');$('#place-mode').classList.toggle('chosen',viewMode==='place');
  $('#rotate-mode').setAttribute('aria-pressed',String(viewMode==='rotate'));$('#place-mode').setAttribute('aria-pressed',String(viewMode==='place'));
  $('#object').classList.toggle('placing',viewMode==='place');
  if(scene)scene.mode=viewMode;
  $('#view-hint').textContent=viewMode==='place'?'Faites glisser le motif sur le tissu. Position en largeur '+Math.round(project.motif.u*100)+' %, en hauteur '+Math.round(project.motif.v*100)+' %.':'Faites glisser l’ouvrage pour le regarder de tous les côtés.';
  $('#view-tools').innerHTML=viewMode==='rotate'?button('Face','front','button link')+button('Dos','back','button link')+button('Voir les mailles','detail','button link'):
    [['←','left','Décaler à gauche'],['→','right','Décaler à droite'],['↑','up','Décaler vers le haut'],['↓','down','Décaler vers le bas']].map(([symbol,value,label])=>'<button class="circle nudge" data-act="nudge" data-value="'+value+'" aria-label="'+label+'" title="'+label+'">'+symbol+'</button>').join('')+button('Centrer','center','button link');
  $('#stitch-caption').textContent=STITCHES[project.stitch];$('#fabric-caption').textContent=project.gauge.stitches+' m. × '+project.gauge.rows+' rgs / 10 cm';
  if(budget)$('#budget-short').textContent=rangeText(budget.low,budget.high);
}
function refreshFabric(){
  scene?.setProject(project,moveStarted||drawing.pointer!==null);
  const guide=pullGuide(project);
  budget=estimate(project,pullCoverage(project,guide)||coverage);
  const swatch=JSON.stringify([project.grid,project.stitch,project.yarns.map(y=>[y.color,y.weight,y.fiber,y.heldWith,y.id])]);
  if(swatch!==lastSwatch){paintSwatch($('#sample-view'),project);lastSwatch=swatch;}
  updateView();
}
function scheduleVisual(){
  if(visualFrame)return;
  visualFrame=requestAnimationFrame(()=>{visualFrame=0;refreshFabric();if(project.step===4)renderPanel();else if($('#chart'))renderChart();});
}
function renderChart(){
  const canvas=$('#chart');if(canvas)drawing.metrics=drawGrid(canvas,project,{symbols:drawing.symbols,cursor:drawing.cursor});
}
function renderPanel(){
  const motif=()=>sectionPattern(project,{...drawing,undo:undoStack.length,redo:redoStack.length});
  const pull=project.kind==='pull';
  const steps=[()=>sectionKind(project,group),()=>sectionMeasures(project),()=>sectionYarn(project),
    ()=>pull?wholePull.design(motif,undoStack.length,redoStack.length):motif(),
    ()=>sectionPlan(project,budget,pull?wholePull.overview():'')];
  $('#step-panel').innerHTML=steps[project.step]();
  $('#step-actions').innerHTML=(project.step>0?button('Précédent','step','button frame',project.step-1,'back'):'')+
    (project.step<4?button('Suivant · '+stepName(project.step+1),'step','button ink next',project.step+1,'next'):pull?'':button('Imprimer la fiche','print','button ink next','','print'));
  if(project.step===3){renderChart();wholePull.drawEditor();}
}
function render(){
  $('#project-title').textContent=project.name;$('#patron-shortcut').hidden=project.kind!=='pull'||project.step===4;
  saveStatus();updateSteps();updateMobile(mobileView);refreshFabric();renderPanel();
}
function validateOpenFields(report=true){
  if(project.step===1)return readMeasures(report);
  if(project.step===2&&$('#gauge-stitches'))return readGauge(report);
  return true;
}
function readMeasures(report=true){
  const form=$('#measure-form');if(!form)return true;
  const proposed={...project.measures};let invalid=null;
  form.querySelectorAll('input').forEach(inp=>{if(!inp.checkValidity()&&!invalid)invalid=inp;proposed[inp.id.slice(2)]=inp.valueAsNumber;});
  const error=validateMeasures(project.kind,proposed);
  $('#measure-error').textContent=error;
  if(error||invalid){if(report){invalid?.closest('details')?.setAttribute('open','');invalid?.reportValidity();if(error)notice(error);}return false;}
  if(Object.keys(proposed).some(k=>proposed[k]!==project.measures[k])){
    changed(()=>{project.measures=proposed;project.size='custom';},{panel:false});
    $('#size-hint').textContent='Sur mesure';$$('[data-act="size"]').forEach(b=>{b.classList.remove('chosen');b.setAttribute('aria-pressed','false');});
  }
  return true;
}
function readGauge(report=true){
  const a=$('#gauge-stitches'),b=$('#gauge-rows');if(!a||!b)return true;
  const bad=[a,b].find(el=>!el.checkValidity());if(bad){if(report)bad.reportValidity();return false;}
  if(project.gauge.stitches!==a.valueAsNumber||project.gauge.rows!==b.valueAsNumber){
    changed(()=>{project.gauge={stitches:a.valueAsNumber,rows:b.valueAsNumber,manual:true};},{panel:false});
    $('#gauge-hint').textContent='Mesures saisies pour votre ouvrage.';
  }
  return true;
}
function go(step){
  if(!Number.isInteger(step)||step<0||step>4||!validateOpenFields())return;
  if(step!==4&&location.hash==='#patron')history.replaceState(null,'',location.pathname+location.search);
  project.step=step;mobileView='edit';drawing.cursor=null;viewMode='rotate';scheduleSave();render();
  if(mobileOnly())bringToView($('#steps'));
}
function modal(type,title,body){
  modalType=type;$('#modal-title').textContent=title;$('#modal-content').innerHTML=body;
  if(!$('#modal').open)$('#modal').showModal();else $('#modal').scrollTop=0;
  if(['rename','new','new-pull','duplicate'].includes(type))$('#project-name-input').focus();
}
function close(){if($('#modal').open)$('#modal').close();modalType='';}
function showBook(){if(!validateOpenFields())return;flush();modal('book','Mes projets',projectList(project,book));}
function startProject(p){
  project=p;group=CATALOG[p.kind].group;mobileView='edit';viewMode='rotate';
  undoStack=[];redoStack=[];coverage=null;dirty=false;drawing.cursor=null;
  if(scene){scene.shape=null;scene.changeView(false);}
  close();render();window.scrollTo({top:0,behavior:'instant'});
}
function showYarn(index){
  if(!validateOpenFields())return;
  if(index<0&&project.yarns.length>=12){notice('Un ouvrage peut contenir jusqu’à 12 fils.');return;}
  editedIndex=index;editedYarn=index<0?makeYarn(project.yarns.length):copy(project.yarns[index]);
  modal('yarn',index<0?'Ajouter une laine':'Modifier la laine '+letter(index),yarnForm(project,editedYarn,index));
}
function reGallery(){modal('patterns','Inspirations · '+PATTERNS.length+' motifs',patternGallery(project,patternGroup));}
function beginMove(){
  if(!validateOpenFields())return;
  viewMode='place';updateView();updateMobile('view');
  if(mobileOnly())bringToView($('.mobile-switch'));
}
function moveMotif(point,finished){
  if(point){
    if(!moveStarted){remember();moveStarted=true;}
    project.motif.u=point.u;project.motif.v=point.v;project.motif.surface=point.surface;
    scheduleSave();scheduleVisual();
  }
  if(finished&&moveStarted){moveStarted=false;flush();scheduleVisual();}
}
function manualMove(to){
  changed(()=>{
    if(to==='center'){Object.assign(project.motif,{u:.5,v:.5,surface:'body'});return;}
    project.motif.u=Math.max(0,Math.min(1,project.motif.u+({left:-.015,right:.015}[to]||0)));
    project.motif.v=Math.max(0,Math.min(1,project.motif.v+({up:.015,down:-.015}[to]||0)));
  },{panel:false});
}
function cellAt(event,canvas){
  const rect=canvas.getBoundingClientRect(),m=drawing.metrics;
  return {x:Math.floor(((event.clientX-rect.left)*canvas.width/rect.width-m.x0)/m.cw),
    y:Math.floor(((event.clientY-rect.top)*canvas.height/rect.height-m.y0)/m.ch)};
}
function inside(cell){return cell.x>=0&&cell.x<project.cols&&cell.y>=0&&cell.y<project.rows;}
function applyInk(c){
  if(!inside(c))return;
  const ink=drawing.tool==='erase'?0:project.selected;
  if(drawing.tool==='fill'){floodFill(project.grid,c.x,c.y,ink);if(drawing.mirror)floodFill(project.grid,project.cols-c.x-1,c.y,ink);}
  else{project.grid[c.y][c.x]=ink;if(drawing.mirror)project.grid[c.y][project.cols-c.x-1]=ink;}
  drawing.cursor=c;project.motif.id='custom';project.completed=false;
}
function painted(){renderChart();scheduleSave();scheduleVisual();}
$('#settings').addEventListener('pointerdown',e=>{
  if(e.target.id!=='chart'||e.button!==0||drawing.pointer!==null)return;
  const c=cellAt(e,e.target);if(!inside(c))return;e.preventDefault();remember();
  drawing.pointer=e.pointerId;drawing.last=c;e.target.focus({preventScroll:true});e.target.setPointerCapture(e.pointerId);applyInk(c);painted();
});
$('#settings').addEventListener('pointermove',e=>{
  if(e.target.id!=='chart'||e.pointerId!==drawing.pointer||drawing.tool==='fill')return;
  const c=cellAt(e,e.target);if(!inside(c))return;const a=drawing.last;
  const n=Math.max(Math.abs(c.x-a.x),Math.abs(c.y-a.y));if(!n)return;
  for(let i=1;i<=n;i++)applyInk({x:Math.round(a.x+(c.x-a.x)*i/n),y:Math.round(a.y+(c.y-a.y)*i/n)});
  drawing.last=c;painted();
});
function endPaint(e){
  if(e.pointerId!==drawing.pointer)return;drawing.pointer=null;drawing.last=null;scheduleVisual();
  const b=$('[data-act="undo"]');if(b)b.disabled=false;
  const title=$('.motif-selected b');if(title)title.textContent='Mon motif';
  const thumb=$('.motif-selected img');if(thumb)thumb.src=$('#sample-view').toDataURL('image/png');
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#settings').addEventListener(event,endPaint);
$('#settings').addEventListener('keydown',e=>{
  if(e.target.id!=='chart')return;
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter'].includes(e.key))return;e.preventDefault();
  const c=drawing.cursor||{x:project.cols-1,y:project.rows-1};
  if(e.key===' '||e.key==='Enter'){remember();applyInk(c);painted();const b=$('[data-act="undo"]');if(b)b.disabled=false;return;}
  drawing.cursor={x:Math.min(project.cols-1,Math.max(0,c.x+({ArrowLeft:-1,ArrowRight:1}[e.key]||0))),y:Math.min(project.rows-1,Math.max(0,c.y+({ArrowUp:-1,ArrowDown:1}[e.key]||0)))};
  renderChart();
});
function recipe(){
  const row=[...project.grid[project.rows-project.progress]];
  const left=project.direction==='round'||project.progress%2===1;if(left)row.reverse();
  const runs=[];for(const color of row){if(runs.at(-1)?.color===color)runs.at(-1).count+=project.motif.scale;else runs.push({color,count:project.motif.scale});}
  return {left,runs};
}
function follow(){
  const dialog=$('#follow'),r=recipe(),progress=project.completed?100:Math.round((project.progress-1)*100/project.rows);
  $('#follow-title').textContent='Suivre les rangs du motif';
  $('#follow-content').innerHTML='<div class="row-lead"><strong>Rang de grille '+project.progress+' / '+project.rows+'</strong><span>'+progress+' %</span></div><div class="track"><i style="width:'+progress+'%"></i></div>'+
    '<div class="follow-grid"><canvas id="row-chart" width="1000" aria-label="Rang en cours surligné"></canvas></div><p class="hint">'+(r.left?'Lire de droite à gauche ←':'Lire de gauche à droite →')+(project.motif.scale>1?' · Répéter ce rang '+project.motif.scale+' fois':'')+'</p><div class="row-runs">'+r.runs.map(s=>'<span>'+dot(project.yarns[s.color].color)+s.count+' '+letter(s.color)+'</span>').join('')+'</div>'+
    '<div class="follow-nav"><button class="button frame" data-act="row-prev" '+(project.progress===1&&!project.completed?'disabled':'')+'>Précédent</button>'+button(project.completed?'Recommencer':project.progress===project.rows?'Terminer le motif':'Rang terminé','row-next','button ink','','check')+'</div>'+
    '<div class="section">'+select('Sens de lecture','direction',{round:'En rond · de droite à gauche',flat:'À plat · sens alterné'},project.direction)+'</div>'+
    '<p class="small">'+project.yarns.map((y,i)=>letter(i)+' = '+esc(y.name)).join(' · ')+'</p>';
  drawGrid($('#row-chart'),project,{symbols:true,row:project.progress});
  if(!dialog.open)dialog.showModal();
  requestAnimationFrame(()=>{const container=$('.follow-grid'),cv=$('#row-chart');if(container&&cv)container.scrollTop=Math.max(0,(1-(project.progress-.5)/project.rows)*cv.clientHeight-container.clientHeight/2);});
}
function baseName(){return project.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'mon-ouvrage';}
function download(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
function jsonDownload(o,name){download(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}),name);}
function pngDownload(c,name){c.toBlob(b=>{if(b)download(b,name);else notice('L’image n’a pas pu être créée.');},'image/png');}
function chartImage(){
  const chart=document.createElement('canvas');chart.width=1300;drawGrid(chart,project,{symbols:true});
  const c=document.createElement('canvas');c.width=1400;c.height=chart.height+230+Math.ceil(project.yarns.length/3)*45;
  const ctx=c.getContext('2d');ctx.fillStyle='#fffdf5';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#273e31';ctx.font='43px Georgia';ctx.fillText(project.name,48,61,1290);
  ctx.font='22px Arial';ctx.fillText(project.cols+' mailles × '+project.rows+' rangs · lire du bas vers le haut · '+project.motif.scale+' maille(s) × '+project.motif.scale+' rang(s) par case',50,110,1290);ctx.drawImage(chart,50,142);
  project.yarns.forEach((y,i)=>{const x=50+(i%3)*445,h=chart.height+190+Math.floor(i/3)*45;ctx.fillStyle=y.color;ctx.fillRect(x,h-18,24,24);ctx.fillStyle='#273e31';ctx.font='21px Arial';ctx.fillText(letter(i)+' · '+y.name,x+35,h,377);});return c;
}
function snapshot(){
  if(!scene)return null;
  return scene.snapshot(1000,800);
}
function printSheet(){
  if(!validateOpenFields())return;
  if(project.kind==='pull'&&!usable(pullGuide(project))){
    close();go(4);notice(pullGuide(project).construction.error);return;
  }
  refreshFabric();const image=snapshot(),rows=Object.entries(project.measures).filter(([k])=>!(project.kind==='libre'&&project.form==='disque'&&k==='length'));
  const s=$('#print-sheet');s.innerHTML='<h1>'+esc(project.name)+'</h1>'+(image?'<img class="print-visual" src="'+image.toDataURL('image/png')+'" alt="Ouvrage en 3D">':'')+'<p>Maille · '+esc(CATALOG[project.kind].name)+' · '+esc(STITCHES[project.stitch])+'</p><h2>Mesures finies</h2><p>'+rows.map(([k,v])=>esc(measureLabel(k,project.kind,project.form))+' '+numberFr(v)+' cm').join(' · ')+'</p>'+
    '<p>Échantillon : '+project.gauge.stitches+' mailles × '+project.gauge.rows+' rangs sur 10 cm.</p><h2 style="clear:both">Laines et pelotes</h2><p>Prévoir '+rangeText(budget.low,budget.high)+' pour l’ouvrage. Marge '+project.margin+' % incluse. '+(budget.measured?'Échantillon pesé.':'Fourchette indicative sans pesée.')+'</p><table><thead><tr><th>Fil et référence</th><th>Pelote</th><th>Métrage estimé</th><th>À prévoir</th></tr></thead><tbody>'+
    budget.entries.map(e=>'<tr><td>'+dot(e.yarn.color)+letter(e.index)+' · '+esc(e.yarn.name)+' '+esc(e.yarn.reference)+(e.yarn.heldWith?' avec '+esc(project.yarns.find(y=>y.id===e.yarn.heldWith)?.name):'')+'</td><td>'+numberFr(e.yarn.meters)+' m / '+numberFr(e.yarn.grams)+' g</td><td>'+meterLabel(e.meters)+'</td><td>'+rangeText(e.low,e.high)+'</td></tr>').join('')+'</tbody></table>'+
    (project.notes?'<h2>Notes</h2><p class="print-notes">'+esc(project.notes)+'</p>':'')+
    (project.kind==='pull'?printablePull(project,pullGuide(project)):
    '<div class="chart-print"><h2>Grille de couleurs</h2><p>'+esc(LAYOUTS[project.motif.layout])+' · position horizontale '+Math.round(project.motif.u*100)+' %, verticale '+Math.round(project.motif.v*100)+' % depuis le bas. Suivi au rang '+project.progress+'.</p><img src="'+chartImage().toDataURL('image/png')+'" alt="Grille et légende"><p>Associez cette grille à votre patron pour la construction et l’assemblage.</p></div>');
  close();Promise.all([...s.querySelectorAll('img')].map(img=>img.decode().catch(()=>{}))).then(()=>window.print());
}
function setDialogError(error){const el=$('#dialog-error');if(el)el.textContent=error;else notice(error);}
document.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;if(!form.checkValidity()){form.reportValidity();return;}
  if(wholePull.jump(form))return;
  try{
    if(form.id==='name-form'){
      const name=$('#project-name-input').value.trim();if(!name)throw Error('Donnez un nom à votre projet.');
      if(form.dataset.mode==='new'||form.dataset.mode==='new-pull'){
        const fromPatron=form.dataset.mode==='new-pull';
        flush();const p=createProject(fromPatron?'pull':$('#new-kind').value,name);
        if(fromPatron)p.step=4;
        book.save(p);startProject(p);
      }
      else if(form.dataset.mode==='duplicate'){flush();startProject(book.duplicate(sourceProject||project,name));}
      else{close();changed(()=>project.name=name);}
    }else if(form.id==='yarn-form'){
      const y={...editedYarn,name:$('#y-name').value.trim(),reference:$('#y-reference').value.trim(),fiber:$('#y-fiber').value,weight:+$('#y-weight').value,color:$('#y-color').value,grams:$('#y-grams').valueAsNumber,meters:$('#y-meters').valueAsNumber,heldWith:$('#y-companion').value||null,stock:$('#y-stock').valueAsNumber};
      if(!y.name)throw Error('Donnez un nom à ce coloris.');close();
      changed(()=>{if(editedIndex<0){project.yarns.push(y);project.selected=project.yarns.length-1;}else project.yarns[editedIndex]=y;
        if(editedIndex===0&&!project.gauge.manual){[project.gauge.stitches,project.gauge.rows]=WEIGHTS[y.weight].gauge;}});
    }else if(form.id==='sample-form'){
      const enabled=$('#weighed').checked;const grams=$('#s-grams').valueAsNumber;
      if(enabled&&(!Number.isFinite(grams)||grams<=0))throw Error('Indiquez le poids sec de l’échantillon.');
      const s={enabled,width:$('#s-width').valueAsNumber||12,height:$('#s-height').valueAsNumber||12,grams:Number.isFinite(grams)?grams:0};
      const margin=$('#s-margin').valueAsNumber,floats=$('#s-floats').valueAsNumber;close();
      changed(()=>{project.sample=s;project.margin=margin;project.floatAllowance=floats;});
    }else if(form.id==='resize-form'){
      const cols=$('#grid-width').valueAsNumber,rows=$('#grid-height').valueAsNumber;close();
      changed(()=>{project.grid=resizePattern(project.grid,cols,rows);project.rows=rows;project.cols=cols;project.motif.id='custom';project.progress=Math.min(project.progress,rows);project.completed=false;drawing.cursor=null;});
    }
  }catch(e){setDialogError(e.message);}
});
function toggleSampleFields(){const enabled=$('#weighed')?.checked;if(!$('#sample-inputs'))return;$('#sample-inputs').hidden=!enabled;$('#sample-inputs').querySelectorAll('input').forEach(el=>el.disabled=!enabled);}
document.addEventListener('change',e=>{
 const el=e.target,id=el.id;
 if(wholePull.change(el))return;
 if(id.startsWith('m-'))readMeasures(true);
 else if(id==='stitch')changed(()=>project.stitch=el.value);
 else if(id==='gauge-stitches'||id==='gauge-rows')readGauge(true);
 else if(id==='motif-scale')changed(()=>project.motif.scale=Number(el.value));
 else if(id==='notes'){project.notes=el.value;scheduleSave();}
 else if(id==='mirror')drawing.mirror=el.checked;
 else if(id==='symbols'){drawing.symbols=el.checked;renderChart();}
 else if(id==='direction'){project.direction=el.value;scheduleSave();follow();}
 else if(id==='weighed')toggleSampleFields();
 else if(id==='y-example'&&el.value!==''){
    const base=YARN_EXAMPLES[Number(el.value)];$('#y-fiber').value=base.fiber;$('#y-weight').value=base.weight;$('#y-grams').value=base.grams;$('#y-meters').value=base.meters;
 }
 else if(id==='y-color')$$('.color-option').forEach(btn=>btn.classList.toggle('selected',btn.dataset.value===el.value));
});
$('#import-file').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
   if(file.size>12*1024*1024)throw Error('Choisissez un fichier de moins de 12 Mo.');
   const raw=JSON.parse(await file.text()),items=raw.schema==='maille-carnet'&&raw.version===1?raw.projects:[raw];
   if(!Array.isArray(items)||items.length<1||items.length>200)throw Error('Le carnet doit contenir entre 1 et 200 ouvrages.');
   const imported=items.map(parseProject);flush();let first=null;
   for(const p of imported){const added=book.duplicate(p,p.name);if(!first)first=added;}
   startProject(book.load(first.id));notice(imported.length+' projet'+(imported.length>1?'s importés':' importé')+(book.failed?' en mémoire. Téléchargez votre carnet pour le conserver.':'.'));
 }catch(error){const message=error instanceof SyntaxError?'Ce fichier JSON est illisible.':error.message;if($('#modal').open){const feedback=document.createElement('p');feedback.className='action-error';feedback.textContent=message;$('#modal-content').append(feedback);}else notice(message);}
 finally{e.target.value='';}
});
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-act]');if(!el||el.disabled)return;const act=el.dataset.act,val=el.dataset.value;
 if(wholePull.action(act,val))return;
 switch(act){
  case 'step':go(Number(val));break;
  case 'mobile':if(validateOpenFields()){updateMobile(val);if(val==='view')refreshFabric();}break;
  case 'group':group=val;renderPanel();break;
  case 'kind':if(CATALOG[val]&&project.kind!==val){changed(()=>changeKind(project,val));scene?.changeView(false);}break;
  case 'form':if(FORMS[val])changed(()=>{project.form=val;project.direction=knittingDirection(project.kind,val);});break;
  case 'size':changed(()=>{project.measures=sizeMeasures(project.kind,val);project.size=val;});break;
  case 'collar':changed(()=>project.collar=val);break;
  case 'edit-yarn':showYarn(Number(val));break;
  case 'add-yarn':showYarn(-1);break;
  case 'remove-yarn':if(editedIndex>0)modal('remove-yarn','Retirer '+editedYarn.name,'<p>Les mailles de ce coloris prendront le fil A. Les autres fils qui l’utilisent comme deuxième brin passeront en simple.</p><div class="dialog-actions">'+button('Annuler','close','button frame')+button('Retirer cette laine','apply-remove-yarn','button ink')+'</div>');break;
  case 'apply-remove-yarn':if(modalType==='remove-yarn'&&editedIndex>0){close();changed(()=>removeYarn(project,editedIndex));}break;
  case 'swatch-color':{
    $('#y-color').value=val;const name=$('#y-name');
    if(!name.value.trim()||name.value==='Nouveau fil'||COLORS.some(([label])=>label===name.value))name.value=COLORS.find(x=>x[1]===val)?.[0]||name.value;
    $$('.color-option').forEach(b=>b.classList.toggle('selected',b===el));break;
  }
  case 'patterns':patternGroup='Tous';reGallery();break;
  case 'motif-group':patternGroup=val;reGallery();break;
  case 'pattern':{const source=PATTERNS.find(s=>s.id===val);if(source){close();changed(()=>{applyPattern(project,source);drawing.cursor=null;});}break;}
  case 'layout':changed(()=>{project.motif.layout=val;if(val==='yoke'&&project.motif.v<.4)project.motif.v=.72;});break;
  case 'ink':project.selected=Number(val);scheduleSave();renderPanel();break;
  case 'tool':drawing.tool=val;renderPanel();break;
  case 'resize':modal('resize','Dimensions du motif',resizeForm(project));break;
  case 'undo':restoreHistory(false);break;case 'redo':restoreHistory(true);break;
  case 'view-mode':if(val==='place')beginMove();else{viewMode='rotate';updateView();}break;
  case 'placement':beginMove();break;case 'nudge':manualMove(val);break;case 'center':manualMove('center');break;
  case 'front':scene?.changeView(false);break;case 'back':scene?.changeView(true);break;case 'zoom':scene?.zoomBy(Number(val)*.20);break;
  case 'detail':modal('detail','Les mailles de près','<canvas id="detail-swatch" width="800" height="550" style="width:100%;display:block;border-radius:8px" aria-label="Échantillon du motif"></canvas><p class="modal-footnote">'+esc(STITCHES[project.stitch])+' · '+project.gauge.stitches+' mailles et '+project.gauge.rows+' rangs pour 10 cm.</p>');paintSwatch($('#detail-swatch'),project);break;
  case 'yarn-count':go(4);if(project.kind==='pull')$('#pull-budget')?.scrollIntoView({block:'start'});break;
  case 'confirm-gauge':if(readGauge()){changed(()=>{project.gauge.manual=true;});notice('Échantillon mesuré enregistré.');}break;
  case 'sample':modal('sample','Affiner les pelotes',sampleForm(project));toggleSampleFields();break;
  case 'calculation':modal('calculation','Comment les pelotes sont estimées',calculation(project,budget));break;
  case 'follow':follow();break;case 'end-follow':$('#follow').close();break;
  case 'row-next':if(project.completed){project.progress=1;project.completed=false;}else if(project.progress<project.rows)project.progress++;else project.completed=true;scheduleSave();follow();break;
  case 'row-prev':if(project.completed)project.completed=false;else project.progress=Math.max(1,project.progress-1);scheduleSave();follow();break;
  case 'book':showBook();break;case 'rename':modal('rename','Renommer le projet',nameForm(project,'rename'));break;
  case 'new-pull':modal('new-pull','Nouveau pull',nameForm(project,'new-pull'));break;
  case 'new':modal('new','Nouvel ouvrage',nameForm(project,'new'));break;
  case 'duplicate':sourceProject=book.list().find(p=>p.id===val);if(sourceProject)modal('duplicate','Dupliquer le projet',nameForm(sourceProject,'duplicate'));break;
  case 'switch':flush();try{startProject(book.load(val));}catch(error){notice(error.message);}break;
  case 'close':close();break;case 'save':if(validateOpenFields()&&flush(true))notice('Projet enregistré dans votre carnet.');break;
  case 'imports':case 'import':$('#import-file').click();break;
  case 'exports':if(validateOpenFields()){flush();modal('exports','Exporter mon ouvrage',exportOptions(usable(pullGuide(project))));}break;
  case 'json':flush();jsonDownload(project,baseName()+'.maille.json');break;
  case 'backup':flush();jsonDownload(book.exportAll(),'mon-carnet-maille.json');break;
  case 'png':pngDownload(chartImage(),baseName()+'-grille.png');break;
  case 'capture':{const c=snapshot();if(c)pngDownload(c,baseName()+'-ouvrage.png');else notice('L’aperçu est indisponible.');break;}
  case 'print':printSheet();break;
 }
});
$('#follow').addEventListener('close',()=>{if(project.step===4)renderPanel();});
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}));
document.addEventListener('keydown',e=>{
 if(e.key.toLowerCase()==='s'&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(validateOpenFields()&&flush(true))notice('Projet enregistré dans votre carnet.');return;}
 if($('dialog[open]')||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();restoreHistory(e.shiftKey);}
});
$$('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
try{scene=new AtelierScene($('#object'),moveMotif,c=>coverage=c);}catch(error){$('#no-3d').hidden=false;$('#no-3d').textContent='L’aperçu est indisponible sur cet appareil.';console.error(error);}
render();
function openPatronLink(){
  if(location.hash!=='#patron')return;
  if(project.kind==='pull'){go(4);return;}
  const pulls=book.list().filter(item=>item.kind==='pull');
  modal('find-pull','Ouvrir un patron de pull','<p>Choisissez un pull de votre carnet ou commencez-en un nouveau.</p>'+
    pulls.map(item=>button(item.name,'resume-pull','button frame',item.id,'book')).join(' ')+
    '<div class="dialog-actions">'+button('Nouveau pull','new-pull','button ink','','plus')+'</div>');
}
document.addEventListener('click',e=>{
  const item=e.target.closest('[data-act="resume-pull"]');if(!item)return;
  flush();startProject(book.load(item.dataset.value));go(4);
});
openPatronLink();window.addEventListener('hashchange',openPatronLink);
if(book.legacyUnreadable)notice('Le précédent fichier local n’a pas pu être relu. Vous pouvez importer une copie exportée.');
