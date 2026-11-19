// Wounds fray the puppet's red yarn. Samples are in world metres and keep their
// original position after they leave a sleeve, including on elevated walkways.
import {terrainHeight} from './terrain-height.js';
import {getKikalmoLook} from './kikalmo-avatar.js';
import {kikalmoShell} from './kikalmo-shell.js';

const yarn='#b62c48', light='#f17c83', wine='#731c3b';
const cap=64;
const point=(x,y,h)=>({x,y,h});
const strand=(points,width,color)=>({points,width,color});
const mix=(a,b,t)=>a+(b-a)*t;
function hash(id){
  let seed=2166136261;
  for(const c of String(id))seed=Math.imul(seed^c.charCodeAt(0),16777619);
  return seed>>>0;
}
function noise(n){const v=Math.sin(n*12.9898)*43758.5453;return v-Math.floor(v);}
function sleeve(e,time){
  const a=e.angle||0,c=Math.cos(a),s=Math.sin(a),rag=e.ragdoll,pose=rag?.rightShoulder;
  const blend=pose?rag.blend??1:0;
  const shoulder=.265,art=e.appearance&&getKikalmoLook(e.appearance,0)?.art;
  let back=-.15;
  if(art){
    // The linked one-piece outfits have different thicknesses at the shoulder.
    const {depth,dims,w,h}=kikalmoShell(art);
    const u=Math.max(0,Math.min(w-1,Math.round((.5-shoulder/dims.width)*(w-1))));
    const v=Math.max(0,Math.min(h-1,Math.round((1-(.82-dims.bottom)/dims.height)*(h-1))));
    back=-.83*depth[v*w+u]-.075;
  }
  const along=mix(back,pose?.[0]??0,blend),side=mix(shoulder,pose?.[2]??0,blend);
  const bob=e.moving ? .029*Math.sin((e.walk||0)*2) : .009*Math.sin(time*2);
  const restHeight=e.stunned||e.down ? .3 : .82+bob;
  const height=mix(restHeight,pose?.[1]??restHeight,blend);
  const base=terrainHeight(e.x,e.y);
  return {x:e.x+c*along-s*side,y:e.y+s*along+c*side,h:base+(e.lift||0)+height,
    floor:base+(e.supportHeight||0),elevated:(e.supportHeight||0)>.12,c,s};
}
function looseEnd(origin,severity,time){
  const {x,y,h,c,s}=origin,wiggle=.018*Math.sin(time*6);
  const knot=(forward,right,up)=>point(x+forward*c-right*s,y+forward*s+right*c,h+up);
  const p0=knot(.045,-.015,.055),p1=knot(-.055,.045,.014),p2=knot(-.095,.071,-.062);
  const p3=knot(-.092+wiggle,.087,-.15-.033*severity),p4=knot(-.06+wiggle,.092,-.19-.033*severity);
  return [strand([p0,p1,p2],.076,wine),strand([p1,p2,p3,p4],.053,yarn),
    strand([knot(-.063,.068,-.003),knot(-.082,.079,-.026)],.025,light)];
}

export function createBleedFibers(){
  const wounds=new Map(),drops=[];
  let time=0,epoch=0,serial=0;
  function begin(seconds,now){
    time=seconds;epoch=now;
    for(const [key,wound] of wounds)if(time-wound.seen>2)wounds.delete(key);
    while(drops.length&&time-drops[0].born>9)drops.shift();
  }
  function spawn(origin,seed,burst){
    const a=noise(seed)*6.283185,rad=(burst ? .48 : .035)+noise(seed+1)*(burst ? 1.25 : .12);
    const life=4.1+noise(seed+2)*1.6,vz=burst ? .59+noise(seed+3)*1.42 : -.24;
    const altitude=Math.max(.03,origin.h-origin.floor);
    const flight=(vz+Math.sqrt(vz*vz+2*8.4*altitude))/8.4;
    const vx=Math.cos(a)*rad,vy=Math.sin(a)*rad;
    const floor=origin.elevated?origin.floor:terrainHeight(origin.x+vx*flight,origin.y+vy*flight);
    if(drops.length>=cap)drops.shift();
    drops.push({id:'yarn/'+(++serial),x:origin.x,y:origin.y,h:origin.h,floor,born:time,
      vx,vy,vz,a,flight,life,size:.82+noise(seed+5)*.46,tint:noise(seed+4)<.42?wine:yarn});
  }
  function actor(e){
    const wound=e.bleeding,id=e.renderId||e.id;
    if(e.isCar||!wound||wound.until<=epoch||wound.at>epoch+100||!Number.isFinite(wound.at+wound.until))return null;
    const severity=Math.max(1,Math.min(3,Number(wound.severity)||1));
    let track=wounds.get(id);
    const origin=sleeve(e,time);
    if(!track||track.at!==wound.at){
      const seed=(hash(id)+(wound.at%65521))%65521;
      track={at:wound.at,seed,next:time+.12,seen:time,count:0};wounds.set(id,track);
      if(epoch-wound.at<500)for(let i=0;i<2+severity;i++)spawn(origin,seed+i*17,true);
    }
    track.seen=time;
    if(time>=track.next){
      spawn(origin,track.seed+53*(++track.count),false);
      track.next=time+(1.34-.21*severity)*(.84+.32*noise(track.seed+track.count));
    }
    return looseEnd(origin,severity,time);
  }
  function eachDrop(visit){
    for(const drop of drops){
      const age=time-drop.born,landed=age>=drop.flight,rest=age-drop.flight;
      if(rest>drop.life)continue;
      const t=Math.min(age,drop.flight),x=drop.x+drop.vx*t,y=drop.y+drop.vy*t;
      const h=landed?drop.floor+.080:drop.h+drop.vz*t-4.2*t*t;
      const fade=landed?Math.min(1,(drop.life-rest)*1.8):1;
      const size=drop.size*fade;if(size<.04)continue;
      const c=Math.cos(drop.a)*size,s=Math.sin(drop.a)*size;
      const loc=(u,v,z)=>point(x+u*c-v*s,y+u*s+v*c,h+z*size);
      const points=landed?[loc(-.135,-.016,0),loc(-.047,.028,.006),loc(.045,.038,.004),loc(.133,-.014,0)]:
        [loc(-.028,0,.065),loc(0,.016,.018),loc(.019,.011,-.026),loc(.012,0,-.071)];
      const highlight=landed?[loc(-.065,.024,.022),loc(-.022,.035,.023)]:
        [loc(-.012,.026,.027),loc(.001,.028,.005)];
      visit(drop.id,points[1],[strand(points,(landed ? .071 : .055)*size,drop.tint),strand(highlight,.025*size,light)]);
    }
  }
  return {begin,actor,eachDrop};
}
