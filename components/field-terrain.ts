import {SIDE,type Face} from '@/lib/planet';
import {terrainHeight,type Place} from '@/lib/frontier-geography';
import {cameraRelief,cameraSkew} from '@/lib/frontier-camera';
import {artwork} from '@/lib/field-assets';
import {fieldColors,fieldRandom,groundMix,groundType,landformsIn} from '@/lib/field-geology';

type Camera={u:number;v:number;zoom:number;yaw:number;face:Face};
type Point={x:number;y:number};
type Project=(p:Place)=>Point;
export type Obstacle={point:Place;radius:number;kind?:string};
const swatches=new Map<number,HTMLCanvasElement>();
const span=54;
const propWidths=[15,10,7,8,12,10];

function seamlessSwatch(kind:number){
  const previous=swatches.get(kind);
  if(previous)return previous;
  const atlas=artwork('terrain-materials');
  if(!atlas)return;
  const tile=document.createElement('canvas'),size=224;
  tile.width=tile.height=2*size;
  const ctx=tile.getContext('2d')!;
  const w=atlas.naturalWidth/2,h=atlas.naturalHeight/2;
  for(let y=0;y<2;y++)for(let x=0;x<2;x++){
    ctx.save();ctx.translate(x?2*size:0,y?2*size:0);ctx.scale(x?-1:1,y?-1:1);
    ctx.drawImage(atlas,(kind%2)*w+2,Math.floor(kind/2)*h+2,w-4,h-4,0,0,size,size);ctx.restore();
  }
  swatches.set(kind,tile);
  return tile;
}
function paintScenery(ctx:CanvasRenderingContext2D,c:Camera,w:number,h:number,project:Project,obstacles:Obstacle[],building:boolean){
  if(c.zoom<1.08)return;
  const atlas=artwork('terrain-scenery');
  if(!atlas)return;
  const skirt=55,reach=(Math.hypot(w,h)/cameraSkew(c.zoom)/c.zoom)/2+skirt;
  const minX=Math.max(0,Math.floor((c.u-reach)/span)),maxX=Math.min(Math.ceil(SIDE/span)-1,Math.floor((c.u+reach)/span));
  const minY=Math.max(0,Math.floor((c.v-reach)/span)),maxY=Math.min(Math.ceil(SIDE/span)-1,Math.floor((c.v+reach)/span));
  const nearby=obstacles.filter(o=>o.point.face===c.face&&Math.abs(o.point.u-c.u)<reach+o.radius&&Math.abs(o.point.v-c.v)<reach+o.radius);
  const visible:{x:number;y:number;kind:number;width:number;flip:boolean}[]=[];
  for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++){
    const chance=fieldRandom(c.face,x,y,31);
    if(chance<.44)continue;
    const u=(x+.15+.70*fieldRandom(c.face,x,y,7))*span,v=(y+.15+.70*fieldRandom(c.face,x,y,12))*span;
    if(u>=SIDE||v>=SIDE||nearby.some(o=>(o.point.u-u)**2+(o.point.v-v)**2<o.radius**2))continue;
    const p=project({face:c.face,u,v,depth:0});
    if(p.x< -90||p.y< -30||p.x>w+90||p.y>h+120)continue;
    const type=groundType(c.face,u,v),pick=fieldRandom(c.face,x,y,19);
    const kind=pick>.96?5:type===1?(pick>.62?4:0):type===3?(pick>.35?2:3):type===2?(pick>.8?3:1):(pick>.45?1:pick>.17?3:0);
    visible.push({...p,kind,width:Math.min(185,propWidths[kind]*c.zoom*(.72+chance*.42)),flip:fieldRandom(c.face,x,y,21)>.5});
  }
  ctx.save();
  ctx.globalAlpha=Math.min(.94,(c.zoom-1.08)*1.2)*(building?.48:1);
  const sw=atlas.naturalWidth/3,sh=atlas.naturalHeight/2;
  for(const p of visible.sort((a,b)=>a.y-b.y)){
    ctx.save();ctx.translate(p.x,p.y);if(p.flip)ctx.scale(-1,1);
    ctx.drawImage(atlas,(p.kind%3)*sw,Math.floor(p.kind/3)*sh,sw,sh,-p.width/2,-p.width*.83,p.width,p.width);ctx.restore();
  }
  ctx.restore();
}
const reliefTiles=new Map<number,HTMLCanvasElement>();
function reliefTile(atlas:HTMLImageElement,kind:number){
  const existing=reliefTiles.get(kind);if(existing)return existing;
  const tile=document.createElement('canvas'),size=512;tile.width=tile.height=size;
  const g=tile.getContext('2d')!,sw=atlas.naturalWidth/2,sh=atlas.naturalHeight/2;
  g.drawImage(atlas,(kind%2)*sw,Math.floor(kind/2)*sh,sw,sh,0,0,size,size);
  const fade=g.createRadialGradient(size/2,size/2,size*.28,size/2,size/2,size*.58);
  fade.addColorStop(0,'#000');fade.addColorStop(.63,'#000e');fade.addColorStop(1,'#0000');
  g.globalCompositeOperation='destination-in';g.fillStyle=fade;g.fillRect(0,0,size,size);
  reliefTiles.set(kind,tile);return tile;
}
function drawLandforms(ctx:CanvasRenderingContext2D,c:Camera,w:number,h:number,obstacles:Obstacle[]){
  if(c.zoom<.26)return;
  const atlas=artwork('terrain-landforms');if(!atlas)return;
  const reach=Math.hypot(w,h)/c.zoom/cameraSkew(c.zoom)*.54;
  const nearby=obstacles.filter(o=>o.point.face===c.face&&Math.abs(o.point.u-c.u)<reach+100&&Math.abs(o.point.v-c.v)<reach+100);
  ctx.save();ctx.beginPath();ctx.rect(0,0,SIDE,SIDE);ctx.clip();
  const strength=Math.min(.87,(c.zoom-.26)*1.35);
  for(const patch of landformsIn(c.face,SIDE,c.u-reach,c.v-reach,c.u+reach,c.v+reach)){
    const clear=nearby.some(o=>Math.hypot(o.point.u-patch.u,o.point.v-patch.v)<o.radius+patch.size*.38);
    ctx.globalAlpha=clear?strength*.36:strength;
    ctx.save();ctx.translate(patch.u,patch.v);ctx.rotate(patch.turn*Math.PI/2);ctx.scale(patch.flip,1);
    ctx.drawImage(reliefTile(atlas,patch.kind),-patch.size/2,-patch.size/2,patch.size,patch.size);ctx.restore();
  }
  ctx.restore();
}
function drawAprons(ctx:CanvasRenderingContext2D,c:Camera,obstacles:Obstacle[]){
  if(c.zoom<.7)return;
  ctx.save();
  for(const b of obstacles){
    if(b.point.face!==c.face||!(b.kind==='base'||b.kind==='rig'))continue;
    const size=b.kind==='base'?42:24,x=b.point.u-size/2,y=b.point.v-size/2;
    ctx.fillStyle=b.kind==='base'?'#4f584cc2':'#645544ba';ctx.fillRect(x,y,size,size);
    ctx.lineWidth=.55;ctx.strokeStyle='#c5ac82ad';ctx.setLineDash([.9,1.3]);ctx.strokeRect(x+1,y+1,size-2,size-2);ctx.setLineDash([]);
    ctx.fillStyle='#d4b781b3';for(const du of [2,size-2])for(const dv of [2,size-2]){ctx.beginPath();ctx.arc(x+du,y+dv,.65,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
}
export function paintField(ctx:CanvasRenderingContext2D,c:Camera,w:number,h:number,project:Project,obstacles:Obstacle[],building:boolean){
  const skew=cameraSkew(c.zoom),co=Math.cos(c.yaw),si=Math.sin(c.yaw);
  const mix=groundMix(c.face,c.u,c.v);
  ctx.fillStyle='#292b2c';ctx.fillRect(0,0,w,h);
  ctx.save();
  ctx.translate(w*.5,h*.48-terrainHeight(c.u,c.v)*c.zoom*cameraRelief(c.zoom));
  ctx.transform(co*c.zoom,si*c.zoom*skew,-si*c.zoom,co*c.zoom*skew,0,0);ctx.translate(-c.u,-c.v);
  const surface=artwork('surface-'+c.face);
  if(surface)ctx.drawImage(surface,0,0,SIDE,SIDE);
  else{
    const color=fieldColors[mix.indexOf(Math.max(...mix))];
    ctx.fillStyle='rgb('+color.join(',')+')';ctx.fillRect(0,0,SIDE,SIDE);
  }
  if(c.zoom>.55){
    const reach=Math.hypot(w,h)/c.zoom/skew, x=Math.max(0,c.u-reach),y=Math.max(0,c.v-reach);
    const width=Math.min(SIDE,c.u+reach)-x,height=Math.min(SIDE,c.v+reach)-y;
    ctx.globalCompositeOperation='soft-light';
    for(let k=0;k<mix.length;k++){
      if(mix[k]<.035)continue;
      const tile=seamlessSwatch(k);
      if(!tile)continue;
      const pattern=ctx.createPattern(tile,'repeat');
      if(!pattern)continue;
      pattern.setTransform(new DOMMatrix().scale(.16,.16));
      ctx.fillStyle=pattern;ctx.globalAlpha=mix[k]*Math.min(.68,(c.zoom-.55)*.36);
      ctx.fillRect(x,y,width,height);
    }
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  drawLandforms(ctx,c,w,h,obstacles);drawAprons(ctx,c,obstacles);
  ctx.restore();
  paintScenery(ctx,c,w,h,project,obstacles,building);
  const shade=ctx.createRadialGradient(w*.48,h*.46,Math.min(w,h)*.27,w*.52,h*.52,Math.max(w,h)*.8);
  shade.addColorStop(0,'#14202400');shade.addColorStop(1,'#23201d29');
  ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
}
