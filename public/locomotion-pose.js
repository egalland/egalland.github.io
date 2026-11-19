import {applyCombatPose} from './puppet-combat.js';
// Local puppet coordinates: x points forward, y up. Angles are radians from
// a hanging limb. The gait clock comes from metres travelled in the simulation.
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=t=>{const x=clamp(t);return x*x*(3-2*x);};
const mix=(from,to,amount)=>from+(to-from)*amount;

export function motionSeed(id=0){
  let h=2166136261;
  for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619);
  return h>>>0;
}

export function sampleLocomotion(e={},time=0,seed=0){
  const {motion,stunned}=e;
  const speed=Math.abs(e.speed)||Math.hypot(e.vx||0,e.vy||0)||((e.move||e.moving)?2.6:0);
  const stride=stunned?0:Number.isFinite(e.stride)?clamp(e.stride):clamp(speed/5.6);
  const pace=smooth(stride/.52),run=smooth((stride-.37)/.58);
  const phase=Number.isFinite(e.walk)?e.walk:time*(5.5+stride*7.2);
  const step=Math.sin(phase),double=Math.cos(2*phase);
  const personality=(seed%83)/82,offset=seed%67;
  const breath=Math.sin(time*(2.12+personality*.60)+offset);
  const shift=Math.sin(time*(.77+personality*.24)+offset*.47);
  const grade=clamp(e.slope||0,-.5,.5),turn=clamp(e.turn||0,-1,1);
  const p=clamp(e.motionPhase||0),lead=(seed&1)?1:-1;
  let effort=0,drop=0,stretch=0,pitch=0,splay=0,thigh=0,stagger=0,shin=0,arm=0,reach=0,elbow=0;

  if(motion==='jump'||motion==='fall'){
    // One continuous flight clock crosses the apex; arms open for contact.
    const dropping=Number.isFinite(e.verticalSpeed)?smooth(-e.verticalSpeed/5):0;
    effort=Math.max(.82*smooth(p/.15)+.18*smooth(p/.33),dropping);
    const crest=Math.sin(Math.PI*p),descending=Math.max(smooth((p-.48)/.48),dropping);
    stretch=.085*(1-p)-.04*crest;pitch=.16*crest;
    drop=-.055*crest;thigh=.24+.51*crest;stagger=.32*crest;
    shin=-.26-.77*crest;arm=-.43+.58*descending;reach=.43*crest;elbow=.51+.42*crest;splay=.08+.39*descending;
  }else if(motion==='land'){
    const hit=1-smooth((p-.23)/.77),compress=hit*smooth(p/.23);
    effort=1-smooth((p-.38)/.62);drop=-.095*compress;stretch=-.18*compress;
    pitch=.20*compress;thigh=.24*hit+.61*compress;shin=-.26*hit-1.09*compress;
    arm=.15+.19*compress;elbow=.51+.15*compress;splay=.47*hit;
  }else if(motion==='vault'||motion==='climb'){
    // Reach rises early, body and knees follow, hands release near the top.
    const climb=motion==='climb',plant=smooth(p/(climb?.20:.16))*(1-smooth((p-.72)/.28));
    const tuck=Math.sin(Math.PI*p),pull=smooth((p-.27)/.40);
    effort=plant;drop=-.06*tuck;stretch=-.10*tuck;
    pitch=(climb?.31:.58)*tuck;thigh=(climb?1.22:.96)*tuck;stagger=(climb?.49:.77)*tuck;
    shin=-(climb?1.23:1.46)*tuck;
    arm=climb?2.70-1.78*pull:1.62-.63*pull;
    reach=climb?.21:.58;elbow=climb?.30+.73*pull:.26+.62*(1-tuck);splay=.17;
  }
  const grounded=1-effort;
  const sway=(shift*.035*(1-pace)+step*.039*pace)*grounded;
  const roll=sway+turn*(.04+.12*stride);
  const lean=(.04+.16*run)*pace+.40*grade*pace+pitch*effort;
  const bob=(.029*(1-double)*pace+.008*breath*(1-pace))*grounded+drop;
  const squash=(.020*double*pace+.009*breath*(1-pace))*grounded+stretch*effort;
  function side(sign){
    const swing=step*sign,weight=clamp(.5+.5*Math.cos(phase)*sign);
    const regularThigh=(.53+.35*run+.08*personality)*swing*pace+.17*grade*pace;
    const regularShin=-(.11+.61*weight*(.56+.44*run))*pace;
    const regularArm=-(.46+.38*run)*swing*pace-.09+.032*breath;
    return {
      thigh:mix(regularThigh,thigh+sign*lead*stagger,effort),
      shin:mix(regularShin,shin-.19*sign*lead*stagger,effort),
      arm:mix(regularArm,arm+sign*lead*reach,effort),
      elbow:mix(.09+pace*(.12+.40*run+.11*weight),elbow,effort),
      splay:.04+.026*pace+effort*splay
    };
  }
  return applyCombatPose({phase,step,pace,run,breath,bob,squash,lean,roll,twist:0,turn,effort,left:side(-1),right:side(1)},e);
}

// Shared joint positions for the linked avatar's mesh and projected drawings.
export function posedLimb(origin,upper,lower,l1,l2,side,spread=0){
  const [x,y,z]=origin,a=upper+lower;
  const mid=[x+Math.sin(upper)*l1,y-Math.cos(upper)*l1,z+side*spread*.55];
  return [origin,mid,[mid[0]+Math.sin(a)*l2,mid[1]-Math.cos(a)*l2,z+side*spread]];
}

// The portrait shell and its seven skin anchors share this skeleton in both views.
export const kikalmoAnchors=[[0,.46,0],[0,.83,0],[0,1.1,0],[0,.86,-.26],[0,.86,.26],[0,.44,-.14],[0,.44,.14]];
export function linkedPose(e,gait,time){
  const {lean,roll,twist,bob,squash,effort}=gait;
  const anchors=kikalmoAnchors.map(([x,y,z])=>{
    const height=(y-.46)*(1+squash);
    const yaw=twist*clamp((y-.45)/.43);
    return [x+z*Math.sin(yaw)+height*Math.sin(lean),.46+bob+height*Math.cos(lean)-z*Math.sin(roll),z*Math.cos(yaw)+height*Math.sin(roll)];
  });
  const arms=[],legs=[],shoulders=[],hips=[];
  for(const [index,s] of [[0,-1],[1,1]]){
    const l=s<0?gait.left:gait.right;
    const free=1-effort,wave=s>0&&e.emote?free:0,fire=s>0?(e.fire||0)*free:0;
    const raised=l.arm+wave*(2.45+.20*Math.sin(time*12))+fire*1.2;
    shoulders.push(raised);hips.push(l.thigh);
    const sleeve=1+(l.armStretch||0),trouser=1+(l.legStretch||0);
    arms.push(posedLimb(anchors[3+index],raised,l.elbow,.19*sleeve,.17*sleeve,s,.043+.22*l.splay+.04*wave));
    legs.push(posedLimb(anchors[5+index],l.thigh,l.shin,.19*trouser,.185*trouser,s,0));
  }
  return {anchors,arms,legs,shoulders,hips};
}
