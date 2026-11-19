'use client';

import {useEffect,useMemo,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {Globe2,Layers3,Orbit,Pause,Plus,Minus,RotateCw,LocateFixed,Navigation2,X,ScanLine} from 'lucide-react';
import type {ObserverAgent,ObserverView} from '@/lib/observatory';
import {SIDE,FACE_ORDER,type Face} from '@/lib/planet';
import {along,type Place} from '@/lib/frontier-geography';
import {cameraSkew,quarterTurn,planetZoom} from '@/lib/frontier-camera';
import {artworkRevision} from '@/lib/field-assets';
import {fieldNames,groundType} from '@/lib/field-geology';
import {FactoryCargoLayer} from './cargo-render';
import {indexWorld,fieldGround,drawFieldMap,shortName} from './observer-field';
import {drawOrbitMap,pickFace,faceNames,type MapCamera,type MapHit,type OrbitScene,type ScreenPoint} from './observer-orbit';
import './observer-map.css';

type Props={world:ObserverView;selectedId:string|null;onSelect:(id:string)=>void;auto:boolean;onAutoChange:(value:boolean)=>void};
type Size={w:number;h:number;dpr:number};
const limit=(n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,n));
const groundLimit=(n:number)=>limit(n,0,SIDE-1);
const defaultPlace:Place={face:'top',u:SIDE/2,v:SIDE/2,depth:0};
const nfmt=(n:number)=>Math.round(n).toLocaleString('fr-FR');
const TOUR_MS=14000;
const faceAzimuth:Record<Face,number>={top:.72,bottom:.72,south:.45,north:Math.PI+.45,east:Math.PI/2-.45,west:Math.PI*1.5-.45};

function initial(world:ObserverView):MapCamera{
  const home=world.agents[0]?.home??defaultPlace;
  let score=-1,yaw=.72,pitch=.53;
  for(const sign of [1,-1])for(let i=0;i<4;i++){
    const y=.72+i*Math.PI/2,faces:Face[]=[sign===1?'top':'bottom',Math.cos(y)>0?'south':'north',Math.sin(y)>0?'east':'west'];
    const n=world.agents.reduce((sum,a)=>sum+(faces.includes(a.home.face)?1:0),0);
    if(n>score){score=n;yaw=y;pitch=.53*sign;}
  }
  return {mode:'orbit',face:home.face,u:home.u,v:home.v,yaw,pitch,turn:0,zoom:2.35};
}
function sectorCamera(cam:MapCamera,point:Place,zoom:number):MapCamera{
  return {...cam,mode:'field',face:point.face,u:point.u,v:point.v,zoom};
}
function surfaceTarget(world:ObserverView,agent:ObserverAgent,round:number):{point:Place;title:string}{
  const e=world.expeditions.find(e=>e.owner===agent.id);
  if(e)return {point:along(e.trip,world.time),title:'Expédition de '+shortName(agent.name)};
  const posts=world.outposts.filter(e=>e.owner===agent.id);
  if(round%3===1 && posts.length){const p=posts[round%posts.length];return {point:p.point,title:p.name};}
  const trip=agent.mobiles.find(m=>m.trip&&m.trip.due>world.time&&m.cargo>0);
  if(round%3===2 && trip)return {point:trip.point,title:'Transport de '+shortName(agent.name)};
  return {point:agent.home,title:'Base de '+shortName(agent.name)};
}

