import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';

const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'strate-frontier-'));
const realNow=Date.now;
let time=2_000_000_000_000;
Date.now=()=>time;
try {
  for(const name of ['colonies','activity-journal','release','playtester','cooperation','frontier-capacity','industry','factory-grid','factory-flow','factory-sim','frontier','frontier-geography','world','world-store','economy','logistics','research','planet']){
    const source=await fs.readFile('lib/'+name+'.ts','utf8');
    const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
    await fs.writeFile(path.join(temporary,name+'.mjs'),js.replace(/from '(\.\/[^']+)'/g,"from '$1.mjs'"));
  }
  const get=name=>import(pathToFileURL(path.join(temporary,name+'.mjs')));
  const [f,g,geo,storage]=await Promise.all(['frontier','world','frontier-geography','world-store'].map(get));
  const baseTime=time;
  function setup(){
    time=baseTime;
    const w=g.makeWorld(time),a=g.join(w,'Ada','a','aurore',time),b=g.join(w,'Ben','b','forge',time);
    for(const [p,x,z] of [[a,20,20],[b,81,84]])w.planet.bases[p.id]={home:{x,y:g.DIM/32-1,z},parcels:[{x,y:g.DIM/32-1,z}]};
    f.ensureFrontier(w,time);for(const p of [a,b]){p.expedition.factory.unlocked=['forage'];p.expedition.trucks.push({id:crypto.randomUUID(),point:{...p.expedition.home},trip:null,hull:140,phase:'idle',rig:null,city:null,cargo:f.stock(),escort:true});for(const v of p.expedition.workers)v.order='idle';}
    return {w,a,b};
  }
  function act(w,p,a){return f.actFrontier(w,p,{...a,requestId:a.requestId??crypto.randomUUID()},time);}
  function advance(w,seconds){time+=seconds*1000;f.advanceFrontier(w,time);}
  const total=s=>Object.values(s).reduce((a,b)=>a+b,0);
  {
    time=baseTime;
    const w=g.makeWorld(time), a=g.join(w,'Éclaireuse','A','aurore',time), b=g.join(w,'Convoyeur','B','forge',time);
    f.ensureFrontier(w,time);
    const first=f.frontierView(w,a,time), other=f.frontierView(w,b,time);
    assert.equal(first.planetSize,4096);
    assert.equal(first.cities.length,1);
    assert.deepEqual(first.cities,other.cities);
    const distance=geo.range(first.me.home,other.me.home);
    assert(distance>=500 && distance<900);
    assert(!first.neighbors.length && !other.neighbors.length);
    act(w,b,{type:'scout'});
    advance(w,5);
    assert.deepEqual(b.expedition.scout.trip.to,first.cities[0].point);
    act(w,a,{type:'move',unit:'scout',point:other.me.home});
    advance(w,(a.expedition.scout.trip.due-time)/1000+5);
    assert(f.frontierView(w,a,time).neighbors.some(p=>p.id===b.id));
    const points=Array.from({length:128},(_,i)=>geo.scoutWaypoint(first.me.home,i+1));
    assert(points.some(p=>p.face!==first.me.home.face));
    assert(points.every(p=>p.u>=0 && p.u<g.DIM && p.v>=0 && p.v<g.DIM));
    console.log('PASS Two fresh camps share their starting market, retain fog of war, and discover each other through a physical scout trip. Automatic exploration crosses face boundaries.');
  }
  {
    const {w,a,b}=setup(),v=f.frontierView(w,a,time),other=f.frontierView(w,b,time);
    assert.equal(v.cities.length,1);
    assert(!JSON.stringify(v).includes('"token"'));
    assert(!JSON.stringify(v).includes('"account"'));
    assert.equal(v.neighbors.length,0);
    assert(v.deposits.length>0);
    assert.equal(v.me.inventory.ferrite,200);
    const remote=other.cities[0];
    if(!v.cities.some(c=>c.id===remote.id)){
      assert.throws(()=>act(w,a,{type:'ship',city:remote.id,ore:'ferrite',quantity:10}),/ville connue/);
      act(w,a,{type:'move',unit:'scout',point:remote.point});
      advance(w,(a.expedition.scout.trip.due-time)/1000+10);
      assert(f.frontierView(w,a,time).cities.some(c=>c.id===remote.id));
    }
    console.log('PASS Only the nearest town is known on spawn; actual scout travel discovers another; private accounts and bases stay hidden.');
  }
  {
    const {w,a,b}=setup();
    const d=Object.values(w.frontier.deposits).find(d=>a.expedition.deposits.includes(d.id)&&d.guards===0);
    assert(d);
    b.expedition.deposits.push(d.id);
    const before=d.remaining,ore=d.ore;
    act(w,a,{type:'install',deposit:d.id});
    act(w,b,{type:'install',deposit:d.id});
    const aBefore=a.inventory[ore],bBefore=b.inventory[ore];
    advance(w,600);
    const rigs=w.frontier.rigs;
    const produced=a.mined+b.mined;
    assert.equal(before-d.remaining,produced);
    assert(produced>100&&produced<=240);
    assert(d.remaining>10000);
    assert.equal(Object.keys(w.planet.chunks).length,0);
    assert.equal(a.inventory[ore]-aBefore+total(rigs[0].stock)+a.expedition.trucks.reduce((n,t)=>n+total(t.cargo),0),a.mined);
    assert.equal(b.inventory[ore]-bBefore+total(rigs[1].stock)+b.expedition.trucks.reduce((n,t)=>n+total(t.cargo),0),b.mined);
    const old=JSON.stringify(w);
    f.advanceFrontier(w,time);assert.equal(JSON.stringify(w),old);
    const reloaded=JSON.parse(JSON.stringify(w));f.advanceFrontier(reloaded,time);
    assert.equal(reloaded.frontier.deposits[d.id].remaining,d.remaining);
    console.log('PASS Two players exploit a shared multi-day reserve without removing terrain; staged, transported and delivered resources conserve every unit.');
  }
  {
    const {w,a}=setup(),city=f.frontierView(w,a,time).cities[0],ore='ferrite';
    act(w,a,{type:'ship',city:city.id,ore,quantity:16,escort:false,requestId:'shipment'});
    act(w,a,{type:'ship',city:city.id,ore,quantity:16,escort:false,requestId:'shipment'});
    assert.equal(a.inventory[ore],184);
    assert.throws(()=>act(w,a,{type:'townSell',city:city.id,good:ore,quantity:16}),/insuffisante/);
    advance(w,((a.expedition.trucks[0].trip?.due??time)-time)/1000+10);
    assert.equal(a.expedition.stores[city.id][ore],16);
    assert.equal(a.inventory[ore],184);
    act(w,a,{type:'townSell',city:city.id,good:ore,quantity:5});
    assert.equal(a.coins,805);
    advance(w,((a.expedition.trucks[0].trip?.due??time)-time)/1000+10);
    act(w,a,{type:'withdraw',city:city.id,ore,quantity:10});
    assert.equal(a.expedition.stores[city.id][ore],1);
    assert.equal(a.inventory[ore],184);
    assert.throws(()=>act(w,a,{type:'townSell',city:city.id,good:ore,quantity:10}),/insuffisante/);
    advance(w,((a.expedition.trucks[0].trip?.due??time)-time)/1000+10);
    assert.equal(a.inventory[ore],184);
    advance(w,((a.expedition.trucks[0].trip?.due??time)-time)/1000+10);
    assert.equal(a.inventory[ore],194);
    console.log('PASS A shipment is reserved once, reaches only its destination warehouse, and a withdrawal returns by an actual two-leg trip.');
  }
  {
    const {w,a,b}=setup(),c=b.expedition;
    const d=Object.values(w.frontier.deposits).find(d=>a.expedition.deposits.includes(d.id)&&d.guards===0);
    act(w,a,{type:'install',deposit:d.id});
    const rig=w.frontier.rigs[0];rig.stock.ferrite=20;rig.active=false;a.expedition.trucks=[];
    // Keep the defender away so this test measures the attack and loot chain.
    a.expedition.army.point={...a.expedition.home,u:Math.max(0,a.expedition.home.u-1000)};
    c.home={...d.point,u:Math.min(g.DIM-1,d.point.u+400)};c.army.point={...d.point};c.scout.point={...d.point};
    const oldCoins=b.coins,oldInventory=b.inventory.ferrite;
    act(w,b,{type:'attack',target:{kind:'rig',id:rig.id}});
    assert(b.coins<oldCoins);
    advance(w,50);
    assert.equal(rig.hull,0);assert.equal(total(c.army.loot),20);
    assert.equal(b.inventory.ferrite,oldInventory-5);
    act(w,b,{type:'return',unit:'army'});
    advance(w,(c.army.trip.due-time)/1000+10);
    assert.equal(total(c.army.loot),0);
    assert.equal(b.inventory.ferrite,oldInventory+15);
    const town=f.frontierView(w,a,time).cities[0];
    c.army.point={...town.point};a.expedition.scout.point={...town.point};
    assert.throws(()=>act(w,a,{type:'attack',target:{kind:'army',id:b.id}}),/ville neutre/);
    console.log('PASS A deployed squad can attack a rig on a deposit, consumes supply and ammunition, returns physical loot, and cannot attack in a town.');
  }
  {
    const {w,a,b}=setup();
    act(w,a,{type:'guildCreate',name:'Les fils de cuivre'});
    act(w,a,{type:'guildInvite',player:b.id});
    act(w,b,{type:'guildAccept',id:a.expedition.guild});
    b.expedition.army.point={...a.expedition.home};
    assert.throws(()=>act(w,a,{type:'attack',target:{kind:'army',id:b.id}}),/allié/);
    act(w,a,{type:'chat',text:'La route est ouverte.',guild:true});
    assert.equal(f.frontierView(w,b,time).chat.length,1);
    const q=g.join(w,'Noa','c','veille',time);f.ensureFrontier(w,time);
    assert.equal(f.frontierView(w,q,time).chat.length,0);
    act(w,a,{type:'friendRequest',player:q.id});act(w,q,{type:'friendAccept',player:a.id});
    assert(a.expedition.friends.includes(q.id));assert(q.expedition.friends.includes(a.id));
    console.log('PASS Guild invitations establish non-aggression, private radio stays in the guild and friend requests require acceptance.');
  }
  {
    const {w,a}=setup();
    const d=Object.values(w.frontier.deposits).find(d=>a.expedition.deposits.includes(d.id)&&d.guards===0);
    act(w,a,{type:'install',deposit:d.id});
    const t=a.expedition.trucks[0],rig=w.frontier.rigs[0],before=a.inventory[d.ore];
    act(w,a,{type:'truckRole',id:t.id,role:'trade'});
    advance(w,60);
    assert.equal(t.phase,'idle');assert.equal(a.inventory[d.ore],before);assert(total(rig.stock)>0);
    act(w,a,{type:'truckRole',id:t.id,role:'collect'});
    advance(w,90);
    assert(a.inventory[d.ore]>before);
    const city=f.frontierView(w,a,time).cities[0];
    assert.throws(()=>act(w,a,{type:'ship',city:city.id,ore:'ferrite',quantity:64}),/soute accepte/);
    advance(w,5*3600);
    const produced=a.mined;
    a.inventory=f.stock();rig.stock=f.stock();
    w.players[1].lastSeen=time;
    advance(w,60);
    assert.equal(a.mined,produced);
    console.log('PASS A freighter can be freed from automatic collection, cargo respects its hold, and another online player cannot extend a miner’s offline production cap.');
  }
  {
    const {w,a}=setup(),c=a.expedition;
    let guarded;
    for(let i=0;i<8&&!guarded;i++){
      c.scout.point={face:c.home.face,u:g.DIM-1500+i*150,v:g.DIM-1000,depth:0};
      advance(w,5);
      guarded=Object.values(w.frontier.deposits).find(d=>c.deposits.includes(d.id)&&d.guards>0);
    }
    assert(guarded);
    a.units=24;c.army.hull=1200;c.army.point={...guarded.point};
    act(w,a,{type:'attack',target:{kind:'camp',id:guarded.id}});
    advance(w,20);
    assert.equal(guarded.guards,0);assert(guarded.respawn>time);
    c.army.point={...c.home};c.army.trip=null;c.army.order='hold';c.scout.point={...c.home};c.scout.trip=null;
    advance(w,13*60);
    assert(guarded.guards>0);assert.equal(c.hull,500);
    assert(Object.values(w.frontier.deposits).filter(d=>geo.range(d.point,c.home)<=500).every(d=>d.guards===0));
    console.log('PASS A squad clears a remote guarded seam, its guardians later return, and the starting area stays calm without endless base waves.');
  }
  class Statement{
    constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args;}
    bind(...args){return new Statement(this.db,this.sql,args);}
    first(){return this.db.prepare(this.sql).get(...this.args);}
    all(){return {results:this.db.prepare(this.sql).all(...this.args)};}
    run(){return {meta:this.db.prepare(this.sql).run(...this.args)};}
  }
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(await fs.readFile('drizzle/0001_majestic_quasar.sql','utf8'));sqlite.exec(await fs.readFile('drizzle/0002_romantic_galactus.sql','utf8'));
  const db={prepare:sql=>new Statement(sqlite,sql),batch(items){
    sqlite.exec('BEGIN');
    try{const output=items.map(s=>s.run());sqlite.exec('COMMIT');return output;}
    catch(error){sqlite.exec('ROLLBACK');throw error;}
  }};
  globalThis.__frontierDB=db;
  const route=ts.transpileModule(await fs.readFile('scripts/fixtures/frontier-command-route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
    .replace(/import \{ env \} from 'cloudflare:workers';/,"const env={get DB(){return globalThis.__frontierDB}};")
    .replace(/from '@\/lib\/([^']+)'/g,"from './$1.mjs'");
  await fs.writeFile(path.join(temporary,'route.mjs'),route);
  const {POST}=await get('route');
  async function call(account,body){
    const result=await POST(new Request('https://test.invalid/api/frontier',{method:'POST',headers:{'content-type':'application/json',...(account?{'oai-authenticated-user-id':account}:{})},body:JSON.stringify(body)}));
    return {status:result.status,...await result.json()};
  }
  {
    time=baseTime;
    const [a,b]=await Promise.all([call('account-A',{op:'join',name:'Ada',faction:'aurore'}),call('account-B',{op:'join',name:'Ben',faction:'forge'})]);
    assert.equal(a.status,200);assert.equal(b.status,200);
    assert.notEqual(a.view.me.id,b.view.me.id);
    const blocked=await call('account-A',{op:'action',action:{type:'rts',op:'move',ids:[a.view.me.society.workers[0].id],point:{face:'top',u:-2,v:0},requestId:'blocked-destination'}});assert.equal(blocked.status,400);
    const journal=await call('account-A',{op:'journal',query:{category:'blocked'}});assert.equal(journal.status,200);assert(journal.entries.some(e=>e.summary==='Lieu invalide.'));assert.equal((await call(null,{op:'journal'})).status,401);
    assert(a.view.generation);assert.equal(a.view.players.filter(p=>p.ai).length,4);assert(a.view.playtest?.scene);
    const ground={...a.view.me.home,u:Math.min(g.DIM-1,a.view.me.home.u+93.72),v:Math.min(g.DIM-1,a.view.me.home.v+85.13)};
    const move=await call('account-A',{op:'action',action:{type:'rts',op:'move',ids:[a.view.me.society.workers[0].id],point:ground,requestId:'decimal-click'}});
    assert.equal(move.status,200);assert.equal(move.view.me.society.workers[0].trip.to.u,Math.round(ground.u));assert.equal(move.view.me.society.workers[0].trip.to.v,Math.round(ground.v));

    assert.equal(a.view.cities.length,1);
    assert.equal((await call(null,{op:'action',token:a.token,action:{type:'scout',requestId:'stolen'}})).status,401);
    const snapshot=await storage.readWorld(db),p=snapshot.world.players.find(p=>p.id===a.view.me.id),q=snapshot.world.players.find(p=>p.id===b.view.me.id);
    const city=a.view.cities[0].id;p.expedition.stores[city]=f.stock();p.expedition.stores[city].ferrite=20;
    assert(q.expedition.towns.includes(city));q.expedition.stores[city]=f.stock();
    const r=g.join(snapshot.world,'Noa','c','veille',time);r.account='account-C';f.ensureFrontier(snapshot.world,time);assert(r.expedition.towns.includes(city));r.expedition.stores[city]=f.stock();
    for(const provider of [q,r])provider.expedition.trucks.push({id:crypto.randomUUID(),point:{...provider.expedition.home},trip:null,hull:140,phase:'idle',rig:null,city:null,cargo:f.stock(),escort:true,role:'standby'});
    p.expedition.factory.unlocked=['motorisation'];p.economy.refined.module=2;const gg=await get('factory-grid'),anchor=gg.foundation(p.expedition.home,5);p.expedition.factory.pieces.push({id:'fixture-repairbay',kind:'repairbay',face:anchor.face,x:anchor.x-5,y:anchor.y-5,dir:1,items:gg.emptyGoods(),output:gg.emptyGoods(),hull:260,active:true,recipe:'science',filter:'ferrite',job:null,placed:time});
    assert(await storage.saveWorld(db,snapshot));
    const offer=await call('account-A',{op:'action',action:{type:'offerPost',city,give:'ferrite',quantity:10,want:'credits',price:30,requestId:'offer'}});
    assert.equal(offer.status,200);
    const id=offer.view.markets.find(m=>m.city===city).offers[0].id;
    const outcomes=await Promise.all(['account-B','account-C'].map(account=>call(account,{op:'action',action:{type:'offerTake',city,id,requestId:account+'-buy'}})));
    assert.deepEqual(outcomes.map(v=>v.status).sort(),[200,400]);
    const sold=await call('account-A',{op:'view'});
    assert.equal(sold.view.me.coins,830);
    const duplicate=await Promise.all([1,2].map(()=>call('account-A',{op:'action',action:{type:'truck',requestId:'one-truck'}})));
    assert(duplicate.every(v=>v.status===200));
    const final=await call('account-A',{op:'view'});
    assert.equal(final.view.me.trucks.length,1);
    assert.equal(final.view.me.coins,660);
    const grid=await get('factory-grid'),cell=grid.foundation(final.view.me.home,5);
    const mark={face:cell.face,x:cell.x+7,y:cell.y,dir:1};
    const duplicateBuild=await Promise.all([1,2].map(()=>call('account-A',{op:'action',action:{type:'factory',op:'place',kind:'belt',cells:[mark],requestId:'one-belt'}})));
    assert(duplicateBuild.every(v=>v.status===200));
    const afterBelt=await call('account-A',{op:'view'});
    assert.equal(afterBelt.view.me.factory.pieces.length,final.view.me.factory.pieces.length+1);assert.equal(afterBelt.view.me.coins,659);
    const contest=await storage.readWorld(db),pa=contest.world.players.find(p=>p.account==='account-A'),pb=contest.world.players.find(p=>p.account==='account-B');
    pb.expedition.home={...pa.expedition.home,u:pa.expedition.home.u+200};
    assert(await storage.saveWorld(db,contest));
    const contested={...mark,x:mark.x+2};
    const overlap=await Promise.all(['account-A','account-B'].map(account=>call(account,{op:'action',action:{type:'factory',op:'place',kind:'belt',cells:[contested],requestId:account+'-claim'}})));
    assert.deepEqual(overlap.map(r=>r.status).sort(),[200,400]);
    const persisted=await storage.readWorld(db);
    assert.equal(persisted.world.players.flatMap(p=>p.expedition.factory.pieces).filter(p=>p.x===contested.x&&p.y===contested.y&&p.face===contested.face).length,1);
    console.log('PASS Factory circuits survive reload, duplicate build requests charge once, and two sessions cannot build on the same tile.');
    const freightSnapshot=await storage.readWorld(db),freightClient=freightSnapshot.world.players.find(p=>p.account==='account-A');
    const deposit=freightSnapshot.world.frontier.deposits[freightClient.expedition.deposits[0]];deposit.ore='ferrite';
    freightSnapshot.world.frontier.rigs.push({id:'http-freight-rig',owner:freightClient.id,deposit:deposit.id,point:{...freightClient.expedition.home,u:freightClient.expedition.home.u+40},hull:180,stock:{ferrite:16,cuivre:0,titane:0,prisme:0},active:false});
    assert(await storage.saveWorld(db,freightSnapshot));
    const posted=await call('account-A',{op:'action',action:{type:'society',op:'post',kind:'haul',rig:'http-freight-rig',quantity:16,reward:50,requestId:'freight-post'}});
    assert.equal(posted.status,200);const contractId=posted.view.me.society.contracts[0].id;
    const providerViews=await Promise.all(['account-B','account-C'].map(account=>call(account,{op:'view'})));
    const contestedFreight=await Promise.all(['account-B','account-C'].map((account,index)=>call(account,{op:'action',action:{type:'society',op:'accept',id:contractId,vehicle:providerViews[index].view.me.trucks[0].id,requestId:account+'-freight'}})));
    assert.deepEqual(contestedFreight.map(v=>v.status).sort(),[200,400]);
    const freightFinal=await storage.readWorld(db),freightContract=freightFinal.world.frontier.cooperation.contracts.find(k=>k.id===contractId);
    assert.equal(freightContract.cargo.ferrite,16);assert.equal(freightFinal.world.frontier.rigs.find(r=>r.id==='http-freight-rig').stock.ferrite,0);
    const refused=await call('account-A',{op:'action',action:{type:'society',op:'accept',id:contractId,vehicle:posted.view.me.trucks[0].id,requestId:'own-contract'}});assert.equal(refused.status,400);
    console.log('PASS The archived command harness settles a contested service acceptance once across two providers, reserves one physical cargo and rejects self-dealing.');
    console.log('PASS The archived command harness settles a contested sale once and deduplicates simultaneous truck orders.');
  }
  sqlite.close();
} finally {
  Date.now=realNow;delete globalThis.__frontierDB;
  await fs.rm(temporary,{recursive:true,force:true});
}
