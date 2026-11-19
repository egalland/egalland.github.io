import {icon} from './icons.js';

// Only the initiating finger can steer or release an attack. Movement, camera
// and traversal use their own captures and remain available on the other hand.
export function installCombatControls(primary,melee,{action,setAim,endAim}){
  const symbol=primary.querySelector('i'),caption=primary.querySelector('span');
  let gesture=null,weapon=null;

  function release(event){
    if(!gesture || (event && (event.pointerId!==gesture.id || event.currentTarget!==gesture.button)))return;
    const {button,command,steered}=gesture;
    gesture=null;
    button.classList.remove('is-pressed');
    action(command,false);
    if(command!=='melee'||steered){setAim(0,0);endAim();}
  }
  function commandFor(button,pointerType){
    if(button===melee || weapon==='fist')return 'melee';
    return pointerType==='touch'?'touchFire':'fire';
  }
  for(const button of [primary,melee]){
    button.addEventListener('pointerdown',event=>{
      if(event.button!==0 || button.disabled || button.hidden || gesture)return;
      event.preventDefault();
      const command=commandFor(button,event.pointerType);
      gesture={button,command,id:event.pointerId,x:event.clientX,y:event.clientY};
      button.classList.add('is-pressed');
      button.setPointerCapture(event.pointerId);
      action(command,true);
    });
    button.addEventListener('pointermove',event=>{
      if(gesture?.button!==button||gesture.id!==event.pointerId)return;
      const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y,length=Math.hypot(dx,dy);
      if(length>6){gesture.steered=true;setAim(dx/length,dy/length);}
      else if(gesture.steered)setAim(0,0);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
    // Assistive technology and keyboard activation fire a single pulse.
    button.addEventListener('click',event=>{
      if(event.detail!==0 || gesture || button.disabled || button.hidden)return;
      const command=commandFor(button);
      action(command,true);action(command,false);
    });
  }
  function update({weapon:equipped,lifeState,inVehicle}){
    const fists=equipped==='fist',down=lifeState==='down';
    if(weapon!==equipped){
      release();weapon=equipped;
      const label=fists?'Frapper':'Utiliser l’arme équipée';
      primary.title=label;primary.setAttribute('aria-label',label);
      primary.dataset.action=fists?'melee':'fire';
      symbol.dataset.icon=fists?'fist':'aim';symbol.innerHTML=icon(symbol.dataset.icon);
      caption.textContent=fists?'Frapper':'';
    }
    primary.disabled=down || (fists && inVehicle);
    melee.hidden=fists || Boolean(inVehicle);
    melee.disabled=down || melee.hidden;
    if(gesture && (gesture.button.hidden || gesture.button.disabled))release();
  }
  return {update,release,get aiming(){return gesture?.command==='touchFire';}};
}
