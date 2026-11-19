import test from 'node:test';
import assert from 'node:assert/strict';
import { localDatabase } from '../scripts/local-db.mjs';
import { handleApi } from '../worker/game-api.js';
import { createNet } from '../public/net.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
async function until(condition) {
  const deadline=Date.now()+3500;
  while (!condition()) {
    if (Date.now()>deadline) assert.fail('The expected shared-world update did not arrive.');
    await sleep(15);
  }
}
const session = name => ({name,id:crypto.randomUUID(),token:crypto.randomUUID()});
const api = (DB,path,body) => handleApi(new Request('https://game.test'+path,{
  method:'POST',body:JSON.stringify(body)
}),{DB});
async function accepted(response) {
  const r=await response;
  const data=await r.json();
  assert.equal(r.status,200,JSON.stringify(data));
  return data;
}

test('Independent browsers in distant sectors exchange positions, global chat, damage, dispatch and car ownership',async()=>{
  const DB=localDatabase(),clients=[],outstanding=new Set();
  function client(name,x,y,oldLink) {
    const messages=[],events=[];
    const fetcher=(url,init)=>{
      const body=JSON.parse(init.body);
      if(oldLink) body.room=oldLink;
      const req=api(DB,url,body);
      outstanding.add(req);req.finally(()=>outstanding.delete(req));return req;
    };
    const net=createNet({name,pollMs:20,fetcher,onChat:m=>messages.push(m)});
    net.onEvent(e=>events.push(e));net.publish({x,y,angle:0,type:'fox'});
    const c={net,messages,events};clients.push(c);return c;
  }
  try {
    const paris=client('Filou',3200,660,'ancien-groupe-A'),cergy=client('Mousse',-24000,-15800),east=client('Miel',24000,12800,'ancien-groupe-B');
    await Promise.all(clients.map(c=>c.net.start()));
    await until(()=>clients.every(c=>c.net.peers().length===2));
    assert.equal(cergy.net.peers().find(p=>p.id===paris.net.id).x,3200);
    assert.equal(paris.net.peers().find(p=>p.id===east.net.id).y,12800);
    paris.net.publish({x:3212,y:663,angle:1.2,vehicle:null});
    assert.ok(paris.net.sendChat('Salut à toute l’Île-de-France !'));
    paris.net.emit('destroy',{id:'p-arc-7'});
    paris.net.emit('vehicle',{id:'auto-3',x:3212,y:663,angle:1.2,occupied:true});
    paris.net.emit('emote',{symbol:'👋'});
    const incident={id:'dispatch-swat-1',kind:'swat',x:3212,y:663,started:Date.now(),level:3};
    paris.net.emit('npc',incident);
    await until(()=>[cergy,east].every(c=>c.net.peers().some(p=>p.id===paris.net.id&&p.x===3212)
      &&c.net.world().vehicles['auto-3']?.owner===paris.net.id&&c.events.some(e=>e.type==='emote')&&c.net.world().npcs[incident.id]&&c.messages.length===1));
    for (const c of [cergy,east]) {
      assert.equal(c.messages[0].text,'Salut à toute l’Île-de-France !');
      assert.deepEqual(c.net.world().destroyed,['p-arc-7']);
      assert.deepEqual(c.net.world().npcs[incident.id],incident);
    }
    assert.equal(paris.messages.length,1);
    east.net.emit('vehicle',{id:'auto-3',x:24000,y:12800,occupied:true});
    await until(()=>east.events.some(e=>e.type==='vehicleDenied'));
    assert.equal(east.net.world().vehicles['auto-3'].owner,paris.net.id);
    paris.net.emit('vehicle',{id:'auto-3',x:3220,y:670,occupied:false});
    await until(()=>east.net.world().vehicles['auto-3'].occupied===false);
    cergy.net.emit('vehicle',{id:'auto-3',x:3220,y:670,occupied:true});
    await until(()=>east.net.world().vehicles['auto-3'].owner===cergy.net.id);
    east.net.stop();
    await until(()=>paris.net.peers().every(p=>p.id!==east.net.id));
    const back=client('Miel',24000,12800);
    assert(await back.net.start());assert.equal(back.messages[0].name,'Filou');
    assert.deepEqual(back.net.world().destroyed,['p-arc-7']);assert.equal(back.net.world().vehicles['auto-3'].owner,cergy.net.id);
  } finally {
    for (const c of clients)c.net.stop();
    await Promise.allSettled([...outstanding]);DB.close();
  }
});

