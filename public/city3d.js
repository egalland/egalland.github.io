import {terrainHeight,buildingGround,waterLevel} from './terrain-height.js';
import {terracePanels} from './street-terraces.js';
import * as T from './three.js';
import * as source from './paris-data.js';
const {buildings,streets,water}=source;
import {cityMaterials} from './city-materials.js';
import {famousLandmark,parisLandmarks} from './city-landmarks.js';
const specialParisIds=new Set(parisLandmarks.flatMap(item=>item.ids));

const arc={x:3296.7,z:693.2,yaw:1.126};
const grande={x:-1034.4,z:-1399.0,yaw:1.019};
const tau=Math.PI*2, white='#ffffff';
const stones=['#f0dfbd','#f7dcc5','#e7deca','#e3d3cd','#f4dfce','#e3d3bf','#f0deca','#d6c9bf'];
const slates=['#666778','#526878','#697186','#736879','#536575'];
const masonry=[ '#ead5ad','#d9bc9d','#f5e1b9','#b39183','#997e80' ];
const stripMaterials=['#c58079','#729e96','#ab786e','#70869c','#87976e','#b48a71'];
const materialColors=new Map();
function color(val){
  if(!materialColors.has(val))materialColors.set(val,new T.Color(val));
  return materialColors.get(val);
}
function hash(id){
  let n=2166136261;
  for(const ch of String(id)){n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}
  return n>>>0;
}
function mean(points){
  let x=0,z=0;
  for(const p of points){x+=p[0];z+=p[1];}
  return [x/points.length,z/points.length];
}
function distinct(points){
  const result=[];
  for(const p of points||[]){if(!Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))continue;
    const last=result.at(-1);if(!last||Math.hypot(last[0]-p[0],last[1]-p[1])>.12)result.push(p);
  }
  if(result.length>1&&Math.hypot(result[0][0]-result.at(-1)[0],result[0][1]-result.at(-1)[1])<.15)result.pop();
  return result;
}
function triIndex(poly) {
  if(poly.length<3)return [];
  return T.ShapeUtils.triangulateShape(poly.map(p=>new T.Vector2(p[0],p[1])),[]);
}
const defaultUV=[[0,0],[1,0],[1,1],[0,1]];
class Batch {
  constructor(){this.buffers=new Map();this.base=0;this.drape=false;this.foundation=false;}
  lift(p){
    const base=this.drape?terrainHeight(p[0],p[2]):this.base;
    const floor=this.foundation&&p[1]===0?Math.min(base,terrainHeight(p[0],p[2]))-.18:base;
    return [p[0],p[1]+floor,p[2]];
  }
  tri(mat,a,b,c,col=white,uv=defaultUV) {
    let buf=this.buffers.get(mat);
    if(!buf){buf={pos:[],colors:[],tex:[]};this.buffers.set(mat,buf);}
    buf.pos.push(...this.lift(a),...this.lift(b),...this.lift(c));
    const k=color(col);buf.colors.push(k.r,k.g,k.b,k.r,k.g,k.b,k.r,k.g,k.b);
    for(let i=0;i<3;i++)buf.tex.push(uv[i][0],uv[i][1]);
  }
  face(mat,a,b,c,d,col=white,uv=defaultUV){
    this.tri(mat,a,b,c,col,[uv[0],uv[1],uv[2]]);this.tri(mat,a,c,d,col,[uv[0],uv[2],uv[3]]);
  }
  quad(mat,points,height,col,scale=1) {
    if(points.length!==4)return;
    const verts=points.map(p=>[p[0],height,p[1]]),uv=points.map(p=>[p[0]/scale,p[1]/scale]);
    this.face(mat,...verts,col,uv);
  }
  flat(mat,poly,h,col=white,scale=1) {
    const v=poly.map(([x,z])=>[x,h,z]),coords=poly.map(([x,z])=>[x/scale,z/scale]);
    for(const [i,j,k] of triIndex(poly))this.tri(mat,v[k],v[j],v[i],col,[coords[k],coords[j],coords[i]]);
  }
  wall(mat,a,b,h1,h2,col,tiles=1,floors=1) {
    if(Math.abs(h2-h1)<.02)return;
    this.face(mat,[a[0],h1,a[1]],[b[0],h1,b[1]],[b[0],h2,b[1]],[a[0],h2,a[1]],col,[[0,0],[tiles,0],[tiles,floors],[0,floors]]);
  }
  box(x,h,z,w,ht,d,col,mat='felt') {
    const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2,top=h+ht;
    this.wall(mat,[a,c],[b,c],h,top,col,w/2.4,ht/2.4);this.wall(mat,[b,c],[b,e],h,top,col,d/2.4,ht/2.4);
    this.wall(mat,[b,e],[a,e],h,top,col,w/2.4,ht/2.4);this.wall(mat,[a,e],[a,c],h,top,col,d/2.4,ht/2.4);
    this.quad(mat,[[a,c],[a,e],[b,e],[b,c]],top,col,2.4);
    this.quad(mat,[[a,c],[b,c],[b,e],[a,e]],h,col,2.4);
  }
  tube(p,q,r,s,col,n=8,mat='felt'){
    const delta=new T.Vector3(q[0]-p[0],q[1]-p[1],q[2]-p[2]);if(delta.lengthSq()<.000001)return;
    const len=delta.length();delta.normalize();
    const side=new T.Vector3().crossVectors(delta,Math.abs(delta.y)>.88?new T.Vector3(0,0,1):new T.Vector3(0,1,0)).normalize();
    const up=new T.Vector3().crossVectors(delta,side).normalize();
    function vertex(pt,radius,i) {const u=radius*Math.cos(i*tau/n),v=radius*Math.sin(i*tau/n);return [pt[0]+side.x*u+up.x*v,pt[1]+side.y*u+up.y*v,pt[2]+side.z*u+up.z*v];}
    for(let i=0;i<n;i++){
      const a=vertex(p,r,i),b=vertex(p,r,i+1),c=vertex(q,s,i+1),d=vertex(q,s,i);
      this.face(mat,a,b,c,d,col,[[i/n,0],[(i+1)/n,0],[(i+1)/n,len/2],[i/n,len/2]]);
      this.tri(mat,p,b,a,col);this.tri(mat,q,d,c,col);
    }
  }
  ball(x,y,z,sx,sy,sz,col,segments=8,rings=5,mat='felt'){
    const v=(u,v)=>{const a=tau*u,b=Math.PI*v;return [x+sx*Math.cos(a)*Math.sin(b),y-sy*Math.cos(b),z+sz*Math.sin(a)*Math.sin(b)];};
    for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
      const a=i/segments,b=(i+1)/segments,c=j/rings,d=(j+1)/rings;
      this.face(mat,v(a,c),v(b,c),v(b,d),v(a,d),col,[[a*3,c*2],[b*3,c*2],[b*3,d*2],[a*3,d*2]]);
    }
  }
  mesh(materials){
    const group=new T.Group();
    for(const [name,b] of this.buffers){
      if(!b.pos.length)continue;
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.pos,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(b.tex,2));g.setAttribute('color',new T.Float32BufferAttribute(b.colors,3));
      g.computeVertexNormals();g.computeBoundingSphere();
      group.add(new T.Mesh(g,materials[name]));
    }
    this.buffers.clear();
    return group;
  }
}
function ring(batch,x,z,inner,outer,h,col,mat='plain',n=80){
  for(let i=0;i<n;i++){const a=i*tau/n,b=(i+1)*tau/n;const pt=(r,a)=>[x+r*Math.cos(a),z+r*Math.sin(a)];
    batch.quad(mat,[pt(inner,a),pt(inner,b),pt(outer,b),pt(outer,a)],h,col,8);}
}
// Each landmark uses the geographic footprint center, the local z axis follows the historical axis.
function historicArch() {
  const b=new Batch(), p='#e4ccaa', shade='#aa8b83',light='#f3dfb8';
  for(const side of [-1,1])for(const sideZ of [-1,1]){
    const x=14.91*side,z=7.61*sideZ;
    b.box(x,0,z,15.18,1.1,6.78,'#b7a09a');
    b.box(x,1.1,z,14.94,22.15,6.6,p);
    b.box(x,3.35,z,15.32,.44,7.02,light);
    b.box(x,19.56,z,15.13,.37,6.94,light);
    for(let i=0;i<4;i++){b.box(x,5.5+i*3.15,z,15.01,.095,6.8,'#c6ad99');}
  }
  // Smaller transverse passage under the outer piers.
  for(const sign of [-1,1]){
    for(let i=0;i<10;i++){
      const a=-4.22+i*8.44/10,bz=a+8.44/10;
      const h0=14.46+Math.sqrt(Math.max(0,4.22**2-a*a)),h1=14.46+Math.sqrt(Math.max(0,4.22**2-bz*bz));
      const l=sign<0?-22.5:7.31,r=sign<0?-7.31:22.5;
      b.face('felt',[l,h0,a],[r,h0,a],[r,h1,bz],[l,h1,bz],shade);
      for(const xx of [l,r])b.face('felt',[xx,h0,a],[xx,h1,bz],[xx,32,bz],[xx,32,a],p);
    }
    b.box(sign*14.9,23,-.01,15.19,9.1,22,p);
  }
  const r=7.31,low=21.88,top=33;
  for(let i=0;i<22;i++){
    const a=Math.PI*i/22,c=Math.PI*(i+1)/22;
    let ax=Math.cos(a)*r,ay=low+Math.sin(a)*r,cx=Math.cos(c)*r,cy=low+Math.sin(c)*r;
    b.face('felt',[ax,ay,-11],[ax,ay,11],[cx,cy,11],[cx,cy,-11],shade);
    for(const z of [-11.02,11.02]){
      b.face('felt',[ax,ay,z],[cx,cy,z],[cx,top,z],[ax,top,z],p);
      const med=Math.sign(z)*.15;
      const at=(a,r)=>[Math.cos(a)*r,low+Math.sin(a)*r,z+med];
      b.face('felt',at(a,r+.10),at(c-.008,r+.10),at(c-.008,r+1.1),at(a,r+1.1),i%3===0?light:'#d8ba9b');
    }
  }
  b.box(0,32,0,45,5.4,22,p);
  b.box(0,35.2,0,45.7,.6,22.5,shade);
  b.box(0,35.8,0,46.6,.6,23.1,light);
  b.box(0,36.5,0,45.5,4.15,22.45,'#d6ba97');
  b.box(0,40,0,46.5,.8,23.1,shade);b.box(0,40.8,0,47.15,.77,23.85,light);
  b.box(0,41.56,0,45.5,5.72,22.1,p);
  b.box(0,47.35,0,47,.55,23.3,light);b.box(0,47.9,0,45.6,1.07,22.4,'#cdb49a');
  b.box(0,48.97,0,44.7,.45,22.0,light);
  for(const side of [-1,1]){
    const z=side*11.11;
    // Medal frieze, attic cartouches and the quatre sculptural groups.
    for(let i=-10;i<=10;i++){
      const x=i*2.12;
      b.ball(x,39,z+.18*side,.63,.69,.27,i%2===0?'#bda18a':'#e7ccaa',6,3);
      b.box(x,37.1,z+.17*side,.4,.68,.27,'#b69a86');
    }
    for(let i=-4;i<=4;i++){
      const x=i*4.8;
      b.box(x,42.4,z,.17,3.95,.34,'#bea487');b.box(x+.35,42.36,z,.14,4.04,.35,light);
      b.box(x+2.38,43.27,z,2.65,1.84,.3,'#e1c8a8');b.box(x+2.38,43.67,z+.205*side,1.58,.17,.08,'#baa18c');
    }
    for(const s of [-1,1]){
      const x=s*15.02,z2=11.4*side;
      b.box(x,4.25,z2,10,.83,2.35,shade);b.box(x,5.06,z2,9.72,.46,2.28,light);
      b.box(x,20.5,z+.12*side,11.43,5.4,.52,'#b49a85');b.box(x,20.87,z+.42*side,10.82,4.67,.56,'#ddc3a1');
      for(let n=0;n<5;n++){const px=x+(n-2)*1.79;
        b.ball(px,23+Math.sin(n*.9)*.39,z+.91*side,.43,.55,.22,'#b29681',7,4);
        b.tube([px-.25,21.5,z+.91*side],[px+.23,22.74,z+1.02*side],.32,.49,'#c7aa91',6);
      }
      for(let j=0;j<5;j++){
        const dx=(j-2)*1.46,boost=1-Math.abs(j-2)*.17,h=5.7+boost*5.4;
        b.ball(x+dx*.7,h+2,z2+.32*side,.68*boost,.82*boost,.61,'#e3c9a9',8,4);
        b.tube([x+dx*1.08,5.61,z2+.44*side],[x+dx*.72,h+1.31,z2+.33*side],1.16*boost,.71*boost,'#c4a98f',7);
        b.tube([x+dx*.82,h+.85,z2+.52*side],[x+dx*1.24,h+1.92+Math.sin(j)*1.1,z2+.8*side],.4,.31,light,6);
      }
      b.ball(x,15.88,z2,.92,1.06,.71,light,8,4);
      b.tube([x-1.4,12.5,z2],[x-.12,15.1,z2+.2*side],1.28,.83,'#dfc1a0',7);
      b.tube([x-.1,14.32,z2+.27*side],[x+2.2*s,17.36,z2+.45*side],.47,.28,'#f0d7b3',7);
      b.tube([x+1.95*s,16.7,z2+.46*side],[x+3.42*s,19.2,z2+.50*side],.12,.045,'#a08878',5);
    }
  }
  // One narrow Tricolore on the parapet; its fishtail has three folded fabric panels.
  b.tube([11,49.4,-1],[11,54.15,-1],.11,.08,'#a99482',7);
  ['#50688b','#f3e6cf','#c95160'].forEach((col,i)=>{
    const a=11+i*1.2,c=11+(i+1)*1.2;
    b.face('felt',[a,53.9,-1+Math.sin(i)*.4],[c,53.7,-1+Math.sin(i+1)*.4],[c,51.95,-1+Math.sin(i+1)*.4],[a,52.15,-1+Math.sin(i)*.4],col);
  });
  return b;
}
function futureArch(){
  const b=new Batch(),face='#e2e1e0',trim='#aab8c7',deep='#748d9f', silver='#d1d5db';
  for(const s of [-1,1]){
    b.box(s*42.75,0,0,21.5,109,109,face);
    for(const z of [-54.8,54.8]){
      b.box(s*42.8,2.4,z,16.7,104,.55,'#d0d3d8');
      for(let y=3;y<107;y+=3.5)b.box(s*42.8,y,z,17.2,.24,.85,trim,'plain');
    }
    for(const x of [s*32.04,s*53.7])for(let z=-50;z<53;z+=5.5)b.box(x,2,z,.46,103,.34,trim,'plain');
  }
  b.box(0,89,0,106.8,20.2,109,face);b.box(0,88.4,0,64,.62,109,deep);
  for(let x=-49;x<52;x+=5)b.box(x,89,-54.7,.32,19,.62,trim,'plain');
  b.box(0,108.4,0,107.4,1.25,110,silver);
  return b;
}
const pyramid={x:(2.33585-2.25)*73190,z:(48.88-48.86101)*111320};
const obelisk={x:5206,z:1617};
const LouvreIds=new Set(['245184969','253248239','253248246','253248248']);
function pyramidForm(){
  const b=new Batch(),w=17.5,y=21.6;
  const corners=[[-w,0,-w],[w,0,-w],[w,0,w],[-w,0,w]];
  for(let i=0;i<4;i++){
    const a=corners[i],c=corners[(i+1)%4],t=[0,y,0];
    b.tri('glass',a,c,t,'#c9dde3',[[0,0],[7,0],[3.5,7]]);
    for(let j=0;j<=9;j++){
      const f=j/10,lerp=(a,d,t)=>a.map((v,i)=>v+(d[i]-v)*t);
      b.tube(lerp(a,t,f),lerp(c,t,f),.10,.1,'#c1c6cb',4,'plain');
      b.tube(lerp(a,c,f),lerp(a,t,1-f),.10,.10,'#b3bdc8',4,'plain');
      b.tube(lerp(c,a,f),lerp(c,t,1-f),.10,.10,'#b3bdc8',4,'plain');
    }
  } return b;
}
function obeliskForm(){
  const b=new Batch();b.box(0,0,0,7,1.15,7,'#b3a19a');
  b.box(0,1.15,0,5.4,3.4,5.4,'#b9a298');b.box(0,4.55,0,4.1,.55,4.1,'#d3b7a5');
  const sq=(s,y)=>[[-s,y,-s],[s,y,-s],[s,y,s],[-s,y,s]];
  const bottom=sq(1.34,5.1),top=sq(.77,25.16);
  for(let i=0;i<4;i++){
    const j=(i+1)%4;b.face('felt',bottom[i],bottom[j],top[j],top[i],'#d5af83');
    b.tri('plain',top[i],top[j],[0,27.1,0],'#e7bf62');
  }
  return b;
}
function specialFootprint(id,x,z) {
  return specialParisIds.has(id)||id==='157326'||id==='444657'||id==='245198908'||LouvreIds.has(id)||Math.hypot(x-arc.x,z-arc.z)<10||
    Math.hypot(x-grande.x,z-grande.z)<19||Math.hypot(x-pyramid.x,z-pyramid.z)<8||Math.hypot(x-obelisk.x,z-obelisk.z)<4;
}
function flatWithHoles(batch,mat,poly,holes,height,col,scale=1){
  const ring=distinct(poly),hh=(holes||[]).map(distinct).filter(r=>r.length>=3);
  if(!hh.length){batch.flat(mat,ring,height,col,scale);return;}
  const idx=T.ShapeUtils.triangulateShape(ring.map(p=>new T.Vector2(...p)),hh.map(h=>h.map(p=>new T.Vector2(...p))));
  const pts=ring.concat(...hh),uv=pts.map(p=>[p[0]/scale,p[1]/scale]);
  for(const [a,b,c] of idx){const ids=[c,b,a];batch.tri(mat,...ids.map(i=>[pts[i][0],height,pts[i][1]]),col,ids.map(i=>uv[i]));}
}
function addBuilding(b,building,detail){
  const poly=distinct(building.poly);if(poly.length<3)return;
  const [cx,cz]=mean(poly);
  b.base=buildingGround(building.poly);b.foundation=true;
  if(specialFootprint(String(building.id),cx,cz))return;
  const id=hash(building.id),h=Math.max(1.9,Math.min(260,Number(building.h)||14));
  const glass=h>48||(cx< -135&&cz< -625&&h>24);
  const stone=glass?['#d0d1d4','#c8c6d6','#aabdc2','#ccced5'][id%4]:stones[id%stones.length];
  const roof=slates[(id>>>3)%slates.length];
  const crown=glass?Math.min(3.1,h*.05):Math.min(3.55,h*.19),eaves=h-crown;
  const count=poly.length;
  if(!detail){
    for(let i=0;i<count;i++){
      const a=poly[i],c=poly[(i+1)%count],len=Math.hypot(a[0]-c[0],a[1]-c[1]);
      b.wall(glass?'glass':'facade',a,c,0,h-.5,stone,Math.max(1,Math.round(len/(glass?4.8:4))),Math.max(1,Math.round(h/(glass?4:3.6))));
    }
    flatWithHoles(b,'plain',poly,building.holes,h-.48,glass?'#9398a8':roof);
    return;
  }
  const mansard=!glass&&h>9&&!building.holes?.length, pinch=mansard?Math.min(.14,2.4/Math.max(11,Math.sqrt(Math.abs(T.ShapeUtils.area(poly.map(p=>new T.Vector2(...p))))))):0;
  const inset=poly.map(([x,z])=>[x+(cx-x)*pinch,z+(cz-z)*pinch]);
  const floorCount=Math.max(1,Math.round((eaves-3.6)/3.15));
  const shopMat='shop'+((id>>>2)%8);
  const cross=T.ShapeUtils.area(poly.map(p=>new T.Vector2(...p)))>0?1:-1;
  for(let i=0;i<count;i++){
    const a=poly[i],d=poly[(i+1)%count],r=inset[i],s=inset[(i+1)%count],dx=d[0]-a[0],dz=d[1]-a[1],length=Math.hypot(dx,dz);
    if(length<.12)continue;
    if(glass){b.wall('glass',a,d,0,h,stone,Math.max(1,Math.round(length/3.7)),Math.max(1,Math.round(h/3.7)));continue;}
    if(h<6.8){
      b.wall('felt',a,d,0,eaves,stone,length/4,1);b.wall('roof',a,d,eaves,h,roof,length/3,1);continue;
    }
    const base=Math.min(3.65,eaves*.55), win=Math.max(1,Math.round(length/3.55));
    if(length>4.1)b.wall(shopMat,a,d,.02,base,white,Math.max(1,Math.round(length/8.8)),1);
    else b.wall('felt',a,d,0,base,stone,1,1);
    b.wall('facade',a,d,base,eaves,stone,win,floorCount);
    const uv=[[0,0],[win,0],[win,1],[0,1]];
    b.face('roof',[a[0],eaves,a[1]],[d[0],eaves,d[1]],[s[0],h,s[1]],[r[0],h,r[1]],roof,uv);
    const outX=dz/length*cross,outZ=-dx/length*cross;
    if(length>5){
      const aa=[a[0]+outX*.24,a[1]+outZ*.24],dd=[d[0]+outX*.24,d[1]+outZ*.24];
      b.wall('felt',aa,dd,eaves-.25,eaves+.1,'#d4c5ba',length/4,.12);
      if(h>13&&length>7){
        const balcony=base+(eaves-base)*Math.max(1,floorCount-1)/floorCount-.05;
        b.wall('felt',aa,dd,balcony-.17,balcony+.075,'#d7c4b3',length/4,.12);
        if(mansard)for(let k=0;k<Math.min(4,Math.floor(length/5.7));k++){
          const t=(k+.65)/Math.max(1,Math.floor(length/5.7)),px=a[0]+dx*t,pz=a[1]+dz*t;
          const lt=[px-dx/length*.58,pz-dz/length*.58],rt=[px+dx/length*.58,pz+dz/length*.58];
          b.wall('glass',lt,rt,eaves+.35,eaves+1.48,'#cabfae');
          b.tri('felt',[lt[0],eaves+1.45,lt[1]],[rt[0],eaves+1.45,rt[1]],[px,eaves+2.15,pz],'#d7c7b4');
        }
      }
    }
    if(length>=8 && (id+i)%3===0){
      const n=Math.min(4,Math.floor(length/6)),awColor=stripMaterials[(id+i)%stripMaterials.length];
      for(let k=0;k<n;k++){
        const t=(k+.5)/n,w=Math.min(3.3,length/n*.75);
        const mid=[a[0]+dx*t,a[1]+dz*t],left=[mid[0]-dx/length*w/2,mid[1]-dz/length*w/2];
        for(let st=0;st<6;st++){
          const oa=[left[0]+dx/length*w*st/6,left[1]+dz/length*w*st/6],ob=[oa[0]+dx/length*w/6,oa[1]+dz/length*w/6],
            fa=[oa[0]+outX*.95,oa[1]+outZ*.95],fb=[ob[0]+outX*.95,ob[1]+outZ*.95];
          const c=st%2?awColor:'#e9d2af';
          b.face('felt',[oa[0],base-.46,oa[1]],[ob[0],base-.46,ob[1]],[fb[0],base-.94,fb[1]],[fa[0],base-.94,fa[1]],c);
          b.wall('felt',fa,fb,base-1.2,base-.94,c);
        }
      }
    }
  }
  for(const hole of building.holes||[])for(let i=0;i<hole.length;i++)b.wall('facade',hole[i],hole[(i+1)%hole.length],0,eaves,stone,2,floorCount+1);
  flatWithHoles(b,'roof',inset,building.holes,h,glass?'#a3afbb':roof,3.8);
  if(mansard&&h>12&&count>3&&(id%4!==0)){
    const ax=cx+(poly[0][0]-cx)*.42,az=cz+(poly[0][1]-cz)*.42;
    b.box(ax,h-.15,az,1.32,.8,.76,'#c2ae9d');for(const offset of [-.37,.38])b.box(ax+offset,h+.62,az,.3,.75,.39,'#ab786c');
  }
}
function strip(batch,mat,a,d,width,h,col,scale=5,xOffset=0){
  const dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz);if(len<.04)return;
  if(len>18){
    const steps=Math.ceil(len/18);
    for(let j=0;j<steps;j++)strip(batch,mat,[a[0]+dx*j/steps,a[1]+dz*j/steps],[a[0]+dx*(j+1)/steps,a[1]+dz*(j+1)/steps],width,h,col,scale,xOffset);
    return;
  }
  const nx=-dz/len,nz=dx/len,w=width/2;
  const points=[[a,-w],[a,w],[d,w],[d,-w]].map(([p,off])=>[p[0]+nx*(off+xOffset),p[1]+nz*(off+xOffset)]);
  batch.quad(mat,points,h,col,scale);
}
function addRoad(b,seg){
  b.base=0;b.foundation=false;b.drape=true;
  const {a,d,street:s,i}=seg,dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz);
  if(len<.2)return;
  const path=s.kind==='path',w=Number(s.w)||5;
  // Rounded joins keep adjacent curb strips contiguous where a road bends.
  const pad=Math.min(1.15,w*.13,len*.07),a1=[a[0]-dx/len*pad,a[1]-dz/len*pad],d1=[d[0]+dx/len*pad,d[1]+dz/len*pad];
  if(path){
    strip(b,'pave',a1,d1,Math.max(1.45,w),.027,'#c9b5b2',4);return;
  }
  const bridge=s.bridge;
  const y=bridge?.071:.038;
  strip(b,'pave',a1,d1,w+Math.min(6,w*.6),y-.018,white,4);
  strip(b,'road',a1,d1,w+.28,y-.002,'#c0aeb1',6.2);
  strip(b,'road',a1,d1,w,y,white,6.2);
  if(w>5&&(!bridge || w>9)){
    const nx=dx/len,nz=dz/len,spacing=Math.max(9,Math.min(13,len/2));
    for(let s0=3;s0+1.85<len;s0+=spacing){
      const s1=Math.min(s0+2.8,len-.5);strip(b,'plain',[a[0]+nx*s0,a[1]+nz*s0],[a[0]+nx*s1,a[1]+nz*s1],.14,y+.011,'#cdbfaf',2);
    }
  }
  // The elevated deck uses the same walking surface as the street physics.
  if(bridge&&w>6&&!onNeuillyDeck((a[0]+d[0])/2,(a[1]+d[1])/2)){
    for(const sign of [-1,1]){
      const nx=-dz/len*sign*(w*.5+2.15),nz=dx/len*sign*(w*.5+2.15);
      b.wall('felt',[a[0]+nx,a[1]+nz],[d[0]+nx,d[1]+nz],-1.5,.67,'#b6aab0',len/3,1);
      b.tube([a[0]+nx,.85,a[1]+nz],[d[0]+nx,.85,d[1]+nz],.08,.08,'#787584',5,'plain');
    }
  }
}
const chunkSize=160;
function key(x,z){return Math.floor(x/chunkSize)+','+Math.floor(z/chunkSize);}
function makeIndex(){
  const groups=new Map(),towers=[];
  function get(x,z){const k=key(x,z);if(!groups.has(k))groups.set(k,{buildings:[],segments:[]});return groups.get(k);}
  for(const b of buildings){
    if(!b.poly?.length)continue;
    const [x,z]=mean(b.poly);
    if(b.h>68&&!specialFootprint(String(b.id),x,z))towers.push(b);else get(x,z).buildings.push(b);
  }
  for(const street of streets){
    const path=street.path||[];
    for(let i=0;i<path.length-1;i++){
      const p=path[i],q=path[i+1],parts=Math.max(1,Math.ceil(Math.hypot(p[0]-q[0],p[1]-q[1])/18));
      let a=p;
      for(let j=1;j<=parts;j++){
        const t=j/parts,d=[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
        get((a[0]+d[0])/2,(a[1]+d[1])/2).segments.push({a,d,street,i});a=d;
      }
    }
  }
  return {groups,towers};
}
function decoration(kind,variant) {
  const b=new Batch(),metal='#3c4e54',edge='#596967',brass='#ca9972';
  if(terracePanels[kind]){
    for(const panel of terracePanels[kind])b.face('felt',...panel.points,panel.color);
  }else if(kind==='tree'){
    const colors=[['#7e9f80','#94ad87','#aec39a'],['#94966d','#b1a676','#c5b88b'],['#698d80','#81a99a','#acc1a3']][variant%3];
    b.tube([0,.03,0],[.14,3.73,0],.24,.14,'#866957',8);
    b.tube([.09,2.25,0],[-.83,3.9,.15],.13,.07,'#806659',6);
    b.tube([.11,2.63,0],[.74,3.98,-.3],.115,.07,'#806659',6);
    b.ball(.07,4.67,0,1.82,2.04,1.69,colors[0],10,6);
    b.ball(-.89,4.28,.39,1.07,1.43,1.05,colors[1],8,5);
    b.ball(.74,4.93,.08,1.22,1.52,1.12,colors[1],8,5);
    b.ball(-.25,5.58,-.18,1.1,1.28,1.08,colors[2],9,5);
    b.tube([0,.04,0],[0,.12,0],.71,.68,'#797275',10);
  }else if(kind==='lamp'){
    b.tube([0,0,0],[0,.34,0],.32,.23,metal,9);
    b.tube([0,.3,0],[0,1.21,0],.17,.115,edge,9);
    b.tube([0,1.15,0],[0,4.0,0],.1,.065,metal,7);
    for(const y of [.39,.96,3.58,3.93])b.tube([0,y,0],[0,y+.09,0],.145,.135,brass,8);
    const yy=4.0;
    b.tube([0,yy,0],[0,yy+.18,0],.13,.24,metal,4);
    b.tube([0,yy+.18,0],[0,yy+.72,0],.245,.362,'#ffdc98',4);
    for(let i=0;i<4;i++){const a=i*tau/4;b.tube([.245*Math.cos(a),yy+.17,.245*Math.sin(a)],[.362*Math.cos(a),yy+.72,.362*Math.sin(a)],.027,.025,metal,5);}
    b.tube([0,yy+.72,0],[0,yy+.97,0],.43,.066,metal,4);
    b.ball(0,yy+1.03,0,.075,.12,.075,brass,6,3);
  }else if(kind==='bench'){
    b.box(0,.46,0,1.70,.13,.49,'#a67864');b.box(0,.83,.2,1.70,.34,.10,'#b68a6c');
    for(const x of [-.61,.61]){b.box(x,.01,.01,.085,.49,.52,metal);b.box(x,.35,.18,.072,.60,.07,metal);}
  }else if(kind==='hydrant'){
    b.tube([0,0,0],[0,.72,0],.21,.2,'#ad5c67',8);b.ball(0,.71,0,.235,.23,.235,'#c66c6b');
    b.tube([-.3,.45,0],[.3,.45,0],.10,.10,'#875767',8);
  }else if(kind==='postbox'){
    b.tube([0,0,0],[0,.79,0],.085,.068,metal,6);b.box(0,.77,0,.59,.62,.39,'#d6ac65');b.box(0,1.17,.2,.36,.035,.02,'#555363');
  }else if(kind==='bin'){
    b.tube([0,.03,0],[0,.88,0],.27,.34,'#557570',12);b.tube([0,.89,0],[0,.96,0],.36,.31,metal,12);
    b.tube([0,.955,0],[0,.969,0],.26,.26,'#333e49',12);
  }else{
    b.tube([0,0,0],[0,.71,0],.13,.11,metal,8);b.ball(0,.74,0,.135,.14,.135,'#a59088',8,4);
  }
  return b;
}
const deckStart=[203,-800],deckEnd=[447,-681];
function onNeuillyDeck(x,z){
  const dx=deckEnd[0]-deckStart[0],dz=deckEnd[1]-deckStart[1],cx=x-deckStart[0],cz=z-deckStart[1];
  const t=(cx*dx+cz*dz)/(dx*dx+dz*dz);
  return t>=-.03&&t<=1.03&&Math.abs(cx*dz-cz*dx)/Math.hypot(dx,dz)<23;
}
function neuillyDeck(b){
  const a=deckStart,d=deckEnd,dx=d[0]-a[0],dz=d[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  const offset=(p,n)=>[p[0]+nx*n,p[1]+nz*n];
  strip(b,'pave',a,d,41,.053,'#d1c8c2',4.5);
  strip(b,'road',a,d,30,.056,white,6);
  strip(b,'pave',a,d,3.3,.082,'#a6a2a7',3.1);
  for(const sign of [-1,1]){
    const v=offset(a,sign*20.4),parts=Math.ceil(len/12);
    const v3=(p,h)=>[p[0],h,p[1]];
    for(let j=0;j<parts;j++){
      const from=[v[0]+dx*j/parts,v[1]+dz*j/parts],to=[v[0]+dx*(j+1)/parts,v[1]+dz*(j+1)/parts];
      b.wall('felt',from,to,-1.7,.35,'#a8a0a6',len/(parts*3),1);
      b.tube(v3(from,.94),v3(to,.94),.09,.09,'#829295',6,'plain');
      b.tube(v3(from,.63),v3(to,.63),.047,.047,'#9da6a5',5,'plain');
    }
    for(let i=0;i<len;i+=4.8){const f=i/len,x=v[0]+dx*f,z=v[1]+dz*f;
      b.tube([x,.28,z],[x,.98,z],.045,.045,'#728389',5,'plain');}
    for(const offs of [.71,1.31])strip(b,'plain',a,d,.10,.088,'#b7aa9d',3,sign*offs);
  }
}
function makePlazas(b){
  // The Étoile's central forecourt and radial boulevards have separate pavements.
  for(let r=0;r<118;r+=10)ring(b,arc.x,arc.z,Math.max(.01,r),Math.min(118,r+10),.026,white,'road',112);
  ring(b,arc.x,arc.z,33.4,35.8,.082,'#e8d6c0','pave');
  for(let r=0;r<33.5;r+=7)ring(b,arc.x,arc.z,Math.max(.01,r),Math.min(33.5,r+7),.082,'#e0c8b9','pave');
  for(const r of [36.0,115.5])ring(b,arc.x,arc.z,r,r+.18,.086,'#d7c9b9');
  for(const r of [55,76,94]){
    for(let i=0;i<96;i++){
      const a=i*tau/96,b1=a+.023;
      const p=(x,n)=>[arc.x+x*Math.cos(n),arc.z+x*Math.sin(n)];
      b.quad('plain',[p(r,a),p(r,b1),p(r+.16,b1),p(r+.16,a)],.058,'#d7c7b3');
    }
  }
  // Central parvis paving is continuous below the two sides of the Grande Arche.
  const x=grande.x,z=grande.z,yaw=grande.yaw,pt=(a,d)=>[x+Math.cos(yaw)*a+Math.sin(yaw)*d,z-Math.sin(yaw)*a+Math.cos(yaw)*d];
  for(let a=-51;a<51;a+=12)for(let d=-57;d<172;d+=12){const x1=Math.min(a+12,51),z1=Math.min(d+12,172);b.quad('pave',[pt(a,d),pt(x1,d),pt(x1,z1),pt(a,z1)],.046,'#e1d8cd',5.15);}
}
function inRing(x,z,points){
  let yes=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],c=points[j];
    if((a[1]>z)!==(c[1]>z)&&x<(c[0]-a[0])*(z-a[1])/(c[1]-a[1])+a[0])yes=!yes;
  } return yes;
}
function surfaceAreas(features){
  return features.filter(a=>a.poly?.length>2).map(a=>{
    let minX=Infinity,minZ=Infinity,maxX=-Infinity,maxZ=-Infinity;
    for(const [x,z] of a.poly){minX=Math.min(x,minX);maxX=Math.max(x,maxX);minZ=Math.min(z,minZ);maxZ=Math.max(z,maxZ);}
    return {a,minX,maxX,minZ,maxZ,level:features===water?waterLevel(a):0};
  });
}
function containsArea(item,x,z){
  return x>=item.minX&&x<=item.maxX&&z>=item.minZ&&z<=item.maxZ&&inRing(x,z,item.a.poly)&&!(item.a.holes||[]).some(h=>inRing(x,z,h));
}
function groundTile(batch,x0,z0,n,lakes,parks){
  const near=item=>item.maxX>=x0&&item.minX<=x0+chunkSize&&item.maxZ>=z0&&item.minZ<=z0+chunkSize;
  const wet=lakes.filter(near),green=parks.filter(near),step=chunkSize/n,points=[];
  for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
    const x=x0+i*step,z=z0+j*step,lake=wet.find(q=>containsArea(q,x,z));
    points.push([x,lake?lake.level-.8:terrainHeight(x,z)-.07,z]);
  }
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const k=j*(n+1)+i,a=points[k],b=points[k+n+1],c=points[k+n+2],d=points[k+1];
    const park=green.some(q=>containsArea(q,a[0]+step*.5,a[2]+step*.5)),tex=park?4.7:5.3;
    const uv=[a,b,c,d].map(p=>[p[0]/tex,p[2]/tex]);
    batch.face(park?'felt':'pave',a,b,c,d,park?'#aebe91':'#e7d6c9',uv);
  }
}
function makeGround(b) {
  b.quad('pave',[[-13000,-12000],[-13000,13000],[17000,13000],[17000,-12000]],-.12,'#e7d6c9',5.3);

  for(const w of water){
    const poly=distinct(w.poly);if(poly.length<3)continue;
    b.base=waterLevel(w);
    flatWithHoles(b,'water',poly,w.holes,.004,'#769ca6');
    for(let i=0;i<poly.length;i++){
      const a=poly[i],d=poly[(i+1)%poly.length];
      const bank=Math.max(0,Math.min(5,terrainHeight(a[0],a[1])-b.base));
      b.wall('felt',a,d,-.12,bank,'#b69e92',Math.max(1,Math.hypot(d[0]-a[0],d[1]-a[1])/4),1);
      strip(b,'plain',a,d,1.05,.008,'#99abb0',2.5);
    }
    const px=poly.map(p=>p[0]),pz=poly.map(p=>p[1]),x0=Math.min(...px),z0=Math.min(...pz),x1=Math.max(...px),z1=Math.max(...pz);
    for(let z=z0+4;z<z1;z+=12)for(let x=x0+((Math.floor(z/11)%5)*4);x<x1;x+=24){
      if(!inRing(x,z,poly)||(w.holes||[]).some(h=>inRing(x,z,h)))continue;
      const seed=hash(Math.round(x)+','+Math.round(z));const l=1.0+(seed%25)*.18;
      b.quad('plain',[[x,z],[x+l,z+.8],[x+l+.4,z+.95],[x+.5,z+.29]],.012,seed%3?'#a9c2c2':'#688f9f');
    }
  }
  b.base=0;b.drape=true;makePlazas(b);neuillyDeck(b);
}
// A reusable outer mesh carries the skyline beyond the high-detail street chunks.
function distantGround(root){
  const spacing=80,n=44,geometry=new T.PlaneGeometry(n*spacing,n*spacing,n,n);
  geometry.rotateX(-Math.PI/2);
  const positions=geometry.getAttribute('position'),indices=geometry.getIndex(),outer=[];
  for(let i=0;i<indices.count;i+=3){
    const a=indices.getX(i),b=indices.getX(i+1),c=indices.getX(i+2);
    if(Math.hypot(positions.getX(a),positions.getZ(a))>360)outer.push(a,b,c);
  }
  geometry.setIndex(outer);
  const material=new T.MeshLambertMaterial({color:'#c4b1a1'}),mesh=new T.Mesh(geometry,material);
  root.add(mesh);let lastX=Infinity,lastZ=Infinity;
  return {update(x,z){
    const cx=spacing*Math.round(x/spacing),cz=spacing*Math.round(z/spacing);
    if(cx===lastX&&cz===lastZ)return;
    lastX=cx;lastZ=cz;
    for(let i=0;i<positions.count;i++){
      const px=cx+positions.getX(i),pz=cz+positions.getZ(i);
      // Stay beneath the fine mesh and the shoreline where the two resolutions overlap.
      const h=Math.min(terrainHeight(px,pz),terrainHeight(px-30,pz),terrainHeight(px+30,pz),terrainHeight(px,pz-30),terrainHeight(px,pz+30))-8;
      positions.setY(i,h);
    }
    positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();mesh.position.set(cx,0,cz);
  },dispose(){material.dispose();}};
}
function pickProps(props,pos,visibleLimit){
  const found=[];
  for(const p of props||[]){
    const dist=(p.x-pos.x)**2+(p.y-pos.y)**2;
    if(dist<=visibleLimit**2)found.push([dist,p]);
  }
  found.sort((a,b)=>a[0]-b[0]);
  return found.slice(0,460).map(pair=>pair[1]);
}
function disposeGroup(group){
  group.traverse(n=>{if(n.geometry)n.geometry.dispose();});group.removeFromParent();
}
export function createCity3D(scene){
  const materials=cityMaterials(), index=makeIndex(),root=new T.Group();root.name='Maille City · Paris';
  const terrain=new Batch();makeGround(terrain);root.add(terrain.mesh(materials));
  const distant=distantGround(root);
  function landmark(batch,site,yaw=site.yaw||0,scale=1){
    const g=batch.mesh(materials);g.rotation.y=yaw;g.position.set(site.x,terrainHeight(site.x,site.z),site.z);g.scale.setScalar(scale);root.add(g);
  }
  landmark(historicArch(),arc);landmark(futureArch(),grande);
  for(const site of parisLandmarks)landmark(famousLandmark(site.key,Batch),site);
  for(const building of buildings){
    if(!LouvreIds.has(String(building.id)))continue;
    const poly=building.poly,[x,z]=mean(poly),a=poly[0],c=poly[1];
    const side=Math.hypot(c[0]-a[0],c[1]-a[1]);
    landmark(pyramidForm(),{x,z},-Math.atan2(c[1]-a[1],c[0]-a[0]),String(building.id)==='245184969'?1:side/35);
  }
  if(buildings.some(b=>String(b.id)==='245198908'))landmark(obeliskForm(),obelisk,-.38);
  const towerBatch=new Batch();
  for(const b of index.towers)addBuilding(towerBatch,b,false);
  root.add(towerBatch.mesh(materials));
  scene.add(root);
  const chunks=new Map(), propGroups=new Map(), propModels=new Map(), helper=new T.Object3D();
  let lastX=Infinity,lastZ=Infinity,targets=[],tick=0,propX=Infinity,propZ=Infinity,destroyCount=-1,stamp=0,lastPropCount=-1;
  const groundShadows=new T.InstancedMesh(new T.CircleGeometry(1,12),new T.MeshBasicMaterial({color:0x695666,transparent:true,opacity:.19,depthWrite:false,side:T.DoubleSide}),460);
  groundShadows.count=0;groundShadows.frustumCulled=false;groundShadows.renderOrder=1;root.add(groundShadows);
  const lakes=surfaceAreas(water),parks=surfaceAreas(source.green||[]);
  function buildChunk(target){
    const geo=index.groups.get(target.key)||{buildings:[],segments:[]};
    const b=new Batch();
    const [ix,iz]=target.key.split(',').map(Number);
    groundTile(b,ix*chunkSize,iz*chunkSize,target.detail?16:8,lakes,parks);
    for(const building of geo.buildings)addBuilding(b,building,target.detail);
    for(const seg of geo.segments)addRoad(b,seg);
    const object=b.mesh(materials);root.add(object);
    const before=chunks.get(target.key);if(before)disposeGroup(before.object);
    chunks.set(target.key,{object,detail:target.detail,dist:target.dist});
  }
  function setTargets(pos){
    const sx=Math.floor(pos.x/chunkSize),sz=Math.floor(pos.y/chunkSize),keys=new Set(),next=[];
    for(let i=-4;i<=4;i++)for(let j=-4;j<=4;j++){
      const cx=sx+i,cz=sz+j,k=cx+','+cz;
      const dd=Math.hypot((cx+.5)*chunkSize-pos.x,(cz+.5)*chunkSize-pos.y);
      if(dd>640)continue;
      const detail=dd<245,target={key:k,detail,dist:dd};keys.add(k);next.push(target);
    }
    for(const [k,entry] of chunks)if(!keys.has(k)){disposeGroup(entry.object);chunks.delete(k);}
    targets=next.filter(t=>!chunks.has(t.key)||chunks.get(t.key).detail!==t.detail).sort((a,b)=>a.dist-b.dist);
    lastX=pos.x;lastZ=pos.y;
  }
  function propSet(kind,variant){
    const k=kind+variant;if(propModels.has(k))return propModels.get(k);
    const group=decoration(kind,variant).mesh(materials),instances=[];
    for(const templ of group.children){
      const mesh=new T.InstancedMesh(templ.geometry,templ.material,460);mesh.count=0;mesh.frustumCulled=false;
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);instances.push(mesh);
    }
    propModels.set(k,instances);return instances;
  }
  function updateProps(pos,state){
    propGroups.clear();let shadowIndex=0;
    for(const prop of pickProps(state?.props,pos,220)){
      if(state.destroyed?.has?.(prop.id))continue;
      const type=prop.type||prop.kind||'bollard',h=hash(prop.id),variant=type==='tree'?h%3:0,k=type+variant;
      if(!propGroups.has(k))propGroups.set(k,{items:[],type,variant});
      propGroups.get(k).items.push(prop);
      const tree=type==='tree',lamp=type==='lamp',radius=tree?1.38:lamp?.42:.45;
      helper.position.set(prop.x+radius*.55,terrainHeight(prop.x+radius*.55,prop.y+radius*.13)+.105,prop.y+radius*.13);helper.rotation.set(-Math.PI/2,0,-.30);
      helper.scale.set(radius*(tree?1.8:1.5),radius*.76,1);helper.updateMatrix();
      if(shadowIndex<460)groundShadows.setMatrixAt(shadowIndex++,helper.matrix);
    }
    groundShadows.count=shadowIndex;groundShadows.instanceMatrix.needsUpdate=true;
    for(const list of propModels.values())for(const m of list)m.count=0;
    for(const {items,type,variant} of propGroups.values()){
      const meshes=propSet(type,variant);
      items.forEach((p,i)=>{
        const h=hash(p.id),scale=type==='tree'?.87+(h%41)/100:1;
        helper.position.set(p.x,terrainHeight(p.x,p.y),p.y);helper.rotation.set(0,p.angle===undefined?(h%628)/100:-p.angle,0);helper.scale.setScalar(scale);helper.updateMatrix();
        for(const m of meshes)m.setMatrixAt(i,helper.matrix);
      });
      for(const m of meshes){m.count=items.length;m.instanceMatrix.needsUpdate=true;}
    }
  }
  const update=(pos,time,worldState={})=>{
    if(!pos||!Number.isFinite(pos.x+pos.y))return;
    const initial=lastX===Infinity;distant.update(pos.x,pos.y);
    if(initial||Math.hypot(lastX-pos.x,lastZ-pos.y)>38)setTargets(pos);
    const start=performance.now();let count=0;
    while(targets.length&&count<(initial?2:3)&&(count===0||performance.now()-start<(initial?26:4))){buildChunk(targets.shift());count++;}
    tick++;const size=worldState.destroyed?.size||0,n=worldState.props?.length||0;
    if(stamp===0||Math.hypot(propX-pos.x,propZ-pos.y)>2.8||size!==destroyCount||n!==lastPropCount||tick-stamp>=33){
      updateProps(pos,worldState);propX=pos.x;propZ=pos.y;destroyCount=size;lastPropCount=n;stamp=tick;
    }
  };
  return {update,dispose(){
    disposeGroup(root);distant.dispose();groundShadows.material.dispose();
    for(const m of Object.values(materials)){m.map?.dispose();m.dispose();}
  }};
}