export function ObserverMap({world,selectedId,onSelect,auto,onAutoChange}:Props){
  const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const [camera,setCamera]=useState<MapCamera>(()=>{
    const start=initial(world),selected=world.agents.find(a=>a.id===selectedId);
    return !auto&&selected?sectorCamera(start,selected.home,2.35):start;
  });
  const [size,setSize]=useState<Size>({w:640,h:460,dpr:1});
  const [picked,setPicked]=useState<{label:string;detail?:string}|null>(null);
  const [pass,setPass]=useState('');
  const [hover,setHover]=useState<{label:string;detail?:string}|null>(null);
  const [resourceLayer,setResourceLayer]=useState(true);
  const [dragging,setDragging]=useState(false);
  const memoIndex=useMemo(()=>indexWorld(world),[world]);
  const latest=useRef({world,selectedId,auto,onSelect,onAutoChange,index:memoIndex,camera,resourceLayer});
  latest.current={world,selectedId,auto,onSelect,onAutoChange,index:memoIndex,camera,resourceLayer};
  const previousId=useRef(selectedId),skipSelection=useRef<string|null>(null);
  const currentOrbit=useRef<OrbitScene>({hits:[],faces:[]});
  const hits=useRef<MapHit[]>([]);
  const drag=useRef<{id:number;start:ScreenPoint;last:ScreenPoint;moved:boolean}|null>(null);
  const clock=useRef({time:world.time,wall:world.now,delay:0,at:0});
  const motion=useRef(false);
  useEffect(()=>{
    const m=window.matchMedia('(prefers-reduced-motion: reduce)');
    const change=()=>{motion.current=m.matches;};change();m.addEventListener('change',change);return()=>m.removeEventListener('change',change);
  },[]);
  useEffect(()=>{
    if(!root.current)return;
    const resize=()=>{const box=root.current!.getBoundingClientRect();setSize({w:Math.max(1,Math.round(box.width)),h:Math.max(1,Math.round(box.height)),dpr:Math.min(2,devicePixelRatio||1)});};
    const observer=new ResizeObserver(resize);observer.observe(root.current);resize();return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(previousId.current===selectedId)return;
    previousId.current=selectedId;
    if(skipSelection.current===selectedId){skipSelection.current=null;return;}
    const a=latest.current.world.agents.find(a=>a.id===selectedId);
    if(a){setCamera(c=>sectorCamera(c,a.home,2.35));setPicked(null);setPass('Base de '+shortName(a.name));}
  },[selectedId]);
  const tourStep=useRef(0);
  useEffect(()=>{
    if(!auto)return;
    const timer=window.setInterval(()=>{
      if(document.hidden)return;
      const {world:w,onSelect:select}=latest.current;
      if(!w.agents.length)return;
      const n=w.agents.length,step=tourStep.current++,index=step%(n+1);
      setPicked(null);
      if(index===n){setCamera(initial(w));setPass('');return;}
      const a=w.agents[index],t=surfaceTarget(w,a,Math.floor(step/(n+1)));
      skipSelection.current=a.id;select(a.id);setCamera(c=>sectorCamera(c,t.point,2.35));setPass(t.title);
    },TOUR_MS);
    return()=>window.clearInterval(timer);
  },[auto]);
  function manual(){setHover(null);if(latest.current.auto)latest.current.onAutoChange(false);setPass('');}
  function focus(place:Place,owner?:string,zoom=2.35){
    manual();if(owner){skipSelection.current=owner;latest.current.onSelect(owner);}
    setCamera(c=>sectorCamera(c,place,zoom));setPicked(null);
  }
  function colony(){const p=latest.current;return p.world.agents.find(a=>a.id===p.selectedId)??p.world.agents[0];}
  function orbit(){
    manual();setPicked(null);
    setCamera(c=>({...c,mode:'orbit',yaw:faceAzimuth[c.face],pitch:c.face==='bottom'?-.56:.56}));
  }
  function zoomBy(factor:number,at?:ScreenPoint){
    manual();setPicked(null);
    const c=latest.current.camera;
    if(c.mode==='orbit'){
      if(factor<=1)return;
      const p=at?pickFace(currentOrbit.current,at.x,at.y):null;
      focus(p??colony()?.home??defaultPlace,undefined,at?Math.max(planetZoom(size.w,size.h)*2,.27):1.1);return;
    }
    const min=planetZoom(size.w,size.h);
    if(c.zoom*factor<=min*1.10){orbit();return;}
    const zoom=limit(c.zoom*factor,min,12);
    const anchor=at??{x:size.w*.5,y:size.h*.48},co=Math.cos(c.turn),si=Math.sin(c.turn);
    const dx=(anchor.x-size.w*.5)*(1/c.zoom-1/zoom),dy=(anchor.y-size.h*.48)*(1/(c.zoom*cameraSkew(c.zoom))-1/(zoom*cameraSkew(zoom)));
    setCamera({...c,zoom,u:groundLimit(c.u+dx*co+dy*si),v:groundLimit(c.v-dx*si+dy*co)});
  }
  function turn(direction:number){
    manual();setPicked(null);
    setCamera(c=>c.mode==='orbit'?{...c,yaw:c.yaw+direction*Math.PI/2}:{...c,turn:quarterTurn(c.turn,direction)});
  }
  function pan(dx:number,dy:number){
    manual();setPicked(null);
    setCamera(c=>{
      if(c.mode==='orbit')return {...c,yaw:c.yaw-dx*.009,pitch:limit(c.pitch+dy*.008,-1.18,1.18)};
      const co=Math.cos(c.turn),si=Math.sin(c.turn),x=dx/c.zoom,y=dy/(c.zoom*cameraSkew(c.zoom));
      return {...c,u:groundLimit(c.u-x*co-y*si),v:groundLimit(c.v+x*si-y*co)};
    });
  }
  const zoomFn=useRef(zoomBy);zoomFn.current=zoomBy;
  useEffect(()=>{
    const el=canvas.current;if(!el)return;
    const wheel=(e:WheelEvent)=>{e.preventDefault();const r=el.getBoundingClientRect();const scale=e.deltaMode===1?14:e.deltaMode===2?r.height:1;
      zoomFn.current(Math.exp(-limit(e.deltaY*scale,-200,200)*.003),{x:e.clientX-r.left,y:e.clientY-r.top});};
    el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);
  },[]);
  useEffect(()=>{
    const element=canvas.current!;
    const ctx=element.getContext('2d');if(!ctx)return;
    const {w,h,dpr}=size;
    element.width=Math.max(1,Math.round(w*dpr));element.height=Math.max(1,Math.round(h*dpr));
    const cache=document.createElement('canvas');cache.width=element.width;cache.height=element.height;
    const ground=cache.getContext('2d')!,cargo=new FactoryCargoLayer();
    let frame=0,last=-1000,groundKey='',lastOrbitWorld:ObserverView|null=null;
    function draw(frameAt:number){
      frame=requestAnimationFrame(draw);
      if(document.hidden||frameAt-last<(motion.current?150:50))return;
      last=frameAt;
      const {world:wld,camera:c,index,selectedId:id,resourceLayer:ores}=latest.current;
      const cc=clock.current;
      if(cc.time!==wld.time||cc.wall!==wld.now){cc.delay=Math.min(6500*wld.speed,Math.max(0,wld.time-cc.time));cc.time=wld.time;cc.wall=wld.now;cc.at=frameAt;}
      const simTime=motion.current?wld.time:Math.min(cc.time,cc.time-cc.delay+Math.max(0,frameAt-cc.at)*wld.speed);
      const key=[c.mode,c.yaw,c.pitch,c.face,c.turn,c.zoom,c.u,c.v,artworkRevision(),ores,c.mode==='orbit'?id:index.landKey].join('/');
      const refresh=key!==groundKey||(c.mode==='orbit'&&wld!==lastOrbitWorld);
      if(!refresh&&c.mode==='orbit')return;
      ctx!.setTransform(dpr,0,0,dpr,0,0);
      if(c.mode==='orbit'){
        const scene=drawOrbitMap(ctx!,w,h,c,ores?index.pins:index.pins.filter(p=>p.kind!=='deposit'),id);
        currentOrbit.current=scene;hits.current=scene.hits;lastOrbitWorld=wld;groundKey=key;return;
      }
      if(refresh){groundKey=key;ground.setTransform(dpr,0,0,dpr,0,0);fieldGround(c,w,h,index,ground);}
      ctx!.drawImage(cache,0,0,w,h);
      hits.current=drawFieldMap(ctx!,w,h,wld,c,index,simTime,motion.current,cargo,ores);
    }
    frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[size]);
  const coords=(e:{clientX:number;clientY:number})=>{const r=canvas.current!.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  function hitAt(p:ScreenPoint){
    return hits.current.findLast(a=>a.width?Math.abs(p.x-a.x)<=a.width/2&&Math.abs(p.y-a.y)<=a.radius:Math.hypot(p.x-a.x,p.y-a.y)<=a.radius);
  }
  function pick(p:ScreenPoint){
    const hit=hitAt(p);
    if(hit && camera.mode==='orbit'){
      focus(hit.place,hit.owner,2.35);setPicked({label:hit.label,detail:hit.detail??faceNames[hit.place.face]});return;
    }
    if(hit){manual();if(hit.owner){skipSelection.current=hit.owner;onSelect(hit.owner);}setPicked({label:hit.label,detail:hit.detail});return;}
    if(camera.mode==='orbit'){const at=pickFace(currentOrbit.current,p.x,p.y);if(at)focus(at,undefined,.55);}
    else{manual();setPicked(null);}
  }
  function down(e:ReactPointerEvent<HTMLCanvasElement>){
    if(e.button!==0&&e.button!==1)return;
    e.currentTarget.setPointerCapture(e.pointerId);const p=coords(e);drag.current={id:e.pointerId,start:p,last:p,moved:false};
  }
  function move(e:ReactPointerEvent<HTMLCanvasElement>){
    const g=drag.current,p=coords(e);
    if(!g){if(e.pointerType==='mouse'){
      const hit=hitAt(p);setHover(prior=>prior?.label===hit?.label&&prior?.detail===hit?.detail?prior:hit?{label:hit.label,detail:hit.detail}:null);
    }return;}
    if(g.id!==e.pointerId)return;
    if(!g.moved && Math.hypot(p.x-g.start.x,p.y-g.start.y)<4)return;
    g.moved=true;setDragging(true);pan(p.x-g.last.x,p.y-g.last.y);g.last=p;
  }
  function up(e:ReactPointerEvent<HTMLCanvasElement>){
    const g=drag.current;if(!g||g.id!==e.pointerId)return;
    drag.current=null;setDragging(false);if(!g.moved)pick(coords(e));
  }
  const info=picked??hover;
  const field=camera.mode==='field';
  return <div ref={root} className={'obs-atlas'+(field?' is-field':'')+(dragging?' is-dragging':'')}>
    <canvas ref={canvas} tabIndex={0} aria-label="Carte de STRATE. Flèches pour déplacer la vue, Q et E pour tourner, touches plus et moins pour zoomer." onPointerDown={down} onPointerMove={move} onPointerLeave={()=>setHover(null)} onPointerUp={up} onPointerCancel={()=>{drag.current=null;setDragging(false);}} onKeyDown={e=>{
      if(e.key==='+'||e.key==='=')zoomBy(1.5);else if(e.key==='-')zoomBy(1/1.5);else if(e.key.toLowerCase()==='q')turn(-1);else if(e.key.toLowerCase()==='e')turn(1);
      else if(e.key==='Home')focus(colony()?.home??defaultPlace);else if(e.key==='Escape')orbit();
      else{const d=({ArrowLeft:[56,0],ArrowRight:[-56,0],ArrowUp:[0,45],ArrowDown:[0,-45]} as Record<string,number[]>)[e.key];if(!d)return;pan(d[0],d[1]);}e.preventDefault();
    }}/>
    <div className="obs-atlas-top">
      <div className="obs-atlas-tabs" role="group" aria-label="Échelle de la carte">
        <button type="button" aria-pressed={!field} onClick={orbit}><Globe2/>Orbite</button>
        <button type="button" aria-pressed={field} onClick={()=>focus(colony()?.home??defaultPlace)}><Layers3/>Terrain</button>
      </div>
      <button type="button" className="obs-tour" aria-pressed={auto} title="Alterner la visite automatique des colonies et la caméra libre" onClick={()=>{if(auto)setPass('');onAutoChange(!auto);}}>{auto?<Orbit/>:<Pause/>}<span>Vue auto</span><i/></button>
    </div>
    <div className="obs-atlas-nav" role="group" aria-label="Contrôles de la carte">
      <button type="button" title="Zoomer" aria-label="Zoomer" onClick={()=>zoomBy(1.55)}><Plus/></button>
      <button type="button" title="Dézoomer" aria-label="Dézoomer" disabled={!field} onClick={()=>zoomBy(1/1.55)}><Minus/></button>
      <button type="button" title="Tourner de 90°" aria-label="Tourner de 90 degrés" onClick={()=>turn(1)}><RotateCw/></button>
      <button type="button" title="Recentrer sur la colonie" aria-label="Recentrer sur la colonie" onClick={()=>focus(colony()?.home??defaultPlace)}><LocateFixed/></button>
    </div>
    {info&&<div className="obs-atlas-inspect"><div><strong>{info.label}</strong>{info.detail&&<small>{info.detail}</small>}</div>{picked&&<button aria-label="Fermer le détail cartographique" onClick={()=>setPicked(null)}><X size={13}/></button>}</div>}
    <div className="obs-atlas-bottom">
      <div className="obs-atlas-place"><span>{field?<ScanLine/>:<Navigation2/>}{field?(pass||faceNames[camera.face]):'Orbite planétaire'}</span>
        <small>{field?fieldNames[groundType(camera.face,camera.u,camera.v)]+' · '+nfmt(camera.u)+' / '+nfmt(camera.v):FACE_ORDER.length+' faces · '+nfmt(SIDE)+' m de côté'}</small></div>
      <button type="button" className="obs-atlas-ore" aria-pressed={resourceLayer} onClick={()=>setResourceLayer(b=>!b)} title="Afficher ou masquer les gisements"><i/>Gisements</button>
    </div>
  </div>;
}
