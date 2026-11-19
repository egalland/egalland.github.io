import assert from 'node:assert/strict';
import {
  SIDE, CELL, FACE_ORDER, marketDistricts, defaultFocus, normalizeFocus, createPlanet, facePoint, pointOnFace,
  chunkAt, chunkKey, keysAround, regionKeys, relayFocus, regionView, ensureBase, homeFocus,
  homePoint, parcelFocus, extendPrice, expandTerritory, territoryOwner, oreAt, canExcavate,
  machineMine, nextMachineTarget, isRemoved, dirtyChunks, manualMine, finishMine, mineDuration
} from '../lib/planet.ts';

const miner = (id, coins=10_000) => ({
  id,coins,pick:1,mined:0,lastMine:0,inventory:{ferrite:0,cuivre:0,titane:0,prisme:0}
});
const at = f => facePoint(f.face,f.u,f.v,f.depth);
const adjacent = cp => [
  {x:cp.x+1,y:cp.y,z:cp.z}, {x:cp.x-1,y:cp.y,z:cp.z},
  {x:cp.x,y:cp.y+1,z:cp.z}, {x:cp.x,y:cp.y-1,z:cp.z},
  {x:cp.x,y:cp.y,z:cp.z+1}, {x:cp.x,y:cp.y,z:cp.z-1},
].filter(q=>Object.values(q).every(n=>n>=0&&n<SIDE/CELL));

function verify(name,fn) {fn();console.log('PASS',name);}

verify('Six faces use the same XYZ cells, including identical edges and corners',()=>{
  const s=createPlanet(42), p={x:83,y:223,z:1933};
  for (const face of FACE_ORDER) {
    assert.deepEqual(at(pointOnFace(face,p)),p);
    assert.deepEqual(pointOnFace(face,facePoint(face,99,375,13)),{face,u:99,v:375,depth:13});
  }
  const edge=facePoint('top',SIDE-1,97);
  assert.deepEqual(edge,facePoint('east',SIDE-1-97,0));
  assert.equal(oreAt(s,edge),oreAt(s,facePoint('east',SIDE-1-97,0)));
  assert.equal(SIDE**3,68_719_476_736);
  assert.equal(normalizeFocus({...defaultFocus,u:4.5}),null);
  assert.equal(normalizeFocus({...defaultFocus,face:'invalid'}),null);
});

verify('All 200 camp slots fit, start near a market and keep room for neighbors and factories',()=>{
  assert.equal(SIDE,4096);
  assert.equal(marketDistricts.length,24);
  const world=createPlanet(), occupied=new Set(), homes=[];
  for(let i=0;i<200;i++){
    const id='camp-'+i, base=ensureBase(world,id), key=chunkKey(base.home);
    assert(!occupied.has(key));
    occupied.add(key);
    const h=homeFocus(world,id);
    const market=marketDistricts.find(d=>d.face===h.face && d.column===Math.floor(h.u/(SIDE/2)) && d.row===Math.floor(h.v/(SIDE/2))).market;
    assert(Math.hypot(market.u-h.u,market.v-h.v)<900);
    assert(h.u>200 && h.v>200 && h.u<SIDE-200 && h.v<SIDE-200);
    for(const other of homes.filter(other=>other.face===h.face))assert(Math.hypot(other.u-h.u,other.v-h.v)>=500);
    homes.push(h);
  }
  assert.equal(new Set(homes.map(h=>h.face)).size,6);
  const reloaded=JSON.parse(JSON.stringify(world));
  assert.deepEqual(homeFocus(reloaded,'camp-1'),homes[1]);
});

verify('A borehole and a lateral gallery expose only their neighboring blocks and cross chunk seams',()=>{
  const s=createPlanet(54),id='miner';
  const f={face:'top',u:31,v:932};
  for (let d=0;d<40;d++) {
    const front=facePoint(f.face,f.u,f.v,d), below=facePoint(f.face,f.u,f.v,d+1);
    assert.equal(canExcavate(s,id,front),true);
    assert.equal(canExcavate(s,id,below),false);
    assert(machineMine(s,id,front));
    assert.equal(machineMine(s,id,front),null);
  }
  const side=facePoint(f.face,32,932,39);
  assert(canExcavate(s,id,side));
  assert(machineMine(s,id,side));
  const gallery=regionView(s,{face:'top',u:32,v:932,depth:39},id);
  const tile=(u,v)=>gallery.tiles.find(t=>t.u===u&&t.v===v);
  assert.equal(tile(32,932).status,'air');
  assert.equal(tile(32,933).status,'solid');
  assert.equal(tile(33,933).status,'unknown');
  assert.equal(tile(33,933).ore,null);
  assert.equal(tile(32,932).ore,null);
  assert.equal(regionView(s,f,id).tiles.find(t=>t.u===31&&t.v===932).depth,32);
  assert.equal(Object.values(s.chunks).reduce((n,c)=>n+c.count,0),41);
  assert.equal(dirtyChunks(s).length,Object.keys(s.chunks).length);
  assert.equal(isRemoved(JSON.parse(JSON.stringify(s)),side),true);
  for (const key of dirtyChunks(s)) assert(keysAround(side).includes(key));
});

