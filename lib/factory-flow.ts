import {ALL_GOODS,type Good} from './economy';
import {FACE_ORDER,SIDE} from './planet';
import {FACTORY_TILE,cellPlace,type Cell,type FactoryState} from './factory-grid';

// Two endpoints and a good index keep the short visual history inexpensive to
// persist with a successful world revision. It never drives stock or payments.
export const BIN=0, OUTPUT=1, CHAMBER=2, EXTERNAL=3;
const width=SIDE/FACTORY_TILE,area=width*width;
export const FLOW_WINDOW=12000,FLOW_LIMIT=640;
export type CargoMove=[from:number,to:number,good:number,units:number];
export type FlowBeat=[at:number,moves:CargoMove[]];
export type FlowHistory={since:number;beats:FlowBeat[]};
export const flowNode=(c:Cell,slot=BIN)=>((FACE_ORDER.indexOf(c.face)*area+c.y*width+c.x)*4)+slot;
export function nodeCell(node:number):Cell {
  const cell=Math.floor(node/4);
  return {face:FACE_ORDER[Math.floor(cell/area)],x:cell%width,y:Math.floor(cell/width)%width};
}
export function movement(moves:CargoMove[]|undefined,from:number,to:number,good:Good,units:number){
  if(moves&&units>0)moves.push([from,to,ALL_GOODS.indexOf(good),units]);
}
export function storeBeat(f:FactoryState,at:number,moves:CargoMove[]){
  const h=f.flow??={since:at-1000,beats:[]};
  h.since=Math.max(h.since,at-FLOW_WINDOW);
  while(h.beats.length&&h.beats[0][0]<=h.since)h.beats.shift();
  if(!moves.length)return;
  if(moves.length>FLOW_LIMIT){h.beats=[];h.since=at;return;}
  h.beats.push([at,moves]);
  let size=0;
  for(let i=h.beats.length-1;i>=0;i--){
    size+=h.beats[i][1].length;
    if(size>FLOW_LIMIT){h.since=Math.max(h.since,h.beats[i][0]);h.beats.splice(0,i+1);break;}
  }
}
export const currentFlow=(f:FactoryState):FlowHistory=>f.flow??{since:f.clock,beats:[]};
export function witnessedFlow(f:FactoryState,canSee:(at:ReturnType<typeof cellPlace>)=>boolean){
  const h=currentFlow(f),vis=new Map<number,boolean>();
  const sees=(key:number)=>{const cell=Math.floor(key/4);if(!vis.has(cell))vis.set(cell,canSee(cellPlace(nodeCell(key))));return vis.get(cell);};
  const beats:FlowBeat[]=[];
  for(const [at,moves] of h.beats){
    const visible=moves.filter(([from,to])=>from%4!==CHAMBER && to%4!==CHAMBER && sees(from)&&sees(to));
    if(visible.length)beats.push([at,visible]);
  }
  return {since:h.since,beats};
}
