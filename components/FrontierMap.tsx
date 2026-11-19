'use client';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {Minus,Plus,Globe2,LocateFixed,RotateCcw,RotateCw} from 'lucide-react';
import {quarterTurn,cameraBearing,cameraSkew,cameraRelief,planetZoom,FACTORY_ZOOM,MAX_ZOOM} from '@/lib/frontier-camera';
import {FACE_ORDER,SIDE,facePoint,type Face} from '@/lib/planet';
import {along,terrainHeight,type Place} from '@/lib/frontier-geography';
import {FACTORY_KINDS,FACTORY_TILE,cellAt,cellPlace,piecePlace,contains,type BuildMark,type FactoryTool,type Direction} from '@/lib/factory-grid';
import {drawFactoryGrid,drawFactoryPiece,drawBuildGhost,traceCells,type FactoryVisual} from './factory-render';
import {drawOrePatch,drawDirectional,drawAnimated,drawUtility,type AnimationId} from '@/lib/sprite-animation';
import {artwork,artworkRevision} from '@/lib/field-assets';
import {fieldNames,groundType} from '@/lib/field-geology';
import {paintField,type Obstacle} from './field-terrain';
import {FieldEffects} from './field-effects';
import {FactoryCargoLayer,CarrierCargoLayer} from './cargo-render';
import type {WorkerHandoff} from '@/lib/cooperation';
import {drawWoolModel,travelHeading} from '@/lib/wool-models';
import type {FrontierView} from '@/lib/use-frontier';

