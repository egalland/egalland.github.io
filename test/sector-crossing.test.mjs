import test from 'node:test';
import assert from 'node:assert/strict';
import {coreBoundary} from '../public/core-boundary.js';
import {metadata} from '../public/paris-core.js';
import {sectorInfo} from '../public/paris-world.js';
import {adjacentSector} from '../public/sector-crossing.js';
import {createRoadCrossing,crossingURL} from '../public/sector-travel.js';
import {clearSectorTransfer,readSectorTransfer,retreatFromSector,storeSectorTransfer} from '../public/sector-transfer.js';

const drain=()=>new Promise(resolve=>setImmediate(resolve));
function edgeApproach(x,y){
  const {closest,outward}=sectorInfo(x,y);
  return d=>({x:closest.x-outward.x*d,y:closest.y-outward.y*d});
}
const edgeAt=p=>sectorInfo(p.x,p.y);

test('the available core outline matches the actual playable geometry',()=>{
  assert.deepEqual(coreBoundary,metadata.boundary);
});

test('a walk out of central Paris preloads Notre-Dame and crosses once with no menu input',async()=>{
  const start=edgeApproach(6600,2600),far=start(100),cut=start(1);
  const direction={...edgeAt(far).outward,speed:3};
  let finish,status='';
  const loads=[],commits=[];
  const crossing=createRoadCrossing({
    load(next){loads.push(next.key);return new Promise(resolve=>{finish=resolve;});},
    commit(next){commits.push(next.key);return true;},show(text){status=text;}
  });
  crossing.tick(far,edgeAt(far),direction);
  assert.deepEqual(loads,['notre-dame']);
  assert.equal(status,'');
  crossing.tick(cut,edgeAt(cut),direction);
  assert.match(status,/Chargement de Notre-Dame/);
  assert.deepEqual(commits,[]);
  finish();await drain();
  crossing.tick(cut,edgeAt(cut),null);
  crossing.tick(cut,edgeAt(cut),{x:-direction.x,y:-direction.y,speed:3});
  assert.deepEqual(commits,[]);
  crossing.tick(cut,edgeAt(cut),direction);
  crossing.tick(cut,edgeAt(cut),direction);
  assert.deepEqual(commits,['notre-dame']);
});

test('a car can continue into overlapping geographic tiles and wait out a failed preload',async()=>{
  const start=edgeApproach(3200,1300),far=start(95),cut=start(9.2);
  const motion={...edgeAt(far).outward,speed:27};
  let time=0,status='',attempts=0;
  const chosen=adjacentSector(far,edgeAt(far),motion);
  assert.match(chosen.key,/^ign:/);
  const next=crossingURL('https://world.test/?halte=etoile&room=old',chosen);
  assert.equal(next.searchParams.get('lon'),chosen.lon.toFixed(5));
  assert(!next.searchParams.has('room')&&!next.searchParams.has('halte'));
  const passed=[];
  const crossing=createRoadCrossing({
    load:async()=>{if(++attempts===1)throw Error('Unavailable');},
    commit:n=>{passed.push(n.key);return true;},show:text=>{status=text;},clock:()=>time
  });
  crossing.tick(far,edgeAt(far),motion);await drain();
  crossing.tick(start(45),edgeAt(start(45)),motion);
  crossing.tick(cut,edgeAt(cut),motion);
  assert.match(status,/Nouvel essai automatique/);assert.equal(attempts,1);
  time+=7000;crossing.tick(cut,edgeAt(cut),motion);await drain();
  crossing.tick(cut,edgeAt(cut),motion);
  assert.deepEqual(passed,[chosen.key]);
});

test('only the addressed destination takes the preserved position; an obstructed arrival may return once',t=>{
  const values=new Map();
  const previous=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{
    getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)
  }});
  t.after(()=>{if(previous)Object.defineProperty(globalThis,'sessionStorage',previous);else delete globalThis.sessionStorage;});
  const base=new URL('https://world.test/');
  const dest=crossingURL(base.href,{key:'notre-dame',lon:2.3479,lat:48.85348,name:'Notre-Dame de Paris'});
  const state={x:6600,y:2670,angle:.12,vehicle:{id:'car-1',speed:18}};
  assert(storeSectorTransfer(dest,{state,name:'Notre-Dame',from:base.href,previousName:'Louvre'}));
  assert.equal(readSectorTransfer(base),null);
  assert.deepEqual(readSectorTransfer(dest).state,state);
  assert.equal(retreatFromSector(dest,readSectorTransfer(dest)),base.href);
  const back=readSectorTransfer(base);
  assert.equal(back.returning,true);assert.deepEqual(back.state,state);
  assert.equal(retreatFromSector(base,back),null);
  clearSectorTransfer();assert.equal(readSectorTransfer(base),null);
});
