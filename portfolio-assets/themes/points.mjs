import {createCloud,clamp} from './point-cloud.mjs';
import {createPointRenderer} from './point-renderer.mjs';
import {createPointInteraction} from './point-interaction.mjs';
export {prepare} from './formations.mjs?v=signal5';

const configuration=[
 ['.hero-art',[0],'hero'],['#market-plus .project-window',[4,5],'market'],['#kikalmo .project-window',[2,3,1],'kikalmo'],
 ['#maison .project-window',[6,7],'maison'],['#bodyos .project-window',[8,9],'body'],
 ['#livre .lab-art',[10],'book'],['#redim .lab-art',[11],'redim'],['#atlas .lab-art',[13],'atlas'],
 ['#four-en-route .lab-art',[14],'timer'],['#biscuit-du-jour .lab-art',[15],'biscuit'],['#inktober .lab-art',[16],'calendar']
];
export function start({forms,reduced=false}={}){
 const root=document.documentElement,abort=new AbortController();let stopped=false,dirty=true,hidden=document.hidden,raf=0,layoutRaf=0,time=0,last=0,lastDraw=0,width=innerWidth,height=innerHeight;
 const on=(target,type,fn)=>target.addEventListener(type,fn,{signal:abort.signal,passive:true});
 const canvas=document.createElement('canvas');canvas.id='point-motion';canvas.dataset.engine='points';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const renderer=createPointRenderer(canvas,{onFallback:()=>queueMicrotask(()=>{if(!stopped){for(const s of slots)s.index=-1;dirty=true;wake();}})});
 const slots=configuration.map(([selector,indices,kind],i)=>{
  const el=document.querySelector(selector);if(!el)return null;
  const children=[...el.children].map(child=>({el:child,inert:child.inert,aria:child.getAttribute('aria-hidden')}));
  for(const child of children){child.el.inert=true;child.el.setAttribute('aria-hidden','true');}
  el.dataset.pointSlot=String(i);
  return {el,indices,kind,children,index:-1,changed:0,cloud:null,rect:null};
 }).filter(Boolean);
 const interaction=createPointInteraction(slots,{signal:abort.signal,wake,reduced});
 function wake(){if(!raf&&!hidden&&!stopped)raf=requestAnimationFrame(draw);}
 function measure(){
  layoutRaf=0;if(stopped)return;width=innerWidth;height=innerHeight;
  renderer.resize(width,height,Math.min(devicePixelRatio||1,width<=700?1.35:1.6));
  for(const slot of slots){const r=slot.el.getBoundingClientRect();slot.rect={left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY,width:r.width,height:r.height};}
  dirty=true;wake();
 }
 const schedule=()=>{if(!layoutRaf&&!stopped)layoutRaf=requestAnimationFrame(measure);};
 function draw(stamp){
  raf=0;if(hidden||stopped)return;
  const interval=renderer.backend==='webgl-3d'?(width<=700?33:16):(width<=700?50:42);
  if(!reduced&&stamp-lastDraw<interval){wake();return;}lastDraw=stamp;
  const dt=last?Math.min((stamp-last)/1000,.08):0;last=stamp;if(!reduced)time+=dt;
  if(reduced&&!dirty)return;dirty=false;
  const began=performance.now();renderer.begin();
  const visible=slots.filter(s=>s.rect?.width&&s.rect.bottom-scrollY>65&&s.rect.top-scrollY<height).sort((a,b)=>Math.abs(a.rect.top+a.rect.height/2-scrollY-height/2)-Math.abs(b.rect.top+b.rect.height/2-scrollY-height/2)).slice(0,2);
  let vertices=0;
  for(const s of visible){
   const r=s.rect,index=s.indices[reduced?0:Math.floor(time/11)%s.indices.length];
   const limit=renderer.backend==='webgl-3d'?Math.min(forms[index].length,width<=700?1680:2800):width<=700?700:1100;
   if(s.index!==index||s.cloudLimit!==limit){
    const from=s.index<0?forms[index].map(p=>({...p,x:p.x*.025,y:p.y*.025,z:p.z*.025})):forms[s.index];
    s.cloud=createCloud(forms[index],{from,limit});s.cloudLimit=limit;s.index=index;s.changed=time;s.el.dataset.pointForm=String(index);
   }
   const camera=interaction.camera(s,time),t=reduced?1:clamp((time-s.changed)/1.15,0,1);
   renderer.draw(s.cloud,{...camera,cx:r.left+r.width/2,cy:r.top-scrollY+r.height/2,scale:Math.min(r.width/4.7,r.height/3.5),rect:{left:r.left,top:r.top-scrollY,width:r.width,height:r.height},blend:t*t*(3-2*t),dotSize:2.25},time,reduced);
   vertices+=s.cloud.count;root.dataset.pointYaw=camera.yaw.toFixed(3);
  }
  root.dataset.pointVertices=String(vertices);root.dataset.pointRenderer=renderer.backend;root.dataset.pointGeometry='xyz';root.dataset.pointPaintMs=(performance.now()-began).toFixed(2);root.dataset.pointFrames=String(Number(root.dataset.pointFrames||0)+1);
  if(!reduced&&visible.length)wake();
 }
 const observer=new ResizeObserver(schedule);observer.observe(document.querySelector('main'));for(const s of slots)observer.observe(s.el);
 on(window,'resize',schedule);on(window,'scroll',()=>{dirty=true;wake();});
 on(document,'visibilitychange',()=>{hidden=document.hidden;if(hidden){cancelAnimationFrame(raf);raf=0;}else{last=0;dirty=true;wake();}});
 document.fonts.ready.then(()=>{if(!stopped)schedule();});root.dataset.pointEngine='active';measure();
 return {stop(){
  stopped=true;abort.abort();cancelAnimationFrame(raf);cancelAnimationFrame(layoutRaf);observer.disconnect();interaction.stop();renderer.dispose();
  for(const s of slots){delete s.el.dataset.pointSlot;delete s.el.dataset.pointForm;for(const child of s.children){child.el.inert=child.inert;if(child.aria===null)child.el.removeAttribute('aria-hidden');else child.el.setAttribute('aria-hidden',child.aria);}}
  for(const key of ['pointEngine','pointRenderer','pointGeometry','pointVertices','pointPaintMs','pointYaw'])delete root.dataset[key];
 }};
}
