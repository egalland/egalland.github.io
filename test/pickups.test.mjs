import test from 'node:test';
import assert from 'node:assert/strict';
import { localDatabase } from '../scripts/local-db.mjs';
import { handleApi } from '../worker/game-api.js';
import { authoredWeaponDrops, encodeDropId, gridDrop } from '../public/drop-id.js';
import { createNet } from '../public/net.js';

const spawn=authoredWeaponDrops[0];
const user=name=>({name,id:crypto.randomUUID(),token:crypto.randomUUID()});
const op=(n,now=Date.now())=>'pick-'+now.toString(36)+'-'+n.toString(36);
const action=(operation,drop=spawn)=>({op:operation,type:'pickup',data:{id:drop.id,weapon:drop.weapon}});
const pose=({x,y})=>({x,y,vehicle:null});
const api=(DB,operation,body)=>handleApi(new Request('https://game.test/api/world/'+operation,{
  method:'POST',body:JSON.stringify(body)
}),{DB});
async function ok(request){
  const r=await request;const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j;
}

test('Simultaneous collection has one winner and one feed event; losers and winners keep their original receipts across reconnects',async()=>{
  const clock=Date.now,DB=localDatabase(),t0=clock();let t=t0;
  Date.now=()=>t;
  try{
    const a=user('Renard'),b=user('Mousse'),newcomer=user('Miel');
    const join=(u)=>ok(api(DB,'join',{...u,state:pose(spawn)}));
    const sync=(u,claim)=>ok(api(DB,'sync',{...u,state:pose(spawn),cursor:0,events:claim?[claim]:[]}));
    await Promise.all([join(a),join(b)]);
    const claimA=action(op(1)),claimB=action(op(1));
    const answers=await Promise.all([sync(a,claimA),sync(b,claimB)]);
    const receipts=answers.map(v=>v.pickupResults[0]);
    assert.deepEqual(receipts.map(r=>r.ok).sort(),[false,true]);
    assert(receipts.every(r=>r.availableAt===t0+60000));
    const winner=receipts[0].ok?a:b,loser=receipts[0].ok?b:a;
    const initial=await join(newcomer);assert.deepEqual(initial.world.pickups,{[spawn.id]:t0+60000});
    const feed=await sync(newcomer);
    assert.equal(feed.events.filter(e=>e.type==='pickup').length,1);
    assert(!Object.hasOwn(feed,'pickupResults'));
    t=t0+4000;
    assert.equal((await sync(winner,claimA)).pickupResults[0].availableAt,t0+60000);
    assert.equal((await sync(loser,claimB)).pickupResults[0].ok,false);
    t=t0+60001;await Promise.all([join(a),join(b)]);
    assert.deepEqual((await join(newcomer)).world.pickups,{});
    const retry=await sync(loser,claimB);
    assert.equal(retry.pickupResults[0].ok,false);
    assert.equal(retry.events.filter(e=>e.type==='pickup').length,1);
    const ancient=await sync(newcomer,action(op(20,t0)));
    assert.deepEqual(ancient.pickupResults,[]);
    const second=await sync(loser,action(op(2)));
    assert.equal(second.pickupResults[0].ok,true);
    assert.equal(second.pickupResults[0].availableAt,t+60000);
    assert.equal(second.events.filter(e=>e.type==='pickup').length,2);
    const replay=await sync(winner,claimA);
    assert.equal(replay.pickupResults[0].availableAt,t0+60000);
    assert.equal((await join(newcomer)).world.pickups[spawn.id],t+60000);
  }finally{Date.now=clock;DB.close();}
});

test('The authoritative claim validates membership, canonical map source, weapon, foot state and fresh synchronised position',async()=>{
  const DB=localDatabase(),u=user('Praline'),spot=gridDrop(40,51);
  try{
    await ok(api(DB,'join',{...u,state:pose(spawn)}));
    const sync=(n,drop,state)=>ok(api(DB,'sync',{...u,state,events:[action(op(n),drop)]}));
    assert.equal((await sync(1,spot,pose(spawn))).pickupResults[0].ok,false);
    assert.equal((await sync(2,spot,{...pose(spot),vehicle:{id:'car-etoile'}})).pickupResults[0].ok,false);
    const wrongWeapon=await sync(3,{...spot,weapon:'invalid'},pose(spot));assert(!wrongWeapon.pickupResults?.length);
    const invented={x:101.3,y:121.2,weapon:'yarn'};invented.id=encodeDropId('yarn',invented.x,invented.y);
    assert(!(await sync(4,invented,pose(invented))).pickupResults?.length);
    assert.equal((await api(DB,'sync',{...u,token:crypto.randomUUID(),state:pose(spot),events:[action(op(5),spot)]})).status,401);
    const good=await sync(6,spot,pose(spot));assert.equal(good.pickupResults[0].ok,true);
    assert.equal(good.events.filter(e=>e.type==='pickup').length,1);
  }finally{DB.close();}
});

test('A lost acknowledgement retries the same claim and the game receives one grant; observers and new sessions see its cooldown',async()=>{
  const DB=localDatabase(),clients=[],inFlight=new Set(),ops=[];
  let lost=true;const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function client(name,loseFirst=false){
    const fetcher=(url,init)=>{
      const json=JSON.parse(init.body),claim=json.events?.find(e=>e.type==='pickup');
      if(claim&&loseFirst)ops.push(claim.op);
      const r=handleApi(new Request('https://game.test'+url,init),{DB}).then(response=>{
        if(loseFirst&&claim&&lost){lost=false;throw new Error('Lost reply after the transaction committed');}return response;
      });
      inFlight.add(r);r.then(()=>inFlight.delete(r),()=>inFlight.delete(r));return r;
    };
    const n=createNet({name,fetcher,pollMs:20});n.publish(pose(spawn));clients.push(n);return n;
  }
  try{
    const collector=client('Filou',true),spectator=client('Noé');let seen=0;
    spectator.onEvent(e=>{if(e.type==='pickup')seen++;});
    assert.equal((await collector.claimPickup(spawn.id,spawn.weapon)).ok,false);
    await Promise.all([collector.start(),spectator.start()]);
    const grant=collector.claimPickup(spawn.id,spawn.weapon);
    assert.equal((await collector.claimPickup(spawn.id,spawn.weapon)).ok,false);
    const result=await grant;assert.equal(result.ok,true);
    assert(ops.length>=2);assert.equal(new Set(ops).size,1);
    const start=Date.now();while(!seen&&Date.now()-start<2200)await wait(20);
    assert.equal(seen,1);assert.equal(spectator.world().pickups[spawn.id],result.availableAt);
    assert.equal((await spectator.claimPickup(spawn.id,spawn.weapon)).ok,false);
    const later=client('Lina');await later.start();assert.equal(later.world().pickups[spawn.id],result.availableAt);
    collector.stop();assert.equal((await collector.claimPickup(spawn.id,spawn.weapon)).ok,false);
    assert.equal(await collector.start(),true);assert.equal((await collector.claimPickup(spawn.id,spawn.weapon)).ok,false);
  }finally{
    clients.forEach(n=>n.stop());await Promise.allSettled([...inFlight]);DB.close();
  }
});
