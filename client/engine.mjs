// World coordinates are shared by the renderer, the local simulation and replay verification.
export const training=['crawler','empty','empty','trap','empty','eye','empty','crawler','empty','empty','empty','trap','boss','empty','empty'];
export const costs={empty:0,crawler:1,trap:1,cultist:2,eye:2,boss:4};
export function validLayout(l){return Array.isArray(l)&&l.length===15&&l.every(t=>typeof t==='string'&&Object.hasOwn(costs,t))&&l.reduce((n,t)=>n+costs[t],0)<=12&&l.some(t=>t!=='empty')}
export const stepTime=1/30,maxSteps=30*360,tile=64;
export const classes={
 knight:{name:'La Chevaleresse',weapon:'Espadon',detail:'Frappe en arc au corps à corps',hp:145,damage:30,delay:15,windup:5,range:113,projectileSpeed:0,projectileLife:0,speed:5},
 ranger:{name:'Le Veneur',weapon:'Arbalète',detail:'Carreaux rapides à longue portée',hp:105,damage:17,delay:9,windup:3,range:728,projectileSpeed:14,projectileLife:52,speed:5.7},
 mage:{name:'La Veilleuse',weapon:'Bâton astral',detail:'Orbes lentes à explosion',hp:90,damage:23,delay:19,windup:7,range:416,projectileSpeed:8,projectileLife:52,speed:5.25}
};
// Overlapping walkable tracts form a single bailey with two routes around the keep.
export const tracts=[
 ['Pont des suppliciés',10,20,13,28],['Basse-cour',6,14,18,20],
 ['Chemin de ronde',4,11,8,17],['Cloître des cendres',1,5,8,12],
 ['Galerie du nord',6,4,18,7],['Crypte des marées',16,6,23,13],
 ['Passage des veilleurs',16,12,19,16],['Parvis du donjon',9,8,15,12],
 ['Allée des gisants',10,11,14,15],['Donjon du reliquaire',9,1,15,5]
];
export function floorAt(i,j){return tracts.find(z=>i>=z[1]&&i<z[3]&&j>=z[2]&&j<z[4])}
export const landmarks=[{x:4.5*tile,y:7.5*tile,name:'Sceau des cendres'},{x:20.5*tile,y:8.5*tile,name:'Sceau des marées'}];
export const treasure={x:12*tile,y:2.5*tile};
export const slots=[[8,18],[15,18],[11,16],[6,14],[17,14],[3,10],[6,7],[4,6],[10,5],[14,5],[18,9],[21,7],[12,3],[10,10],[13,9]].map(([x,y])=>({x:(x+.5)*tile,y:(y+.5)*tile}));
export const scenery=[
 ['gate',11.55,20.15,155],['tower',9.6,21.1,136],['tower',13.7,20.9,132],['tower',5.9,19.9,148],['tower',18.15,19.75,153],['chapel',1.7,6.1,210],['tower',1.25,11.8,155],['gate',7.9,12,143],['chapel',22.3,8.3,160],['tower',22.7,12.7,135],['gate',15.8,6.3,144],['tower',9.1,1.5,166],['chapel',12.2,1.15,232],['tower',14.9,1.5,151],['brazier',10.3,24,36],['brazier',12.7,24,36],['brazier',8.6,17,38],['brazier',15.4,17,38],['brazier',3.6,7.7,40],['brazier',21,9.2,40],['brazier',11,2.8,38],['brazier',13,2.8,38]
].map(([type,i,j,w])=>({type,x:i*tile,y:j*tile,w}));
function passable(x,y,r){return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([a,b])=>floorAt(Math.floor((x+a)/tile),Math.floor((y+b)/tile)))}
function walk(entity,dx,dy){if(passable(entity.x+dx,entity.y,10))entity.x+=dx;if(passable(entity.x,entity.y+dy,10))entity.y+=dy}
const inactiveTick=-1000;
const enemyWeapons={
 crawler:{windup:8,cooldown:27,reach:46},
 eye:{windup:9,cooldown:78,reach:310},
 cultist:{windup:12,cooldown:78,reach:310},
 boss:{windup:15,cooldown:54,reach:310}
};
function actorTimers(){
 return {swing:inactiveTick,releaseAt:inactiveTick,attackAngle:-Math.PI/2,hit:inactiveTick,
         walkFrame:0,lastStep:inactiveTick,face:1};
}
export function startRaid(layout,gear,hero='knight',version=4){
 const c=classes[hero];
 const s={...actorTimers(),version,hero,gear,layout,tick:0,x:11.5*tile,y:26.5*tile,
          hp:c.hp,maxHp:c.hp,result:null,heading:-Math.PI/2,shotAt:0,dashAt:0,
          spellAt:0,hurtAt:0,pulse:inactiveTick,lastDash:inactiveTick,deathAt:inactiveTick,
          seals:0,shots:[],traps:[],guards:[],bursts:[],deaths:[]};
 layout.forEach((type,i)=>{
  const {x,y}=slots[i];
  if(type==='trap')s.traps.push({x,y,phase:i*12});
  else if(type!=='empty'){
   const hp={crawler:32,eye:38,cultist:50,boss:120}[type];
   s.guards.push({...actorTimers(),id:i,x,y,type,hp,max:hp,next:40+i*7});
  }
 });
 return s;
}
function bullet(s,x,y,angle,speed,power,type,life=52){
 s.shots.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,power,type,life});
}
function hurt(s,n){
 if(s.tick<s.hurtAt)return;
 s.hp=Math.max(0,s.hp-n);
 s.hurtAt=s.tick+20;
 s.hit=s.tick;
 if(!s.hp){s.result='lost';s.deathAt=s.tick}
}
function damageGuard(s,g,power){g.hp-=power;g.hit=s.tick}
function burst(s,x,y,r,power){
 s.bursts.push({x,y,r,tick:s.tick});
 for(const g of s.guards)if(Math.hypot(g.x-x,g.y-y)<r)damageGuard(s,g,power);
}
function faceAngle(actor,angle){
 const horizontal=Math.cos(angle)-Math.sin(angle);
 if(Math.abs(horizontal)>.01)actor.face=Math.sign(horizontal);
}
function releaseHero(s){
 const weapon=classes[s.hero],angle=s.attackAngle,power=weapon.damage+s.gear*3;
 if(s.hero!=='knight'){
  bullet(s,s.x,s.y,angle,weapon.projectileSpeed,power,s.hero,weapon.projectileLife);
  return;
 }
 for(const g of s.guards){
  const dx=g.x-s.x,dy=g.y-s.y,dist=Math.hypot(dx,dy);
  if(dist<weapon.range&&(dist<36||dx*Math.cos(angle)+dy*Math.sin(angle)>dist*.15)){
   damageGuard(s,g,power);
  }
 }
}
function shootGuard(s,g,angle){
 const count=g.type==='boss'?5:1;
 for(let i=0;i<count;i++)bullet(s,g.x,g.y,angle+i*Math.PI*2/5,3.5,9,'enemy');
}
function advanceGuard(s,g){
 const dx=s.x-g.x,dy=s.y-g.y,angle=Math.atan2(dy,dx),dist=Math.hypot(dy,dx);
 const weapon=enemyWeapons[g.type];
 if(s.version===4&&s.tick===g.releaseAt){
  if(g.type==='crawler'){
   const forward=dx*Math.cos(g.attackAngle)+dy*Math.sin(g.attackAngle);
   if(dist<weapon.reach+4&&(dist<14||forward>dist*.3))hurt(s,10);
  }else shootGuard(s,g,g.attackAngle);
 }
 if(dist>310)return;
 const planted=s.version===4&&s.tick<=g.releaseAt+3;
 if(!planted&&(!['eye','cultist'].includes(g.type)||dist>135)){
  const speed=g.type==='crawler'?2.4:1.65,oldX=g.x,oldY=g.y;
  walk(g,Math.cos(angle)*speed,Math.sin(angle)*speed);
  if(g.x!==oldX||g.y!==oldY){g.walkFrame++;g.lastStep=s.tick;faceAngle(g,angle)}
 }
 if(s.version!==4){
  // Version 3 applied damage on contact and fired instantly.
  if(dist<25)hurt(s,g.type==='boss'?18:9);
  if(g.type!=='crawler'&&s.tick>=g.next){g.next=s.tick+weapon.cooldown;shootGuard(s,g,angle)}
 }else if(s.tick>=g.next&&dist<=weapon.reach){
  g.swing=s.tick;g.releaseAt=s.tick+weapon.windup;g.attackAngle=angle;g.next=s.tick+weapon.cooldown;
  faceAngle(g,angle);
 }
}
export function advance(s,word){
 if(s.result)return;
 const move=word&15,angle=(word>>7)*Math.PI/128,c=classes[s.hero];
 const dx=Number(!!(move&1))-Number(!!(move&2)),dy=Number(!!(move&4))-Number(!!(move&8));
 const len=Math.hypot(dx,dy)||1;
 s.heading=angle;s.tick++;
 if(s.tick>=maxSteps){s.result='lost';s.deathAt=s.tick;return}
 if((word&32)&&s.tick>=s.dashAt){
  s.dashAt=s.tick+42;s.hurtAt=s.tick+9;s.lastDash=s.tick;
  for(let i=0;i<9;i++)walk(s,(dx||dy?dx/len:Math.cos(angle))*10,(dx||dy?dy/len:Math.sin(angle))*10);
 }
 if(dx||dy){
  const oldX=s.x,oldY=s.y;
  walk(s,dx/len*c.speed,dy/len*c.speed);
  if(s.x!==oldX||s.y!==oldY){s.walkFrame++;s.lastStep=s.tick}
  if(dx!==dy)s.face=dx-dy>0?1:-1;
 }
 if((word&16)&&s.tick>=s.shotAt){
  s.swing=s.tick;s.shotAt=s.tick+c.delay;s.attackAngle=angle;
  s.releaseAt=s.tick+(s.version===4?c.windup:0);
 }
 if(s.tick<=s.releaseAt+2)faceAngle(s,s.attackAngle);
 if(s.tick===s.releaseAt)releaseHero(s);
 if((word&64)&&s.tick>=s.spellAt){s.spellAt=s.tick+130;s.pulse=s.tick;burst(s,s.x,s.y,135,24+s.gear*4)}
 for(const g of s.guards)if(g.hp>0)advanceGuard(s,g);
 for(const b of s.shots){
  b.x+=b.vx;b.y+=b.vy;b.life--;
  if(!passable(b.x,b.y,1)){b.life=0;continue}
  if(b.type==='enemy'){
   if(Math.hypot(b.x-s.x,b.y-s.y)<16){hurt(s,b.power);b.life=0}
  }else for(const g of s.guards){
   if(g.hp>0&&Math.hypot(b.x-g.x,b.y-g.y)<(g.type==='boss'?31:20)){
    if(b.type==='mage')burst(s,b.x,b.y,82,b.power);
    else damageGuard(s,g,b.power);
    b.life=0;break;
   }
  }
 }
 s.deaths=s.deaths.filter(g=>s.tick-g.deathAt<18);
 for(const g of s.guards)if(g.hp<=0)s.deaths.push({...g,deathAt:s.tick});
 s.shots=s.shots.filter(b=>b.life>0);
 s.guards=s.guards.filter(g=>g.hp>0);
 s.bursts=s.bursts.filter(b=>s.tick-b.tick<13);
 for(const tr of s.traps)if((s.tick+tr.phase)%120>=91&&Math.hypot(s.x-tr.x,s.y-tr.y)<38)hurt(s,15);
 landmarks.forEach((l,i)=>{if(Math.hypot(s.x-l.x,s.y-l.y)<35)s.seals|=1<<i});
 if(!s.result&&s.seals===3&&!s.guards.length&&Math.hypot(s.x-treasure.x,s.y-treasure.y)<44)s.result='won';
}
