import test from 'node:test';
import assert from 'node:assert/strict';
import {installTraversalControl} from '../public/traversal-control.js';

function control(){
  const pressed=new Set(), events=[], captured=[];
  const label={},symbol={dataset:{}},keyLabel={};
  const button=Object.assign(new EventTarget(),{
    dataset:{},classList:{add:name=>pressed.add(name),remove:name=>pressed.delete(name)},
    setPointerCapture:id=>captured.push(id),
    setAttribute(name,value){this[name]=value;},
    querySelector:name=>name==='i'?symbol:label
  });
  const shortcut={dataset:{},querySelector:()=>keyLabel};
  const hud=installTraversalControl(button,shortcut,down=>events.push(down));
  const pointer=(type,id)=>button.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),{pointerId:id,button:0}));
  const click=detail=>button.dispatchEvent(Object.assign(new Event('click'),{detail}));
  return {hud,button,shortcut,label,keyLabel,symbol,pointer,click,pressed,events,captured};
}

test('a held jump belongs to its initiating finger until release or cancellation',()=>{
  const c=control();
  c.hud.update({traversalAction:'jump',traversalReady:true});
  c.pointer('pointerdown',4);
  c.pointer('pointerdown',7);
  c.pointer('pointercancel',7);
  assert.deepEqual(c.captured,[4]);
  assert.deepEqual(c.events,[true]);
  assert.ok(c.pressed.has('is-pressed'));
  c.pointer('pointerup',4);
  c.pointer('lostpointercapture',4);
  c.click(1);
  assert.deepEqual(c.events,[true,false]);
  c.pointer('pointerdown',9);
  c.hud.release();
  c.hud.release();
  assert.deepEqual(c.events,[true,false,true,false]);
  assert.equal(c.pressed.size,0);
});

test('context and availability update on the touch control and desktop shortcut',()=>{
  const c=control();
  for(const [action,label] of [['jump','Sauter'],['vault','Franchir'],['climb','Grimper']]){
    c.hud.update({traversalAction:action,traversalReady:true});
    assert.equal(c.label.textContent,label);
    assert.equal(c.keyLabel.textContent,label);
    assert.equal(c.symbol.dataset.icon,action);
    assert.equal(c.button['aria-label'],label);
  }
  c.click(0);
  assert.deepEqual(c.events,[true,false]);
  c.pointer('pointerdown',2);
  c.hud.update({inVehicle:true,traversalReady:false});
  c.click(0);
  assert.deepEqual(c.events,[true,false,true,false]);
  assert.equal(c.button.disabled,true);
  assert.equal(c.shortcut.dataset.ready,'false');
  c.hud.update({lifeState:'down'});
  assert.equal(c.button.disabled,true);
  c.hud.update({lifeState:'healthy',traversalReady:true});
  assert.equal(c.button.disabled,false);
});
