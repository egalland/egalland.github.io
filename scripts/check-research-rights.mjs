import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'strate-research-'));
try {
  const modules=new Set();
  async function compile(name) {
    if(modules.has(name)) return;
    modules.add(name);
    const source=await fs.readFile('lib/'+name+'.ts','utf8');
    const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
    const deps=[];
    const code=outputText.replace(/from ['"]\.\/([^'"]+)['"]/g,(_,dependency)=>{
      deps.push(dependency);
      return 'from "./'+dependency+'.mjs"';
    });
    await fs.writeFile(path.join(temporary,name+'.mjs'),code);
    await Promise.all(deps.map(compile));
  }
  await compile('world');
  const [game,planet,skills]=await Promise.all(['world','planet','research'].map(name=>import(pathToFileURL(path.join(temporary,name+'.mjs')))));
  const start=100_000;
  function setup() {
    const w=game.makeWorld(start);
    w.nextWave=Infinity;
    const a=game.join(w,'Propriétaire','a','forge',start), b=game.join(w,'Mineur','b','aurore',start);
    // Fixed, separated surface parcels so both users see the entire same test scenario.
    w.planet=planet.createPlanet(1872);
    const base=(x,z)=>{const home={x,y:planet.SIDE/planet.CELL-1,z};return {home,parcels:[home]};};
    w.planet.bases[a.id]=base(37,20);w.planet.bases[b.id]=base(12,60);
    return {w,a,b};
  }
  function slowNeighbor(w,parcel) {
    for(let u=parcel.x*32;u<(parcel.x+1)*32;u++) for(let v=parcel.z*32;v<(parcel.z+1)*32;v++){
      const point=planet.facePoint('top',u,v);
      if(planet.oreAt(w.planet,point)!=='ferrite')return point;
    }
    throw Error('No slow material in test parcel');
  }
  {
    const {w,a,b}=setup(),origin=planet.homePoint(w.planet,a.id),base=w.planet.bases[a.id];
    assert.deepEqual(origin,planet.facePoint('top',37*32+16,20*32+16));
    assert.deepEqual(planet.chunkAt(origin),base.home);
    assert.throws(()=>game.act(w,b,{type:'mine',block:origin},start),/réservée/);
    assert.throws(()=>game.act(w,b,{type:'deploy',unit:'drill',block:origin,face:'top'},start));
    game.act(w,a,{type:'mine',block:origin},start);
    game.advance(w,start+8000);
    assert(planet.isRemoved(w.planet,origin));
    assert.deepEqual(planet.homePoint(w.planet,a.id),origin);
    assert.deepEqual(w.planet.bases[a.id],base);
    const adjacent={...origin,x:origin.x+1};
    game.act(w,a,{type:'deploy',unit:'drill',block:adjacent,face:'top'},start+8000);
    game.advance(w,start+20000);
    assert(planet.isRemoved(w.planet,adjacent));
    const below={...origin,y:origin.y-1};
    assert(planet.canExcavate(w.planet,a.id,below));
    assert(!planet.canExcavate(w.planet,b.id,below));
    assert.equal(planet.territoryOwner(w.planet,base.home),a.id);
    console.log('PASS Owner can mine the core parcel manually and automatically, outsiders cannot, depot ownership persists.');
  }
  {
    const {w,a,b}=setup(),parcel={x:38,y:planet.SIDE/planet.CELL-1,z:20},point=slowNeighbor(w,parcel);
    game.act(w,b,{type:'mine',block:point},start);
    game.act(w,b,{type:'deploy',unit:'drill',block:point,face:'top'},start);
    assert(b.mining);
    game.act(w,a,{type:'expand',parcel},start+1);
    game.advance(w,start+10000);
    assert.equal(b.mining,null);
    assert.equal(b.mined,0);
    assert.equal(w.extracted,0);
    assert.equal(planet.isRemoved(w.planet,point),false);
    assert.equal(b.drill.status,'exhausted');
    assert.throws(()=>game.act(w,b,{type:'mine',block:point},start+10010),/réservée/);
    console.log('PASS A newly acquired claim stops both an in-flight extraction and an already deployed foreign rig.');
  }
  {
    const {w,a,b}=setup(),inv0={...a.inventory},coins=a.coins;
    assert.equal(skills.RESEARCH_TREE.length,9);
    assert(skills.researchAvailable(a,'cadence'));
    assert(!skills.researchAvailable(a,'longue-percee'));
    for(const skill of ['constructor','trepan'])assert.throws(()=>game.act(w,a,{type:'research',skill},start));
    assert.equal(a.coins,coins);assert.deepEqual(a.inventory,inv0);
    game.act(w,a,{type:'research',skill:'cadence',requestId:'research-1'},start);
    assert.equal(a.coins,coins-140);assert.equal(a.inventory.ferrite,inv0.ferrite-20);
    game.act(w,a,{type:'research',skill:'cadence',requestId:'research-1'},start);
    assert.equal(a.coins,coins-140);assert.deepEqual(a.research,['cadence']);
    assert(skills.cooldownFor(a)<skills.cooldownFor(b));
    assert.equal(game.publicWorld(w,a,start).me.pickCooldownMs,skills.cooldownFor(a));
    const slow=slowNeighbor(w,{x:38,y:planet.SIDE/planet.CELL-1,z:20}),ore=planet.oreAt(w.planet,slow);
    game.act(w,a,{type:'mine',block:slow},start);
    game.act(w,b,{type:'mine',block:slow},start);
    assert.equal(a.mining.ready-start,planet.mineDuration(ore,a.pick,.75));
    assert.equal(b.mining.ready-start,planet.mineDuration(ore,b.pick));
    a.inventory.cuivre=0; assert.throws(()=>game.act(w,a,{type:'research',skill:'trepan'},start),/minerai/);
    assert.equal(a.coins,coins-140);
    a.coins=0; assert.throws(()=>game.act(w,a,{type:'research',skill:'blindage'},start),/Crédits/);
    a.coins=10_000; a.inventory={ferrite:500,cuivre:300,titane:0,prisme:0};
    game.act(w,a,{type:'research',skill:'trepan'},start);
    assert.throws(()=>game.act(w,a,{type:'research',skill:'longue-percee'},start),/préalables/);
    for(const id of ['soutes','longue-percee','turbines','blindage','artillerie','convois','doctrine'])
      game.act(w,a,{type:'research',skill:id},start);
    const reloaded=game.migrateWorld(JSON.parse(JSON.stringify(w)));
    assert.equal(reloaded.players[0].research.length,9);
    assert.equal(skills.haulCapacityBonus(a),14);assert.equal(skills.haulSpeedFactor(a),1.4);
    assert.equal(skills.drillExtraBlocks(a),3);
    const personal=game.publicWorld(w,b,start);
    assert(!personal.players.some(p=>Object.hasOwn(p,'research')));
    assert.deepEqual(personal.me.research,[]);
    console.log('PASS Nine persistent research nodes enforce prerequisites, depot costs, retry protection and effective mining times.');
  }
  {
    function battle(research,hostile) {
      const {w,a}=setup(),r=w.relays[0];a.research=research;a.x=r.x;a.y=r.y;a.target=r.id;
      if(hostile)w.enemies.push({id:'e',target:r.id,x:r.x,y:r.y,maxHp:10000,hp:10000,damage:1});
      game.advance(w,start+10000);
      return {damage:a.damage,hp:a.hp,progress:r.progress};
    }
    const basic=battle([],true), improved=battle(['blindage','artillerie'],true);
    assert.equal(improved.damage,basic.damage*1.25);
    assert.equal(90-improved.hp,(90-basic.hp)*.8);
    const capture=battle([],false),fast=battle(['doctrine'],false);
    assert(Math.abs(fast.progress-capture.progress*1.35)<1e-8);
    function front(research) {
      const {w,a}=setup(),r=w.relays[4];a.research=research;
      const initial={x:a.x,y:a.y};game.act(w,a,{type:'deploy',unit:'squad',relay:r.id},start);
      game.advance(w,start+10000);
      return Math.hypot(a.x-initial.x,a.y-initial.y);
    }
    assert(Math.abs(front(['doctrine'])-front([])*1.35)<1e-8);
    console.log('PASS Combat research changes outgoing and incoming damage, squad motion and capture progress.');
  }
  {
    function extracted(research) {
      const {w,a}=setup();a.research=research;
      const block=planet.homePoint(w.planet,a.id);
      game.act(w,a,{type:'deploy',unit:'drill',block,face:'top'},start);
      game.advance(w,start+10000);
      assert.equal(w.extracted,a.mined);
      assert.equal(planet.isRemoved(w.planet,{...block,y:block.y-a.mined}),false);
      return a.mined;
    }
    assert.equal(extracted([]),1);
    assert.equal(extracted(['cadence','trepan']),2);
    assert.equal(extracted(['cadence','trepan','soutes','longue-percee']),4);
    console.log('PASS Drill research excavates additional actual voxels each cycle.');
  }
} finally {
  await fs.rm(temporary,{recursive:true,force:true});
}
