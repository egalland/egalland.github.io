// The same first-contact trace governs the original shot and every touch correction.
export function traceShot(position,angle,muzzle,range,targets,contact,melee=false){
  const dx=Math.cos(angle),dy=Math.sin(angle);
  const x=position.x+dx*muzzle,y=position.y+dy*muzzle;
  let hit=null,length=range;
  for(const target of targets){
    const ox=target.x-x,oy=target.y-y;
    const front=ox*dx+oy*dy,side=Math.abs(ox*dy-oy*dx);
    const radius=(target.r||.4)+(melee ? .35 : 0);
    if(front<=0||front>range+radius||side>radius)continue;
    const entry=Math.max(.025,front-Math.sqrt(Math.max(0,radius*radius-side*side)));
    if(entry<length){length=entry;hit=target;}
  }
  // The target's own collider is the endpoint. All intervening scenery and traffic still stop the shot.
  // A small radius and overlapping samples also catch narrow poles and thin building edges.
  const ignoreId=hit?.id;
  for(let d=0;d<length;d+=.23){
    const obstruction=contact(x+dx*d,y+dy*d,ignoreId);
    if(!obstruction)continue;
    hit=targets.find(target=>target.id===obstruction.id)||null;
    length=d;break;
  }
  return {angle,hit,length,origin:{x,y}};
}

const radians=Math.PI/180;
const cone=11*radians;
export function targetHeight(target){
  if(target.hitKind==='prop')return Math.max(.32,Math.min(1.1,(target.h||1.5)*.67));
  return target.isCar?1.05:1.12;
}

export function chooseTouchShot({position,yaw,muzzle,range,targets,wanted,previousId,project,trace,direct}){
  const ranked=[];
  for(const target of targets){
    if(target.self||target.stunned||!Number.isFinite(target.x)||!Number.isFinite(target.y))continue;
    const dx=target.x-position.x,dy=target.y-position.y,dist=Math.hypot(dx,dy);
    if(dist<=muzzle||dist-muzzle>range)continue;
    const angle=Math.atan2(dy,dx),error=Math.abs(Math.atan2(Math.sin(angle-yaw),Math.cos(angle-yaw)));
    const current=target.id===previousId;
    if(error>cone+(current?1.5*radians:0))continue;
    const projected=project?.(target.x,target.y,targetHeight(target));
    if(project&&(!projected||!(projected.x>=0&&projected.x<=1)||!(Math.abs(projected.y-.5)<=.33)))continue;
    // A direct, visible hit always wins. The assist cannot replace someone already in the line of fire.
    if(direct.hit?.id===target.id)return {target,shot:direct};
    const officer=wanted>0&&target.hitKind==='npc'&&(target.type==='police'||target.type==='swat');
    const score=error+dist/range*.7*radians+Math.abs((projected?.y??.5)-.5)*2*radians
      -(officer?2.25*radians:0)-(current?1.35*radians:0);
    ranked.push({target,angle,score});
  }
  ranked.sort((a,b)=>a.score-b.score||String(a.target.id).localeCompare(String(b.target.id)));
  for(const {target,angle} of ranked){
    const shot=trace(angle);
    if(shot.hit?.id===target.id)return {target,shot};
  }
  return null;
}
