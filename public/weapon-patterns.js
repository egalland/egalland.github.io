import { weaponCatalog } from './weapon-catalog.js';

// Aim-assist, manual shots and the fan all use the same caller-provided first-contact trace.
const spreads={
  shotgun:[0,-.072,.072],
  confetti:[0,-.10,.10,-.21,.21,-.34,.34],
  bubbles:[0,-.126,.126],
  star:[0,-.059,.059],
  chime:[0,-.19,.19,-.39,.39,-.62,.62,-.85,.85,-1.09,1.09,-1.32,1.32]
};
const interactions={
  pompom:{area:3.1,limit:5},
  boomerang:{chain:5.1,limit:1},
  spool:{chain:3.5,limit:3}
};
const radians=(from,to)=>Math.atan2(to.y-from.y,to.x-from.x);
const distance=(from,to)=>Math.hypot(to.x-from.x,to.y-from.y);
function tip(ray){return {x:ray.origin.x+Math.cos(ray.angle)*ray.length,y:ray.origin.y+Math.sin(ray.angle)*ray.length};}
export function resolveWeaponShot(kind,angle,trace,targets=[],visible,firstRay=null){
  const weapon=weaponCatalog[kind];
  const rays=[],hits=[],used=new Set();
  if(!weapon||!Number.isFinite(angle)||typeof trace!=='function')return {rays,hits,impact:null};
  const add=(target,damage)=>{
    if(!target||target.id===undefined||used.has(target.id))return;
    used.add(target.id);hits.push({target,damage:Math.max(1,Math.round(damage))});
  };
  for(const spread of spreads[kind]||[0]){
    const direction=angle+spread;
    const result=(spread===0&&firstRay)||trace(direction);
    if(!result?.origin||!Number.isFinite(result.length))continue;
    const ray={...result,angle:result.angle??direction};rays.push(ray);
    add(ray.hit,weapon.damage);
  }
  if(kind==='chime'&&rays.length){
    const length=Math.max(...rays.map(r=>r.length));
    rays.splice(1);rays[0]={...rays[0],length};
  }
  const mode=interactions[kind],primary=rays[0];
  if(!mode||!primary)return {rays,hits,impact:null};
  let origin=tip(primary),sourceId=primary.hit?.id;
  const impact=mode.area?{...origin,radius:mode.area}:null;
  if(typeof visible!=='function'||(mode.chain&&!primary.hit))return {rays,hits,impact};
  for(let i=0;i<mode.limit;i++){
    const reach=mode.area||mode.chain;
    const options=targets.filter(t=>!used.has(t.id)&&!t.stunned&&Number.isFinite(t.x+t.y))
      .map(target=>({target,d:distance(origin,target)})).filter(r=>r.d<=reach)
      .sort((a,b)=>a.d-b.d||String(a.target.id).localeCompare(String(b.target.id)));
    const next=options.find(r=>visible(origin,r.target,sourceId));
    if(!next)break;
    add(next.target,weapon.damage*(mode.area?1-.6*next.d/reach:Math.pow(.78,i+1)));
    if(mode.chain){
      rays.push({origin:{...origin},angle:radians(origin,next.target),length:next.d,hit:next.target});
      origin={x:next.target.x,y:next.target.y};sourceId=next.target.id;
    }
  }
  return {rays,hits,impact};
}
