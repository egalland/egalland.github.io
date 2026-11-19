import {weaponCatalog} from '../public/weapon-catalog.js';
import {weaponShotShape} from '../public/weapon-patterns.js';

const FIRE_AGE=2200, REWIND=450, PRESENTATION_DELAY=65;
const SHOT_ID=/^[a-zA-Z\d_-]{1,48}$/;
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angleDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const end=r=>({x:r.x+Math.cos(r.angle)*r.length,y:r.y+Math.sin(r.angle)*r.length});
const validRay=r=>[r?.x,r?.y,r?.angle,r?.length].every(Number.isFinite)&&
  Math.abs(r.x)<=100_000&&Math.abs(r.y)<=100_000&&Math.abs(r.angle)<=16&&r.length>=0;
const spatial=(state,at)=>({x:state.x,y:state.y,lift:state.lift||0,vx:state.vx||0,vy:state.vy||0,car:state.vehicle?.id||'',at});

// A fixed ring keeps only the positions replaced by a newer member snapshot.
// The current pose stays in mc_members. Stationary players cost no extra writes.
export function rememberFirePose(stmts,q,room,id,previous,seen,current){
  if(!Number.isFinite(previous.x)||!Number.isFinite(previous.y)||!Number.isFinite(current.x))return;
  const old=spatial(previous,seen),next=spatial(current,0);
  if(old.x===next.x&&old.y===next.y&&old.lift===next.lift&&old.vx===next.vx&&old.vy===next.vy&&old.car===next.car)return;
  stmts.push(q(`INSERT INTO mc_fire_poses (room,player,slot,at,x,y,lift,vx,vy,car)
    VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(room,player,slot) DO UPDATE SET
    at=excluded.at,x=excluded.x,y=excluded.y,lift=excluded.lift,vx=excluded.vx,vy=excluded.vy,car=excluded.car
    WHERE excluded.at>=mc_fire_poses.at`,
    room,id,Math.floor(seen/50)%16,seen,old.x,old.y,old.lift,old.vx,old.vy,old.car));
}
function validateRay(r,range){
  if(!validRay(r)||r.length>range+.1)return null;
  return {x:r.x,y:r.y,angle:r.angle,length:Math.min(r.length,range)};
}
export function prepareFire(data,now,validTarget){
  if(!data||typeof data.shotId!=='string'||!SHOT_ID.test(data.shotId)||typeof data.kind!=='string'||!Object.hasOwn(weaponCatalog,data.kind)||data.kind==='fist'||
      !Number.isSafeInteger(data.firedAt)||data.firedAt<now-FIRE_AGE||data.firedAt>now+250)return null;
  const weapon=weaponCatalog[data.kind],shape=weaponShotShape(data.kind),primary=validateRay(data,weapon.range);
  if(!primary)return null;
  const packetRays=data.rays===undefined?[data]:data.rays;
  const count=shape.chain?1+shape.limit:data.kind==='chime'?1:shape.spreads.length;
  if(!Array.isArray(packetRays)||!packetRays.length||packetRays.length>count||
      (!shape.chain&&packetRays.length!==count))return null;
  const rays=[];
  for(let i=0;i<packetRays.length;i++){
    const chained=shape.chain&&i>0;
    const ray=validateRay(packetRays[i],chained?shape.chain:weapon.range);
    if(!ray)return null;
    if(chained){
      if(distance(ray,end(rays[i-1]))>.3)return null;
    }else if(angleDiff(ray.angle,primary.angle+shape.spreads[i])>.016||distance(ray,primary)>1.4)return null;
    if(!i&&(distance(ray,primary)>.03||Math.abs(ray.length-primary.length)>.04))return null;
    rays.push(ray);
  }
  const shot={...primary,shotId:data.shotId,firedAt:data.firedAt,kind:data.kind,lift:clamp(Number.isFinite(data.lift)?data.lift:0,0,64)};
  if(rays.length>1)shot.rays=rays;
  if(shape.area)shot.impact={...end(primary),radius:shape.area};
  const limit=shape.spreads.length+(shape.limit||0);
  const hits=Array.isArray(data.hits)?data.hits.slice(0,limit*2).filter(h=>h&&validTarget(h.target)&&Number.isFinite(h.damage)&&h.damage>0):[];
  return {shot,rays,shape,weapon,hits,limit,viewAt:data.viewAt};
}

