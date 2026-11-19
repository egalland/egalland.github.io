import assert from 'node:assert/strict';
import ts from 'typescript';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';

const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'strate-flow-'));
try{
  const modules=new Set();
  async function compile(name){
    if(modules.has(name))return;modules.add(name);
    const source=await fs.readFile('lib/'+name+'.ts','utf8');
    const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
    const dependencies=[...js.matchAll(/from ['"]\.\/([^'"]+)['"]/g)].map(m=>m[1]);
    await fs.writeFile(path.join(tmp,name+'.mjs'),js.replace(/from ['"]\.\/([^'"]+)['"]/g,"from './$1.mjs'"));
    for(const dep of dependencies)await compile(dep);
  }
  const names=['frontier','world','factory-grid','factory-sim','factory-flow','cargo-playback','economy','cooperation'];
  for(const name of names)await compile(name);
  const [game,core,grid,sim,flow,graphics,econ,coop]=await Promise.all(names.map(n=>import(pathToFileURL(path.join(tmp,n+'.mjs')))));
  const base=2_000_000_000_000;
  function setup(){
    const world=core.makeWorld(base),player=core.join(world,'Atelier','op','aurore',base);
    game.ensureFrontier(world,base);
    const c=player.expedition,f=c.factory;
    const order=(a,now=base)=>sim.actFactory(world,player,a,now,()=>false);
    for(const m of grid.starterCircuit(c.home,'ferrite'))order({op:'place',kind:m.kind,cells:[m]});
    const loader=f.pieces.find(p=>p.kind==='loader'),first=f.pieces[1],furnace=f.pieces.find(p=>p.kind==='furnace'),ret=f.pieces.at(-1);
    order({op:'supply',id:loader.id,good:'ferrite',quantity:2});
    return {world,player,c,f,order,loader,first,furnace,ret};
  }
  {
    const {world,player,c,f,loader,first,furnace,ret}=setup();
    let sawIn=false,sawOut=false,sawDepot=false;
    for(let seconds=1;seconds<=32;seconds++){
      const now=base+seconds*1000;
      sim.advanceFactory(world,player,now);
      const last=f.flow.beats.find(([at])=>at===now)?.[1]??[];
      const track=graphics.cargoTrack(f.pieces,f.flow,f.clock,c.home.face);
      if(seconds===1){
        assert.equal(last.length,2);
        const pickup=graphics.cargoFrame(track,base+200).marks,hop=graphics.cargoFrame(track,base+700).marks;
        for(const marks of [pickup,hop]){assert.equal(marks.filter(m=>m.good==='ferrite').reduce((sum,m)=>sum+m.units,0),1);assert.equal(marks.filter(m=>m.inFlight).length,1);}
        assert.notDeepEqual(pickup[0].point,hop[0].point,'The parcel must actually move in world coordinates');
        assert.equal(graphics.cargoFrame(track,now).marks.filter(m=>m.node===flow.flowNode(first))[0].good,'ferrite');
        assert.equal(loader.batch,1);
      }
      if(last.some(([from,to])=>from===flow.flowNode(furnace)&&to===flow.flowNode(furnace,flow.CHAMBER))){
        sawIn=true;const entry=graphics.cargoFrame(track,now-800).marks;
        assert(entry.some(m=>m.inFlight&&m.good==='ferrite'&&m.units===2));
        assert(graphics.cargoFrame(track,now).marks.some(m=>m.chamber&&m.good==='ferrite'&&m.units===2));
      }
      if(last.some(([from,to])=>from===flow.flowNode(furnace,flow.CHAMBER)&&to===flow.flowNode(furnace,flow.OUTPUT))){
        sawOut=true;
        const before=graphics.cargoFrame(track,now-1001).marks,during=graphics.cargoFrame(track,now-800).marks;
        assert(before.some(m=>m.chamber&&m.good==='ferrite')&&!before.some(m=>m.good==='acier'));
        assert(during.some(m=>m.inFlight&&m.good==='acier')&&!during.some(m=>m.chamber&&m.good==='ferrite'));
      }
      if(last.some(([from,to])=>from===flow.flowNode(ret)&&to%4===flow.EXTERNAL))sawDepot=true;
    }
    assert(sawIn&&sawOut&&sawDepot);
    assert.equal(player.economy.refined.acier,1);assert.equal(f.produced.acier,1);
    const snapshot=JSON.stringify(f);sim.advanceFactory(world,player,base+32000);assert.equal(JSON.stringify(f),snapshot);
    console.log('PASS A paid two-ore batch moves once from stock to belt, enters the furnace, becomes exactly one plate and returns to the depot.');
  }
  {
    const {world,player,c,f,first,order}=setup();
    sim.advanceFactory(world,player,base+1000);order({op:'pause',id:first.id},base+1000);
    sim.advanceFactory(world,player,base+10000);
    const track=graphics.cargoTrack(f.pieces,f.flow,f.clock,c.home.face);
    const one=graphics.cargoFrame(track,base+3500),two=graphics.cargoFrame(track,base+7500);
    for(const frame of [one,two]){assert(!frame.active.has(flow.flowNode(first)));assert.equal(frame.marks.find(m=>m.node===flow.flowNode(first))?.good,'ferrite');}
    assert.deepEqual(one.marks.find(m=>m.node===flow.flowNode(first)),two.marks.find(m=>m.node===flow.flowNode(first)));
    assert.equal(graphics.displayClock(f.clock,base+180000,false),f.clock);
    assert.equal(graphics.displayClock(f.clock,base+10000,true),f.clock);
    console.log('PASS A blocked belt keeps its physical item. Stale and reduced-motion views show the committed stock.');
  }
  {
    const {world,player,c,f}=setup(),{x,y,face}=c.factory.pieces[0];
    const piece=(kind,dx,dy,dir)=>({id:kind+dx+dy,kind,face,x:x+dx,y:y+dy,dir,items:grid.emptyGoods(),output:grid.emptyGoods(),active:true,hull:100,placed:base,recipe:'acier',filter:'ferrite',job:null});
    const splitter=piece('splitter',4,0,1),east=piece('belt',5,0,1),south=piece('belt',4,1,2);
    f.pieces=[splitter,east,south];splitter.items.cuivre=2;
    east.items.ferrite=1;sim.advanceFactory(world,player,base+1000);
    const moves=f.flow.beats.at(-1)[1];
    assert.equal(moves.length,1);assert.deepEqual(moves[0],[flow.flowNode(splitter),flow.flowNode(south),econ.ALL_GOODS.indexOf('cuivre'),1]);
    assert.equal(flow.witnessedFlow(f,p=>p.v<grid.piecePlace(south).v).beats.length,0);
    const long={clock:base};for(let i=1;i<=16;i++)flow.storeBeat(long,base+i*1000,Array.from({length:90},()=>[0,4,0,1]));
    assert(long.flow.beats.flatMap(b=>b[1]).length<=flow.FLOW_LIMIT);assert(long.flow.since>=base+4000);
    assert.deepEqual(JSON.parse(JSON.stringify(f.flow)),f.flow);
    console.log('PASS Only the accepted splitter branch animates. Histories are bounded, survive reload and conceal unseen endpoints.');
  }
  {
    const {world,player,c}=setup(),worker=c.workers[0];
    const ore=c.deposits.map(id=>world.frontier.deposits[id]).find(n=>n.safe&&n.ore==='cuivre');
    const command={type:'society',op:'assign',ids:[worker.id],deposit:ore.id,requestId:'assign'};
    game.actFrontier(world,player,command,base);
    let lift,drop;
    for(let s=5;s<=300;s+=5){
      const now=base+s*1000;game.advanceFrontier(world,now);
      lift??=worker.handoffs?.find(h=>h.kind==='lift');
      if(lift&&!drop){assert(lift.good==='cuivre'&&lift.units===3);drop=worker.handoffs?.find(h=>h.kind==='drop');}
      if(drop)break;
    }
    assert(lift&&drop&&drop.good===lift.good&&drop.units===lift.units&&drop.at>lift.at);
    assert.deepEqual(drop.point,c.home);
    const other=core.join(world,'Voisin','other','forge',drop.at);game.ensureFrontier(world,drop.at);
    assert(!game.frontierView(world,other,drop.at).carriers.some(v=>v.id===worker.id),'Unseen human carriers must remain hidden');
    other.expedition.scout.point={...c.home};
    const seen=game.frontierView(world,other,drop.at).carriers.find(v=>v.id===worker.id);
    assert(seen&&seen.handoffs.every(h=>game.canSeePoint(other,h.point))&&!('target' in seen)&&!('trade' in seen));
    console.log('PASS Foot workers lift actual ore, carry it through their trip and unload the exact quantity at home. Other players see only local handoffs.');
  }
  {
    const {world,player,c}=setup(),worker=c.workers[0],now=base+1000;
    const cap=game.frontierView(world,player,base).me.depotCapacity;
    player.inventory.ferrite=cap-1;player.inventory.cuivre=0;worker.cargo.cuivre=3;
    worker.phase='return';worker.point={...c.home};worker.trip=null;
    coop.stepWorkers(world,player,now);
    assert.equal(worker.phase,'unload');assert.equal(worker.cargo.cuivre,2);
    assert.deepEqual(worker.handoffs.map(h=>[h.kind,h.units]),[['drop',1]]);
    coop.stepWorkers(world,player,now+1000);assert.equal(worker.handoffs.length,1);
    player.inventory.ferrite-=2;coop.stepWorkers(world,player,now+2000);
    assert.equal(worker.cargo.cuivre,0);assert.equal(c.delivered,3);
    assert.deepEqual(worker.handoffs.map(h=>h.units),[1,2]);
    console.log('PASS A full depot leaves the undelivered units on the carrier and produces no repeated drop animation.');
  }
}finally{await fs.rm(tmp,{recursive:true,force:true});}
