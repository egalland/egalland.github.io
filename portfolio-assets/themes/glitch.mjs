import {start as startCursors} from './cursors.mjs';
import {tornEdge,bandPolygon,svgPath,clipToRect} from './page-rifts.mjs';
import {projectCloud,wordCloud,paintCloud} from './rift-points.mjs';

const arrived=new WeakSet(),SVG='http://www.w3.org/2000/svg';
const worlds=[
 ['.hero-copy','curseurs'],['.hero-art','points'],['.metrics','points'],['.hero-bottom','points'],
 ['#work>.section-marker','points'],['#work>.section-heading','points'],['#market-plus','points'],
 ['#kikalmo','curseurs'],['#kikalmo .project-copy','curseurs'],['#maison','points'],['#bodyos','curseurs'],
 ['#atelier>.section-marker','curseurs'],['#atelier>.section-heading','curseurs'],
 ['#livre','curseurs'],['#redim','curseurs'],['#atlas','points'],['#four-en-route','points'],
 ['#biscuit-du-jour','curseurs'],['#inktober','curseurs'],['#about','curseurs'],['#contact','points'],['footer','points']
];
const pointSlots=[['.hero-art','hero'],['#market-plus .project-window','market'],['#kikalmo .project-window','word'],['#maison .project-window','maison'],['#atlas .lab-art','atlas'],['#four-en-route .lab-art','timer']];
const pathFor=polygon=>{const path=new Path2D();polygon.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));path.closePath();return path;};

