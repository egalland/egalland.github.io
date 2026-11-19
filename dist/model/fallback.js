/*
 * Canvas 2D fallback for the interactive assembly. Geometry stays in model
 * coordinates and receives the same part transforms as the WebGL view.
 */

const COLORS = {
  alloy: [121, 132, 134], edge: [171, 180, 175], steel: [123, 135, 137],
  dark: [51, 58, 60], black: [37, 42, 41], rubber: [38, 41, 39],
  tread: [53, 55, 51], chrome: [196, 203, 199], spring: [149, 158, 153],
  oil: [109, 95, 72], green: [63, 100, 63], paint: [203, 91, 39],
  glass: [63, 81, 83], light: [232, 231, 191], amber: [226, 149, 54],
  red: [158, 59, 45], blue: [49, 92, 134], white: [226, 229, 219]
};
const METALS = new Set(['alloy', 'edge', 'chrome', 'steel', 'spring']);
const TAU = Math.PI * 2;
const ZERO = [0, 0, 0];
const EMPTY = () => ({
  min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity]
});
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const sub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const unit = v => { const l = Math.hypot(...v) || 1; return v.map(x => x/l); };
function expand(bounds, xyz) {
  for (let i = 0; i < 3; i++) {
    bounds.min[i] = Math.min(bounds.min[i], xyz[i]);
    bounds.max[i] = Math.max(bounds.max[i], xyz[i]);
  }
}
function boundsCorners(bounds, offset = ZERO) {
  const out = [];
  for (let i=0; i<8; i++) {
    out.push([0, 1, 2].map(k => offset[k] + (i & (1<<k) ? bounds.max[k] : bounds.min[k])));
  }
  return out;
}
function rotateXYZ([x,y,z], rot) {
  if (!rot || (!rot[0] && !rot[1] && !rot[2])) return [x, y, z];
  const [a,b,c] = rot;
  const sa=Math.sin(a), ca=Math.cos(a), sb=Math.sin(b), cb=Math.cos(b), sc=Math.sin(c), cc=Math.cos(c);
  // THREE.Euler('XYZ') applies Z, Y, then X in local coordinates.
  const xx=cc*x-sc*y, yy=sc*x+cc*y, zz=-sb*xx+cb*z;
  return [cb*xx+sb*z, ca*yy-sa*zz, sa*yy+ca*zz];
}
function addSolid(part, points, polygons, material, closed) {
  if (!points.length || !polygons.length) return;
  const extent = EMPTY();
  points.forEach(p => { expand(extent,p); expand(part.bounds,p); });
  const center = [0,1,2].map(k => .5*(extent.min[k]+extent.max[k]));
  const faces=[];
  for (const indices of polygons) {
    const first=points[indices[0]], second=points[indices[1]], third=points[indices[2]];
    if (!first || !second || !third) continue;
    let normal=cross(sub(second,first),sub(third,first));
    if (Math.hypot(...normal)<1e-8) continue;
    normal=unit(normal);
    if (closed && dot(normal,sub(first,center))<0) normal=normal.map(x=>-x);
    faces.push({indices,normal});
  }
  part.shapes.push({
    points,faces,material,closed,center,
    radius:.5*Math.hypot(...sub(extent.max,extent.min)),
    projected:new Float64Array(points.length*3)
  });
}
function addBox(part, center, size, material, rotation) {
  const points=[];
  for (let i=0; i<8; i++) {
    const local=size.map((n,k)=>(i & (1<<k) ? .5 : -.5)*n);
    points.push(rotateXYZ(local,rotation).map((v,k)=>v+center[k]));
  }
  addSolid(part,points,[
    [0,1,3,2], [4,6,7,5], [0,4,5,1], [2,3,7,6], [0,2,6,4], [1,5,7,3]
  ],material,true);
}
function addCylinder(part, a,b,r,material,n=18) {
  if (Math.hypot(...sub(b,a))<1e-5 || r<=0) return;
  const axis=unit(sub(b,a));
  const u=unit(cross(axis,Math.abs(axis[1])<.8 ? [0,1,0] : [1,0,0]));
  const v=cross(axis,u);
  const count=clamp(Math.round(n),3,r<2.5?8:r<7?12:24);
  const points=[], faces=[];
  for (const p of [a,b]) {
    for (let i=0;i<count;i++) {
      const angle=TAU*i/count;
      points.push(p.map((val,k)=>val+r*(u[k]*Math.cos(angle)+v[k]*Math.sin(angle))));
    }
  }
  for (let i=0;i<count;i++) {
    const j=(i+1)%count;
    faces.push([i,j,j+count,i+count]);
  }
  faces.push(Array.from({length:count},(_,i)=>i));
  faces.push(Array.from({length:count},(_,i)=>count+i));
  addSolid(part,points,faces,material,true);
}
function addBall(part, center, radii, material) {
  const rings=5, n=10, points=[], faces=[];
  points.push([center[0],center[1]+radii[1],center[2]]);
  for (let j=1;j<rings;j++) {
    const angle=Math.PI*j/rings;
    for(let i=0;i<n;i++) {
      const az=TAU*i/n;
      points.push([
        center[0]+radii[0]*Math.sin(angle)*Math.cos(az),
        center[1]+radii[1]*Math.cos(angle),
        center[2]+radii[2]*Math.sin(angle)*Math.sin(az)
      ]);
    }
  }
  const bottom=points.push([center[0],center[1]-radii[1],center[2]])-1;
  for(let i=0;i<n;i++) {
    const next=(i+1)%n;
    faces.push([0,1+i,1+next]);
    for(let j=0;j<rings-2;j++) {
      const start=1+j*n;
      faces.push([start+i,start+next,start+n+next,start+n+i]);
    }
    faces.push([bottom,1+(rings-2)*n+next,1+(rings-2)*n+i]);
  }
  addSolid(part,points,faces,material,true);
}
function addMesh(part, flat, idx, material) {
  const points=[], polygons=[];
  for(let i=0;i+2<flat.length;i+=3) points.push([flat[i],flat[i+1],flat[i+2]]);
  for(let i=0;i+2<idx.length;i+=3) polygons.push([idx[i],idx[i+1],idx[i+2]]);
  addSolid(part,points,polygons,material,false);
}

