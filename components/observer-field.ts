import type {ObserverView,ObserverMobile} from '@/lib/observatory';
import {FACTORY_KINDS,FACTORY_TILE,piecePlace} from '@/lib/factory-grid';
import {along,planetGeology,terrainHeight,type Place,type Trip} from '@/lib/frontier-geography';
import {cameraRelief,cameraSkew} from '@/lib/frontier-camera';
import {drawAnimated,drawDirectional,drawOrePatch,drawBuilding} from '@/lib/sprite-animation';
import {travelHeading} from '@/lib/wool-models';
import {drawFactoryPiece,type FactoryVisual} from './factory-render';
import {FactoryCargoLayer,drawParcel} from './cargo-render';
import {paintField,type Obstacle} from './field-terrain';
import type {MapCamera,MapHit,OrbitPin,ScreenPoint} from './observer-orbit';

export const shortName=(name:string)=>name.replace(/^\[IA\]\s*/,'');
const pretty=(n:number)=>Math.round(n).toLocaleString('fr-FR');
const colorIron='#c1d6d6',colorCopper='#f0a66f';
const orderNames:Record<string,string>={move:'Déplacement',hold:'En position',auto:'Reconnaissance',mine:'Récolte',haul:'Transport',idle:'Au repos',trade:'Commerce',pickup:'Collecte',delivery:'Livraison',return:'Retour',manual:'En route',repair:'Réparation',escort:'Escorte',patrol:'Patrouille',attack:'Assaut',city:'Marché'};
type Feature={pin:OrbitPin;kind:OrbitPin['kind']|'rig'|'camp'|'machine';detail:string;scale:number;piece?:FactoryVisual;running?:boolean;ore?:string;empty?:boolean};
type Actor={owner:string;actor:ObserverMobile;color:string;colony:string};
export function indexWorld(world:ObserverView){
  const colors=new Map(world.factions.map(f=>[f.id,f.color]));
  const owners=new Map(world.agents.map(a=>[a.id,{color:colors.get(a.faction)??'#edcb99',name:shortName(a.name)}]));
  const features:Feature[]=[],actors:Actor[]=[],pins:OrbitPin[]=[],obstacles:Obstacle[]=[];
  const full=new Map(world.focus.me?.factory.pieces.map(p=>[p.id,p])??[]);
  const add=(f:Feature,orbit=true)=>{
    features.push(f);if(orbit)pins.push(f.pin);
    if(f.kind!=='camp')obstacles.push({point:f.pin.point,kind:f.kind==='machine'?'factory':f.kind,radius:f.scale*.6});
  };
  for(const a of world.agents){
    const {color,name}=owners.get(a.id)!;
    add({kind:'base',pin:{id:a.id,kind:'base',point:a.home,owner:a.id,name,color},detail:a.profile+' · '+pretty(a.workers)+' ouvriers',scale:64});
    for(const unit of a.mobiles)if(unit.hull>0)actors.push({owner:a.id,actor:unit,color,colony:name});
    for(const p of a.pieces){
      const point=p.point,size=FACTORY_KINDS[p.kind].size;
      const piece=full.get(p.id)??{id:p.id,kind:p.kind,dir:p.dir,face:point.face,x:Math.round(point.u/FACTORY_TILE-size/2),y:Math.round(point.v/FACTORY_TILE-size/2),hull:p.active?1:0,active:p.active};
      add({kind:'machine',pin:{id:p.id,kind:'outpost',point:piecePlace(piece),owner:a.id,name:FACTORY_KINDS[p.kind].name,color},detail:name,scale:size*FACTORY_TILE,piece},false);
    }
  }
  for(const s of world.outposts){
    const owner=owners.get(s.owner);
    add({kind:'outpost',pin:{id:s.id,kind:'outpost',point:s.point,owner:s.owner,name:s.name,color:owner?.color??'#ecd395'},detail:'Avant-poste · '+(owner?.name??''),scale:36});
  }
  for(const s of world.cities)add({kind:'city',pin:{id:s.id,kind:'city',point:s.point,name:s.name,color:'#ffe0a0'},detail:'Ville de troc',scale:82});
  const nodes=new Map(world.deposits.map(d=>[d.id,d]));
  for(const d of planetGeology()){
    if(nodes.has(d.id))continue;
    const name=d.ore==='cuivre'?'Cuivre':'Fer',color=d.ore==='cuivre'?colorCopper:colorIron;
    const detail='Filon non prospecté · stock et garde inconnus';
    add({kind:'deposit',pin:{id:d.id,kind:'deposit',point:d.point,name,color,detail,surveyed:false},detail,scale:42,ore:d.ore});
  }
  for(const d of world.deposits){
    const name=d.ore==='cuivre'?'Cuivre':'Fer',color=d.ore==='cuivre'?colorCopper:colorIron;
    const detail='Filon prospecté · '+pretty(d.remaining)+' unités'+(d.guards?' · gardé':'');
    add({kind:'deposit',pin:{id:d.id,kind:'deposit',point:d.point,name,color,detail,surveyed:true},detail,scale:42,ore:d.ore,empty:d.remaining<=0});
    if(d.guards>0)add({kind:'camp',pin:{id:'monstre/'+d.id,kind:'outpost',point:{...d.point,u:d.point.u+65,v:d.point.v-35},name:'Camp hostile',color:'#ed856b'},detail:pretty(d.guards)+' points de garde',scale:26},false);
  }
  for(const r of world.rigs){
    const d=nodes.get(r.deposit),owner=owners.get(r.owner);
    add({kind:'rig',pin:{id:r.id,kind:'outpost',point:r.point,owner:r.owner,name:'Foreuse',color:owner?.color??colorIron},detail:owner?.name??'',scale:29,running:r.active&&r.hull>0&&!!d&&!d.guards&&d.remaining>0&&r.stock.ferrite+r.stock.cuivre<96},false);
  }
  const roads: {trip:Pick<Trip,'from'|'to'>;color:string}[]=[];
  for(const e of world.expeditions)roads.push({trip:e.trip,color:owners.get(e.owner)?.color??'#c6dd9c'});
  for(const s of world.services)if(s.status==='active')roads.push({trip:s,color:'#e4c27a'});
  const landKey=obstacles.map(a=>a.point.face+a.point.u+','+a.point.v+'/'+a.radius).join(';');
  return {features,actors,pins,obstacles,roads,landKey};
}
type Index=ReturnType<typeof indexWorld>;
export function fieldProject(c:MapCamera,w:number,h:number){
  const co=Math.cos(c.turn),si=Math.sin(c.turn),z=c.zoom,skew=cameraSkew(z);
  return (point:Place)=>{const u=point.u-c.u,v=point.v-c.v;return {x:w*.5+(u*co-v*si)*z,y:h*.48+(u*si+v*co)*z*skew-terrainHeight(point.u,point.v)*z*cameraRelief(z)};};
}
export function fieldGround(c:MapCamera,w:number,h:number,index:Index,ctx:CanvasRenderingContext2D){
  paintField(ctx,{...c,yaw:c.turn},w,h,fieldProject(c,w,h),index.obstacles,false);
}
function marker(ctx:CanvasRenderingContext2D,p:ScreenPoint,color:string,r:number){
  ctx.fillStyle=color;ctx.strokeStyle='#142321';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
}
function label(ctx:CanvasRenderingContext2D,p:ScreenPoint,color:string,name:string){
  ctx.save();ctx.font='600 10px system-ui, sans-serif';ctx.textBaseline='middle';
  const tw=ctx.measureText(name).width;
  ctx.fillStyle='#142926e8';ctx.fillRect(p.x-tw/2-6,p.y+5,tw+12,17);
  ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(name,p.x,p.y+13);ctx.restore();
}
export function drawFieldMap(ctx:CanvasRenderingContext2D,w:number,h:number,world:ObserverView,c:MapCamera,index:Index,now:number,reduced:boolean,factoryCargo:FactoryCargoLayer,showOre:boolean){
  const project=fieldProject(c,w,h),hits:MapHit[]=[],draws:{y:number;draw:()=>void}[]=[];
  const visible=(p:ScreenPoint,size:number)=>p.x>=-size&&p.y>=-size&&p.x<=w+size&&p.y<=h+size;
  function route(trip:Pick<Trip,'from'|'to'>,color:string){
    if(trip.from.face!==c.face||trip.to.face!==c.face)return;
    const a=project(trip.from),b=project(trip.to);
    ctx.save();ctx.lineWidth=1;ctx.globalAlpha=.72;ctx.strokeStyle=color;ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
  }
  for(const r of index.roads)route(r.trip,r.color);
  for(const a of index.actors)if(a.actor.trip&&a.actor.trip.due>now)route(a.actor.trip,a.color);
  factoryCargo.prepare(world.focus,c.face,now,reduced,c.zoom);
  for(const f of index.features){
    const pin=f.pin;if(pin.point.face!==c.face||(!showOre&&f.kind==='deposit'))continue;
    const p=project(pin.point),s=Math.min(700,f.scale*c.zoom);
    if(!visible(p,s))continue;
    draws.push({y:p.y,draw:()=>{
      if(c.zoom<.48){marker(ctx,p,pin.color,f.kind==='base'?4:2);}
      else if(f.kind==='machine'&&f.piece){drawFactoryPiece(ctx,f.piece,project,c.zoom,false,now,reduced,true,factoryCargo.moving(f.piece));}
      else if(f.kind==='deposit'){if(f.empty)marker(ctx,p,'#7d796e',3);else if(!drawOrePatch(ctx,f.ore??'ferrite',p.x,p.y,s))marker(ctx,p,pin.color,4);}
      else if(f.kind==='outpost'){drawBuilding(ctx,'warehouse',p.x,p.y,s);}
      else if(!drawAnimated(ctx,f.kind==='city'?'city':f.kind==='rig'?'drill':f.kind==='camp'?'monster':'depot',p.x,p.y,s,now,!!f.running,reduced)){marker(ctx,p,pin.color,5);}
      if(f.kind==='base'||f.kind==='outpost'||(f.kind==='deposit'&&c.zoom>.85)||(f.kind==='city'&&c.zoom>.8))label(ctx,p,pin.color,pin.name);
      hits.push({x:p.x,y:p.y-(c.zoom<.48?0:s*.28),radius:Math.max(6,Math.min(65,s*.42)),owner:pin.owner,place:pin.point,label:pin.name,detail:f.detail});
    }});
  }
  for(const {actor,owner,color,colony} of index.actors){
    const pos=actor.trip?along(actor.trip,now):actor.point;
    if(pos.face!==c.face)continue;
    const p=project(pos),body=(actor.kind==='truck'?18:actor.kind==='army'?13:11)*c.zoom;
    if(!visible(p,body))continue;
    draws.push({y:p.y,draw:()=>{
      const kind=actor.kind==='army'?'guard':actor.kind==='truck'?'truck':actor.cargo?'carrier':'worker';
      if(body<6)marker(ctx,p,color,2);
      else{
        const heading=travelHeading(actor.trip),running=!!actor.trip&&now<actor.trip.due;
        const squad=actor.kind==='army'?Math.min(4,world.agents.find(a=>a.id===owner)?.units??1):1;
        for(let i=0;i<squad;i++){
          const x=p.x+(i%2)*body*.46,y=p.y+Math.floor(i/2)*body*.3;
          if(!drawDirectional(ctx,kind,x,y,body,heading,now+i*53,running,reduced,c.turn))marker(ctx,{x,y},color,3);
        }
        if(actor.cargo&&c.zoom>.55){
          const sku=actor.cargoGoods.cuivre?'cuivre':'ferrite';
          drawParcel(ctx,sku,p.x+Math.cos(heading+c.turn)*body*.22,p.y-body*.37,Math.min(42,body*.48),actor.cargoGoods[sku]);
        }
      }
      const name={worker:'Ouvrier',scout:'Éclaireur',army:'Escouade',truck:'Transporteur'}[actor.kind];
      hits.push({...p,radius:Math.max(6,Math.min(45,body*.65)),owner,place:pos,label:name,detail:colony+' · '+(orderNames[actor.order]??actor.order)+(actor.cargo?' · '+pretty(actor.cargo)+' en soute':'')});
    }});
  }
  for(const e of world.expeditions){
    const pos=along(e.trip,now);if(pos.face!==c.face)continue;const p=project(pos);if(!visible(p,40))continue;
    const size=14*c.zoom;
    draws.push({y:p.y,draw:()=>{if(size<7||!drawDirectional(ctx,'carrier',p.x,p.y,size,travelHeading(e.trip),now,now<e.trip.due,reduced,c.turn))marker(ctx,p,'#cee6a5',3.5);
      hits.push({...p,radius:Math.max(8,size*.5),place:pos,owner:e.owner,label:'Expédition de colonisation'});}});
  }
  draws.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
  factoryCargo.draw(ctx,project,c.zoom,w,h);
  return hits;
}