// Authentication and pose reads share one round trip. Unauthenticated requests
// cannot read other members' snapshots, even within the same read transaction.
export async function readFireSession(db,q,{room,id,token,now,aliveSince,packets,submitted}){
  const auth='SELECT id,name,state,seen,joined FROM mc_members WHERE room=? AND id=? AND secret=? AND seen>?';
  const authArgs=[room,id,token,aliveSince];
  const getMember=q(auth,...authArgs),tracks=new Map();
  const targets=new Set();
  for(const p of packets.values())for(const h of p.hits)if(h.target!==id)targets.add(h.target);
  const steadyMiss=Number.isFinite(submitted?.x)&&Number.isFinite(submitted?.y)&&
    !submitted.vehicle&&!submitted.moving&&!submitted.vx&&!submitted.vy&&
    [...packets.values()].every(p=>p.shot.firedAt>=now-140&&distance(p.shot,submitted)<.85);
  const rewind=packets.size&&(targets.size||!steadyMiss);
  let member,rows=[],samples=[];
  if(rewind){
    const reads=[getMember];
    if(targets.size)reads.push(q(`SELECT id,state,seen,joined FROM mc_members WHERE room=? AND
      id IN (SELECT value FROM json_each(?)) AND seen>? AND EXISTS (${auth})`,
      room,JSON.stringify([...targets]),aliveSince,...authArgs));
    reads.push(q(`SELECT player,at,x,y,lift,vx,vy,car FROM mc_fire_poses WHERE room=? AND player IN
      (SELECT value FROM json_each(?)) AND at>=? AND EXISTS (${auth}) ORDER BY player,at`,
      room,JSON.stringify([id,...targets]),now-1100,...authArgs));
    const result=await db.batch(reads);
    member=result[0].results[0];
    if(targets.size)rows=result[1].results;
    samples=result.at(-1).results;
  }else member=await getMember.first();
  if(!member)return {member:null};
  const priorState=JSON.parse(member.state);
  if(packets.size){
    tracks.set(id,{state:priorState,joined:member.joined,current:spatial(priorState,member.seen),past:[]});
    for(const row of rows){
      const state=JSON.parse(row.state);
      tracks.set(row.id,{state,joined:row.joined,current:spatial(state,row.seen),past:[]});
    }
    for(const sample of samples){
      const track=tracks.get(sample.player);
      if(track&&sample.at>=track.joined&&sample.at<track.current.at)track.past.push(sample);
    }
  }
  return {member,priorState,tracks};
}
function atTime(track,time){
  const samples=[...track.past,track.current];
  let i=samples.length-1;
  // Do not rewind across a district transfer or interpolate the space between
  // disconnected map positions. Keeping an older stationary pose is safe.
  while(i>0){
    const a=samples[i-1],b=samples[i],span=b.at-a.at;
    const speed=a.car||b.car?65:10;
    if(a.car!==b.car||span>1400||distance(a,b)>2.8+speed*Math.min(.6,span/1000))break;
    i--;
  }
  let previous=samples[i];
  if(time<=previous.at)return previous;
  for(i++;i<samples.length;i++){
    const next=samples[i];
    if(time<=next.at){
      const span=next.at-previous.at;
      const t=span>650?clamp(1-(next.at-time)/200,0,1):(time-previous.at)/Math.max(1,span);
      return {...(t<.5?previous:next),x:previous.x+(next.x-previous.x)*t,
        y:previous.y+(next.y-previous.y)*t,lift:previous.lift+(next.lift-previous.lift)*t};
    }
    previous=next;
  }
  const dt=clamp((time-previous.at)/1000,0,.18);
  const factor=Math.min(1,(previous.car?52:7)/Math.max(.001,Math.hypot(previous.vx,previous.vy)));
  return {...previous,x:previous.x+previous.vx*dt*factor,y:previous.y+previous.vy*dt*factor};
}
function chimeContact(shot,p,muzzle,tolerance,shape,usedRays){
  // Its effect uses one arc; its contacts come from the original thirteen rays.
  const center={x:shot.x-Math.cos(shot.angle)*muzzle,y:shot.y-Math.sin(shot.angle)*muzzle};
  const dx=p.x-center.x,dy=p.y-center.y;
  let best=null,nearest=Infinity;
  for(let i=0;i<shape.spreads.length;i++){
    if(usedRays.has(i))continue;
    const a=shot.angle+shape.spreads[i],c=Math.cos(a),s=Math.sin(a);
    const along=dx*c+dy*s-muzzle;
    const side=Math.abs(dy*c-dx*s);
    if(along>=-tolerance&&along<=shot.length+tolerance&&side<=tolerance&&side<nearest){best=i;nearest=side;}
  }
  return best;
}
function eligibleContact(packet,p,muzzle,usedRays){
  const {shot,weapon,shape,rays}=packet;
  const margin=p.car?2.55:1.38;
  if(Math.abs(p.lift-shot.lift)>(p.car?3.4:2.6))return null;
  if(shot.kind==='chime'){
    const ray=chimeContact(shot,p,muzzle,margin,shape,usedRays);
    return ray===null?null:{ray,max:weapon.damage};
  }
  for(let i=0;i<rays.length;i++){
    if(usedRays.has(i)||distance(end(rays[i]),p)>margin)continue;
    const factor=shape.chain ? .78**i : 1;
    return {ray:i,max:Math.round(weapon.damage*factor)};
  }
  if(shape.area){
    const d=distance(shot.impact,p);
    if(d<=shape.area+.55)return {max:Math.round(weapon.damage*(1-.6*clamp((d-.55)/shape.area,0,1)))};
  }
  return null;
}
export function recordFire(stmts,q,room,id,name,packet,tracks,actor,now){
  const {shot,weapon,shape}=packet,track=tracks.get(id);
  if(!track||!Number.isFinite(actor.x)||actor.health===0||actor.downUntil>now||track.joined>shot.firedAt+250)return;
  const fired=clamp(shot.firedAt,now-REWIND,now);
  const past=Number.isFinite(track.current.x)&&track.current.at<now?[...track.past,track.current]:track.past;
  const history={...track,past,current:spatial(actor,now)};
  const shooter=atTime(history,fired),muzzle=shooter.car?1.8:.35;
  if(!Number.isFinite(shooter.x+shooter.y)||distance(shot,shooter)>muzzle+(shooter.car?3.8:2)||
      Math.abs(shot.lift-shooter.lift)>2.2)return;
  // All direct rays start at the muzzle for their own bearing. Chain segments
  // start instead at the previous segment's endpoint (checked on decode).
  if(!shape.chain){
    const origin={x:shot.x-Math.cos(shot.angle)*muzzle,y:shot.y-Math.sin(shot.angle)*muzzle};
    if(packet.rays.some(r=>distance(r,{x:origin.x+Math.cos(r.angle)*muzzle,y:origin.y+Math.sin(r.angle)*muzzle})>.35))return;
  }
  const shotOp='fire:'+shot.shotId;
  const rows=[{op:shotOp,type:'shot',data:shot}],usedTargets=new Set(),usedRays=new Set();
  for(const hit of packet.hits){
    if(usedTargets.size===packet.limit)break;
    if(hit.target===id||usedTargets.has(hit.target))continue;
    const target=tracks.get(hit.target);
    if(!target||target.joined>shot.firedAt+75||target.state.health===0||target.state.downUntil>now)continue;
    const requested=hit.viewedAt??hit.viewAt??packet.viewAt;
    const viewed=clamp(Number.isFinite(requested)?requested:shot.firedAt-PRESENTATION_DELAY,Math.max(now-REWIND,fired-250),fired);
    const p=atTime(target,viewed);
    if(!Number.isFinite(p.x+p.y))continue;
    const allowed=eligibleContact(packet,p,muzzle,usedRays);
    if(!allowed)continue;
    usedTargets.add(hit.target);
    if(allowed.ray!=null)usedRays.add(allowed.ray);
    const damage=clamp(Math.round(hit.damage),1,allowed.max);
    rows.push({op:shotOp+':'+hit.target,type:'hit',data:{shotId:shot.shotId,firedAt:shot.firedAt,
      target:hit.target,angle:Math.atan2(p.y-shooter.y,p.x-shooter.x),force:clamp(damage/45,.12,1),
      damage,cause:'weapon',weapon:shot.kind}});
  }
  // The materialized gate freezes the receipt decision before inserting any row.
  // A retry with a modified list cannot append a hit; the whole trigger is atomic.
  stmts.push(q(`WITH fresh AS MATERIALIZED (
    SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM mc_events WHERE room=? AND player=? AND op=?)
    AND NOT EXISTS (SELECT 1 FROM mc_events WHERE room=? AND player=? AND type='shot' AND at>=?
      AND abs(json_extract(data,'$.firedAt')-?)<CASE WHEN json_extract(data,'$.kind')=? THEN ? ELSE 95 END))
    INSERT INTO mc_events (room,player,op,name,type,data,at)
    SELECT ?,?,json_extract(value,'$.op'),?,json_extract(value,'$.type'),json_extract(value,'$.data'),?
    FROM fresh CROSS JOIN json_each(?) ORDER BY CAST(key AS INTEGER)`,
    room,id,shotOp,room,id,now-FIRE_AGE-1300,shot.firedAt,shot.kind,Math.floor(weapon.interval*900),
    room,id,name,now,JSON.stringify(rows)));
}