// Weld normals across smooth surfaces while retaining hard body creases and
// the shoulders on each tire tread. Independent CAD panels often reuse their
// vertices in separate mesh calls.
function preparePart(part) {
  const weld = new Map(), hull = new Map();
  const dirs = [];
  for (let i=0; i<70; i++) {
    const y=1-2*i/69, r=Math.sqrt(Math.max(0,1-y*y)), a=i*2.3999632297;
    dirs.push([r*Math.cos(a),y,r*Math.sin(a)]);
  }
  const extremes=dirs.map(()=>({score:-Infinity,point:null}));
  for(const shape of part.shapes) {
    const smooth=['paint','glass','chrome','rubber','spring','alloy','tread'].includes(shape.material);
    shape.vertexKeys=smooth?shape.points.map(p=>shape.material+'/'+p.map(x=>Math.round(x*20)).join('/')):null;
    for(const p of shape.points) {
      for(let i=0;i<dirs.length;i++) {
        const score=dot(p,dirs[i]);
        if(score>extremes[i].score){extremes[i].score=score;extremes[i].point=p;}
      }
    }
    if(smooth)for(const face of shape.faces)for(const i of face.indices) {
      const key=shape.vertexKeys[i];
      if(!weld.has(key))weld.set(key,[]);
      weld.get(key).push(face.normal);
    }
  }
  for(const e of extremes)if(e.point)hull.set(e.point.join('/'),e.point);
  part.hull=[...hull.values()];
  for(const shape of part.shapes) {
    if(!shape.vertexKeys)continue;
    for(const face of shape.faces) {
      face.normals=face.indices.map(i=>{
        const sum=[0,0,0];
        for(const n of weld.get(shape.vertexKeys[i])) {
          const align=dot(n,face.normal);
          if(Math.abs(align)<.90)continue;
          const sign=align<0?-1:1;
          for(let k=0;k<3;k++)sum[k]+=sign*n[k];
        }
        return unit(sum);
      });
    }
    shape.vertexKeys=null;
  }
}
const LIGHT=unit([-.60,1.0,.50]);
function vertexColor(key,n,p,offset,v,selected) {
  const c=COLORS[key] || COLORS.alloy;
  let vx=v.forward[0]*v.distance+v.target[0]-p[0]-offset[0];
  let vy=v.forward[1]*v.distance+v.target[1]-p[1]-offset[1];
  let vz=v.forward[2]*v.distance+v.target[2]-p[2]-offset[2];
  const ir=1/(Math.hypot(vx,vy,vz)||1);vx*=ir;vy*=ir;vz*=ir;
  const ndv=n[0]*vx+n[1]*vy+n[2]*vz, sign=ndv<0?-1:1;
  const nx=n[0]*sign,ny=n[1]*sign,nz=n[2]*sign;
  const diffuse=Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]);
  const metal=METALS.has(key), paint=key==='paint', glass=key==='glass';
  const angle=Math.abs(ndv);
  const rx=2*angle*nx-vx,ry=2*angle*ny-vy,rz=2*angle*nz-vz;
  const lit=.53+.12*ny+.39*diffuse;
  // Long studio light banks. The narrow glints move across the paint and
  // suspension as the camera rotates.
  let shine=0;
  if(metal||paint||glass) {
    const strip=Math.exp(-Math.pow((ry-.52)*4.6,2)-Math.pow((rx+.27)*1.8,2));
    const softbox=Math.pow(Math.max(0,-.46*rx+.72*ry+.53*rz),18);
    shine=(metal?125:glass?105:83)*(.64*strip+.88*softbox)
       + (metal?24:glass?48:14)*Math.pow(1-angle,3);
  }
  const tint=selected?22:0;
  const red=clamp(Math.round(c[0]*lit+shine+tint*1.35),0,255);
  const green=clamp(Math.round(c[1]*lit+.99*shine+tint*1.45),0,255);
  const blue=clamp(Math.round(c[2]*lit+.94*shine+tint*.2),0,255);
  return [red,green,blue];
}

