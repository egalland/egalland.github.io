import test from 'node:test';
import assert from 'node:assert/strict';
import {enableStripScroll} from '../chrome/strip-scroll.mjs';

function scene(){
 const strip=new EventTarget(),flings=[];
 Object.assign(strip,{scrollLeft:320,clientWidth:360});
 let blocked=false,time=0;
 enableStripScroll(strip,{blocked:()=>blocked,coast:d=>flings.push(d)});
 function touch(type,x,y,count=1){
  const e=new Event(type,{cancelable:true});
  Object.defineProperties(e,{timeStamp:{value:time+=16},touches:{value:Array(count).fill({clientX:x,clientY:y})}});
  strip.dispatchEvent(e);
  return e.defaultPrevented;
 }
 return {strip,flings,touch,openMenu:()=>{blocked=true}};
}
test('un glissement vertical avance ou recule horizontalement et prolonge le geste dans son sens',()=>{
 for(const sign of [1,-1]){
  const {strip,touch,flings}=scene();
  touch('touchstart',50,150);
  assert.equal(touch('touchmove',52,150-sign*70),true);
  assert.equal(strip.scrollLeft,320+sign*70);
  touch('touchend',52,150-sign*70,0);
  assert.equal(Math.sign(flings[0]),sign);
 }
});
test('le balayage latéral et le pincement restent natifs, le menu interrompt le geste',()=>{
 for(const variant of ['horizontal','pinch','menu']){
  const {strip,touch,flings,openMenu}=scene();
  touch('touchstart',100,150);
  if(variant==='menu')openMenu();
  assert.equal(touch('touchmove',variant==='horizontal'?30:100,variant==='horizontal'?145:80,variant==='pinch'?2:1),false);
  touch('touchend',0,0,0);
  assert.equal(strip.scrollLeft,320);
  assert.deepEqual(flings,[]);
 }
});
