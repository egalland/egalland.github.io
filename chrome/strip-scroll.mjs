// The browser owns horizontal swipes and pinch zoom. A one-finger vertical
// swipe moves the same horizontal strip, locking direction once per gesture.
export function enableStripScroll(strip, {blocked, coast}) {
 let gesture=null, suppressClick=false;

 strip.addEventListener('touchstart',event=>{
  gesture=null;
  suppressClick=false;
  if(event.touches.length!==1 || blocked())return;
  const finger=event.touches[0];
  gesture={x:finger.clientX,y:finger.clientY,start:strip.scrollLeft,
   lastY:finger.clientY,time:event.timeStamp,speed:0,vertical:false};
 },{passive:true});

 strip.addEventListener('touchmove',event=>{
  if(!gesture)return;
  if(event.touches.length!==1 || blocked()){gesture=null;return}
  const {clientX,clientY}=event.touches[0];
  const dx=gesture.x-clientX,dy=gesture.y-clientY;
  if(!gesture.vertical){
   if(Math.hypot(dx,dy)<=11)return;
   if(Math.abs(dx)>=Math.abs(dy)){gesture=null;return}
   gesture.vertical=true;
   suppressClick=true;
  }
  if(event.cancelable)event.preventDefault();
  strip.scrollLeft=gesture.start+dy;
  const dt=Math.max(8,event.timeStamp-gesture.time);
  const speed=(gesture.lastY-clientY)/dt;
  gesture.speed+=(speed-gesture.speed)*(1-Math.exp(-dt/28));
  gesture.lastY=clientY;
  gesture.time=event.timeStamp;
 },{passive:false});

 strip.addEventListener('touchend',event=>{
  if(gesture?.vertical && !blocked() && event.timeStamp-gesture.time<90){
   const distance=Math.max(-strip.clientWidth*.65,Math.min(strip.clientWidth*.65,gesture.speed*140));
   coast(distance);
  }
  gesture=null;
 },{passive:true});
 strip.addEventListener('touchcancel',()=>{gesture=null},{passive:true});
 strip.addEventListener('pointerdown',()=>{suppressClick=false},{passive:true});
 strip.addEventListener('click',event=>{
  if(suppressClick && event.detail){event.preventDefault();event.stopImmediatePropagation();suppressClick=false}
 },true);
}
