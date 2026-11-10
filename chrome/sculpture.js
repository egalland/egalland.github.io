// All castings share the same closed geometry on GPUs and on the CPU fallback.
// A signed distance field follows the original lettering and badge outlines.
import {metalGPU} from './metal-gpu.js';
import {atlasGlobe,filmReel,openBook} from './project-objects.js';
import {drawEmblem} from './glyph.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const emblemCache=new Map();
function distance(alpha,w,h,inside){
 const d=Float32Array.from(alpha,v=>(v>=128)===inside?0:1e4);
 for(let i=w+1;i<d.length-w;i++)d[i]=Math.min(d[i],d[i-1]+1,d[i-w]+1,d[i-w-1]+1.414,d[i-w+1]+1.414);
 for(let i=d.length-w-2;i>=w;i--)d[i]=Math.min(d[i],d[i+1]+1,d[i+w]+1,d[i+w-1]+1.414,d[i+w+1]+1.414);
 return d;
}
export function cast(mask,thickness){
 const w=mask.width,h=mask.height,ctx=mask.getContext('2d'),rgba=ctx.getImageData(0,0,w,h).data;
 const alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];
 const outside=distance(alpha,w,h,false),inside=distance(alpha,w,h,true);
 const d=outside.map((v,i)=>v-inside[i]+alpha[i]/255-.5);
 let crown=d.map(v=>Math.sqrt(Math.max(0,v))*thickness*.75);
 for(let k=0;k<12;k++){
  const src=crown;crown=src.slice();
  for(let i=w+1;i<src.length-w-1;i++)crown[i]=(src[i]*4+src[i-1]+src[i+1]+src[i-w]+src[i+w])/8;
 }
 const vertices=[],faces=[],verts=new Map(),cuts=new Map(),walls=[];
 function add(x,y,z,nx,ny,nz){
  const len=Math.hypot(nx,ny,nz)||1,idx=vertices.length/6;
  vertices.push(x-w/2,y-h/2,z,nx/len,ny/len,nz/len);return idx;
 }
 function front(i){
  if(verts.has(i))return verts.get(i);
  const idx=add(i%w,Math.floor(i/w),thickness+crown[i],(crown[i-1]-crown[i+1])*.5,(crown[i-w]-crown[i+w])*.5,1);
  verts.set(i,idx);return idx;
 }
 function edge(a,b){
  const key=Math.min(a,b)*d.length+Math.max(a,b);
  if(cuts.has(key))return cuts.get(key);
  const t=d[a]/(d[a]-d[b]),x=(a%w)*(1-t)+(b%w)*t,y=Math.floor(a/w)*(1-t)+Math.floor(b/w)*t;
  const nearest=Math.round(y)*w+Math.round(x);
  const nx=d[nearest-1]-d[nearest+1],ny=d[nearest-w]-d[nearest+w];
  const top=add(x,y,thickness,nx,ny,.35);
  const side=add(x,y,thickness,nx,ny,0),back=add(x,y,-thickness,nx,ny,-.18);
  cuts.set(key,top);walls[top]=[side,back];return top;
 }
 function triangle(a,b,c){
  if(d[a]<=0&&d[b]<=0&&d[c]<=0)return;
  if(d[a]>0&&d[b]>0&&d[c]>0){faces.push(front(a),front(b),front(c));return}
  const poly=[],rim=[];
  for(const [s,e] of [[a,b],[b,c],[c,a]]){
   if(d[s]>0)poly.push(front(s));
   if((d[s]>0)!==(d[e]>0)){const v=edge(s,e);poly.push(v);rim.push(v)}
  }
  for(let i=1;i+1<poly.length;i++)faces.push(poly[0],poly[i],poly[i+1]);
  if(rim.length===2){
   const [u,v]=rim.map(i=>walls[i]);faces.push(u[0],v[0],v[1],u[0],v[1],u[1]);
  }
 }
 for(let y=2;y<h-3;y+=2)for(let x=2;x<w-3;x+=2){
  const a=y*w+x,b=a+2,c=a+2*w,e=c+2;
  triangle(a,b,e);triangle(a,e,c);
 }
 // Mirror the crown for the back of the casting.
 const frontFaces=faces.length,offset=vertices.length/6;
 for(let i=0;i<offset*6;i+=6)vertices.push(vertices[i],vertices[i+1],-vertices[i+2],vertices[i+3],vertices[i+4],-vertices[i+5]);
 for(let i=0;i<frontFaces;i+=3)if(vertices[6*faces[i]+5]>0&&vertices[6*faces[i+1]+5]>0&&vertices[6*faces[i+2]+5]>0)
  faces.push(faces[i]+offset,faces[i+2]+offset,faces[i+1]+offset);
 // A jump ring goes through a solid point close to the upper contour.
 let top=h;for(let i=0;i<alpha.length;i++)if(alpha[i]>190)top=Math.min(top,Math.floor(i/w));
 let eye=w/2,best=Infinity,eyeY=top;
 for(let y=top+2;y<Math.min(h,top+h*.09);y++)for(let x=0;x<w;x++){
  const score=Math.abs(x-w*.5)+.7*(y-top);
  if(d[y*w+x]>1.5&&score<best){best=score;eye=x;eyeY=y}
 }
 return {w,h,eye:[eye-w/2,eyeY-h/2,thickness],v:new Float32Array(vertices),tri:new Uint16Array(faces)};
}
export function emblem(id){
 if(!emblemCache.has(id)&&id==='atlas')emblemCache.set(id,atlasGlobe());
 if(!emblemCache.has(id)&&id==='livre')emblemCache.set(id,openBook());
 if(!emblemCache.has(id)){
  const c=document.createElement('canvas');c.width=234;c.height=189;
  const p=c.getContext('2d');p.translate(117,94.5);p.scale(.60,.60);p.translate(-240,-160);drawEmblem(p,id);
  const plate=cast(c,6.2);emblemCache.set(id,id==='pills'?filmReel(plate):plate);
 }
 return emblemCache.get(id);
}