verify('Each region requests all chunks necessary for depth, edge and exposure checks',()=>{
  for (const face of FACE_ORDER) for (const [u,v] of [[0,0],[SIDE-1,SIDE-1],[31,32],[400,399]]) {
    for (const depth of [0,1,31,32,2000,SIDE-1]) {
      const f={face,u,v,depth}, keys=new Set(regionKeys(f)), region=regionView(createPlanet(),f);
      assert.equal(region.tiles.length,289);
      for (const tile of region.tiles) {
        for (const d of [depth,Math.min(SIDE-1,depth===0?32:depth)]) {
          const q=facePoint(face,tile.u,tile.v,d);
          assert(keys.has(chunkKey(chunkAt(q))));
          for (const [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
            const adj={x:q.x+dx,y:q.y+dy,z:q.z+dz};
            if(Object.values(adj).every(n=>n>=0&&n<SIDE)) assert(keys.has(chunkKey(chunkAt(adj))));
          }
        }
      }
    }
  }
});

verify('Base core protection, discovery, ownership and contiguous progressive territory',()=>{
  const s=createPlanet(),p=miner('alpha'),q=miner('beta');
  const base=ensureBase(s,p.id),other=ensureBase(s,q.id);
  assert.notDeepEqual(base.home,other.home);
  assert.deepEqual(base.parcels,[base.home]);
  assert.deepEqual(ensureBase(s,p.id),base);
  const h=homePoint(s,p.id);
  assert(canExcavate(s,p.id,h));assert(!canExcavate(s,q.id,h));
  const focus=homeFocus(s,p.id);
  assert(canExcavate(s,p.id,at(focus)));
  const cp=adjacent(base.home)[0],first=extendPrice(base),before=p.coins;
  expandTerritory(s,p,cp);
  assert.equal(territoryOwner(s,cp),p.id);
  assert.equal(p.coins,before-first);assert(extendPrice(base)>first);
  assert.throws(()=>expandTerritory(s,q,cp));assert.equal(q.coins,10_000);
  assert.throws(()=>expandTerritory(s,p,base.home));assert.equal(p.coins,before-first);
  const bad={x:base.home.x+1,y:base.home.y,z:base.home.z+1};
  const fresh=createPlanet();ensureBase(fresh,p.id);
  assert.throws(()=>expandTerritory(fresh,p,bad));
  const next=adjacent(cp).find(q=>!territoryOwner(s,q)&&!adjacent(base.home).some(n=>chunkKey(n)===chunkKey(q)));
  assert(next);expandTerritory(s,p,next);
  const broke=miner('poor',0), poorBase=ensureBase(s,broke.id);
  assert.throws(()=>expandTerritory(s,broke,adjacent(poorBase.home)[0]));
  assert.equal(broke.coins,0);assert.equal(poorBase.parcels.length,1);
  const near=regionView(s,parcelFocus(base.home),q.id);
  assert(near.tiles.some(t=>t.territory==='foreign'));
  const underground=regionView(s,{...parcelFocus(base.home),depth:20},q.id);
  assert(!underground.tiles.some(t=>t.territory==='foreign'));
  const shown=JSON.stringify(near);
  assert(!shown.includes('"bases"'));assert(!shown.includes(p.id));assert(!shown.includes(q.id));
  for(let i=0;i<6;i++) {
    const r=chunkAt(at(relayFocus(i)));
    assert.throws(()=>expandTerritory(s,p,r),/relais public/);
  }
});

verify('Two miners competing for a slow block get a single extraction and no double credit',()=>{
  const s=createPlanet(123),p=miner('alpha'),q=miner('beta');
  let point,ore;
  for(let u=100;u<400&&!point;u++) for(let v=100;v<200;v++) {
    const candidate=facePoint('top',u,v),o=oreAt(s,candidate);
    if(o!=='ferrite'){point=candidate;ore=o;break;}
  }
  assert(point);
  let t=100_000;
  for(const player of [p,q]) {
    assert.equal(manualMine(s,player,point,t).mined,0);
    assert.equal(player.mining.ready,t+mineDuration(ore));
    assert.equal(finishMine(s,player,t+1),null);
  }
  t+=mineDuration(ore);
  assert.equal(finishMine(s,p,t).mined,1);assert.equal(finishMine(s,q,t).mined,0);
  assert.equal(p.inventory[ore],1);assert.equal(q.inventory[ore],0);
  assert.equal(finishMine(s,p,t+100),null);assert.equal(p.mining,null);assert.equal(q.mining,null);
  assert.throws(()=>manualMine(s,p,{x:point.x+.5,y:point.y,z:point.z},t+1000));
});

verify('Automatic drill follows the assigned borehole without tunnelling through protected cores',()=>{
  const s=createPlanet(5),p=miner('owner'), q=miner('visitor');
  ensureBase(s,p.id);ensureBase(s,q.id);
  const home=homePoint(s,p.id),f=homeFocus(s,p.id);
  const site=facePoint(f.face,f.u+CELL,f.v);
  assert.equal(nextMachineTarget(s,q.id,home,f.face),null);
  for(let i=0;i<5;i++){const t=nextMachineTarget(s,q.id,site,f.face);assert(t);assert(machineMine(s,q.id,t));}
  const target=nextMachineTarget(s,q.id,site,f.face);
  assert.deepEqual(target,facePoint(f.face,f.u+CELL,f.v,5));
});
