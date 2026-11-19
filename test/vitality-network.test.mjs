import test from 'node:test';
import assert from 'node:assert/strict';
import {localDatabase} from '../scripts/local-db.mjs';
import {createNet} from '../public/net.js';
import {handleApi} from '../worker/game-api.js';
import {authoredWeaponDrops} from '../public/drop-id.js';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(condition,label){
  const limit=performance.now()+4200;
  while(!condition()){
    if(performance.now()>limit)assert.fail(label);
    await wait(10);
  }
}

// Every browser runs the real outbox, retry loop, presence polling and event decoder.
function sharedWorld(t){
  const db=localDatabase(),clients=[],pending=new Set();
  const epoch=Date.now();
  let clock=epoch;
  t.mock.method(Date,'now',()=>clock);
  t.after(async()=>{
    for(const client of clients)client.stop();
    await Promise.allSettled([...pending]);db.close();
  });
  function browser(name,intercept){
    const events=[];
    const fetcher=(url,init)=>{
      const send=()=>handleApi(new Request('https://game.test'+url,init),{DB:db});
      const request=Promise.resolve().then(()=>intercept?intercept(JSON.parse(init.body),send):send());
      pending.add(request);request.then(()=>pending.delete(request),()=>pending.delete(request));
      return request;
    };
    const net=createNet({name,fetcher,pollMs:15});
    clients.push(net);net.onEvent(e=>events.push(e));net.publish({x:10,y:10});
    return {net,events};
  }
  return {browser,epoch,advance(ms){clock+=ms;}};
}

test('Concurrent browser hits accumulate once across a lost reply, preserve a knockout and resume from recovered NPC health',async t=>{
  const {browser,epoch,advance}=sharedWorld(t);
  const target='npc-vitality-7',attempts=[],arrived=new Set();
  let openGate,replyLost=false;
  const gate=new Promise(resolve=>{openGate=resolve;});
  // Both first hit requests must reach the API boundary before either can commit.
  const transport=name=>async(body,send)=>{
    const hit=body.events?.find(e=>e.type==='npc'&&e.data.id===target);
    if(!hit)return send();
    if(name==='A')attempts.push(hit.op);
    if(!arrived.has(name)){
      arrived.add(name);if(arrived.size===2)openGate();
      await gate;
    }
    const response=await send();
    if(name==='A'&&!replyLost){replyLost=true;throw Error('Lost reply after commit');}
    return response;
  };
  const a=browser('A',transport('A')),b=browser('B',transport('B'));
  assert.deepEqual(await Promise.all([a.net.start(),b.net.start()]),[true,true]);
  function hit(client,damage){
    // Predicted values are stale on purpose. The server owns the shared total.
    assert(client.net.emit('npc',{id:target,x:11,y:10,damage,health:100-damage,healthAt:Date.now(),downUntil:0}));
  }
  const stateOf=client=>client.net.world().npcs[target];
  const observed=client=>client.events.filter(e=>e.type==='npc'&&e.data.id===target);
  hit(a,26);hit(b,34);
  await until(()=>attempts.length>=2 && [a,b].every(c=>stateOf(c)?.health===40&&observed(c).length===2),'Both replicas should receive two unique hits, including the sender echo');
  assert.equal(new Set(attempts).size,1,'The sender retries its original operation');
  assert.deepEqual(observed(a).map(e=>e.seq),observed(b).map(e=>e.seq));
  assert.deepEqual(observed(a).map(e=>e.data.damage).sort((x,y)=>x-y),[26,34]);
  assert.equal(new Set(observed(a).map(e=>e.seq)).size,2);

  hit(b,55);
  await until(()=>[a,b].every(c=>stateOf(c)?.health===0),'The knockout should reach both clients');
  const downUntil=epoch+6500;
  assert.equal(stateOf(a).downUntil,downUntil);assert.equal(stateOf(a).stunnedUntil,downUntil);
  assert.equal(stateOf(a).ragdoll.until,downUntil);

  advance(6499);hit(a,100);
  await until(()=>[a,b].every(c=>observed(c).length===4),'A hit on the downed NPC must be acknowledged');
  assert.equal(stateOf(a).health,0);assert.equal(stateOf(b).damage,0);
  assert.equal(stateOf(a).downUntil,downUntil,'An extra hit must not extend the knockout');

  advance(2);hit(b,8);
  await until(()=>[a,b].every(c=>observed(c).length===5),'The first post-knockout hit should use restored health');
  assert.equal(stateOf(a).health,57,'The NPC rises with 65 HP and takes 8 damage');
  assert.equal(stateOf(b).downUntil,0);assert.equal(stateOf(b).healthAt,downUntil+1);

  advance(11500);hit(a,3);
  await until(()=>[a,b].every(c=>observed(c).length===6),'Both browsers should see the regenerated health');
  assert.equal(stateOf(b).health,60,'After the 10 s grace period the NPC regains 6 HP in 1.5 s, then takes 3 damage');
  b.net.stop();assert(await b.net.start());
  assert.equal(stateOf(b).health,60,'The D1 join snapshot should contain the last resolved health');
});