function rasterTriangle(target, q, ia,ib,ic, ca,cb,cc, partId) {
  const ax=q[ia],ay=q[ia+1],az=q[ia+2];
  const bx=q[ib],by=q[ib+1],bz=q[ib+2];
  const cx=q[ic],cy=q[ic+1],cz=q[ic+2];
  const dx1=bx-ax,dy1=by-ay,dx2=cx-ax,dy2=cy-ay;
  const det=dx1*dy2-dx2*dy1;
  if(Math.abs(det)<.01)return;
  const x0=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5));
  const x1=Math.min(target.w-1,Math.floor(Math.max(ax,bx,cx)-.5));
  const y0=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5));
  const y1=Math.min(target.h-1,Math.floor(Math.max(ay,by,cy)-.5));
  if(x0>x1||y0>y1)return;
  const inv=1/det, uX=dy2*inv, uY=-dx2*inv, wX=-dy1*inv, wY=dx1*inv;
  const uBase=(x0+.5-ax)*uX+(y0+.5-ay)*uY;
  const wBase=(x0+.5-ax)*wX+(y0+.5-ay)*wY;
  const dz1=bz-az,dz2=cz-az;
  const red1=cb[0]-ca[0],red2=cc[0]-ca[0],gr1=cb[1]-ca[1],gr2=cc[1]-ca[1],bl1=cb[2]-ca[2],bl2=cc[2]-ca[2];
  const flat=!(red1||red2||gr1||gr2||bl1||bl2);
  const solid=(0xff000000 | (ca[2]<<16) | (ca[1]<<8) | ca[0])>>>0;
  for(let y=y0;y<=y1;y++){
    let u=uBase+(y-y0)*uY,w=wBase+(y-y0)*wY;
    let pixel=y*target.w+x0;
    for(let x=x0;x<=x1;x++,pixel++,u+=uX,w+=wX){
      if(u<-.000004 || w<-.000004 || u+w>1.000004)continue;
      // Reciprocal camera distance interpolates linearly in screen space.
      const z=az+u*dz1+w*dz2;
      if(z<target.depth[pixel])continue;
      target.depth[pixel]=z;
      target.ids[pixel]=partId;
      if(flat){target.rgba[pixel]=solid;continue;}
      const rr=(ca[0]+u*red1+w*red2+.5)|0,gg=(ca[1]+u*gr1+w*gr2+.5)|0,bb=(ca[2]+u*bl1+w*bl2+.5)|0;
      target.rgba[pixel]=(0xff000000 | (bb<<16) | (gg<<8) | rr)>>>0;
    }
  }
}

