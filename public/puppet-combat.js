import {meleeMoves} from './melee-moves.js';
// Overlay the fight on the walking posture. Phase is the same simulation clock used
// to decide contact; wind-up, contact and recovery are not frame-rate dependent.
const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const windUp={jab:.20,hook:.27,kick:.32};

export function applyCombatPose(pose,e){
  if(e.ragdoll?.blend>.65||e.down)return pose;
  const attack=e.melee,hit=e.recoil;
  if(Object.hasOwn(meleeMoves,attack?.kind)&&Number.isFinite(attack.phase)){
    const {kind}=attack,move=meleeMoves[kind],p=clamp(attack.phase),draw=windUp[kind],contact=move.contact/move.duration;
    const ready=ease(p/draw)*(1-ease((p-draw)/(contact-draw)));
    const extension=ease((p-draw)/(contact-draw))*(1-ease((p-contact-.04)/(.91-contact)));
    const guard=ease(p/(draw*.57))*(1-ease((p-.68)/.32));
    const kick=kind==='kick',hook=kind==='hook',hand=hook?pose.right:pose.left;
    const side=hook?1:-1;
    pose.effort=Math.max(pose.effort,guard);
    pose.twist=(kick?1:side)*(-.34*ready+(hook?.68:.40)*extension);
    pose.roll+=(kick?-.22:side*.09)*extension;
    pose.lean+=kick?-.25*extension+.14*ready:.29*extension-.18*ready;
    pose.bob-=.045*ready;
    pose.squash+=.07*extension-.11*ready;
    for(const limb of [pose.left,pose.right]){
      limb.arm=mix(limb.arm,.45,guard);
      limb.elbow=mix(limb.elbow,1.76,guard);
      limb.splay+=.13*guard;
    }
    if(kick){
      const leg=pose.right;
      leg.thigh=mix(leg.thigh,.35,guard)+1.19*ready+1.78*extension;
      leg.shin=mix(leg.shin,-.42,guard)-1.45*ready+.46*extension;
      leg.legStretch=.65*extension;
      pose.right.arm-=.91*extension;pose.right.splay+=.23*extension;
      pose.left.arm+=.41*extension;
      pose.footSide=guard>.06?1:0;
    }else{
      hand.arm-=ready*(hook?.91:.72);
      hand.arm+=extension*(hook?1.18:1.33);
      hand.elbow+=.35*ready-(hook?.93:1.72)*extension;
      hand.armStretch=extension*(hook?.71:.88);
      hand.splay+=(hook?.68:.13)*ready-(hook?.42:.17)*extension;
      pose.handSide=guard>.06?side:0;
    }
  }
  if(hit&&Number.isFinite(hit.phase)&&Number.isFinite(hit.angle)){
    const phase=clamp(hit.phase),amount=clamp(hit.force??.65);
    const recoil=(.5+amount*.5)*ease((phase+.04)/.15)*(1-ease((phase-.13)/.87));
    const local=hit.angle-(e.angle||0),along=Math.cos(local),across=Math.sin(local);
    pose.lean+=along*.57*recoil;pose.roll+=across*.44*recoil;
    pose.bob-=.065*recoil;pose.squash-=.16*recoil;pose.effort=Math.max(pose.effort,recoil);
    for(const limb of [pose.left,pose.right]){
      limb.arm+=.58*recoil;limb.splay+=.47*recoil;limb.elbow+=.28*recoil;
      limb.thigh+=.41*recoil;limb.shin-=.72*recoil;
    }
  }
  return pose;
}

export const fiberLifetime=.32;
const fibers=['#ffc974','#f5e8c0','#9bd9c5','#ed9c8b','#f5e8c0','#ffc974'];
// Short bent strands scatter around the contact position, in world metres.
// The same small polylines feed the 3D tubes and their projected software strokes.
export function impactFibers(angle,force=0){
  const size=.83+.35*clamp(force);
  return fibers.map((color,i)=>{
    const a=angle+Math.cos(i*2.39996)*1.75;
    const vertical=Math.sin(i*2.39996)*.82+.37,c=Math.cos(a),s=Math.sin(a);
    const vector=[c*(1-.34*Math.abs(vertical)),vertical,s*(1-.34*Math.abs(vertical))];
    const bend=(i%2?1:-1)*.060*size;
    const at=(r,b)=>[vector[0]*r-s*b,vector[1]*r+.4*b,vector[2]*r+c*b];
    return {color,points:[at(.085*size,0),at(.155*size,bend),at(.24*size,bend*.23)],velocity:vector.map(v=>v*(.73+.17*(i%3))*size)};
  });
}
