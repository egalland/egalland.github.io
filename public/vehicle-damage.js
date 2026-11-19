import {vehicleSpec} from './vehicle-types.js';
import {weaponCatalog} from './weapon-catalog.js';

export function chassisHealth(value){return Number.isFinite(value)?Math.max(0,Math.min(100,value)):100;}
export function chassisStage(value){
  const hp=chassisHealth(value);
  return hp===0?3:hp<=32?2:hp<=72?1:0;
}
export function enginePower(value){return [1,.82,.50,0][chassisStage(value)];}
export function chassisDamage(type,{cause,speed,weapon}){
  if(cause==='weapon')return Object.hasOwn(weaponCatalog,weapon)&&weapon!=='fist'?Math.round(weaponCatalog[weapon].damage*.90):0;
  if(cause!=='crash'||!Number.isFinite(speed)||speed<4.2)return 0;
  const spec=vehicleSpec(type),weight=Math.max(.82,Math.min(1.3,2.08/spec.halfLength));
  return Math.min(61,Math.round((Math.min(42,speed)-3)*2.15*weight));
}
