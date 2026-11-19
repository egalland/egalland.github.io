import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'strate-rts-'));
try{
  for(const name of ['colonies','activity-journal','release','playtester','cooperation','frontier-capacity','industry','factory-grid','factory-flow','factory-sim','frontier','frontier-geography','world','economy','logistics','research','planet','frontier-camera','wool-models','field-assets','wool-material']){
    const source=await fs.readFile('lib/'+name+'.ts','utf8');
    await fs.writeFile(path.join(temporary,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '(\.\/[^']+)'/g,"from '$1.mjs'"));
  }
  const get=name=>import(pathToFileURL(path.join(temporary,name+'.mjs')));
  const [f,g,geo,grid,sim,tech,model]=await Promise.all(['frontier','world','frontier-geography','factory-grid','factory-sim','industry','wool-models','wool-material'].map(get));
  const now=2_000_000_000_000;
  const world=g.makeWorld(now),p=g.join(world,'Operator','a','aurore',now),other=g.join(world,'Other','b','forge',now);f.ensureFrontier(world,now);
  const order=(action,at=now)=>f.actFrontier(world,p,{...action,requestId:crypto.randomUUID()},at);
  const workers=p.expedition.workers;
  assert.equal(workers.length,6);assert.equal(p.expedition.trucks.length,0);assert.equal(p.expedition.factory.pieces.length,0);assert(workers.every(v=>v.order==='idle'&&!v.trip));
  const free=JSON.stringify(p);assert.throws(()=>order({type:'truck'}),/motorisation/);assert.equal(JSON.stringify(p),free);
  assert.throws(()=>order({type:'install',deposit:p.expedition.deposits[0]}),/forage/);
  console.log('PASS Fresh camps start with six idle foot workers, no free truck or MAM, and cannot bypass vehicle or drilling research.');
  const to={...p.expedition.home,u:p.expedition.home.u+150,v:p.expedition.home.v+100};
  const ids=[workers[0].id,workers[1].id,'scout','army'];workers[0].cargo.cuivre=2;
  order({type:'rts',op:'move',ids,point:to});assert.equal(new Set([workers[0].trip.to,workers[1].trip.to,p.expedition.scout.trip.to,p.expedition.army.trip.to].map(q=>q.u+'/'+q.v)).size,4);
  const inFlight=geo.along(workers[0].trip,now+2000);order({type:'rts',op:'hold',ids},now+2000);assert.deepEqual(workers[0].point,inFlight);assert.equal(workers[0].cargo.cuivre,2);assert(workers.every(v=>!v.trip));
  const before=JSON.stringify(p);assert.throws(()=>order({type:'rts',op:'move',ids:[workers[0].id,other.expedition.workers[0].id],point:to}),/uniquement/);assert.equal(JSON.stringify(p),before);
  order({type:'rts',op:'move',ids:[workers[0].id],point:to},now+3000);const midway=geo.along(workers[0].trip,now+4000);order({type:'rts',op:'move',ids:[workers[0].id],point:p.expedition.home},now+4000);assert.deepEqual(workers[0].trip.from,midway);assert.equal(workers[0].cargo.cuivre,2);
  for(const face of ['top','bottom','north','south','east','west']){
    const point={face,u:g.DIM/2+42.381,v:g.DIM/2-68.054,depth:0};order({type:'rts',op:'move',ids:[workers[0].id],point},now+4500);
    assert.equal(workers[0].trip.to.face,face);assert.equal(workers[0].trip.to.u,g.DIM/2+42);assert.equal(workers[0].trip.to.v,g.DIM/2-68);
  }
  for(const point of [{face:'top',u:NaN,v:10},{face:'top',u:Infinity,v:0},{face:'top',u:-1,v:0},{face:'unknown',u:12,v:12}])assert.throws(()=>order({type:'rts',op:'move',ids:[workers[0].id],point}),/Lieu invalide/);
  console.log('PASS Decimal mouse destinations are accepted on every face while nonfinite or out-of-world inputs are rejected.');
  console.log('PASS Mixed RTS groups receive distinct formation positions, stop or redirect at interpolated positions, conserve cargo, and reject foreign units atomically.');
  const cap=p.expedition,anchor=grid.foundation(cap.home,5),mam={face:anchor.face,x:anchor.x-5,y:anchor.y,dir:1};
  order({type:'factory',op:'place',kind:'mam',cells:[mam]},now+5000);assert.equal(cap.factory.pieces.length,1);
  const node=world.frontier.deposits[cap.deposits.find(id=>world.frontier.deposits[id].guards===0)];
  const emptyWorker=workers[2],coins=p.coins;order({type:'society',op:'assign',ids:[emptyWorker.id],deposit:node.id},now+5000);assert.equal(p.coins,coins-4);assert.equal(emptyWorker.trip.to.u,node.point.u);
  console.log('PASS The player manually places and pays for the MAM, and assigning an empty worker starts a paid trip directly to the resource.');
  cap.factory.unlocked=['motorisation','maintenance'];
  const repair={face:anchor.face,x:anchor.x-5,y:anchor.y+5,dir:1};order({type:'factory',op:'place',kind:'repairbay',cells:[repair]},now+5000);p.economy.refined.module=2;p.coins=1000;
  order({type:'truck'},now+5000);assert.equal(cap.trucks.length,1);assert.equal(p.economy.refined.module,0);
  const truck=cap.trucks[0];order({type:'rts',op:'move',ids:[truck.id],point:to},now+5000);f.advanceFrontier(world,now+30000);assert.equal(truck.phase,'idle');assert.equal(truck.role,'standby');
  truck.contract='busy';const protectedTruck=JSON.stringify(truck);assert.throws(()=>order({type:'rts',op:'move',ids:[truck.id],point:cap.home},now+30000),/mission/);assert.equal(JSON.stringify(truck),protectedTruck);truck.contract=null;
  console.log('PASS A researched workshop spends two manufactured motors per vehicle; manual vehicle orders cannot take over contracted freight.');
  // Pedestrian trade keeps the initial economy viable without a free truck.
  const town=f.frontierView(world,p,now).cities[0];workers[3].point={...cap.home};workers[3].trip=null;workers[3].cargo=f.stock();p.inventory.cuivre=30;
  const credit=p.coins;order({type:'society',op:'trade',ids:[workers[3].id],city:town.id,ore:'cuivre'},now+30000);
  const coop=await get('cooperation');coop.stepWorkers(world,p,now+35000);assert(workers[3].trip);assert.equal(workers[3].cargo.cuivre,3);assert.equal(p.coins,credit-4);assert.equal(cap.stores[town.id]?.cuivre??0,0);
  const due=workers[3].trip.due;coop.stepWorkers(world,p,due);assert.equal(cap.stores[town.id].cuivre,3);assert.equal(workers[3].cargo.cuivre,0);assert.equal(p.coins,credit-4);
  order({type:'townSell',city:town.id,good:'cuivre',quantity:3},due);assert(p.coins>credit-4);
  console.log('PASS Foot trade loads finite ore, travels to the known town, deposits once and only earns credits after a real arrival and sale.');
  assert.equal(tech.INDUSTRY_TREE.length,22);assert.equal(new Set(tech.INDUSTRY_TREE.map(n=>n.id)).size,22);
  const acquired=new Set();for(const n of tech.INDUSTRY_TREE){assert(n.requires.every(id=>acquired.has(id)),n.id+' must be reachable');acquired.add(n.id);}
  assert(tech.INDUSTRY_TREE.reduce((s,n)=>s+n.seconds,0)>2*86400);
  cap.factory.unlocked=['fonderie-2','presse-2','electronique-2','convoyeurs-3','industrie-5'];assert.equal(tech.beltCapacity(cap.factory),4);assert.equal(tech.industrySpeed(cap.factory),2.5);assert(tech.recipeSeconds(cap.factory,20,'furnace')<tech.recipeSeconds(cap.factory,20));
  cap.factory.research={id:'industrie-4',start:now,ready:now+12*3600000};sim.advanceFactory(world,p,now+13*3600000);assert(cap.factory.unlocked.includes('industrie-4'));
  console.log('PASS All 22 technologies are reachable by one player, span multiple days of research, change actual production rules and finish long timers after an offline return.');
  const project=yaw=>q=>({x:(q.u*Math.cos(yaw)-q.v*Math.sin(yaw))*5,y:(q.u*Math.sin(yaw)+q.v*Math.cos(yaw))*.74*5});
  function trace(kind,yaw,time,running,reduced=false){const out=[],ctx={beginPath(){},moveTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));out.push(['M',+x.toFixed(3),+y.toFixed(3)]);},lineTo(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));out.push(['L',+x.toFixed(3),+y.toFixed(3)]);},closePath(){},save(){},restore(){},fill(){out.push(this.fillStyle)},stroke(){}};model.drawWoolModel(ctx,{kind,point:{face:'top',u:0,v:0,depth:0},running,heading:.5,cargoColor:'#cf8c59'},project(yaw),5,time,reduced);return JSON.stringify(out);}
  for(const kind of ['worker','army','truck','belt','furnace','press','wiremill','assembler','rig','base','mam','warehouse','lab','barracks','repairbay']){
    const views=new Set([0,.7,1.57,3.14,4.7].map(yaw=>trace(kind,yaw,1000,true)));assert.equal(views.size,5);
    assert.equal(trace(kind,.7,1000,false),trace(kind,.7,2000,false));assert.equal(trace(kind,.7,1000,true,true),trace(kind,.7,2000,true,true));
  }
  for(const kind of ['worker','truck','belt','press','wiremill','assembler','rig'])assert.notEqual(trace(kind,.7,1000,true),trace(kind,.7,1300,true));
  console.log('PASS Volumetric model faces project correctly across five camera orientations; idle structures and reduced-motion freeze while active articulated parts animate.');
}finally{await fs.rm(temporary,{recursive:true,force:true});}
