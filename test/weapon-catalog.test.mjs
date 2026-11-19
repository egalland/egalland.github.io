import test from 'node:test';
import assert from 'node:assert/strict';
import {weaponCatalog,weaponList,starterWeapons,findableWeaponIds,inventoryWeapons} from '../public/weapon-catalog.js';
import {resolveWeaponShot} from '../public/weapon-patterns.js';
import {buildShotEffect,effectDuration} from '../public/weapon-effects.js';
import {drawToyWeapon} from '../public/weapon-artwork.js';
import {createPickupDisplay} from '../public/pickup-models.js';
import {Scene} from '../public/three.js';

const origin={x:0,y:0};
const at=(id,x,y=0)=>({id,x,y});
const shot=(a,hit=null,length=8)=>({origin,angle:a,length,hit});

test('Every collectible has its own HUD artwork, readable effect geometry and turntable miniature',()=>{
  assert.equal(weaponList.length,13);
  assert.deepEqual(starterWeapons,['fist','pistol']);
  assert.equal(findableWeaponIds.length,11);
  assert.equal(new Set(weaponList.map(w=>w.name)).size,13);
  const recorder=()=>{const operations=[];const ctx=new Proxy({},{
    get(target,key){if(key in target)return target[key];return (...args)=>operations.push([key,...args]);}
  });return {ctx,operations};};
  const art=new Set();
  for(const w of weaponList){
    const {ctx,operations}=recorder();
    assert(drawToyWeapon(ctx,w.id,0,0,32));assert(operations.length>20,w.id);
    art.add(JSON.stringify(operations));
  }
  assert.equal(art.size,weaponList.length);
  for(const w of weaponList){
    assert(weaponCatalog[w.id]===w);assert(w.range>0&&w.damage>0&&w.interval>0);
    const lines=buildShotEffect(w.effect,48,27,.62,8,.4);
    assert(lines.length && effectDuration(w.effect)>0,w.id);
    assert(lines.every(l=>l.width>0 && l.points.length>=2 && l.points.every(p=>Object.values(p).every(Number.isFinite))),w.id);
  }
  const original=globalThis.document,scene=new Scene();
  globalThis.document={createElement:()=>({getContext:()=>recorder().ctx})};
  try {
    const display=createPickupDisplay(scene);
    const drops=findableWeaponIds.map((weapon,i)=>({id:weapon,weapon,x:i*2,y:4}));
    display.update(drops,origin,1.2);assert.equal(scene.children.length,drops.length);
    const models=scene.children.map(p=>p.children.find(c=>c.isGroup));
    assert(models.every(g=>g?.children.length>=2));
    display.update([],origin,1.6);assert.equal(scene.children.length,0);
    display.dispose();
  }finally{
    if(original===undefined)delete globalThis.document;else globalThis.document=original;
  }
});

test('Fan patterns share touch aim and apply a single impact per target and trigger',()=>{
  const a=at('a',8),b=at('b',8,1),chosen=shot(.18,a);
  const trace=angle=>shot(angle,angle>chosen.angle?b:a);
  const fan=resolveWeaponShot('confetti',chosen.angle,trace,[a,b],()=>true,chosen);
  assert.equal(fan.rays.length,7);assert.deepEqual(fan.hits.map(v=>v.target.id),['a','b']);
  assert.equal(fan.rays[0].angle,chosen.angle);
  const chime=resolveWeaponShot('chime',chosen.angle,trace,[a,b],()=>true,chosen);
  assert.equal(chime.hits.length,2);assert.equal(chime.rays.length,1);
  const bow=resolveWeaponShot('ribbonbow',chosen.angle,trace,[a,b],()=>true,chosen);
  assert.equal(bow.hits.length,1);assert.equal(bow.rays.length,1);
});

test('Area and chained hits depend on a clear path; identical targets never receive duplicate hits',()=>{
  const primary=at('first',8),blocked=at('barrier',8,.5),second=at('second',8,2),third=at('third',8,5);
  const options=[primary,blocked,second,third],trace=dir=>shot(dir,primary),visible=(from,target)=>target!==blocked;
  const pom=resolveWeaponShot('pompom',0,trace,options,visible);
  assert.deepEqual(pom.hits.map(v=>v.target.id),['first','second']);
  assert(pom.hits[1].damage<pom.hits[0].damage);assert(pom.impact.radius>2);
  const boom=resolveWeaponShot('boomerang',0,trace,options,visible);
  assert.deepEqual(boom.hits.map(v=>v.target.id),['first','second']);assert.equal(boom.rays.length,2);
  const spool=resolveWeaponShot('spool',0,trace,options,visible);
  assert.deepEqual(spool.hits.map(v=>v.target.id),['first','second','third']);assert.equal(spool.rays.length,3);
  assert.equal(resolveWeaponShot('pompom',0,trace,options).hits.length,1);
  assert.equal(resolveWeaponShot('spool',0,trace,options,()=>false).hits.length,1);
});

test('the wheel and quick slots contain just the starting equipment and distinct collected weapons',()=>{
  const ids=owned=>inventoryWeapons(owned).map(item=>item.id);
  assert.deepEqual(ids(),['fist','pistol']);
  assert.deepEqual(ids(['chime','unknown','chime','yarn','pistol']),['fist','pistol','yarn','chime']);
  assert.deepEqual(ids(findableWeaponIds),weaponList.map(item=>item.id));
});
