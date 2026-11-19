import test from 'node:test';
import assert from 'node:assert/strict';
import { localDatabase } from '../scripts/local-db.mjs';
import { handleApi } from '../worker/game-api.js';
import { createNet } from '../public/net.js';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(condition) {
  const start=Date.now();
  while (!condition()) {
    if (Date.now()-start>3500) assert.fail('The expected room update never arrived.');
    await sleep(15);
  }
}
test('Independent clients share their room, chat, map changes and vehicles across reconnects',async()=>{
  const DB=localDatabase(),sessions=[];
  const fetcher=(url,init)=>handleApi(new Request('https://example.test'+url,init),{DB});
  function client(name,room) {
    const messages=[],events=[],options={name,room,fetcher,pollMs:20,onChat:m=>messages.push(m)};
    const net=createNet(options);
    net.onEvent(e=>events.push(e));
    net.publish({x:102,y:44,angle:0,type:'fox'});
    sessions.push(net);
    return {net,messages,events};
  }
  try {
    const alice=client('Filou','atelier'),bob=client('Mousse','atelier'),other=client('Isolé','rue');
    await Promise.all(sessions.map(n=>n.start()));
    await until(()=>alice.net.peers().length===1 && bob.net.peers().length===1);
    assert.deepEqual(alice.net.peers().map(p=>p.name),['Mousse']);
    assert.equal(other.net.peers().length,0);
    alice.net.publish({x:120,y:97,angle:Math.PI,vehicle:null});
    assert.ok(alice.net.sendChat('Salut les renards !'));
    alice.net.emit('destroy',{id:'p-7-8'});
    alice.net.emit('vehicle',{id:'auto-3',x:120,y:97,angle:0,occupied:true});
    alice.net.emit('emote',{symbol:'👋'});
    const incident={id:'dispatch-swat-1',kind:'swat',x:50,y:60,started:Date.now(),level:3};
    alice.net.emit('npc',incident);
    await until(()=>bob.net.peers()[0]?.x===120 && bob.net.world().vehicles['auto-3']?.owner===alice.net.id && bob.messages.length && bob.events.some(e=>e.type==='emote'));
    assert.deepEqual(bob.net.world().destroyed,['p-7-8']);
    assert.deepEqual(bob.net.world().npcs[incident.id],incident);
    assert.equal(bob.messages[0].text,'Salut les renards !');
    assert.equal(alice.messages.length,1);
    assert.deepEqual(other.net.world().destroyed,[]);
    assert.equal(other.messages.length,0);
    bob.net.emit('vehicle',{id:'auto-3',x:12,y:1,occupied:true});
    await until(()=>bob.events.some(e=>e.type==='vehicleDenied'));
    assert.equal(bob.net.world().vehicles['auto-3'].owner,alice.net.id);
    alice.net.emit('vehicle',{id:'auto-3',x:200,y:300,angle:1,occupied:false});
    await until(()=>bob.net.world().vehicles['auto-3']?.x===200);
    bob.net.emit('vehicle',{id:'auto-3',x:200,y:300,occupied:true});
    await until(()=>alice.net.world().vehicles['auto-3']?.owner===bob.net.id);
    await other.net.setRoom('Atélier');
    assert.equal(other.net.room,'atelier');
    assert.deepEqual(other.net.world().destroyed,['p-7-8']);
    assert.equal(other.net.world().vehicles['auto-3'].owner,bob.net.id);
    assert.equal(other.messages[0].name,'Filou');
    assert.equal(other.net.peers().length,2);
    await bob.net.setRoom('rue');
    await until(()=>alice.net.peers().length===1 && alice.net.peers()[0].name==='Isolé');
    assert.equal(bob.net.peers().length,0);
    assert.deepEqual(bob.net.world().destroyed,[]);
    assert.equal(alice.net.players().some(p=>p.name==='Mousse'),false);
  } finally {sessions.forEach(n=>n.stop());}
});
test('Retries are idempotent and an unrelated token cannot write as another player',async()=>{
  const DB=localDatabase(),room='place',id=crypto.randomUUID(),token=crypto.randomUUID();
  async function call(path,extra={}) {
    const body=JSON.stringify({room,id,token,name:'Lune',state:{x:12,y:48},cursor:0,...extra});
    return handleApi(new Request('https://example.test/api/'+path,{method:'POST',body}),{DB});
  }
  assert.equal((await call('join')).status,200);
  const write=op=>({events:[{op,type:'chat',data:{text:'Une fois'}}]});
  await call('sync',write('1'));
  const retry=await (await call('sync',write('1'))).json();
  assert.equal(retry.events.filter(e=>e.type==='chat').length,1);
  const unauth=await call('sync',{...write('2'),token:crypto.randomUUID()});
  assert.equal(unauth.status,401);
  const check=await (await call('sync')).json();
  assert.equal(check.events.length,1);
});
test('A full room enforces its cap, permits a reconnect and reclaims an expired slot',async()=>{
  const DB=localDatabase();
  const sessions=Array.from({length:17},()=>({room:'complet',id:crypto.randomUUID(),token:crypto.randomUUID()}));
  const join=s=>handleApi(new Request('https://example.test/api/join',{
    method:'POST',body:JSON.stringify(s)
  }),{DB});
  try {
    for (const s of sessions.slice(0,16)) assert.equal((await join(s)).status,200);
    assert.equal((await join(sessions[16])).status,409);
    assert.equal((await join(sessions[1])).status,200);
    await DB.prepare('UPDATE mc_members SET seen=? WHERE id=?').bind(Date.now()-60_000,sessions[0].id).run();
    const res=await join(sessions[16]);
    assert.equal(res.status,200);
    const {players}=await res.json();
    assert.equal(players.length,16);
    assert.equal(players.some(p=>p.id===sessions[0].id),false);
  } finally {DB.close();}
});

test('Paris rooms and old top-down rooms use separate coordinate spaces',async()=>{
  const DB=localDatabase();
  const enter=(path,name)=>handleApi(new Request('https://example.test'+path,{method:'POST',body:JSON.stringify({
    room:'public',name,id:crypto.randomUUID(),token:crypto.randomUUID(),state:{x:10,y:20}
  })}),{DB}).then(r=>r.json());
  assert.equal((await enter('/api/join','Classic')).players.length,1);
  assert.deepEqual((await enter('/api/paris/join','Paris')).players.map(p=>p.name),['Paris']);
  const second=await enter('/api/paris/join','Neuilly');
  assert.deepEqual(second.players.map(p=>p.name).sort(),['Neuilly','Paris']);
});
