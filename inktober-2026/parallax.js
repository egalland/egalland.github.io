(() => {
 'use strict';
 const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(hover: hover) and (pointer: fine)');
 let frame=0,last=0,x=0,y=0,scroll=0,tx=0,ty=0;
 const set=(key,value)=>root.style.setProperty(key,value);
 function pause(){set('--scene-play-state',document.hidden||reduce.matches?'paused':'running');}
 function reset(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;x=y=scroll=tx=ty=0;set('--parallax-x','0');set('--parallax-y','0');set('--far-scroll','0px');set('--mid-scroll','0px');set('--near-scroll','0px');pause();}
 function paint(time){
  frame=0;if(reduce.matches||document.hidden)return;
  const dt=last?Math.min(64,time-last):16,lastScroll=Math.max(window.scrollY,0),ease=1-Math.exp(-dt/110);last=time;
  x+=(tx-x)*ease;y+=(ty-y)*ease;scroll+=(lastScroll-scroll)*ease;
  set('--parallax-x',x.toFixed(4));set('--parallax-y',y.toFixed(4));
  const progress=Math.max(0,Math.min(1,scroll/Math.max((root.scrollHeight||innerHeight+1000)-innerHeight,1)));
  set('--far-scroll',(progress*32).toFixed(2)+'px');set('--mid-scroll',(progress*70).toFixed(2)+'px');set('--near-scroll',(progress*110).toFixed(2)+'px');
  if(Math.abs(tx-x)>.001||Math.abs(ty-y)>.001||Math.abs(lastScroll-scroll)>.1)frame=requestAnimationFrame(paint);else last=0;
 }
 function schedule(){if(!reduce.matches&&!document.hidden&&!frame)frame=requestAnimationFrame(paint);}
 function recenter(){tx=ty=0;schedule();}
 addEventListener('pointermove',event=>{if(!pointer.matches||event.pointerType==='touch')return;tx=Math.max(-1,Math.min(1,(event.clientX/innerWidth-.5)*2));ty=Math.max(-1,Math.min(1,(event.clientY/innerHeight-.5)*2));schedule();},{passive:true});
 document.addEventListener('pointerleave',recenter);addEventListener('blur',recenter);
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});if(typeof ResizeObserver==='function')new ResizeObserver(schedule).observe(document.body);
 document.addEventListener('visibilitychange',()=>{pause();if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}else schedule();});
 reduce.addEventListener('change',()=>{pause();if(reduce.matches)reset();else schedule();});
 pointer.addEventListener('change',()=>{if(!pointer.matches)recenter();});addEventListener('pagehide',reset,{once:true});
 // Each image fades in independently; a missing decorative image never blocks the page.
 for(const plane of document.querySelectorAll('.scene-plane')){const image=plane.querySelector('img');if(!image)continue;image.decode().then(()=>plane.classList.add('scene-ready')).catch(()=>plane.classList.add('scene-unavailable'));}
 pause();schedule();
})();
