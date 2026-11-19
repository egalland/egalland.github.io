import {motionSeed,sampleLocomotion,linkedPose,kikalmoAnchors} from './locomotion-pose.js';
import {getKikalmoLook,kikalmoFrame} from './kikalmo-avatar.js';
import {kikalmoShell,costumeThreads} from './kikalmo-shell.js';

const views=new WeakMap(),tau=Math.PI*2;
// Costumes are painted as a whole outfit. At the silhouette the depth shell has
// only its outermost texel; stretching that texel across the side produces a
// different horizontal stripe on every row. Turn the two authored textile
// panels as rounded three-quarter sprites, keeping the actual heading for the rig.
function costumePanels(shell,rear,out,z,sin,cos,meter){
  const {w,h,pixels:front,rowDepth}=shell,W=out.width,dst=out.data;
  const half=(w-1)/2,width=1-.26*Math.abs(sin),side=Math.sign(sin);
  const shift=.31*sin;
  function sourceColumn(screen){
    // Invert x = width*u + shift*(1-u²); the outer contour stays anchored
    // while the centre of a hood, face or lapel travels around its volume.
    const root=Math.sqrt(Math.max(0,width*width-4*shift*(screen-shift)));
    return (1+2*(screen-shift)/(width+root))*half;
  }
  for(let x=0;x<W;x++){
    const screen=(x-(W-1)*.5)/half;
    if(Math.abs(screen)>width)continue;
    const fx=sourceColumn(screen),bx=(w-1)-fx;
    const reveal=side*screen-1.65*cos+.42*Math.abs(sin);
    const t=Math.max(0,Math.min(1,(reveal+.12)/.24)),frontWeight=t*t*(3-2*t);
    const shade=1-.075*Math.abs(sin)*(1-side*screen)*.5;
    const colFront=Math.max(0,Math.min(w-1,Math.round(fx))),colBack=Math.max(0,Math.min(w-1,Math.round(bx)));
    const round=Math.sqrt(Math.max(0,1-(screen/width)**2));
    for(let y=0;y<h;y++){
      const f=(y*w+colFront)*4,b=(y*w+colBack)*4,k=y*W+x;
      const fa=front[f+3]*frontWeight,ba=rear[b+3]*(1-frontWeight),alpha=fa+ba;
      if(alpha<1)continue;
      for(let ch=0;ch<3;ch++)dst[k*4+ch]=(front[f+ch]*fa+rear[b+ch]*ba)*shade/alpha;
      dst[k*4+3]=alpha;z[k]=round*rowDepth[y]/meter;
    }
  }
}
function turntable(art,theta){
  let cache=views.get(art);if(!cache){cache=new Map();views.set(art,cache);}
  const angle=((Math.round(theta/tau*24)%24)+24)%24;
  if(cache.has(angle))return cache.get(angle);
  const shell=kikalmoShell(art),{w,h,depth,dims,pixels:front}=shell;
  const rear=art.rear.getContext('2d').getImageData(0,0,w,h).data;
  const sin=Math.sin(angle*tau/24),cos=Math.cos(angle*tau/24);
  const meter=dims.height/h,W=Math.ceil(Math.hypot(w,.85/meter))+4;
  const c=document.createElement('canvas');c.width=W;c.height=h;
  const g=c.getContext('2d'),out=g.createImageData(W,h),d=out.data,z=new Float32Array(W*h).fill(-Infinity);
  function segment(y,i,j,side,other){
    const aa=i*4,bb=j*4;
    const im=side===1?front:rear,im2=other===1?front:rear;
    const x1=side*depth[i]*(side===1?1:.83)/meter,x2=other*depth[j]*(other===1?1:.83)/meter;
    const a=i%w-(w-1)*.5,b=j%w-(w-1)*.5;
    const u=W*.5-a*cos+x1*sin,v=W*.5-b*cos+x2*sin;
    const near1=-x1*cos-a*sin,near2=-x2*cos-b*sin;
    const left=Math.max(0,Math.round(Math.min(u,v))),right=Math.min(W-1,Math.round(Math.max(u,v)));
    for(let dst=left;dst<=right;dst++){
      const f=Math.max(0,Math.min(1,(dst-u)/(v-u||1))),dist=near1+(near2-near1)*f,k=y*W+dst;
      if(dist<z[k])continue;z[k]=dist;
      const shade=(1-.10*Math.abs(sin))*(other!==side?.80:1),n=k*4;
      for(let ch=0;ch<3;ch++)d[n+ch]=(im[aa+ch]+(im2[bb+ch]-im[aa+ch])*f)*shade;
      d[n+3]=Math.max(im[aa+3],im2[bb+3]);
    }
  }
  if(art.appearance.costume)costumePanels(shell,rear,out,z,sin,cos,meter);
  else for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=y*w+x;if(front[i*4+3]<30)continue;
      if(x===0||front[(i-1)*4+3]<30)segment(y,i,i,-1,1);
      if(x===w-1||front[(i+1)*4+3]<30){segment(y,i,i,1,-1);continue;}
      segment(y,i,i+1,-1,-1);segment(y,i,i+1,1,1);
    }
  }
  g.putImageData(out,0,0);
  const result={c,width:W*meter,height:dims.height,bottom:dims.bottom};
  if(art.appearance.costume){
    result.pixels=new Uint32Array(out.data.buffer,out.data.byteOffset,W*h);
    // Cache the visible surface of the turntable on a small cloth mesh. Its
    // side panels can follow a raised arm without also stretching the face.
    const xs=[0,.22,.36,.5,.64,.78,1],ys=[0,.26,.40,.52,.67,.79,.90,1];
    result.rows=ys.map(f=>xs.map(u=>{
      const px=u*W,py=f*h,ix=Math.min(W-1,Math.floor(px)),iy=Math.min(h-1,Math.floor(py));
      const lateral=(px-W*.5)*meter,dist=z[iy*W+ix];
      const d=Number.isFinite(dist)?dist*meter:0;
      const pos=[lateral*sin-d*cos,dims.bottom+(1-f)*dims.height,lateral*cos+d*sin];
      const up=pos[1],side=pos[2]<0?0:1;
      const leg=Math.min(1,Math.max(0,(.56-up)/.29));
      const arm=Math.min(1,Math.max(0,(Math.abs(pos[2])-.18)/.18))*Math.min(1,Math.max(0,(up-.46)/.16),Math.max(0,(1.21-up)/.17));
      return {px,py,pos,side,leg,arm};
    }));
  }
  cache.set(angle,result);if(cache.size>10)cache.delete(cache.keys().next().value);
  return result;
}
function limb(g,a,b,r,color){
  g.beginPath();g.moveTo(...a);g.lineTo(...b);
  g.strokeStyle='rgba(53,40,54,.8)';g.lineWidth=r*2.20;g.stroke();
  g.strokeStyle=color;g.lineWidth=r*2;g.stroke();
  // A single light strand rounds a sleeve even when a small screen drops fine detail.
  g.strokeStyle='rgba(255,235,199,.26)';g.lineWidth=r*.43;g.beginPath();
  g.moveTo(a[0]-r*.27,a[1]-r*.16);g.lineTo(b[0]-r*.27,b[1]-r*.16);g.stroke();
}
function bead(g,p,rx,ry,col){
  g.fillStyle=col;g.beginPath();g.ellipse(p[0],p[1],rx,ry,0,0,tau);g.fill();
}
// Rasterize each little cloth triangle into a reusable sprite. A full costume
// costs a single composite on the scene canvas even when both sleeves are bent.
let clothLayer;
function clothTriangle(target,view,a,b,c,pa,pb,pc){
  const [ax,ay]=pa,[bx,by]=pb,[cx,cy]=pc;
  const area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
  if(Math.abs(area)<.01)return;
  const dux=(b.px-a.px)*(cy-ay)/area,duy=-(b.px-a.px)*(cx-ax)/area;
  const dvx=-(c.py-a.py)*(by-ay)/area,dvy=(c.py-a.py)*(bx-ax)/area;
  const left=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5)),right=Math.min(target.w-1,Math.floor(Math.max(ax,bx,cx)-.5));
  const top=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5)),bottom=Math.min(target.h-1,Math.floor(Math.max(ay,by,cy)-.5));
  const invWidth=1/(b.px-a.px),invHeight=1/(c.py-a.py);
  const W=view.c.width,H=view.c.height,src=view.pixels,dst=target.pixels;
  for(let y=top;y<=bottom;y++){
    let u=a.px+(left+.5-ax)*dux+(y+.5-ay)*duy,v=a.py+(left+.5-ax)*dvx+(y+.5-ay)*dvy;
    let k=y*target.w+left;
    for(let x=left;x<=right;x++,k++,u+=dux,v+=dvx){
      const across=(u-a.px)*invWidth,down=(v-a.py)*invHeight;
      if(across<0||down<0||across+down>1)continue;
      const color=src[Math.min(H-1,v|0)*W+Math.min(W-1,u|0)];
      if(color)dst[k]=color;
    }
  }
}
function drawCostume(g,view,rig,gait,m,sin,cos){
  const ppm=Math.min(view.c.height/view.height,m>70?89:53);
  const w=Math.ceil((view.width+.9)*ppm),h=Math.ceil((view.height+.65)*ppm),base=Math.ceil((view.height+view.bottom+.30)*ppm);
  // Keep a single high-water-mark backing store for every visible player.
  if(!clothLayer||clothLayer.w<w||clothLayer.h<h){
    const c=document.createElement('canvas');
    c.width=Math.max(w,clothLayer?.w||0);c.height=Math.max(h,clothLayer?.h||0);
    const ctx=c.getContext('2d'),im=ctx.createImageData(c.width,c.height);
    clothLayer={c,ctx,im,w:c.width,h:c.height,pixels:new Uint32Array(im.data.buffer,im.data.byteOffset,c.width*c.height)};
  }
  const layer=clothLayer;layer.pixels.fill(0);
  const {rows}=view;
  function point(v){
    const {pos:[x,y,z],side,arm,leg}=v;
    const height=(y-.46)*(1+gait.squash);
    const twist=gait.twist*Math.max(0,Math.min(1,(y-.45)/.43));
    let xx=x+z*Math.sin(twist)+height*Math.sin(gait.lean),yy=.46+gait.bob+height*Math.cos(gait.lean)-z*Math.sin(gait.roll);
    let zz=z*Math.cos(twist)+height*Math.sin(gait.roll);
    if(arm||leg){
      const isArm=arm>leg,index=(isArm?3:5)+side;
      // The catalog contains long dresses, coats and one-piece costumes: the
      // fabric follows the limb loosely and keeps its original painted folds.
      const weight=isArm?.44*arm:.54*leg;
      const chain=isArm?rig.arms[side]:rig.legs[side];
      const length=isArm?.36:.375;
      const [ax,ay,az]=kikalmoAnchors[index];
      const along=Math.max(0,Math.min(1,(ay-y)/length)),j=along>.5?1:0,t=along*2-j;
      const p=chain[j],q=chain[j+1];
      xx+=(p[0]+(q[0]-p[0])*t+x-ax-xx)*weight;
      yy+=(p[1]+(q[1]-p[1])*t+y-ay+along*length-yy)*weight;
      zz+=(p[2]+(q[2]-p[2])*t+z-az-zz)*weight;
    }
    return [w*.5+((v.px/view.c.width-.5)*view.width+(xx-x)*sin+(zz-z)*cos)*ppm,base-(yy+(xx-x)*cos*.12)*ppm];
  }
  let upper=rows[0].map(point);
  for(let i=1;i<rows.length;i++){
    const us=rows[i-1],ls=rows[i],lower=ls.map(point);
    for(let j=0;j<ls.length-1;j++){
      clothTriangle(layer,view,us[j],us[j+1],ls[j],upper[j],upper[j+1],lower[j]);
      clothTriangle(layer,view,ls[j+1],ls[j],us[j+1],lower[j+1],lower[j],upper[j+1]);
    }
    upper=lower;
  }
  layer.ctx.putImageData(layer.im,0,0,0,0,w,h);
  const scale=m/ppm;
  g.drawImage(layer.c,0,0,w,h,-w*.5*scale,-base*scale,w*scale,h*scale);
}
const clothing=['#a17176','#768a6a','#745e77','#445d76','#ad7048','#917b63'];
export function drawKikalmoPuppet(g,e,x,ground,height,t,theta){
  const pose=e.pose||e,frame=kikalmoFrame(e.appearance,t);
  const art=getKikalmoLook(e.appearance,frame)?.art||getKikalmoLook(e.appearance,0)?.art;
  if(!art)return false;
  const a=art.appearance;
  const view=turntable(art,theta),m=height/1.78,cos=Math.cos(theta),sin=Math.sin(theta);
  const gait=sampleLocomotion(pose,t,motionSeed(e.id??e.seed)),rig=linkedPose(pose,gait,t);
  const rag=e.ragdoll||pose.ragdoll,b=rag?.blend||0;
  const threads=a.costume&&(gait.footSide||gait.handSide)?costumeThreads(art):null;
  const project=p=>[(p[0]*sin+p[2]*cos)*m,(-p[1]-p[0]*cos*.14)*m];
  const blend=(joint,p)=>{const v=rag?.[joint];return v&&b?p.map((n,i)=>n+(v[i]-n)*b):p;};
  g.save();g.translate(x,ground);g.lineCap='round';
  function arm(s){
    const side=s>0?1:0,n=side?'right':'left',arm=rig.arms[side];
    const [p,q,r]=['Shoulder','Elbow','Hand'].map((joint,i)=>project(blend(n+joint,arm[i])));
    limb(g,p,q,.072*m,threads?.sleeve||clothing[a.outfit]||clothing[0]);limb(g,q,r,.054*m,threads?.sleeve||a.color);
    const glove=threads?'#efcfaa':a.color;
    if(threads)bead(g,r,.091*m,.087*m,'#5d4748');
    bead(g,r,.078*m,.075*m,glove);
    if(threads)bead(g,[r[0]+s*m*.039,r[1]+.043*m],.040*m,.042*m,glove);
  }
  function leg(s){
    const side=s>0?1:0,n=side?'right':'left',leg=rig.legs[side];
    const [hip,knee,foot]=['Hip','Knee','Foot'].map((joint,i)=>project(blend(n+joint,leg[i])));
    limb(g,hip,knee,.071*m,threads?.boot||'#59505c');limb(g,knee,foot,.064*m,threads?.boot||'#554c58');
    if(threads)bead(g,[foot[0]+sin*.035*m,foot[1]+.03*m],.116*m,.050*m,'#42333c');
    bead(g,[foot[0]+sin*.035*m,foot[1]],.109*m,.056*m,threads?.boot||'#4b3e45');
  }
  // A punch thrown away from the chase camera disappears behind the wearer.
  // Paint the sleeve before the cloth so only the part beyond its silhouette shows.
  const away=cos>.58,backArm=sin>0?-1:1,frontArm=-backArm;
  const hiddenByBody=s=>away&&gait.handSide===s;
  if(!a.costume){
    leg(-1);leg(1);arm(backArm);
    if(hiddenByBody(frontArm))arm(frontArm);
  }else if(!b&&away){
    if(gait.handSide)arm(gait.handSide);
    if(gait.footSide)leg(gait.footSide);
  }
  const width=view.width*m,H=view.height*m,bottom=view.bottom*m;
  if(b&&rag?.head&&rag?.hips){
    const hip=project(blend('hips',[0,.46,0])),head=project(blend('head',[0,1.28,0]));
    g.save();g.translate(...hip);g.rotate(Math.atan2(head[0]-hip[0],hip[1]-head[1]));
    g.drawImage(view.c,-width*.5,-bottom-H+.46*m,width,H);g.restore();
  }else if(view.rows&&height>=42&&(gait.effort>.025||gait.pace>.1||pose.emote||pose.fire)){
    drawCostume(g,view,rig,gait,m,sin,cos);
  }else{
    g.save();g.translate(0,-(.46+gait.bob)*m);g.rotate(gait.lean*sin+gait.roll*cos);
    g.scale(1-gait.squash*.5,1+gait.squash);
    g.drawImage(view.c,-width*.5,-bottom-H+.46*m,width,H);g.restore();
  }
  if(!a.costume){if(!hiddenByBody(frontArm))arm(frontArm);}
  else if(!b&&!away){
    if(gait.handSide)arm(gait.handSide);
    if(gait.footSide)leg(gait.footSide);
  }
  g.restore();return true;
}
