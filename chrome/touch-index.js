// Recognize a stationary touch without claiming the browser's scrolling gesture.
export function enableTouchIndex(scene,canStart,onHold){
 const delay=500,slop=11;
 const ring=document.createElement('i');
 ring.className='hold-ring';ring.hidden=true;ring.setAttribute('aria-hidden','true');document.body.append(ring);
 let pending=null,guard=null,touchOrigin=null;

 function cancel(){
  if(pending)clearTimeout(pending.timer);
  pending=null;ring.hidden=true;
  scene.classList.remove('holding');
 }
 function activate(){
  if(!pending)return;
  const {id,x,y,target}=pending;
  cancel();
  if(!scene.isConnected||document.hidden||!canStart(target))return;
  guard={id,x,y};onHold(x,y);
 }
 function down(e){
  cancel();guard=null;touchOrigin=null;
  if(e.pointerType!=='touch'||!e.isPrimary||!scene.contains(e.target)||!canStart(e.target))return;
  const {pointerId:id,clientX:x,clientY:y}=e;
  touchOrigin={id,x,y};
  scene.classList.add('holding');
  ring.style.left=Math.max(16,Math.min(innerWidth-16,x))+'px';
  ring.style.top=(y>56?y-34:y+34)+'px';ring.hidden=false;
  pending={id,x,y,target:e.target,timer:setTimeout(activate,delay)};
 }
 document.addEventListener('pointerdown',down,{capture:true,passive:true});
 document.addEventListener('pointermove',e=>{
  if(pending&&e.pointerId===pending.id&&Math.hypot(e.clientX-pending.x,e.clientY-pending.y)>slop)cancel();
 },{capture:true,passive:true});
 function end(e){if(pending?.id===e.pointerId)cancel()}
 document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
 scene.addEventListener('scroll',cancel,true);
 window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);
 document.addEventListener('visibilitychange',cancel);
 document.addEventListener('click',e=>{
  if(!guard||!e.detail)return;
  // A subsequent intentional tap has already cleared this guard in down().
  if(e.pointerId===guard.id||Math.hypot(e.clientX-guard.x,e.clientY-guard.y)<30){
   e.preventDefault();e.stopImmediatePropagation();guard=null;
  }
 },true);
 return function ownsContext(e){
  const ours=!!touchOrigin&&(e.pointerType==='touch'||(!e.pointerType&&Math.hypot(e.clientX-touchOrigin.x,e.clientY-touchOrigin.y)<30));
  if(ours)activate();
  return ours;
 };
}