// Small-radius screen-space occlusion deepens seams, spring cavities and
// tread blocks. A local tangent estimate avoids darkening flat sloped panels.
function finishSurface(screen, distance, density) {
  const {w,h,rgba,depth}=screen;
  const near=Math.max(2,Math.round(3*density)),far=Math.max(4,Math.round(8*density));
  const samples=[[near,1],[-near,-1],[1,-near],[-1,near],
                [far,far>>1],[-far,-(far>>1)],[far>>1,-far],[-(far>>1),far]];
  for(let y=far;y<h-far;y++){
    for(let x=far;x<w-far;x++){
      const i=y*w+x,d=depth[i];
      if(!d)continue;
      const mm=distance/(d*d);
      const a=depth[i-1],b=depth[i+1],c=depth[i-w],e=depth[i+w];
      const gx=a&&b?clamp((b-a)*mm*.5,-3,3):0;
      const gy=c&&e?clamp((e-c)*mm*.5,-3,3):0;
      let occlusion=0;
      for(let k=0;k<8;k++){
        const dx=samples[k][0],dy=samples[k][1],neighbor=depth[i+dy*w+dx];
        if(!neighbor)continue;
        const rise=(neighbor-d)*mm-gx*dx-gy*dy;
        if(rise>1.6 && rise<38)occlusion+=Math.min(1,(rise-1.6)*.23)*(1-rise/38);
      }
      const pixel=rgba[i],gr=(pixel>>>8)&255;
      const seed=(Math.imul(x+1,73856093)^Math.imul(y+1,19349663))>>>0;
      const grain=(.5-(seed%127)/126)*(gr<75?3.8:1.6);
      const exposure=1-.048*occlusion;
      const r=clamp(Math.round((pixel&255)*exposure+grain),0,255),
            g=clamp(Math.round(gr*exposure+grain),0,255),
            b2=clamp(Math.round(((pixel>>>16)&255)*exposure+grain),0,255);
      rgba[i]=(0xff000000 | (b2<<16) | (g<<8) | r)>>>0;
    }
  }
}

