import {meleeMoves} from './melee-moves.js';
export {meleeMoves};
export const combo=['jab','hook','kick'];
export const recoilSeconds=.32;

export function recoilPhase(record,now){
  if(!record)return null;
  const phase=Math.max(0,(now-record.at)/(recoilSeconds*1000));
  return phase<1?{phase,angle:record.angle,force:record.force}:null;
}

// Choose one exposed body within the swinging limb's arc. Height is absolute here,
// so two avatars on opposite levels of a terrace are tested against real body volumes.
export function meleeContact(origin,angle,move,targets,ground,blocked){
  const hand=ground(origin.x,origin.y)+(origin.lift||0)+move.height,options=[];
  for(const target of targets){
    if(target.down||target.isCar)continue;
    const radius=target.r||.42,dx=target.x-origin.x,dy=target.y-origin.y,distance=Math.hypot(dx,dy);
    if(distance>move.reach+radius)continue;
    const bearing=distance>.005?Math.atan2(dy,dx):angle;
    const error=Math.abs(Math.atan2(Math.sin(bearing-angle),Math.cos(bearing-angle)));
    if(error>move.arc)continue;
    const base=ground(target.x,target.y)+(target.lift||0),high=base+(target.h??1.65);
    if(hand<base+.06||hand>high+.14)continue;
    const reach=Math.max(0,distance-radius*.84),x=origin.x+Math.cos(bearing)*reach,y=origin.y+Math.sin(bearing)*reach;
    options.push({target,angle:bearing,x,y,height:hand-ground(x,y),reach,score:reach+error*.18});
  }
  options.sort((a,b)=>a.score-b.score||String(a.target.id).localeCompare(String(b.target.id)));
  for(const option of options){
    const n=Math.max(1,Math.ceil(option.reach/.105));
    let clear=true;
    for(let i=1;i<=n;i++){
      const x=origin.x+(option.x-origin.x)*i/n,y=origin.y+(option.y-origin.y)*i/n;
      if(blocked(x,y,hand-ground(x,y),option.target.id)){clear=false;break;}
    }
    if(clear)return option;
  }
  return null;
}
