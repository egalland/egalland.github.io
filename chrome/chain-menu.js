import {enableTouchIndex} from './touch-index.js';
import {emblem,drawCast} from './sculpture.js';
import {makeLinkRenderer} from './chain.js';
import {chapters} from './chapters.js';

export function makeChainMenu({go,current,blocked,animated}){
 const panel=document.querySelector('#chain-index'),trigger=document.querySelector('#index-trigger');
 const track=panel.querySelector('.rack'),wire=panel.querySelector('.index-chain'),nav=panel.querySelector('nav');
 const pages=panel.querySelector('.rack-count'),prev=panel.querySelector('[data-turn="-1"]'),next=panel.querySelector('[data-turn="1"]');
 const items=chapters.map((chapter,i)=>{
  const a=document.createElement('a');a.href='#'+chapter.id;
  const bail=document.createElement('i');bail.className='charm-bail';bail.setAttribute('aria-hidden','true');
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.width=230;canvas.height=180;
  const label=document.createElement('span');label.className='charm-label';label.textContent=chapter.short||chapter.title;
  a.append(bail,canvas,label);nav.append(a);
  a.addEventListener('click',e=>{
   if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
   e.preventDefault();if(!selection){
    if(!animated()){visit(i);return}
    selection={i,start:performance.now()};panel.dataset.choosing='true';schedule();
   }
  });
  return {a,canvas,angle:0,velocity:0,turn:0,phase:0};
 });
 let page=0,per=4,raf=0,last=0,clock=0,pointer=null,before,selection=null,drawWire;
 let anchor={x:0,y:0},focusIndex=-1;
 const isOpen=()=>panel.matches(':popover-open');
 const bound=(v,a,b)=>Math.max(a,Math.min(b,v));
 function refresh(){
  const i=current();items.forEach((item,j)=>j===i?item.a.setAttribute('aria-current','step'):item.a.removeAttribute('aria-current'));

 }
 function show(n){
  page=bound(n,0,Math.ceil(items.length/per)-1);selection=null;delete panel.dataset.choosing;
  pages.textContent=(page+1)+' / '+Math.ceil(items.length/per);prev.disabled=!page;next.disabled=page===Math.ceil(items.length/per)-1;
  nav.style.setProperty('--count',per);
  items.forEach((item,i)=>{
   item.a.hidden=Math.floor(i/per)!==page;
   item.angle=0;item.velocity=0;item.turn=0;item.phase=Math.random()*6.28;
   if(!item.a.hidden&&animated())item.a.animate([{opacity:0,translate:'0 -22px'},{opacity:1,translate:'0 0'}],{duration:330,delay:(i%per)*48,fill:'backwards',easing:'cubic-bezier(.17,.8,.25,1)'});
  });schedule();
 }
 function place(){
  const w=Math.min(innerWidth-16,840),h=Math.min(innerHeight-16,innerWidth<620?285:348);
  panel.style.width=w+'px';panel.style.height=h+'px';
  panel.style.left=bound(anchor.x-w*.5,8,innerWidth-w-8)+'px';const top=anchor.touch?(anchor.y-h-24>=8?anchor.y-h-24:anchor.y+24):anchor.y-h*.42;
  panel.style.top=bound(top,8,innerHeight-h-8)+'px';
  per=w<430?3:4;
 }
 function open(x,y,keyboard,touch=false){
  if(blocked())return;
  if(!isOpen())before=document.activeElement;
  anchor={x,y,touch};pointer=null;focusIndex=-1;last=0;clock=0;panel.showPopover();place();refresh();show(Math.floor(current()/per));
  trigger.setAttribute('aria-expanded','true');if(keyboard)items[current()].a.focus({preventScroll:true});
 }
 function close(restore=false){
  if(!isOpen())return;
  selection=null;cancelAnimationFrame(raf);raf=0;panel.hidePopover();trigger.setAttribute('aria-expanded','false');
  if(restore)(before?.isConnected&&before!==document.body?before:trigger).focus({preventScroll:true});
 }
 function visit(i){close();go(i,true);document.querySelector('#strip').focus({preventScroll:true})}
 function schedule(){if(!raf&&isOpen()&&!document.hidden)raf=requestAnimationFrame(render)}
 function render(now){
  raf=0;if(!isOpen()||document.hidden)return;
  const moving=animated(),dt=last?Math.min(.045,(now-last)/1000):.016;last=now;if(moving)clock+=dt;
  const rect=track.getBoundingClientRect(),w=rect.width,h=rect.height;
  if(!w||!h)return;
  const px=pointer?pointer.x-rect.left:-999,py=pointer?pointer.y-rect.top:-999;
  const pitch=w/per,retire=selection?bound((now-selection.start)/320,0,1):0;
  function line(x){
   const u=x/w;
   return h*(.09+.13*Math.sin(Math.PI*u))-(moving&&pointer?9*Math.exp(-Math.pow((x-px)/(pitch*.7),2)-Math.pow((py-h*.2)/(h*.7),2)):0)+(moving?2.5*Math.sin(u*5-clock*2):0);
  }
  drawWire??=makeLinkRenderer(wire);
  const dpr=Math.min(devicePixelRatio,1.35);if(wire.width!==Math.round(w*dpr)||wire.height!==Math.round(h*dpr)){wire.width=Math.round(w*dpr);wire.height=Math.round(h*dpr)}
  const links=[];
  function span(x,y,X,Y,step){
   const dx=X-x,dy=Y-y,n=Math.max(1,Math.round(Math.hypot(dx,dy)/step));
   for(let i=0;i<n;i++)links.push({x:x+dx*(i+.5)/n,y:y+dy*(i+.5)/n,size:Math.hypot(dx,dy)/n/.79,angle:Math.atan2(dy,dx),twist:i%2?1.97:.4});
  }
  const segments=Math.ceil(w/16);
  for(let j=0;j<segments;j++){
   const x=w*j/segments,X=w*(j+1)/segments,y=line(x),Y=line(X);
   links.push({x:(x+X)/2,y:(y+Y)/2,size:Math.hypot(X-x,Y-y)/.79,angle:Math.atan2(Y-y,X-x),twist:j%2?1.97:.4});
  }
  for(let j=0;j<per;j++){
   const i=page*per+j,item=items[i];if(!item)continue;
   const x=pitch*(j+.5),y=line(x),susp=h*(.17+.12*((j*3+page)%4)/3);
   const objectW=Math.min(pitch*.94,h*.68),objectH=objectW*.77;
   const dx=(px-x)/(pitch*.6),dy=(py-y-susp-objectH*.45)/(objectH*.79);
   const near=pointer?Math.exp(-1.65*(dx*dx+dy*dy)):0,focus=i===focusIndex;
   const sway=moving?Math.sin(clock*.9+item.phase)*2.9+near*bound(dx*35,-27,27):0;
   if(moving){
    item.velocity+=((sway-item.angle)*78-item.velocity*7)*dt;item.angle+=item.velocity*dt;
    item.turn+=((near*Math.tanh(dx*2)*.8+(focus?.22:0))-item.turn)*(1-Math.exp(-9*dt));
   }else{item.angle=item.turn=item.velocity=0}
   const lift=selection?.i===i?retire*retire*h*.44:0;
   const ax=x+Math.sin(item.angle*Math.PI/180)*susp,ay=y+susp-lift;
   const model=emblem(chapters[i].id);
   const yaw=-.32+item.turn+(moving?.14*Math.sin(clock*.66+item.phase):0),tilt=-.13+(moving?near*dy*.21:0);
   const [ex,ey,ez]=model.eye,zoom=Math.min(item.canvas.width/model.w,item.canvas.height/model.h)*1.12;
   const zz=Math.cos(yaw)*ez-Math.sin(yaw)*ex;
   const eyeX=objectW*(.5+(Math.cos(yaw)*ex+Math.sin(yaw)*ez)*zoom/item.canvas.width);
   const eyeY=objectH*(.5+(Math.cos(tilt)*ey-Math.sin(tilt)*zz)*zoom/item.canvas.height);
   span(x,y,ax,ay-6,7);
   item.a.style.left=(ax-eyeX)+'px';item.a.style.top=(ay-eyeY)+'px';item.a.style.width=objectW+'px';item.a.style.height=objectH+'px';
   item.a.style.setProperty('--eye-x',eyeX+'px');item.a.style.setProperty('--eye-y',eyeY+'px');
   item.a.style.setProperty('--swing',(-item.angle).toFixed(2)+'deg');
   item.a.style.opacity=String(selection?1-retire*(selection.i===i?.76:1):1);
   const lx=pointer?Math.tanh(dx):-.45,ly=pointer?Math.tanh(dy):-.42;
   drawCast(item.canvas,model,{yaw,pitch:tilt,lx,ly,power:.17+near*2.2+(focus?.34:0),scale:1.12});
  }
  drawWire(links,w,h,.35,-.12,pointer?{x:px,y:py}:null);
  if(selection&&(retire===1||!moving)){visit(selection.i);return}
  if(moving)schedule();
 }
 function shift(n){show(page+n)}
 for(const btn of [prev,next])btn.addEventListener('click',()=>shift(Number(btn.dataset.turn)));
 track.addEventListener('pointermove',e=>{pointer={x:e.clientX,y:e.clientY};focusIndex=-1;schedule()},{passive:true});
 track.addEventListener('pointerleave',()=>{pointer=null;schedule()});
 nav.addEventListener('focusin',e=>{focusIndex=items.findIndex(item=>item.a===e.target);schedule()});
 trigger.addEventListener('click',e=>{e.preventDefault();if(isOpen())close(true);else open(innerWidth/2,innerHeight/2,e.detail===0)});
 panel.querySelector('.core-close').addEventListener('click',()=>close(true));
 panel.addEventListener('toggle',()=>{if(!isOpen()){cancelAnimationFrame(raf);raf=0;selection=null;trigger.setAttribute('aria-expanded','false')}});
 function preserve(t){return blocked()||window.getSelection()?.toString().trim()||t.closest?.('a,button,input,textarea,select,[contenteditable]:not([contenteditable=false]),dialog,#chain-index')}
 const ownsContext=enableTouchIndex(document.querySelector('#stage'),t=>!isOpen()&&!preserve(t),(x,y)=>open(x,y,false,true));
 document.addEventListener('contextmenu',e=>{
  if(ownsContext(e)){e.preventDefault();return}
  if(e.shiftKey||preserve(e.target))return;
  e.preventDefault();const key=!e.clientX&&!e.clientY;open(key?innerWidth/2:e.clientX,key?innerHeight/2:e.clientY,key);
 });
 document.addEventListener('keydown',e=>{
  if(!isOpen()){
   if((e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey)&&!preserve(e.target)){e.preventDefault();open(innerWidth/2,innerHeight/2,true)}return;
  }
  if(e.key==='Escape'){e.preventDefault();close(true);return}
  if(!['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','Home','End'].includes(e.key))return;
  e.preventDefault();const active=items.findIndex(item=>item.a===document.activeElement);
  const base=active<0?page*per:active;
  const n=e.key==='Home'?0:e.key==='End'?items.length-1:(base+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+items.length)%items.length;
  if(Math.floor(n/per)!==page)show(Math.floor(n/per));
  items[n].a.focus({preventScroll:true});
 });
 window.addEventListener('resize',()=>{if(isOpen()){const first=page*per;place();show(Math.floor(first/per))}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else schedule()});
 return {isOpen,refresh,close,motionChanged:schedule};
}
