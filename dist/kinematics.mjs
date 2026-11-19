export const TAU=Math.PI*2;
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,p)=>a+(b-a)*p;
export const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
export const event=(t,a,d)=>t>a&&t<a+d?Math.sin((t-a)/d*Math.PI)**2:0;

export function solveIK(hip,target,upper,lower,bend=1){
 const dx=target[0]-hip[0],dy=target[1]-hip[1],raw=Math.hypot(dx,dy)||.0001;
 const distance=clamp(raw,Math.abs(upper-lower)+.0001,upper+lower-.0001);
 const ux=dx/raw,uy=dy/raw,along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const out=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
 return {joint:[hip[0]+ux*along-uy*out,hip[1]+uy*along+ux*out],end:[hip[0]+ux*distance,hip[1]+uy*distance]};
}

// Stance is a world-space anchor; swing returns to the next anchor without sliding.
export function walkingFoot(distance,phaseOffset,nominal=0,stride=32){
 const stance=.68,cycle=distance/stride+phaseOffset,step=Math.floor(cycle),phase=cycle-step;
 const plant=(step-phaseOffset+stance*.5)*stride+nominal;
 if(phase<stance)return {x:plant-distance,lift:0,angle:0,stance:true,plant,phase};
 const swing=(phase-stance)/(1-stance),arc=Math.sin(Math.PI*swing)**2;
 return {x:plant+stride*smooth(swing)-distance,lift:arc*7,angle:-arc*.055,stance:false,plant,phase};
}

// Integrate a smooth velocity ramp, keeping a steady cadence between start and stop.
export function walkState(t,travel=180,i=0){
 const start=[.25,.45,.15,.65][i],duration=[5.8,5.5,6.2,5.7][i],cycles=[5,6,5,6][i];
 const elapsed=clamp(t-start,0,duration),ramp=.65,speed=travel/(duration-ramp);
 const integral=u=>u*u*u-.5*u*u*u*u;
 let distance,weight;
 if(elapsed<ramp){const u=elapsed/ramp;distance=speed*ramp*integral(u);weight=smooth(u)}
 else if(elapsed>duration-ramp){const u=(duration-elapsed)/ramp;distance=travel-speed*ramp*integral(u);weight=smooth(u)}
 else{distance=speed*(elapsed-ramp*.5);weight=1}
 return {distance,weight,cycles,start,end:start+duration};
}

export function speech(t,i,dance=0){
 const windows=[[[.8,1.4],[4.7,.8]],[[2.0,1.4],[6.0,.8]],[[3.2,1.3]],[[5.0,1.3]]][i];
 let active=0;for(const [a,d] of windows)active=Math.max(active,event(t,a,d));
 active=Math.max(active,event(t,18.4+i*1.6,.8)*dance);
 return active*(.07+.20*Math.max(0,Math.sin(t*(24+i*2)+i)));
}

export const banarModels=[
 {bodyW:118,bodyH:116,headH:96,armH:94,headPivot:.33,hinge:[.52,.47],jawRatio:.48,headFlip:true},
 {bodyW:78,bodyH:139,headH:155,armH:107,headPivot:.25,hinge:[.50,.235],jawRatio:.50,headFlip:false},
 {bodyW:143,bodyH:134,headH:113,armH:109,headPivot:.35,hinge:[.62,.50],jawRatio:.38,headFlip:false},
 {bodyW:106,bodyH:124,headH:117,armH:102,headPivot:.32,hinge:[.56,.51],jawRatio:.44,headFlip:true}
].map(m=>({...m,height:m.bodyH+m.headH+12}));

export function danceFoot(t,i,j){
 const rate=[.78,.92,.67,1.04][i],cycle=t*rate+i*.23+j*.5,phase=cycle-Math.floor(cycle),swing=clamp((phase-.72)/.28);
 const arc=Math.sin(Math.PI*swing)**2,side=j?1:-1;
 return {x:side*(14+arc*[4,2.5,3,6][i]),lift:arc*[6,7,5,9][i],angle:-arc*.055,stance:phase<.72};
}

