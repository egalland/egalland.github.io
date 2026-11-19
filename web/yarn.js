// Orthographic fabric renderer. One depth buffer covers the hull, fittings and crew.
window.createYarnRenderer=function(){
 const surface=document.createElement('canvas'),g=surface.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
 if(!g)return null;
 const program=g.createProgram();
 function shader(type,source){const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));g.attachShader(program,s)}
 shader(g.VERTEX_SHADER,`attribute vec3 pos,col;attribute vec2 uv;uniform vec4 camera;uniform vec2 origin;varying vec3 c;varying vec2 tex;void main(){float d=pos.z*camera.x-pos.x*camera.y;gl_Position=vec4(origin.x+(pos.x*camera.x+pos.z*camera.y)*camera.z,origin.y+(pos.y*.91-d*.52)*camera.w,-(d+pos.y*.5714)/20.,1.);c=col;tex=uv;}`);
 shader(g.FRAGMENT_SHADER,`precision highp float;varying vec3 c;varying vec2 tex;uniform float lod;
 float strand(vec2 p,vec2 a,vec2 b){vec2 k=b-a;return length(p-a-k*clamp(dot(p-a,k)/dot(k,k),0.,1.));}
 void main(){vec2 p=fract(tex)-.5;float d=min(strand(p,vec2(-.43,.43),vec2(-.05,-.33)),strand(p,vec2(.43,.43),vec2(.05,-.33)));float thread=1.-smoothstep(.06,.25,d);float groove=smoothstep(.18,.34,d);float twist=sin(26.*(p.y+abs(p.x)))*.025;gl_FragColor=vec4(c*(1.+lod*(thread*.19-groove*.20+twist)),1.);}`);
 g.linkProgram(program);if(!g.getProgramParameter(program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(program));g.useProgram(program);
 const loc=n=>g.getUniformLocation(program,n),cam=loc('camera'),origin=loc('origin'),lod=loc('lod');
 const attrs=['pos','col','uv'].map(n=>g.getAttribLocation(program,n)),fixed=g.createBuffer(),moving=g.createBuffer();
 const norm=a=>{let n=Math.hypot(...a)||1;return a.map(x=>x/n)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>a.map((v,i)=>v-b[i]);
 const palette=new Map();function color(s){if(!palette.has(s)){const v=s.startsWith('#')?[0,1,2].map(i=>parseInt(s.slice(1+i*2,3+i*2),16)):s.match(/[0-9]+/g).map(Number);palette.set(s,v.map(x=>x/255))}return palette.get(s)}
 function mesh(list){const out=[];for(const o of list){
 const rgb=color(o.fill),p=o.v[0];
 function face(a,b,c,axis,coords,light=1){for(let i=0;i<3;i++){const v=[a,b,c][i],uv=coords?.[i]||[v[axis===0?2:0]*7,v[axis===1?2:1]*8];out.push(...v,...rgb.map(k=>k*light),...uv)}}
 if(o.kind==='poly'){const n=cross(sub(o.v[1],p),sub(o.v[2],p)).map(Math.abs),axis=n.indexOf(Math.max(...n));for(let j=2;j<o.v.length;j++)face(p,o.v[j-1],o.v[j],axis);continue}
 if(o.kind==='orb'){const ring=(i,j)=>{let a=i*Math.PI/8-Math.PI/2,b=j*Math.PI/8;return [p[0]+o.rx*Math.cos(a)*Math.cos(b),p[1]+o.ry*Math.sin(a),p[2]+o.rx*Math.cos(a)*Math.sin(b)]};for(let i=0;i<8;i++)for(let j=0;j<16;j++){let q=[ring(i,j),ring(i,j+1),ring(i+1,j+1),ring(i+1,j)],uv=[[j,i],[j+1,i],[j+1,i+1],[j,i+1]],l=.78+.22*i/7+.08*Math.cos(j*.393);for(let t of [[0,1,2],[0,2,3]])face(...t.map(k=>q[k]),0,t.map(k=>uv[k]),l)}continue}
 const end=o.v[1],u=norm(sub(end,p)),v=norm(cross(u,Math.abs(u[1])>.9?[1,0,0]:[0,1,0])),w=cross(u,v);function ring(a,j){return a.map((x,k)=>x+o.w*.5*(v[k]*Math.cos(j*Math.PI/4)+w[k]*Math.sin(j*Math.PI/4)))}for(let i=0;i<8;i++){let a=ring(p,i),b=ring(p,i+1),c=ring(end,i+1),d=ring(end,i);face(a,b,c,2);face(a,c,d,2)}
 }return new Float32Array(out)}
 let count=0;function bind(b){g.bindBuffer(g.ARRAY_BUFFER,b);attrs.forEach((a,i)=>{g.enableVertexAttribArray(a);g.vertexAttribPointer(a,i===2?2:3,g.FLOAT,false,32,[0,12,24][i])})}
 return {surface,set(list){let a=mesh(list);bind(fixed);g.bufferData(g.ARRAY_BUFFER,a,g.STATIC_DRAW);count=a.length/8},render(list,w,h,W,H,dx,dy,s,yaw){if(surface.width!==W||surface.height!==H){surface.width=W;surface.height=H}g.viewport(0,0,W,H);g.enable(g.DEPTH_TEST);g.depthFunc(g.LEQUAL);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);g.uniform4f(cam,Math.cos(yaw),Math.sin(yaw),2*s/w,2*s/h);g.uniform2f(origin,2*dx/w-1,1-2*dy/h);g.uniform1f(lod,Math.max(0,Math.min(1,(s-12)/22)));bind(fixed);g.drawArrays(g.TRIANGLES,0,count);let a=mesh(list);bind(moving);g.bufferData(g.ARRAY_BUFFER,a,g.STREAM_DRAW);g.drawArrays(g.TRIANGLES,0,a.length/8)}}
};
