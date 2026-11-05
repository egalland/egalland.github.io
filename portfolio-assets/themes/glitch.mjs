import {fractureEdge,edgeAt,arrival,projectPoint,noise,clamp,smooth} from './fracture.mjs';
import {createShape,sampleShape} from './fusion-shapes.mjs';

const completed=new WeakSet();
const definitions=[
 ['.hero-art','hero'],['#market-plus .project-window','market'],['#kikalmo .project-window','kikalmo'],
 ['#maison .project-window','maison'],['#bodyos .project-window','body'],
 ['#livre .lab-art','book'],['#redim .lab-art','redim'],['#atlas .lab-art','atlas'],
 ['#four-en-route .lab-art','timer'],['#biscuit-du-jour .lab-art','biscuit'],['#inktober .lab-art','calendar']
];
const tint=color=>{
 const c=color.slice(1).match(/../g).map(x=>parseInt(x,16));return `rgb(${c.map(v=>Math.round(v*.58+103)).join(',')})`;
};

export function start({reduced=false}={}){
 const root=document.documentElement,abort=new AbortController();
 const on=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:abort.signal});
 const canvas=document.createElement('canvas');canvas.id='fusion-motion';canvas.dataset.engine='glitch';canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Rendu Canvas indisponible');
 document.body.append(canvas);
 let width=innerWidth,height=innerHeight,raf=0,last=0,lastPaint=0,time=0,dirty=true,hidden=document.hidden,stopped=false;
 const pointer={x:width/2,y:height/2,active:false};
 const slots=definitions.map(([selector,kind],i)=>{
  const el=document.querySelector(selector);if(!el)return null;
  const shape=createShape(kind),samples=sampleShape(shape,width<=700?.048:.036),budget=width<=700?2800:4400;
  const points=samples.length>budget?Array.from({length:budget},(_,j)=>samples[Math.floor(j*samples.length/budget)]):samples;
  for(const point of points)point.scatter=noise(point.path+point.phase,i+3);
  for(const path of shape.paths)path.stroke=tint(path.color);
  const children=[...el.children].map(child=>({el:child,inert:child.inert,aria:child.getAttribute('aria-hidden')}));
  const slot={el,kind,shape,points,seed:i+3,children,seen:completed.has(el),age:completed.has(el)||reduced?5:0,live:false};
  el.dataset.fusionSlot=kind;
  function conceal(value){for(const child of children){child.el.inert=value?true:child.inert;if(value)child.el.setAttribute('aria-hidden','true');else if(child.aria===null)child.el.removeAttribute('aria-hidden');else child.el.setAttribute('aria-hidden',child.aria);}}
  slot.conceal=conceal;conceal(true);
  if(kind==='market'||kind==='kikalmo'){
   const button=document.createElement('button');button.type='button';button.className='fusion-control';button.textContent=kind==='kikalmo'?'Essayer la mini-démo ↗':'Explorer l’aperçu ↗';button.setAttribute('aria-expanded','false');
   el.append(button);slot.button=button;
   on(button,'click',()=>{slot.live=!slot.live;el.classList.toggle('fusion-live',slot.live);conceal(!slot.live);button.setAttribute('aria-expanded',String(slot.live));button.textContent=slot.live?'Revenir à la fusion ↙':kind==='kikalmo'?'Essayer la mini-démo ↗':'Explorer l’aperçu ↗';dirty=true;wake();});
  }
  return slot;
 }).filter(Boolean);
 function wake(){if(!raf&&!hidden&&!stopped)raf=requestAnimationFrame(frame);}
 function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,width<=700?1.4:1.8);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true;wake();}
 function polygon(edge,w,h,side){
  ctx.beginPath();if(side==='left')ctx.rect(0,0,w,h);
  ctx.moveTo(edge[0].x,edge[0].y);for(const p of edge)ctx.lineTo(p.x,p.y);
  for(let i=edge.length-1;i>=0;i--){
   const p=edge[i],t=i/(edge.length-1),profile=w*(.95-.09*(2*t-1)**2);
   const opening=Math.max(0,Math.min(Math.pow(Math.sin(t*Math.PI),.65)*w*.66,profile-p.x));
   ctx.lineTo(p.x+opening+(i>0&&i<edge.length-1?(noise(i,37)-.5)*14:0),p.y);
  }
  ctx.closePath();
 }
 function trace(edge){ctx.beginPath();edge.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));}
 function drawCursor(x,y,color,label,scale=1){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(4,20);ctx.lineTo(9,13);ctx.lineTo(17,12);ctx.closePath();ctx.fillStyle=color;ctx.strokeStyle='#0b1019';ctx.lineWidth=1.3;ctx.fill();ctx.stroke();
  if(label&&width>700){ctx.font='9px RedlineText,Arial';const w=ctx.measureText(label).width;ctx.fillStyle=color;ctx.fillRect(18,19,w+12,19);ctx.fillStyle='#151923';ctx.fillText(label,24,32);}ctx.restore();
 }
 function handles(vertices,color){ctx.strokeStyle=color;ctx.lineWidth=.8;for(const p of vertices){ctx.fillStyle='#10151f';ctx.fillRect(p[0]-2.6,p[1]-2.6,5.2,5.2);ctx.strokeRect(p[0]-2.6,p[1]-2.6,5.2,5.2);}}

 function draw(slot,rect){
  const mobile=width<=700,bleed=mobile?16:30;
  const w=rect.width+bleed*2,h=rect.height+28,left=rect.left-bleed,top=rect.top-14;
  const motion=arrival(slot.age,reduced),aim=!reduced&&pointer.active?clamp((pointer.x-(left+w/2))/width,-.5,.5):0;
  const offset=(1-motion.reveal)*.65+(reduced?0:Math.sin(time*.21+slot.seed)*.014+aim*.035);
  const edge=fractureEdge(w,h,slot.seed,offset),cx=w*.51,cy=h*.49;
  const scale=Math.min(w/5.1,h/3.7),yaw=slot.kind==='maison'?-.43:slot.kind==='hero'?time*(reduced?0:.08):Math.sin((reduced?0:time)*.2+slot.seed)*.12;
  const transform={cx,cy,scale,yaw,pitch:slot.kind==='maison'?.32:.055};
  const project=(p,group=0)=>{const q=[...p];if(group){q[0]+=(1-motion.objects)*(group===1?.7:-.7);q[1]+=(1-motion.objects)*.35;if(!reduced)q[1]+=Math.sin(time*.6+group*2)*.05;}return projectPoint(q,transform);};
  ctx.save();ctx.translate(left,top);ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
  // A second world opens through the cut; there is no paper texture.
  polygon(edge,w,h,'right');ctx.fillStyle='#eeece5';ctx.fill();
  ctx.save();polygon(edge,w,h,'right');ctx.clip();ctx.fillStyle='#82928422';
  for(let x=0;x<w;x+=25)for(let y=0;y<h;y+=25)ctx.fillRect(x,y,1,1);
  ctx.restore();
  // Two incomplete parallel scars make the arrival feel like an intrusion.
  if(motion.reveal>.1){
   for(let scar=0;scar<2;scar++){
    const begin=Math.floor(edge.length*(scar?.38:.17)),end=Math.floor(edge.length*(scar?.76:.52));
    ctx.beginPath();for(let i=begin;i<end;i++){const p=edge[i],d=18+scar*15;ctx.lineTo(p.x-d,p.y);}for(let i=end-1;i>=begin;i--){const p=edge[i],t=(i-begin)/(end-begin);ctx.lineTo(p.x-18-scar*15-7*Math.sin(t*Math.PI)*motion.reveal,p.y);}ctx.closePath();ctx.fillStyle=scar?'#98afa666':'#eeece5';ctx.fill();
   }
  }
  // Continuous strokes / surfaces, clipped on the cursor side.
  ctx.save();polygon(edge,w,h,'left');ctx.clip('evenodd');
  for(const face of slot.shape.surfaces){const vertices=face.vertices.map(p=>project(p));ctx.beginPath();vertices.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=face.color+'20';ctx.fill();}
  const projected=slot.shape.paths.map(path=>path.vertices.map(p=>project(p,path.group)));
  for(let i=0;i<slot.shape.paths.length;i++){
   const path=slot.shape.paths[i],vertices=projected[i],amount=path.group?motion.objects:motion.build;
   if(amount<=0)continue;
   const length=(vertices.length-1)*amount,lastIndex=Math.floor(length);ctx.beginPath();ctx.moveTo(vertices[0][0],vertices[0][1]);
   for(let j=1;j<=lastIndex;j++)ctx.lineTo(vertices[j][0],vertices[j][1]);
   if(lastIndex<vertices.length-1){const a=vertices[lastIndex],b=vertices[lastIndex+1],t=length-lastIndex;ctx.lineTo(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);}
   ctx.lineWidth=path.weight;ctx.strokeStyle=path.stroke;ctx.globalAlpha=path.group?motion.objects:.73;ctx.stroke();
  }
  ctx.globalAlpha=1;
  if(!reduced){
   const trackIndex=Math.floor(time*.14+slot.seed)%projected.length,track=projected[trackIndex];
   const phase=(time*.12)%1,pos=phase*(track.length-1),a=track[Math.floor(pos)],b=track[Math.min(track.length-1,Math.floor(pos)+1)],t=pos%1;
   if(a&&b)drawCursor(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,'#9abcf2','Interface',mobile?.85:1);
   const satellite=slot.shape.paths.findIndex(p=>p.group===2||p.group===1);
   if(satellite>=0&&motion.objects>.1){const v=projected[satellite];handles([v[0],v[2]||v.at(-1)],'#d2a4dc');drawCursor(v[0][0],v[0][1],'#d2a4dc','Mouvement',.9);}
  }
  ctx.restore();
  // Exactly the same geometry, sampled as moving matter on the other side.
  ctx.save();polygon(edge,w,h,'right');ctx.clip();
  for(const point of slot.points){
   if(point.group&&point.phase>motion.objects)continue;
   const pos=project(point.p,point.group),n=point.scatter;
   const gather=1-motion.build;
   pos[0]+=(n-.5)*80*gather;pos[1]+=(point.phase-.5)*60*gather;
   if(!reduced){pos[0]+=Math.sin(time*.8+point.phase*15)*.55;pos[1]+=Math.cos(time*.7+point.phase*17)*.55;}
   const near=Math.max(0,1-Math.abs(pos[0]-edgeAt(edge,pos[1]))/28),size=(mobile?1.45:1.65)+near*.4;
   ctx.fillStyle=point.color;ctx.globalAlpha=.66+point.phase*.32;ctx.fillRect(pos[0]-size/2,pos[1]-size/2,size,size);
  }
  ctx.restore();ctx.globalAlpha=1;
  // Short chromatic dislocation remains local to the fracture.
  trace(edge);ctx.lineWidth=1.2;ctx.strokeStyle='#182c2bb0';ctx.stroke();
  for(let j=3;j<edge.length-2;j+=11){const p=edge[j],q=edge[j+2];ctx.beginPath();ctx.moveTo(p.x-1,p.y);ctx.lineTo(q.x-1,q.y);ctx.strokeStyle=j%2?'#e89986':'#8ed1d5';ctx.lineWidth=1+motion.fault*2;ctx.stroke();}
  if(motion.fault>.01){
   for(let j=0;j<5;j++){
    const y=h*(.2+j*.13),x=edgeAt(edge,y),shift=Math.sin(j*8+slot.age*39)*12*motion.fault;
    const dpr=canvas.width/width,sx=Math.max(0,left+x-65),sy=Math.max(0,top+y),sw=Math.min(130,width-sx),sh=Math.min(4+j*2,height-sy);
    if(sw>0&&sh>0)ctx.drawImage(canvas,sx*dpr,sy*dpr,sw*dpr,sh*dpr,sx-left+shift,sy-top,sw,sh);
    ctx.fillStyle=j%2?'#d686c34a':'#7bc5cc5a';ctx.fillRect(x-55+shift,y,95,2+j%3);
    ctx.strokeStyle=j%2?'#db93b7':'#92cfd0';ctx.beginPath();ctx.moveTo(x-28+shift,y+7);ctx.lineTo(x+35+shift,y+7);ctx.stroke();
   }
  }
  // Fragments are geometric objects, not full-screen noise or flashes.
  if(!reduced&&motion.objects>0){
   for(let j=0;j<8;j++){
    const y=h*(.12+noise(j,slot.seed)*.77),x=edgeAt(edge,y)+(noise(j+9,slot.seed)-.5)*38,dy=Math.sin(time*.7+j)*3;
    ctx.strokeStyle=j%2?'#b9694c':'#608a80';ctx.globalAlpha=.6;ctx.strokeRect(x,y+dy,2+noise(j+1,slot.seed)*4,2+noise(j+2,slot.seed)*5);
   }
  }
  ctx.globalAlpha=1;ctx.font=`${mobile?8:9}px monospace`;ctx.letterSpacing='1px';
  ctx.fillStyle='#8995a9';ctx.fillText('CURSEURS',16,h-18);ctx.fillStyle='#5c6b5c';ctx.textAlign='right';ctx.fillText('POINTS',w-16,27);ctx.textAlign='left';ctx.letterSpacing='0px';
  ctx.restore();
 }
 function frame(stamp){
  raf=0;if(hidden||stopped)return;
  if(!reduced&&stamp-lastPaint<32){wake();return;}lastPaint=stamp;
  const dt=last?Math.min((stamp-last)/1000,.07):.016;last=stamp;
  if(!reduced)time+=dt;if(reduced&&!dirty)return;dirty=false;ctx.clearRect(0,0,width,height);
  const visible=slots.map(slot=>({slot,rect:slot.el.getBoundingClientRect()})).filter(({slot,rect})=>!slot.live&&rect.width>0&&rect.bottom>65&&rect.top<height).sort((a,b)=>Math.abs(a.rect.top+a.rect.height/2-height/2)-Math.abs(b.rect.top+b.rect.height/2-height/2)).slice(0,3);
  for(const {slot,rect} of visible){
   if(!slot.seen){slot.seen=true;completed.add(slot.el);}
   if(!reduced)slot.age+=dt;draw(slot,rect);
  }
  root.dataset.fusionFrames=String(Number(root.dataset.fusionFrames||0)+1);
  if(!reduced&&visible.length)wake();
 }
 on(window,'resize',resize,{passive:true});on(window,'scroll',()=>{dirty=true;wake();},{passive:true});
 on(document,'pointermove',event=>{if(event.pointerType!=='touch'){pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;}},{passive:true});
 on(window,'blur',()=>{pointer.active=false;});
 on(document,'visibilitychange',()=>{hidden=document.hidden;if(hidden){cancelAnimationFrame(raf);raf=0;}else{last=0;dirty=true;wake();}});
 root.dataset.glitchEngine='active';resize();
 return {stop(){stopped=true;abort.abort();cancelAnimationFrame(raf);canvas.remove();for(const slot of slots){slot.conceal(false);slot.button?.remove();delete slot.el.dataset.fusionSlot;slot.el.classList.remove('fusion-live');}delete root.dataset.glitchEngine;}};
}
