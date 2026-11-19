// Identical fixed steps run in the browser and during server-side replay.
export const training=['crawler','empty','empty','trap','empty','eye','empty','crawler','empty','empty','empty','trap','boss','empty','empty'];
export const costs={empty:0,crawler:1,trap:1,cultist:2,eye:2,boss:4};
export function validLayout(l){return Array.isArray(l)&&l.length===15&&l.every(t=>typeof t==='string'&&Object.hasOwn(costs,t))&&l.reduce((n,t)=>n+costs[t],0)<=12&&l.some(t=>t!=='empty')}
export const width=720,height=440,stepTime=1/30,maxSteps=30*180;
const positions=[[173,119],[540,119],[360,220],[173,321],[540,321]];
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
function enter(s){
 s.x=360;s.y=381;s.shots=[];s.traps=[];s.guards=[];
 s.layout.slice(s.room*5,s.room*5+5).forEach((type,i)=>{
 const [x,y]=positions[i];if(type==='trap')s.traps.push({x,y,phase:i*12});
 else if(type!=='empty'){const hp={crawler:25,eye:30,cultist:40,boss:88}[type];s.guards.push({x,y,type,hp,max:hp,next:40+i*7})}
 });}
export function startRaid(layout,gear){const s={layout,gear,room:0,tick:0,hp:100,result:null,heading:-Math.PI/2,shotAt:0,dashAt:0,spellAt:0,hurtAt:0,pulse:-100};enter(s);return s}
function bullet(s,x,y,a,speed,power,enemy){s.shots.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,power,enemy,life:100})}
function hurt(s,n){if(s.tick<s.hurtAt)return;s.hp=Math.max(0,s.hp-n);s.hurtAt=s.tick+20;if(!s.hp)s.result='lost'}
export function advance(s,word){
 if(s.result)return;
 const move=word&15,angle=(word>>7)*Math.PI/128;const dx=Number(!!(move&1))-Number(!!(move&2)),dy=Number(!!(move&4))-Number(!!(move&8));s.heading=angle;s.tick++;
 if(s.tick>=maxSteps){s.result='lost';return}
 const len=Math.hypot(dx,dy)||1;
 if((word&32)&&s.tick>=s.dashAt){s.dashAt=s.tick+48;s.hurtAt=s.tick+11;s.x+=(dx?dx/len:dy?0:Math.cos(angle))*80;s.y+=(dy?dy/len:dx?0:Math.sin(angle))*80}
 s.x=clamp(s.x+dx/len*5,20,width-20);s.y=clamp(s.y+dy/len*5,23,height-20);
 if((word&16)&&s.tick>=s.shotAt){bullet(s,s.x,s.y,angle,11,13+s.gear*3,false);s.shotAt=s.tick+8}
 if((word&64)&&s.tick>=s.spellAt){s.spellAt=s.tick+120;s.pulse=s.tick;for(const g of s.guards)if(Math.hypot(g.x-s.x,g.y-s.y)<130)g.hp-=26+s.gear*4}
 for(const g of s.guards){if(g.hp<=0)continue;const a=Math.atan2(s.y-g.y,s.x-g.x),d=Math.hypot(s.y-g.y,s.x-g.x);
 if(!['eye','cultist'].includes(g.type)||d>135){const speed=g.type==='crawler'?2.05:1.3;g.x+=Math.cos(a)*speed;g.y+=Math.sin(a)*speed}
 if(d<23)hurt(s,g.type==='boss'?18:9);
 if(g.type!=='crawler'&&s.tick>=g.next){g.next=s.tick+(g.type==='boss'?54:78);for(let i=0;i<(g.type==='boss'?5:1);i++)bullet(s,g.x,g.y,a+i*Math.PI*2/5,3.15,9,true)}}
 for(const b of s.shots){b.x+=b.vx;b.y+=b.vy;b.life--;
 if(b.enemy){if(Math.hypot(b.x-s.x,b.y-s.y)<14){hurt(s,b.power);b.life=0}}
 else for(const g of s.guards){if(g.hp>0&&Math.hypot(b.x-g.x,b.y-g.y)<(g.type==='boss'?29:19)){g.hp-=b.power;b.life=0;break}}}
 s.shots=s.shots.filter(b=>b.life>0&&b.x>0&&b.y>0&&b.x<width&&b.y<height);s.guards=s.guards.filter(g=>g.hp>0);
 for(const tr of s.traps)if((s.tick+tr.phase)%120>=91&&Math.hypot(s.x-tr.x,s.y-tr.y)<34)hurt(s,15);
 if(!s.result&&!s.guards.length&&Math.hypot(s.x-width/2,s.y-42)<36){if(s.room===2)s.result='won';else{s.room++;enter(s)}}
}
