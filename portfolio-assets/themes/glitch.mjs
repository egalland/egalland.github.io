import {start as startCursors} from './cursors.mjs';
import {bandPolygon,svgPath,clipToRect} from './page-rifts.mjs';
import {wordCloud} from './rift-points.mjs?v=signal5';
import {createCloud} from './point-cloud.mjs';
import {createPointRenderer} from './point-renderer.mjs';
import {createPointInteraction} from './point-interaction.mjs';
import {signalEdge,edgePackets,faultPower} from './digital-signal.mjs';

const arrived=new WeakSet(),SVG='http://www.w3.org/2000/svg';
const worlds=[
 ['.hero-copy','curseurs'],['.hero-art','points'],['.metrics','points'],['.hero-bottom','points'],
 ['#work>.section-marker','points'],['#work>.section-heading','points'],['#market-plus','points'],
 ['#kikalmo','curseurs'],['#kikalmo .project-copy','curseurs'],['#maison','points'],['#bodyos','curseurs'],
 ['#atelier>.section-marker','curseurs'],['#atelier>.section-heading','curseurs'],
 ['#livre','curseurs'],['#redim','curseurs'],['#atlas','points'],['#four-en-route','points'],
 ['#biscuit-du-jour','curseurs'],['#inktober','curseurs'],['#about','curseurs'],['#contact','points'],['footer','points']
];
const pointSlots=[['.hero-art','hero',0],['#market-plus .project-window','market',5],['#kikalmo .project-window','word',-1],['#maison .project-window','maison',6],['#atlas .lab-art','atlas',13],['#four-en-route .lab-art','timer',14]];
const pathFor=polygon=>{const path=new Path2D();polygon.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));path.closePath();return path;};

