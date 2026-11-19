// Shared by the map and the server. Positions use projected metres; IDs carry whole decimetres.
const dropKinds=['smg','shotgun','yarn'];
export const dropCellSize=220;
export function encodeDropId(weapon,x,y){
  if(!dropKinds.includes(weapon)||!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>100000||Math.abs(y)>100000)return null;
  return 'wp-'+weapon+':'+Math.round(x*10)+':'+Math.round(y*10);
}
export function decodeDropId(id){
  if(typeof id!=='string')return null;
  const m=/^wp-(smg|shotgun|yarn):(-?\d{1,7}):(-?\d{1,7})$/.exec(id);
  if(!m)return null;
  const x=Number(m[2])/10,y=Number(m[3])/10;
  return encodeDropId(m[1],x,y)===id?{weapon:m[1],x,y}:null;
}
function mixDropSeed(x,y,salt){
  let n=Math.imul(x+3519,0x27d4eb2d)^Math.imul(y+8181,0x165667b1)^salt;
  n=Math.imul(n^(n>>>15),0x85ebca6b);
  return (n^(n>>>13))>>>0;
}
export function gridDrop(ix,iy){
  // The central 110 m of each 220 m cell keeps neighbouring boxes at least 110 m apart.
  const offset=salt=>55+(mixDropSeed(ix,iy,salt)%1101)/10;
  const x=Math.round((ix*dropCellSize+offset(2953))*10)/10,y=Math.round((iy*dropCellSize+offset(6539))*10)/10;
  const weapon=dropKinds[mixDropSeed(ix,iy,13011)%dropKinds.length];
  return {id:encodeDropId(weapon,x,y),weapon,x,y};
}
export const authoredWeaponDrops=Object.freeze([
  ["yarn",3108.4,569],     // Étoile
  ["shotgun",2355.1,229.8], // Porte Maillot
  ["yarn",1674.4,-106.1],   // Les Sablons
  ["smg",1071.5,-391],      // Neuilly-sur-Seine
  ["shotgun",221.8,-804.7], // Pont de Neuilly
  ["yarn",-276.5,-1038.3],  // Esplanade
  ["smg",-941.7,-1306.2],   // Grande Arche
  ["smg",4170.3,1103],      // Champs-Élysées
  ["shotgun",5232.5,1608],  // Concorde
  ["yarn",6260.1,2128.3],   // Louvre
  ["shotgun",3163.4,2303.5],// Tour Eiffel
  ["smg",7183.7,3012.1],    // Notre-Dame
  ["yarn",6835.8,-493.9]    // Sacré-Cœur
].map(([weapon,x,y])=>Object.freeze({id:encodeDropId(weapon,x,y),weapon,x,y})));
const authoredWeaponIds=new Set(authoredWeaponDrops.map(p=>p.id));
export function isActiveGridDrop(x,y){
  const ix=Math.floor(x/dropCellSize),iy=Math.floor(y/dropCellSize);
  if(mixDropSeed(ix,iy,3)%4===0 || Math.hypot(x-3096.44,y-561.04)<125)return false;
  return authoredWeaponDrops.every(p=>Math.hypot(x-p.x,y-p.y)>=68);
}
export function isEligibleDropId(id){
  const p=decodeDropId(id);
  if(!p)return false;
  if(authoredWeaponIds.has(id))return true;
  if(p.x<-14700||p.x>30800||p.y<-19000||p.y>29000)return false;
  return isActiveGridDrop(p.x,p.y) && gridDrop(Math.floor(p.x/dropCellSize),Math.floor(p.y/dropCellSize)).id===id;
}
