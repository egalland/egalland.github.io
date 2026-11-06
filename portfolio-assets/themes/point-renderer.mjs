import {STRIDE,projectParticle} from './point-cloud.mjs?v=kinetic1';

const vertex=[
 'attribute vec3 a_position,a_from,a_color,a_fromColor,a_flow;',
 'attribute vec4 a_meta,a_sine,a_cosine;',
 'uniform vec2 u_viewport,u_center,u_pointer;',
 'uniform vec4 u_rotation;',
 'uniform float u_scale,u_time,u_motion,u_blend,u_dpr,u_screen,u_force,u_hover,u_fault,u_dot,u_opacity,u_scatter;',
 'uniform mediump float u_packet;varying mediump vec3 v_color;varying mediump float v_alpha;',
 'float hash(float n){return fract(sin(n)*43758.5453);}',
 'void main(){',
 ' float flow=fract(a_meta.w+u_time*a_meta.z)-a_meta.w;',
 ' vec3 p=mix(a_from,a_position+a_flow*flow,u_blend);',
 ' if(a_sine.w!=0. && u_motion>0.){',
 '   float phase=u_time*a_sine.w;',
 '   float angle=a_cosine.w==0.?phase:a_cosine.w*(1.-cos(phase))*.5;',
 '   p+=u_blend*(a_sine.xyz*sin(angle)+a_cosine.xyz*(cos(angle)-1.));',
 ' }',
 ' if(u_scatter>0.){',
 '   float weight=u_scatter*smoothstep(.22,.77,a_meta.y),angle=a_meta.y*21.+u_scatter*2.8;',
 '   p+=weight*vec3(1.4*cos(angle),.18+.88*sin(angle),1.28*sin(angle*.8));',
 ' }',
 ' float drift=mix(.012,.17,u_screen)*u_motion;',
 ' p.x+=sin(u_time*.72+a_meta.y*23.)*drift;p.y+=cos(u_time*.61+a_meta.y*31.)*drift;',
 ' p.z+=sin(u_time*.57+a_meta.y*19.)*.024*u_motion*(1.-u_screen);',
 ' vec3 q=vec3(p.x*u_rotation.x+p.z*u_rotation.y,p.y,-p.x*u_rotation.y+p.z*u_rotation.x);',
 ' q=vec3(q.x,q.y*u_rotation.z-q.z*u_rotation.w,q.y*u_rotation.w+q.z*u_rotation.z);',
 ' float perspective=mix(5./max(1.5,5.-q.z),1.,u_screen);',
 ' vec2 pixel=u_center+vec2(q.x,-q.y)*u_scale*perspective;',
 ' vec2 delta=pixel-u_pointer;float dist=length(delta);',
 ' float force=pow(max(0.,1.-dist/125.),2.)*mix(8.,-20.,u_force)*u_motion*u_hover;',
 ' pixel+=delta/max(1.,dist)*force;',
 ' float row=floor(pixel.y/13.);float gate=step(.78,hash(row*127.1+a_meta.y));',
 ' pixel.x+=u_fault*u_motion*gate*sin(floor(u_time*18.)+row)*11.;',
 ' pixel+=vec2(sin(a_meta.y*57.+u_time)*18.,cos(a_meta.y*41.+u_time)*12.)*u_fault*u_packet*u_motion;',
 ' gl_Position=vec4(pixel.x/u_viewport.x*2.-1.,1.-pixel.y/u_viewport.y*2.,clamp(-q.z/8.,-.9,.9),1.);',
 ' gl_PointSize=max(1.,u_dot*a_meta.x*perspective*(.97+sin(u_time*1.3+a_meta.y*18.)*.06*u_motion))*u_dpr;',
 ' v_color=mix(a_fromColor,a_color,u_blend);',
 ' v_color=mix(v_color,mix(vec3(.13,.65,.75),vec3(.81,.22,.52),step(.5,a_meta.y)),u_fault*gate*.5);',
 ' v_alpha=u_opacity*mix(.52,1.,clamp((q.z+1.8)/3.6,0.,1.));',
 '}'
].join('\n');
const fragment='precision mediump float;varying mediump vec3 v_color;varying mediump float v_alpha;uniform mediump float u_packet;void main(){float r=length(gl_PointCoord-.5)*2.;if(u_packet>.5){if(abs(gl_PointCoord.y-.5)>.16)discard;}else if(r>1.)discard;float alpha=u_packet>.5?1.:1.-smoothstep(.68,1.,r);gl_FragColor=vec4(v_color,alpha*v_alpha);}';
const maskVertex='attribute vec2 a_position;uniform vec2 u_viewport;uniform float u_scroll;void main(){gl_Position=vec4(a_position.x/u_viewport.x*2.-1.,1.-(a_position.y-u_scroll)/u_viewport.y*2.,0.,1.);}';
const maskFragment='precision mediump float;void main(){gl_FragColor=vec4(1.);}';