export function start({reduced=false}={}){
 const root=document.documentElement,abort=new AbortController(),timers=new Set(),attributes=[];
 const on=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal:abort.signal});
 const $=selector=>document.querySelector(selector);
 function mark(el,key,value){if(!el)return;attributes.push([el,key,el.getAttribute(key)]);el.setAttribute(key,value);}
 for(const [selector,world] of worlds)mark($(selector),'data-rift-world',world);
 const layer=document.createElementNS(SVG,'svg');layer.id='rift-page';layer.setAttribute('aria-hidden','true');layer.setAttribute('preserveAspectRatio','none');document.body.prepend(layer);
 const canvas=document.createElement('canvas');canvas.id='rift-points';canvas.dataset.engine='glitch';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});if(!ctx){layer.remove();canvas.remove();throw new Error('Rendu Canvas indisponible');}
 const slots=pointSlots.map(([selector,kind])=>{
  const el=$(selector);if(!el)return null;
  const style=el.style.clipPath,children=[...el.children].map(child=>({el:child,inert:child.inert,aria:child.getAttribute('aria-hidden')}));
  mark(el,'data-rift-stage',kind==='word'?'mixed':'points');
  if(kind!=='word')for(const child of children){child.el.inert=true;child.el.setAttribute('aria-hidden','true');}
  return {el,kind,style,children,rect:null,clip:null,cloud:null};
 }).filter(Boolean);
 let width=innerWidth,height=innerHeight,regions=[],lightPath=new Path2D(),raf=0,layoutRaf=0,lastPaint=0,time=0,last=0,hidden=document.hidden,stopped=false;
 let dirty=true,cursorEngine=null,cursorMobile=innerWidth<=700,frameBudget=innerWidth<=700?1000:1600;
 const box=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,top:r.top+scrollY,right:r.right,bottom:r.bottom+scrollY,width:r.width,height:r.height};};
 const makeEdge=(guides,seed)=>tornEdge(guides,seed,width<=700?8:15);
 function scheduleLayout(){if(!layoutRaf&&!stopped)layoutRaf=requestAnimationFrame(layout);}
 function createSvg(name,attrs){const node=document.createElementNS(SVG,name);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);return node;}
 const revealObserver=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting&&!arrived.has(entry.target)){
   arrived.add(entry.target);if(!reduced){const index=Number(entry.target.dataset.riftArrival),shape=layer.querySelector('[data-rift-band="'+index+'"]');shape?.classList.add('rift-enter');const id=setTimeout(()=>{shape?.classList.remove('rift-enter');timers.delete(id);},350);timers.add(id);}
  }
 },{threshold:.08});
 const triggers=[$('.hero-art'),$('#maison'),$('#atlas'),$('#contact')].filter(Boolean);
 triggers.forEach((el,i)=>{mark(el,'data-rift-arrival',String(i));revealObserver.observe(el);});
 function layout(){
  layoutRaf=0;if(stopped)return;
  width=innerWidth;height=innerHeight;frameBudget=width<=700?1000:1600;
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
  const fragment=document.createDocumentFragment();
  boundaries.forEach(([top,bottom],i)=>{
   const group=createSvg('g',{'data-rift-band':i});group.append(createSvg('path',{d:svgPath(regions[i]),fill:'#eeece5'}));
   for(const edge of [top,bottom]){
    if(edge===lastBottom)continue;const d=edge.map((p,j)=>(j?'L':'M')+p.map(v=>v.toFixed(1)).join(',')).join(' ');
    group.append(createSvg('path',{d,class:'rift-edge'}));group.append(createSvg('path',{d,class:'rift-edge-echo'}));
   }
   fragment.append(group);
  });layer.replaceChildren(fragment);
  // Clip actual HTML only at the single crossing; the shared document is never duplicated.
  const darkBelow=[...firstBottom,[width,pageHeight],[0,pageHeight]];
  for(const slot of slots){
   slot.rect=box(slot.el);const r=slot.rect;if(!r?.width||!r.height)continue;
   slot.clip=new Path2D();for(const region of regions){const polygon=clipToRect(region,r);if(polygon.length)slot.clip.addPath(pathFor(polygon));}
   const cloudKey=r.width.toFixed(1)+':'+r.height.toFixed(1)+(slot.kind==='word'?$('#word-letters').textContent:'');
   if(slot.kind==='word'){
    const dark=clipToRect(darkBelow,r);slot.el.style.clipPath='polygon('+dark.map(p=>`${(p[0]-r.left).toFixed(1)}px ${(p[1]-r.top).toFixed(1)}px`).join(',')+')';
    if(slot.cloudKey!==cloudKey)slot.cloud=wordCloud(slot.el,mobile?500:650);
   }else if(slot.cloudKey!==cloudKey)slot.cloud=projectCloud(slot.kind,r.width,r.height,mobile?500:800);
   slot.cloudKey=cloudKey;
  }
  const dpr=Math.min(devicePixelRatio||1,mobile?1:1.25);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  root.dataset.riftRegions=String(regions.length);dirty=true;wake();
  if(cursorEngine&&cursorMobile!==mobile)launchCursors();
 }
 function clipCursors(context,w,h){
  context.translate(0,-scrollY);const path=new Path2D();path.rect(0,scrollY,w,h);path.addPath(lightPath);context.clip(path,'evenodd');context.translate(0,scrollY);
 }
 const accept=el=>el.closest('[data-rift-world]')?.dataset.riftWorld!=='points'&&!el.closest('[data-rift-stage]');
 function launchCursors(){
  cursorEngine?.stop();cursorMobile=width<=700;
  cursorEngine=startCursors({reduced,resume:true,accept,cursorCount:cursorMobile?4:5,maxWorkers:cursorMobile?2:3,resizeWindows:false,frameInterval:cursorMobile?50:42,maxDpr:cursorMobile?1:1.25,clipFrame:clipCursors,idleWhenEmpty:true});
 }
 function wake(){if(!raf&&!hidden&&!stopped)raf=requestAnimationFrame(frame);}
 function frame(stamp){
  raf=0;if(hidden||stopped)return;
  const interval=width<=700?50:42;if(!reduced&&stamp-lastPaint<interval){wake();return;}lastPaint=stamp;
  const dt=last?Math.min((stamp-last)/1000,.08):0;last=stamp;if(!reduced)time+=dt;
  if(reduced&&!dirty)return;dirty=false;
  const began=performance.now();ctx.clearRect(0,0,width,height);
  const visible=slots.filter(slot=>slot.rect&&slot.cloud&&slot.rect.bottom-scrollY>74&&slot.rect.top-scrollY<height).sort((a,b)=>Math.abs((a.rect.top+a.rect.bottom)/2-scrollY-height/2)-Math.abs((b.rect.top+b.rect.bottom)/2-scrollY-height/2)).slice(0,2);
  let drawn=0;for(const slot of visible){
   ctx.save();ctx.translate(0,-scrollY);ctx.clip(slot.clip);ctx.translate(0,scrollY);
   // Budget is shared between the visible scenes, including narrow-screen transitions.
   if(drawn+slot.cloud.count<=frameBudget){paintCloud(ctx,slot.cloud,slot.rect.left,slot.rect.top-scrollY,time,reduced);drawn+=slot.cloud.count;}ctx.restore();
  }
  root.dataset.riftDots=String(drawn);root.dataset.riftPaintMs=(performance.now()-began).toFixed(2);root.dataset.riftFrames=String(Number(root.dataset.riftFrames||0)+1);
  if(!reduced&&visible.length)wake();
 }
 const resizeObserver=new ResizeObserver(scheduleLayout);resizeObserver.observe($('main'));if($('footer'))resizeObserver.observe($('footer'));
 const wordObserver=new MutationObserver(scheduleLayout);if($('#word-letters'))wordObserver.observe($('#word-letters'),{childList:true,characterData:true,subtree:true});
 on(window,'resize',scheduleLayout,{passive:true});on(window,'scroll',()=>{dirty=true;wake();},{passive:true});
 on(document,'visibilitychange',()=>{hidden=document.hidden;if(hidden){cancelAnimationFrame(raf);raf=0;}else{last=0;dirty=true;wake();}});
 root.dataset.glitchEngine='active';layout();
 launchCursors();
 document.fonts.ready.then(()=>{if(!stopped){for(const slot of slots)slot.cloudKey=null;scheduleLayout();}});
 return {stop(){
  stopped=true;abort.abort();cancelAnimationFrame(raf);cancelAnimationFrame(layoutRaf);resizeObserver.disconnect();wordObserver.disconnect();revealObserver.disconnect();for(const timer of timers)clearTimeout(timer);cursorEngine?.stop();
  for(const slot of slots){slot.el.style.clipPath=slot.style;for(const child of slot.children){child.el.inert=child.inert;if(child.aria===null)child.el.removeAttribute('aria-hidden');else child.el.setAttribute('aria-hidden',child.aria);}}
  for(const [el,key,value] of attributes.reverse())if(value===null)el.removeAttribute(key);else el.setAttribute(key,value);
  layer.remove();canvas.remove();for(const key of ['glitchEngine','riftRegions','riftDots','riftPaintMs'])delete root.dataset[key];
 }};
}
