(() => {
  'use strict';
  const canvas = document.getElementById('scene');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', {alpha:false});
  if (!ctx) return;

  const TAU = Math.PI * 2;
  const C = {dark:'#213330',black:'#142423',steel:'#667c72',cream:'#c4c5a5',light:'#e0d7b4',sage:'#8faaa0',trim:'#4c635a',copper:'#bf713d',amber:'#e9a457',ice:'#99efce',glass:'#407369',white:'#f1e6c7'};
  const pods=[[-5.2,0], [0,-0.55], [5.15,-0.08],[10.30,-0.08]];
  const staticShapes=[], stars=[];
  let shapes=staticShapes, width=1,height=1,scale=1,dx=0,dy=0, yaw=.43, zoom=1, paused=matchMedia('(prefers-reduced-motion: reduce)').matches, clock=0, slide=null, moved=false;
  let visible=true, dirty=true, fixed=[], pick=[];
  const agents=[
    {x:-4.7,z:1.1,home:0,color:'#e6a663',target:null,queue:[],idle:2,step:0},
    {x:-.6,z:.9,home:1,color:'#72d9bc',target:null,queue:[],idle:6,step:1},
    {x:4.3,z:1.25,home:2,color:'#e5bd60',target:null,queue:[],idle:9,step:2}
  ];
  const shadeCache=new Map();
  function shade(hex,f){
    const key=hex+f;
    if(shadeCache.has(key))return shadeCache.get(key);
    const n=parseInt(hex.slice(1),16);
    const rgb=[n>>16,n>>8&255,n&255].map(v=>Math.min(255,Math.round(v*f)));
    const value='rgb('+rgb.join(',')+')'; shadeCache.set(key,value);return value;
  }
  const point=(x,y,z)=>[x,y,z];
  function polygon(vertices,fill,edge='',w=0.014,glow=0){
    shapes.push({kind:'poly',v:vertices,fill,edge,w,glow});
  }
  function line(a,b,col,w=.04,glow=0){shapes.push({kind:'line',v:[a,b],fill:col,w,glow});}
  function orb(x,y,z,rx,ry,col,lit=false){shapes.push({kind:'orb',v:[point(x,y,z)],rx,ry,fill:col,lit});}
  function block(x,y,z,w,h,d,col,edge='#31473f'){
    const a=x-w/2,b=x+w/2,c=z-d/2,e=z+d/2,t=y+h;
    polygon([[a,t,c],[b,t,c],[b,t,e],[a,t,e]],shade(col,1.1),edge);
    const sides=[[[a,y,e],[a,y,c],[a,t,c],[a,t,e]],[[b,y,c],[b,y,e],[b,t,e],[b,t,c]],[[b,y,e],[a,y,e],[a,t,e],[b,t,e]],[[a,y,c],[b,y,c],[b,t,c],[a,t,c]]];
    sides.forEach((v,i)=>{polygon(v,shade(col,[.72,.68,.87,.64][i]),edge);shapes.at(-1).normal=[[-1,0],[1,0],[0,1],[0,-1]][i];});
  }
  function chamfer(x,y,z,w,d,h,r,col){
    const u=w/2,v=d/2;
    const pts=[[-u+r,-v],[u-r,-v],[u,-v+r],[u,v-r],[u-r,v],[-u+r,v],[-u,v-r],[-u,-v+r]].map(([a,b])=>[x+a,y,z+b]);
    const top=pts.map(([a,b,c])=>[a,b+h,c]);
    polygon(top,shade(col,1.1),'#364d43',.024);
    for(let i=0;i<8;i++){
      const j=(i+1)%8;
      polygon([pts[i],pts[j],top[j],top[i]],shade(col,[.63,.65,.73,.82,.85,.77,.64,.6][i]),'#2b4038',.018);
      shapes.at(-1).normal=[pts[j][2]-pts[i][2],pts[i][0]-pts[j][0]];
    }
  }
  function cylinder(x,y,z,r,h,col,n=16){
    const pts=Array.from({length:n},(_,i)=>[x+r*Math.cos(TAU*i/n),y,z+r*Math.sin(TAU*i/n)]);
    const top=pts.map(([a,b,c])=>[a,b+h,c]);
    polygon(top,shade(col,1.12),'#344a41');
    for(let i=0;i<n;i++){
      const j=(i+1)%n, angle=TAU*(i+.5)/n;
      polygon([pts[i],pts[j],top[j],top[i]],shade(col,Math.round((.77+.19*Math.cos(angle-1.3))*100)/100));
      shapes.at(-1).normal=[Math.cos(angle),Math.sin(angle)];
    }
  }
  function consoleUnit(x,z,k=0){
    block(x,0,z,.88,.1,.57,C.trim);
    block(x,.10,z,.75,.49,.43,C.steel);
    block(x,.55,z+.08,.94,.12,.59,C.cream);
    block(x,.67,z-.13,.85,.57,.18,C.sage);
    block(x,.73,z-.03,.7,.39,.025,C.black);
    block(x-.035,.78,z-.008,.52,.24,.022,'#8ccbaf','');
    for(let i=0;i<3;i++)line([x-.24,.82+.065*i,z+.011],[x-.2+(i+k)%3*.10,.82+.065*i,z+.011],C.glass,.023);
    for(let i=0;i<4;i++)block(x-.28+i*.165,.675,z+.25,.105,.014,.073,i===3?C.copper:C.trim,'');
  }
  function rack(x,z,idx){
    block(x,0,z,.94,.15,.83,C.trim);
    block(x,.15,z,.85,1.38,.68,C.sage);
    for(let j=0;j<4;j++){
      block(x,.24+j*.29,z+.347,.69,.22,.03,C.black);
      for(let i=0;i<4;i++)block(x-.23+i*.096,.31+j*.29,z+.373,.045,.038,.015,i===(idx+j)%4?C.amber:C.ice,'');
      block(x+.19,.31+j*.29,z+.376,.09,.024,.012,C.steel,'');
    }
    block(x,1.53,z,.91,.11,.76,C.cream);
  }
  function room(x,z,i){
    chamfer(x,-.91,z+1,4.18,5.26,.22,.46,C.dark);
    chamfer(x,-.72,z+1,4.43,5.51,.35,.52,i===1?'#957a56':C.steel);
    chamfer(x,-.42,z+1,4.57,5.65,.22,.54,C.sage);
    chamfer(x,-.21,z+1,4.42,5.49,.20,.47,C.trim);
    chamfer(x,-.035,z+1,4.25,5.31,.04,.42,['#b39372','#98b4a3','#a0aebe','#b5a0ba'][i]);
    for(let j=-1;j<=1;j++)line([x+j*.92,.014,z-1.55],[x+j*.92,.014,z+3.54],'#63766a',.016);
    for(let j=-1;j<=4;j++)line([x-1.94,.014,z+j*.78],[x+1.94,.014,z+j*.78],'#65786c',.017);
    // Recessed luminaires and impact guards on the exposed hull.
    for(let j=0;j<5;j++){
      const xx=x-1.50+j*.75;
      block(xx,-.58,z+3.766,.57,.19,.07,C.dark);
      block(xx,-.52,z+3.815,.37,.045,.028,j===i?C.amber:C.steel,'');
      block(xx,-.23,z+3.77,.062,.14,.09,C.light);
    }
    for(const side of [-1,1]){
      block(x+side*1.79,-.68,z+3.32,.27,.51,.29,C.trim);
      block(x+side*1.78,-.42,z+3.32,.30,.1,.31,C.copper);
    }
    // Rear bulkhead, segmented panels, conduits, glazed display strips.
    for(let j=0;j<4;j++){
      const xx=x-1.44+j*.96;
      block(xx,0,z-1.48,.93,1.53,.23,j%2?C.sage:C.steel);
      block(xx,.24,z-1.348,.74,1.04,.055,C.trim);
      block(xx,.41,z-1.309,.59,.71,.03,j===1&&i===1?C.glass:C.steel);
      for(let k=0;k<3;k++)block(xx-.13+k*.11,.20,z-1.30,.055,.11,.032,C.black,'');
      block(xx,1.35,z-1.32,.68,.07,.04,i===1?C.amber:C.ice,'');
    }
    block(x,1.50,z-1.48,3.97,.13,.32,C.cream);
    line([x-1.89,1.72,z-1.52],[x+1.90,1.72,z-1.52],C.trim,.14);
    line([x-1.89,1.78,z-1.52],[x+1.90,1.78,z-1.52],C.copper,.065);
    for(const dd of [-1.8,-.65,.65,1.8])block(x+dd,1.57,z-1.52,.1,.28,.20,C.cream);
  }
  function bridge(x,z0,z1){
    const z=(z0+z1)/2;
    block(x,-.49,z,1.60,.42,1.38,C.steel);
    block(x,-.07,z,1.67,.08,1.36,C.trim);
    for(let i=0;i<9;i++)block(x-.64+i*.16,.015,z,.06,.012,1.18,C.sage,'');
    for(const side of [-1,1]){
      line([x-.8,.43,z+side*.7],[x+.8,.43,z+side*.7],C.copper,.064);
      for(let i=-1;i<=1;i++)line([x+i*.7,.02,z+side*.7],[x+i*.7,.42,z+side*.7],C.steel,.063);
    }
  }
  pods.forEach(([x,z],i)=>room(x,z,i));
  bridge(7.725,-.08,-.08);bridge(-2.60,0,-.55);bridge(2.58,-.55,-.08);
  [-6.4,-5.42,-4.44].forEach((x,i)=>rack(x,-.78,i));
  consoleUnit(-6.35,.47);
  // Main flight deck and its oversized panoramic phosphor bank.
  block(0,.69,-1.82,2.68,.82,.13,C.black);
  block(0,.77,-1.74,2.50,.63,.04,'#61998a');
  for(let i=0;i<13;i++){
    const x=-1.13+i*.17;
    line([x,.88,-1.70],[x+.14,.88+.19*(1+Math.sin(i*1.7)),-1.70],C.ice,.031);
  }
  [-1.10,0,1.1].forEach((x,i)=>consoleUnit(x,-.97,i));
  for(const x of [-1.05,.98]){cylinder(x,0,.15,.14,.23,C.trim,8);block(x,.22,.15,.43,.11,.43,C.copper);block(x,.30,.34,.42,.28,.08,C.sage);}
  // Instrumented reactor with translucent-looking frosted housing and copper ribs.
  const rx=5.45,rz=-.35;
  cylinder(rx,0,rz,.85,.15,C.trim);cylinder(rx,.15,rz,.70,.16,C.cream);
  cylinder(rx,.31,rz,.62,.93,'#6ba491');
  for(let i=0;i<12;i++){
    const a=i*TAU/12,xx=rx+.625*Math.cos(a),zz=rz+.625*Math.sin(a);
    line([xx,.34,zz],[xx,1.24,zz],i%3===0?C.copper:C.ice,i%3===0?.09:.035);
  }
  cylinder(rx,1.21,rz,.70,.16,C.cream);cylinder(rx,1.37,rz,.47,.16,C.trim);
  cylinder(rx,1.53,rz,.29,.09,C.amber);
  consoleUnit(3.62,-.53,1);
  for(let i=0;i<2;i++){cylinder(6.52,.01,.32+i*.45,.18,.52,C.copper,12);cylinder(6.52,.51,.32+i*.45,.16,.08,C.steel,12);}
  // External communications mast, offset brackets, cabling.
  block(-7.0,-.03,-1.12,.43,.22,.42,C.cream);
  line([-7,.18,-1.12],[-7,2.24,-1.12],C.sage,.083);
  line([-7.39,1.82,-1.12],[-6.61,1.82,-1.12],C.cream,.065);
  orb(-7,2.25,-1.12,.077,.077,C.amber,true);
  for(let i=0;i<3;i++)line([-6.84+i*.12,-.6,1.1],[-6.84+i*.12,-.57,-1.15],C.copper,.08);
  const hullSize=staticShapes.length;
  let folders=[],hovered=null,selected=null;
  const names=['Atelier GitHub','Studio Sites','Réacteur de télémétrie','Salle des archives'];
  const tip=document.querySelector('#folderTip'), marker=document.querySelector('#sceneMarker');
  const label=tip.querySelector('strong'),caption=tip.querySelector('small'),action=tip.querySelector('button');
  function stock(groups){
    staticShapes.length=hullSize;
    folders=[];
    for(const deck of [0,1,3]){
      const [x,z]=pods[deck],list=groups[deck],perShelf=12;
      const stacks=Math.max(1,Math.ceil(list.length/(perShelf*4)));
      for(let shelf=0;shelf<stacks;shelf++){
        const subset=list.slice(shelf*48,(shelf+1)*48);
        const rows=Math.max(1,Math.ceil(subset.length/perShelf));
        const baseZ=z+1.78+(shelf%3)*.80;
        const tint=deck===3?'#ad8fba':deck===0?'#e3a171':'#85c9b3';
        for(let row=0;row<rows;row++){
          const y=.05+(row+Math.floor(shelf/3)*4)*.33;
          block(x,y,baseZ,3.6,.045,.40,C.trim);
          subset.slice(row*perShelf,(row+1)*perShelf).forEach((item,col)=>{
            const cx=x-1.52+col*.277;
            block(cx,y+.045,baseZ,.245,.245,.25,tint);
            block(cx-.045,y+.29,baseZ-.08,.124,.055,.065,C.cream);
            block(cx,y+.11,baseZ+.132,.13,.045,.018,C.light);
            folders.push({item,point:[cx,y+.18,baseZ+.13]});
          });
        }
        for(const side of [-1,1])block(x+side*1.76,.02,baseZ,.075,(rows+Math.floor(shelf/3)*4)*.33,.38,C.steel);
      }
    }
    try{yarn?.set(staticShapes)}catch{yarn=null}
    layout();
  }
  let yarn;
  try { yarn=window.createYarnRenderer?.(); yarn?.set(staticShapes); }
  catch { yarn=null; }
  const compact=matchMedia('(max-width: 640px)');
  let focus=compact.matches?1:-1;
  const buttons=[...document.querySelectorAll('[data-focus]')];
  function selectDeck(index){
    focus=index;hovered=null;selected=index<0?null:{deck:index};zoom=1;layout();window.dispatchEvent(new CustomEvent("deck-focus",{detail:index}));
  }
  buttons.forEach(button=>button.onclick=()=>selectDeck(Number(button.dataset.focus)));
  compact.addEventListener('change',()=>selectDeck(compact.matches?1:-1));
  let seed=19273;
  function random(){seed=(seed*48271)%2147483647;return seed/2147483647;}
  for(let i=0;i<185;i++)stars.push([random(),random(),random()]);
  canvas.style.touchAction='pan-y';
  function proj(p){
    const [x,y,z]=p,c=Math.cos(yaw),s=Math.sin(yaw);
    return [dx+scale*(x*c+z*s),dy+scale*((z*c-x*s)*.52-y*.91)];
  }
  function depth(v){return v[2]*Math.cos(yaw)-v[0]*Math.sin(yaw)+v[1]*.57;}
  function prep(list){
    const c=Math.cos(yaw),s=Math.sin(yaw);
    return list.filter(o=>!o.normal||o.normal[0]*-s+o.normal[1]*c>-.001).map(o=>({o,p:o.v.map(proj),d:o.v.reduce((a,v)=>a+depth(v),0)/o.v.length})).sort((a,b)=>a.d-b.d);
  }
  function draw({o,p}){
    ctx.fillStyle=o.fill;ctx.strokeStyle=o.edge||o.fill;
    ctx.lineWidth=Math.max(.40,(o.w||.02)*scale);
    if(o.kind==='orb'){
      const [x,y]=p[0],r=o.rx*scale;
      ctx.beginPath();ctx.ellipse(x,y,r,o.ry*scale,0,0,TAU);
      if(o.lit){ctx.shadowBlur=r*1.4;ctx.shadowColor=o.fill;}
      ctx.fill();ctx.shadowBlur=0;return;
    }
    ctx.beginPath();ctx.moveTo(...p[0]);for(let i=1;i<p.length;i++)ctx.lineTo(...p[i]);
    if(o.kind==='line'){ctx.lineCap='round';ctx.stroke();return;}
    ctx.closePath();ctx.fill();if(o.edge)ctx.stroke();
  }
  function astronaut(a){
    const start=shapes.length, angle=a.heading||0, stride=a.target?Math.sin(a.step):0;
    const rise=.022*Math.abs(stride),coat=a.color;
    for(const side of [-1,1]){
      const swing=side*stride, foot=.142*swing, lift=a.target?.085*Math.max(0,-side*Math.cos(a.step)):0;
      const hip=[side*.079,.31+rise,0],knee=[side*.083,.19+lift*.6,foot*.52+.045],ankle=[side*.085,.065+lift,foot];
      line(hip,knee,coat,.112);line(knee,ankle,C.trim,.106);orb(ankle[0],ankle[1],foot+.027,.081,.058,C.dark);
      const elbow=[side*.177,.405+rise,-swing*.075],hand=[side*.16,.325+rise,-swing*.123+.035];
      line([side*.133,.52+rise,0],elbow,coat,.11);line(elbow,hand,coat,.092);orb(...hand,.058,.058,C.trim);
    }
    orb(0,.414+rise,0,.169,.176,coat);orb(0,.68+rise,0,.203,.195,C.white);
    orb(0,.67+rise,.129,.151,.106,'#345453');orb(-.065,.703+rise,.242,.032,.017,C.ice);
    for(const shape of shapes.slice(start)){if(shape.rx){shape.rx*=1.55;shape.ry*=1.55;}if(shape.w)shape.w*=1.55;}
    for(let i=start;i<shapes.length;i++)shapes[i].v=shapes[i].v.map(([x,y,z])=>[a.x+1.55*(x*Math.cos(angle)+z*Math.sin(angle)),y*1.55,a.z+1.55*(z*Math.cos(angle)-x*Math.sin(angle))]);

  }
  function route(a,index){
    const [x,z]=pods[index],current=[...pods].sort((p,q)=>Math.abs(a.x-p[0])-Math.abs(a.x-q[0]))[0];
    const paths=[[a.x,current[1]+.24]];
    if(current[0]!==x) {
      const dir=Math.sign(x-current[0]);
      for(let i=pods.indexOf(current);i!==index;i+=dir){
        const [px,pz]=pods[i], [nx,nz]=pods[i+dir];
        paths.push([px+dir*1.77,pz+.12],[(px+nx)/2,(pz+nz)/2],[nx-dir*1.77,nz+.12]);
      }
    }
    paths.push([x+(index===2?-.5:.35),z+.65]);
    a.queue=paths;a.target=a.queue.shift();a.home=index;a.idle=5;
  }
  function tick(dt){
    for(const [i,a] of agents.entries()){
      if(!a.target){a.idle-=dt;if(a.idle<0)route(a,(a.home+1+i%2)%pods.length);continue;}
      const [tx,tz]=a.target,xx=tx-a.x,zz=tz-a.z,dist=Math.hypot(xx,zz),step=dt*.64;
      if(dist<=step){a.x=tx;a.z=tz;a.target=a.queue.shift()||null;a.idle=4+i*2;}
      else{const turn=Math.atan2(xx,zz)-(a.heading||0);a.heading=(a.heading||0)+Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*10);a.x+=xx/dist*step;a.z+=zz/dist*step;a.step+=step*Math.PI/.285;}
    }
  }
  function layout(){
    const box=canvas.getBoundingClientRect();width=box.width;height=box.height;
    if(width<2||height<2)return;
    const ratio=Math.min(2,devicePixelRatio||1);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    const room=pods[focus];
    const vertices=staticShapes.flatMap(o=>o.v).filter(([x])=>!room||Math.abs(x-room[0])<=2.3);
    buttons.forEach(button=>button.setAttribute('aria-pressed',Number(button.dataset.focus)===focus));
    document.querySelector('#viewTitle').textContent=['Vue d’ensemble','Atelier GitHub','Studio Sites','Réacteur de télémétrie','Salle des archives'][focus+1];
    scale=1;dx=0;dy=0;
    const pp=vertices.map(proj),xs=pp.map(a=>a[0]),ys=pp.map(a=>a[1]);
    const min=a=>a.reduce((n,v)=>Math.min(n,v),Infinity),max=a=>a.reduce((n,v)=>Math.max(n,v),-Infinity);
    const l=min(xs),r=max(xs),t=min(ys),b=max(ys);
    scale=Math.min(width*.95/(r-l),height*(focus<0?.82:.75)/(b-t))*zoom;
    dx=width*.50-(r+l)*scale*.5;dy=height*.53-(b+t)*scale*.5;
    fixed=prep(staticShapes);
    updateMarker();
    dirty=true;
  }
  function back(){
    ctx.fillStyle='#0c191b';ctx.fillRect(0,0,width,height);
    const haze=ctx.createRadialGradient(width*.52,height*.55,0,width*.5,height*.5,width*.55);
    haze.addColorStop(0,'rgba(70,106,89,.42)');haze.addColorStop(.75,'rgba(36,59,52,.16)');haze.addColorStop(1,'rgba(9,19,22,0)');
    ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
    for(const [x,y,s] of stars){
      ctx.fillStyle='rgba(190,219,199,'+(.12+s*.43)+')';const rad=s>.91?1.2:.58;
      ctx.fillRect(x*width,y*height,rad,rad);
      if(s>.987){ctx.fillRect(x*width-2,y*height,5,.6);ctx.fillRect(x*width,y*height-2,.6,5);}
    }
    ctx.save();ctx.translate(width*.51,height*.61);ctx.rotate(-.17);
    for(const f of [1,1.19]){ctx.strokeStyle='rgba(123,163,138,.14)';ctx.lineWidth=.75;ctx.setLineDash(f>1?[1,8]:[]);ctx.beginPath();ctx.ellipse(0,0,width*.47*f,height*.29*f,0,0,TAU);ctx.stroke();}
    ctx.restore();
  }
  function render(){
    back();const transient=[];shapes=transient;agents.forEach(astronaut);shapes=staticShapes;
    if(yarn&&!yarn.surface.getContext('webgl').isContextLost()){try{yarn.render(transient,width,height,canvas.width,canvas.height,dx,dy,scale,yaw);ctx.drawImage(yarn.surface,0,0,width,height);dirty=false;return;}catch{yarn=null;}}
    const dyn=prep(transient);let j=0;
    for(const polygon of fixed){while(j<dyn.length&&dyn[j].d<polygon.d)draw(dyn[j++]);draw(polygon);}
    while(j<dyn.length)draw(dyn[j++]);dirty=false;
  }
  let last=0;
  function frame(now){
    if(visible&&!document.hidden&&(now-last>=32||dirty)){
      const dt=Math.min(.12,(now-last)/1000);last=now;
      if(!paused){clock+=dt;tick(dt);}
      if(dirty||!paused)render();
    }
    requestAnimationFrame(frame);
  }
  function rotate(delta){yaw+=delta;layout();}
  function magnify(f){zoom=Math.max(.70,Math.min(1.75,zoom*f));layout();}
  function targetAt(x,y,touch){
    let nearest=null,best=Infinity;
    for(const folder of folders){
      if(focus>=0 && folder.item.deck!==focus)continue;
      const [fx,fy]=proj(folder.point),d=Math.hypot(x-fx,y-fy);
      if(d<Math.max(touch?13:6,scale*.19)&&d<best){nearest=folder;best=d;}
    }
    if(nearest)return {deck:nearest.item.deck,key:nearest.item.key};
    // Invert the floor projection so the entire deck can be pointed at.
    const u=(x-dx)/scale,v=(y-dy)/(scale*.52),c=Math.cos(yaw),s=Math.sin(yaw);
    const wx=u*c-v*s,wz=u*s+v*c;
    const deck=pods.findIndex(([px,pz])=>Math.abs(wx-px)<=2.29 && wz>=pz-1.83 && wz<=pz+3.83);
    return deck<0?null:{deck};
  }
  function updateMarker(){
    const target=hovered||selected;
    const folder=target?.key?folders.find(f=>f.item.key===target.key):null;
    if(!target||(target.key&&!folder)){tip.hidden=true;marker.hidden=true;canvas.style.cursor='grab';return}
    const [px,pz]=pods[target.deck];
    const [x,y]=proj(folder?folder.point:[px,.05,pz+1.05]);
    if(x<2||x>width-2||y<2||y>height-2){tip.hidden=true;marker.hidden=true;return}
    const pinned=selected && target.deck===selected.deck && target.key===selected.key;
    label.textContent=folder?folder.item.name:names[target.deck];
    caption.textContent=folder?names[target.deck]:buttons[target.deck+1].textContent.split(' · ')[1]?.concat(' dossiers')||'Télémétrie Codex';
    action.hidden=!pinned;
    action.textContent=folder?'Voir la fiche':target.deck===3?'Parcourir les archives':'Voir l’opérateur';
    tip.classList.toggle('pinned',!!pinned);tip.hidden=false;marker.hidden=false;
    marker.style.left=x+'px';marker.style.top=y+'px';
    tip.style.left=Math.max(6,Math.min(width-tip.offsetWidth-6,x-tip.offsetWidth/2))+'px';
    tip.style.top=(y-tip.offsetHeight>35?y-tip.offsetHeight-12:Math.min(height-tip.offsetHeight-4,y+12))+'px';
    canvas.style.cursor=hovered?'pointer':'grab';
  }
  action.onclick=()=>{
    if(!selected)return;
    const folder=folders.find(f=>f.item.key===selected.key);
    if(folder)window.dispatchEvent(new CustomEvent('folder-pick',{detail:folder.item}));
    else if(selected.deck===3)window.dispatchEvent(new Event('browse-archives'));
    else window.dispatchEvent(new CustomEvent('station-room',{detail:selected.deck}));
  };
  canvas.addEventListener('pointermove',e=>{
    if(slide||e.pointerType==='touch')return;
    if(selected && !tip.hidden && !action.hidden){const r=tip.getBoundingClientRect();if(e.clientX>=r.left-3&&e.clientX<=r.right+3&&e.clientY>=r.top-4&&e.clientY<=r.bottom+22)return;}
    const bounds=canvas.getBoundingClientRect();
    hovered=targetAt(e.clientX-bounds.left,e.clientY-bounds.top,false);
    updateMarker();
  });
  canvas.addEventListener('pointerleave',()=>{hovered=null;canvas.style.cursor='grab';updateMarker()});
  canvas.addEventListener('keydown',e=>{if(e.key==='Escape'){selected=null;hovered=null;updateMarker()}});
  canvas.addEventListener('pointerdown',e=>{slide=[e.clientX,e.clientY,yaw];moved=false;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!slide)return;const d=e.clientX-slide[0];if(Math.abs(d)>5)moved=true;if(moved){yaw=slide[2]+d*.006;layout();}});
  canvas.addEventListener('pointercancel',()=>{slide=null;});
  canvas.addEventListener('pointerup',e=>{
    if(!slide)return;slide=null;if(moved)return;
    const box=canvas.getBoundingClientRect(),x=e.clientX-box.left,y=e.clientY-box.top;
    const hit=targetAt(x,y,e.pointerType==='touch');
    hovered=null;
    if(hit && hit.deck!==focus)selectDeck(hit.deck);
    selected=hit;updateMarker();
  });
  window.station={stock,selectDeck,rotate,zoom:magnify,pause(value){paused=Boolean(value);dirty=true;},dispatch(index){if(!Number.isInteger(index)||index<0||index>2)return;const a=agents[index];route(a,index);dirty=true;}};
  new ResizeObserver(layout).observe(canvas);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;dirty=true;}).observe(canvas);
  layout();requestAnimationFrame(frame);
})();
