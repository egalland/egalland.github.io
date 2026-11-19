import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'strate-coop-'));
try{
 const names=['colonies','activity-journal','release','playtester','cooperation','frontier-capacity','frontier-camera','industry','factory-grid','factory-flow','factory-sim','frontier','frontier-geography','world','world-store','economy','logistics','research','planet'];
 for(const name of names){const src=await fs.readFile('lib/'+name+'.ts','utf8');await fs.writeFile(path.join(dir,name+'.mjs'),ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '(\.\/[^']+)'/g,"from '$1.mjs'"));}
 const get=name=>import(pathToFileURL(path.join(dir,name+'.mjs')));
 const [f,g,coop,geo,grid,capacity,store,camera]=await Promise.all(['frontier','world','cooperation','frontier-geography','factory-grid','frontier-capacity','world-store','frontier-camera'].map(get));
 const initial=2_000_000_000_000;
 function setup(){
  const world=g.makeWorld(initial),a=g.join(world,'Client','a','aurore',initial),b=g.join(world,'Carrier','b','forge',initial),c=g.join(world,'Militia','c','veille',initial);
  f.ensureFrontier(world,initial);
  for(const [i,p] of [a,b,c].entries()){
   const cap=p.expedition;cap.factory.unlocked=['forage','stockage','camp-militaire','maintenance'];cap.trucks.push({id:crypto.randomUUID(),point:{...cap.home},trip:null,hull:140,phase:'idle',rig:null,city:null,cargo:f.stock(),escort:true});const m=grid.foundation(cap.home,5);cap.factory.pieces.push({id:crypto.randomUUID(),kind:'mam',face:m.face,x:m.x-5,y:m.y,dir:1,items:grid.emptyGoods(),output:grid.emptyGoods(),hull:300,active:true,recipe:'science',filter:'ferrite',job:null,placed:initial});cap.home={face:'top',u:g.DIM/2+i*240,v:g.DIM/2,depth:0};cap.scout.point={...cap.home};cap.army.point={...cap.home};p.coins=10000;
   for(const v of cap.workers){v.order='idle';v.phase='idle';v.trip=null;v.point={...cap.home};}
   for(const t of cap.trucks){t.point={...cap.home};t.role='standby';}
  }
  const d=world.frontier.deposits[a.expedition.deposits[0]];d.point={...a.expedition.home,u:a.expedition.home.u+40};d.ore='ferrite';d.guards=0;d.safe=true;d.remaining=10000;
  for(const p of [a,b,c])if(!p.expedition.deposits.includes(d.id))p.expedition.deposits.push(d.id);
  return {world,a,b,c,d};
 }
 const act=(w,p,action,now=initial)=>f.actFrontier(w,p,{...action,requestId:action.requestId??crypto.randomUUID()},now);
 const social=(w,p,op,extra={},now=initial)=>act(w,p,{type:'society',op,...extra},now);
 function advance(s,seconds){f.advanceFrontier(s.world,initial+seconds*1000);}
 {
  const s=setup(),{world,a,b,d}=s;
  assert.equal(a.expedition.workers.length,6);assert(a.expedition.factory.pieces.some(p=>p.kind==='mam'));
  d.remaining=4;const av=a.expedition.workers[0],bv=b.expedition.workers[0];
  const before=a.inventory.ferrite+b.inventory.ferrite;
  social(world,a,'assign',{ids:[av.id],deposit:d.id});social(world,b,'assign',{ids:[bv.id],deposit:d.id});
  advance(s,180);
  assert.equal(d.remaining,0);assert.equal(a.mined+b.mined,4);
  assert.equal(a.inventory.ferrite+b.inventory.ferrite-before+av.cargo.ferrite+bv.cargo.ferrite,4);
  assert(a.coins<10000&&b.coins<10000);
  const state=JSON.stringify(a);assert.throws(()=>social(world,a,'assign',{ids:[bv.id],deposit:d.id}),/inconnus/);assert.equal(JSON.stringify(a),state);
  const reloaded=JSON.parse(JSON.stringify(world));f.advanceFrontier(reloaded,initial+180000);assert.equal(reloaded.players[0].mined+reloaded.players[1].mined,4);
  console.log('PASS Six starter collectors make physical paid trips, share finite ore fairly without duplication, unload into the base and persist across reloads.');
 }
 {
  const s=setup(),{world,a}=s;
  social(world,a,'specialize',{skill:'extract-1'});
  assert.equal(a.inventory.ferrite,170);assert.equal(a.inventory.cuivre,50);
  assert.throws(()=>social(world,a,'specialize',{skill:'extract-3'}),/MAM|précédent/);
  advance(s,45);assert(a.expedition.talents.includes('extract-1'));assert.equal(coop.extractionFactor(a),1.2);
  const node=coop.SPECIALTIES.find(n=>n.id==='freight-1');assert.equal(coop.specialtyCost(a,node).ferrite,30);
  const mam=a.expedition.factory.pieces.find(p=>p.kind==='mam');mam.active=false;
  assert.throws(()=>social(world,a,'specialize',{skill:'freight-1'},initial+45000),/MAM/);
  console.log('PASS MAM specializations consume actual resources, enforce tiers and one analysis at a time, modify production and price a second branch explicitly.');
 }
 {
  const world=g.makeWorld(initial);f.ensureFrontier(world,initial);const later=initial+12*3600000,p=g.join(world,'Late arrival','late','aurore',later);f.ensureFrontier(world,later);f.advanceFrontier(world,later);
  assert.equal(p.mined,0);assert(p.coins>=776);assert(p.expedition.workers.every(v=>!v.trip||v.trip.start>=p.joined));
  console.log('PASS New arrivals never receive collector production or operating costs from time before their camp existed.');
 }
 {
  const s=setup(),{world,a,b,d}=s;act(world,a,{type:'install',deposit:d.id});const rig=world.frontier.rigs.find(r=>r.owner===a.id);rig.stock.ferrite=16;rig.active=false;
  social(world,b,'advertise',{kind:'haul',vehicle:b.expedition.trucks[0].id,price:70});const ad=world.frontier.cooperation.offers[0],start=a.coins+b.coins;
  social(world,a,'hire',{id:ad.id,rig:rig.id,quantity:16});assert.equal(a.coins+b.coins,start-70);assert.equal(world.frontier.cooperation.offers[0].active,false);
  const before=JSON.stringify({...world,auditPending:undefined});assert.throws(()=>social(world,s.c,'hire',{id:ad.id,rig:rig.id,quantity:16}),/disponible/);assert.equal(JSON.stringify({...world,auditPending:undefined}),before);assert.equal(world.auditPending.at(-1).category,'blocked');
  advance(s,60);assert.equal(a.coins+b.coins,start);assert.equal(world.frontier.cooperation.contracts[0].status,'done');
  console.log('PASS A specialist can advertise a priced unit; another player hires it atomically, starts real freight and cannot oversell the same offer.');
 }
 {
  const s=setup(),{world,a,b,d}=s;
  act(world,a,{type:'install',deposit:d.id});const rig=world.frontier.rigs.find(r=>r.owner===a.id);rig.stock.ferrite=16;rig.active=false;
  const coins=a.coins+b.coins,before=a.inventory.ferrite;
  social(world,a,'post',{kind:'haul',rig:rig.id,quantity:16,reward:50});const contract=world.frontier.cooperation.contracts[0];
  social(world,b,'accept',{id:contract.id,vehicle:b.expedition.trucks[0].id,requestId:'accept'});
  social(world,b,'accept',{id:contract.id,vehicle:b.expedition.trucks[0].id,requestId:'accept'});
  assert.equal(rig.stock.ferrite,0);assert.equal(contract.cargo.ferrite,16);assert.equal(a.inventory.ferrite,before);
  advance(s,60);assert.equal(contract.status,'done');assert.equal(a.inventory.ferrite,before+16);assert.equal(a.coins+b.coins,coins);
  const paid=b.coins;advance(s,120);assert.equal(b.coins,paid);
  assert.equal(coop.cooperationView(world,s.c,initial+120000).contracts[0].from,undefined);
  console.log('PASS A transport contract escrows one reward and one cargo, drives both legs before delivery, pays exactly once and hides coordinates from uninvolved players.');
 }
 {
  const s=setup(),{world,a,b,d}=s;
  act(world,a,{type:'install',deposit:d.id});const rig=world.frontier.rigs.find(r=>r.owner===a.id);rig.stock.ferrite=16;rig.active=false;
  const original=a.coins;social(world,a,'post',{kind:'haul',rig:rig.id,quantity:16,reward:50});const k=world.frontier.cooperation.contracts[0];
  social(world,b,'accept',{id:k.id,vehicle:b.expedition.trucks[0].id});advance(s,10);
  const t=b.expedition.trucks[0];assert.equal(t.cargo.ferrite,16);t.cargo.ferrite=0;s.c.expedition.army.loot.ferrite=16;
  const provider=b.coins;advance(s,40);assert.equal(k.status,'failed');assert.equal(a.coins,original);assert.equal(b.coins,provider);
  console.log('PASS Stolen freight cannot earn a delivery fee; failed contracts refund the escrow without inventing replacement ore.');
 }
 {
  const s=setup(),{world,a,b,c}=s,t=a.expedition.trucks[0];
  t.phase='return';t.trip=geo.tripTo(t.point,{...t.point,u:t.point.u+900},initial,45);
  b.expedition.army.point={...t.point};
  const total=a.coins+b.coins;social(world,a,'post',{kind:'escort',truck:t.id,reward:80});const k=world.frontier.cooperation.contracts[0];
  social(world,b,'accept',{id:k.id});assert(coop.isServiceEscort(world,b,a,t.id));
  assert(coop.serviceDefenders(world,a,t).some(p=>p.id===b.id));c.expedition.army.point={...t.point};act(world,c,{type:'attack',target:{kind:'truck',id:t.id}});advance(s,5);assert(b.damage>0);advance(s,305);
  assert.equal(k.status,'done');assert(k.protected>=240);assert.equal(a.coins+b.coins,total);
  assert.equal(b.expedition.army.order,'return');
  console.log('PASS Foreign militia physically follows the client convoy, counts real protection time, participates in defense and earns its reward only after the coverage threshold.');
 }
 {
  const {world,a,b}=setup();const start=world.frontier.cooperation.war.start;
  social(world,a,'warGive',{good:'ferrite',quantity:100});social(world,b,'warGive',{good:'ferrite',quantity:100});
  assert.throws(()=>social(world,a,'warGive',{good:'ferrite',quantity:901}),/1 000/);
  coop.settleCooperation(world,start+7*86400000);
  assert.deepEqual(new Set(world.frontier.cooperation.bonus.winners),new Set(['aurore','forge']));
  assert.equal(coop.warFactor(world,a,start+7*86400000),1.1);assert.equal(coop.warFactor(world,a,start+7*86400000-1),1);
  assert.equal(world.frontier.cooperation.war.scores.aurore,0);
  coop.settleCooperation(world,start+14*86400000);assert.equal(coop.warFactor(world,a,start+14*86400000),1);
  console.log('PASS Seven-day faction rounds consume contributions, enforce a per-player cap, share ties, reset scores and expire the production bonus.');
 }
 {
  const s=setup(),{world,a}=s,home=grid.foundation(a.expedition.home,5);
  const build=(kind,x,y)=>{act(world,a,{type:'factory',op:'place',kind,cells:[{face:home.face,x,y,dir:1}]});return a.expedition.factory.pieces.at(-1);};
  assert.throws(()=>act(world,a,{type:'train'}),/caserne/);
  const warehouse=build('warehouse',home.x+10,home.y+10);assert.equal(capacity.depotLimit(a),720);
  warehouse.items.ferrite=20;const loader=build('loader',home.x+13,home.y+11);
  const simulation=await get('factory-sim');simulation.advanceFactory(world,a,initial+5000);assert.equal(loader.items.ferrite,2);assert.equal(warehouse.items.ferrite,18);
  build('barracks',home.x+15,home.y+10);act(world,a,{type:'train'});assert.equal(a.units,4);
  build('repairbay',home.x+20,home.y+10);a.expedition.scout.hull=60;const ore=a.inventory.ferrite;advance(s,5);assert.equal(a.expedition.scout.hull,65);assert.equal(a.inventory.ferrite,ore-1);
  console.log('PASS Warehouses store local goods and increase depot capacity, barracks gate recruitment, and repair bays consume real material to heal nearby units.');
 }
 {
  class Statement{constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args;}bind(...args){return new Statement(this.db,this.sql,args);}first(){return this.db.prepare(this.sql).get(...this.args);}all(){return {results:this.db.prepare(this.sql).all(...this.args)};}run(){return {meta:this.db.prepare(this.sql).run(...this.args)};}}
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(await fs.readFile('drizzle/0001_majestic_quasar.sql','utf8'));sqlite.exec(await fs.readFile('drizzle/0002_romantic_galactus.sql','utf8'));
  const previous=JSON.stringify({players:[{name:'Old holdings'}]});sqlite.prepare('insert into voxel_worlds values(?,?,?)').run('idle-cube-001',previous,12);
  const db={prepare:sql=>new Statement(sqlite,sql),batch(items){sqlite.exec('BEGIN');try{const result=items.map(s=>s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
  await store.readWorld(db);const snapshot=await store.readWorld(db);assert.equal(snapshot.world.players.length,0);
  g.join(snapshot.world,'New start','new-token','aurore',initial);assert(await store.saveWorld(db,snapshot));
  assert.equal((await store.readWorld(db)).world.players.length,1);
  assert.equal(sqlite.prepare('select state from voxel_worlds where id=?').get('idle-cube-001').state,previous);
  assert.notEqual(store.WORLD_ID,'idle-cube-001');sqlite.close();
  assert.equal(camera.cameraSkew(4),.74);assert(Math.abs(camera.cameraRelief(4)-.08)<.001);assert(camera.MAX_ZOOM>=24);
  console.log('PASS The requested reset starts one new persistent universe while retaining the old archive; close-up projection is an aligned factory grid with a continuous planet zoom threshold.');
 }
 {
  const {world,a}=setup(),c=a.expedition,v=c.workers[0];c.talents=['freight-1','freight-2'];assert.equal(coop.workerLoad(a),7);assert.equal(coop.workerSpeed(a),12.8);c.talents.push('freight-3');assert.equal(coop.workerLoad(a),9);
  social(world,a,'tradeReserve',{ferrite:30,cuivre:24});assert.equal(c.tradeReserve.cuivre,24);assert.throws(()=>social(world,a,'tradeReserve',{ferrite:-1,cuivre:0}),/invalide/);assert.equal(c.tradeReserve.cuivre,24);
  v.cargo.cuivre=3;v.cargoSource='trade';v.phase='return';v.order='idle';v.trip=null;v.point={...c.home};const before=a.inventory.cuivre;coop.stepWorkers(world,a,initial+1000);assert.equal(a.inventory.cuivre,before+3);assert.equal(c.returnedCargo,3);assert.equal(c.delivered,3);coop.stepWorkers(world,a,initial+2000);assert.equal(c.returnedCargo,3);
  console.log('PASS Paid transport specializations scale foot capacity; trade reserves validate atomically and returned cargo is accounted once, separately from new ore.');
 }
}finally{await fs.rm(dir,{recursive:true,force:true});}
