import {ALL_GOODS,RECIPES,type Good,type RefinedGood} from './economy';
import {BIN,OUTPUT,CHAMBER,EXTERNAL,flowNode,nodeCell,type FlowHistory} from './factory-flow';
import {FACTORY_KINDS,FACTORY_TILE,cellPlace,piecePlace,port,machine,type FactoryPiece} from './factory-grid';
import type {Place} from './frontier-geography';
import type {Face} from './planet';

export type VisiblePiece=Pick<FactoryPiece,'id'|'kind'|'face'|'x'|'y'|'dir'|'hull'>&Partial<FactoryPiece>&{visibleGoods?:Partial<Record<Good,number>>;busy?:boolean};
type Anchor=Place & {z:number};
type Leg={from:number;to:number;good:Good;units:number;start:number;end:number;via?:Anchor};
export type CargoMark={point:Anchor;good:Good;units:number;inFlight:boolean;chamber:boolean;node?:number;processNode?:number};
type Track={stations:Map<number,VisiblePiece>;anchors:Map<number,Anchor>;known:Set<number>;stock:Map<number,number>;legs:Leg[];clock:number;since:number};
const stockKey=(node:number,good:Good)=>node*ALL_GOODS.length+ALL_GOODS.indexOf(good);
const base=(node:number)=>node-node%4;
const atCell=(node:number):Anchor=>({...cellPlace(nodeCell(node)),z:1.6});
function anchor(node:number,stations:Map<number,VisiblePiece>):Anchor {
  const piece=stations.get(base(node)),slot=node%4;
  if(!piece||slot===EXTERNAL)return atCell(node);
  const center=piecePlace(piece);
  if(slot===CHAMBER)return {...center,z:FACTORY_KINDS[piece.kind].size*2.2};
  if(machine(piece)){
    const edge=cellPlace(port(piece,false,slot===BIN));
    return {...edge,u:edge.u+(edge.u-center.u)*.29,v:edge.v+(edge.v-center.v)*.29,z:slot===OUTPUT?2.8:2.1};
  }
  return {...center,z:piece.kind==='chest'||piece.kind==='warehouse'?3:1.8};
}
function put(stock:Map<number,number>,node:number,g:Good,change:number){
  const k=stockKey(node,g);stock.set(k,(stock.get(k)??0)+change);
}
export function cargoTrack(pieces:VisiblePiece[],history:FlowHistory|undefined,clock:number,face:Face):Track{
  history??={since:clock,beats:[]};
  const stations=new Map<number,VisiblePiece>(),anchors=new Map<number,Anchor>(),known=new Set<number>(),stock=new Map<number,number>();
  for(const p of pieces)if(p.face===face)stations.set(flowNode(p),p);
  const attach=(node:number)=>{if(!anchors.has(node))anchors.set(node,anchor(node,stations));return anchors.get(node)!;};
  function take(node:number,values:Partial<Record<Good,number>>|undefined){
    if(!values)return;known.add(node);attach(node);
    for(const g of ALL_GOODS)if(values[g])put(stock,node,g,values[g]!);
  }
  for(const p of stations.values()){
    take(flowNode(p),p.items??p.visibleGoods);
    if(machine(p)){
      take(flowNode(p,OUTPUT),p.output);
      if(p.items)take(flowNode(p,CHAMBER),p.job?RECIPES[p.job.recipe].inputs:{});
    }
  }
  const legs:Leg[]=[];
  for(const [at,moves] of history.beats)for(const [from,to,index,units] of moves){
    if(nodeCell(from).face!==face||!ALL_GOODS[index])continue;
    const src=stations.get(base(from)),dst=stations.get(base(to));
    if((from%4!==EXTERNAL&&!src)||(to%4!==EXTERNAL&&!dst))continue;
    if([src,dst].some(p=>p&&(p.hull<=0||p.active===false||(p.placed??0)>at||(p.flowReset??0)>=at)))continue;
    const early=from%4===EXTERNAL||to%4===EXTERNAL||from%4===CHAMBER||to%4===CHAMBER||dst?.kind==='loader';
    // Stock enters loaders and work chambers before the simultaneous belt hop
    // of that second. Never draw a just-loaded item twice on adjoining pieces.
    const start=at-1000+(early?0:src?.kind==='loader'||from%4===OUTPUT?420:0);
    const end=early?at-580:at;
    const a=attach(from);attach(to);
    let via:Anchor|undefined;
    if(dst&&machine(dst)&&to%4===BIN&&from%4!==CHAMBER){
      const center=piecePlace(dst),du=a.u-center.u,dv=a.v-center.v,edge=FACTORY_TILE*1.4;
      via={...center,u:center.u+(Math.abs(du)>=Math.abs(dv)?Math.sign(du)*edge:0),v:center.v+(Math.abs(dv)>Math.abs(du)?Math.sign(dv)*edge:0),z:2};
    }
    legs.push({from,to,good:ALL_GOODS[index],units,start,end,via});
  }
  return {stations,anchors,known,stock,legs,clock,since:history.since};
}
function between(a:Anchor,b:Anchor,t:number):Anchor{
  return {...a,u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t,z:a.z+(b.z-a.z)*t};
}
// Restore the stock at the presentation time from the latest committed stock.
// A unit leaves its stationary pile before becoming a moving sprite, and enters
// the receiving pile only on arrival. The past few seconds absorb network ticks.
export function cargoFrame(track:Track,time:number){
  const t=Math.max(track.since,Math.min(track.clock,time));
  const stock=new Map(track.stock),marks:CargoMark[]=[],active=new Set<number>();
  for(const e of track.legs){
    if(t>=e.end)continue;
    if(track.known.has(e.to))put(stock,e.to,e.good,-e.units);
    if(t<e.start){
      if(!track.known.has(e.from))continue;
      if(e.from%4===CHAMBER){
        // A completed recipe releases its product; what was inside beforehand
        // was the recipe's ingredients, not an early copy of the product.
        const recipe=RECIPES[e.good as RefinedGood];
        if(recipe)for(const [g,n] of Object.entries(recipe.inputs))put(stock,e.from,g as Good,n);
      }else put(stock,e.from,e.good,e.units);
      continue;
    }
    const f=(t-e.start)/(e.end-e.start),a=track.anchors.get(e.from)!,b=track.anchors.get(e.to)!;
    const point=e.via?(f<.65?between(a,e.via,f/.65):between(e.via,b,(f-.65)/.35)):between(a,b,f);
    if(e.from%4!==BIN||e.to%4!==BIN)point.z+=Math.sin(Math.PI*f)*1.2;
    marks.push({point,good:e.good,units:e.units,inFlight:true,chamber:false,processNode:e.from%4===CHAMBER?base(e.from):e.to%4===CHAMBER?base(e.to):undefined});
    active.add(base(e.from));active.add(base(e.to));
  }
  const lanes=new Map<number,number>();
  for(const [key,units] of stock){
    if(units<=0)continue;
    const node=Math.floor(key/ALL_GOODS.length),a=track.anchors.get(node);
    if(!a)continue;
    const lane=lanes.get(node)??0;lanes.set(node,lane+1);
    // Show several distinct goods in a buffer without hiding the next belt.
    const p=track.stations.get(base(node))!;
    const offset=(lane===0?0:lane%2?1:-1)*Math.min(2,Math.ceil(lane/2))*1.7;
    const point={...a,u:a.u+(p.dir%2?0:offset),v:a.v+(p.dir%2?offset:0)};
    marks.push({point,good:ALL_GOODS[key%ALL_GOODS.length],units,inFlight:false,chamber:node%4===CHAMBER,node});
  }
  return {marks,active};
}
export const displayClock=(clock:number,now:number,reduced:boolean)=>reduced||now-clock>12000?clock:Math.min(clock,now-7200);
