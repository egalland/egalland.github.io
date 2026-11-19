import {artwork} from '@/lib/field-assets';
import {GOODS,type Good,type RawGood} from '@/lib/economy';
import {cargoFrame,cargoTrack,displayClock,type CargoMark} from '@/lib/cargo-playback';
import {flowNode} from '@/lib/factory-flow';
import type {WorkerHandoff} from '@/lib/cooperation';
import type {Place} from '@/lib/frontier-geography';
import type {Face} from '@/lib/planet';
import type {FrontierView} from '@/lib/use-frontier';

const sheetOrder:Good[]=['ferrite','cuivre','acier','lingot','engrenage','cable','circuit','module','science'];
type Point={x:number;y:number};
type Project=(at:Place)=>Point;
type RawCargo={ferrite:number;cuivre:number};
export type Carrier={id:string;kind:string;point:Place;heading?:number;running?:boolean;cargo?:RawCargo;handoffs?:WorkerHandoff[]};
const raws:RawGood[]=['ferrite','cuivre'];
const HANDOFF_MS=650;

export function drawParcel(ctx:CanvasRenderingContext2D,good:Good,x:number,y:number,size:number,units=1){
  const atlas=artwork('cargo-goods');
  if(atlas){
    const col=sheetOrder.indexOf(good),w=atlas.naturalWidth/3,h=atlas.naturalHeight/3;
    ctx.drawImage(atlas,(col%3)*w,Math.floor(col/3)*h,w,h,x-size/2,y-size/2,size,size);
  }else{
    ctx.fillStyle=GOODS[good].color;ctx.strokeStyle='#243230';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x-size*.42,y);ctx.lineTo(x-size*.16,y-size*.36);ctx.lineTo(x+size*.37,y-size*.15);ctx.lineTo(x+size*.3,y+size*.3);ctx.lineTo(x-size*.22,y+size*.31);ctx.closePath();ctx.fill();ctx.stroke();
  }
  if(units>1&&size>=14){
    const text=String(units),fs=Math.min(11,Math.max(8,size*.34));
    ctx.font='bold '+fs+'px ui-monospace';ctx.textAlign='center';
    const w=ctx.measureText(text).width+4,bx=x+size*.3,by=y+size*.3;
    ctx.fillStyle='#1b302bea';ctx.fillRect(bx-w/2,by-fs*.7,w,fs+2);ctx.fillStyle='#fff1cf';ctx.fillText(text,bx,by+fs*.18);
  }
}

// An observation contains only the machines and local surface movements the
// viewer may see. Preserve the selected AI's full observation without drawing
// its goods a second time when that camp is in the player's field of vision.
export class FactoryCargoLayer{
  private snapshot?:FrontierView|null;
  private face?:Face;
  private tracks:ReturnType<typeof cargoTrack>[]=[];
  private active=new Set<number>();
  private marks:CargoMark[]=[];
  private processing=new Set<number>();
  prepare(view:FrontierView|null,face:Face,now:number,reduced:boolean,zoom:number){
    this.marks=[];this.active.clear();this.processing.clear();
    if(!view||zoom<.60)return;
    if(view!==this.snapshot||face!==this.face){
      this.snapshot=view;this.face=face;this.tracks=[];
      const me=view.me,watched=view.playtest;
      if(me)this.tracks.push(cargoTrack(me.factory.pieces,me.factory.flow,me.factory.clock,face));
      if(watched?.scene)this.tracks.push(cargoTrack(watched.scene.pieces,watched.scene.flow,watched.scene.clock??view.time,face));
      for(const other of view.foreignFlow??[]){
        if(other.owner===watched?.player)continue;
        const pieces=view.factories.filter(p=>p.owner===other.owner);
        this.tracks.push(cargoTrack(pieces,other.flow,other.clock,face));
      }
    }
    for(const track of this.tracks){
      const {marks,active}=cargoFrame(track,displayClock(track.clock,now,reduced||view.simulationBehind>12000));
      for(const key of active)this.active.add(key);
      for(const m of marks){
        if(m.processNode!==undefined)this.processing.add(m.processNode);
        if(m.chamber&&m.node!==undefined)this.processing.add(m.node-m.node%4);
      }
      this.marks.push(...marks);
    }
  }
  moving(piece:Parameters<typeof flowNode>[0]){return this.active.has(flowNode(piece));}
  working(piece:Parameters<typeof flowNode>[0]){return this.processing.has(flowNode(piece));}
  draw(ctx:CanvasRenderingContext2D,project:Project,zoom:number,w:number,h:number){
    const visible=this.marks.map(m=>({m,p:project(m.point)})).filter(({p})=>p.x>=-40&&p.x<=w+40&&p.y>=-20&&p.y<=h+100);
    visible.sort((a,b)=>a.p.y-b.p.y||Number(a.m.inFlight)-Number(b.m.inFlight));
    ctx.save();
    for(const {m,p} of visible){
      const size=Math.max(5,Math.min(82,(m.chamber?4.0:5.1)*zoom));
      const x=p.x,y=p.y-m.point.z*zoom;
      ctx.fillStyle='#1b201e50';ctx.beginPath();ctx.ellipse(x,p.y+1,size*.35,size*.15,0,0,2*Math.PI);ctx.fill();
      if(m.chamber){
        ctx.strokeStyle='#f4cb7a99';ctx.lineWidth=Math.max(1,zoom*.25);
        ctx.beginPath();ctx.ellipse(x,y+size*.25,size*.55,size*.22,0,0,2*Math.PI);ctx.stroke();
      }
      drawParcel(ctx,m.good,x,y,size,m.units);
    }
    ctx.restore();
  }
}

