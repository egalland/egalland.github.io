import {TAU,mix,banarPose,solveIK,pilotState} from './kinematics.mjs';

export function makeRigSkins(surface,images){
 return {
  mouth:surface(96,28,c=>{const g=c.createLinearGradient(0,0,0,28);g.addColorStop(0,'#1b1410');g.addColorStop(1,'#5c281c');c.fillStyle=g;c.beginPath();c.moveTo(0,0);c.lineTo(96,3);c.lineTo(96,28);c.closePath();c.fill()}),
  blueJoint:surface(128,128,c=>{
   const im=images['a-leg'];c.beginPath();c.arc(64,64,63,0,Math.PI*2);c.clip();
   c.drawImage(im,im.width*.17,im.height*.34,im.width*.65,im.height*.30,0,0,128,128);
   const shade=c.createRadialGradient(45,35,8,64,64,86);shade.addColorStop(0,'rgba(135,186,255,.12)');shade.addColorStop(.6,'rgba(0,14,50,0)');shade.addColorStop(1,'rgba(0,13,44,.26)');c.fillStyle=shade;c.fillRect(0,0,128,128);
  })
 };
}

export function createRigs({renderer,textures,matrix,mul}){
 const options=(m,alpha=1,brightness=.9)=>({matrix:m,alpha,brightness});
 const point=(m,p)=>[m[0]*p[0]+m[3]*p[1]+m[6],m[1]*p[0]+m[4]*p[1]+m[7]];
 const part=(name,rect,m,alpha=1,brightness=.9)=>renderer.draw(name,rect,options(m,alpha,brightness));
 function bone(name,a,b,width,m,alpha=1){
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[1]-a[1],b[0]-a[0])-Math.PI/2;
  part(name,[-width/2,-3,width,length+6],mul(m,matrix(1,1,angle,a[0],a[1])),alpha);
 }
 function banar(i,x,y,height,t,base,{distance=0,stride=32,locomotion=false,settle=0,walk=0,dance=0,air=0,alpha=1,reflection=false}={}){
  const pose=banarPose(i,t,{distance,stride,locomotion,settle,walk,dance,air}),cfg=pose.model,scale=height/cfg.height;
  const root=mul(base,matrix(scale,reflection?-scale*.28:scale,air*Math.sin(t*2+i)*.045,x,y));
  const torso=mul(root,matrix(1,1,pose.lean,pose.sway,-pose.bob));
  const a=reflection?alpha*.12:alpha,bright=reflection?.48:.89+air*.08,dest='b'+i+'-';
  // Feet are drawn at their ankle joints; the two leg segments follow with IK.
  for(const j of [0,1]){
   const foot=pose.feet[j],leg=pose.legs[j];
   bone(dest+'leg',leg.hip,leg.knee,11,root,a);bone(dest+'leg',leg.knee,leg.ankle,9.5,root,a);
   const name=j?'walk-foot-near':'walk-foot-far',h=22,tex=textures[name],w=h*tex.width/tex.height*(j?1:.92);
   part(name,[-w*.24,-h*.08,w,h],mul(root,matrix(1,1,foot.angle,...foot.ankle)),a,bright);
  }
  const arm=(j)=>{
   const side=j?1:-1,name=dest+(j?'armR':'armL'),tex=textures[name],h=cfg.armH,w=h*tex.width/tex.height*.65;
   const m=mul(torso,matrix(1,1,pose.arms[j],side*cfg.bodyW*.33,-cfg.bodyH-11));
   part(name,[-w*(j?.16:.84),-h*.06,w,h],m,a,bright);
  };
  part(dest+'body',[-cfg.bodyW/2,-cfg.bodyH-31,cfg.bodyW,cfg.bodyH],torso,a,bright);
  arm(0);
  const hh=cfg.headH,tex=textures[dest+'head'],hw=hh*tex.width/tex.height;
  const head=mul(torso,matrix(1,1,pose.head,3,-cfg.bodyH-12));
  const source=cfg.headFlip?mul(head,matrix(-1,1)):head;
  const hinge=[(cfg.hinge[0]-cfg.headPivot)*hw,(cfg.hinge[1]-1)*hh];
  const jawW=hw*cfg.jawRatio,jawH=hh*[.12,.13,.14,.10][i];
  if(pose.jaw>.01){
   part('mouth',[0,0,jawW*.64,Math.sin(pose.jaw)*jawW*.65],mul(head,matrix(1,1,0,...hinge)),a);
  }
  part(dest+'jaw',[-jawW*.04,-jawH*.25,jawW,jawH],mul(head,matrix(1,1,pose.jaw,...hinge)),a,bright);
  part(dest+'head',[-hw*(cfg.headFlip?1-cfg.headPivot:cfg.headPivot),-hh,hw,hh],source,a,bright);
  arm(1);
  return pose;
 }

 function alien(x,y,height,t,base){
  const {release,panel,stand,dance,steer}=pilotState(t),scale=height/235,phase=t*TAU*.83;
  const root=mul(base,matrix(scale,scale,0,x,y));
  const joint=(p,size=14)=>part('blueJoint',[-size/2,-size/2,size,size],mul(root,matrix(1,1,0,...p)));
  const bob=dance*(1-Math.cos(phase*2))*.9,rise=stand*22;
  const bodyM=matrix(1,1,Math.sin(phase)*.025*dance,dance*Math.sin(phase)*1.4,-rise-bob);
  const torso=mul(root,bodyM),wheel=[59,-97+panel*165],wheelR=20;
  const arms=[];
  for(let j=0;j<2;j++){
   const sign=j?1:-1,shoulder=point(bodyM,[sign*21,-117]);
   const angle=(j?Math.PI*.13:Math.PI*1.13)+steer;
   const grip=[wheel[0]+Math.cos(angle)*wheelR*.73,wheel[1]+Math.sin(angle)*wheelR];
   const rest=[sign*33,-94-rise],wave=[sign*(54+6*Math.sin(phase+j)),-137-rise-19*Math.sin(phase+j*1.7)];
   const free=[mix(rest[0],wave[0],dance),mix(rest[1],wave[1],dance)];
   const hand=[mix(grip[0],free[0],release),mix(grip[1],free[1],release)];
   const dx=hand[0]-shoulder[0],dy=hand[1]-shoulder[1],length=Math.hypot(dx,dy)||1;
   const wrist=[hand[0]-dx/length*10,hand[1]-dy/length*10],ik=solveIK(shoulder,wrist,38,37,j?1:-1);
   arms.push({shoulder,elbow:ik.joint,wrist:ik.end,hand,angle:Math.atan2(dy,dx)-Math.PI/2});
  }
  part('cockpit-seat',[-47,-112+stand*25,100,108],root,1-stand);
  for(let j=0;j<2;j++){
   const side=j?1:-1,hip=point(bodyM,[j?17:-22,-48]);
   const step=(t*.83+j*.5)%1,u=Math.max(0,(step-.72)/.28),lift=Math.sin(Math.PI*u)**2*5*dance;
   const ankle=[mix(31+side*9,side*15,stand),-16-lift];
   const ik=solveIK(hip,ankle,30,31,-1);
   bone('a-leg',hip,ik.joint,18,root);bone('a-leg',ik.joint,ik.end,13,root);joint(ik.joint,13);
   const h=19.5,w=h*textures['a-foot'].width/textures['a-foot'].height;
   part('a-foot',[-w*.35,-h*.18,w,h],mul(root,matrix(1,1,-lift*.006,...ik.end)));joint(ik.end,10);
  }
  const hand=j=>{
   const a=arms[j],m=mul(root,matrix(1,1,a.angle,...a.wrist)),open=release*(.55+.45*dance);
   part('a-handGrip',[-9,-2,18,21],m,1-open);part('a-handOpen',[-9,-2,18,21],m,open);joint(a.wrist,10);
  };
  const arm=j=>{const a=arms[j];bone('a-upperArm',a.shoulder,a.elbow,16,root);bone('a-forearm',a.elbow,a.wrist,13,root);joint(a.elbow,13);hand(j)};
  arm(0);
  part('a-body',[-34,-140,68,100],torso);
  joint(point(bodyM,[-22,-48]),21);joint(point(bodyM,[17,-48]),18);joint(arms[0].shoulder,18);joint(arms[1].shoulder,18);
  const head=mul(torso,matrix(1,1,(1-dance)*.018*Math.sin(t*1.2)+dance*.06*Math.sin(phase+.3),8,-125));
  const hh=111,hw=hh*textures['a-head'].width/textures['a-head'].height;
  part('a-head',[-hw*.49,-hh,hw,hh],head);joint(point(bodyM,[8,-129]),12);
  const consoleM=mul(root,matrix(1,1,0,0,panel*165));
  part('cockpit-console',[30,-82,100,88],consoleM);
  const wheelM=mul(root,mul(matrix(.73,1,0,...wheel),matrix(1,1,steer)));
  part('cockpit-wheel',[-23,-23,46,46],wheelM);
  hand(0);arm(1);
 }

 return {banar,alien};
}
