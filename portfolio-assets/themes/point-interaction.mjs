import {clamp,sceneCamera} from './point-cloud.mjs?v=kinetic1';
import {arrivalScatter} from './kinetics.mjs?v=kinetic1';

export function createPointInteraction(slots,{signal,wake,reduced=false}){
 const pointer={x:-1000,y:-1000,active:false,down:false},attributes=[];
 const listen=(target,name,fn)=>target.addEventListener(name,fn,{signal,passive:name!=='keydown'});
 function hit(x,y){return slots.find(s=>s.kind!=='word'&&s.rect&&x>=s.rect.left&&x<=s.rect.right&&y>=s.rect.top-scrollY&&y<=s.rect.bottom-scrollY);}
 function mark(el,name,value){attributes.push([el,name,el.getAttribute(name)]);el.setAttribute(name,value);}
 for(const slot of slots.filter(s=>s.kind!=='word')){
  slot.orbit={x:0,y:0};mark(slot.el,'tabindex','0');mark(slot.el,'role','group');
  const title=slot.el.closest('article,a')?.querySelector('h3')?.textContent||'Emmanuel Galland';
  mark(slot.el,'aria-label','Modèle 3D en points — '+title);
 }
 let dragged=null,lastX=0,lastY=0;
 listen(document,'pointermove',e=>{
  pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=e.pointerType!=='touch'||pointer.down;
  if(dragged&&pointer.down&&!reduced){dragged.orbit.y+=(e.clientX-lastX)*.006;dragged.orbit.x=clamp(dragged.orbit.x+(e.clientY-lastY)*.003,-.38,.38);}
  lastX=e.clientX;lastY=e.clientY;wake();
 });
 listen(document,'pointerdown',e=>{
  if(e.button!==0||e.target.closest('button,a,input,textarea,dialog'))return;
  dragged=hit(e.clientX,e.clientY)||null;if(!dragged)return;
  pointer.x=lastX=e.clientX;pointer.y=lastY=e.clientY;pointer.active=true;pointer.down=true;wake();
 });
 const release=()=>{pointer.down=false;dragged=null;wake();};
 listen(document,'pointerup',release);listen(document,'pointercancel',release);
 listen(window,'blur',()=>{pointer.active=false;release();});
 listen(document,'pointerleave',()=>{pointer.active=false;release();});
 listen(document,'keydown',e=>{
  const slot=slots.find(s=>s.el===e.target);if(!slot||!slot.orbit||!e.key.startsWith('Arrow')||reduced)return;
  e.preventDefault();if(e.key==='ArrowLeft')slot.orbit.y-=.15;if(e.key==='ArrowRight')slot.orbit.y+=.15;if(e.key==='ArrowUp')slot.orbit.x-=.08;if(e.key==='ArrowDown')slot.orbit.x+=.08;wake();
 });
 return {
  camera(slot,time){
   const r=slot.rect,hover=pointer.active&&r&&hit(pointer.x,pointer.y)===slot;
   const top=r.top-scrollY,centerY=top+r.height/2,nav=innerWidth<=700?65:74;
   const local=hover?{x:clamp((pointer.x-r.left-r.width/2)/(r.width/2),-1,1),y:clamp((pointer.y-centerY)/(r.height/2),-1,1)}:{x:0,y:0};
   const visible=Math.min(innerHeight,top+r.height)-Math.max(nav,top);
   const fraction=visible/Math.max(1,Math.min(r.height,innerHeight-nav));
   const scatter=arrivalScatter(slot,time,fraction,reduced),scrollTilt=(innerHeight/2-centerY)/(innerHeight/2);
   return {...sceneCamera(slot.kind,time,local,slot.orbit,reduced,scrollTilt),scatter,pointer:hover&&!reduced?pointer:null,attraction:pointer.down&&hover};
  },
  stop(){for(const [el,key,value] of attributes.reverse())if(value===null)el.removeAttribute(key);else el.setAttribute(key,value);}
 };
}
