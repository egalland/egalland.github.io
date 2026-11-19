import {artwork} from '@/lib/field-assets';
import type {Place} from '@/lib/frontier-geography';
import type {MapObject} from './FrontierMap';
import type {FrontierView} from '@/lib/use-frontier';

type Effect='dust'|'steam'|'sparks'|'delivery';
type Particle={kind:Effect;point:Place;born:number;life:number;width:number;height:number;drift:number;label?:string};
type Frame={now:number;face:Place['face'];zoom:number;width:number;height:number;reduced:boolean;view:FrontierView|null;actors:MapObject[];project:(p:Place)=>{x:number;y:number}};
const atlasRow={dust:0,steam:1,sparks:2};
export const PARTICLE_LIMIT=80;

export class FieldEffects {
  private particles:Particle[]=[];
  private next=new Map<string,number>();
  private previous?:{generation:string;actor?:string;at:number;delivered:number;hull:Map<string,number>;built:Set<string>};
  private lastFrame=0;
  private face?:Place['face'];
  get count(){return this.particles.length;}
  clear(){this.particles=[];this.next.clear();this.previous=undefined;this.lastFrame=0;}

  private add(kind:Effect,point:Place,now:number,width:number,height:number,label?:string){
    if(this.particles.length>=PARTICLE_LIMIT){
      if(kind!=='delivery')return;
      const dust=this.particles.findIndex(p=>p.kind!=='delivery');if(dust<0)return;
      this.particles.splice(dust,1);
    }
    const life=kind==='delivery'?1600:kind==='sparks'?500:kind==='steam'?1450:850;
    this.particles.push({kind,point:{...point},born:now,life,width,height,drift:Math.random()-.32,label});
  }
  private snapshot(frame:Frame,visible:MapObject[]){
    const v=frame.view;
    if(!v||this.previous?.at===v.now)return;
    const previous=this.previous,me=v.me;
    const hull=new Map<string,number>(),built=new Set<string>();
    for(const o of visible){
      if(o.hull!==undefined)hull.set(o.id,o.hull);
      if(o.kind==='factory'&&o.own)built.add(o.id);
    }
    if(previous && previous.generation===v.generation && previous.actor===me?.id && v.now>previous.at && v.now-previous.at<8500 && v.simulationBehind<10000){
      const n=(me?.delivered??0)-previous.delivered;
      if(n>0&&me&&visible.some(o=>o.own&&o.kind==='base'))this.add('delivery',me.home,frame.now,0,12,'+'+n+' au dépôt');
      const target=me?.army.order==='attack'?me.army.target:null;
      for(const o of visible){
        if(o.piece&&o.own&&o.piece.placed!==undefined&&o.piece.placed>previous.at&&!previous.built.has(o.id))this.add('dust',o.point,frame.now,14,1);
        const before=previous.hull.get(o.id);
        if(before!==undefined&&o.hull!==undefined&&o.hull<before){
          this.add('sparks',o.point,frame.now,13,3);
          if(target && (o.id===target.id||o.id===target.kind+'/'+target.id) && me?.army.hull)this.add('sparks',me.army.point,frame.now,9,4);
        }
      }
    }
    this.previous={generation:v.generation,actor:me?.id,at:v.now,delivered:me?.delivered??0,hull,built};
  }
  draw(ctx:CanvasRenderingContext2D,frame:Frame){
    if(frame.reduced||frame.zoom<.55||!frame.view||frame.view.simulationBehind>10000){if(this.lastFrame)this.clear();return;}
    if(this.face!==frame.face||frame.now-this.lastFrame>3500||frame.now<this.lastFrame||this.previous&&this.previous.generation!==frame.view.generation)this.clear();
    this.face=frame.face;this.lastFrame=frame.now;
    const visible=frame.actors.filter(o=>{
      const p=frame.project(o.point);
      return p.x> -50&&p.y> -40&&p.x<frame.width+50&&p.y<frame.height+70;
    });
    this.snapshot(frame,visible);
    this.particles=this.particles.filter(p=>frame.now-p.born<p.life);
    for(const o of visible){
      if(!o.hull||!o.emission||frame.now<(this.next.get(o.id)??0))continue;
      const {kind,width,height,interval}=o.emission;
      this.next.set(o.id,frame.now+interval);
      const point={...o.point};
      if(o.kind==='truck'){point.u-=Math.cos(o.heading??0)*4;point.v-=Math.sin(o.heading??0)*4;}
      else if(o.kind==='rig'||o.piece){point.u+=1.2;point.v-=1.2;}
      this.add(kind,point,frame.now,width,height);
    }
    if(this.next.size>128)for(const [id,at] of this.next)if(at<frame.now-2000)this.next.delete(id);
    const atlas=artwork('activity-effects');
    for(const p of this.particles){
      const t=(frame.now-p.born)/p.life;
      const pos=frame.project({...p.point,u:p.point.u+p.drift*3*t,v:p.point.v+1.5*t});
      const x=pos.x,y=pos.y-frame.zoom*(p.height+t*(p.kind==='dust'?2:p.kind==='delivery'?3:6));
      ctx.save();
      if(p.kind==='delivery'){
        ctx.font='600 11px ui-monospace';ctx.textAlign='center';
        const w=ctx.measureText(p.label!).width+14;
        ctx.globalAlpha=Math.min(1,(1-t)*4);ctx.fillStyle='#173c34';ctx.fillRect(x-w/2,y-13,w,18);
        ctx.fillStyle='#d9ffdd';ctx.fillText(p.label!,x,y);ctx.restore();continue;
      }
      const width=Math.min(100,Math.max(5,p.width*frame.zoom))*(.7+.3*t);
      ctx.globalAlpha=Math.min(1,(1-t)*3)*(p.kind==='sparks'?.9:p.kind==='dust'?.6:.66);
      if(atlas){
        const sw=atlas.naturalWidth/4,sh=atlas.naturalHeight/3,col=Math.min(3,Math.floor(t*4));
        ctx.drawImage(atlas,col*sw,atlasRow[p.kind]*sh,sw,sh,x-width/2,y-width*.91,width,width);
      }else{
        ctx.fillStyle=p.kind==='sparks'?'#ffc36f':p.kind==='dust'?'#c9ae88':'#ded9cb';
        ctx.beginPath();ctx.arc(x,y,width*.09,0,2*Math.PI);ctx.fill();
      }
      ctx.restore();
    }
  }
}
