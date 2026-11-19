import {artwork} from '@/lib/field-assets';
import {drawGlobeMesh} from '@/lib/planet-globe';
import {orbitalRelief,reliefHeight} from '@/lib/planet-orbit-detail';
import {FACE_ORDER,SIDE,facePoint,type Face} from '@/lib/planet';
import type {Place} from '@/lib/frontier-geography';

export type ScreenPoint={x:number;y:number};
export type MapHit=ScreenPoint & {radius:number;owner?:string;place:Place;label:string;detail?:string;width?:number};
export type MapCamera={mode:'orbit'|'field';face:Face;u:number;v:number;zoom:number;yaw:number;pitch:number;turn:number};
export type OrbitPin={id:string;kind:'base'|'outpost'|'city'|'deposit';point:Place;color:string;name:string;owner?:string;detail?:string;surveyed?:boolean};
type FaceProjection={face:Face;o:ScreenPoint;u:ScreenPoint;v:ScreenPoint;lift:ScreenPoint;mesh:boolean};
export type OrbitScene={faces:FaceProjection[];hits:MapHit[]};
export const faceNames:Record<Face,string>={top:'Zénith',bottom:'Nadir',north:'Nord',south:'Sud',east:'Est',west:'Ouest'};
const normals:Record<Face,[number,number,number]>={top:[0,1,0],bottom:[0,-1,0],north:[0,0,-1],south:[0,0,1],east:[1,0,0],west:[-1,0,0]};
const tiles=new Map<Face,{img?:HTMLImageElement;canvas:HTMLCanvasElement}>();
const tau=Math.PI*2;

function reliefMap(face:Face){
  const img=artwork('orbit-'+face);
  const cached=tiles.get(face);
  if(cached && cached.img===img)return cached.canvas;
  const c=document.createElement('canvas');c.width=c.height=img?img.naturalWidth:128;
  const ctx=c.getContext('2d')!;
  if(img)ctx.drawImage(img,0,0);
  else{ctx.fillStyle='#826d57';ctx.fillRect(0,0,c.width,c.height);const surface=artwork('surface-'+face);if(surface)ctx.drawImage(surface,0,0,c.width,c.height);}
  // Survey grid is applied in face coordinates and rotates with the geology.
  const side=c.width;
  ctx.lineWidth=side/800;ctx.strokeStyle='#e8d7b33d';
  ctx.beginPath();
  for(let k=1;k<8;k++){const d=k*side/8;ctx.moveTo(d,0);ctx.lineTo(d,side);ctx.moveTo(0,d);ctx.lineTo(side,d);}
  ctx.stroke();
  tiles.set(face,{img,canvas:c});return c;
}

