'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const canvas=$('#motion'),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const paused=reduced,count=12,showOutlines=true,showTrails=true;
let width=innerWidth,height=innerHeight,last=0,clock=0,raf=0,hidden=false;
const colors=['#7faaff','#ec8aaa','#a59af2','#7bc9af','#e7bd74','#8dd2ef','#d49feb'];
const names=['Interface','Données','Code','Automatisation','Idées','Mouvement','Projets'];
const items=$$('.editable');
const cursors=Array.from({length:24},(_,i)=>({x:Math.random()*width,y:Math.random()*height,tx:0,ty:0,phase:Math.random()*6.28,speed:.6+Math.random()*.4,target:i%items.length,timer:0,trail:[],color:colors[i%colors.length]}));
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}resize();addEventListener('resize',resize);
function visibleItems(){return items.map((el,i)=>({el,i,r:el.getBoundingClientRect()})).filter(o=>o.r.bottom>100&&o.r.top<height-100&&o.r.width>0&&!o.el.closest('.construction-unit:not([data-construction="done"])'))}
function pathCursor(c,i){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(Math.sin(clock*.3+c.phase)*.08);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(3.2,15);ctx.lineTo(7,10.6);ctx.lineTo(12.4,10.5);ctx.closePath();ctx.fillStyle=c.color;ctx.strokeStyle='#09090b';ctx.lineWidth=1.1;ctx.fill();ctx.stroke();if(i<3&&width>700){ctx.font='8px Inter,Arial';const name=names[i];const tw=ctx.measureText(name).width;ctx.fillStyle=c.color;ctx.fillRect(12,15,tw+12,16);ctx.fillStyle='#101018';ctx.fillText(name,18,26)}ctx.restore()}
function outline(r,color,i){if(r.top<75||r.bottom>height-55)return;ctx.strokeStyle=color;ctx.globalAlpha=.4;ctx.lineWidth=.75;ctx.strokeRect(r.x-3,r.y-3,r.width+6,r.height+6);ctx.globalAlpha=.8;for(const [x,y] of [[r.x-5,r.y-5],[r.right+1,r.y-5],[r.x-5,r.bottom+1],[r.right+1,r.bottom+1]]){ctx.fillStyle='#0c0c10';ctx.fillRect(x,y,4,4);ctx.strokeRect(x,y,4,4)}if(width>700&&i<2){ctx.fillStyle=color;ctx.fillRect(r.x-3,r.y-17,80,14);ctx.fillStyle='#0b0b11';ctx.font='7px monospace';ctx.fillText(Math.round(r.width)+' × '+Math.round(r.height),r.x+3,r.y-7)}ctx.globalAlpha=1}
let visibleCache=[],nextMeasure=0;
function frame(ts){
  if(paused||hidden){raf=0;return}
  const elapsed=Math.min((ts-last)/1000||.016,1),dt=Math.min(elapsed,.05);last=ts;clock+=elapsed;
  ctx.clearRect(0,0,width,height);
  construction.update(elapsed,{width,height,count,showOutlines,enabled:true});
  updateCursorResize(elapsed);
  if(clock>nextMeasure){visibleCache=visibleItems();nextMeasure=clock+.12}
  const n=width<700?Math.min(count,7):count;
  for(let i=0;i<n;i++){
    const c=cursors[i];
    // The two builders belong to the resize choreography while holding a window.
    if((resizeJob&&i<2)||construction.owns(i))continue;
    c.timer-=dt;
    if(c.timer<=0&&visibleCache.length){const o=visibleCache[Math.floor(Math.random()*visibleCache.length)];c.target=o.i;c.timer=1.8+Math.random()*3.8}
    const o=visibleCache.find(o=>o.i===c.target)||visibleCache[i%visibleCache.length];
    if(o){const r=o.r;c.tx=r.x+r.width*(.15+.7*(.5+.5*Math.sin(clock*.45+c.phase)));c.ty=r.y+r.height*(.15+.7*(.5+.5*Math.cos(clock*.6+c.phase)))}
    else{c.tx=width*.5;c.ty=height*.5}
    const ease=1-Math.pow(.04,dt*c.speed);c.x+=(c.tx-c.x)*ease;c.y+=(c.ty-c.y)*ease;
    c.trail.push({x:c.x,y:c.y});if(c.trail.length>15)c.trail.shift();
    if(showTrails){ctx.beginPath();c.trail.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=c.color;ctx.globalAlpha=.1;ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=1}
    if(showOutlines&&o&&i<4&&c.timer<3.4&&!(resizeJob&&(resizeJob.panel.el===o.el||resizeJob.panel.el.contains(o.el))))outline(o.r,c.color,i);
    pathCursor(c,i);
  }
  raf=requestAnimationFrame(frame);
}
function start(){if(!raf&&!paused&&!hidden){last=performance.now();raf=requestAnimationFrame(frame)}}
let toastTimer;function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500)}
$('#menu').addEventListener('click',()=>{const on=$('.nav').classList.toggle('mobile-open');$('#menu').setAttribute('aria-expanded',String(on));$('#menu').textContent=on?'×':'☰'});
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{$('.nav').classList.remove('mobile-open');$('#menu').setAttribute('aria-expanded','false');$('#menu').textContent='☰'}));
const marketViews={
  jira:{label:'Activité des tickets',labels:['À faire','En cours','Terminés'],bars:[36,58,46,74,63,88]},
  simulations:{label:'Suivi des simulations',labels:['Préparation','Contrôle','Intégration'],bars:[78,54,65,43,80,69]},
  variations:{label:'Évolutions tarifaires',labels:['Fournisseurs','Périodes','Variations'],bars:[43,62,51,77,66,84]}
};
function selectMarketView(button){
  const view=marketViews[button.dataset.market];
  $$('[data-market]').forEach(b=>{const active=b===button;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});
  $('#market-preview').setAttribute('aria-labelledby',button.id);
  $('#market-chart-label').textContent=view.label;
  ['one','two','three'].forEach((name,i)=>$('#market-label-'+name).firstChild.textContent=view.labels[i]);
  $$('.market-chart>span').forEach((bar,i)=>bar.style.setProperty('--bar',view.bars[i]+'%'));
}
$$('[data-market]').forEach((button,index)=>{
  button.addEventListener('click',()=>selectMarketView(button));
  button.addEventListener('keydown',event=>{
    const tabs=$$('[data-market]');let next;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();tabs[next].focus();selectMarketView(tabs[next])}
  });
});
const words=[{consonants:'C N M',answer:'cinema',display:'CINÉMA',clue:'Sur grand écran.'},{consonants:'T L S C P',answer:'telescope',display:'TÉLESCOPE',clue:'Pour regarder les étoiles.'},{consonants:'J R D N',answer:'jardin',display:'JARDIN',clue:'Les mains dans la terre.'}];
let wordIndex=0,wordSolved=false;
$('#word-form').addEventListener('submit',event=>{
  event.preventDefault();
  const answer=$('#word-answer').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  if(!answer){$('#word-feedback').textContent='Entre un mot pour jouer.';return}
  if(answer===words[wordIndex].answer){wordSolved=true;$('#word-feedback').textContent='Trouvé : '+words[wordIndex].display+' !';$('#word-feedback').classList.add('success');$('#word-next').hidden=false}
  else{$('#word-feedback').textContent='Pas encore. Regarde l’indice et réessaie.';$('#word-feedback').classList.remove('success')}
});
$('#word-next').addEventListener('click',()=>{
  wordIndex=(wordIndex+1)%words.length;wordSolved=false;
  $('#word-letters').textContent=words[wordIndex].consonants;$('#word-clue').textContent='Indice : '+words[wordIndex].clue;
  $('#word-answer').value='';$('#word-feedback').textContent='À toi de trouver.';$('#word-feedback').classList.remove('success');$('#word-next').hidden=true;
});
$('#copy-profile').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('https://github.com/egalland');toast('Lien GitHub copié.')}catch{toast('Copie indisponible. Le lien GitHub est accessible juste à côté.')}});
const projectDetails={
  market:{category:'OUTIL MÉTIER / INTERNE',title:'Market Plus',description:'Un outil pour préparer et présenter les points marché. La présentation du portfolio reste schématique.',features:['Points marché composés en blocs.','Tickets Jira, simulations et suivi des promotions.','Variations fournisseurs et imports de données.','Exports et présentation des informations utiles.'],url:'https://market-plus.emmanuel-galland117.chatgpt.site'},
  bodyos:{category:'APPLICATION PERSONNELLE / PRIVÉ',title:'BodyOS',description:'Un espace personnel pour réunir les séances, les objectifs et la progression. Seule l’approche du projet est présentée ici.',features:['Organisation du suivi dans une même interface.','Historique et visualisation de la progression.','Lecture simple des informations utiles.'],url:null}
};
const projectDialog=$('#project-dialog');
$$('[data-project]').forEach(button=>button.addEventListener('click',()=>{
  const detail=projectDetails[button.dataset.project];
  $('#project-dialog-category').textContent=detail.category;$('#project-dialog-title').textContent=detail.title;$('#project-dialog-description').textContent=detail.description;
  $('#project-dialog-features').replaceChildren(...detail.features.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));
  const link=$('#project-dialog-link');link.hidden=!detail.url;if(detail.url)link.href=detail.url;else link.removeAttribute('href');
  projectDialog.showModal();
}));
$('.dialog-close').addEventListener('click',()=>projectDialog.close());
projectDialog.addEventListener('click',event=>{if(event.target===projectDialog){const r=projectDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)projectDialog.close()}});
addEventListener('scroll',()=>{nextMeasure=0;const max=document.documentElement.scrollHeight-height;$('.progress').style.width=(max>0?scrollY/max*100:0)+'%'},{passive:true});
addEventListener('pointermove',e=>{if(!reduced){$('.mouse-glow').style.left=e.clientX+'px';$('.mouse-glow').style.top=e.clientY+'px'}},{passive:true});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden){cancelAnimationFrame(raf);raf=0}else start()});