// Interpolated metal studio, with broad white softboxes and two colored walls.
const stops=[[-1,31,34,52],[-.77,110,156,177],[-.56,225,244,246],[-.38,255,255,247],[-.20,156,176,191],[-.10,55,52,72],[.02,22,19,34],[.22,91,41,57],[.43,183,98,108],[.60,249,210,192],[.72,255,253,238],[.82,158,177,196],[1,50,66,84]];
const env=new Uint8Array(1024*3);
for(let i=0;i<1024;i++){
 const y=i/511.5-1;let j=1;while(j<stops.length-1&&y>stops[j][0])j++;
 const a=stops[j-1],b=stops[j],t=(y-a[0])/(b[0]-a[0]);
 for(let k=0;k<12;k++)env[i*3+k]=a[k+1]+(b[k+1]-a[k+1])*t;
}
const buffers=new WeakMap();
let gpu;
export function drawCast(canvas,m,{yaw=-.28,pitch=.09,lx=-.5,ly=-.35,power=.1,scale=.88}={}){
 const w=canvas.width,h=canvas.height;
 let buf=buffers.get(canvas);
 if(!buf||buf.w!==w||buf.h!==h||buf.projected.length!==m.v.length){
  const ctx=canvas.getContext('2d'),img=ctx.createImageData(w,h);
  buf={w,h,ctx,img,depth:new Float32Array(w*h),projected:new Float32Array(m.v.length),data:new Uint32Array(img.data.buffer)};buffers.set(canvas,buf);
 }
 const key=[yaw,pitch,lx,ly,power,scale].map(n=>Math.round(n*70)).join(',');
 if(buf.key===key&&buf.model===m)return;
 buf.key=key;buf.model=m;
 if(gpu===undefined){try{gpu=metalGPU(env)}catch{gpu=null}}
 if(gpu&&gpu(canvas,m,yaw,pitch,lx,ly,power,scale))return;
 buf.data.fill(0);buf.depth.fill(-Infinity);
 const sx=Math.sin(pitch),cx=Math.cos(pitch),sy=Math.sin(yaw),cy=Math.cos(yaw);
 const zoom=Math.min(w/m.w,h/m.h)*scale,V=m.v,P=buf.projected;
 for(let i=0;i<V.length;i+=6){
  const x=cy*V[i]+sy*V[i+2],z=cy*V[i+2]-sy*V[i];
  P[i]=w*.5+zoom*x;P[i+1]=h*.5+zoom*(cx*V[i+1]-sx*z);P[i+2]=sx*V[i+1]+cx*z;
  const nx=cy*V[i+3]+sy*V[i+5],rotZ=cy*V[i+5]-sy*V[i+3],ny=cx*V[i+4]-sx*rotZ,nz=sx*V[i+4]+cx*rotZ;
  // Reflecting a view vector is invariant under a normal's sign.
  const sign=nz<0?-1:1;
  P[i+3]=nx*sign;P[i+4]=ny*sign;P[i+5]=Math.abs(nz);

 }
 const palette=buf.palette??=new Uint32Array(128*128);
 const lightKey=[lx,ly,power].map(v=>Math.round(v*35)).join(',');
 if(buf.lightKey!==lightKey){
  buf.lightKey=lightKey;
  for(let iv=0;iv<128;iv++)for(let iu=0;iu<128;iu++){
   const nx=iu/63.5-1,ny=iv/63.5-1,nz=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));
   const rx=2*nx*nz,ry=2*ny*nz,rz=2*nz*nz-1;
   const k=Math.round((clamp(ry*.88+rx*.19+ly*.16,-1,1)+1)*511.5)*3;
   const strip=.74*Math.exp(-10*Math.abs(rx+.29*rz-.23*lx));
   const dx=rx-.58*lx+.22*rz,dy=ry-.55*ly,lamp=Math.exp(-5.6*(dx*dx+dy*dy))*power;
   let color=0xff000000;
   for(let c=0;c<3;c++){
    const tone=env[k+c]*(.67+.33*nz);
    color|=(clamp(tone+(255-tone)*strip+lamp*(c===0?105:c===1?192:215),0,255)|0)<<(c*8);
   }
   palette[iv*128+iu]=color;
  }
 }
 const T=m.tri,D=buf.depth,rgba=buf.data;
 for(let t=0;t<T.length;t+=3){
  const a=T[t]*6,b=T[t+1]*6,c=T[t+2]*6,ax=P[a],ay=P[a+1],bx=P[b],by=P[b+1],ex=P[c],ey=P[c+1];
  const det=(bx-ax)*(ey-ay)-(by-ay)*(ex-ax);if(Math.abs(det)<.015)continue;
  const loX=Math.max(0,Math.floor(Math.min(ax,bx,ex))),hiX=Math.min(w-1,Math.ceil(Math.max(ax,bx,ex)));
  const loY=Math.max(0,Math.floor(Math.min(ay,by,ey))),hiY=Math.min(h-1,Math.ceil(Math.max(ay,by,ey)));
  const du=(ey-ay)/det,dv=(ay-by)/det;
  for(let y=loY;y<=hiY;y++){
   let u=((loX+.5-ax)*(ey-ay)-(y+.5-ay)*(ex-ax))/det,v=((bx-ax)*(y+.5-ay)-(by-ay)*(loX+.5-ax))/det;
   for(let x=loX;x<=hiX;x++,u+=du,v+=dv){
    const a0=1-u-v;if(u<-.0001||v<-.0001||a0<-.0001)continue;
    const z=a0*P[a+2]+u*P[b+2]+v*P[c+2],pos=y*w+x;if(z<D[pos])continue;D[pos]=z;
    const nx=a0*P[a+3]+u*P[b+3]+v*P[c+3],ny=a0*P[a+4]+u*P[b+4]+v*P[c+4],nz=a0*P[a+5]+u*P[b+5]+v*P[c+5];
    const norm=63.5/Math.sqrt(nx*nx+ny*ny+nz*nz||1);
    rgba[pos]=palette[(64+ny*norm|0)*128+(64+nx*norm|0)];

   }
  }
 }
 buf.ctx.putImageData(buf.img,0,0);
}
