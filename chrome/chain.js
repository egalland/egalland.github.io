// An oval steel link is reused along the curve. Alternate links twist around its tangent.
const vertex = `
attribute vec3 point, surface;
uniform vec2 viewport, origin, tangent;
uniform float twist, lengthUnit;
varying vec3 normal;
varying vec2 screenPos;
void main() {
 float cs=cos(twist), sn=sin(twist);
 vec2 across=vec2(-tangent.y,tangent.x);
 vec2 pos=origin+lengthUnit*(tangent*point.x+across*(point.y*cs-point.z*sn));
 screenPos=pos;
 float depth=point.y*sn+point.z*cs;
 normal=vec3(tangent*surface.x+across*(surface.y*cs-surface.z*sn),surface.y*sn+surface.z*cs);
 gl_Position=vec4(2.0*pos.x/viewport.x-1.0,1.0-2.0*pos.y/viewport.y,-depth*.45,1.);
}`;
const fragment = `
precision mediump float;
varying vec3 normal;
varying vec2 screenPos;
uniform vec2 light;
uniform vec2 lamp;
void main() {
 vec3 n=normalize(normal);
 vec3 r=reflect(vec3(0.,0.,-1.),n);
 float y=r.y+.12*sin(2.5*r.x+light.x)+light.y*.15;
 vec3 env=mix(vec3(.045,.035,.054),vec3(.49,.54,.55),smoothstep(-.86,-.36,y));
 env=mix(env,vec3(.97,.96,.89),smoothstep(-.39,-.31,y));
 env=mix(env,vec3(.075,.075,.10),smoothstep(-.18,-.115,y));
 env=mix(env,vec3(.59,.17,.13),smoothstep(.06,.42,y));
 env=mix(env,vec3(.83,.81,.77),smoothstep(.47,.60,y));
 env=mix(env,vec3(.18,.17,.20),smoothstep(.68,.79,y));
 float strip=exp(-18.*abs(r.x+.34*r.z-light.x*.52+.1*r.y));
 float aqua=exp(-9.*abs(r.x-.88+.19*light.x))*smoothstep(-.6,.35,r.z);
 float rim=pow(1.-abs(n.z),3.);
 vec2 d=(screenPos-lamp)/145.;
 float halo=exp(-dot(d,d));
 float spark=halo*(.24+.76*max(0.,r.z));
 gl_FragColor=vec4(clamp(spark*vec3(.56,.91,1.)+env+strip*vec3(.88,.96,1.)+aqua*vec3(.04,.46,.48)+rim*.17,0.,1.),1.);
}`;
function linkMesh(){
 const data=[],indices=[],rings=52,sides=14;
 for(let i=0;i<=rings;i++){
  const a=2*Math.PI*i/rings,c=Math.cos(a),s=Math.sin(a);
  const k=Math.hypot(.31*c,.53*s),nx=.31*c/k,ny=.53*s/k;
  for(let j=0;j<=sides;j++){
   const b=2*Math.PI*j/sides,cb=Math.cos(b),sb=Math.sin(b);
   data.push(.53*c+.112*nx*cb,.31*s+.112*ny*cb,.112*sb,nx*cb,ny*cb,sb);
   if(i<rings&&j<sides){const p=i*(sides+1)+j;indices.push(p,p+1,p+sides+1,p+1,p+sides+2,p+sides+1)}
  }
 }
 return {data:new Float32Array(data),indices:new Uint16Array(indices)};
}
function setupGL(canvas){
 const gl=canvas.getContext('webgl',{antialias:true,alpha:true,depth:true,powerPreference:'low-power'});
 if(!gl)return null;
 const program=gl.createProgram();
 for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));
  gl.attachShader(program,s);
 }
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);
 const mesh=linkMesh(),buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.data,gl.STATIC_DRAW);
 for(const [name,offset] of [['point',0],['surface',12]]){
  const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,offset);
 }
 const idx=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
 const uniform=Object.fromEntries(['viewport','origin','tangent','twist','lengthUnit','light','lamp'].map(k=>[k,gl.getUniformLocation(program,k)]));
 gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
 return (links,width,height,lightX,lightY,spot)=>{
  gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.uniform2f(uniform.lamp,spot?.x??-9000,spot?.y??-9000);
  gl.uniform2f(uniform.viewport,width,height);gl.uniform2f(uniform.light,lightX,lightY);
  for(const item of links){
   gl.uniform2f(uniform.origin,item.x,item.y);gl.uniform2f(uniform.tangent,Math.cos(item.angle),Math.sin(item.angle));
   gl.uniform1f(uniform.twist,item.twist);gl.uniform1f(uniform.lengthUnit,item.size);
   gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);
  }
 };
}
// Cache both halves of a shaded tube for browsers without WebGL. Drawing rear
// halves before front halves lets the rings weave through one another.
function ringSurfaces(twist){
 const mesh=linkMesh(),W=160,H=116,scale=112,vertices=[];
 const ct=Math.cos(twist),st=Math.sin(twist);
 for(let i=0;i<mesh.data.length;i+=6){
  const [x,y,z,nx,ny,nz]=mesh.data.subarray(i,i+6);
  vertices.push([W/2+x*scale,H/2+(y*ct-z*st)*scale,y*st+z*ct,nx,ny*ct-nz*st,ny*st+nz*ct]);
 }
 const halves=Array.from({length:2},()=>{
  const surface=document.createElement('canvas');surface.width=W;surface.height=H;
  const ctx=surface.getContext('2d');return {surface,ctx,image:ctx.createImageData(W,H),normals:new Float32Array(W*H*3),depth:new Float32Array(W*H).fill(-Infinity),pixels:[]};
 });
 for(let k=0;k<mesh.indices.length;k+=3){
  const [a,b,c]=[0,1,2].map(offset=>vertices[mesh.indices[k+offset]]);
  const area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  if(Math.abs(area)<.0001)continue;
  const layer=halves[Number((a[2]+b[2]+c[2])>0)];
  for(let y=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])));y<=Math.min(H-1,Math.ceil(Math.max(a[1],b[1],c[1])));y++){
   for(let x=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])));x<=Math.min(W-1,Math.ceil(Math.max(a[0],b[0],c[0])));x++){
    const px=x+.5-a[0],py=y+.5-a[1];
    const u=(px*(c[1]-a[1])-py*(c[0]-a[0]))/area,v=((b[0]-a[0])*py-(b[1]-a[1])*px)/area,f=1-u-v;
    if(Math.min(u,v,f)<0)continue;
    const z=f*a[2]+u*b[2]+v*c[2],i=y*W+x;
    if(z<=layer.depth[i])continue;
    if(layer.depth[i]===-Infinity)layer.pixels.push(i);
    layer.depth[i]=z;for(let j=0;j<3;j++)layer.normals[3*i+j]=f*a[j+3]+u*b[j+3]+v*c[j+3];
   }
  }
 }
 return halves;
}
const bands=[[-2,32,28,39],[-.76,84,83,95],[-.50,188,196,205],[-.37,251,251,235],[-.2,198,204,211],[-.11,31,33,42],[.04,12,14,20],[.28,100,44,41],[.46,159,123,112],[.57,238,234,220],[.69,208,221,220],[.81,60,62,74],[2,159,135,127]];
const colors=new Uint8Array(768*3);
for(let n=0;n<768;n++){
 const y=n/767*4-2;let i=1;while(i<bands.length-1&&y>bands[i][0])i++;
 const a=bands[i-1],b=bands[i],f=(y-a[0])/(b[0]-a[0]);
 for(let j=0;j<3;j++)colors[n*3+j]=a[j+1]+(b[j+1]-a[j+1])*f;
}
function shadeRing(layer,lx,ly){
 for(const i of layer.pixels){
  const xyz=i*3,n=layer.normals,k=1/Math.hypot(n[xyz],n[xyz+1],n[xyz+2]);
  const nx=n[xyz]*k,ny=n[xyz+1]*k,nz=n[xyz+2]*k;
  const rx=2*nz*nx,ry=2*nz*ny,rz=2*nz*nz-1;
  const y=ry+.12*Math.sin(2.5*rx+lx)+ly*.15;
  const p=Math.max(0,Math.min(767,Math.round((y+2)*191.75)))*3;
  const white=Math.exp(-18*Math.abs(rx+.34*rz-lx*.52+.1*ry))*175;
  const teal=Math.exp(-9*Math.abs(rx-.88+.19*lx))*Math.max(0,rz)*80;
  for(let j=0;j<3;j++)layer.image.data[i*4+j]=colors[p+j]+white+teal*(j===0?-.2:.8);
  layer.image.data[i*4+3]=255;
 }
 layer.ctx.putImageData(layer.image,0,0);
}
export function makeLinkRenderer(canvas){
 const ctx=canvas.getContext('2d'),rings=[ringSurfaces(.4),ringSurfaces(1.97)];
 let lastLight='';
 return (links,w,h,lx,ly,spot)=>{
  const lightKey=Math.round(lx*21)+','+Math.round(ly*21);
  if(lightKey!==lastLight){for(const ring of rings)for(const layer of ring)shadeRing(layer,lx,ly);lastLight=lightKey}
  ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.clearRect(0,0,w,h);
  for(const layer of [0,1])for(const l of links){
   const edgeOn=l.twist>1;
   const tile=rings[Number(edgeOn)][layer].surface;
   const thickness=Math.abs(Math.cos(l.twist))*.31+.112;
   const original=Math.abs(Math.cos(edgeOn?1.97:.4))*.31+.112;
   ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.angle);ctx.scale(l.size/112,l.size/112*thickness/original);
   ctx.drawImage(tile,-tile.width/2,-tile.height/2);ctx.restore();
  }
  if(spot){
   const r=Math.min(155,w*.30),g=ctx.createRadialGradient(spot.x,spot.y,0,spot.x,spot.y,r);
   g.addColorStop(0,'rgba(239,255,255,.9)');g.addColorStop(.39,'rgba(144,247,255,.55)');g.addColorStop(1,'rgba(139,240,255,0)');
   ctx.save();ctx.globalCompositeOperation='source-atop';ctx.fillStyle=g;ctx.fillRect(spot.x-r,spot.y-r,2*r,2*r);ctx.restore();
  }
 };
}
export function makeChain(original,afterDraw){
 let canvas=original,draw;
 function fallback(){
  const copy=document.createElement('canvas');copy.id=canvas.id;copy.setAttribute('aria-hidden','true');canvas.replaceWith(copy);canvas=copy;draw=makeLinkRenderer(copy);
  if(last)render(...last);
 }
 let last=null;
 const joints=new Map();
 let previousSpot=null;
 try{draw=setupGL(canvas)}catch{draw=null}
 if(!draw)fallback();else canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback()},{once:true});
 function render(width,height,progress,xLight,yLight,mobile,motion,count){
  last=[width,height,progress,xLight,yLight,mobile,motion,count];
  const dpr=Math.min(window.devicePixelRatio||1,1.6),w=Math.round(width*dpr),h=Math.round(height*dpr);
  if(!w||!h)return [];
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  // World coordinates persist across chapters. A badge travels with one link.
  const phase=motion.phase,force=motion.pull,offset=mobile?.65:.74;
  const size=mobile?Math.max(32,width*.088):Math.min(84,Math.max(43,width*.055));
  const stride=size*.79, travel=progress*width;
  const pass=motion.enabled?Math.sin(progress*Math.PI)**2:0;
  const zoom=1+pass*(mobile?.13:.27);
  const drift=motion.enabled?Math.sin(phase*.82)*size*.32+force*size*.14:0;
  function point(i){
   const world=i*stride,u=world/width-offset,angle=u*Math.PI*2;
   const x=width*.58+(world-travel+drift-width*.58)*zoom;
   const sag=(mobile?.136:.245)+.088*Math.cos(angle+.44)-.05*Math.cos(angle*.5+1.0);
   const ripple=motion.enabled?.023*Math.sin(angle*1.1-phase*1.47)+.012*Math.sin(angle*2.4-phase*2.12)+.047*force*Math.sin(angle*1.3-phase*2.3):0;
   const y=height*(sag+ripple+(mobile?-.065:0)+pass*(mobile?.065:.104));
   const slope=height/width*2*Math.PI*(-.088*Math.sin(angle+.44)+.025*Math.sin(angle*.5+1.0)
    +(motion.enabled?.0253*Math.cos(angle*1.1-phase*1.47)+.0288*Math.cos(angle*2.4-phase*2.12)+.0611*force*Math.cos(angle*1.3-phase*2.3):0))/zoom;
   return {x,y,angle:Math.atan(slope),size:size*zoom*Math.hypot(1,slope),twist:(i%2===0?.40:1.97)+.12*Math.sin(angle+phase*.88)+force*.28};
  }
  const first=Math.floor((travel+width*.58-(width*.58+size)/zoom-drift)/stride)-1;
  const end=Math.ceil((travel+width*.58+(width*.42+size)/zoom-drift)/stride)+1;
  const links=[];
  const spot=motion.spot,dt=Math.min(motion.dt||.016,.04);
  const sweep=spot&&previousSpot?Math.max(-1,Math.min(1,(spot.x-previousSpot.x)/(dt*900))):0;
  previousSpot=spot;
  for(const i of joints.keys())if(i<first-1||i>end+1)joints.delete(i);
  if(!motion.enabled)joints.clear();
  for(let i=first;i<=end;i++){
   const link=point(i);links.push(link);
   if(!motion.enabled)continue;
   let joint=joints.get(i);
   if(!joint){joint={dy:0,vy:0,twist:0,spin:0};joints.set(i,joint)}
   const dx=spot?(link.x-spot.x)/size:9,dy=spot?(link.y-spot.y)/size:9;
   const contact=Math.exp(-dx*dx*.65-dy*dy*1.9);
   const lift=-size*.67*contact*(1+.22*sweep);
   const tension=(joints.get(i-1)?.dy||0)+(joints.get(i+1)?.dy||0)-2*joint.dy;
   joint.vy+=((lift-joint.dy)*77+tension*64-joint.vy*7.8)*dt;
   joint.spin+=((contact*(.77+.55*sweep)-joint.twist)*90-joint.spin*8.7)*dt;
  }
  links.forEach((link,j)=>{
   const i=first+j,joint=joints.get(i);if(!joint)return;
   joint.dy+=joint.vy*dt;joint.twist+=joint.spin*dt;
   link.y+=joint.dy;link.twist+=joint.twist;
   const left=joints.get(i-1)?.dy??joint.dy,right=joints.get(i+1)?.dy??joint.dy;
   link.angle+=Math.atan((right-left)/(2*stride));
  });
  draw(links,width,height,xLight,yLight,spot);
  afterDraw?.(links,first,progress,motion);
  return Array.from({length:count},(_,j)=>{
   const i=Math.round((j+offset)*width/stride),pin=links[i-first]||point(i);
   return {x:pin.x,y:pin.y,depth:zoom,impulse:joints.get(i)?.vy||0};
  });
 }

 return render;
}