type Emission={kind:'dust'|'steam'|'sparks';width:number;height:number;interval:number};
const plumes:Record<'drill'|'mining'|'truck'|'furnace'|'press'|'lab',Emission>={
  drill:{kind:'dust',width:12,height:1,interval:540},mining:{kind:'dust',width:6,height:0,interval:850},
  truck:{kind:'dust',width:7,height:.5,interval:350},furnace:{kind:'steam',width:12,height:15,interval:720},
  press:{kind:'sparks',width:8,height:5,interval:800},lab:{kind:'steam',width:6,height:10,interval:1300}
};
function machineEmission(piece:FactoryVisual,now:number):Emission|undefined{
  if(piece.hull<=0||piece.active===false||!(piece.job?piece.job.ready>=now:piece.busy))return;
  if(piece.kind==='furnace'||piece.kind==='lab')return plumes[piece.kind];
  if(['press','wiremill','assembler'].includes(piece.kind))return plumes.press;
}
export type MapObject={cargo?:{ferrite:number;cuivre:number};handoffs?:WorkerHandoff[];emission?:Emission;id:string;kind:'worker'|'factory'|'base'|'scout'|'army'|'truck'|'rig'|'deposit'|'city'|'camp';point:Place;name:string;own:boolean;hull?:number;remaining?:number;total?:number;guards?:number;sprite?:number;ore?:string;piece?:FactoryVisual;animation?:AnimationId;running?:boolean;heading?:number;quantity?:number;cargoColor?:string;cargoUnits?:number};
type Camera={u:number;v:number;face:Face;zoom:number;yaw:number;pitch:number};
type Props={build:FactoryTool|null;rotation:Direction;onBuild:(cells:BuildMark[])=>void;onCancelBuild:()=>void;onRotateBuild:()=>void;view:FrontierView|null;selected:string[];mode:'select'|'move'|'attack'|'patrol';focus:Place|null;onSelect:(ids:string[])=>void;onOrder:(at:Place,object:MapObject|null,right:boolean)=>void;onFocus:(at:Place)=>void;onContextCommand:(action:'move'|'gather'|'attack'|'recall'|'stop',at:Place,object:MapObject|null)=>void};
const oreColors:Record<string,string>={ferrite:'#b1b4ae',cuivre:'#df9760',titane:'#aea5dc',prisme:'#8ee1cd'};
const faceNames:Record<Face,string>={top:'Zénith',bottom:'Nadir',north:'Nord',south:'Sud',east:'Est',west:'Ouest'};
export function mapObjects(v:FrontierView|null,now:number):MapObject[] {
  if(!v)return [];
  const visibleFactories=new Set(v.factories.map(f=>f.id));
  const items:MapObject[]=[],scene=v.playtest?.scene,watchedPieces=new Set(scene?.pieces.map(piece=>piece.id)??[]);
  if(scene && v.playtest){
    const name=v.playtest.name;
    if(!v.neighbors.some(b=>b.id===v.playtest?.player))items.push({id:'ai-base',kind:'base',point:scene.home,name:name+' · camp observé',own:false,hull:500,sprite:1,animation:'depot'});
    for(const piece of scene.pieces)items.push({id:visibleFactories.has(piece.id)?piece.id:'ai/'+piece.id,kind:'factory',point:piecePlace(piece),name:name+' · '+FACTORY_KINDS[piece.kind].name,own:false,hull:piece.hull,emission:machineEmission(piece,now),piece});
    for(const worker of scene.workers)items.push({id:'ai/'+worker.id,kind:'worker',point:worker.trip?along(worker.trip,now):worker.point,name:name+' · porteur',own:false,hull:worker.hull,cargo:worker.cargo,handoffs:worker.handoffs,cargoColor:worker.cargo.cuivre?'#cf8c59':worker.cargo.ferrite?'#a2aca1':undefined,animation:'scout',sprite:4,running:!!worker.trip&&now<worker.trip.due,heading:travelHeading(worker.trip)});
  }
  if(!v.me)return items;
  const p=v.me,ownFactories=new Set(p.factory.pieces.map(piece=>piece.id));
  const diagnoses=new Map((p.factory.diagnostics??[]).map(d=>[d.piece,d]));
  const depositsById=new Map(v.deposits.map(node=>[node.id,node]));
  const mobile=(unit:{point:Place;trip:Parameters<typeof along>[0]|null})=>unit.trip?along(unit.trip,now):unit.point;
  for(const piece of [...p.factory.pieces,...v.factories.filter(piece=>!watchedPieces.has(piece.id))])items.push({id:piece.id,kind:'factory',point:piecePlace(piece),name:FACTORY_KINDS[piece.kind].name,own:ownFactories.has(piece.id),hull:piece.hull,emission:machineEmission(piece,now),piece:{...piece,diagnostic:diagnoses.get(piece.id)}});
  for(const worker of p.society.workers)items.push({id:worker.id,kind:'worker',point:mobile(worker),emission:worker.phase==='working'&&worker.order==='mine'&&worker.ready>=now?plumes.mining:undefined,name:'Collecteur · '+(worker.cargo.ferrite+worker.cargo.cuivre)+' minerai',own:true,hull:worker.hull,animation:'scout',running:!!worker.trip&&now<worker.trip.due,heading:travelHeading(worker.trip),cargo:worker.cargo,handoffs:worker.handoffs,cargoColor:worker.cargo.cuivre?'#cf8c59':worker.cargo.ferrite?'#a2aca1':undefined,sprite:4});
  for(const worker of v.carriers??[]){
    if(worker.owner===v.playtest?.player)continue;
    items.push({id:'porter/'+worker.id,kind:'worker',point:mobile(worker),name:worker.name+' · porteur',own:false,hull:worker.hull,cargo:worker.cargo,handoffs:worker.handoffs,animation:'scout',sprite:4,running:!!worker.trip&&now<worker.trip.due,heading:travelHeading(worker.trip),cargoColor:worker.cargo.cuivre?'#cf8c59':worker.cargo.ferrite?'#a2aca1':undefined});
  }
  items.push({id:'base',kind:'base',point:p.home,name:'Votre base',own:true,hull:p.hull,sprite:1,animation:'depot',running:false},
    {id:'scout',kind:'scout',point:mobile(p.scout),name:'Éclaireur',own:true,hull:p.scout.hull,sprite:4,animation:'scout',running:!!p.scout.trip&&now<p.scout.trip.due,heading:travelHeading(p.scout.trip)},
    {id:'army',kind:'army',point:mobile(p.army),name:'Escouade · '+p.units,own:true,hull:p.army.hull,sprite:4,animation:'army',running:!!p.army.trip&&now<p.army.trip.due,heading:travelHeading(p.army.trip),quantity:p.units});
  for(const [index,t] of p.trucks.entries())items.push({id:t.id,kind:'truck',point:mobile(t),emission:t.trip&&t.trip.due>now?plumes.truck:undefined,name:t.phase==='idle'?'Au dépôt':t.phase==='city'?'Convoi marchand':t.phase==='pickup'?'Collecte':t.phase==='repair'?'Épave · secours':'Retour au dépôt',own:true,hull:t.hull,sprite:3,animation:'truck',running:!!t.trip&&now<t.trip.due,heading:travelHeading(t.trip),cargo:t.cargo,cargoColor:t.cargo.cuivre?'#cf8c59':t.cargo.ferrite?'#a2aca1':undefined});
  for(const d of v.deposits){
    items.push({id:d.id,kind:'deposit',point:d.point,name:d.remaining<=0?'Gisement épuisé':({ferrite:'Fer',cuivre:'Cuivre',titane:'Titane',prisme:'Prisme'}[d.ore]),ore:d.ore,remaining:d.remaining,total:d.total,guards:d.guards,own:false});
    if(d.guards>0)items.push({id:'camp/'+d.id,kind:'camp',point:{...d.point,u:d.point.u+65,v:d.point.v-35},name:'Camp sauvage',own:false,hull:d.guards,sprite:5,animation:'monster',running:p.army.order==='attack'&&p.army.target?.kind==='camp'&&p.army.target.id===d.id});
  }
  for(const r of v.rigs){
    const node=depositsById.get(r.deposit);
    const running=r.active&&r.hull>0&&!!node&&node.guards===0&&node.remaining>0&&(!r.stock||r.stock.ferrite+r.stock.cuivre<96)&&(r.owner!==p.id||p.hull>0);
    items.push({id:r.id,kind:'rig',point:r.point,name:r.owner===p.id?'Votre foreuse':'Foreuse adverse',own:r.owner===p.id,hull:r.hull,sprite:2,animation:'drill',running,emission:running?plumes.drill:undefined});
  }
  for(const t of v.cities)items.push({id:t.id,kind:'city',point:t.point,name:t.name,own:false,sprite:0,animation:'city',running:false});
  for(const b of v.neighbors)items.push({id:'base/'+b.id,kind:'base',point:b.point,name:b.name,own:false,hull:b.hull,sprite:1,animation:'depot',running:false});
  for(const r of v.rivals)items.push({id:r.kind+'/'+r.id,kind:r.kind,point:mobile(r),emission:r.kind==='truck'&&r.trip&&r.trip.due>now?plumes.truck:undefined,name:r.name,own:false,hull:r.hull,sprite:r.kind==='army'?4:3,animation:r.kind==='army'?'army':'truck',running:!!r.trip&&now<r.trip.due,heading:travelHeading(r.trip)});
  return items;
}
export default function FrontierMap(props:Props) {
  const host=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),latest=useRef(props);
  latest.current=props;
  const [camera,setCamera]=useState<Camera>({u:SIDE/2,v:SIDE/2,face:'top',zoom:FACTORY_ZOOM,yaw:0,pitch:.52});
  const cam=useRef(camera);cam.current=camera;
  const [illustrated,setIllustrated]=useState(true),[showGrid,setShowGrid]=useState(false);
  const gridVisible=useRef(showGrid);gridVisible.current=showGrid;
  const artMode=useRef(illustrated);artMode.current=illustrated;
  const [context,setContext]=useState<{x:number;y:number;at:Place;object:MapObject|null}|null>(null);
  const [destination,setDestination]=useState<{at:Place;until:number}|null>(null);
  useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setContext(null);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
  const [planet,setPlanet]=useState(false),[hover,setHover]=useState<MapObject|null>(null);
  const [rectangle,setRectangle]=useState<{x:number;y:number;x2:number;y2:number}|null>(null);
  const [size,setSize]=useState({w:800,h:600,dpr:1});
  const orbitZoom=planetZoom(size.w,size.h), regionZoom=orbitZoom*1.55;
  const [showEffects,setShowEffects]=useState(true),[reduceMotion,setReduceMotion]=useState(false);
  useEffect(()=>{
    try{setShowEffects(localStorage.getItem('strate-field-effects')!=='off');}catch{}
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const change=()=>setReduceMotion(media.matches);change();
    media.addEventListener('change',change);return()=>media.removeEventListener('change',change);
  },[]);
  function toggleEffects(){const next=!showEffects;setShowEffects(next);try{localStorage.setItem('strate-field-effects',next?'on':'off');}catch{}}
  const overlay=useRef({hover,rectangle,destination,showEffects,reduceMotion});
  overlay.current={hover,rectangle,destination,showEffects,reduceMotion};
  const stroke=useRef<BuildMark[]>([]),ghost=useRef<BuildMark[]>([]);

  const headings=useRef(new Map<string,number>());
  const objects=useRef<{object:MapObject;x:number;y:number;radius:number}[]>([]);
  const hitFaces=useRef<{face:Face;path:{x:number;y:number}[]}[]>([]);
  const drag=useRef<{id:number;x:number;y:number;lastX:number;lastY:number;button:number;turnX:number;select:boolean;additive:boolean;moved:boolean}|null>(null);
  const skew=useRef(0),lastTime=useRef(0);
  if(props.view&&props.view.now!==lastTime.current){lastTime.current=props.view.now;skew.current=props.view.now-Date.now();}
  useEffect(()=>{
    if(!props.focus)return;
    setCamera(c=>({...c,face:props.focus!.face,u:props.focus!.u,v:props.focus!.v,yaw:quarterTurn(c.yaw,0),zoom:c.zoom<.2?1.8:c.zoom}));
    setPlanet(false);
  },[props.focus]);
  function turn(steps:number){setCamera(c=>({...c,yaw:quarterTurn(c.yaw,steps)}));setContext(null);}
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if((e.target as HTMLElement).matches('input,textarea,select,[contenteditable=true]')||e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.key.toLowerCase()==='q'||e.key.toLowerCase()==='e'){e.preventDefault();turn(e.key.toLowerCase()==='q'?-1:1);return;}
      if(e.key===' '){e.preventDefault();const ids=latest.current.selected,selected=mapObjects(latest.current.view,Date.now()).filter(o=>ids.includes(o.id)),first=selected[0];if(first){const same=selected.filter(o=>o.point.face===first.point.face);latest.current.onFocus({...first.point,u:same.reduce((s,o)=>s+o.point.u,0)/same.length,v:same.reduce((s,o)=>s+o.point.v,0)/same.length});}return;}
      const shift={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];if(shift){e.preventDefault();const c=cam.current,dx=shift[0]*90/c.zoom,dy=shift[1]*90/(c.zoom*cameraSkew(c.zoom)),co=Math.cos(c.yaw),si=Math.sin(c.yaw);setCamera({...c,u:Math.max(0,Math.min(SIDE-1,c.u+dx*co+dy*si)),v:Math.max(0,Math.min(SIDE-1,c.v-dx*si+dy*co))});}
    };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[]);
  useEffect(()=>{
    const resize=()=>{const r=host.current!.getBoundingClientRect();setSize({w:r.width,h:r.height,dpr:Math.min(2,window.devicePixelRatio||1)});};
    const observer=new ResizeObserver(resize);observer.observe(host.current!);resize();
    return()=>observer.disconnect();
  },[]);
  function project(at:Place,c:Camera=cam.current) {
    const u=at.u-c.u,v=at.v-c.v,co=Math.cos(c.yaw),si=Math.sin(c.yaw),s=c.zoom;
    return {x:size.w*.5+(u*co-v*si)*s,y:size.h*.48+(u*si+v*co)*s*cameraSkew(c.zoom)-terrainHeight(at.u,at.v)*s*cameraRelief(c.zoom)};
  }
  function place(x:number,y:number):Place {
    const c=cam.current,dx=(x-size.w*.5)/c.zoom,co=Math.cos(c.yaw),si=Math.sin(c.yaw);
    let u=c.u,v=c.v;
    for(let i=0;i<5;i++){const dy=(y-size.h*.48+terrainHeight(u,v)*c.zoom*cameraRelief(c.zoom))/(c.zoom*cameraSkew(c.zoom));u=c.u+dx*co+dy*si;v=c.v-dx*si+dy*co;}
    return {face:c.face,u:Math.max(0,Math.min(SIDE-1,u)),v:Math.max(0,Math.min(SIDE-1,v)),depth:0};
  }
  useEffect(()=>{
    const element=canvas.current!,ctx=element.getContext('2d')!;
    const {w,h,dpr}=size;element.width=Math.round(w*dpr);element.height=Math.round(h*dpr);
    let frame=0,last=0;
    const effects=new FieldEffects(),factoryCargo=new FactoryCargoLayer(),carrierCargo=new CarrierCargoLayer();
    let priorView:FrontierView|null|undefined,obstacles:Obstacle[]=[],landmarks='';

    const terrain=document.createElement('canvas');terrain.width=element.width;terrain.height=element.height;
    const ground=terrain.getContext('2d')!;
    let terrainKey='';
    const poly=(context:CanvasRenderingContext2D,points:{x:number;y:number}[],fill:string,stroke?:string)=>{
      context.beginPath();context.moveTo(points[0].x,points[0].y);
      for(const p of points.slice(1))context.lineTo(p.x,p.y);
      context.closePath();context.fillStyle=fill;context.fill();
      if(stroke){context.strokeStyle=stroke;context.lineWidth=.6;context.stroke();}
    };
    function sprite(index:number,x:number,y:number,width:number) {
      const atlas=artwork('wool-frontier');
      if(!atlas){ctx.fillStyle='#d7b58a';ctx.beginPath();ctx.ellipse(x,y-10,width/3,width/4,0,0,Math.PI*2);ctx.fill();return;}
      const sourceWidth=atlas.width/3,sourceHeight=atlas.height/2;
      ctx.drawImage(atlas,(index%3)*sourceWidth,Math.floor(index/3)*sourceHeight,sourceWidth,sourceHeight,x-width*.5,y-width*.86,width,width);
    }
    function drawPlanet() {
      const sky=ctx.createRadialGradient(w*.43,h*.32,0,w*.5,h*.48,Math.max(w,h)*.75);
      sky.addColorStop(0,'#38443f');sky.addColorStop(.58,'#222d30');sky.addColorStop(1,'#151e24');
      ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      const c=cam.current,sy=Math.sin(c.yaw+.54),cy=Math.cos(c.yaw+.54),pitch=c.pitch,sp=Math.sin(pitch),cp=Math.cos(pitch),scale=Math.min(w*.28,Math.max(45,(h-105)*.27));
      const proj=(p:{x:number;y:number;z:number})=>{
        const x=p.x/(SIDE-1)*2-1,y=p.y/(SIDE-1)*2-1,z=p.z/(SIDE-1)*2-1;
        const rx=x*cy-z*sy,rz=x*sy+z*cy;
        return {x:w*.5+rx*scale,y:h*.47-(y*cp-rz*sp)*scale,z:y*sp+rz*cp};
      };
      const facePoints=FACE_ORDER.map(face=>({face,points:[[0,0],[SIDE-1,0],[SIDE-1,SIDE-1],[0,SIDE-1]].map(([u,v])=>proj(facePoint(face,u,v))),z:proj(facePoint(face,SIDE/2,SIDE/2)).z})).sort((a,b)=>a.z-b.z).slice(3);
      hitFaces.current=[];
      for(const f of facePoints){
        poly(ctx,f.points,'#9e8066','#e1ba85');
        const material=artwork('surface-'+f.face);
        if(material){
          const [a,b,,d]=f.points;
          ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);for(const p of f.points.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.clip();
          ctx.transform((b.x-a.x)/512,(b.y-a.y)/512,(d.x-a.x)/512,(d.y-a.y)/512,a.x,a.y);
          ctx.drawImage(material,0,0,512,512);
          ctx.fillStyle=f.face==='bottom'?'#41382d32':f.face==='north'||f.face==='west'?'#28313826':'#ffe1ab0e';ctx.fillRect(0,0,512,512);ctx.restore();
        }
        const center=f.points.reduce((a,p)=>({x:a.x+p.x/4,y:a.y+p.y/4}),{x:0,y:0});
        ctx.fillStyle='#fff1d2';ctx.font='600 11px ui-monospace';ctx.textAlign='center';ctx.fillText(faceNames[f.face].toUpperCase(),center.x,center.y);
        hitFaces.current.push({face:f.face,path:f.points});
        const home=latest.current.view?.me?.home;if(home?.face===f.face){const p=proj(facePoint(f.face,home.u,home.v));ctx.fillStyle='#f7ddb0';ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();ctx.font='10px ui-monospace';ctx.fillText('VOTRE CAMP',p.x,p.y-10);}
        for(const neighbor of latest.current.view?.neighbors??[]){
          if(neighbor.point.face!==f.face)continue;
          const p=proj(facePoint(f.face,neighbor.point.u,neighbor.point.v));
          ctx.lineWidth=1.8;ctx.strokeStyle='#f2ab87';ctx.strokeRect(p.x-3.5,p.y-3.5,7,7);
        }
        for(const city of latest.current.view?.cities??[]){
          if(city.point.face!==f.face)continue;
          const p=proj(facePoint(f.face,city.point.u,city.point.v));ctx.fillStyle='#b0e3c7';ctx.beginPath();ctx.arc(p.x,p.y,3.4,0,Math.PI*2);ctx.fill();
        }
      }
      ctx.fillStyle='#bcac99';ctx.textAlign='center';ctx.font='12px ui-monospace';ctx.fillText('6 faces · '+SIDE.toLocaleString('fr-FR')+' m par côté',w/2,h-112);
    }
    function draw(time:number) {
      frame=requestAnimationFrame(draw);
      const {hover,rectangle,destination,showEffects,reduceMotion:reduced}=overlay.current;
      if(document.hidden||time-last<(reduced?220:32))return;
      last=time;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      if(planet){drawPlanet();return;}
      const c=cam.current,v=latest.current.view;
      const current=Date.now()+skew.current;
      const items=mapObjects(v,current).filter(o=>o.point.face===c.face&&(o.hull!==0||o.kind==='factory'));
      if(v!==priorView){
        priorView=v;
        obstacles=mapObjects(v,current).filter(o=>['city','base','deposit','factory','rig','camp'].includes(o.kind)).map(o=>({point:o.point,kind:o.kind,radius:o.kind==='city'?70:o.kind==='base'?41:o.kind==='deposit'?30:o.kind==='factory'?18:22}));
        landmarks=obstacles.map(o=>o.point.face+o.point.u+','+o.point.v+','+o.radius).join('/');
      }
      const key=[c.u,c.v,c.zoom,c.yaw,c.face,w,h,artworkRevision(),landmarks,!!latest.current.build].join('/');
      if(key!==terrainKey){
        terrainKey=key;ground.setTransform(dpr,0,0,dpr,0,0);
        paintField(ground,c,w,h,p=>project(p,c),obstacles,!!latest.current.build);
      }
      ctx.drawImage(terrain,0,0,w,h);
      const me=v?.me;
      if(me){
        if(me.home.face===c.face){const p=project(me.home,c);ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,cameraSkew(c.zoom));ctx.setLineDash([5,8]);ctx.strokeStyle='#a8d2ab59';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,500*c.zoom,0,Math.PI*2);ctx.stroke();ctx.restore();}
        for(const [id,unit] of [['scout',me.scout],['army',me.army],...me.trucks.map(t=>[t.id,t] as const),...me.society.workers.map(v=>[v.id,v] as const)] as const){
          if(!latest.current.selected.includes(id as string))continue;
          if(!unit.trip||unit.trip.from.face!==c.face||unit.trip.to.face!==c.face)continue;
          const a=project(unit.trip.from,c),b=project(unit.trip.to,c);
          ctx.strokeStyle=unit===me.army?'#e9ac8277':'#99c9bb66';ctx.setLineDash([5,6]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
        }
      }
      if(v&&me)drawFactoryGrid(ctx,v,c.face,p=>project(p,c),c.zoom,{face:c.face,u:c.u,v:c.v,depth:0},Math.max(w,h)/c.zoom,!!latest.current.build||gridVisible.current);
      if(me&&c.zoom<.65&&me.factory.pieces.length){
        const pieces=me.factory.pieces.filter(p=>p.face===c.face);
        if(pieces.length){const x=Math.min(...pieces.map(p=>p.x))*FACTORY_TILE,y=Math.min(...pieces.map(p=>p.y))*FACTORY_TILE,x2=Math.max(...pieces.map(p=>p.x+FACTORY_KINDS[p.kind].size))*FACTORY_TILE,y2=Math.max(...pieces.map(p=>p.y+FACTORY_KINDS[p.kind].size))*FACTORY_TILE;
          poly(ctx,[[x,y],[x2,y],[x2,y2],[x,y2]].map(([u,v])=>project({face:c.face,u,v,depth:0},c)),'#92c1a32b','#b3dbb78c');const label=project({face:c.face,u:(x+x2)/2,v:y,depth:0},c);ctx.fillStyle='#d7efd0';ctx.font='10px ui-monospace';ctx.textAlign='center';ctx.fillText('Usine · '+pieces.length+' modules',label.x,label.y-10);
        }
      }
      objects.current=[];
      factoryCargo.prepare(v,c.face,current,reduced,c.zoom);
      carrierCargo.observe(v,items,current,reduced||c.zoom<.6,c.face);
      const ordered=items.map(o=>({o,at:project(o.point,c)})).sort((a,b)=>a.at.y-b.at.y);
      for(const {o,at} of ordered){
        if(o.running&&o.heading!==undefined)headings.current.set(o.id,o.heading);else if(headings.current.has(o.id))o.heading=headings.current.get(o.id);
        const scale=c.zoom;
        const pixels=(o.kind==='city'?160:o.kind==='deposit'?48:o.kind==='base'?48:o.kind==='army'?14:o.kind==='scout'||o.kind==='worker'?9:o.kind==='rig'?29:o.kind==='camp'?38:13)*scale;
        if(at.x< -pixels||at.x>w+pixels||at.y< -pixels||at.y>h+pixels)continue;
        const selected=latest.current.selected.includes(o.id),highlight=hover?.id===o.id;
        if(o.kind==='factory'&&o.piece){
          if(c.zoom<.6)continue;
          const fw=FACTORY_KINDS[o.piece.kind].size*FACTORY_TILE*c.zoom;
          const processing=o.piece.items?factoryCargo.working(o.piece):undefined;
          if(processing!==undefined && ['furnace','lab','assembler','wiremill','press'].includes(o.piece.kind)){
            o.emission=processing?(o.piece.kind==='furnace'?plumes.furnace:o.piece.kind==='lab'?plumes.lab:plumes.press):undefined;
          }
          drawFactoryPiece(ctx,o.piece,p=>project(p,c),c.zoom,selected||highlight,current,reduced,artMode.current,factoryCargo.moving(o.piece),processing);
          objects.current.push({object:o,x:at.x,y:at.y-fw*.15,radius:Math.max(3,fw*.5)});continue;
        }
        if(c.zoom<.15&&o.kind!=='city'&&o.kind!=='deposit'){ctx.fillStyle=o.own?'#ade3c2':'#efad94';ctx.fillRect(at.x-2,at.y-2,4,4);objects.current.push({object:o,x:at.x,y:at.y,radius:8});continue;}
        if(o.kind==='deposit'){
          const fraction=Math.min(1,Math.max(0,(o.remaining??0)/Math.max(1,o.total??1)));
          const depositWidth=(24+24*Math.sqrt(fraction))*scale;
          const radius=Math.max(7,Math.min(94,depositWidth*.50)),copper=o.ore==='cuivre';
          ctx.save();ctx.fillStyle=copper?'#6a43313d':'#354c4b40';
          ctx.strokeStyle=copper?'#efb886a6':'#c6d9d4a6';ctx.lineWidth=selected?2:1;
          ctx.beginPath();ctx.ellipse(at.x,at.y,radius,radius*.52,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
          if(fraction>0){
            if(scale<.55){
              ctx.fillStyle=copper?'#f6b57f':'#cbdadb';ctx.beginPath();
              if(copper)ctx.arc(at.x,at.y-1,4,0,Math.PI*2);else{ctx.moveTo(at.x,at.y-6);ctx.lineTo(at.x+4,at.y-1);ctx.lineTo(at.x,at.y+4);ctx.lineTo(at.x-4,at.y-1);ctx.closePath();}ctx.fill();
            }else if(!artMode.current||!drawOrePatch(ctx,o.ore??'ferrite',at.x,at.y,depositWidth)){
              drawWoolModel(ctx,{kind:'deposit',point:o.point,cargoColor:copper?'#cf8c59':'#939f92'},p=>project(p,c),c.zoom,current,reduced);
            }
          }
        }else{
          ctx.fillStyle='#2c252c35';ctx.beginPath();ctx.ellipse(at.x,at.y,pixels*.35,pixels*.14,0,0,Math.PI*2);ctx.fill();
          if(artMode.current&&['worker','scout','army','truck'].includes(o.kind)){
            if(o.kind==='army'){for(let i=0;i<Math.min(o.quantity??3,4);i++){
              const x=at.x+(i%2-.5)*pixels*.6,y=at.y+Math.floor(i/2)*pixels*.25;
              if(!drawDirectional(ctx,'guard',x,y,pixels*.9,o.heading??0,current+i*65,o.running??false,reduced,c.yaw)&&!drawAnimated(ctx,'army',x,y,pixels*.9,current,o.running,reduced))sprite(4,x,y,pixels*.9);
            }}
            else if(!drawDirectional(ctx,o.kind==='truck'?'truck':o.kind==='worker'&&carrierCargo.loaded(o)?'carrier':'worker',at.x,at.y,pixels*1.35,o.heading??0,current,o.running??false,reduced,c.yaw)&&!drawAnimated(ctx,o.animation!,at.x,at.y,pixels,current,o.running,reduced))sprite(o.sprite!,at.x,at.y,pixels);
          }else if(artMode.current&&(o.kind==='base'||o.kind==='rig')){
            if(!drawAnimated(ctx,o.animation!,at.x,at.y,pixels,current,o.running,reduced))sprite(o.sprite!,at.x,at.y,pixels);
          }
          else if(c.zoom>=.6&&['worker','scout','army','truck','rig','base'].includes(o.kind))drawWoolModel(ctx,{kind:o.kind,point:o.point,heading:o.heading,running:o.running,quantity:o.quantity,cargoColor:o.cargoColor},p=>project(p,c),c.zoom,current,reduced);
          else if(!o.animation||!drawAnimated(ctx,o.animation,at.x,at.y,pixels,current,o.running,reduced))sprite(o.sprite!,at.x,at.y,pixels);
        }
        if(o.kind==='deposit'&&(scale>=.55||selected||highlight)){
          const labelY=at.y-Math.min(58,Math.max(15,22*scale));
          ctx.font='bold 10px ui-monospace';const label=(o.ore==='cuivre'?'CUIVRE':'FER')+(o.guards?' · ⚠':'')+(o.remaining===0?' · épuisé':''),textWidth=ctx.measureText(label).width;ctx.textAlign='center';ctx.fillStyle='#20342ef2';ctx.fillRect(at.x-textWidth/2-6,labelY-12,textWidth+12,15);ctx.fillStyle=o.ore==='cuivre'?'#ffca8c':'#e6f4ee';ctx.fillText(label,at.x,labelY-1);
        }
        if(o.cargo&&(o.kind==='worker'||o.kind==='truck'))carrierCargo.draw(ctx,o,p=>project(p,c),at,pixels*1.35,c.zoom,c.yaw,current,reduced);
        if(selected||highlight){
          ctx.strokeStyle=selected?'#a6f1cd':'#ffdc9d';ctx.lineWidth=selected?2:1;ctx.beginPath();ctx.ellipse(at.x,at.y,Math.max(12,pixels*.44),Math.max(6,pixels*.19),0,0,Math.PI*2);ctx.stroke();
        }
        if(c.zoom>1.8&&(o.kind==='base'||o.kind==='rig')||selected&&(o.kind!=='worker'||latest.current.selected.length===1)||highlight||o.kind==='city'){
          ctx.font=(selected?'600 ':'')+'10px ui-monospace';ctx.textAlign='center';ctx.fillStyle='#181d25d9';
          const tw=ctx.measureText(o.name).width;ctx.fillRect(at.x-tw/2-5,at.y+9,tw+10,17);ctx.fillStyle=o.own?'#f6edcf':o.kind==='city'?'#aae6cd':o.kind==='camp'?'#f5b2a2':'#ddcdb6';ctx.fillText(o.name,at.x,at.y+21);
        }
        if(o.hull!==undefined&&(selected||o.kind==='camp'||!o.own)){
          const max=o.kind==='worker'?40:o.kind==='scout'?90:o.kind==='base'?500:o.kind==='camp'?400:o.kind==='rig'?180:o.kind==='army'?(me?.units??3)*50:140;
          ctx.fillStyle='#20242c';ctx.fillRect(at.x-19,at.y+29,38,3);ctx.fillStyle=o.own?'#a5e1bd':'#e09c86';ctx.fillRect(at.x-19,at.y+29,38*Math.min(1,o.hull/max),3);
        }
        objects.current.push({object:o,x:at.x,y:at.y-pixels*.28,radius:Math.max(5,pixels*.45)});
      }
      factoryCargo.draw(ctx,p=>project(p,c),c.zoom,w,h);
      if(me?.home.face===c.face){
        for(let i=0;i<me.turrets;i++){
          const angle=i*Math.PI/3,p=project({...me.home,u:me.home.u+Math.cos(angle)*85,v:me.home.v+Math.sin(angle)*85},c);
          drawUtility(ctx,'turret',p.x,p.y,16*c.zoom,current,true,reduced);
        }
      }
      effects.draw(ctx,{now:current,face:c.face,zoom:c.zoom,width:w,height:h,reduced:reduced||!showEffects,view:v,actors:items,project:p=>project(p,c)});
      if(me&&c.zoom<.2){
        ctx.fillStyle='#d5c1a37a';ctx.font='11px ui-monospace';ctx.textAlign='left';ctx.fillText('Les villes se révèlent à portée des unités',20,h-65);
      }
      if(latest.current.build&&v)drawBuildGhost(ctx,latest.current.build,stroke.current.length?stroke.current:ghost.current,v,p=>project(p,c),c.zoom);
      if(destination&&Date.now()<destination.until&&destination.at.face===c.face){const at=project(destination.at,c);ctx.strokeStyle='#b7f0cf';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(at.x,at.y,12,8,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(at.x-18,at.y);ctx.lineTo(at.x+18,at.y);ctx.moveTo(at.x,at.y-12);ctx.lineTo(at.x,at.y+12);ctx.stroke();}
      if(rectangle){ctx.fillStyle='#95dec724';ctx.strokeStyle='#a7e9ce';ctx.lineWidth=1;ctx.fillRect(rectangle.x,rectangle.y,rectangle.x2-rectangle.x,rectangle.y2-rectangle.y);ctx.strokeRect(rectangle.x,rectangle.y,rectangle.x2-rectangle.x,rectangle.y2-rectangle.y);}
    }
    frame=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(frame);
  },[size,planet]);
  function coordinates(e:{clientX:number;clientY:number}){const r=canvas.current!.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function hit(x:number,y:number,order=false){const unit=objects.current.filter(o=>o.object.own&&['worker','army','scout','truck'].includes(o.object.kind)&&Math.hypot(x-o.x,y-o.y)<o.radius).sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y))[0];if(unit&&!order)return unit.object;const cell=cellAt(place(x,y));return objects.current.findLast(o=>o.object.piece&&contains(cell,o.object.piece,FACTORY_KINDS[o.object.piece.kind].size))?.object??objects.current.findLast(o=>o.object.kind!=='factory'&&(!order||!o.object.own||!['worker','army','scout','truck'].includes(o.object.kind))&&Math.hypot(x-o.x,y-o.y)<o.radius)?.object??null;}
  function down(e:PointerEvent<HTMLCanvasElement>){
    if(e.button>2)return;e.currentTarget.setPointerCapture(e.pointerId);
    setContext(null);
    const p=coordinates(e);
    if(props.build&&!planet&&e.button===0){const m={...cellAt(place(p.x,p.y)),dir:props.rotation};stroke.current=[m];ghost.current=[m];}
    drag.current={id:e.pointerId,x:p.x,y:p.y,lastX:p.x,lastY:p.y,button:e.button,turnX:p.x,select:e.button===0&&!props.build&&!planet&&props.mode==='select'&&e.pointerType!=='touch',additive:e.shiftKey||e.ctrlKey,moved:false};
  }
  function move(e:PointerEvent<HTMLCanvasElement>){
    const at=coordinates(e),d=drag.current;
    if(props.build&&!planet){
      const m={...cellAt(place(at.x,at.y)),dir:props.rotation};ghost.current=[m];
      if(d?.button===0&&stroke.current.length){
        if(props.build==='belt'||props.build==='erase'){const last=stroke.current[stroke.current.length-1];const next=traceCells(last,m);stroke.current[stroke.current.length-1]=next[0];for(const cell of next.slice(1)){if(stroke.current.length>=96)break;const old=stroke.current.findIndex(c=>c.x===cell.x&&c.y===cell.y);if(old>=0)stroke.current[old]=cell;else stroke.current.push(cell);}}
        else stroke.current=[m];
        return;
      }
    }
    if(d&&d.id===e.pointerId){
      if(Math.hypot(at.x-d.x,at.y-d.y)>5)d.moved=true;
      if(!d.moved)return;
      if(d.select){setRectangle({x:d.x,y:d.y,x2:at.x,y2:at.y});return;}
      const dx=at.x-d.lastX,dy=at.y-d.lastY;d.lastX=at.x;d.lastY=at.y;
      if(planet){setCamera(c=>({...c,yaw:c.yaw+dx*.004,pitch:Math.max(-1.25,Math.min(1.25,c.pitch+dy*.004))}));return;}
      if(d.button===1){if(Math.abs(at.x-d.turnX)>55){turn(at.x>d.turnX?1:-1);d.turnX=at.x;}return;}
      const c=cam.current,co=Math.cos(c.yaw),si=Math.sin(c.yaw);
      setCamera({...c,u:Math.max(0,Math.min(SIDE-1,c.u-(dx*co+dy/cameraSkew(c.zoom)*si)/c.zoom)),v:Math.max(0,Math.min(SIDE-1,c.v-(-dx*si+dy/cameraSkew(c.zoom)*co)/c.zoom))});
    }else{const item=hit(at.x,at.y);if(item?.id!==hover?.id)setHover(item);}
  }
  function planetPlace(x:number,y:number):Place|null {
    const face=hitFaces.current.findLast(f=>{let inside=false;for(let i=0,j=f.path.length-1;i<f.path.length;j=i++){const a=f.path[i],b=f.path[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;});
    if(!face)return null;const [a,b,,d]=face.path,ux=b.x-a.x,uy=b.y-a.y,vx=d.x-a.x,vy=d.y-a.y,det=ux*vy-uy*vx;if(Math.abs(det)<.01)return null;
    return {face:face.face,u:Math.max(0,Math.min(SIDE-1,((x-a.x)*vy-(y-a.y)*vx)/det*(SIDE-1))),v:Math.max(0,Math.min(SIDE-1,((y-a.y)*ux-(x-a.x)*uy)/det*(SIDE-1))),depth:0};
  }
  function up(e:PointerEvent<HTMLCanvasElement>){
    const d=drag.current;if(!d||d.id!==e.pointerId)return;drag.current=null;
    const at=coordinates(e);
    if(props.build&&!planet){if(d.button===2){stroke.current=[];props.onCancelBuild();return;}if(d.button===0){const marks=stroke.current;stroke.current=[];if(marks.length)props.onBuild(marks);return;}}
    if(d.select&&d.moved){
      const a=Math.min(d.x,at.x),b=Math.max(d.x,at.x),c=Math.min(d.y,at.y),f=Math.max(d.y,at.y);
      props.onSelect([...new Set([...(d.additive?props.selected:[]),...objects.current.filter(o=>o.object.own&&['army','scout','worker','truck'].includes(o.object.kind)&&o.x>=a&&o.x<=b&&o.y>=c&&o.y<=f).map(o=>o.object.id)])]);setRectangle(null);return;
    }
    if(d.moved)return;
    if(d.button===1&&!planet){turn(1);return;}
    if(planet){const point=planetPlace(at.x,at.y);if(point){setCamera(c=>({...c,...point,zoom:Math.max(.3,regionZoom),yaw:quarterTurn(c.yaw,0)}));setPlanet(false);}return;}

    const object=hit(at.x,at.y,d.button===2);
    if(d.button===2&&!object&&!e.altKey&&props.selected.length){const point=place(at.x,at.y);props.onContextCommand('move',point,null);setDestination({at:point,until:Date.now()+1800});return;}
    if(d.button===2){setContext({x:Math.max(4,Math.min(size.w-215,at.x)),y:Math.max(4,Math.min(size.h-260,at.y)),at:place(at.x,at.y),object});return;}
    if(props.mode!=='select'){const point=place(at.x,at.y);setDestination({at:point,until:Date.now()+1800});props.onOrder(point,object,false);}
    else props.onSelect(object?(e.ctrlKey||e.shiftKey)?props.selected.includes(object.id)?props.selected.filter(id=>id!==object.id):[...props.selected,object.id]:[object.id]:[]);
  }
  useEffect(()=>{
    const element=canvas.current!;
    const wheel=(e:WheelEvent)=>{
      e.preventDefault();
      if(planet){if(e.deltaY<0){const point=coordinates(e),focus=planetPlace(point.x,point.y);setPlanet(false);setCamera(c=>({...c,...focus,zoom:regionZoom,yaw:quarterTurn(c.yaw,0)}));}return;}
      const point=coordinates(e),anchor=place(point.x,point.y),c=cam.current;
      const zoom=Math.max(orbitZoom,Math.min(MAX_ZOOM,c.zoom*Math.exp(-e.deltaY*.0013)));
      if(zoom<=orbitZoom&&e.deltaY>0){setPlanet(true);setCamera({...c,zoom:orbitZoom,pitch:c.face==='bottom'?-.52:.52});return;}
      const ratio=c.zoom/zoom;
      setCamera({...c,zoom,u:Math.max(0,Math.min(SIDE-1,anchor.u+(c.u-anchor.u)*ratio)),v:Math.max(0,Math.min(SIDE-1,anchor.v+(c.v-anchor.v)*ratio))});
    };
    element.addEventListener('wheel',wheel,{passive:false});return()=>element.removeEventListener('wheel',wheel);
  },[size,planet]);
  return <div className="frontier-map" ref={host}>
    <canvas ref={canvas} tabIndex={0} aria-label="Planète de laine, sélectionner une unité ou un gisement" onDoubleClick={e=>{const at=coordinates(e),object=hit(at.x,at.y);if(object?.own&&['worker','army','scout','truck'].includes(object.kind))props.onSelect(objects.current.filter(o=>o.object.own&&o.object.kind===object.kind).map(o=>o.object.id));}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{drag.current=null;stroke.current=[];setRectangle(null);}} onContextMenu={e=>e.preventDefault()} style={{cursor:props.build?'crosshair':props.mode==='attack'?'crosshair':props.mode==='move'||props.mode==='patrol'?'copy':hover?'pointer':'grab'}}/>
    {context&&props.view?.me&&<div className="fm-context" role="menu" aria-label="Ordres tactiques" style={{left:context.x,top:context.y}} onPointerDown={e=>e.stopPropagation()}>
      <strong>{context.object?.name??'Terrain libre'}</strong><small>{props.selected.length} sélectionné(s) · {Math.round(context.at.u)} / {Math.round(context.at.v)}</small>
      <button role="menuitem" disabled={!props.selected.length} onClick={()=>{props.onContextCommand('move',context.at,null);setDestination({at:context.at,until:Date.now()+1800});setContext(null);}}>↗ Déplacer ici <kbd>M</kbd></button>
      {context.object&&['deposit','rig','city'].includes(context.object.kind)&&<button role="menuitem" onClick={()=>{props.onContextCommand('gather',context.object!.point,context.object);setContext(null);}}>{context.object.kind==='city'?'⇄ Porter du cuivre au comptoir':'⚒ Récolter ce gisement'}</button>}
      {context.object&&['camp','rig','base','army','truck','factory'].includes(context.object.kind)&&!context.object.own&&<button role="menuitem" onClick={()=>{props.onContextCommand('attack',context.object!.point,context.object);setContext(null);}}>⚔ Attaquer avec l’escouade</button>}
      <button role="menuitem" disabled={!props.selected.length} onClick={()=>{props.onContextCommand('recall',props.view!.me!.home,null);setContext(null);}}>⌂ Retour à la base</button>
      <button role="menuitem" disabled={!props.selected.length} onClick={()=>{props.onContextCommand('stop',context.at,null);setContext(null);}}>■ Arrêter <kbd>S</kbd></button>
      <button role="menuitem" onClick={()=>setContext(null)}>Fermer <kbd>Échap</kbd></button>
    </div>}
    {!planet&&props.view?.me&&<div className="fm-resource-radar" aria-label="Gisements repérés"><small>GISEMENTS REPÉRÉS</small>{(['ferrite','cuivre'] as const).map(ore=>{const origin={face:camera.face,u:camera.u,v:camera.v,depth:0} as Place,known=props.view!.deposits.filter(d=>d.ore===ore&&d.remaining>0).sort((a,b)=>(a.guards?100000:0)-(b.guards?100000:0)+Math.hypot(a.point.u-origin.u,a.point.v-origin.v)-Math.hypot(b.point.u-origin.u,b.point.v-origin.v)),node=known.find(d=>d.point.face===camera.face)??known[0];return <button key={ore} disabled={!node} data-ore={ore} onClick={()=>{if(node)props.onFocus(node.point);}}><i/>{ore==='cuivre'?'Cuivre':'Fer'}<span>{node?(node.point.face===camera.face?Math.round(Math.hypot(node.point.u-origin.u,node.point.v-origin.v))+' m':faceNames[node.point.face])+(node.guards?' · gardé':''):'À découvrir'}</span></button>;})}</div>}
    {(props.view?.simulationBehind??0)>15000&&<div className="fm-sync" role="status">Synchronisation du monde · {Math.ceil((props.view?.simulationBehind??0)/60000)} min à rattraper</div>}
    <div className="fm-heading"><span className="live-dot"/>{planet?'ATLAS PLANÉTAIRE':(camera.zoom>=1.5?'PLAN USINE · ':'TERRITOIRE · ')+faceNames[camera.face].toUpperCase()}<small>{planet?'':Math.round(camera.u).toLocaleString('fr-FR')+' / '+Math.round(camera.v).toLocaleString('fr-FR')}</small>{!planet&&<span className="fm-biome">{fieldNames[groundType(camera.face,camera.u,camera.v)]}</span>}</div>
    {props.build&&!planet&&<div className="fm-build"><strong>{props.build==='erase'?'Démonter':FACTORY_KINDS[props.build].name}</strong><span>Grille de 8 m</span><button onClick={props.onRotateBuild}>Tourner <kbd>R</kbd></button><button onClick={props.onCancelBuild}>Terminer <kbd>Échap</kbd></button></div>}
    {props.mode!=='select'&&<div className="fm-order" role="status">{props.mode==='attack'?'Choisissez une cible à attaquer':props.mode==='patrol'?'Choisissez le centre de la patrouille':'Choisissez une destination'}<kbd>Échap</kbd></div>}
    {!planet&&<div className="fm-scale"><span>{Math.round(150/camera.zoom).toLocaleString('fr-FR')} m</span><i/></div>}
    <div className="fm-view-mode"><button aria-label="Vue laine illustrée" aria-pressed={illustrated} onClick={()=>{setIllustrated(true);}}>Laine</button><button aria-label="Vue en volumes" aria-pressed={!illustrated} onClick={()=>setIllustrated(false)}>Volumes</button><button className="fm-effects" aria-label="Afficher les particules" title={reduceMotion?'Mouvements réduits activés':showEffects?'Désactiver les particules':'Activer les particules'} disabled={reduceMotion} aria-pressed={showEffects&&!reduceMotion} onClick={toggleEffects}>Effets</button></div>
    <div className="fm-buttons"><button aria-label="Vue planète" title="Vue planète" onClick={()=>{setPlanet(v=>!v);setCamera(c=>({...c,yaw:quarterTurn(c.yaw,0),pitch:c.face==='bottom'?-.52:.52}));}}><Globe2 size={18}/></button><button aria-label="Recentrer sur ma base" title="Base · H" onClick={()=>{if(props.view?.me)props.onFocus(props.view.me.home);}}><LocateFixed size={18}/></button><button className="fm-factory-zoom" aria-label="Zoom usine" title="Zoom usine" onClick={()=>{if(props.view?.me){props.onFocus(props.view.me.home);setCamera(c=>({...c,zoom:FACTORY_ZOOM,yaw:quarterTurn(c.yaw,0)}));setPlanet(false);}}}>Usine</button><button aria-label="Dézoomer" onClick={()=>{if(camera.zoom/1.4<=orbitZoom){setPlanet(true);setCamera(c=>({...c,yaw:quarterTurn(c.yaw,0),pitch:c.face==='bottom'?-.52:.52}));}setCamera(c=>({...c,zoom:Math.max(orbitZoom,c.zoom/1.4)}));}}><Minus size={18}/></button><button aria-label="Zoomer" onClick={()=>{if(planet){setPlanet(false);setCamera(c=>({...c,zoom:regionZoom,yaw:quarterTurn(c.yaw,0)}));}else setCamera(c=>({...c,zoom:Math.min(MAX_ZOOM,c.zoom*1.4)}));}}><Plus size={18}/></button><button aria-label="Rotation de 90 degrés à gauche" title="Q · tourner de 90°" onClick={()=>turn(-1)}><RotateCcw size={18}/></button><span className="fm-bearing" aria-label={'Orientation '+cameraBearing(camera.yaw)}>{cameraBearing(camera.yaw)}</span><button aria-label="Rotation de 90 degrés à droite" title="E · tourner de 90°" onClick={()=>turn(1)}><RotateCw size={18}/></button><button aria-pressed={showGrid} aria-label="Afficher la grille" title="Grille de construction" onClick={()=>setShowGrid(v=>!v)}>▦</button></div>
    <p className="fm-help">{planet?'Glisser pour tourner · cliquer une face':hover?hover.name:'Glisser à gauche · sélectionner / glisser à droite · caméra'}{!planet&&<span>{props.build?'Glisser · tracer / molette · zoom / clic molette · tourner':'Clic droit · déplacer / Alt + clic droit · menu / Q E · rotation 90°'}</span>}</p>
  </div>;
}