export function start({forms,reduced=false}={}){
 const root=document.documentElement,abort=new AbortController(),timers=new Set(),attributes=[];
 const on=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal:abort.signal});
 const $=selector=>document.querySelector(selector);
 function mark(el,key,value){if(!el)return;attributes.push([el,key,el.getAttribute(key)]);el.setAttribute(key,value);}
 for(const [selector,world] of worlds)mark($(selector),'data-rift-world',world);
 const layer=document.createElementNS(SVG,'svg');layer.id='rift-page';layer.setAttribute('aria-hidden','true');layer.setAttribute('preserveAspectRatio','none');document.body.prepend(layer);
 const canvas=document.createElement('canvas');canvas.id='rift-points';canvas.dataset.engine='glitch';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const renderer=createPointRenderer(canvas,{masked:true,onFallback:()=>queueMicrotask(()=>{if(!stopped){dirty=true;scheduleLayout();wake();}})});
 const slots=pointSlots.map(([selector,kind,index])=>{
  const el=$(selector);if(!el)return null;
  const style=el.style.clipPath,children=[...el.children].map(child=>({el:child,inert:child.inert,aria:child.getAttribute('aria-hidden')}));
  mark(el,'data-rift-stage',kind==='word'?'mixed':'points');
  if(kind!=='word')for(const child of children){child.el.inert=true;child.el.setAttribute('aria-hidden','true');}
  return {el,kind,index,style,children,rect:null,clip:null,cloud:null};
 }).filter(Boolean);
 let width=innerWidth,height=innerHeight,regions=[],lightPath=new Path2D(),raf=0,layoutRaf=0,lastPaint=0,time=0,last=0,hidden=document.hidden,stopped=false;
 let dirty=true,cursorEngine=null,cursorMobile=innerWidth<=700,frameBudget=innerWidth<=700?2600:4400,edges=[],burstAt=-100,burstEdge=null;
 const interaction=createPointInteraction(slots,{signal:abort.signal,wake,reduced});
 const box=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,top:r.top+scrollY,right:r.right,bottom:r.bottom+scrollY,width:r.width,height:r.height};};
 const makeEdge=(guides,seed)=>signalEdge(guides,seed,width<=700?5:7);
 function scheduleLayout(){if(!layoutRaf&&!stopped)layoutRaf=requestAnimationFrame(layout);}
 function createSvg(name,attrs){const node=document.createElementNS(SVG,name);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);return node;}
 const revealObserver=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting&&!arrived.has(entry.target)){
   arrived.add(entry.target);if(!reduced)triggerFault(Number(entry.target.dataset.riftArrival));
  }
 },{threshold:.08});
 const triggers=[$('.hero-art'),$('#maison'),$('#atlas'),$('#contact')].filter(Boolean);
 triggers.forEach((el,i)=>{mark(el,'data-rift-arrival',String(i));revealObserver.observe(el);});
 function layout(){
  layoutRaf=0;if(stopped)return;
  width=innerWidth;height=innerHeight;frameBudget=width<=700?2600:4400;
  $('#kikalmo .project-copy').dataset.riftWorld=width<=700?'points':'curseurs';
  const hero=box($('#home')),art=box($('.hero-art')),copy=box($('.hero-copy')),metrics=box($('.metrics')),market=box($('#market-plus')),kikalmo=box($('#kikalmo')),word=box($('#kikalmo .project-window'));
  const maison=box($('#maison')),body=box($('#bodyos')),atlas=box($('#atlas')),timer=box($('#four-en-route')),contact=box($('#contact')),footer=box($('footer'));
  if(!hero||!word||!maison||!atlas||!contact)return;
  const pageHeight=Math.ceil(Math.max(footer?.bottom||0,contact.bottom)+2),mobile=width<=700;
  // First cut enters across the whole hero, then opens into the entire Market section.
  const topGuides=mobile?[[0,art.top-26],[width,art.top-5]]:[
   [0,metrics.top-30],[Math.min(copy.right-55,width*.46),Math.max(copy.bottom+24,metrics.top-45)],
   [Math.min(art.left-18,width*.59),hero.top+45],[width,hero.top+18]
  ];
  // The same page cut continues through one real interface: Kikalmo remains usable below it.
  const cutStart=Math.min(kikalmo.top+4,word.top-36),gap=mobile?0:Math.max(width*.47,word.left-35);
  const bottomGuides=mobile?
   [[0,word.top-12],[word.left+word.width*.65,word.top+word.height*.42],[width,word.top+word.height*.5]]:
   [[0,cutStart],[gap,cutStart],[word.left+word.width*.6,word.top+word.height*.44],[word.right,word.top+word.height*.49],[width,word.top+word.height*.68]];
  const firstTop=makeEdge(topGuides,12),firstBottom=makeEdge(bottomGuides,21);
  const secondTop=makeEdge([[0,maison.top-19],[width,maison.top+15]],47);
  const secondBottom=makeEdge([[0,maison.bottom+13],[width,Math.min(maison.bottom+48,body.top-18)]],60);
  const thirdTop=makeEdge([[0,atlas.top-22],[width,Math.min(atlas.top,timer.top)-3]],86);
  const thirdBottom=makeEdge([[0,Math.max(atlas.bottom,timer.bottom)+20],[width,Math.max(atlas.bottom,timer.bottom)+4]],98);
  const lastTop=makeEdge([[0,contact.top+5],[width,contact.top-24]],131),lastBottom=[[0,pageHeight],[width,pageHeight]];
  const boundaries=[[firstTop,firstBottom],[secondTop,secondBottom],[thirdTop,thirdBottom],[lastTop,lastBottom]];
  regions=boundaries.map(([top,bottom])=>bandPolygon(top,bottom));lightPath=new Path2D();for(const polygon of regions)lightPath.addPath(pathFor(polygon));
  layer.setAttribute('viewBox',`0 0 ${width} ${pageHeight}`);layer.style.height=pageHeight+'px';
  const fragment=document.createDocumentFragment();edges=[];
  boundaries.forEach(([top,bottom],i)=>{
   const group=createSvg('g',{'data-rift-band':i});group.append(createSvg('path',{d:svgPath(regions[i]),fill:'#eeece5'}));
   for(const edge of [top,bottom]){
    if(edge===lastBottom)continue;const d=edge.map((p,j)=>(j?'L':'M')+p.map(v=>v.toFixed(1)).join(',')).join(' ');
    group.append(createSvg('path',{d,class:'signal-edge'}));group.append(createSvg('path',{d,class:'signal-channel'}));
    edges.push({band:i,top:Math.min(...edge.map(p=>p[1])),bottom:Math.max(...edge.map(p=>p[1])),packets:edgePackets(edge,i*17+edges.length,width<=700?65:120)});
   }
   fragment.append(group);
  });layer.replaceChildren(fragment);
  // Clip actual HTML only at the single crossing; the shared document is never duplicated.
  const darkBelow=[...firstBottom,[width,pageHeight],[0,pageHeight]];
  for(const slot of slots){
   slot.rect=box(slot.el);const r=slot.rect;if(!r?.width||!r.height)continue;
   slot.clip=new Path2D();for(const region of regions){const polygon=clipToRect(region,r);if(polygon.length)slot.clip.addPath(pathFor(polygon));}
   const budget=renderer.backend==='webgl-3d'?(mobile?1250:2100):(mobile?600:900);
   const cloudKey=r.width.toFixed(1)+':'+r.height.toFixed(1)+':'+budget+(slot.kind==='word'?$('#word-letters').textContent:'');
   if(slot.kind==='word'){
    const dark=clipToRect(darkBelow,r);slot.el.style.clipPath='polygon('+dark.map(p=>`${(p[0]-r.left).toFixed(1)}px ${(p[1]-r.top).toFixed(1)}px`).join(',')+')';
    if(slot.cloudKey!==cloudKey)slot.cloud=wordCloud(slot.el,mobile?550:850);
   }else if(slot.cloudKey!==cloudKey)slot.cloud=createCloud(forms[slot.index],{limit:budget});
   slot.cloudKey=cloudKey;
  }
  renderer.resize(width,height,Math.min(devicePixelRatio||1,mobile?1.35:1.6));renderer.setMask(regions);
  root.dataset.riftRegions=String(regions.length);dirty=true;wake();
  if(cursorEngine&&cursorMobile!==mobile)launchCursors();
 }
 function clipCursors(context,w,h){
  context.translate(0,-scrollY);const path=new Path2D();path.rect(0,scrollY,w,h);path.addPath(lightPath);context.clip(path,'evenodd');context.translate(0,scrollY);
 }
 const accept=el=>el.closest('[data-rift-world]')?.dataset.riftWorld!=='points'&&!el.closest('[data-rift-stage]');
 function triggerFault(band){
  if(reduced||hidden||stopped||performance.now()/1000-burstAt<.7)return;
  const visible=edges.filter(e=>e.bottom-scrollY>75&&e.top-scrollY<height&&(band===undefined||e.band===band));
  burstEdge=visible.sort((a,b)=>Math.abs((a.top+a.bottom)/2-scrollY-height/2)-Math.abs((b.top+b.bottom)/2-scrollY-height/2))[0]||null;
  if(!burstEdge)return;
  burstAt=performance.now()/1000;root.dataset.glitchBursts=String(Number(root.dataset.glitchBursts||0)+1);
  const group=layer.querySelector('[data-rift-band="'+burstEdge.band+'"]');group?.classList.add('signal-active');
  const heading=[...document.querySelectorAll('main h1,main h3')].filter(el=>{const r=el.getBoundingClientRect();return r.top>80&&r.bottom<height&&(!el.dataset.construction||el.dataset.construction==='done');}).sort((a,b)=>Math.abs(a.getBoundingClientRect().top-height/2)-Math.abs(b.getBoundingClientRect().top-height/2))[0];
  let echo=null;if(heading){echo=document.createElement('span');echo.className='signal-echo';echo.setAttribute('aria-hidden','true');echo.textContent=heading.innerText;heading.classList.add('signal-host');heading.append(echo);}
  const id=setTimeout(()=>{group?.classList.remove('signal-active');echo?.remove();heading?.classList.remove('signal-host');timers.delete(id);},640);timers.add(id);dirty=true;wake();
 }
 function launchCursors(){
  cursorEngine?.stop();cursorMobile=width<=700;
  cursorEngine=startCursors({reduced,resume:true,accept,cursorCount:cursorMobile?4:5,maxWorkers:cursorMobile?2:3,resizeWindows:false,frameInterval:cursorMobile?50:42,maxDpr:cursorMobile?1:1.25,clipFrame:clipCursors,idleWhenEmpty:true});
 }
 function wake(){if(!raf&&!hidden&&!stopped)raf=requestAnimationFrame(frame);}
 function frame(stamp){
  raf=0;if(hidden||stopped)return;
  const interval=renderer.backend==='webgl-3d'?(width<=700?33:16):(width<=700?50:42);if(!reduced&&stamp-lastPaint<interval){wake();return;}lastPaint=stamp;
  const dt=last?Math.min((stamp-last)/1000,.08):0;last=stamp;if(!reduced)time+=dt;
  if(reduced&&!dirty)return;dirty=false;
  const began=performance.now();renderer.begin(scrollY);
  const fault=reduced?0:faultPower(stamp/1000-burstAt);
  const visible=slots.filter(slot=>slot.rect&&slot.cloud&&slot.rect.bottom-scrollY>74&&slot.rect.top-scrollY<height).sort((a,b)=>Math.abs((a.rect.top+a.rect.bottom)/2-scrollY-height/2)-Math.abs((b.rect.top+b.rect.bottom)/2-scrollY-height/2)).slice(0,2);
  let drawn=0;for(const slot of visible){
   const r=slot.rect,word=slot.kind==='word',camera=word?{yaw:0,pitch:0}:interaction.camera(slot,time);
   if(drawn+slot.cloud.count<=frameBudget){
    renderer.draw(slot.cloud,{...camera,cx:r.left+r.width/2,cy:r.top-scrollY+r.height/2,scale:word?1:Math.min(r.width/4.7,r.height/3.5),rect:{left:r.left,top:r.top-scrollY,width:r.width,height:r.height},dotSize:word?1.8:2.25,fault},time,reduced);drawn+=slot.cloud.count;
    if(!word)root.dataset.riftYaw=camera.yaw.toFixed(3);
   }
  }
  if(fault&&burstEdge)renderer.draw(burstEdge.packets,{cx:0,cy:-scrollY,scale:1,masked:false,packet:true,dotSize:4,opacity:fault*.8,fault},time,reduced);
  root.dataset.riftDots=String(drawn);root.dataset.riftPaintMs=(performance.now()-began).toFixed(2);root.dataset.riftFrames=String(Number(root.dataset.riftFrames||0)+1);
  root.dataset.riftRenderer=renderer.backend;root.dataset.riftGeometry='xyz';root.dataset.glitchFault=fault.toFixed(2);
  if(!reduced&&(visible.length||fault))wake();
 }
 const resizeObserver=new ResizeObserver(scheduleLayout);resizeObserver.observe($('main'));if($('footer'))resizeObserver.observe($('footer'));
 const wordObserver=new MutationObserver(scheduleLayout);if($('#word-letters'))wordObserver.observe($('#word-letters'),{childList:true,characterData:true,subtree:true});
 on(window,'resize',scheduleLayout,{passive:true});on(window,'scroll',()=>{dirty=true;wake();},{passive:true});
 on(document,'portfolio:glitch',()=>triggerFault());
 on(document,'visibilitychange',()=>{hidden=document.hidden;if(hidden){cancelAnimationFrame(raf);raf=0;}else{last=0;dirty=true;wake();}});
 root.dataset.glitchEngine='active';layout();
 launchCursors();
 const faultTimer=reduced?0:setInterval(()=>triggerFault(),6800);
 document.fonts.ready.then(()=>{if(!stopped){for(const slot of slots)slot.cloudKey=null;scheduleLayout();}});
 return {stop(){
  stopped=true;abort.abort();clearInterval(faultTimer);cancelAnimationFrame(raf);cancelAnimationFrame(layoutRaf);resizeObserver.disconnect();wordObserver.disconnect();revealObserver.disconnect();for(const timer of timers)clearTimeout(timer);cursorEngine?.stop();interaction.stop();renderer.dispose();
  document.querySelectorAll('.signal-echo').forEach(el=>el.remove());document.querySelectorAll('.signal-host').forEach(el=>el.classList.remove('signal-host'));
  for(const slot of slots){slot.el.style.clipPath=slot.style;for(const child of slot.children){child.el.inert=child.inert;if(child.aria===null)child.el.removeAttribute('aria-hidden');else child.el.setAttribute('aria-hidden',child.aria);}}
  for(const [el,key,value] of attributes.reverse())if(value===null)el.removeAttribute(key);else el.setAttribute(key,value);
  layer.remove();for(const key of ['glitchEngine','riftRegions','riftDots','riftPaintMs','riftRenderer','riftGeometry','riftYaw','glitchFault'])delete root.dataset[key];
 }};
}