/** One viewport canvas; GPU buffers contain XYZ models, updated by uniforms. */
export function createPointRenderer(canvas,{masked=false,onFallback=()=>{}}={}){
 let gl=null,ctx=null,program=null,maskProgram=null,maskBuffer=null,disposed=false,width=1,height=1,dpr=1,polygons=[],maskPath=null,scroll=0;
 const buffers=new Map(),abort=new AbortController();
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(message);}return s;}
 function link(v,f){const p=gl.createProgram(),vs=shader(gl.VERTEX_SHADER,v),fs=shader(gl.FRAGMENT_SHADER,f);gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
 let uniforms={},attributes={},maskUniforms={},maskAt=-1;
 function release(){if(!gl)return;for(const buffer of buffers.values())gl.deleteBuffer(buffer);buffers.clear();if(maskBuffer)gl.deleteBuffer(maskBuffer);if(program)gl.deleteProgram(program);if(maskProgram)gl.deleteProgram(maskProgram);}
 function compatible(){
  if(gl){release();const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;}
  gl=null;ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});if(!ctx)throw Error('Rendu de points indisponible');
  canvas.dataset.renderer='canvas-3d';resize(width,height,dpr);onFallback();
 }
 try{
  gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:masked,powerPreference:'low-power'});
  if(!gl||masked&&!gl.getParameter(gl.STENCIL_BITS))compatible();
  else{
   program=link(vertex,fragment);
   for(const name of ['viewport','center','pointer','rotation','scale','time','motion','blend','dpr','screen','force','hover','fault','dot','opacity','packet','scatter'])uniforms[name]=gl.getUniformLocation(program,'u_'+name);
   for(const name of ['position','from','color','fromColor','meta','flow','sine','cosine'])attributes[name]=gl.getAttribLocation(program,'a_'+name);
   if(masked){maskProgram=link(maskVertex,maskFragment);maskBuffer=gl.createBuffer();maskAt=gl.getAttribLocation(maskProgram,'a_position');for(const name of ['viewport','scroll'])maskUniforms[name]=gl.getUniformLocation(maskProgram,'u_'+name);}
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);canvas.dataset.renderer='webgl-3d';
  }
 }catch(error){console.warn('Points : rendu 3D compatible',error.message);compatible();}
 const glCanvas=canvas;
 glCanvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(!disposed&&gl)compatible();},{signal:abort.signal});
 let ranges=[];
 function setMask(value){
  polygons=value||[];maskPath=new Path2D();for(const polygon of polygons){polygon.forEach((p,i)=>i?maskPath.lineTo(...p):maskPath.moveTo(...p));maskPath.closePath();}
  if(gl&&masked){const vertices=[];ranges=[];for(const polygon of polygons){ranges.push({start:vertices.length/2,count:polygon.length});for(const p of polygon)vertices.push(...p);}gl.bindBuffer(gl.ARRAY_BUFFER,maskBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);}
 }
 function resize(w,h,ratio=1){width=w;height=h;dpr=ratio;canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);if(gl)gl.viewport(0,0,canvas.width,canvas.height);else ctx?.setTransform(ratio,0,0,ratio,0,0);}
 function begin(scrollY=0){
  scroll=scrollY;
  if(!gl){ctx.clearRect(0,0,width,height);return;}
  gl.disable(gl.SCISSOR_TEST);gl.colorMask(true,true,true,true);gl.stencilMask(255);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|(masked?gl.STENCIL_BUFFER_BIT:0));
  if(masked&&polygons.length){
   for(let i=0;i<8;i++)gl.disableVertexAttribArray(i);
   gl.enable(gl.STENCIL_TEST);gl.stencilMask(1);gl.stencilFunc(gl.ALWAYS,1,1);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INVERT);gl.colorMask(false,false,false,false);
   gl.useProgram(maskProgram);gl.bindBuffer(gl.ARRAY_BUFFER,maskBuffer);gl.enableVertexAttribArray(maskAt);gl.vertexAttribPointer(maskAt,2,gl.FLOAT,false,0,0);
   gl.uniform2f(maskUniforms.viewport,width,height);gl.uniform1f(maskUniforms.scroll,scroll);
   for(const range of ranges)gl.drawArrays(gl.TRIANGLE_FAN,range.start,range.count);
   gl.colorMask(true,true,true,true);gl.stencilMask(0);gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);
  }
 }
 function draw(cloud,view,time=0,reduced=false){
  if(!cloud?.count)return;
  if(!gl){drawCompatible(cloud,view,time,reduced);return;}
  if(masked&&polygons.length&&view.masked!==false){gl.enable(gl.STENCIL_TEST);gl.stencilFunc(gl.EQUAL,1,1);}else gl.disable(gl.STENCIL_TEST);
  const r=view.rect||{left:0,top:0,width,height};
  gl.enable(gl.SCISSOR_TEST);gl.scissor(Math.max(0,Math.floor(r.left*dpr)),Math.max(0,Math.floor((height-r.top-r.height)*dpr)),Math.ceil(Math.min(width-r.left,r.width)*dpr),Math.ceil(Math.min(height,Math.max(0,r.top+r.height))-Math.max(0,r.top))*dpr);
  gl.useProgram(program);
  let buffer=buffers.get(cloud);if(!buffer){buffer=gl.createBuffer();buffers.set(cloud,buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,cloud.data,gl.STATIC_DRAW);if(buffers.size>18){const [old,oldBuffer]=buffers.entries().next().value;gl.deleteBuffer(oldBuffer);buffers.delete(old);}}else gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,size,offset] of [['position',3,0],['from',3,3],['color',3,6],['fromColor',3,9],['meta',4,12],['flow',3,16],['sine',4,19],['cosine',4,23]]){const at=attributes[name];gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,STRIDE*4,offset*4);}
  gl.uniform2f(uniforms.viewport,width,height);gl.uniform2f(uniforms.center,view.cx,view.cy);gl.uniform2f(uniforms.pointer,view.pointer?.x??-1000,view.pointer?.y??-1000);
  gl.uniform4f(uniforms.rotation,Math.cos(view.yaw||0),Math.sin(view.yaw||0),Math.cos(view.pitch||0),Math.sin(view.pitch||0));
  const values={scale:view.scale,time:reduced?0:time,motion:reduced?0:1,blend:view.blend??1,dpr,screen:cloud.space==='world'?0:1,force:view.attraction?1:0,hover:view.pointer?1:0,fault:reduced?0:view.fault||0,dot:view.dotSize||2,opacity:view.opacity??1,packet:view.packet?1:0,scatter:reduced||cloud.space!=='world'?0:view.scatter||0};
  for(const [key,value] of Object.entries(values))gl.uniform1f(uniforms[key],value);
  gl.drawArrays(gl.POINTS,0,cloud.count);
 }
 function drawCompatible(cloud,view,time,reduced){
  const r=view.rect||{left:0,top:0,width,height},out=[0,0,0,0],p=cloud.projected;
  ctx.save();ctx.beginPath();ctx.rect(r.left,r.top,r.width,r.height);ctx.clip();
  if(masked&&maskPath&&view.masked!==false){ctx.translate(0,-scroll);ctx.clip(maskPath,'evenodd');ctx.translate(0,scroll);}
  for(let i=0;i<cloud.count;i++){projectParticle(cloud,i,view,time,reduced,out);p.set(out,i*4);}
  for(const group of cloud.groups)for(let depth=0;depth<2;depth++){
   ctx.fillStyle=group.color;ctx.globalAlpha=(view.opacity??1)*(depth?.98:.55);ctx.beginPath();
   for(const index of group.indices){
    const n=index*4;if(Number(p[n+2]>=0)!==depth)continue;
    const x=p[n],y=p[n+1],size=p[n+3],radius=size/2;
    if(!view.packet&&size>=2.8){ctx.moveTo(x+radius,y);ctx.arc(x,y,radius,0,Math.PI*2);}
    else ctx.rect(x-radius,y-radius,size,view.packet?Math.max(1,size*.28):size);
   }
   ctx.fill();
  }ctx.restore();
 }
 return {get canvas(){return canvas;},get backend(){return gl?'webgl-3d':'canvas-3d';},resize,setMask,begin,draw,dispose(){disposed=true;abort.abort();release();gl?.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();}};
}
