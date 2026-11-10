import {advances} from './lettering/metrics.js';
import {cast,drawCast} from './sculpture.js';
const forms=new Map(),models=new WeakMap(),pointers=new WeakMap(),reveals=new WeakMap();
function wordModel(url){
 if(!forms.has(url)){
  const p=new Promise((resolve,reject)=>{
   const img=new Image();img.onload=()=>{
    const mask=document.createElement('canvas');mask.height=126;mask.width=Math.round(img.width*126/img.height);
    mask.getContext('2d').drawImage(img,0,0,mask.width,mask.height);
    resolve(cast(mask,6.4));
   };img.onerror=reject;img.src=url;
  });forms.set(url,p);
 }
 return forms.get(url);
}
function paint(word,pointer,moving,arrival=0){
 const model=models.get(word);if(!model)return;
 const r=word.getBoundingClientRect();if(!r.width||r.right<0||r.left>innerWidth)return;
 const c=word.querySelector('canvas');
 const w=Math.max(8,Math.round(r.width*Math.min(1.4,devicePixelRatio))),h=Math.round(w*model.h/model.w);
 if(c.width!==w||c.height!==h){c.width=w;c.height=h}
 const dx=pointer?(pointer.x-r.left-r.width/2):0,dy=pointer?(pointer.y-r.top-r.height/2):0;
 const lightX=pointer?Math.tanh(dx/(r.width*.56)):-.4,lightY=pointer?Math.tanh(dy/Math.max(38,r.height*.8)):-.45;
 const proximity=pointer?Math.exp(-Math.pow(dx/(r.width*.67+95),2)-Math.pow(dy/155,2)):0;
 drawCast(c,model,{yaw:-.20-arrival*.52+(moving?lightX*proximity*.55:0),pitch:-.12+arrival*.18+(moving?lightY*proximity*.34:0),lx:lightX,ly:lightY,power:.16+proximity*1.5,scale:.97});
 word.classList.add('cast-ready');
}
const observer=typeof IntersectionObserver==="undefined"?null:new IntersectionObserver(entries=>{
 for(const {target,isIntersecting} of entries){
  const token={};reveals.set(target,token);
  if(!isIntersecting)continue;
  wordModel(target.dataset.face).then(m=>{
   if(reveals.get(target)!==token||!target.isConnected)return;
   models.set(target,m);
   const start=performance.now();let last=0;
   function reveal(now){
    if(reveals.get(target)!==token||!target.isConnected)return;
    const moving=!document.body.classList.contains('still')&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
    const t=moving?Math.min(1,(now-start)/680):1;
    if(now-last>=32||t===1){paint(target,pointers.get(target),moving,(1-t)**3);last=now}
    if(t<1)requestAnimationFrame(reveal);
   }
   reveal(start);
  }).catch(()=>{});
 }
},{rootMargin:'40px'});
export function setChromeType(heading,id,title,period=true){
 for(const old of heading.querySelectorAll('.metal-word'))observer.unobserve(old);
 if(!advances[id]||!period){heading.classList.remove('chrome-type');heading.removeAttribute('aria-label');heading.textContent=title;return}
 heading.setAttribute('aria-label',title);heading.classList.add('chrome-type');heading.replaceChildren();
 (title+'.').split(/\s+/).forEach((word,i)=>{
  if(i)heading.append(' ');
  const el=document.createElement('span');el.className='metal-word';el.style.width=advances[id][i]+'em';el.setAttribute('aria-hidden','true');
  const url='/chrome/lettering/'+id+'-'+i+'.webp';el.dataset.face=url;
  const img=new Image();img.alt='';img.src=url;const c=document.createElement('canvas');
  const fallback=document.createElement('span');fallback.className='word-fallback';fallback.textContent=word;img.onload=()=>fallback.hidden=true;
  el.append(fallback,img,c);heading.append(el);observer.observe(el);
 });
}
export function lightType(heading,pointer,moving=true){
 for(const word of heading.querySelectorAll('.metal-word')){pointers.set(word,pointer);paint(word,pointer,moving)}
}
