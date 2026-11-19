import test from 'node:test';
import assert from 'node:assert/strict';
import {installCombatControls} from '../public/combat-controls.js';

function fixture(){
  const captures=[],commands=[],aims=[];
  const button=name=>{
    const symbol={dataset:{}},caption={},button=new EventTarget(),classes=new Set();
    Object.assign(button,{name,symbol,caption,classes,dataset:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},
      setAttribute(key,value){this[key]=value;},setPointerCapture:id=>captures.push([name,id]),querySelector:q=>q==='i'?symbol:caption});
    return button;
  };
  const primary=button('primary'),melee=button('melee');
  const inputs=installCombatControls(primary,melee,{
    action:(...args)=>commands.push(args),setAim:(...args)=>aims.push(args),endAim:()=>aims.push('end')
  });
  const pointer=(button,type,id,x=15,y=10)=>button.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),{
    pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y
  }));
  const click=(button,detail=0)=>button.dispatchEvent(Object.assign(new Event('click'),{detail}));
  const update=(weapon,extra={})=>inputs.update({weapon,lifeState:'healthy',inVehicle:false,...extra});
  return {inputs,commands,captures,aims,primary,melee,click,pointer,update};
}

test('gun and melee gestures cannot overlap or release one another',()=>{
  const c=fixture();c.update('pistol');
  c.pointer(c.melee,'pointerdown',4);
  c.pointer(c.primary,'pointerdown',8);c.pointer(c.primary,'pointermove',8,27,26);c.pointer(c.primary,'pointerup',8);
  c.pointer(c.melee,'pointermove',4,27,26);
  assert.deepEqual(c.captures,[['melee',4]]);assert.deepEqual(c.commands,[['melee',true]]);
  assert.deepEqual(c.aims,[[.6,.8]]);assert.equal(c.inputs.aiming,false);
  c.pointer(c.melee,'pointercancel',4);c.pointer(c.melee,'lostpointercapture',4);
  c.pointer(c.primary,'pointerdown',8);c.pointer(c.melee,'pointerdown',9);c.pointer(c.melee,'pointerup',9);
  assert.ok(c.inputs.aiming);c.pointer(c.primary,'pointermove',8,27,26);c.pointer(c.primary,'pointerup',8);
  assert.deepEqual(c.commands,[['melee',true],['melee',false],['touchFire',true],['touchFire',false]]);
  assert.deepEqual(c.aims,[[.6,.8],[0,0],'end',[.6,.8],[0,0],'end']);assert.equal(c.inputs.aiming,false);
});

test('fists replace the primary action and release an existing shot on equip or KO',()=>{
  const c=fixture();c.update('pistol');c.pointer(c.primary,'pointerdown',4);c.update('fist');
  assert.equal(c.primary['aria-label'],'Frapper');assert.equal(c.primary.caption.textContent,'Frapper');assert.equal(c.primary.symbol.dataset.icon,'fist');
  assert.equal(c.melee.hidden,true);assert.equal(c.inputs.aiming,false);
  c.click(c.melee);c.pointer(c.primary,'pointerdown',5);c.pointer(c.primary,'pointermove',5,30,41);c.pointer(c.primary,'pointerup',5);c.click(c.primary,1);
  assert.deepEqual(c.commands,[['touchFire',true],['touchFire',false],['melee',true],['melee',false]]);
  assert.deepEqual(c.aims,[[0,0],'end',[15/Math.hypot(15,31),31/Math.hypot(15,31)],[0,0],'end']);
  c.click(c.primary);c.pointer(c.primary,'pointerdown',8);c.update('fist',{lifeState:'down'});const count=c.commands.length;
  assert.deepEqual(c.commands.slice(-4),[['melee',true],['melee',false],['melee',true],['melee',false]]);
  c.click(c.primary);assert.equal(c.commands.length,count);assert.equal(c.primary.disabled,true);
  c.update('pistol',{inVehicle:true});assert.equal(c.melee.hidden,true);assert.equal(c.primary.disabled,false);
  c.click(c.primary);assert.deepEqual(c.commands.slice(-2),[['fire',true],['fire',false]]);
  c.update('pistol');assert.equal(c.melee.hidden,false);c.click(c.melee);assert.deepEqual(c.commands.slice(-2),[['melee',true],['melee',false]]);
});