function backdrop(ctx:CanvasRenderingContext2D,w:number,h:number){
  const sky=ctx.createRadialGradient(w*.48,h*.43,0,w*.5,h*.5,Math.max(w,h)*.67);
  sky.addColorStop(0,'#25423e');sky.addColorStop(.55,'#152c2c');sky.addColorStop(1,'#0a1b1e');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const step=40,ox=(w/2)%step,oy=(h/2)%step;
  ctx.lineWidth=.5;ctx.strokeStyle='#9cbcb91e';ctx.beginPath();
  for(let x=ox;x<w;x+=step){ctx.moveTo(x,0);ctx.lineTo(x,h);}
  for(let y=oy;y<h;y+=step){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();
  ctx.strokeStyle='#baccc548';ctx.lineWidth=.8;ctx.beginPath();
  for(let x=ox;x<w;x+=step*2)for(let y=oy;y<h;y+=step*2){ctx.moveTo(x-2,y);ctx.lineTo(x+2,y);ctx.moveTo(x,y-2);ctx.lineTo(x,y+2);}ctx.stroke();
}

const project=(f:FaceProjection,u:number,v:number):ScreenPoint=>{
  const lift=f.mesh?reliefHeight(orbitalRelief(f.face),u,v):0;
  return {x:f.o.x+u*f.u.x+v*f.v.x+lift*f.lift.x,y:f.o.y+u*f.u.y+v*f.v.y+lift*f.lift.y};
};
export function pickFace(scene:OrbitScene,x:number,y:number):Place|null{
  for(const f of scene.faces){
    const det=f.u.x*f.v.y-f.u.y*f.v.x;
    if(Math.abs(det)<1e-3)continue;
    let u=0,v=0;
    for(let i=0;i<3;i++){
      const z=f.mesh?reliefHeight(orbitalRelief(f.face),u,v):0,dx=x-f.o.x-z*f.lift.x,dy=y-f.o.y-z*f.lift.y;
      u=(dx*f.v.y-dy*f.v.x)/det;v=(f.u.x*dy-f.u.y*dx)/det;
    }
    if(u>=0&&v>=0&&u<=1&&v<=1)return {face:f.face,u:u*(SIDE-1),v:v*(SIDE-1),depth:0};
  }
  return null;
}

export function drawOrbitMap(ctx:CanvasRenderingContext2D,w:number,h:number,camera:MapCamera,pins:OrbitPin[],selected:string|null){
  const result:OrbitScene={faces:[],hits:[]};
  const cx=w*.49,cy=h*.505,scale=Math.min(w*.22,h*.25);
  const sy=Math.sin(camera.yaw),cyaw=Math.cos(camera.yaw),sp=Math.sin(camera.pitch),cp=Math.cos(camera.pitch);
  const eye=[sy*cp,sp,cyaw*cp];
  const vertex=(f:Face,u:number,v:number)=>{
    const p=facePoint(f,u*(SIDE-1),v*(SIDE-1));
    const [x,y,z]=[p.x,p.y,p.z].map(n=>n/(SIDE-1)*2-1);
    return {x:cx+scale*(x*cyaw-z*sy),y:cy-scale*(y*cp-(x*sy+z*cyaw)*sp)};
  };
  backdrop(ctx,w,h);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.20);
  ctx.lineWidth=.8;ctx.strokeStyle='#bddac237';ctx.setLineDash([2,6]);
  for(const [rx,ry] of [[2.26,1.06],[1.92,1.54]]){ctx.beginPath();ctx.ellipse(0,0,scale*rx,scale*ry,0,0,tau);ctx.stroke();}
  ctx.restore();
  const mesh=drawGlobeMesh(ctx,w,h,camera,cx,cy,scale,reliefMap);
  for(const face of FACE_ORDER){
    const n=normals[face],dot=n.reduce((total,k,i)=>total+k*eye[i],0);
    if(dot<=.003)continue;
    const o=vertex(face,0,0),a=vertex(face,1,0),b=vertex(face,0,1),end=vertex(face,1,1);
    const f={face,o,u:{x:a.x-o.x,y:a.y-o.y},v:{x:b.x-o.x,y:b.y-o.y},lift:{x:scale*(n[0]*cyaw-n[2]*sy),y:-scale*(n[1]*cp-(n[0]*sy+n[2]*cyaw)*sp)},mesh};
    result.faces.push(f);
    if(!mesh){
      ctx.save();ctx.transform(f.u.x,f.u.y,f.v.x,f.v.y,o.x,o.y);ctx.drawImage(reliefMap(face),0,0,1,1);
      const light=n[1]*.76+n[2]*.49-n[0]*.40;ctx.fillStyle='rgba(10,23,25,'+(.22-light*.21)+')';ctx.fillRect(0,0,1,1);ctx.restore();
    }
    ctx.lineWidth=1;ctx.strokeStyle='#edd9ad86';ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(a.x,a.y);ctx.lineTo(end.x,end.y);ctx.lineTo(b.x,b.y);ctx.closePath();ctx.stroke();
  }
  const sites=pins.flatMap(pin=>{
    const f=result.faces.find(f=>f.face===pin.point.face);
    return f?[{pin,at:project(f,pin.point.u/(SIDE-1),pin.point.v/(SIDE-1))}]:[];
  });
  for(const {at,pin} of sites){
    if(pin.kind==='base')continue;
    if(pin.kind==='outpost'){
      ctx.fillStyle=pin.color;ctx.strokeStyle='#1a302d';ctx.lineWidth=1.5;ctx.fillRect(at.x-2.5,at.y-2.5,5,5);ctx.strokeRect(at.x-2.5,at.y-2.5,5,5);
    }else if(pin.kind==='city'){
      ctx.strokeStyle='#ffe6b2cc';ctx.lineWidth=1.2;ctx.strokeRect(at.x-2,at.y-2,4,4);
    }else{
      ctx.save();ctx.globalAlpha=pin.surveyed?.95:.50;ctx.fillStyle=pin.color;ctx.beginPath();ctx.arc(at.x,at.y,pin.surveyed?1.7:1.15,0,tau);ctx.fill();ctx.restore();
    }
    result.hits.push({...at,place:pin.point,owner:pin.owner,label:pin.name,detail:pin.detail,radius:pin.kind==='deposit'?4:6});
  }
  type Box={x:number;y:number;w:number;h:number};
  const taken:Box[]=[];const bases=sites.filter(s=>s.pin.kind==='base').sort((a,b)=>Number(b.pin.owner===selected)-Number(a.pin.owner===selected));
  for(const {pin,at} of bases){
    const active=pin.owner===selected,sgn=at.x<cx?-1:1,label=pin.name.replace(/^\[IA\]\s*/,'');
    ctx.save();ctx.strokeStyle=pin.color;ctx.lineWidth=active?2:1.35;ctx.fillStyle='#162a27';ctx.beginPath();ctx.arc(at.x,at.y,active?5:4,0,tau);ctx.fill();ctx.stroke();
    ctx.fillStyle=pin.color;ctx.beginPath();ctx.arc(at.x,at.y,2,0,tau);ctx.fill();
    if(active){ctx.globalAlpha=.48;ctx.beginPath();ctx.arc(at.x,at.y,9,0,tau);ctx.stroke();ctx.globalAlpha=1;}
    result.hits.push({...at,radius:11,place:pin.point,owner:pin.owner,label:pin.name});
    ctx.font='600 11px system-ui, sans-serif';
    const width=ctx.measureText(label).width+17;
    for(const dy of [-22,26,-42,45,-65,69]){
      const boxHeight=20,endX=Math.max(7,Math.min(w-width-7,at.x+(sgn>0?27:-27-width))),endY=at.y+dy;
      if(endY<49||endY>h-45)continue;
      const box={x:endX,y:endY-boxHeight/2,w:width,h:boxHeight};
      if(taken.some(b=>box.x<b.x+b.w+3&&box.x+width+3>b.x&&box.y<b.y+b.h+4&&box.y+boxHeight+4>b.y))continue;
      taken.push(box);
      const edge=sgn>0?box.x:box.x+width;
      ctx.strokeStyle=pin.color;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(at.x+sgn*5,at.y);ctx.lineTo(edge-sgn*7,endY);ctx.lineTo(edge,endY);ctx.stroke();
      ctx.fillStyle=active?'#152c2bf7':'#162a29e8';ctx.fillRect(box.x,box.y,width,boxHeight);
      ctx.fillStyle=pin.color;ctx.fillRect(box.x,box.y,2,boxHeight);
      ctx.fillStyle='#f7f2df';ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText(label,box.x+8,endY);
      result.hits.push({x:box.x+width/2,y:endY,radius:10,width,place:pin.point,owner:pin.owner,label:pin.name});
      break;
    }
    ctx.restore();
  }
  return result;
}
