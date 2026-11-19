import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createCanvasView} from '../public/canvas-view.js';
import {SPAWN} from '../public/paris-world.js';

const require=createRequire(import.meta.url);
const paths=[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean);
const native=require(require.resolve('@napi-rs/canvas',{paths}));

test('an interposed walker reveals the player while a walker behind stays naturally occluded on mobile',()=>{
  const width=390,height=640,yaw=SPAWN.angle;
  globalThis.Path2D=native.Path2D;
  globalThis.OffscreenCanvas=class{constructor(w,h){return native.createCanvas(w,h);}};
  globalThis.document={createElement:()=>native.createCanvas(1,1)};
  const surface=native.createCanvas(width,height);
  Object.assign(surface,{clientWidth:width,clientHeight:height});
  const view=createCanvasView(surface,SPAWN),hero={...SPAWN,id:'self',self:true,type:'fox'};
  const scene={p:SPAWN,speed:0,yaw,car:null,pitch:.13,snap:true,destroyed:new Set()};
  function pixels(entities){
    view.render({...scene,entities},1/30,1);
    return surface.getContext('2d').getImageData(0,0,width,height).data;
  }
  const baseline=pixels([]),solo=pixels([hero]);
  const difference=(a,b,i)=>Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
  function overlap(along,side){
    const actor={id:'medic',type:'medic',angle:yaw+Math.PI,x:SPAWN.x+Math.cos(yaw)*along-Math.sin(yaw)*side,
      y:SPAWN.y+Math.sin(yaw)*along+Math.cos(yaw)*side};
    const npc=pixels([actor]),combined=pixels([hero,actor]);
    let common=0,obscured=0,heroOnTop=0;
    for(let i=0;i<baseline.length;i+=4){
      if(difference(solo,baseline,i)<80||difference(npc,baseline,i)<80||difference(npc,solo,i)<80)continue;
      common++;
      if(difference(combined,npc,i)<4)obscured++;
      if(difference(combined,solo,i)<4)heroOnTop++;
    }
    return {common,obscured,heroOnTop};
  }
  const closer=overlap(-1.28,0),further=overlap(1.28,0);
  assert.ok(closer.common>2000&&closer.obscured/closer.common<.05);
  assert.ok(further.common>2000&&further.heroOnTop/further.common>.94);
  assert.equal(overlap(0,1.28).common,0);
  view.dispose();
});
