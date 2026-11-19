// Metres and seconds. steering is the peak yaw rate, cruise scales normal city traffic.
const specs={};
function define(type,label,length,width,height,forward,reverse,accel,brake,steering,cruise,openSeat=false){
  specs[type]=Object.freeze({label,halfLength:length/2,halfWidth:width/2,height,forward,reverse,accel,brake,steering,cruise,openSeat});
}
define('car','Berline rétro',4.12,1.80,1.72,30,7,7.6,14,1.26,1.00);
define('compact','Citadine',3.42,1.62,1.65,24,6.5,8.1,14.8,1.62,.94);
define('sedan','Grande berline',4.58,1.87,1.56,32,7.2,7.1,13.1,1.18,1.04);
define('taxi','Taxi parisien',4.62,1.86,1.85,29,7,7.2,14,1.23,1.02);
define('van','Fourgonnette',4.84,2.02,2.17,24,5,5.4,11.5,.99,.86);
define('bus','Autobus parisien',8.50,2.45,2.95,20,3.7,3.9,8.8,.67,.72);
define('sport','Coupé sport',4.24,1.91,1.26,39,8,11.3,17.5,1.32,1.16);
define('police','Voiture de police',4.32,1.83,1.84,34,7.2,9.2,16,1.32,1.03);
define('ambulance','Ambulance',5.06,2.08,2.32,27,5.2,6,13.8,.97,.90);
define('firetruck','Fourgon de pompiers',5.72,2.26,2.49,24,4.5,5.1,11.8,.86,.79);
define('swat','Fourgon d’intervention',5.17,2.14,2.33,26,5.3,6.7,13.4,.98,.87);
define('scooter','Scooter rétro',2.02,.78,1.20,22,2.2,6.9,12.6,2.10,.90,true);
define('cargo','Triporteur de livraison',2.73,1.08,1.22,8,1.7,2.9,7.5,1.53,.63,true);
define('pickup','Camionnette de marché',4.84,1.98,1.86,28,5.8,6.1,12.7,1.06,.87);
export const vehicleTypes=Object.freeze(Object.keys(specs));
export const isVehicleType=type=>Object.hasOwn(specs,type);
export const vehicleSpec=type=>isVehicleType(type)?specs[type]:specs.car;

// Sidewalk-facing passenger doors on the bus, front doors on the other vehicles.
export function vehicleDoorways(vehicle,clearance=0){
  const {halfLength,halfWidth}=vehicleSpec(vehicle.type),angle=vehicle.angle||0;
  const c=Math.cos(angle),s=Math.sin(angle),side=halfWidth+clearance;
  const seatX=vehicle.type==='cargo'?-.74:vehicle.type==='scooter'?-.24:halfLength*.16;
  const local=vehicle.type==='bus'?[[halfLength*.73,side],[0,side],[halfLength*.73,-side]]:[[seatX,-side],[seatX,side]];
  return local.map(([forward,right])=>({x:vehicle.x+c*forward-s*right,y:vehicle.y+s*forward+c*right}));
}
