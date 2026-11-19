import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Scene} from '../public/three.js';
import {createCity3D} from '../public/city3d.js';
import {createCanvasView} from '../public/canvas-view.js';
import {SPAWN,nearbyProps} from '../public/paris-world.js';
import {propDebris,trackPropWear} from '../public/prop-wear.js';

const require=createRequire(import.meta.url);
const native=require(require.resolve('@napi-rs/canvas',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
function useCanvas(t){
  const globals={Path2D:native.Path2D,OffscreenCanvas:class{constructor(w,h){return native.createCanvas(w,h);}},
    document:{createElement:()=>native.createCanvas(1,1)}};
  const previous=Object.fromEntries(Object.keys(globals).map(k=>[k,globalThis[k]]));
  Object.assign(globalThis,globals);
  t.after(()=>{for(const [k,v] of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v;});
}
const benches=nearbyProps(SPAWN.x,SPAWN.y,90).filter(o=>o.type==='bench').sort((a,b)=>
  Math.hypot(a.x-SPAWN.x,a.y-SPAWN.y)-Math.hypot(b.x-SPAWN.x,b.y-SPAWN.y));

test('stationary 3D camera assigns only the struck bench a frayed mesh, breaks it and can restore it',t=>{
  useCanvas(t);
  const scene=new Scene(),city=createCity3D(scene),[bench,neighbor]=benches;
  t.after(()=>city.dispose());
  const state={props:[bench,neighbor],propHealth:new Map(),destroyed:new Set(),propDamageRevision:0};
  function draw(){
    city.update(SPAWN,0,state);
    const active=[];
    scene.traverse(m=>{if(m.isInstancedMesh&&m.geometry.attributes.color&&m.count)active.push(m);});
    return active;
  }
  const [intact]=draw();
  assert.equal(intact.count,2);
  function hit(health){
    state.propHealth.set(bench.id,{health,maxHealth:72});state.propDamageRevision++;
    return draw().find(m=>m!==intact);
  }
  const worn=hit(58);
  assert.equal(intact.count,1);
  assert.equal(worn.count,1);
  const torn=hit(17);
  assert.equal(torn.count,1);
  assert.equal(worn.count,0);
  assert.notEqual(torn.geometry.attributes.position.count,worn.geometry.attributes.position.count);
  state.destroyed.add(bench.id);
  assert.equal(hit(0),undefined);
  assert.equal(intact.count,1);
  state.destroyed.clear();state.propHealth.clear();state.propDamageRevision++;
  assert.deepEqual(draw().map(m=>m.count),[2]);
});

test('a stationary mobile camera paints both stages and repairs the same Paris street sprite',t=>{
  useCanvas(t);
  const [bench]=benches,angle=Math.atan2(bench.y-SPAWN.y,bench.x-SPAWN.x),w=390,h=640;
  const p={x:bench.x-Math.cos(angle)*3,y:bench.y-Math.sin(angle)*3},surface=native.createCanvas(w,h);
  Object.assign(surface,{clientWidth:w,clientHeight:h});
  const view=createCanvasView(surface,p);
  t.after(()=>view.dispose());
  const state={p,yaw:angle,pitch:.1,entities:[],snap:true,destroyed:new Set(),propHealth:new Map(),propDamageRevision:0};
  let time=0;
  function frame(){
    view.render(state,.05,time+=.05);
    const center=view.projectTarget(bench.x,bench.y,bench.h*.5);
    assert.ok(center);
    return surface.getContext('2d').getImageData(Math.round(center.x*w)-53,Math.round(center.y*h)-95,106,140).data;
  }
  function diff(a,b){
    let count=0;
    for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>28)count++;
    return count;
  }
  const sound=frame();state.snap=false;
  assert.equal(diff(sound,frame()),0);
  function hit(health){
    state.propHealth.set(bench.id,{health,maxHealth:72});state.propDamageRevision++;
    return frame();
  }
  const worn=hit(61),torn=hit(9);
  assert.ok(diff(sound,worn)>35);
  assert.ok(diff(worn,torn)>70);
  state.destroyed.add(bench.id);
  const empty=hit(0);
  assert.ok(diff(empty,torn)>150);
  view.effect('propBreak',bench.x,bench.y,angle,0,{type:'bench'});
  assert.ok(diff(empty,frame())>8);
  time+=1;
  assert.equal(diff(empty,frame()),0);
  state.destroyed.clear();state.propHealth.clear();state.propDamageRevision++;
  assert.equal(diff(sound,frame()),0);
});

test('a distant hit and repeated hits within a stage reuse the street cache, and the break sheds its material',()=>{
  const update=trackPropWear(),props=[{id:'local'}],health=new Map();
  assert.equal(update(props,health,0),false);
  health.set('distant',{health:32,maxHealth:100});assert.equal(update(props,health,1),false);
  health.set('local',{health:91,maxHealth:100});assert.equal(update(props,health,2),true);
  health.set('local',{health:78,maxHealth:100});assert.equal(update(props,health,3),false);
  health.set('local',{health:21,maxHealth:100});assert.equal(update(props,health,4),true);
  const hit=propDebris('propHit','bench'),broken=propDebris('propBreak','bench'),hydrant=propDebris('propBreak','hydrant');
  assert.ok(broken.strands.length>hit.strands.length&&broken.lifetime>hit.lifetime);
  assert.notEqual(broken.strands[0].color,hydrant.strands[0].color);
});
