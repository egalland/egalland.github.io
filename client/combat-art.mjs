const clamp=v=>Math.max(0,Math.min(1,v));
const cadence={knight:15,ranger:9,mage:19,crawler:17,eye:23,cultist:25,boss:31};

// All offsets use the contact point of the feet. Camera motion never drives a gait.
export function actorPose(o,type,tick,motion,project){
 const age=tick-o.swing,release=o.releaseAt-o.swing,period=cadence[type];
 const attacks=age>=0&&age<period&&release>0;
 const death=o.deathAt>=0?clamp((tick-o.deathAt)/15):0;
 const impact=Number.isFinite(o.hit)?Math.max(0,1-(tick-o.hit)/6):0;
 const phase=motion.phase,walk=motion.weight;
 let frame=0,offsetX=0,offsetY=0,lean=0,stretch=1;
 let facing=o.face||1;
 const idle=Math.sin(tick*.084+motion.seed);
 if(walk>0.08){
   const cycle=phase%1;
   frame=!o.type&&(cycle>.41&&cycle<.52||cycle>.91)?0:cycle<.50?1:2;
   offsetY=-Math.abs(Math.sin(phase*2*Math.PI))*1.3*walk;
   lean=Math.sin(phase*2*Math.PI)*.018*walk;
 }else stretch+=idle*(type==='eye'?.025:.009);
 if(type==='eye')offsetY-=3+Math.sin(tick*.12+motion.seed)*2;
 if(attacks){
   const dir=project(Math.cos(o.attackAngle),Math.sin(o.attackAngle));
   if(Math.abs(dir.x)>.08)facing=dir.x>0?1:-1;
   const pre=clamp(age/release),follow=clamp((age-release)/(period-release));
   if(age<release){
     frame=3;offsetX=-dir.x*3.8*pre;lean=-facing*.06*pre;stretch-=.026*pre;
   }else{
     frame=follow<.47?4:5;
     const force=(1-follow)**2;
     const lunge=type==='ranger'?-4:type==='knight'||type==='crawler'?9:3;
     offsetX=dir.x*lunge*force;offsetY+=dir.y*lunge*force;
     lean+=facing*.065*force;stretch+=force*.02;
   }
 }
 if(Number.isFinite(o.lastDash)&&tick-o.lastDash<8){lean+=facing*.12*(1-(tick-o.lastDash)/8);stretch-=.06}
 if(impact>0){lean-=facing*impact*.075;offsetY-=impact*1.5}
 if(death){lean+=facing*.75*death;offsetY+=5*death;stretch-=.28*death}
 return {frame,facing,offsetX,offsetY,lean,stretch,alpha:1-death,impact,attacks,age,release,period}
}

export function trackMotion(cache,o,tick){
 let m=cache.get(o);
 if(!m){m={x:o.x,y:o.y,tick,phase:0,weight:0,seed:(o.x+o.y)*.021};cache.set(o,m)}
 if(tick!==m.tick){
  const distance=Math.hypot(o.x-m.x,o.y-m.y);
  if(o.lastDash>m.tick&&o.lastDash<=tick)m.dash={fromX:m.x,fromY:m.y,toX:o.x,toY:o.y,tick:o.lastDash};
  const delta=Math.min(5,Math.max(1,tick-m.tick));
  m.phase+=Math.min(14*delta,distance)/(o.type==='crawler'?31:58);
  m.weight=distance>.1?Math.min(1,m.weight+.4*delta):Math.max(0,m.weight-.26*delta);
  m.x=o.x;m.y=o.y;m.tick=tick;
 }
 return m;
}
