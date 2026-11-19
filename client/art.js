/* Original canvas engravings. The illustration uses seeded marks so it can
   be repainted at any resolution without changing the printed texture. */
(() => {
  const TAU = Math.PI * 2;
  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function line(c, points, color, width = 1, close = false, fill = null) {
    c.beginPath();
    points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
    if (close) c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (color) { c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
  }
  function oval(c,x,y,rx,ry,rotation,fill,stroke,width=1) {
    c.beginPath(); c.ellipse(x,y,rx,ry,rotation,0,TAU);
    if (fill) { c.fillStyle=fill; c.fill(); }
    if (stroke) { c.strokeStyle=stroke; c.lineWidth=width; c.stroke(); }
  }
  function curve(c,p,color,width=1) {
    c.beginPath(); c.moveTo(p[0],p[1]);
    c.bezierCurveTo(...p.slice(2,8)); c.strokeStyle=color; c.lineWidth=width; c.stroke();
  }
  function gothic(c,x,y,w,h,r) {
    const stone='#25403e', shade='#112724', edge='#47605a';
    const n=3+Math.floor(r()*4);
    for(let i=0;i<n;i++){
      const tx=x+i*w/n, bw=w/n*.85, th=h*(.43+.56*r());
      line(c,[[tx,y],[tx,y-th],[tx+bw*.25,y-th-3],[tx+bw*.42,y-th-11-bw*.6],[tx+bw*.62,y-th-3],[tx+bw,y-th],[tx+bw,y]],edge,.65,true,stone);
      for(let j=3;j<th-3;j+=5) line(c,[[tx+1,y-j],[tx+bw*(.25+r()*.65),y-j+.3]],shade,.7);
      if(th>16) { oval(c,tx+bw*.5,y-th+7,Math.max(.65,bw*.13),2.6,0,shade); }
    }
  }
  // Sample a smooth spline from pen control points and offset along its normal.
  function spine(points,t) {
    const k=Math.min(points.length-2, Math.floor(t*(points.length-1)));
    const f=t*(points.length-1)-k;
    const [p0,p1,p2,p3]=[-1,0,1,2].map(i=>points[Math.min(points.length-1,Math.max(0,k+i))]);
    const pt=[0,1].map(i=>.5*(2*p1[i]+(-p0[i]+p2[i])*f+(2*p0[i]-5*p1[i]+4*p2[i]-p3[i])*f*f+(-p0[i]+3*p1[i]-3*p2[i]+p3[i])*f*f*f));
    const d=[0,1].map(i=>.5*((-p0[i]+p2[i])+2*(2*p0[i]-5*p1[i]+4*p2[i]-p3[i])*f+3*(-p0[i]+3*p1[i]-3*p2[i]+p3[i])*f*f));
    const len=Math.hypot(...d)||1; return [...pt,-d[1]/len,d[0]/len];
  }
  function limb(c,points,radius,seed,pale=false) {
    const r=random(seed);
    const nodes=Array.from({length:121},(_,i)=>{
      const t=i/120, [x,y,nx,ny]=spine(points,t);
      return {x,y,nx,ny,r:radius*(1-t)**.74*(.94+.06*Math.sin(t*14))+.08};
    });
    const at=(p,m)=>[p.x+p.nx*p.r*m,p.y+p.ny*p.r*m];
    const sides=nodes.map(p=>at(p,1)).concat(nodes.slice().reverse().map(p=>at(p,-1)));
    line(c,sides,pale?'#98a388':'#729084',1,true,pale?'#49645b':'#294841');
    for(let s=0;s<12;s++){
      const m=-.94+s*.17;
      line(c,nodes.map((p,i)=>at(p,m+.025*Math.sin(i*.14+s*.77))),s<3?'#9ca88c':s>8?'#152f2b':'#3c574d',s<3?.6:.8);
    }
    for(let i=2;i<nodes.length-2;i+=2){
      const p=nodes[i],q=nodes[i+1];
      const a=at(p,-.92),b=at(q,-.35+r()*.42);
      curve(c,[...a,p.x+p.nx*p.r*-.72,p.y+p.ny*p.r*-.72,...b,...b],'#273e36',.65);
      if(i%4===2 && p.r>1.5){
        const [x,y]=at(p,.58); const angle=Math.atan2(p.ny,p.nx);
        oval(c,x,y,p.r*.2,p.r*.12,angle,'#14322f','#99a78d',.56);
      }
    }
  }
  window.drawCover = function drawCover(c,w,h) {
    if(!w || !h) return;
    const r=random(49573);
    c.save(); c.fillStyle='#0b201e';c.fillRect(0,0,w,h);
    const s=Math.min(w/670,h/485);
    c.translate(w/2,h/2);c.scale(s,s);c.translate(-410,-285);
    const left=410-w/(2*s),right=410+w/(2*s),top=285-h/(2*s),bottom=285+h/(2*s);
    const sky=c.createRadialGradient(430,250,30,408,263,425);
    sky.addColorStop(0,'#435b50'); sky.addColorStop(.65,'#1d3834'); sky.addColorStop(1,'#081a19');
    c.fillStyle=sky;c.fillRect(left,top,right-left,bottom-top);
    for(let i=0;i<1300;i++){
      const x=left+r()*(right-left),y=top+r()*(bottom-top);
      line(c,[[x,y],[x+2+r()*19,y+r()*1.2]],'rgba(156,166,136,'+(.04+r()*.14)+')',.55);
    }
    // Faint lunar engraving, constellation and concentric astronomical scales.
    const mx=413,my=230;
    for(const rad of [157,162,178,181]){
      oval(c,mx,my,rad,rad,0,null,'rgba(176,161,112,.38)',.7);
    }
    for(let i=0;i<144;i++){
      const a=i*TAU/144, inn=i%12?173:159;
      line(c,[[mx+inn*Math.cos(a),my+inn*Math.sin(a)],[mx+178*Math.cos(a),my+178*Math.sin(a)]],'#838368',.7);
    }
    for(let i=0;i<125;i++){
      const x=left+r()*(right-left),y=top+r()*(348-top),sz=.28+r()*.85;
      oval(c,x,y,sz,sz,0,'#99a58d');
      if(i%16===0){line(c,[[x-3,y],[x+3,y]],'#a8a487',.6);line(c,[[x,y-3],[x,y+3]],'#a8a487',.6);}
    }
    for(let i=0;i<18;i++) gothic(c,left+i*(right-left)/18,403+r()*37,45+r()*35,20+r()*80,r);
    // Outermost grasping arms rise behind the mantle.
    limb(c,[[401,297],[345,273],[294,222],[256,215],[221,240],[188,229],[196,192],[217,180],[223,193],[216,198]],30,12);
    limb(c,[[448,315],[510,254],[531,188],[572,140],[609,147],[628,185],[616,201],[601,198],[603,186]],32,14);
    limb(c,[[380,304],[310,312],[263,282],[220,280],[178,313],[132,305],[126,274],[145,257],[158,267]],26,42);
    limb(c,[[450,310],[516,289],[561,249],[599,252],[635,280],[679,274],[695,247],[684,230],[674,236]],28,70);
    limb(c,[[393,308],[351,337],[292,338],[236,319],[195,340],[184,382],[146,402],[115,390],[108,370]],26,4);
    limb(c,[[428,322],[472,341],[521,333],[553,306],[597,305],[624,335],[664,352],[700,333],[702,308],[690,303]],26,18);
    // Knuckled upper shell, drawn in nested vertical flutes.
    const head=new Path2D();
    head.moveTo(335,272);head.bezierCurveTo(331,246,345,224,347,203);
    head.bezierCurveTo(348,172,363,150,384,135);head.bezierCurveTo(403,122,432,119,452,136);
    head.bezierCurveTo(482,152,492,183,485,212);head.bezierCurveTo(480,235,509,249,501,276);
    head.bezierCurveTo(494,301,469,312,444,317);head.bezierCurveTo(426,337,388,330,372,314);
    head.bezierCurveTo(355,305,340,297,335,272); head.closePath();
    const shell=c.createLinearGradient(335,190,501,265);
    shell.addColorStop(0,'#899b7f');shell.addColorStop(.36,'#506e60');shell.addColorStop(.73,'#344d43');shell.addColorStop(1,'#142d2a');
    c.fillStyle=shell;c.fill(head);c.strokeStyle='#9da58a';c.lineWidth=1.4;c.stroke(head);
    c.save();c.clip(head);
    for(let i=0;i<100;i++){
      const a=i/99, start=324+i*1.8, k=Math.sin(a*4)*12;
      curve(c,[391+(start-388)*.68,116,start-11,157,start+27+k,192,start+k,239],i%5===0?'#bac2a0':i%3===0?'#1b342f':'#708674',i%5===0?1.3:.8);
      curve(c,[start+k,238,start-4+k,266,start+10,278,398+(start-400)*.63,324],i%4===0?'#182f2b':'#68806e',.85);
    }
    for(let i=0;i<650;i++){
      const x=330+r()*177,y=126+r()*190;
      line(c,[[x,y],[x+1+r()*3,y-2-r()*5]],'rgba(22,49,39,.46)',.7);
    }
    c.restore();
    // Heavy angular brows shelter narrow amber eyes.
    for(const side of [-1,1]){
      c.save();c.translate(416,268);c.scale(side,1);
      line(c,[[7,9],[20,-4],[44,-15],[67,-16],[61,-5],[41,7],[22,13]],'#a9ae8f',1,true,'#213c34');
      const eye=[[17,9],[32,2],[53,-4],[47,4],[33,12],[20,13]];
      line(c,eye,'#c3b881',1,true,'#c3a55e');oval(c,35,6,1.7,4.4,.5,'#142b26');
      for(let j=0;j<6;j++)curve(c,[13,15+j*1.8,31,18+j*2,57,6+j*1.3,64,-j],'#647b68',.8);
      c.restore();
    }
    limb(c,[[385,304],[354,333],[330,375],[304,387],[278,381],[250,359],[224,366],[213,390],[221,402]],21,150,true);
    limb(c,[[447,305],[484,334],[490,377],[523,393],[556,374],[568,337],[589,327],[608,340],[606,352]],22,112,true);
    limb(c,[[400,304],[380,340],[377,385],[349,413],[315,421],[305,443],[324,454],[340,444],[336,431]],18,88,true);
    limb(c,[[434,304],[456,342],[445,382],[456,414],[478,435],[502,430],[509,413],[499,406]],18,89,true);
    limb(c,[[412,304],[407,333],[419,360],[408,397],[389,425],[390,459],[412,476],[433,466],[435,446],[421,439]],16,90,true);
    limb(c,[[421,301],[433,327],[431,357],[416,383],[424,403],[442,407],[452,393]],12,91,true);
    // Foreground breakers, hand-cut into the dark water.
    for(let i=0;i<230;i++){
      const x=left+r()*(right-left), y=420+r()*Math.max(1,bottom-420),v=4+r()*40;
      curve(c,[x,y,x+v*.25,y+1.5,x+v*.8,y-2,x+v,y-1],'rgba(128,155,138,'+(.09+r()*.26)+')',.7);
    }
    // Fine ink grain over the whole plate.
    for(let i=0;i<2400;i++){
      const x=left+r()*(right-left), y=top+r()*(bottom-top);
      c.fillStyle=i%3?'rgba(4,18,15,.18)':'rgba(180,180,155,.12)';c.fillRect(x,y,.7+r()*.8,.6);
    }
    c.restore();
  };
  window.drawActor=function drawActor(c,type,x,y,size,time=0) {
    c.save();c.translate(x,y);c.scale(size,size);
    c.lineJoin='round';c.lineCap='round';
    const tick=Math.sin(time*5+x*.13);
    oval(c,0,.7,.82,.33,0,'rgba(0,8,9,.48)');
    if(type==='hero'){
      line(c,[[-.66,.62],[-.51,-.28],[-.18,-.56],[.3,-.49],[.54,.03],[.81,.75],[.27,.7],[.06,.91],[-.19,.68]],'#bbc6ab',.055,true,'#384d49');
      line(c,[[-.4,-.24],[-.14,.52],[.05,.64],[.15,-.32]],'#a59e7b',.07,true,'#2a3734');
      line(c,[[-.56,-.36],[.48,.13]],'#cfa66a',.12);
      oval(c,.02,-.54,.32,.32,0,'#b4a586','#14282a',.07);
      line(c,[[-.53,-.68],[-.25,-.77],[-.2,-1.05],[.18,-1.09],[.36,-.79],[.57,-.72],[.48,-.62],[-.42,-.56]],'#d1c9a5',.06,true,'#40514b');
      line(c,[[.01,-.46],[.36,-.49]],'#1c2826',.07);
      line(c,[[.39,.02],[.68,-.06],[.9,-.66],[.93,-.81],[.73,-.72],[.47,-.21]],'#dac99b',.07,true,'#aebeb0');
      line(c,[[.44,-.29],[.78,-.13]],'#bdaa79',.09);
    } else if(type==='cultist'){
      line(c,[[-.77,.75],[-.48,-.03],[-.29,-.65],[.08,-1.02],[.43,-.59],[.53,-.06],[.82,.76],[.33,.66],[.08,.85],[-.2,.68]],'#ba9985',.06,true,'#704944');
      line(c,[[-.3,-.37],[.04,-.78],[.36,-.32],[.13,-.04],[-.16,-.12]],null,0,true,'#172824');
      line(c,[[-.13,-.35],[.14,-.39]],'#f0c974',.085);
      line(c,[[-.39,.38],[.38,.35]],'#a58b62',.12);
      line(c,[[.63,.55],[.72,-.77]],'#dbbb82',.065);
    }else if(type==='eye'){
      for(let i=0;i<5;i++){
        const a=(i-2)*.44;
        curve(c,[a*.58,.2,a*.55,.51,a+tick*.12,.62,a+.12,.95],'#aca68a',.07);
      }
      oval(c,0,-.16,.76,.59,-.1,'#758980','#c5c5a3',.07);
      line(c,[[-.67,-.18],[-.28,-.38],[.21,-.39],[.62,-.22],[.29,.01],[-.19,.07]],'#394f45',.055,true,'#dad2a4');
      oval(c,.04,-.16,.13,.24,0,'#86573d');oval(c,.04,-.15,.05,.17,0,'#152b26');
    }else{
      const boss=type==='boss';
      for(let i=0;i<8;i++){
        const a=TAU*i/8, dx=Math.cos(a),dy=Math.sin(a);
        curve(c,[dx*.31,dy*.35,dx*.66-dy*.4,dy*.65+dx*.4,dx*.8+dy*.24,dy*.8-dx*.24,dx*1.03+tick*.09,dy*.98],'#9ba88c',boss?.17:.13);
      }
      oval(c,0,-.08,boss?.56:.42,boss?.66:.55,-.13,boss?'#597369':'#485c50','#b2b397',.06);
      for(let i=-2;i<3;i++)curve(c,[i*.12,-.52,i*.19,-.3,i*.21,-.19,i*.16,-.04],'#879a7d',.035);
      for(const d of [-1,1])oval(c,d*.24,-.02,.15,.06,d*-.25,'#f1c576');
      if(boss)for(let i=-2;i<3;i++)curve(c,[i*.13,.2,i*.25,.39,i*.09,.72,i*.22+tick*.06,.86],'#879b83',.09);
    }
    c.restore();
  };
})();
