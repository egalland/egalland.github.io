// Local axes are forward, up and right. A fall occupies one small deterministic simulation;
// only its five launch parameters travel over the network.
const reference={
  hips:[0,.52,0],chest:[0,.84,0],head:[.025,1.31,0],
  leftShoulder:[.001,.872,-.224],rightShoulder:[.001,.872,.224],
  leftElbow:[.008,.71,-.26],rightElbow:[.008,.71,.26],
  leftHand:[.07,.544,-.275],rightHand:[.07,.544,.275],
  leftHip:[-.016,.45,-.112],rightHip:[-.016,.45,.112],
  leftKnee:[-.028,.31,-.112],rightKnee:[-.028,.31,.112],
  leftFoot:[.045,.098,-.114],rightFoot:[.045,.098,.114]
};
const names=Object.keys(reference),rest=Object.values(reference).flat(),cache=new Map();
const radii=[.135,.17,.22,.083,.083,.056,.056,.064,.064,.09,.09,.062,.062,.083,.083];
const links=[];
function link(a,b,stiffness=1){
  const i=names.indexOf(a)*3,j=names.indexOf(b)*3;
  links.push([i,j,Math.hypot(rest[i]-rest[j],rest[i+1]-rest[j+1],rest[i+2]-rest[j+2]),stiffness]);
}
link('hips','chest');link('chest','head');link('hips','head',.26);
link('leftHip','rightHip');link('leftShoulder','rightShoulder');
for(const [side,other] of [['left','right'],['right','left']]){
  link('hips',side+'Hip');link('chest',side+'Shoulder');link('head',side+'Shoulder',.85);
  link(side+'Hip',side+'Shoulder',.9);link(side+'Hip',other+'Shoulder',.8);
  link(side+'Hip',side+'Knee');link(side+'Knee',side+'Foot');
  link(side+'Shoulder',side+'Elbow');link(side+'Elbow',side+'Hand');
}
const rate=45,lastFrame=100;
function startSimulation(angle,force,seed){
  const pos=Float64Array.from(rest),previous=pos.slice(),dt=1/rate,dx=Math.cos(angle),dz=Math.sin(angle);
  let r=seed+1;
  const rand=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296-.5;};
  for(let i=0;i<pos.length;i+=3){
    const lever=pos[i+1],speed=(.58+force*1.65)*lever,splay=rand()*(.3+force*.65);
    previous[i]-=(dx*speed-dz*splay)*dt;
    previous[i+1]-=(.15+force*.44+rand()*.30)*dt;
    previous[i+2]-=(dz*speed+dx*splay)*dt;
  }
  return {pos,previous,frames:[Float32Array.from(pos)]};
}
function step(sim){
  const {pos,previous}=sim;
  for(let i=0;i<pos.length;i+=3){
    const ground=pos[i+1]<=radii[i/3]+.009,friction=ground ? .71 : .994;
    for(let k=0;k<3;k++){
      const last=pos[i+k];
      pos[i+k]+= (last-previous[i+k])*(k===1 ? .992 : friction)-(k===1?9.81/(rate*rate):0);
      previous[i+k]=last;
    }
  }
  for(let j=0;j<6;j++){
    for(const [a,b,len,stiffness] of links){
      const x=pos[b]-pos[a],y=pos[b+1]-pos[a+1],z=pos[b+2]-pos[a+2];
      const distance=Math.hypot(x,y,z)||.001,k=.5*stiffness*(1-len/distance);
      pos[a]+=x*k;pos[a+1]+=y*k;pos[a+2]+=z*k;pos[b]-=x*k;pos[b+1]-=y*k;pos[b+2]-=z*k;
    }
    for(let i=0;i<radii.length;i++)pos[i*3+1]=Math.max(radii[i],pos[i*3+1]);
  }
  sim.frames.push(Float32Array.from(pos));
}
export function ragdollPose(event,facing,now){
  if(!event||![event.at,event.until,event.angle,event.force,event.seed,facing,now].every(Number.isFinite))return null;
  const age=now-event.at,duration=event.until-event.at;
  if(age<0||age>=duration||duration>8000||duration<100)return null;
  const angle=Math.atan2(Math.sin(event.angle-facing),Math.cos(event.angle-facing));
  const heading=Math.round(angle*1000),force=Math.round(Math.min(1,Math.max(0,event.force))*100),seed=event.seed&65535;
  const key=[event.at,heading,force,seed].join('/');
  if(!cache.has(key)){
    if(cache.size>=40)cache.delete(cache.keys().next().value);
    cache.set(key,startSimulation(heading/1000,force/100,seed));
  }
  const sim=cache.get(key),sample=Math.min(lastFrame,age*.001*rate),lo=Math.floor(sample),hi=Math.ceil(sample);
  while(sim.frames.length<=hi)step(sim);
  const a=sim.frames[lo],b=sim.frames[hi],f=sample-lo;
  const remaining=Math.min(1,(duration-age)/Math.min(440,duration*.42));
  const pose={blend:remaining*remaining*(3-2*remaining)};
  for(let j=0;j<names.length;j++){
    const i=j*3;pose[names[j]]=[a[i]+(b[i]-a[i])*f,a[i+1]+(b[i+1]-a[i+1])*f,a[i+2]+(b[i+2]-a[i+2])*f];
  }
  return pose;
}
