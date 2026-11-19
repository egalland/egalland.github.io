import { FACE_ORDER, SIDE, facePoint, type Face } from './planet';
import { orbitalRelief } from './planet-orbit-detail';

type Camera = { yaw:number; pitch:number };
type Vector = [number,number,number];
const directions:Record<Face,Vector>={top:[0,1,0],bottom:[0,-1,0],north:[0,0,-1],south:[0,0,1],east:[1,0,0],west:[-1,0,0]};
const vertexSource = `
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 uv;
  uniform mat3 view;
  uniform vec2 size;
  uniform vec2 center;
  varying vec2 texCoord;
  varying float illumination;
  void main(){
    vec3 point=view*position;
    gl_Position=vec4(point.xy*size+center,-point.z*.40,1.0);
    texCoord=uv;
    illumination=.75+.29*clamp(dot(normalize(normal),normalize(vec3(-.40,.76,.49))),-.70,1.0);
  }
`;
const fragmentSource = `
  precision mediump float;
  varying vec2 texCoord;
  varying float illumination;
  uniform sampler2D geology;
  void main(){
    vec3 rock=texture2D(geology,texCoord).rgb;
    gl_FragColor=vec4(rock*illumination+vec3(.012,.007,.010),1.0);
  }
`;

type FaceBuffer={vertices:WebGLBuffer;texture:WebGLTexture;source:HTMLCanvasElement|null};
type Renderer={
  canvas:HTMLCanvasElement;gl:WebGLRenderingContext;program:WebGLProgram;
  indices:WebGLBuffer;indexCount:number;faces:Map<Face,FaceBuffer>;
  position:number;normal:number;uv:number;view:WebGLUniformLocation|null;size:WebGLUniformLocation|null;center:WebGLUniformLocation|null;
};
let gpu:Renderer|null|undefined;

function programFor(gl:WebGLRenderingContext) {
  const program=gl.createProgram();
  if(!program)return null;
  for(const [kind,source] of [[gl.VERTEX_SHADER,vertexSource],[gl.FRAGMENT_SHADER,fragmentSource]] as const){
    const shader=gl.createShader(kind);
    if(!shader){gl.deleteProgram(program);return null;}
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);gl.deleteProgram(program);return null;}
    gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return null;}
  return program;
}
function geometry(face:Face) {
  const surface=orbitalRelief(face),n=surface.segments,rows=n+1,z=surface.heights;
  const zero=facePoint(face,0,0,0),east=facePoint(face,SIDE-1,0,0),south=facePoint(face,0,SIDE-1,0);
  const axes=['x','y','z'] as const,du=axes.map(k=>(east[k]-zero[k])/(SIDE-1)),dv=axes.map(k=>(south[k]-zero[k])/(SIDE-1)),up=directions[face];
  const vertices=new Float32Array(rows*rows*8);
  for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){
    const i=y*rows+x,u=x/n,v=y/n,h=z[i],p=facePoint(face,u*(SIDE-1),v*(SIDE-1),0);
    const lx=Math.max(0,x-1),rx=Math.min(n,x+1),ty=Math.max(0,y-1),by=Math.min(n,y+1);
    const hu=(z[y*rows+rx]-z[y*rows+lx])*n/((rx-lx)*2);
    const hv=(z[by*rows+x]-z[ty*rows+x])*n/((by-ty)*2);
    for(let k=0;k<3;k++){
      vertices[i*8+k]=p[axes[k]]/(SIDE-1)*2-1+up[k]*h;
      vertices[i*8+3+k]=up[k]-du[k]*hu-dv[k]*hv;
    }
    vertices[i*8+6]=u;vertices[i*8+7]=v;
  }
  return vertices;
}
function init() {
  try{
    const canvas=document.createElement('canvas');
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,powerPreference:'low-power'});
    if(!gl)return null;
    const program=programFor(gl);
    if(!program)return null;
    const faces=new Map<Face,FaceBuffer>(),indices=gl.createBuffer();if(!indices)return null;
    const n=orbitalRelief('top').segments,rows=n+1,triangles:number[]=[];
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=y*rows+x,b=a+1,c=a+rows,d=c+1;triangles.push(a,b,c,d,c,b);}
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(triangles),gl.STATIC_DRAW);
    for(const face of FACE_ORDER){
      const vertices=gl.createBuffer(),texture=gl.createTexture();
      if(!vertices||!texture)return null;
      gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferData(gl.ARRAY_BUFFER,geometry(face),gl.STATIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      faces.set(face,{vertices,texture,source:null});
    }
    gl.useProgram(program);gl.uniform1i(gl.getUniformLocation(program,'geology'),0);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
    // A temporary context loss uses the ordinary Canvas surface while the
    // platform restores the context. Allocate fresh buffers after restoration.
    canvas.addEventListener('webglcontextlost',event=>event.preventDefault());
    canvas.addEventListener('webglcontextrestored',()=>{gpu=undefined;});
    return {canvas,gl,program,indices,indexCount:triangles.length,faces,position:gl.getAttribLocation(program,'position'),normal:gl.getAttribLocation(program,'normal'),uv:gl.getAttribLocation(program,'uv'),view:gl.getUniformLocation(program,'view'),size:gl.getUniformLocation(program,'size'),center:gl.getUniformLocation(program,'center')};
  }catch{return null;}
}
export function drawGlobeMesh(ctx:CanvasRenderingContext2D,w:number,h:number,cam:Camera,cx:number,cy:number,scale:number,textureFor:(f:Face)=>HTMLCanvasElement) {
  if(gpu===undefined)gpu=init();
  if(!gpu||gpu.gl.isContextLost())return false;
  const g=gpu,gl=g.gl,dpr=Math.min(2,ctx.canvas.width/w);
  const rw=Math.max(1,Math.round(w*dpr)),rh=Math.max(1,Math.round(h*dpr));
  if(g.canvas.width!==rw||g.canvas.height!==rh){g.canvas.width=rw;g.canvas.height=rh;}
  const sy=Math.sin(cam.yaw),cyaw=Math.cos(cam.yaw),sp=Math.sin(cam.pitch),cp=Math.cos(cam.pitch);
  gl.viewport(0,0,rw,rh);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix3fv(g.view,false,new Float32Array([cyaw,-sy*sp,sy*cp,0,cp,sp,-sy,-cyaw*sp,cyaw*cp]));
  gl.uniform2f(g.size,2*scale/w,2*scale/h);gl.uniform2f(g.center,2*cx/w-1,1-2*cy/h);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g.indices);gl.activeTexture(gl.TEXTURE0);
  for(const face of FACE_ORDER){
    const n=directions[face];if(n[0]*sy*cp+n[1]*sp+n[2]*cyaw*cp<.002)continue;
    const f=g.faces.get(face)!,source=textureFor(face);
    gl.bindTexture(gl.TEXTURE_2D,f.texture);
    if(f.source!==source){
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
      gl.generateMipmap(gl.TEXTURE_2D);f.source=source;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,f.vertices);
    for(const [location,count,offset] of [[g.position,3,0],[g.normal,3,12],[g.uv,2,24]]){
      gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,count,gl.FLOAT,false,32,offset);
    }
    gl.drawElements(gl.TRIANGLES,g.indexCount,gl.UNSIGNED_SHORT,0);
  }
  ctx.drawImage(g.canvas,0,0,w,h);return true;
}
