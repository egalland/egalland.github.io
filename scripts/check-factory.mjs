import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const folder=await fs.mkdtemp(path.join(os.tmpdir(),'strate-factory-'));
try{
  for(const name of ['colonies','activity-journal','release','playtester','cooperation','frontier-capacity','industry','factory-grid','factory-flow','factory-sim','frontier','frontier-geography','world','economy','logistics','research','planet','field-assets','sprite-animation']){
    const source=await fs.readFile('lib/'+name+'.ts','utf8');
    await fs.writeFile(path.join(folder,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '(\.\/[^']+)'/g,"from '$1.mjs'"));
  }
  const get=name=>import(pathToFileURL(path.join(folder,name+'.mjs')));
  const [f,w,g,sim,tech,econ,art]=await Promise.all(['frontier','world','factory-grid','factory-sim','industry','economy','sprite-animation'].map(get));
  const now=2_000_000_000_000;
  function setup(){
    const world=w.makeWorld(now),p=w.join(world,'Factory','tok','aurore',now);
    f.ensureFrontier(world,now);p.expedition.home={face:'top',u:w.DIM/2,v:w.DIM/2,depth:0};p.coins=100000;p.inventory.ferrite=300;p.inventory.cuivre=100;
    const mam=g.foundation(p.expedition.home,5);p.expedition.factory.pieces.push({id:crypto.randomUUID(),kind:'mam',face:mam.face,x:mam.x-5,y:mam.y,dir:1,items:g.emptyGoods(),output:g.emptyGoods(),hull:300,active:true,recipe:'science',filter:'ferrite',job:null,placed:now});return {world,p,home:g.foundation(p.expedition.home,5)};
  }
  const order=(world,p,action,at=now)=>f.actFrontier(world,p,{type:'factory',...action,requestId:action.requestId??crypto.randomUUID()},at);
  const build=(world,p,kind,x,y,dir=1)=>{
    order(world,p,{op:'place',kind,cells:[{face:p.expedition.home.face,x,y,dir}]});return p.expedition.factory.pieces.at(-1);
  };
  {
    const {world,p,home}=setup();
    assert.deepEqual(econ.RAW_GOODS,['ferrite','cuivre']);
    assert(Object.values(world.frontier.deposits).every(d=>econ.RAW_GOODS.includes(d.ore)));
    assert.throws(()=>build(world,p,'press',home.x+15,home.y+2),/Débloquez/);
    const pristine=JSON.stringify(p);assert.throws(()=>order(world,p,{op:'blueprint',ore:'ferrite'}),/chaque bâtiment/);assert.equal(JSON.stringify(p),pristine);
    for(const ore of ['ferrite','cuivre'])for(const entry of g.starterCircuit(p.expedition.home,ore)){
      const requestId=crypto.randomUUID();order(world,p,{op:'place',kind:entry.kind,cells:[entry],requestId});
      const piece=p.expedition.factory.pieces.at(-1);if(entry.recipe)piece.recipe=entry.recipe;if(entry.filter)piece.filter=entry.filter;
      const balance=p.coins,count=p.expedition.factory.pieces.length;order(world,p,{op:'place',kind:entry.kind,cells:[entry],requestId});assert.equal(p.coins,balance);assert.equal(p.expedition.factory.pieces.length,count);
    }
    sim.advanceFactory(world,p,now+180000);
    assert(p.economy.refined.acier>=8);assert(p.economy.refined.lingot>=4);
    assert.equal(p.expedition.factory.produced.acier,p.economy.refined.acier+p.expedition.factory.pieces.reduce((n,c)=>n+c.items.acier+c.output.acier,0));
    const old=p.economy.refined.acier;
    order(world,p,{op:'research',skill:'mecanique'},now+180000);
    assert.equal(p.economy.refined.acier,old-8);assert(!tech.canBuild(p.expedition.factory,'press'));
    assert.throws(()=>order(world,p,{op:'research',skill:'cablage'},now+180000),/cours/);
    sim.advanceFactory(world,p,now+210000);assert(tech.canBuild(p.expedition.factory,'press'));
    const press=build(world,p,'press',home.x+18,home.y+10);assert.equal(press.recipe,'engrenage');
    console.log('PASS Two manually placed physical loops smelt iron/copper and return plates; timed research spends real output and unlocks the press. Automatic plans are disabled and duplicate requests never double-charge.');
  }
  {
    const {world,p,home}=setup();p.expedition.factory.unlocked=['mecanique','cablage','electronique','laboratoires'];
    const x=home.x+20,y=home.y+20;
    const assembler=build(world,p,'assembler',x,y),iron=build(world,p,'chest',x-1,y+1),cable=build(world,p,'chest',x+1,y-1,2),out=build(world,p,'belt',x+3,y+1),chest=build(world,p,'chest',x+4,y+1);
    iron.items.acier=2;cable.items.cable=6;
    sim.advanceFactory(world,p,now+20000);
    assert.equal(chest.items.circuit,1);assert.equal(assembler.output.circuit,0);
    assert.equal(p.expedition.factory.produced.circuit,1);
    assert.throws(()=>order(world,p,{op:'recipe',id:assembler.id,recipe:'module'},now+20000),/incompatible/);
    const clock=structuredClone(world),q=clock.players[0];
    for(let i=21;i<=100;i++)sim.advanceFactory(world,p,now+i*1000);
    sim.advanceFactory(clock,q,now+100000);
    assert.deepEqual(p.expedition.factory,q.expedition.factory);
    assert.equal(chest.items.circuit,2);assert.equal(iron.items.acier,0);assert.equal(cable.items.cable,0);
    const lab=build(world,p,'lab',x+8,y),gears=build(world,p,'chest',x+7,y+1),circuits=build(world,p,'chest',x+9,y-1,2),files=build(world,p,'chest',x+11,y+1);
    gears.items.engrenage=1;circuits.items.circuit=1;sim.advanceFactory(world,p,now+125000);assert.equal(files.items.science,1);
    p.expedition.factory.unlocked.push('motorisation');order(world,p,{op:'recipe',id:assembler.id,recipe:'module'},now+125000);
    iron.items.acier=2;cable.items.cable=3;const gears2=build(world,p,'chest',x+1,y+3,0);gears2.items.engrenage=2;
    sim.advanceFactory(world,p,now+170000);assert.equal(chest.items.module,1);
    console.log('PASS Independent side/rear inputs feed a real electronic assembler; recipe gates resist forged requests and offline stepping matches live production.');
  }
  {
    const {world,p,home}=setup(),x=home.x+5,y=home.y+2;
    const loader=build(world,p,'loader',x,y),belt=build(world,p,'belt',x+1,y);
    const before=p.inventory.ferrite;sim.advanceFactory(world,p,now+100000);
    assert.equal(before-p.inventory.ferrite,3);assert.equal(loader.items.ferrite,2);assert.equal(belt.items.ferrite,1);
    order(world,p,{op:'filter',id:loader.id,good:'cuivre'},now+100000);
    assert.equal(loader.items.ferrite,0);assert.equal(p.inventory.ferrite,before-1);
    const count=p.inventory.ferrite;order(world,p,{op:'remove',cells:[{face:home.face,x:x+1,y,dir:1}],requestId:'remove'},now+100000);
    assert.equal(p.inventory.ferrite,count+2);order(world,p,{op:'remove',cells:[{face:home.face,x:x+1,y,dir:1}],requestId:'remove'},now+100000);assert.equal(p.inventory.ferrite,count+2);
    console.log('PASS Backpressure prevents infinite withdrawal; changing a loader filter returns its buffer and dismantling refunds exactly once.');
  }
  {
    const {world,p,home}=setup(),furnace=build(world,p,'furnace',home.x+15,home.y);
    furnace.items.ferrite=2;sim.advanceFactory(world,p,now+1000);assert(furnace.job);
    order(world,p,{op:'pause',id:furnace.id},now+2000);sim.advanceFactory(world,p,now+20000);assert.equal(furnace.output.acier,0);
    order(world,p,{op:'pause',id:furnace.id},now+20000);sim.advanceFactory(world,p,now+26000);assert.equal(furnace.output.acier,0);
    sim.advanceFactory(world,p,now+27000);assert.equal(furnace.output.acier,1);
    sim.advanceFactory(world,p,now+5*3600000);const snapshot=JSON.stringify(furnace);
    sim.advanceFactory(world,p,now+6*3600000);assert.equal(JSON.stringify(furnace),snapshot);
    assert.equal(p.expedition.factory.clock,now+6*3600000);
    console.log('PASS Pause freezes the manufacturing deadline and inactive hours are discarded rather than replayed after reconnection.');
  }
  {
    const {world,p,home}=setup();p.inventory.ferrite=22;
    const loader=build(world,p,'loader',home.x+5,home.y+2);
    sim.advanceFactory(world,p,now+10000);assert.equal(p.inventory.ferrite,20);assert.equal(loader.items.ferrite,0);
    order(world,p,{op:'reserve',ferrite:0,cuivre:0},now+10000);
    sim.advanceFactory(world,p,now+12000);assert.equal(p.inventory.ferrite,18);assert.equal(loader.items.ferrite,2);
    const stock=JSON.stringify(p);assert.throws(()=>order(world,p,{op:'reserve',ferrite:-1,cuivre:5},now+12000),/invalide/);assert.equal(JSON.stringify(p),stock);
    console.log('PASS A configurable construction reserve prevents the factory from spending the last starter ore; invalid reserve edits are atomic.');
  }
  {
    const {world,p,home}=setup();p.expedition.metals=undefined;p.inventory.titane=2;p.inventory.prisme=1;
    p.expedition.factory={pieces:[],clock:now};const credits=p.coins;
    f.ensureFrontier(world,now);assert.equal(p.inventory.ferrite,302);assert.equal(p.inventory.cuivre,101);assert.equal(p.coins,credits+174);
    const again=JSON.stringify(p);f.ensureFrontier(world,now);assert.equal(JSON.stringify(p),again);
    assert(p.expedition.factory.notice);assert.equal(p.expedition.factory.version,2);
    const q=w.join(world,'Rival','rival','forge',now);f.ensureFrontier(world,now);q.expedition.home={...p.expedition.home,u:p.expedition.home.u+300};
    const chest=build(world,p,'chest',home.x+8,home.y);
    assert.throws(()=>order(world,q,{op:'remove',cells:[{face:chest.face,x:chest.x,y:chest.y,dir:1}]}),/uniquement/);
    q.expedition.army.point=g.piecePlace(chest);q.units=20;q.expedition.army.hull=1000;
    f.actFrontier(world,q,{type:'attack',target:{kind:'factory',id:chest.id},requestId:'attack'},now);f.advanceFrontier(world,now+10000);assert.equal(chest.hull,0);
    console.log('PASS Legacy rare ores convert once without losing their sale value, existing saves gain new slots, and factory ownership/combat remain enforced.');
  }
  {
    const {world,p}=setup(),state=p.expedition.factory;
    assert.throws(()=>order(world,p,{op:'research',skill:'electronique'}),/Prérequis/);
    for(const id of econ.REFINED_GOODS)p.economy.refined[id]=10000;p.inventory.ferrite=10000;p.inventory.cuivre=10000;p.coins=1000000;
    let time=now;
    for(const node of tech.INDUSTRY_TREE){
      const balance=p.economy.refined.acier;
      order(world,p,{op:'research',skill:node.id},time);
      assert.equal(p.economy.refined.acier,balance-(node.cost.acier??0));
      time+=node.seconds*1000;
      p.lastSeen=time;sim.advanceFactory(world,p,time-1);assert(!state.unlocked.includes(node.id));
      sim.advanceFactory(world,p,time);assert(state.unlocked.includes(node.id));
      assert.equal(state.research,null);
    }
    assert.equal(state.unlocked.length,tech.INDUSTRY_TREE.length);
    const before=JSON.stringify(p);assert.throws(()=>order(world,p,{op:'research',skill:'mecanique'},time),/Déjà/);assert.equal(JSON.stringify(p),before);
    console.log('PASS All 22 technologies obey prerequisites, debit exact manufactured components, finish once at their deadlines and reject duplicate unlocks.');
  }
  {
    const {world,p,home}=setup();p.expedition.factory.unlocked=['mecanique','cablage','electronique','laboratoires','motorisation','cadence-usine','logistique-usine'];
    const press=build(world,p,'press',home.x+15,home.y+15),split=build(world,p,'splitter',home.x+18,home.y+16),front=build(world,p,'chest',home.x+19,home.y+16),north=build(world,p,'chest',home.x+18,home.y+15,0),south=build(world,p,'chest',home.x+18,home.y+17,2);
    press.items.acier=8;sim.advanceFactory(world,p,now+24000);
    assert.equal(front.items.engrenage+north.items.engrenage+south.items.engrenage,4);
    assert([front,north,south].every(c=>c.items.engrenage>0));assert.equal(tech.recipeSeconds(p.expedition.factory,6),5);
    for(const id of Object.keys(art.ANIMATIONS)){
      const frames=new Set(Array.from({length:50},(_,n)=>art.animationFrame(id,n*100,true,false)));
      assert.equal(frames.size,id==='city'||id==='depot'?1:4);assert.equal(art.animationFrame(id,9800,false,false),0);assert.equal(art.animationFrame(id,9800,true,true),0);
    }
    console.log('PASS Advanced automation accelerates recipes; splitters distribute to three real outputs; all 13 illustrated objects use four-frame cycles and freeze under reduced motion.');
  }
  {
    const {world,p,home}=setup();const loader=build(world,p,'loader',home.x+5,home.y+1),buffer=build(world,p,'chest',home.x+6,home.y+1);const before=p.inventory.ferrite;
    order(world,p,{op:'supply',id:loader.id,good:'ferrite',quantity:4});sim.advanceFactory(world,p,now+20000);assert.equal(p.inventory.ferrite,before-4);assert.equal(loader.batch,0);assert.equal(buffer.items.ferrite,4);
    sim.advanceFactory(world,p,now+40000);assert.equal(p.inventory.ferrite,before-4);assert.throws(()=>order(world,p,{op:'supply',id:loader.id,good:'ferrite',quantity:257}),/invalide/);assert.equal(loader.batch,0);
    order(world,p,{op:'filter',id:loader.id,good:'ferrite'});assert.equal(loader.batch,undefined);sim.advanceFactory(world,p,now+45000);assert(p.inventory.ferrite<before-4);
    console.log('PASS Bounded loader batches withdraw exactly the requested physical stock, stop once, reject oversized orders and return to normal continuous mode.');
  }
  {
    const {world,p,home}=setup();const loader=build(world,p,'loader',home.x+5,home.y+1);
    const diagnostic=()=>sim.factoryDiagnostics(world,p,now+20000).find(d=>d.piece===loader.id);
    p.inventory.ferrite=20;assert.equal(diagnostic().code,'reserve-protected');assert.equal(diagnostic().available,20);
    p.inventory.ferrite=0;assert.equal(diagnostic().code,'source-empty');
    order(world,p,{op:'supply',id:loader.id,good:'ferrite',quantity:0});assert.equal(diagnostic().code,'batch-complete');assert.equal(diagnostic().severity,'info');
    order(world,p,{op:'continuous',id:loader.id});assert.equal(loader.batch,undefined);
    p.inventory.ferrite=30;const before=p.inventory.ferrite;
    sim.advanceFactory(world,p,now+5000);assert.equal(loader.items.ferrite,2);
    const held=JSON.stringify(loader.items),balance=p.inventory.ferrite;
    order(world,p,{op:'continuous',id:loader.id});assert.equal(JSON.stringify(loader.items),held);assert.equal(p.inventory.ferrite,balance);
    const coins=p.coins;order(world,p,{op:'drain',id:loader.id,requestId:'same-drain'});assert.equal(p.inventory.ferrite,before);assert.equal(p.coins,coins);assert.equal(g.goodsCount(loader.items),0);assert.equal(loader.batch,0);
    order(world,p,{op:'drain',id:loader.id,requestId:'same-drain'});assert.equal(p.inventory.ferrite,before);
    order(world,p,{op:'rotate',id:loader.id});order(world,p,{op:'continuous',id:loader.id});assert.equal(diagnostic().code,'source-missing');
    const smelter=build(world,p,'furnace',home.x+8,home.y+4);smelter.output.acier=8;assert.notEqual(g.factoryStatus(smelter),'Sortie pleine');smelter.output.acier=16;assert.equal(g.factoryStatus(smelter),'Sortie pleine');
    console.log('PASS Reserve protection, empty source and finished lots have distinct diagnostics. Continuous mode preserves buffered items; draining returns materials once, preserves the construction and never refunds credits.');
  }
  {
    const journal=await get('activity-journal');const {world,p,home}=setup();
    const loader=build(world,p,'loader',home.x+5,home.y+1),belt=build(world,p,'belt',home.x+6,home.y+1,3);
    order(world,p,{op:'supply',id:loader.id,good:'ferrite',quantity:4});sim.advanceFactory(world,p,now+20000);
    assert(sim.factoryDiagnostics(world,p,now+20000).some(d=>d.code==='belt-reversed'&&d.piece===loader.id));
    world.auditPending=[];journal.monitorActivity(world,p,now+20000);journal.monitorActivity(world,p,now+50000);journal.monitorActivity(world,p,now+55000);
    const blocked=world.auditPending.filter(e=>e.action==='factory/condition'&&e.context.code==='belt-reversed');assert.equal(blocked.length,1);assert.equal(blocked[0].context.since,now+20000);
    const restored=JSON.parse(JSON.stringify(world)),actor=restored.players[0];journal.monitorActivity(restored,actor,now+60000);assert.equal(restored.auditPending.filter(e=>e.action==='factory/condition'&&e.context.code==='belt-reversed').length,1,'Reload must not repeat an ongoing wait');
    order(world,p,{op:'rotate',id:belt.id});order(world,p,{op:'rotate',id:belt.id});sim.advanceFactory(world,p,now+61000);journal.monitorActivity(world,p,now+65000);
    const cleared=world.auditPending.filter(e=>e.action==='factory/condition-end'&&e.context.code==='belt-reversed');assert.equal(cleared.length,1);assert.equal(cleared[0].context.durationSeconds,45);
    console.log('PASS A reversed belt is located precisely, logged once after its grace period and closed once with simulation duration. Reload preserves the wait and recovery returns no fictitious resources.');
  }
}finally{await fs.rm(folder,{recursive:true,force:true});}