test('The public Paris history survives the change; named private histories and their pending requests stay private',async()=>{
  const DB=localDatabase();
  try {
    const first=session('Place publique'),second=session('Ancien lien');
    await accepted(api(DB,'/api/world/join',first));
    const stored=(room,op,text)=>DB.prepare(`INSERT INTO mc_events (room,player,op,name,type,data,at) VALUES (?,?,?,?,?,?,?)`)
      .bind(room,first.id,op,'Archives','chat',JSON.stringify({text}),Date.now()).run();
    await stored('paris:public','before-public','Bienvenue à Paris');
    await stored('paris:cercle','before-private','Un ancien échange privé');
    await stored('public','pixel-public','Ancien jeu en pixels');
    await DB.prepare('INSERT INTO mc_items(room,kind,item,seq,owner,data,at) VALUES(?,?,?,?,?,?,?)')
      .bind('paris:cercle','destroy','private-bin',2,'','{}',Date.now()).run();
    for(const [route,room] of [['world','cercle'],['paris','public'],['paris',undefined],['world',{}]]) {
      const entered=await accepted(api(DB,'/api/'+route+'/join',{...second,room}));
      assert.deepEqual(entered.history.map(e=>e.data.text),['Bienvenue à Paris']);assert.deepEqual(entered.world.destroyed,[]);
    }
    const pending={op:'pending',type:'chat',data:{text:'Un message destiné à mon ancien cercle'}};
    for(const path of ['/api/join','/api/sync','/api/leave','/api/paris/join','/api/paris/sync','/api/paris/leave']){
      const res=await api(DB,path,{...second,room:'cercle',events:[pending]});
      assert.equal(res.status,410,path);assert.deepEqual(await res.json(),{error:'update_required'});
    }
    const visible=await accepted(api(DB,'/api/world/sync',{...first,cursor:0}));
    assert.equal(visible.players.length,2);
    assert.deepEqual(visible.events.filter(e=>e.type==='chat').map(e=>e.data.text),['Bienvenue à Paris']);
    const privateRows=await DB.prepare('SELECT count(*) AS n FROM mc_events WHERE room=?').bind('paris:cercle').first();
    assert.equal(privateRows.n,1);
  } finally {DB.close();}
});

test('More than sixteen players coexist, old public clients see them and reconnection keeps the same player',async()=>{
  const DB=localDatabase();
  try {
    const crowd=Array.from({length:24},(_,i)=>({...session('Joueur '+i),state:{x:1000*i,y:-40*i}}));
    const joined=await Promise.all(crowd.map(c=>accepted(api(DB,'/api/world/join',c))));
    assert.equal(joined.at(-1).players.length,24);
    const reconnect=await accepted(api(DB,'/api/paris/join',{...crowd[5],state:undefined,room:'public'}));
    assert.equal(reconnect.players.length,24);
    const again=reconnect.players.find(p=>p.id===crowd[5].id);
    assert.equal(again.x,5000);assert.equal(again.joinedAt,joined[5].players.find(p=>p.id===crowd[5].id).joinedAt);
    await accepted(api(DB,'/api/world/leave',crowd[0]));
    await DB.prepare('UPDATE mc_members SET seen=? WHERE room=? AND id=?').bind(Date.now()-60_000,'paris:public',crowd[1].id).run();
    const active=await accepted(api(DB,'/api/world/sync',crowd[2]));
    assert.equal(active.players.length,22);assert(!active.players.some(p=>p.id===crowd[0].id||p.id===crowd[1].id));
  } finally {DB.close();}
});

test('Retries do not duplicate chat, rewind vehicles or change the identity of a destroyed item',async()=>{
  const DB=localDatabase();
  try {
    const alice=session('Lune'),send=events=>accepted(api(DB,'/api/world/sync',{...alice,cursor:0,events}));
    await accepted(api(DB,'/api/world/join',alice));
    const chat={op:'1',type:'chat',data:{text:'Une fois'}},destroy={op:'2',type:'destroy',data:{id:'bin-one'}};
    const car={op:'3',type:'vehicle',data:{id:'auto',occupied:true,x:18,y:28}};
    await send([chat,destroy,car]);await send([{op:'4',type:'vehicle',data:{id:'auto',occupied:false,x:78,y:18}}]);
    const retried=await send([chat,{...destroy,data:{id:'bin-two'}},car]);
    assert.equal(retried.events.filter(e=>e.type==='chat').length,1);
    assert.equal((await api(DB,'/api/world/join',{...alice,token:crypto.randomUUID()})).status,403);
    assert.equal((await api(DB,'/api/world/sync',{...alice,token:crypto.randomUUID(),events:[chat]})).status,401);
    const view=await accepted(api(DB,'/api/world/join',session('Témoin')));
    assert.deepEqual(view.world.destroyed,['bin-one']);assert.equal(view.world.vehicles.auto.x,78);assert.equal(view.world.vehicles.auto.owner,'');
    assert.equal(view.history.length,1);
  } finally {DB.close();}
});

test('an automatic road transfer keeps the same presence and continues the shared action counter',async()=>{
  const DB=localDatabase(),requests=new Set();
  const fetcher=(path,init)=>{
    const work=api(DB,path,JSON.parse(init.body));
    requests.add(work);work.then(()=>requests.delete(work),()=>requests.delete(work));
    return work;
  };
  const chat=[],first=createNet({name:'En route',fetcher,pollMs:15,onChat:e=>chat.push(e.text)});
  let second;
  try{
    first.publish({x:5010,y:1370});assert(await first.start());
    assert(first.sendChat('Premier quartier'));
    await until(()=>chat.includes('Premier quartier'));
    const occupied=first.players().find(p=>p.id===first.id);
    const identity=first.getTransferIdentity();
    first.stop({preservePresence:true});
    second=createNet({name:'En route',identity,fetcher,pollMs:15,onChat:e=>chat.push(e.text)});
    second.publish({x:5010,y:1370});assert(await second.start());
    assert.equal(second.players().length,1);
    assert.equal(second.id,first.id);
    assert.equal(second.players()[0].joinedAt,occupied.joinedAt);
    assert(second.sendChat('Deuxième quartier'));
    await until(()=>chat.includes('Deuxième quartier'));
    const rows=await DB.prepare('SELECT count(*) AS total FROM mc_events WHERE type=? AND player=?').bind('chat',first.id).first();
    assert.equal(rows.total,2);
  }finally{
    first.stop();second?.stop();
    await Promise.allSettled([...requests]);DB.close();
  }
});