test('Peers receive bounded player vitality, a public avatar without linking data, and filtered shot geometry',async t=>{
  const {browser,epoch}=sharedWorld(t);
  const a=browser('Source'),b=browser('Témoin');
  const secrets={profileId:'private-source-account-853',friendCode:'private-friend-931',recoveryKey:'private-key-782',email:'private@example.invalid'};
  a.net.publish({
    x:11,y:12,health:900,healthAt:epoch+95000,downUntil:epoch+99000,
    ragdoll:{at:epoch+9000,until:epoch+99000,angle:25,force:12,seed:100000,...secrets},
    appearance:{shape:4,hair:77,outfit:2,costume:120,headwear:999,color:'#AAC0D1',...secrets},
    ...secrets
  });
  assert.deepEqual(await Promise.all([a.net.start(),b.net.start()]),[true,true]);
  const peer=()=>b.net.peers().find(p=>p.id===a.net.id);
  await until(()=>peer()?.appearance,'The second player should see the avatar');
  const replica=peer();
  assert.equal(replica.health,100);assert.equal(replica.healthAt,epoch+1000);assert.equal(replica.downUntil,epoch+8000);
  assert.deepEqual(replica.ragdoll,{at:epoch+500,until:epoch+8000,angle:2*Math.PI,force:1,seed:65535});
  assert.deepEqual(replica.appearance,{shape:4,hair:1,eyes:0,nose:1,mouth:0,accessory:0,outfit:2,color:'#aac0d1',costume:120});
  for(const secret of Object.values(secrets))assert(!JSON.stringify(replica).includes(secret));

  a.net.publish({x:11,y:12,health:-1,downUntil:-12,ragdoll:{at:epoch-20000,until:epoch-10000,force:1}});
  await until(()=>peer()?.health===0,'The lower health bound must be published');
  assert.equal(peer().downUntil,0);assert(!Object.hasOwn(peer(),'ragdoll'));

  const origin={x:11,y:12};
  const rays=[{...origin,angle:20,length:800},null,{x:2000,y:12,length:5},{x:'11',y:12},
    ...Array.from({length:12},(_,i)=>({x:12+i,y:13,angle:-20,length:-5,profileId:secrets.profileId}))];
  assert(a.net.emit('shot',{...origin,kind:'confetti',lift:1.6,length:1000,rays,impact:{x:14,y:13,radius:50,email:secrets.email}}));
  assert(a.net.emit('shot',{...origin,kind:'chime',length:-3,rays:[{x:140,y:12}],impact:{x:900,y:12,radius:4}}));
  await until(()=>b.events.filter(e=>e.type==='shot').length===2,'The observer should receive both shot effects');
  const [first,second]=b.events.filter(e=>e.type==='shot').map(e=>e.data);
  assert.equal(first.lift,1.6);assert.equal(first.length,400);assert.deepEqual(first.impact,{x:14,y:13,radius:12});
  assert.deepEqual(first.rays,[{...origin,angle:8,length:100},...Array.from({length:9},(_,i)=>({x:12+i,y:13,angle:-8,length:0}))]);
  assert.equal(second.length,0);assert.deepEqual(second.rays,[]);assert(!Object.hasOwn(second,'impact'));
});


