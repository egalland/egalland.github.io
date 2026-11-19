// Send progress along a known road. The receiving client reconstructs the same vehicle and body.
const SHARE_RADIUS=143;
const MAX_SHARED_CARS=24;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function progressOnRoute(vehicle){
  const {routeDistance,routeLength,routeLoop}=vehicle;
  if(routeLoop===false||!routeLength)return routeDistance;
  return ((routeDistance%routeLength)+routeLength)%routeLength;
}
function compareObservers(a,b){
  return (a.joinedAt??Infinity)-(b.joinedAt??Infinity)||a.id.localeCompare(b.id);
}

export function cleanTrafficPacket(packet,now){
  if(!Number.isFinite(packet?.at)||packet.at<now-4000||packet.at>now+1000||!Array.isArray(packet.cars))return null;
  const cars=[];
  for(const row of packet.cars.slice(0,MAX_SHARED_CARS)){
    if(!Array.isArray(row)||row.length!==4)continue;
    const [route,index,progress,speed]=row;
    if(typeof route!=='string'||!/^[-\w:]{1,63}$/.test(route)||!Number.isSafeInteger(index)||index<0||
      !Number.isFinite(progress)||progress<0||progress>1000000||!Number.isFinite(speed)||speed<0||speed>28)continue;
    cars.push([route,index,progress,speed]);
  }
  return {at:Math.min(packet.at,now),cars};
}
export function packTraffic(vehicles,observer,followers,epoch){
  const nearby=vehicles.filter(v=>Number.isInteger(v.routeIndex)&&v.routeId&&!followers.has(v.id)&&distance(v,observer)<=SHARE_RADIUS);
  nearby.sort((a,b)=>distance(a,observer)-distance(b,observer));
  const cars=nearby.slice(0,MAX_SHARED_CARS).map(v=>[
    v.routeId,v.routeIndex,Math.round(progressOnRoute(v)*100)/100,Math.round(v.speed*100)/100
  ]);
  return {at:Math.floor(epoch),cars};
}

export function receiveTraffic(roster,observer,existing,epoch,vehicleAt,sample){
  const checkpoints=new Map(),followers=new Set(),owned=new Set(existing.map(v=>v.id));
  const peers=roster.filter(r=>r.id!==observer.id&&distance(r,observer)<=SHARE_RADIUS*2&&r.traffic?.at>=epoch-3500);
  peers.sort(compareObservers);
  for(const peer of peers){
    const packet=peer.traffic,lag=Math.max(0,Math.min(.45,(epoch-packet.at)/1000));
    const isLeader=compareObservers(peer,observer)<0;
    for(const [route,index,progress,speed] of packet.cars){
      const car=vehicleAt(route,index);
      if(!car||checkpoints.has(car.id))continue;
      const pose=sample(route,progress+speed*lag);
      if(!pose||distance(pose,peer)>SHARE_RADIUS+6||distance(pose,observer)>SHARE_RADIUS)continue;
      if(isLeader)followers.add(car.id);
      // A newly arrived observer may seed a missing car even during an authority handoff.
      if(isLeader||!owned.has(car.id))checkpoints.set(car.id,{...car,...pose,speed,routeDistance:progress,stamp:packet.at});
    }
  }
  return {checkpoints:[...checkpoints.values()],followers};
}