type VisibleHandoff=WorkerHandoff & {start:number};
export class CarrierCargoLayer{
  private last?:{at:number;time:number;generation:string;ids:Set<string>;watch?:string;face:Face};
  private transfers=new Map<string,VisibleHandoff[]>();
  observe(v:FrontierView|null,actors:Carrier[],now:number,reduced:boolean,face:Face){
    if(!v||reduced){this.transfers.clear();this.last=undefined;return;}
    for(const [id,events] of this.transfers)if(events.every(e=>now>=e.start+HANDOFF_MS))this.transfers.delete(id);
    if(this.last?.at===v.now&&this.last.generation===v.generation&&this.last.watch===v.playtest?.player&&this.last.face===face)return;
    const last=this.last;
    const currentIds=new Set(actors.filter(o=>o.kind==='worker'&&o.point.face===face).map(o=>o.id));
    if(last&&last.generation===v.generation&&last.watch===v.playtest?.player&&last.face===face&&v.now>last.at&&v.now-last.at<8000&&v.simulationBehind<10000){
      for(const o of actors){
        if(!currentIds.has(o.id)||!last.ids.has(o.id))continue;
        const fresh=o.handoffs?.filter(e=>e.at>last.time&&e.at<=v.time&&e.point.face===face)??[];
        if(!fresh.length)continue;
        const events:VisibleHandoff[]=[];
        let group=-1,key='';
        for(const e of fresh){
          const next=e.at+'/'+e.kind;
          if(next!==key){group++;key=next;}
          events.push({...e,start:now+group*HANDOFF_MS});
        }
        this.transfers.set(o.id,events);
      }
    }else this.transfers.clear();
    this.last={at:v.now,time:v.time,generation:v.generation,ids:currentIds,watch:v.playtest?.player,face};
  }
  loaded(o:Carrier){return !!(o.cargo&&(o.cargo.ferrite>0||o.cargo.cuivre>0))||this.transfers.has(o.id);}
  draw(ctx:CanvasRenderingContext2D,o:Carrier,project:Project,p:Point,body:number,zoom:number,yaw:number,now:number,reduced:boolean){
    if(!o.cargo||zoom<.6)return;
    const events=this.transfers.get(o.id)??[];
    const inventory={...o.cargo};
    const angle=(o.heading??0)+yaw,dx=Math.cos(angle),dy=Math.sin(angle);
    const truck=o.kind==='truck';
    const step=o.running&&!reduced?[0,-.015,.008,-.015][Math.floor(now/1000*7)%4]*body:0;
    const hand=truck?{x:p.x-dx*body*.17,y:p.y-body*.43-dy*body*.1}:{x:p.x+dx*body*.23,y:p.y-body*.36+dy*body*.065+step};
    const size=Math.min(74,Math.max(7,body*(truck?.46:.43)));
    for(const e of events)if(e.kind==='lift'&&now<e.start+HANDOFF_MS)inventory[e.good]=Math.max(0,inventory[e.good]-e.units);
    const held=raws.filter(g=>inventory[g]>0);
    ctx.save();
    for(const [i,g] of held.entries())drawParcel(ctx,g,hand.x+(i-(held.length-1)/2)*size*.62,hand.y-i*size*.16,size,inventory[g]);
    for(const e of events){
      if(now<e.start||now>=e.start+HANDOFF_MS)continue;
      const t=(now-e.start)/HANDOFF_MS,ease=t*t*(3-2*t),ground=project(e.point);
      const gx=ground.x+dx*zoom*2,gy=ground.y-zoom;
      const origin=e.kind==='lift'?{x:gx,y:gy}:{x:ground.x+dx*body*.23,y:ground.y-body*.36};
      const dest=e.kind==='lift'?hand:{x:gx,y:gy};
      const x=origin.x+(dest.x-origin.x)*ease,y=origin.y+(dest.y-origin.y)*ease-Math.sin(Math.PI*t)*zoom*1.7;
      drawParcel(ctx,e.good,x,y,size,e.units);
    }
    ctx.restore();
  }
}
