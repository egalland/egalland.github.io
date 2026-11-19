import {icon} from './icons.js';

const labels={jump:'Sauter',vault:'Franchir',climb:'Grimper'};

export function installTraversalControl(button,shortcut,jump){
  const touchLabel=button.querySelector('span');
  const keyLabel=shortcut.querySelector('span');
  const symbol=button.querySelector('i');
  let finger=null;

  function release(event){
    if(finger===null || (event && event.pointerId!==finger))return;
    finger=null;
    button.classList.remove('is-pressed');
    jump(false);
  }
  button.addEventListener('pointerdown',event=>{
    if(finger!==null || button.disabled || event.button!==0)return;
    event.preventDefault();
    finger=event.pointerId;
    button.setPointerCapture(finger);
    button.classList.add('is-pressed');
    jump(true);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']){
    button.addEventListener(type,release);
  }
  button.addEventListener('click',event=>{
    if(event.detail===0 && finger===null && !button.disabled){
      jump(true);
      jump(false);
    }
  });
  function update({traversalAction,traversalReady,inVehicle,lifeState}){
    const action=Object.hasOwn(labels,traversalAction)?traversalAction:'jump';
    const disabled=Boolean(inVehicle || lifeState==='down');
    if(disabled)release();
    button.disabled=disabled;
    const ready=String(!disabled && traversalReady!==false);
    button.dataset.ready=shortcut.dataset.ready=ready;
    if(shortcut.dataset.action===action)return;
    shortcut.dataset.action=button.dataset.action=action;
    const label=labels[action];
    button.setAttribute('aria-label',label);
    button.title=touchLabel.textContent=keyLabel.textContent=label;
    symbol.dataset.icon=action;
    symbol.innerHTML=icon(action);
  }
  return {update,release};
}
