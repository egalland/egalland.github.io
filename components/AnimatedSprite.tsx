'use client';
import {ANIMATIONS,atlasUrl,type AnimationId} from '@/lib/sprite-animation';
export default function AnimatedSprite({id,large=false,running=false}:{id:AnimationId;large?:boolean;running?:boolean}){
  if(id==='army')return <span aria-hidden className={'animated-sprite guard-portrait'+(large?' large':'')+(running?' marching':'')} />;
  if(id==='city'||id==='depot')running=false;
  const d=ANIMATIONS[id];
  return <span aria-hidden className={'animated-sprite '+(large?'large ':'')+(running?'running':'')} style={{backgroundImage:`url(${atlasUrl(id)})`,backgroundSize:`400% ${d.rows*100}%`,backgroundPositionY:d.row/(d.rows-1)*100+'%',animationDuration:4/d.fps+'s'}}/>;
}

export function BuildingSprite({kind}:{kind:'mam'|'warehouse'|'barracks'|'repairbay'}){
  const i={mam:0,warehouse:1,barracks:2,repairbay:3}[kind];
  return <span aria-hidden className="building-sprite" style={{backgroundImage:'url(/art/detail-buildings.webp)',backgroundSize:'200% 200%',backgroundPosition:(i%2)*100+'% '+Math.floor(i/2)*100+'%'}}/>;
}