test('a second online player receives the climb, landing, and vehicle transition; pavement pickups require ground reach',async t=>{
  const {browser}=sharedWorld(t),a=browser('Grimpe'),b=browser('Parvis');
  const {id,weapon,x,y}=authoredWeaponDrops[0];
  const pose={x,y,health:100,motion:'climb',motionPhase:.45,lift:1.6,verticalSpeed:3,stride:.6,slope:.16};
  a.net.publish(pose);b.net.publish({x:x+4,y,health:100});
  assert.deepEqual(await Promise.all([a.net.start(),b.net.start()]),[true,true]);
  const peer=()=>b.net.peers().find(p=>p.id===a.net.id);
  await until(()=>peer()?.motion==='climb','climb relayed through the shared worker');
  for(const k of ['lift','motionPhase','verticalSpeed','stride','slope'])assert.equal(peer()[k],pose[k]);
  assert.equal((await a.net.claimPickup(id,weapon)).ok,false);
  a.net.publish({...pose,lift:.5,motion:'fall',verticalSpeed:-4});
  assert.equal((await a.net.claimPickup(id,weapon)).ok,false);
  a.net.publish({...pose,lift:0,motion:'land',verticalSpeed:0});
  assert.equal((await a.net.claimPickup(id,weapon)).ok,true);
  await until(()=>peer()?.motion==='land'&&peer().lift===0,'landing clears previous height');
  a.net.publish({...pose,lift:100,motion:'unexpected',verticalSpeed:-100,motionPhase:9,stride:-4,slope:8});
  await until(()=>peer()?.lift===64,'movement fields have finite bounds');
  assert.deepEqual([peer().verticalSpeed,peer().motion,peer().motionPhase,peer().stride,peer().slope],[-50,'idle',1,0,1]);
  a.net.publish({...pose,vehicle:{id:'car-maillot',type:'scooter',x,y}});
  await until(()=>peer()?.vehicle?.type==='scooter','driving replaces the traversal');
  assert.equal(peer().lift,0);assert.equal(peer().motion,'idle');
});

test('a swing reaches the second client once and can make a single nearby physical contact',async t=>{
  const {browser,epoch,advance}=sharedWorld(t),a=browser('Gant'),b=browser('Pelote'),c=browser('Laine');
  const pose={x:10,y:10,angle:0,lift:0,health:100};
  const swing={...pose,kind:'jab',started:epoch};
  const hit={target:b.net.id,cause:'melee',kind:'jab',swingAt:epoch,damage:99,force:1,angle:0};
  a.net.publish({...pose,melee:{kind:'jab',started:epoch}});
  b.net.publish({...pose,x:11.2});c.net.publish({...pose,x:39});
  await Promise.all([a.net.start(),b.net.start(),c.net.start()]);
  await until(()=>b.net.peers().some(p=>p.melee?.started===epoch),'joining observer receives live wind-up');
  a.net.emit('melee',swing);a.net.emit('melee',swing);advance(150);
  a.net.emit('hit',{...hit,target:c.net.id});
  a.net.emit('hit',hit);a.net.emit('hit',hit);
  a.net.emit('destroy',{id:'second-target',cause:'melee',swingAt:epoch,swingKind:'jab',x:10,y:11});
  a.net.emit('emote',{symbol:'marker'});
  await until(()=>c.events.some(e=>e.type==='emote'),'end of the batch observed');
  const punches=c.events.filter(e=>e.type==='melee'),hits=c.events.filter(e=>e.type==='hit');
  assert.equal(punches.length,1);assert.equal(hits.length,1);
  assert.deepEqual(hits[0].data,{target:b.net.id,cause:'melee',kind:'jab',swingAt:epoch,damage:12,force:.18,angle:0});
  assert.equal(c.net.world().destroyed.includes('second-target'),false);

  advance(350);
  const start=Date.now();
  a.net.emit('melee',{...swing,kind:'hook',started:start});
  const target={id:'ped-wool',x:11.6,y:10,type:'pedestrian',damage:16,cause:'melee',swingAt:start,swingKind:'hook',
    recoil:{at:start+200,fromX:11.12,fromY:10,angle:0,force:.19},health:84,healthAt:start+200};
  advance(200);a.net.emit('npc',target);a.net.emit('npc',target);
  await until(()=>c.net.world().npcs[target.id]?.health===84,'NPC recoil and canonical health delivered together');
  assert.deepEqual(c.net.world().npcs[target.id].recoil,target.recoil);
  assert.equal(c.events.filter(e=>e.type==='npc'&&e.data.id===target.id).length,1);
  b.net.publish({...pose,x:11.6,recoil:{at:Date.now(),force:.19,angle:0,debug:'private'}});
  await until(()=>a.net.peers().some(p=>p.recoil?.force===.19),'recoil observed from the owner');
  assert.equal(a.net.peers().find(p=>p.id===b.net.id).recoil.debug,undefined);

  advance(100);
  a.net.emit('hit',{...hit,swingAt:Date.now()});
  a.net.emit('melee',{...swing,started:Date.now(),kind:'absent'});
  a.net.emit('emote',{symbol:'end'});
  await until(()=>c.events.some(e=>e.data.symbol==='end'),'unmatched contacts filtered');
  assert.equal(c.events.filter(e=>e.type==='hit').length,1);
  assert.equal(c.events.filter(e=>e.type==='melee').length,2);
});
