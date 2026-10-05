(() => {
 'use strict';
 const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover) and (pointer: fine)');
 let frame=0,last=0,x=0,y=0,scroll=0,tx=0,ty=0;
 const layer=document.querySelector('.landscape');
 const set=(key,value)=>root.style.setProperty(key,value);
 function reset(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;x=0;y=0;scroll=0;tx=0;ty=0;set('--parallax-x','0');set('--parallax-y','0');set('--far-scroll','0px');set('--mid-scroll','0px');set('--near-scroll','0px');}
 function paint(time){
  frame=0;if(reduce.matches||document.hidden)return;
  const dt=last?Math.min(64,time-last):16,lastScroll=Math.max(window.scrollY,0),ease=1-Math.exp(-dt/95);last=time;
  x+=(tx-x)*ease;y+=(ty-y)*ease;scroll+=(lastScroll-scroll)*ease;
  set('--parallax-x',x.toFixed(4));set('--parallax-y',y.toFixed(4));
  const progress=Math.max(0,Math.min(1,scroll/Math.max((root.scrollHeight||innerHeight+1000)-innerHeight,1)));
  set('--far-scroll',(progress*140).toFixed(2)+'px');set('--mid-scroll',(progress*260).toFixed(2)+'px');set('--near-scroll',(progress*380).toFixed(2)+'px');
  if(Math.abs(tx-x)>.001||Math.abs(ty-y)>.001||Math.abs(lastScroll-scroll)>.1)frame=requestAnimationFrame(paint);else last=0;
 }
 function schedule(){if(!reduce.matches&&!document.hidden&&!frame)frame=requestAnimationFrame(paint);}
 addEventListener('pointermove',event=>{if(!pointer.matches||event.pointerType==='touch')return;tx=Math.max(-1,Math.min(1,(event.clientX/innerWidth-.5)*2));ty=Math.max(-1,Math.min(1,(event.clientY/innerHeight-.5)*2));schedule();},{passive:true});
 document.addEventListener('pointerleave',()=>{tx=ty=0;schedule();});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});if(typeof ResizeObserver==='function')new ResizeObserver(schedule).observe(document.body);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}else schedule();});
 reduce.addEventListener('change',()=>{if(reduce.matches)reset();else schedule();});
 pointer.addEventListener('change',()=>{if(!pointer.matches){tx=ty=0;schedule();}});
 addEventListener('pagehide',reset,{once:true});
 // Decode before fading in; the fallback gradient remains visible on failure.
 const image=new Image();image.src='/inktober-2026/woodland.webp';image.decode().then(()=>layer?.classList.add('scene-ready')).catch(()=>layer?.classList.add('scene-unavailable'));
 schedule();
})();
