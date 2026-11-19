// Compare departures from the same lane. An early turn must clear the actual queue with
// the whole vehicle, including its tail through the turn and a stopping gap beyond it.
export function createDetourPlanner(alternatives,sample){
  return function chooseDetour({routeId,routeDistance,spec,blockedDistance,obstructedAt,blockedPose}){
    if(!Number.isFinite(blockedDistance)||blockedDistance<=0||blockedDistance>68)return null;
    const options=alternatives(routeId,routeDistance,spec);
    if(!options?.length)return null;
    const here=sample(routeId,routeDistance);
    if(!here)return null;
    const originalBlock=sample(routeId,routeDistance+blockedDistance);
    if(!originalBlock)return null;
    let best=null,bestScore=-Infinity;
    for(const option of options){
      if(option.routeId===routeId||option.branchDistance<0||option.branchDistance>=blockedDistance)continue;
      const entry=sample(option.routeId,option.routeDistance);
      if(!entry||Math.hypot(entry.x-here.x,entry.y-here.y)>.15||Math.cos(entry.angle-here.angle)<.997)continue;
      const horizon=blockedDistance+spec.halfLength*2+7;
      let clearance=Infinity,turn=0,previous=entry,usable=true;
      const steps=Math.ceil(horizon/1.5);
      for(let i=1;i<=steps;i++){
        const ahead=horizon*i/steps;
        const pose=sample(option.routeId,option.routeDistance+ahead);
        if(!pose||obstructedAt(pose,.20)||blockedPose?.(pose.x,pose.y,pose.angle,spec)){
          usable=false;break;
        }
        if(ahead>option.branchDistance)clearance=Math.min(clearance,Math.hypot(pose.x-originalBlock.x,pose.y-originalBlock.y));
        turn+=Math.acos(Math.min(1,Math.max(-1,Math.cos(pose.angle-previous.angle))));
        previous=pose;
      }
      if(!usable||clearance<spec.halfWidth+.45)continue;
      const score=Math.min(clearance,10)-turn+option.branchDistance*.02;
      if(score>bestScore||(score===bestScore&&option.routeId<best.routeId)){bestScore=score;best=option;}
    }
    return best;
  };
}