export function makeCanvasEngine(canvas) {
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx) throw new Error('Le navigateur ne fournit pas de contexte Canvas 2D.');
  canvas.style.touchAction='none';
  const parts=[];
  let width=1,height=1,ratio=1,active=true,raf=0,ready=false,selected=null;
  let hidden=new Set(), explosion=0, zoom=1, focus=null, pan=[0,0];
  let target=null, settle=0, coarse=false;
  const rasterCanvas=document.createElement('canvas');
  const raster=rasterCanvas.getContext('2d', {alpha:true});
  let yaw=.71, pitch=.43;
  const pointers=new Map();
  let drag=null;
  let backdrop=null;
  const api={
    parts, onPick:null, box:addBox, cyl:addCylinder, ball:addBall, mesh:addMesh,
    group(id,label,category,position,explode,description) {
      const part={id,label,category,position,explode,description,shapes:[],bounds:EMPTY()};
      parts.push(part); return part;
    },
    finish(){ parts.forEach(preparePart); ready=true; resize(); invalidate(); },
    setExplosion(value){ explosion=clamp(Number(value)||0,0,1); duringInput(); },
    setSelected(id){ selected=id; invalidate(); },
    setHidden(ids){ hidden=new Set(ids); if(hidden.has(focus))focus=null; invalidate(); },
    setActive(flag){ active=Boolean(flag); if(active){ resize(); invalidate(); } },
    resetView(view='perspective'){
      [yaw,pitch]=({front:[0,.015],side:[Math.PI/2,.015],top:[0,Math.PI/2-.0001],
                    perspective:[.71,.43]})[view] || [.71,.43];
      zoom=1; focus=null; pan=[0,0]; invalidate();
    },
    focusPart(id){ if(parts.some(p=>p.id===id&&!hidden.has(id))){focus=id;zoom=1;pan=[0,0];invalidate();} },
    zoomBy(factor){ zoom=clamp(zoom*factor,.48,5); invalidate(); },
    resize
  };
  function resize(){
    const rect=canvas.getBoundingClientRect();
    if(rect.width < 2 || rect.height < 2) return;
    width=rect.width; height=rect.height;
    ratio=Math.min(window.devicePixelRatio||1,1.5);
    const w=Math.round(width*ratio),h=Math.round(height*ratio);
    if(canvas.width!==w || canvas.height!==h) {
      canvas.width=w; canvas.height=h;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      backdrop=ctx.createLinearGradient(0,0,0,height);
      backdrop.addColorStop(0,'#e2e4da'); backdrop.addColorStop(.63,'#d8dbd0');
      backdrop.addColorStop(1,'#c4c8be');
    }
    invalidate();
  }
  function duringInput(){
    coarse=true; clearTimeout(settle);
    settle=setTimeout(()=>{coarse=false;invalidate();},110);
    invalidate();
  }
  function invalidate(){
    if(!active||!ready||raf) return;
    raf=requestAnimationFrame(()=>{ raf=0; if(active)draw(); });
  }
  function offsetFor(p) {
    return p.position.map((n,i)=>n+explosion*p.explode[i]);
  }
  function view() {
    const forward=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
    const right=[Math.cos(yaw),0,-Math.sin(yaw)], up=cross(forward,right);
    let candidates=parts.filter(p=>!hidden.has(p.id)&&p.shapes.length);
    if(focus)candidates=candidates.filter(p=>p.id===focus);
    const corners=[];
    for(const part of candidates){
      const o=offsetFor(part);
      for(const p of (part.hull||boundsCorners(part.bounds)))corners.push(p.map((x,k)=>x+o[k]));
    }
    if(!corners.length)corners.push([-170,0,-220],[170,170,220]);
    const bounds=EMPTY();corners.forEach(p=>expand(bounds,p));
    const target=bounds.min.map((x,k)=>(x+bounds.max[k])/2);
    const radius=Math.max(18,.5*Math.hypot(...sub(bounds.max,bounds.min)));
    const distance=radius*3.9;
    let left=Infinity,rightEdge=-Infinity,low=Infinity,high=-Infinity;
    for(const p of corners){
      const delta=sub(p,target), factor=distance/(distance-dot(delta,forward));
      const x=dot(delta,right)*factor,y=dot(delta,up)*factor;
      left=Math.min(left,x);rightEdge=Math.max(rightEdge,x);
      low=Math.min(low,y);high=Math.max(high,y);
    }
    const marginsX=width<560?.085:.075, marginsY=.10;
    const scale=Math.min(width*(1-2*marginsX)/Math.max(2,rightEdge-left),
                         height*(1-2*marginsY)/Math.max(2,high-low))*zoom;
    const ox=-(left+rightEdge)*scale/2, oy=(high+low)*scale/2;
    return {right,up,forward,target,distance,scale,ox,oy, floor:Math.min(0,bounds.min[1])};
  }
  function prepareRaster(lowQuality) {
    const cap=lowQuality?350_000:1_950_000;
    const density=Math.min(lowQuality?.83:1.8,Math.sqrt(cap/(width*height)));
    const w=Math.max(1,Math.round(width*density)),h=Math.max(1,Math.round(height*density));
    if(!target || w!==target.w || h!==target.h){
      rasterCanvas.width=w;rasterCanvas.height=h;
      const image=raster.createImageData(w,h);
      target={image,w,h,rgba:new Uint32Array(image.data.buffer),depth:new Float32Array(w*h),ids:new Uint16Array(w*h)};
    }else{target.rgba.fill(0);target.depth.fill(0);target.ids.fill(0);}
    return target;
  }
  function draw(){
    const v=view(), screen=prepareRaster(pointers.size>0 || coarse);
    ctx.fillStyle=backdrop||'#d8dbd0';ctx.fillRect(0,0,width,height);
    const cx=width/2+pan[0]+v.ox,cy=height/2+pan[1]+v.oy;
    const t=v.target, f=v.forward, u=v.up, r=v.right;
    function project(x,y,z,out,index){
      x-=t[0];y-=t[1];z-=t[2];
      const inv=v.distance / Math.max(v.distance*.1,v.distance-(x*f[0]+y*f[1]+z*f[2]));
      const scale=v.scale*inv;
      out[index]=cx+scale*(x*r[0]+y*r[1]+z*r[2]);
      out[index+1]=cy-scale*(x*u[0]+y*u[1]+z*u[2]);
      out[index+2]=inv;
    }
    function groundShadow(x,z,sx,sz,alpha){
      if(alpha<=.005)return;
      const c=[],px=[],pz=[];
      project(x,v.floor,z,c,0);project(x+sx,v.floor,z,px,0);project(x,v.floor,z+sz,pz,0);
      ctx.save();
      const xx=px[0]-c[0],xy=px[1]-c[1],yx=pz[0]-c[0],yy=pz[1]-c[1];
      if(Math.abs(xx*yy-yx*xy)<.05){ctx.restore();return;}
      ctx.transform(xx,xy,yx,yy,c[0],c[1]);
      const shade=ctx.createRadialGradient(0,0,0,0,0,1);
      shade.addColorStop(0,'rgba(35,42,32,'+alpha+')');
      shade.addColorStop(.45,'rgba(37,45,33,'+(alpha*.68)+')');
      shade.addColorStop(1,'rgba(38,46,34,0)');
      ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    if(!focus && parts.some(p=>!hidden.has(p.id)))groundShadow(21,-17,185,223,.26*(1-explosion*.5));
    const xRatio=screen.w/width,yRatio=screen.h/height;
    const minSize=pointers.size?1.2:.38;
    for(let number=0;number<parts.length;number++){
      const part=parts[number];
      if(hidden.has(part.id))continue;
      const o=offsetFor(part);
      if(part.id.startsWith('wheel-')){
        const rise=Math.max(0,part.bounds.min[1]+o[1]-v.floor);
        groundShadow(o[0]+15+rise*.25,o[2]-8,50+rise*.13,69+rise*.13,.29/(1+rise/100));
        groundShadow(o[0],o[2],31+rise*.18,41+rise*.18,.56/(1+rise/16));
      }
      const isSelected=part.id===selected;
      for(const shape of part.shapes){
        if(shape.radius*v.scale<minSize)continue;
        const q=shape.projected;
        for(let i=0;i<shape.points.length;i++){
          const p=shape.points[i], j=i*3;
          project(p[0]+o[0],p[1]+o[1],p[2]+o[2],q,j);
          q[j]*=xRatio;q[j+1]*=yRatio;
        }
        for(const face of shape.faces){
          if(shape.closed && dot(face.normal,f)<-.18)continue;
          const ix=face.indices,mat=shape.material;
          const smooth=face.normals;
          const a=3*ix[0], base=vertexColor(mat,smooth?smooth[0]:face.normal,shape.points[ix[0]],o,v,isSelected);
          let colB=smooth ? vertexColor(mat,smooth[1],shape.points[ix[1]],o,v,isSelected):base;
          for(let j=2;j<ix.length;j++){
            const colC=smooth?vertexColor(mat,smooth[j],shape.points[ix[j]],o,v,isSelected):base;
            rasterTriangle(screen,q,a,3*ix[j-1],3*ix[j],base,colB,colC,number+1);
            colB=colC;
          }
        }
      }
    }
    if(!pointers.size && !coarse)finishSurface(screen,v.distance,xRatio);
    raster.putImageData(screen.image,0,0);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(rasterCanvas,0,0,width,height);
  }
  function pick(clientX,clientY){
    if(!target)return null;
    const rect=canvas.getBoundingClientRect();
    const x=Math.floor((clientX-rect.left)*target.w/width),y=Math.floor((clientY-rect.top)*target.h/height);
    if(x<0||x>=target.w||y<0||y>=target.h)return null;
    const p=parts[target.ids[y*target.w+x]-1];
    return p && !hidden.has(p.id)?p.id:null;
  }
  function metrics(){
    const values=Array.from(pointers.values());
    if(values.length===1)return {...values[0], gap:0};
    const [a,b]=values;
    return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,gap:Math.hypot(a.x-b.x,a.y-b.y)};
  }
  function setDrag(panning=false, moved=false) {
    const m=metrics();
    drag={...m,lastX:m.x,lastY:m.y,moved,panning:panning||pointers.size>1};
  }
  canvas.addEventListener('pointerdown',e=>{
    if(e.button>2)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);
    setDrag(e.button===1||e.button===2||e.shiftKey,pointers.size>1);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId)||!drag)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const m=metrics(), dx=m.x-drag.lastX,dy=m.y-drag.lastY;
    if(Math.hypot(m.x-drag.x,m.y-drag.y)>3||m.gap)drag.moved=true;
    if(drag.moved){
      if(drag.panning){pan[0]+=dx;pan[1]+=dy;}
      else {yaw-=dx*.008;pitch=clamp(pitch+dy*.007,-.45,Math.PI/2-.0001);}
      if(m.gap>0 && drag.gap>0)zoom=clamp(zoom*m.gap/drag.gap,.48,5);
      drag.lastX=m.x;drag.lastY=m.y;drag.gap=m.gap;invalidate();
    }
  });
  function end(e,cancelled){
    if(!pointers.has(e.pointerId))return;
    const shouldPick=!cancelled&&!drag?.moved&&!drag?.panning;
    pointers.delete(e.pointerId);
    if(pointers.size)setDrag(false,true);
    else {
      drag=null;
      if(shouldPick)api.onPick?.(pick(e.clientX,e.clientY));
      invalidate();
    }
  }
  canvas.addEventListener('pointerup',e=>end(e,false));
  canvas.addEventListener('pointercancel',e=>end(e,true));
  canvas.addEventListener('lostpointercapture',e=>end(e,true));
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const amount=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1);
    api.zoomBy(Math.exp(-amount*.0014));
  },{passive:false});
  return api;
}