// Scrolling reveals a window; the builders then resize it on their own timeline.
// Its size is written ONLY during a held drag, never as a function of scroll progress.
const cursorWindows=$$('.hero-art, .project-window, .lab-card').map(el=>{
  el.classList.add('cursor-window');
  return {el,scale:1,done:reduced,outsideSince:null,eligible:false};
});
const resizeOverlay=document.createElement('div');
resizeOverlay.className='resize-choreography';resizeOverlay.hidden=true;resizeOverlay.setAttribute('aria-hidden','true');
resizeOverlay.innerHTML=`<div class="resize-selection"><span class="resize-measure"></span>${Array.from({length:8},(_,i)=>`<i class="resize-handle handle-${i}"></i>`).join('')}</div>${['Interface','Mouvement'].map((name,i)=>`<div class="resize-cursor builder-${i}"><span class="grab-ring"></span><svg viewBox="-3 -3 28 32"><path d="M0 0L5 21L10 14L19 13Z"/></svg><span class="builder-name">${name}</span></div>`).join('')}`;
document.body.append(resizeOverlay);
const selection=resizeOverlay.querySelector('.resize-selection');
const measure=resizeOverlay.querySelector('.resize-measure');
const builders=[...resizeOverlay.querySelectorAll('.resize-cursor')];
let resizeJob=null,resizeCooldown=.45;
function smallWindowScale(){return innerWidth<=700?.84:.72}
function setWindowScale(panel,value){panel.scale=value;panel.el.style.setProperty('--window-scale',value.toFixed(5))}
function resetCursorResize(rebuild=false,preserve=false){
  const interrupted=resizeJob?.panel;
  resizeJob=null;resizeOverlay.hidden=true;resizeCooldown=rebuild?1.7:.45;
  cursorWindows.forEach(panel=>{
    panel.done=reduced||(preserve&&(panel.done||panel===interrupted));
    panel.el.dataset.resizeState=panel.done?'done':'waiting';
    panel.el.classList.remove('window-resizing');
    setWindowScale(panel,panel.done?1:smallWindowScale());
  });
  cursors.slice(0,2).forEach(c=>c.trail=[]);
}
function finishCursorResize(completed=true){
  if(!resizeJob)return;
  const panel=resizeJob.panel;
  panel.done=completed;panel.el.dataset.resizeState=completed?'done':'waiting';
  panel.el.classList.remove('window-resizing');
  resizeJob=null;resizeOverlay.hidden=true;resizeCooldown=.25;
  cursors.slice(0,2).forEach(c=>{c.trail=[];c.timer=0});
}
const clamp01=v=>Math.max(0,Math.min(1,v));
const smoothStep=v=>{const t=clamp01(v);return t*t*(3-2*t)};
function windowCorners(r){return [{x:r.left,y:r.top},{x:r.right,y:r.bottom}]}
function updateCursorResize(dt){
  if(reduced)return;
  if(construction.scrollingUp){
    if(resizeJob){setWindowScale(resizeJob.panel,1);finishCursorResize()}
    for(const panel of cursorWindows)if(!panel.done&&construction.ready(panel.el)){
      setWindowScale(panel,1);panel.done=true;panel.el.dataset.resizeState='done';
    }
    return;
  }
  resizeCooldown=Math.max(0,resizeCooldown-dt);
  const navBottom=width<=700?65:74;
  for(const panel of cursorWindows){
    const r=panel.el.getBoundingClientRect();
    panel.rect=r;
    panel.eligible=construction.ready(panel.el)&&r.top>navBottom+25&&r.top<height*.78&&r.bottom<height-76;
    // Keep completed geometry when scrolling out of and back into view.
  }
  if(!resizeJob&&!resizeCooldown){
    const next=cursorWindows.filter(p=>!p.done&&p.eligible).sort((a,b)=>Math.abs((a.rect.top+a.rect.bottom)/2-height*.5)-Math.abs((b.rect.top+b.rect.bottom)/2-height*.5))[0];
    if(next){
      resizeJob={panel:next,phase:'approach',elapsed:0,startScale:next.scale,from:cursors.slice(0,2).map(c=>({x:c.x,y:c.y}))};
      next.el.classList.add('window-resizing');resizeOverlay.hidden=false;
    }
  }
  if(!resizeJob)return;
  const job=resizeJob,panel=job.panel;
  let rect=panel.el.getBoundingClientRect();
  if(rect.bottom<navBottom||rect.top>height){setWindowScale(panel,1);finishCursorResize();return}
  // Tall windows on small screens may extend beyond the viewport while expanding.
  // Keep the resize anchored to visible corners by finishing early on fast navigation.
  if(job.phase!=='approach'&&(rect.top<navBottom-30||rect.bottom>height+80)){
    setWindowScale(panel,1);finishCursorResize();return;
  }
  resizeOverlay.hidden=false;
  job.elapsed+=dt;
  if(job.phase==='approach'&&job.elapsed>=.72){job.phase='grip';job.elapsed=0}
  else if(job.phase==='grip'&&job.elapsed>=.3){job.phase='drag';job.elapsed=0}
  else if(job.phase==='drag'&&job.elapsed>=1.65){job.phase='release';job.elapsed=0;setWindowScale(panel,1);rect=panel.el.getBoundingClientRect()}
  else if(job.phase==='release'&&job.elapsed>=.5){finishCursorResize();return}
  if(job.phase==='drag'){
    const p=smoothStep(job.elapsed/1.65);
    setWindowScale(panel,job.startScale+(1-job.startScale)*p);
    rect=panel.el.getBoundingClientRect();
    nextMeasure=0;
  }
  const corners=windowCorners(rect);
  corners.forEach((point,i)=>{
    const c=cursors[i];
    if(job.phase==='approach'){
      const t=smoothStep(job.elapsed/.72);
      c.x=job.from[i].x+(point.x-job.from[i].x)*t;c.y=job.from[i].y+(point.y-job.from[i].y)*t;
    }else{c.x=point.x;c.y=point.y}
    // The arrow tip and the handle share exactly the same viewport coordinates.
    builders[i].style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
  });
  resizeOverlay.dataset.phase=job.phase;panel.el.dataset.resizeState=job.phase;
  selection.style.left=rect.left+'px';selection.style.top=rect.top+'px';
  selection.style.width=rect.width+'px';selection.style.height=rect.height+'px';
  const label=job.phase==='drag'?'AGRANDISSEMENT':job.phase==='release'?'EN PLACE':'SÉLECTION';
  measure.textContent=`${label}  ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
  resizeOverlay.classList.toggle('hide-selection',!showOutlines);
}
addEventListener('resize',()=>{
  construction.refreshLayout();
  resetCursorResize(false,true);
  if(paused)construction.revealAll();
},{passive:true});
addEventListener('scroll',()=>{
  if(paused){ctx.clearRect(0,0,width,height);resizeOverlay.hidden=true;construction.hideCursors()}
},{passive:true});
const construction=new ScrollConstruction({cursors,reduced,onReveal(el){const panel=cursorWindows.find(panel=>panel.el===el);if(panel){if(resizeJob?.panel===panel)finishCursorResize();setWindowScale(panel,1);panel.done=true;panel.el.dataset.resizeState='done'}}});
resetCursorResize();
if(paused){document.body.classList.add('paused');construction.revealAll()}else start();
