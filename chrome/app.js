import {setChromeType,lightType} from './chrome-type.js';
import {chapters as entries,chapterFromHash,renderChapters} from './chapters.js';
import {makeChainMenu} from './chain-menu.js';
import {makeFlecks} from './chrome-flecks.js';
import {makeChain} from './chain.js';
import {drawCast,emblem} from './sculpture.js';
const $=s=>document.querySelector(s);
const stage=$('#stage'),strip=$('#strip'),rail=$('#rail'),dialog=$('#sheet');
renderChapters(strip,document.querySelector('footer nav'));
$('#total').textContent=String(entries.length).padStart(2,'0');
rail.max=String((entries.length-1)*1000);
const railControl=rail.parentElement;
const railNotches=railControl.querySelector('.rail-notches');
for(const entry of entries)railNotches.append(document.createElement('i'));
const sections=[...strip.querySelectorAll('section')],nav=[...document.querySelectorAll('footer nav a')];
const tags=entries.map((entry,i)=>{
 const tag=$('#tag-template').content.firstElementChild.cloneNode(true);
 tag.querySelector('.badgenum').textContent='EG / '+String(i).padStart(2,'0');
 tag.querySelector('.badgeTitle').textContent=entry.short||entry.title;
 tag.hidden=true;stage.append(tag);
 return {el:tag,sculpture:tag.querySelector('.glyph'),angle:0,velocity:0,turn:0,tilt:0};
});
const flecks=makeFlecks(stage,sections);
const drawChain=makeChain($('#metal'),(links,first,p,motion)=>{
 flecks(links,first,p,motion.phase,motion.stageBox,motion.spot,motion.enabled);
});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let index=-1,w=1,h=1,mobile=false,lightX=0,lightY=-.12,x=0,y=-.12,phase=0,pull=0;
let raf=0,timestamp=0,lastPosition=0,lastSynced=NaN,wheelGoal=null,previousFocus=null;
let travel=null,spot=null,lastTypeSpot,lastTypePosition;
let paused=false;
try{paused=sessionStorage.getItem('chrome-motion')==='off'}catch{}
const menu=makeChainMenu({go:goto,current:()=>Math.max(index,0),blocked:()=>dialog.open,animated});
function animated(){return !paused&&!reduced.matches}
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
function queue(){if(!raf&&!document.hidden)raf=requestAnimationFrame(render)}
function position(){return clamp(strip.scrollLeft/Math.max(1,strip.clientWidth),0,entries.length-1)}
function goto(i,smooth=true){
 wheelGoal=null;
 i=clamp(i,0,entries.length-1);
 const start=position(),distance=Math.abs(i-start);
 travel=null;
 if(!smooth||!animated()||distance<.015){strip.scrollLeft=i*strip.clientWidth;queue();return}
 travel={start,end:i,time:performance.now(),duration:500+330*Math.sqrt(distance)};
 queue();
}
function sync(p){
 if(p===lastSynced)return;
 lastSynced=p;
 const next=Math.round(p);
 if(index!==next){
  index=next;
  $('#count').textContent=String(index+1).padStart(2,'0');
  nav.forEach(a=>{if(a.textContent===entries[index].group)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});
  if(menu.isOpen())menu.refresh();
  sections.forEach((s,i)=>{s.inert=i!==index});
  $('#prev').disabled=index===0;$('#next').disabled=index===entries.length-1;
  history.replaceState(null,'','#'+entries[index].id);
 }
 rail.value=String(Math.round(p*1000));railControl.style.setProperty('--progress',(p/(entries.length-1)*100)+'%');
 rail.setAttribute('aria-valuetext',entries[index].title+' — '+(index+1)+' sur '+entries.length);
}
function render(t){
 raf=0;
 if(dialog.open||document.hidden)return;
 if(travel){
  const t0=clamp((t-travel.time)/travel.duration,0,1);
  const eased=t0*t0*t0*(10+t0*(-15+6*t0));
  strip.scrollLeft=(travel.start+(travel.end-travel.start)*eased)*strip.clientWidth;
  if(t0===1||!animated()){strip.scrollLeft=travel.end*strip.clientWidth;travel=null}
 }
 const moving=animated(),elapsed=timestamp?t-timestamp:33;
 // Cap idle rendering; user input still drives the horizontal scrolling surface.
 if(moving&&elapsed<30){queue();return}
 const dt=clamp(elapsed/1000,.001,.05);
 timestamp=t;
 if(wheelGoal!==null){
  const diff=wheelGoal-strip.scrollLeft;
  if(Math.abs(diff)<1.5||!moving){strip.scrollLeft=wheelGoal;wheelGoal=null}
  else strip.scrollLeft+=diff*(1-Math.exp(-14*dt));
 }
 const p=position();sync(p);
 const velocity=clamp((p-lastPosition)/dt,-5,5);lastPosition=p;
 phase+=moving?dt:0;
 pull=moving?pull+(clamp(velocity*.52,-1,1)-pull)*(1-Math.exp(-8*dt)):0;
 x+=(lightX-x)*(moving?1-Math.exp(-12*dt):1);
 y+=(lightY-y)*(moving?1-Math.exp(-12*dt):1);
 const lx=clamp(x*.72+(moving?.50*Math.sin(phase*.95)+pull*.28:0),-1.2,1.2);
 const ly=clamp(y*.72+(moving?.24*Math.sin(phase*.71+.35):0),-1,1);
 if(p!==lastTypePosition||spot!==lastTypeSpot){
  for(const section of sections.slice(Math.floor(p),Math.ceil(p)+1)){
   lightType(section.querySelector('.chrome-type'),spot,moving);
  }
  lastTypePosition=p;lastTypeSpot=spot;
 }
 const stageBox=stage.getBoundingClientRect();
 const lamp=spot&&!menu.isOpen()?{x:spot.x-stageBox.left,y:spot.y-stageBox.top}:null;
 stage.style.setProperty('--lamp-x',(lamp?.x??-900)+'px');stage.style.setProperty('--lamp-y',(lamp?.y??-900)+'px');
 const pins=drawChain(w,h,p,lx,ly,mobile,{enabled:moving,phase:moving?phase:0,pull,dt,spot:lamp,stageBox},tags.length);
 tags.forEach((tag,j)=>{
  const pin=pins[j];if(!pin)return;
  tag.el.hidden=pin.x<-.32*w||pin.x>1.32*w;
  if(tag.el.hidden)return;
  const width=tag.el.offsetWidth,height=width*1.36;
  const dx=lamp?(lamp.x-pin.x)/(width*.59):3,dy=lamp?(lamp.y-pin.y-height*.55)/(height*.59):3;
  const near=lamp?Math.exp(-1.4*(dx*dx+dy*dy)):0;
  const target=moving?-pull*35+2.5*Math.sin(phase*1.34+j*.85)-near*(dx*37+9)+clamp(pin.impulse*.043,-15,15):0;
  if(moving){
   tag.velocity+=((target-tag.angle)*67-tag.velocity*5.5)*dt;
   tag.angle=clamp(tag.angle+tag.velocity*dt,-48,48);
  }else{tag.angle=0;tag.velocity=0}
  const follow=moving?1-Math.exp(-11*dt):1;
  tag.turn+=((moving?near*dx*63:0)-tag.turn)*follow;
  tag.tilt+=((moving?near*(dy*37-10):0)-tag.tilt)*follow;
  const approach=clamp((pin.x/w-(mobile?.65:.74))*1.65,-1,1);
  const breath=moving?Math.sin(phase*.80+j*2.4+.15*Math.sin(phase*.31)):0;
  const yaw=moving?(-11+breath*1.3+approach*42+pull*13+tag.turn):0;
  tag.el.style.setProperty('--pitch',tag.tilt.toFixed(2)+'deg');
  tag.el.style.setProperty('--hot',near.toFixed(2));
  tag.el.style.setProperty('--hot-x',clamp(50+dx*52,0,100)+'%');
  tag.el.style.setProperty('--hot-y',clamp(50+dy*47,0,100)+'%');
  tag.el.style.setProperty('--pin-x',pin.x.toFixed(2)+'px');
  tag.el.style.setProperty('--pin-y',pin.y.toFixed(2)+'px');
  tag.el.style.setProperty('--swing',(5+tag.angle).toFixed(2)+'deg');
  tag.el.style.setProperty('--tilt',yaw.toFixed(2)+'deg');
  tag.el.style.setProperty('--depth',(pin.depth*(1-.12*Math.abs(approach))*(1+.009*breath)).toFixed(3));
  tag.el.style.setProperty('--flare',(55+lx*20+yaw*.3)+'%');
  drawCast(tag.sculpture,emblem(entries[j].id),{
   yaw:-.28+yaw*.009,pitch:-.14+tag.tilt*.012,lx:lamp?Math.tanh(dx):-.53,ly:lamp?Math.tanh(dy):-.4,power:.16+near*2.2,scale:1.0
  });
 });
 if(moving||wheelGoal!==null)queue();
}
function resize(){
 const was=index<0?Math.max(0,chapterFromHash(location.hash)):index;
 w=stage.clientWidth;h=stage.clientHeight;mobile=matchMedia('(max-width:680px) and (orientation:portrait)').matches;
 goto(was,false);lastPosition=was;pull=0;lastSynced=lastTypePosition=NaN;queue();
}
new ResizeObserver(resize).observe(stage);resize();
strip.addEventListener('scroll',queue,{passive:true});
stage.addEventListener('wheel',e=>{
 travel=null;
 if(menu.isOpen())menu.close();
 if(e.ctrlKey||e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!e.deltaY){wheelGoal=null;return}
 const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?strip.clientWidth:1);
 e.preventDefault();
 if(!animated()){wheelGoal=null;strip.scrollLeft+=delta;return}
 wheelGoal=clamp((wheelGoal??strip.scrollLeft)+delta,0,strip.scrollWidth-strip.clientWidth);
 queue();
},{passive:false});
function light(e){
 spot={x:e.clientX,y:e.clientY};
 if(dialog.open)lightType($('#sheet-title'),spot,animated());
 const box=stage.getBoundingClientRect();
 lightX=clamp((e.clientX-box.left)/box.width*2-1,-1,1);
 lightY=clamp((e.clientY-box.top)/box.height*2-1,-1,1);
 queue();
}
document.addEventListener('pointermove',light,{passive:true});stage.addEventListener('pointerdown',e=>{travel=null;wheelGoal=null;light(e)},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{spot=null;lightX=0;lightY=-.12;if(dialog.open)lightType($('#sheet-title'),null);queue()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else queue()});
function motionControl(){
 document.body.classList.toggle('still',!animated());lastTypePosition=NaN;
 const button=$('#motion'),label=animated()?'Mettre le mouvement en pause':'Reprendre le mouvement';
 menu.motionChanged();button.disabled=reduced.matches;
 button.textContent=animated()?'Ⅱ':'▷';
 button.title=reduced.matches?'Mouvement réduit':label;
 button.setAttribute('aria-label',button.title);
 timestamp=0;queue();
}
$('#motion').addEventListener('click',()=>{
 paused=!paused;try{sessionStorage.setItem('chrome-motion',paused?'off':'on')}catch{}
 motionControl();
});
reduced.addEventListener('change',motionControl);motionControl();
function goLink(e){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();goto(chapterFromHash(this.hash))}
nav.forEach(a=>a.addEventListener('click',goLink));$('.brand').addEventListener('click',goLink);
$('.inline-practices').addEventListener('click',goLink);$('#prev').addEventListener('click',()=>goto(index-1));$('#next').addEventListener('click',()=>goto(index+1));
const tip=$('.rail-tip');
let tipIndex=-1,draggingRail=false;
function previewRail(at){
 const n=clamp(Math.round(at),0,entries.length-1);
 if(tipIndex!==n){
  tipIndex=n;tip.querySelector('span').textContent=entries[n].short||entries[n].title;
  drawCast(tip.querySelector('canvas'),emblem(entries[n].id),{scale:1.13});
 }
 tip.hidden=false;
 const r=rail.getBoundingClientRect(),half=tip.offsetWidth/2;
 const x=r.left+14+(r.width-28)*n/(entries.length-1);
 tip.style.left=(clamp(x,half+8,innerWidth-half-8)-r.left)+'px';
}
function previewPointer(e){
 const r=rail.getBoundingClientRect();
 previewRail((e.clientX-r.left-14)/Math.max(1,r.width-28)*(entries.length-1));
}
rail.addEventListener('pointermove',previewPointer);
rail.addEventListener('pointerdown',e=>{draggingRail=true;travel=null;wheelGoal=null;previewPointer(e)});
rail.addEventListener('pointerleave',()=>{if(!draggingRail)tip.hidden=true});
window.addEventListener('pointerup',()=>{if(draggingRail){draggingRail=false;tip.hidden=true}});
window.addEventListener('pointercancel',()=>{draggingRail=false;tip.hidden=true});
rail.addEventListener('blur',()=>{draggingRail=false;tip.hidden=true});
rail.addEventListener('input',()=>{
 const p=Number(rail.value)/1000;
 travel=null;wheelGoal=null;strip.scrollLeft=p*strip.clientWidth;previewRail(p);
});
rail.addEventListener('change',()=>{goto(Math.round(Number(rail.value)/1000));tip.hidden=true});
rail.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey)return;
 const keys={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1,Home:-entries.length,End:entries.length};
 if(!(e.key in keys))return;
 e.preventDefault();e.stopPropagation();
 const n=clamp((travel?.end??index)+keys[e.key],0,entries.length-1);
 goto(n);previewRail(n);
});
document.addEventListener('keydown',e=>{
 if(menu.isOpen()||dialog.open||e.ctrlKey||e.altKey||e.metaKey)return;
 const keys={ArrowRight:index+1,ArrowLeft:index-1,Home:0,End:entries.length-1};
 if(!(e.key in keys))return;e.preventDefault();goto(keys[e.key]);
});
window.addEventListener('hashchange',()=>{const i=chapterFromHash(location.hash);if(i>=0)goto(i,false)});
function openSheet(item){
 menu.close();previousFocus=document.activeElement;$('#sheet-type').textContent=item.type;setChromeType($('#sheet-title'),item.id,item.title,Boolean(item.id));
 $('#sheet-copy').textContent=item.copy;
 const icon=$('#sheet-emblem');icon.hidden=!item.id;
 if(item.id)drawCast(icon,emblem(item.id),{yaw:-.36,pitch:-.12,scale:1.05});
 const actions=$('#sheet-actions');actions.replaceChildren();
 const body=$('#sheet-body');body.replaceChildren();
 if(item.status||item.tags?.length){
  const note=document.createElement('ul');note.className='project-tags';
  for(const value of [item.status,...(item.tags||[])].filter(Boolean)){
   const tag=document.createElement('li');tag.textContent=value;note.append(tag);
  }
  body.append(note);
 }
 if(item.features?.length){
  const list=document.createElement('ul');for(const feature of item.features){const li=document.createElement('li');li.textContent=feature;list.append(li)}body.append(list);
 }
 for(const practice of item.practices||[]){
  const a=document.createElement('a');a.className='practice-action';a.href=practice.href==='#home'?'#chrome':practice.href;
  const strong=document.createElement('strong');strong.textContent=practice.verb;
  const words=document.createElement('small');words.textContent=practice.words+' · '+practice.project+' ↗';
  a.append(strong,words);a.addEventListener('click',e=>{
   if(e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();previousFocus=strip;dialog.close();goto(chapterFromHash(a.hash));
  });body.append(a);
 }
 for(const link of item.links||[]){
  const a=document.createElement('a');a.className='outgoing';a.href=link.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=link.label;actions.append(a);
 }
 travel=null;wheelGoal=null;dialog.showModal();dialog.scrollTop=0;$('#close').focus({preventScroll:true});
}
$('#guide').addEventListener('click',()=>openSheet({type:'Chrome',title:'Mode d’emploi',copy:'Fais défiler avec la molette ou le pavé tactile. Sur téléphone, glisse pour parcourir les projets ou maintiens le doigt une demi-seconde sur la scène pour ouvrir Maillons. Sur ordinateur, ouvre le même menu avec un clic droit. Les flèches et la réglette parcourent les chapitres.\n\nPasse sur un maillon pour soulever la chaîne. Effleure un badge pour le faire pivoter, ou clique dessus pour ouvrir sa fiche. Dans Maillons, choisis une sculpture suspendue pour rejoindre le projet.'}));
for(const btn of strip.querySelectorAll('[data-open]'))btn.addEventListener('click',()=>{const i=Number(btn.dataset.open);if(i===0)goto(1);else openSheet(entries[i])});
$('#close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('close',()=>{timestamp=0;queue();previousFocus?.focus({preventScroll:true})});
// The transparent horizontal scroller remains the touch surface over the badge.
function hitBadge(e){
 return tags.findIndex(tag=>{
  if(tag.el.hidden)return false;
  const r=tag.el.querySelector('.plaque').getBoundingClientRect();
  return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
 });
}
strip.addEventListener('pointermove',e=>strip.classList.toggle('stage-hit',e.pointerType==='mouse'&&hitBadge(e)>=0));
strip.addEventListener('pointerleave',()=>strip.classList.remove('stage-hit'));
let press=null;
strip.addEventListener('pointerdown',e=>{press={x:e.clientX,y:e.clientY}},{passive:true});
strip.addEventListener('pointercancel',()=>{press=null});
strip.addEventListener('click',e=>{
 if(e.detail&&(!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>9))return;
 if(e.target.closest('a,button'))return;
 const hit=hitBadge(e);if(hit<0)return;
 if(hit!==index){goto(hit);return}
 openSheet(entries[hit]);
});