export function banarPose(i,t,{distance=0,stride=32,locomotion=false,settle=0,walk=0,dance=0,air=0}={}){
 const model=banarModels[i],phase=t*TAU*[.78,.92,.67,1.04][i]+i*1.47,gait=(distance/stride+.06)*TAU;
 const sway=walk*Math.sin(gait)*2.4+dance*Math.sin(phase)*2;
 const bob=walk*(1-Math.cos(gait*2))*1.2+dance*(1-Math.cos(phase*2))*.95;
 const lean=walk*Math.sin(gait)*.032+dance*Math.sin(phase)*[.035,.025,.025,.045][i];
 const root=(x,y)=>[Math.cos(lean)*x-Math.sin(lean)*y+sway,Math.sin(lean)*x+Math.cos(lean)*y-bob];
 const feet=[],legs=[];
 for(let j=0;j<2;j++){
  const side=j?1:-1,nominal=side*14,step=walkingFoot(distance,j?.06:.56,nominal,stride),tap=danceFoot(t,i,j);
  // Keep the initial/final double-support pose. Fading the feet into a rest pose caused skating.
  let x=locomotion?mix(step.x,nominal,settle):nominal,lift=locomotion?step.lift*(1-settle):0,angle=locomotion?step.angle*(1-settle):0;
  x=mix(x,tap.x,dance);lift=mix(lift,tap.lift,dance);angle=mix(angle,tap.angle,dance);
  x+=air*side*5;lift+=air*(4+side*1.5);
  const depth=j?0:-2.5,ankle=[x,-20.24+depth-lift],hip=root(side*model.bodyW*.12,-56);
  const solved=solveIK(hip,ankle,24,24,1);
  feet.push({ankle,angle,depth,stance:lift===0});legs.push({hip,knee:solved.joint,ankle:solved.end});
 }
 const curious=event(t,7.2+i*.15,2.7)*(1-air)*(1-dance);
 return {model,phase,bob,lean,sway,feet,legs,
  head:-lean*.55+walk*Math.sin(gait*2+.8)*.015+dance*Math.sin(phase+.4)*.06+air*.05-curious*.09,
  jaw:speech(t,i,dance),
  arms:[0,1].map(j=>{const side=j?1:-1;return -side*.025+walk*Math.sin(gait+j*Math.PI)*.075-side*dance*(.18+.19*Math.sin(phase+j*1.6))-side*air*.25})};
}

// Hands release before the console retracts; they grip it only after it has returned.
export function pilotState(t){
 const release=smooth((t-15.1)/.55)*(1-smooth((t-28.05)/.45));
 const panel=smooth((t-15.75)/.65)*(1-smooth((t-27.4)/.65));
 const stand=smooth((t-15.65)/.70)*(1-smooth((t-27.0)/.60));
 const dance=smooth((t-16.15)/.65)*(1-smooth((t-26.5)/.70));
 return {release,panel,stand,dance,steer:Math.sin(t*.84)*.09+Math.sin(t*.31)*.035};
}

export function fixedShip(t,{portrait=false,height=900}={}){
 const scale=.76,center=portrait?450:810,hoverY=portrait?height*.245:263;
 if(t<4.6)return {x:-450,y:hoverY,s:scale,r:0,visible:false};
 const p=smooth((t-4.6)/4.2);
 let x=mix(-450,center,p),y=hoverY-Math.sin(p*Math.PI)*62,r=(1-p)*.075;
 if(t>=29){const q=clamp((t-29)/2.2);x=center+(portrait?1100:1650)*q*q;y=hoverY-430*q*q;r=-.17*q;}
 return {x,y:y+Math.sin(t*1.3)*1.8,s:scale,r,visible:t<31.2};
}
