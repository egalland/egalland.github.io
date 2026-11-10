// A single offscreen context serves every casting, including those in popovers.
export function metalGPU(environment){
 const surface=document.createElement('canvas'),gl=surface.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
 if(!gl)return null;
 const program=gl.createProgram();
 const vertex=`
 attribute vec3 position,normal;uniform vec2 viewport;uniform float zoom;uniform vec4 rot;
 varying vec3 n;varying vec2 loc;varying float castX;
 vec3 turn(vec3 p){
  vec3 v=vec3(rot.y*p.x+rot.x*p.z,p.y,rot.y*p.z-rot.x*p.x);
  return vec3(v.x,rot.w*v.y-rot.z*v.z,rot.z*v.y+rot.w*v.z);
 }
 void main(){vec3 p=turn(position);n=turn(normal);castX=position.x;loc=p.xy*zoom*2./viewport;
 gl_Position=vec4(loc.x,-loc.y,-p.z/1024.,1.);}`;
 const fragment=`
 precision mediump float; varying vec3 n;varying vec2 loc;varying float castX;
 uniform sampler2D studio;uniform vec3 lamp;
 void main(){vec3 unit=normalize(n);vec3 r=reflect(vec3(0.,0.,-1.),unit);
 float horizon=clamp(.88*r.y+.19*r.x+.11*sin(castX/17.)+lamp.y*.16,-1.,1.);
 vec3 base=texture2D(studio,vec2(horizon*.5+.5,.5)).rgb*(.67+.33*abs(unit.z));
 float softbox=.74*exp(-10.*abs(r.x+.29*r.z-.23*lamp.x));
 vec2 d=r.xy-vec2(.58,.55)*lamp.xy+vec2(.22*r.z,0.);
 vec2 local=loc-lamp.xy;
 float glow=lamp.z*(.3+.7*exp(-1.8*dot(local,local)))*exp(-5.6*dot(d,d));
 gl_FragColor=vec4(mix(base,vec3(1.),softbox)+glow*vec3(.44,.83,.94),1.);}`;
 for(const [type,src] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
  const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))return null;gl.attachShader(program,shader);
 }
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;gl.useProgram(program);
 const loc=Object.fromEntries(['viewport','rot','zoom','lamp'].map(k=>[k,gl.getUniformLocation(program,k)]));
 const attributes=['position','normal'].map(k=>gl.getAttribLocation(program,k));
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1024,1,0,gl.RGB,gl.UNSIGNED_BYTE,environment);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.enable(gl.DEPTH_TEST);
 const cache=new WeakMap();
 return (dest,mesh,yaw,pitch,x,y,power,scale)=>{
  if(gl.isContextLost())return false;
  if(surface.width<dest.width)surface.width=dest.width;if(surface.height<dest.height)surface.height=dest.height;
  const w=dest.width,h=dest.height;gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  let b=cache.get(mesh);if(!b){
   b=[gl.createBuffer(),gl.createBuffer()];gl.bindBuffer(gl.ARRAY_BUFFER,b[0]);gl.bufferData(gl.ARRAY_BUFFER,mesh.v,gl.STATIC_DRAW);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b[1]);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.tri,gl.STATIC_DRAW);cache.set(mesh,b);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,b[0]);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b[1]);
  attributes.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,i*12)});
  gl.uniform2f(loc.viewport,w,h);gl.uniform1f(loc.zoom,Math.min(w/mesh.w,h/mesh.h)*scale);
  gl.uniform4f(loc.rot,Math.sin(yaw),Math.cos(yaw),Math.sin(pitch),Math.cos(pitch));gl.uniform3f(loc.lamp,x,y,power);
  gl.drawElements(gl.TRIANGLES,mesh.tri.length,gl.UNSIGNED_SHORT,0);
  const ctx=dest.getContext('2d');ctx.clearRect(0,0,w,h);ctx.drawImage(surface,0,surface.height-h,w,h,0,0,w,h);return true;
 };
}
