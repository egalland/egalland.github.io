import {particlePosition} from '../../points/point-motion.mjs';
import {cursorForce,springStep} from '../../points/motion-core.mjs';
import {glitchEnvelope} from '../theme-manager.mjs';
export {prepare} from './formations.mjs';

const configuration=[
 ['.hero-art',[0]],['#market-plus .project-window',[4,5]],['#kikalmo .project-window',[2,3,1]],
 ['#maison .project-window',[6,7]],['#bodyos .project-window',[8,9]],
 ['#livre .lab-art',[10]],['#redim .lab-art',[11]],['#atlas .lab-art',[13]],
 ['#four-en-route .lab-art',[14]],['#biscuit-du-jour .lab-art',[15]],['#inktober .lab-art',[16]]
];
const sharp=new Set([3,5,11]),clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function start({forms,mode='points',reduced=false}={}){
 const root=document.documentElement,mixed=mode==='glitch',abort=new AbortController();
 const on=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:abort.signal});
 const canvas=document.createElement('canvas');canvas.id='point-motion';canvas.dataset.engine='points';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();throw new Error('Rendu Canvas indisponible');}
 let width=innerWidth,height=innerHeight,time=0,last=0,lastDraw=0,raf=0,dirty=true,hidden=document.hidden;
 const count=forms[0].length,point=[0,0,0],pointer={x:-1000,y:-1000,active:false,down:false};
 const colors=forms.map(form=>form.map(p=>{
  const c=mixed?p.c.map(v=>Math.round((v*.55+.45)*255)):p.c.map(v=>Math.round(v*255));return `rgb(${c.join(',')})`;
 }));
 const slots=configuration.map(([selector,indices],i)=>{
  const el=document.querySelector(selector);if(!el)return null;
  const original={inert:el.inert,aria:el.getAttribute('aria-hidden')};
  el.dataset.pointSlot=String(i);
  if(!mixed){el.inert=true;el.setAttribute('aria-hidden','true');}
  return {el,indices,original,index:-1,changed:0,current:new Float32Array(count*3),from:new Float32Array(count*3),ox:new Float32Array(count),oy:new Float32Array(count),vx:new Float32Array(count),vy:new Float32Array(count)};
 }).filter(Boolean);
 function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,width<=700?1.5:1.8);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true;wake();}
 function wake(){if(!raf&&!hidden)raf=requestAnimationFrame(draw);}
 function draw(stamp){
  raf=0;if(hidden)return;if(!reduced&&stamp-lastDraw<32){wake();return;}lastDraw=stamp;
  const dt=last?Math.min((stamp-last)/1000,.05):.016;last=stamp;if(!reduced)time+=dt;
  if(reduced&&!dirty)return;dirty=false;ctx.clearRect(0,0,width,height);
  const envelope=mixed&&!reduced?glitchEnvelope(time):{burst:0,mix:.55,x:0,y:0};
  root.style.setProperty('--glitch-burst',String(envelope.burst));
  const visible=slots.map(slot=>({...slot,r:slot.el.getBoundingClientRect(),state:slot})).filter(s=>s.r.width>0&&s.r.bottom>75&&s.r.top<height&&s.r.height>0).sort((a,b)=>Math.abs(a.r.top+a.r.height/2-height/2)-Math.abs(b.r.top+b.r.height/2-height/2)).slice(0,mixed?3:2);
  for(const {r,state:s} of visible){
   const index=s.indices[reduced?0:Math.floor(time/11)%s.indices.length],form=forms[index],planar=sharp.has(index);
   if(s.index!==index){s.from.set(s.current);s.index=index;s.changed=time;}
   const t=reduced?1:clamp((time-s.changed)/1.15,0,1),blend=t*t*(3-2*t);
   const focused=s.el.contains(document.activeElement),size=Math.min(r.width/4.65,r.height/3.45),cx=r.left+r.width/2,cy=r.top+r.height/2;
   const ry=planar?0:reduced?-.12:Math.sin(time*.15)*.2-.12+(index===0?time*.09:0),rx=planar?0:reduced?.05:.08+Math.sin(time*.12)*.07;
   const co=Math.cos(ry),si=Math.sin(ry),cxo=Math.cos(rx),sxo=Math.sin(rx);
   ctx.save();ctx.beginPath();ctx.rect(r.left,r.top,r.width,r.height);ctx.clip();
   ctx.globalAlpha=mixed?(focused?.09:.34+envelope.mix*.6):.97;
   for(let k=0;k<count;k++){
    const p=form[k],n=k*3,seed=(k*.61803398875)%1;particlePosition(p,time,seed,planar,!reduced,point);
    const x=s.from[n]+(point[0]-s.from[n])*blend,y=s.from[n+1]+(point[1]-s.from[n+1])*blend,z=s.from[n+2]+(point[2]-s.from[n+2])*blend;
    s.current[n]=x;s.current[n+1]=y;s.current[n+2]=z;
    const ax=x*co+z*si,az=-x*si+z*co,ay=y*cxo-az*sxo,depth=y*sxo+az*cxo,perspective=5/(5-depth);
    let px=cx+ax*size*perspective+envelope.x,py=cy-ay*size*perspective+envelope.y;
    if(!reduced&&!mixed){const force=pointer.active?cursorForce(px+s.ox[k]-pointer.x,py+s.oy[k]-pointer.y,pointer.down?155:95,pointer.down?1:0):[0,0];[s.ox[k],s.vx[k]]=springStep(s.ox[k],s.vx[k],force[0],dt);[s.oy[k],s.vy[k]]=springStep(s.oy[k],s.vy[k],force[1],dt);px+=s.ox[k];py+=s.oy[k];}
    const pulse=reduced?1:.95+.08*Math.sin(time*1.2+seed*20),dot=(planar?1.7:1.8)*p.size*perspective*pulse;
    ctx.fillStyle=colors[index][k];ctx.fillRect(px-dot/2,py-dot/2,dot,dot);
   }
   ctx.restore();
  }
  root.dataset.pointFrames=String(Number(root.dataset.pointFrames||0)+1);
  if(!reduced&&visible.length)wake();
 }
 on(window,'resize',resize,{passive:true});on(window,'scroll',()=>{dirty=true;wake();},{passive:true});
 on(document,'pointermove',e=>{if(e.pointerType!=='touch'){pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;}},{passive:true});
 on(document,'pointerdown',e=>{if(e.button===0&&!e.target.closest('button,a,input,dialog')){pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;pointer.down=true;}});
 on(document,'pointerup',()=>{pointer.down=false;});on(document,'pointercancel',()=>{pointer.down=false;});on(window,'blur',()=>{pointer.down=false;pointer.active=false;});
 on(document,'visibilitychange',()=>{hidden=document.hidden;if(hidden){cancelAnimationFrame(raf);raf=0;pointer.down=false;}else{last=0;dirty=true;wake();}});
 root.dataset.pointEngine='active';resize();
 return {stop(){abort.abort();cancelAnimationFrame(raf);canvas.remove();for(const s of slots){delete s.el.dataset.pointSlot;s.el.inert=s.original.inert;if(s.original.aria===null)s.el.removeAttribute('aria-hidden');else s.el.setAttribute('aria-hidden',s.original.aria);}root.style.removeProperty('--glitch-burst');delete root.dataset.pointEngine;}};
}
