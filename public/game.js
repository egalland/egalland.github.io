import { WORLD_W, WORLD_H, SPAWN, roads, objects, solidAt, drawWorld, drawMap } from './world.js';
import { drawActor, drawVehicle } from './sprites.js';

const TAU = Math.PI * 2;
const cap = (value, low, high) => Math.min(high, Math.max(low, value));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
const nearest = (array, v) => array.reduce((best, n) => Math.abs(n - v) < Math.abs(best - v) ? n : best);
const WEAPONS = {
  fist: { mag: Infinity, reload: 0, interval: .40, reach: 19, damage: 13, color: '#ffce91' },
  pistol: { mag: 12, reload: 1.05, interval: .29, reach: 155, damage: 19, color: '#ffd677' },
  smg: { mag: 28, reload: 1.45, interval: .15, reach: 132, damage: 12, color: '#ffad80' },
  shotgun: { mag: 5, reload: 1.55, interval: .72, reach: 96, damage: 13, color: '#ffc76a' },
  yarn: { mag: 6, reload: 1.24, interval: .57, reach: 121, damage: 15, color: '#f4a2e4' }
};
const CAR_COLORS = ['#c86991', '#4b9fa8', '#d58751', '#648ba9', '#b1a863', '#956fa3', '#bd646d', '#9db3ab'];
const PED_COLORS = ['#e7b16e', '#a6b7d0', '#c680a3', '#bca587', '#9abf9b', '#d89c73', '#c8b3ce', '#769cb6'];
const SERVICES = [
  { actor: 'police', car: 'police' }, { actor: 'medic', car: 'ambulance' },
  { actor: 'firefighter', car: 'firetruck' }, { actor: 'swat', car: 'swat' }
];
const seeded = n => { const f = Math.sin(n * 127.1 + 311.7) * 43758.5453; return f - Math.floor(f); };
const isTyping = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
function district(p) {
  if (Math.abs(p.x - SPAWN.x) < 255 && Math.abs(p.y - SPAWN.y) < 193) return 'Les Filatures';
  if (p.y < SPAWN.y) return p.x < SPAWN.x ? 'Les Bobines' : 'Parc Velours';
  return p.x < SPAWN.x ? 'Le Dépôt' : 'Les Ateliers';
}
function rectPatrol(x0, y0, x1, y1, distance, backwards = false) {
  const w = x1 - x0, h = y1 - y0, perimeter = 2 * (w + h);
  let d = ((distance % perimeter) + perimeter) % perimeter;
  if (backwards) d = (perimeter - d) % perimeter;
  let x, y, angle;
  if (d < w) { x = x0 + d; y = y0; angle = 0; }
  else if ((d -= w) < h) { x = x1; y = y0 + d; angle = Math.PI / 2; }
  else if ((d -= h) < w) { x = x1 - d; y = y1; angle = Math.PI; }
  else { d -= w; x = x0; y = y1 - d; angle = -Math.PI / 2; }
  return { x, y, angle: backwards ? angle + Math.PI : angle };
}
function createPopulation() {
  const pedestrians = [], traffic = [], parked = [];
  let serial = 0;
  for (let iy = 0; iy < roads.ys.length - 1; iy++) for (let ix = 0; ix < roads.xs.length - 1; ix++) {
    const xl = roads.xs[ix], xr = roads.xs[ix + 1], yt = roads.ys[iy], yb = roads.ys[iy + 1];
    const i = ++serial;
    for (let j = 0; j < 3; j++) {
      const n = i * 3 + j, gutter = roads.halfWidth + 5.5 + seeded(n) * 4;
      pedestrians.push({
        id: 'ped-' + n, type: (j === 1 && i % 5 === 0) ? SERVICES[i % 4].actor : 'pedestrian',
        variant: n % 8, color: PED_COLORS[n % 8], speed: 5.7 + seeded(n + 99) * 3.8,
        phase: Math.floor(seeded(n + 11) * 555), reverse: n % 3 === 0,
        box: [xl + gutter, yt + gutter, xr - gutter, yb - gutter]
      });
    }
    if (i % 2 === 0 || (ix === 2 && iy === 2)) {
      const isService = i % 6 === 0, service = SERVICES[(i / 6 - 1) % 4];
      const gutter = i % 3 === 0 ? -9 : 9;
      traffic.push({ id: 'traffic-' + i, type: isService ? service.car : 'car', color: CAR_COLORS[i % 8],
        phase: seeded(i + 65) * 990, speed: 14 + seeded(i + 35) * 9, reverse: gutter < 0,
        box: [xl + gutter, yt + gutter, xr - gutter, yb - gutter] });
    }
    if (i % 3 !== 0) parked.push({id: 'park-' + i, type: 'car', color: CAR_COLORS[(i * 5) % 8],
      x: xl + (xr - xl) * (.36 + seeded(i + 106) * .32), y: yt + roads.halfWidth - 9, angle: 0, moving: false});
  }
  parked.push({ id: 'car-accueil', type: 'car', color: '#e39176', x: SPAWN.x - 20, y: SPAWN.y - 10, angle: Math.PI, moving: false });
  return { pedestrians, traffic, parked };
}
function inCamera(o, camera, margin = 28) {
  return o.x + margin > camera.x && o.x - margin < camera.x + camera.w &&
    o.y + margin > camera.y && o.y - margin < camera.y + camera.h;
}
function collides(x, y, r = 3) {
  if (x < 5 + r || y < 5 + r || x > WORLD_W - 5 - r || y > WORLD_H - 5 - r) return true;
  return solidAt(x, y) || solidAt(x-r, y) || solidAt(x+r, y) || solidAt(x, y-r) || solidAt(x, y+r);
}
function pointAlong(x, y, a, distance) { return { x:x + Math.cos(a) * distance, y:y + Math.sin(a) * distance }; }

export function createGame({ canvas, minimap, net, onState = () => {}, onNotice = () => {} }) {
  const ctx = canvas.getContext('2d', {alpha:false});
  const population = createPopulation();
  const p = { x:SPAWN.x, y:SPAWN.y, angle:Math.PI / 2, walk:0, moving:false, type:'fox', health:100, wanted:0 };
  const camera = {x:0, y:0, w:0, h:0};
  const keys = new Set(), emotes = new Map(), peerViews = new Map(), destroyed = new Set();
  const npcStates = new Map(), vehicleStates = new Map(), incidents = new Map();
  const particles = [], trails = [];
  const ammo = Object.fromEntries(Object.entries(WEAPONS).map(([key,v]) => [key,v.mag]));
  const worldState = {destroyed};
  let activeActors = [], activeCars = [], remotes = [], car = null, speed = 0, weapon = 'pistol', reloadTime = 0;
  let stickX=0,stickY=0,aimX=0,aimY=0, fireHeld=false, sprintHeld=false, paused=false, sound=true, audio=null;
  let pointer = null, pointerFiring=false, lastPointer=0, cooldown=0, lastShotSent=0, lastHeat=0, heat=0;
  let invulnerable=0, hitFlash=0, shake=0, score=0, time=0, epoch=Date.now(), serverOffset=0;
  let clockSync=0, netTimer=0, worldTimer=0, hudTimer=0, mapTimer=0, lastHud='', cssW=0, cssH=0, zoom=2.2, alive=true;
  let frameId=0, lastFrame=performance.now(), lastInteract=0, nearVehicle=null, serviceCooldown=0, impactCooldown=0;
  let placedAtSpawn=false, driverHint=false;
  const publish = () => net?.publish?.({ x:p.x, y:p.y, angle:p.angle, moving:p.moving, type:'fox',
    health:Math.round(p.health), wanted:p.wanted, weapon, vehicle:car ? {...car,x:p.x,y:p.y,angle:p.angle,moving:Math.abs(speed)>1} : null });
  const emit = (type,data) => net?.emit?.(type,data);
  function tone(freq, duration=.09, waveform='triangle', volume=.045, endFreq=freq) {
    if (!sound || !audio || audio.state !== 'running') return;
    try { const osc=audio.createOscillator(), gain=audio.createGain(), t=audio.currentTime;
      osc.type=waveform; osc.frequency.setValueAtTime(freq,t); osc.frequency.exponentialRampToValueAtTime(Math.max(18,endFreq),t+duration);
      gain.gain.setValueAtTime(volume,t); gain.gain.exponentialRampToValueAtTime(.001,t+duration);
      osc.connect(gain); gain.connect(audio.destination); osc.start(t); osc.stop(t+duration+.01);
    } catch {}
  }
  function unlock() {
    if (!sound) return;
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); if (audio.state==='suspended') audio.resume().catch(()=>{}); } catch {}
  }
  function clearInput() { keys.clear(); fireHeld=false; pointerFiring=false; sprintHeld=false; stickX=stickY=aimX=aimY=0; }
  function syncClock() {
    const fromServer = net?.roomTime?.();
    serverOffset = Number.isFinite(fromServer) ? fromServer - Date.now() : 0;
  }
  function addBurst(x,y,color,count=9,force=17) {
    for(let i=0;i<count;i++){ const a=Math.random()*TAU, v=(.3+Math.random())*force;
      const life=.15 + Math.random()*.31;
      particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life,max:life,color,size:Math.random()>.6?2:1}); }
    if (particles.length>180) particles.splice(0,particles.length-180);
  }
  function registerCrime(points) {
    heat=cap(heat+points,0,5); p.wanted=Math.ceil(heat); lastHeat=epoch;
  }
  function startIncident(kind, x,y, level=p.wanted) {
    const id='dispatch-'+kind+'-'+(net?.id || 'local');
    const previous=incidents.get(id);
    if (previous && epoch - previous.started < 4500 && Math.hypot(x-previous.x,y-previous.y)<60) return;
    const data={id,kind,x,y,level,started:Math.round(epoch)};
    incidents.set(id,data); emit('npc',data);
  }
  function breakProp(object, crime=true) {
    if(destroyed.has(object.id))return;
    destroyed.add(object.id); emit('destroy',{id:object.id});
    addBurst(object.x,object.y,'#e8b98a',15,30); addBurst(object.x,object.y,'#a987ac',7,21);
    if(crime){score+=20; registerCrime(.30);startIncident('firefighter',object.x,object.y);startIncident('police',object.x,object.y);}
  }
  function stunActor(actor) {
    if(actor.stunned) return;
    const data = {id:actor.id,x:actor.x,y:actor.y,stunnedUntil:Math.round(epoch+17000)};
    npcStates.set(actor.id,data);emit('npc',data); actor.stunned=true;
    registerCrime(actor.type==='police'||actor.type==='swat'?1.15:.70);
    startIncident('medic',actor.x,actor.y); startIncident('police',actor.x,actor.y);
    if(p.wanted>=3)startIncident('swat',actor.x,actor.y);
    addBurst(actor.x,actor.y,'#eab4e1',10,24);score+=10;
  }
  function updatePeers() {
    const list=net?.peers?.()||[], ids=new Set();
    if(!placedAtSpawn && net?.status==='online') {
      placedAtSpawn=true;
      const arrival=(net.players?.()||[]).findIndex(member=>member.id===net.id);
      if(arrival>0 && !car && dist(p,SPAWN)<3) {
        const offsets=[[9,12],[19,0],[-9,13],[-5,-15],[19,15],[-16,19],[15,-16],[28,8],[-18,-13],[0,24],[-28,4],[28,-5],[25,26],[0,-27],[-17,28]];
        const candidates=offsets.map((_,i)=>offsets[(i+arrival-1)%offsets.length]).map(([x,y])=>({x:SPAWN.x+x,y:SPAWN.y+y}));
        const spot=candidates.find(candidate=>!collides(candidate.x,candidate.y) && list.every(peer=>dist(candidate,peer)>11));
        if(spot){p.x=spot.x;p.y=spot.y;publish();}
      }
    }
    for(const data of list){
      if(data.id===net?.id || !Number.isFinite(data.x) || !Number.isFinite(data.y)) continue;
      ids.add(data.id);
      const v=peerViews.get(data.id)||{x:data.x,y:data.y,angle:data.angle||0,walk:0};
      v.data=data; peerViews.set(data.id,v);
    }
    for(const id of peerViews.keys())if(!ids.has(id))peerViews.delete(id);
    const shared=net?.world?.() || {};
    for(const id of shared.destroyed||[])destroyed.add(id);
    for(const [id,item] of Object.entries(shared.npcs||{})){
      if(!item)continue;
      if (item.kind && item.started) { if((incidents.get(id)?.started||0)<item.started)incidents.set(id,item); }
      else if ((npcStates.get(id)?.stunnedUntil||0)<item.stunnedUntil)npcStates.set(id,item);
    }
    for(const [id,item] of Object.entries(shared.vehicles||{})){
      if (!item || !Number.isFinite(item.x)) continue;
      const current=vehicleStates.get(id);
      if(current && current.localUntil > epoch)continue;
      vehicleStates.set(id,item);
    }
  }
  function makePopulation() {
    const t=epoch/1000;
    activeCars=[];activeActors=[];remotes=[];
    for(const [id,v] of peerViews) {
      const d=v.data;
      remotes.push({...d,id,x:v.x,y:v.y,angle:v.angle,type:'fox',walk:v.walk});
    }
    const carried=new Set(remotes.filter(a=>a.vehicle?.id).map(a=>a.vehicle.id));
    if(car)carried.add(car.id);
    const addCar = c => {
      if(carried.has(c.id))return;
      const item=vehicleStates.get(c.id);
      if(item?.owner && peerViews.has(item.owner) && item.occupied!==false) return;
      activeCars.push(item && Number.isFinite(item.x) ? {...c,...item,id:c.id,moving:false} : c);
    };
    for(const c of population.parked)addCar(c);
    for(const c of population.traffic)addCar({...c,...rectPatrol(...c.box,t*c.speed+c.phase,c.reverse),moving:true});
    for(const a of population.pedestrians) {
      const st=npcStates.get(a.id), isDown=!!st && st.stunnedUntil>epoch;
      const loc=isDown&&Number.isFinite(st.x) ? {x:st.x,y:st.y,angle:0} : rectPatrol(...a.box,t*a.speed+a.phase,a.reverse);
      activeActors.push({...a,...loc,stunned:isDown,moving:!isDown,walk:t*a.speed*.55+a.phase});
    }
    for(const [id,inc] of incidents) {
      const age=(epoch-inc.started)/1000;
      if(age>23){incidents.delete(id);continue;} if(age<0)continue;
      const service=SERVICES.find(s=>s.actor===inc.kind);if(!service)continue;
      const x=cap(inc.x,24,WORLD_W-24),y=cap(inc.y,24,WORLD_H-24);
      const gx=nearest(roads.xs,x),gy=nearest(roads.ys,y),vertical=Math.abs(gx-x)<Math.abs(gy-y);
      const offset = service.actor==='police'?8:service.actor==='swat'?-8:service.actor==='medic'?15:-15;
      const sx=vertical?gx+offset:x,sy=vertical?y:gy+offset;
      const side = (service.actor==='medic' || service.actor==='swat') ? -1:1;
      const shift = age<4 ? (4-age)*28 : age>19 ? -(age-19)*28 : 0;
      const park={x:cap(sx+(vertical?0:shift*side),8,WORLD_W-8),y:cap(sy+(vertical?shift*side:0),8,WORLD_H-8)};
      const a=vertical ? (side===1?-Math.PI/2:Math.PI/2) : (side===1?Math.PI:0);
      addCar({id:id+'-car',type:service.car,color:'#72859a',...park,angle:a,moving:Math.abs(shift)>0,siren:true});
      if(age<4||age>19)continue;
      let target={x,y};
      if(service.actor==='police'||service.actor==='swat'){
        const suspects=[p,...remotes].filter(q=>q.wanted>0 && Math.hypot(q.x-x,q.y-y)<92);
        if(suspects.length)target=suspects.sort((a,b)=>dist(a,park)-dist(b,park))[0];
      }
      const ox=vertical?8:0, oy=vertical?0:8;
      const actorOrigin={x:park.x+ox,y:park.y+oy};
      const distance=dist(actorOrigin,target)||1;
      const fraction=cap(Math.min(age-4,19-age)*11/distance,0,1);
      let px=actorOrigin.x+(target.x-actorOrigin.x)*fraction,py=actorOrigin.y+(target.y-actorOrigin.y)*fraction;
      if(collides(px,py,2)) {px=actorOrigin.x;py=actorOrigin.y;}
      const st=npcStates.get(id+'-unit'),down=st&&st.stunnedUntil>epoch;
      activeActors.push({id:id+'-unit',type:service.actor,x:down?st.x:px,y:down?st.y:py,
        moving:fraction<1&&!down,walk:t*7,angle:Math.atan2(target.y-py,target.x-px),stunned:!!down,dispatched:true});
    }
  }
  function interpolate(dt) {
    const k=1-Math.exp(-15*dt);
    for(const v of peerViews.values()) {
      const d=v.data;
      if(Math.hypot(d.x-v.x,d.y-v.y)>100){v.x=d.x;v.y=d.y;}
      else {v.x+=(d.x-v.x)*k;v.y+=(d.y-v.y)*k;}
      v.angle=wrapAngle(v.angle+wrapAngle((d.angle||0)-v.angle)*k);
      if(d.moving)v.walk+=dt*(d.vehicle?6:10);
    }
  }
  function dropCar(denied=false) {
    if (!car)return;
    if(!denied){
      const state={...car,x:p.x,y:p.y,angle:p.angle,occupied:false,owner:null,moving:false};
      vehicleStates.set(car.id,{...state,localUntil:epoch+2000});emit('vehicle',state);
    }
    const offsets = [Math.PI/2,-Math.PI/2,Math.PI,0];
    const spot=offsets.map(a=>pointAlong(p.x,p.y,p.angle+a,16)).find(q=>!collides(q.x,q.y,3));
    if(spot){p.x=spot.x;p.y=spot.y;}
    car=null;speed=0;p.moving=false; publish();
  }
  function interact() {
    if(paused || (performance.now()-lastInteract<180))return;
    unlock();lastInteract=performance.now();
    if(car){dropCar();tone(170,.1,'triangle');return;}
    const options=activeCars.filter(c=>dist(p,c)<35).sort((a,b)=>dist(p,a)-dist(p,b));
    if(!options.length){onNotice('Approche-toi d’un véhicule pour monter.');return;}
    const v=options[0];
    car={id:v.id,type:v.type,color:v.color||'#758eac'};
    p.x=v.x;p.y=v.y;p.angle=v.angle;speed=0;
    const state={...car,x:p.x,y:p.y,angle:p.angle,occupied:true,owner:net?.id||'local'};
    vehicleStates.set(car.id,{...state,localUntil:epoch+2000}); emit('vehicle',state);publish();
    if(v.moving || ['police','swat','ambulance','firetruck'].includes(v.type)){registerCrime(.75);startIncident('police',p.x,p.y);}
    tone(106,.16,'triangle',.055,190);
    if(!driverHint){driverHint=true;onNotice('Au volant ! Avance pour accélérer, tourne pour braquer.');}
  }
  function damage(amount) {
    if(invulnerable>0 || amount<=0) return;
    p.health=cap(p.health-amount,0,100);invulnerable=.55;hitFlash=.25;shake=1.25;
    tone(140,.12,'triangle',.06,66);
    if(p.health>0)return;
    dropCar(); p.x=SPAWN.x;p.y=SPAWN.y;heat=0;p.wanted=0;p.health=100;speed=0;
    invulnerable=4;clearInput();pointer=null;camera.x=p.x-camera.w/2;camera.y=p.y-camera.h/2;
    onNotice('Les ambulanciers t’ont remis sur pied aux Filatures.'); publish();
  }
  function selectWeapon(kind) {
    if(!WEAPONS[kind]||weapon===kind)return;
    unlock();weapon=kind;reloadTime=0;cooldown=.13;fireHeld=false;pointerFiring=false;
    tone(450,.045,'triangle',.028);sendHud(true);
  }
  function reload() {
    if(reloadTime||!Number.isFinite(WEAPONS[weapon].mag)||ammo[weapon]===WEAPONS[weapon].mag)return;
    reloadTime=WEAPONS[weapon].reload;tone(345,.07,'square',.014,205);
  }
  function traceShot(origin,a,range) {
    const dx=Math.cos(a),dy=Math.sin(a);
    const candidates=[];
    for(const o of objects)if(!destroyed.has(o.id) && Math.abs(o.x-origin.x)<range+12 && Math.abs(o.y-origin.y)<range+12)
      candidates.push({item:o,kind:'prop',r:Math.max(4,o.r||5)});
    for(const n of activeActors)if(!n.stunned && Math.abs(n.x-origin.x)<range+8 && Math.abs(n.y-origin.y)<range+8)
      candidates.push({item:n,kind:'npc',r:6.7});
    for(const peer of remotes)if(Math.abs(peer.x-origin.x)<range+12 && Math.abs(peer.y-origin.y)<range+12)
      candidates.push({item:peer,kind:'peer',r:peer.vehicle?10:6.9});
    let nearestHit=null, length=range;
    for(const c of candidates){
      const vx=c.item.x-origin.x,vy=c.item.y-origin.y;
      const along=vx*dx+vy*dy,side=Math.abs(vx*dy-vy*dx);
      if(along<0||side>c.r)continue;
      const entry=Math.max(0,along-Math.sqrt(c.r*c.r-side*side));
      if(entry<=length){length=entry;nearestHit=c;}
    }
    for(let s=4;s<length;s+=4){const q=pointAlong(origin.x,origin.y,a,s);if(solidAt(q.x,q.y)){
      length=s;nearestHit=null;break;
    }}
    return {length,hit:nearestHit};
  }
  function fire() {
    if(paused||cooldown>0||reloadTime>0)return;
    if(ammo[weapon]<=0){reload();return;}
    const w=WEAPONS[weapon];cooldown=w.interval;ammo[weapon]--;
    const isMelee=weapon==='fist';const a=p.angle,origin=pointAlong(p.x,p.y,a,car?12:4);
    if(!isMelee){shake=Math.max(shake,weapon==='shotgun'?1.3:.5);tone(weapon==='yarn'?365:132,weapon==='smg'?.055:.11,weapon==='yarn'?'sine':'sawtooth',.034,weapon==='yarn'?175:38);}
    else tone(180,.08,'triangle',.04,115);
    let centerLength=w.reach;
    for(const off of weapon==='shotgun'?[0,-.104,.104]:[0]){
      const hitAngle=a+off;const {length,hit}=traceShot(origin,hitAngle,w.reach);
      const end=pointAlong(origin.x,origin.y,hitAngle,length);if(!off)centerLength=length;
      trails.push({x:origin.x,y:origin.y,ex:end.x,ey:end.y,kind:weapon,life:weapon==='yarn'?.28:isMelee?.14:.10,color:w.color});
      if(!hit){if(length<w.reach)addBurst(end.x,end.y,w.color,4);continue;}
      if(hit.kind==='prop')breakProp(hit.item);
      if(hit.kind==='npc')stunActor(hit.item);
      if(hit.kind==='peer'){emit('hit',{target:hit.item.id,damage:w.damage});registerCrime(.45);startIncident('police',p.x,p.y);}
      addBurst(end.x,end.y,w.color,5);
    }
    if(!isMelee && epoch-lastShotSent>=240 || isMelee){
      emit('shot',{x:origin.x,y:origin.y,angle:a,kind:weapon,length:centerLength});lastShotSent=epoch;
    }
    if(!isMelee && epoch-lastHeat>4200){registerCrime(.14);startIncident('police',p.x,p.y);}
    if(!ammo[weapon])reload();
  }
  function movePlayer(dt) {
    const held=(...list)=>list.some(k=>keys.has(k));
    let dx=paused?0:stickX+(held('d','arrowright')?1:0)-(held('a','q','arrowleft')?1:0);
    let dy=paused?0:stickY+(held('s','arrowdown')?1:0)-(held('w','z','arrowup')?1:0);
    const mag=Math.hypot(dx,dy);if(mag>1){dx/=mag;dy/=mag;}
    p.moving=false;
    if(car){
      const accel=-dy;
      if(Math.abs(accel)>.07)speed+=accel*(Math.sign(accel)===Math.sign(speed)||Math.abs(speed)<1?65:110)*dt;
      else speed*=Math.exp(-1.35*dt);
      speed=cap(speed,-34,98);
      if(Math.abs(speed)<.6)speed=0;
      const turn=dx*2.55*cap(Math.abs(speed)/21,0,1)*Math.sign(speed);
      p.angle=wrapAngle(p.angle+turn*dt);
      const q=pointAlong(p.x,p.y,p.angle,speed*dt);
      const after=pointAlong(q.x,q.y,p.angle,Math.sign(speed)*12);
      if(!collides(q.x,q.y,7)&&!collides(after.x,after.y,5)){
        p.x=q.x;p.y=q.y;
      } else if(Math.abs(speed)>3){
        if(Math.abs(speed)>38 && impactCooldown<=0){damage(5);addBurst(after.x,after.y,'#ffc493');impactCooldown=.65;}
        speed*=-.24;
      }
      p.moving=Math.abs(speed)>1;
      if(Math.abs(speed)>14){
        for(const o of objects)if(!destroyed.has(o.id)&&Math.abs(o.x-p.x)<17&&Math.abs(o.y-p.y)<17&&dist(o,p)<(o.r||5)+10)breakProp(o);
        if(impactCooldown<=0){
          const hit=activeActors.find(a=>!a.stunned&&Math.abs(a.x-p.x)<13&&Math.abs(a.y-p.y)<13&&dist(a,p)<12);
          if(hit){stunActor(hit);speed*=.75;impactCooldown=.6;}
          else {
            const other=activeCars.find(c=>Math.abs(c.x-p.x)<19&&Math.abs(c.y-p.y)<19&&dist(c,p)<16);
            if(other){const impact=Math.abs(speed);speed*=-.36;impactCooldown=.8;shake=.75;if(impact>56)damage(4);}
          }
        }
      }
    } else {
      if(mag>.035){
        const walkingSpeed=(sprintHeld||held('shift')?64:41), vx=dx*walkingSpeed*dt,vy=dy*walkingSpeed*dt;
        if(!collides(p.x+vx,p.y))p.x+=vx;
        if(!collides(p.x,p.y+vy))p.y+=vy;
        p.walk+=Math.hypot(vx,vy)*.32;p.moving=true;
        if((!pointer||performance.now()-lastPointer>1800)&&Math.hypot(aimX,aimY)<.14)p.angle=Math.atan2(dy,dx);
      }
      if(!paused&&Math.hypot(aimX,aimY)>.14)p.angle=Math.atan2(aimY,aimX);
      else if(!paused&&pointer&&(pointerFiring||performance.now()-lastPointer<1800)){
        const angle=Math.atan2(camera.y+pointer.y*camera.h-p.y,camera.x+pointer.x*camera.w-p.x);
        if(Number.isFinite(angle))p.angle=angle;
      }
    }
    if(!paused && (fireHeld||pointerFiring||held(' ')))fire();
  }
  function simulate(dt) {
    time+=dt;epoch=Date.now()+serverOffset;clockSync-=dt;
    if(clockSync<=0){syncClock();clockSync=3;}
    cooldown=Math.max(0,cooldown-dt); invulnerable=Math.max(0,invulnerable-dt);hitFlash=Math.max(0,hitFlash-dt);
    shake=Math.max(0,shake-dt*4); impactCooldown=Math.max(0,impactCooldown-dt); serviceCooldown=Math.max(0,serviceCooldown-dt);
    if(reloadTime>0){reloadTime-=dt;if(reloadTime<=0){reloadTime=0;ammo[weapon]=WEAPONS[weapon].mag;tone(545,.06,'triangle',.024);}}
    if(heat>0 && epoch-lastHeat>23000){heat=Math.max(0,heat-dt*.07);p.wanted=Math.ceil(heat);}
    if(p.health<100 && !p.wanted && !invulnerable)p.health=Math.min(100,p.health+dt*.55);
    worldTimer-=dt;
    if(worldTimer<=0){updatePeers();worldTimer=.13;}
    interpolate(dt);makePopulation();movePlayer(dt);
    if(!car && serviceCooldown<=0){
      for(const n of activeActors) {
        if(n.stunned||Math.abs(n.x-p.x)>14||Math.abs(n.y-p.y)>14||dist(n,p)>13)continue;
        if(p.wanted && (n.type==='police'||n.type==='swat')){damage(n.type==='swat'?12:8);serviceCooldown=1.3;break;}
        if(n.type==='medic' && p.health<96){p.health=Math.min(100,p.health+16);serviceCooldown=4;addBurst(p.x,p.y,'#94e2bd',5);break;}
      }
    }
    if(!car && p.wanted>=3 && serviceCooldown<=0 && ![...incidents.values()].some(i=>i.kind==='swat'&&epoch-i.started<16500))
      startIncident('swat',p.x,p.y);
    for(const f of particles){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=Math.exp(-2*dt);f.vy+=(13-f.vy*2)*dt;f.life-=dt;}
    for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);
    for(let i=trails.length-1;i>=0;i--){trails[i].life-=dt;if(trails[i].life<=0)trails.splice(i,1);}
    for(const [id,e] of emotes)if(e.until<epoch)emotes.delete(id);
    nearVehicle=null;
    if(!car){
      let best=35;
      for(const v of activeCars){const d=dist(p,v);if(d<best){best=d;nearVehicle=v;}}
    }
    netTimer-=dt;if(netTimer<=0){publish();netTimer=.115;}
    hudTimer-=dt;if(hudTimer<=0){sendHud();hudTimer=.12;}
  }
  function sendHud(force=false) {
    const state={health:Math.ceil(p.health),wanted:p.wanted,weapon,ammo:Number.isFinite(ammo[weapon])?ammo[weapon]:'∞',
      maxAmmo:Number.isFinite(WEAPONS[weapon].mag)?WEAPONS[weapon].mag:'∞',district:district(p),
      inVehicle:!!car,nearVehicle:!!nearVehicle,speed:Math.round(Math.abs(speed)*1.25),score,reloading:reloadTime>0};
    const signature=JSON.stringify(state);if(force||signature!==lastHud){lastHud=signature;onState(state);}
  }
  function resize(){
    const bounds=canvas.getBoundingClientRect();
    if(cssW===bounds.width&&cssH===bounds.height&&cssW>0)return;
    cssW=bounds.width||window.innerWidth;cssH=bounds.height||window.innerHeight;
    zoom = cssW<520?1.87:cssW<850?2.05:2.35;
    camera.w=Math.max(1,Math.round(cssW/zoom));camera.h=Math.max(1,Math.round(cssH/zoom));
    canvas.width=camera.w;canvas.height=camera.h;ctx.imageSmoothingEnabled=false;
    camera.x=cap(p.x-camera.w*.5,0,Math.max(0,WORLD_W-camera.w));
    camera.y=cap(p.y-camera.h*.5,0,Math.max(0,WORLD_H-camera.h));
  }
  function marker(c,x,y,color,phase,compact=false) {
    c.save();c.translate(Math.round(x),Math.round(y));c.lineWidth=1;
    c.strokeStyle=color;c.globalAlpha=.53+.12*Math.sin(phase*2.2);
    c.beginPath();c.ellipse(0,compact?1:5,compact?4:13,compact?3:6,0,0,TAU);c.stroke();c.restore();
  }
  function label(o,text,color) {
    if(!text)return;
    ctx.save();ctx.font='bold 5px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    const val=String(text).slice(0,18),xx=Math.round(o.x),yy=Math.round(o.y-(o.vehicle?21:20));
    const w=Math.ceil(ctx.measureText(val).width)+7;
    ctx.fillStyle='#282336';ctx.fillRect(xx-Math.floor(w/2),yy-4,w,8);
    ctx.fillStyle=color;ctx.fillText(val,xx,yy+.3);
    ctx.fillRect(xx-1,yy+5,3,1);ctx.fillRect(xx,yy+6,1,1);ctx.restore();
  }
  function emoji(o,id) {
    const e=emotes.get(id);if(!e||e.until<epoch)return;
    const x=Math.round(o.x+15),y=Math.round(o.y-22-Math.sin(time*3)*.7);
    ctx.save();ctx.fillStyle='#f4e8ed';ctx.strokeStyle='#44344e';ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(x-8,y-8,17,14,4);ctx.fill();ctx.stroke();
    ctx.fillRect(x-4,y+5,3,3);ctx.font='10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.symbol,x+.5,y-.5);ctx.restore();
  }
  function render(dt) {
    resize();
    const look=car?cap(speed*.18,-6,15):0;
    const targetX=cap(p.x+Math.cos(p.angle)*look-camera.w*.5,0,Math.max(0,WORLD_W-camera.w));
    const targetY=cap(p.y+Math.sin(p.angle)*look-camera.h*.5,0,Math.max(0,WORLD_H-camera.h));
    camera.x+=(targetX-camera.x)*(1-Math.exp(-7*dt));camera.y+=(targetY-camera.y)*(1-Math.exp(-7*dt));
    const ox=Math.round(camera.x+(shake?Math.sin(time*98)*shake:0)),oy=Math.round(camera.y+(shake?Math.cos(time*100)*shake:0));
    ctx.setTransform(1,0,0,1,-ox,-oy);ctx.imageSmoothingEnabled=false;drawWorld(ctx,{...camera,x:ox,y:oy},worldState,time);
    const entities=[];
    for(const c of activeCars)if(inCamera(c,camera,60))entities.push({obj:c,vehicle:true});
    for(const n of activeActors)if(inCamera(n,camera))entities.push({obj:n});
    for(const r of remotes)if(inCamera(r,camera,50))entities.push({obj:r.vehicle?{...r.vehicle,x:r.x,y:r.y,angle:r.angle}:r,vehicle:!!r.vehicle,peer:r});
    entities.push({obj:car?{...car,x:p.x,y:p.y,angle:p.angle}:p,vehicle:!!car,player:true});
    entities.sort((a,b)=>a.obj.y-b.obj.y);
    for(const entry of entities){
      const {obj,vehicle,player,peer}=entry;
      if(player||peer)marker(ctx,obj.x,obj.y,player?'#96f1df':'#ff9fcd',time);
      if(player && invulnerable>.01 && Math.floor(invulnerable*12)%2===1)ctx.globalAlpha=.65;
      if(vehicle)drawVehicle(ctx,obj,time);
      else if(obj.stunned){
        ctx.save();ctx.translate(obj.x,obj.y);ctx.rotate(-.90);drawActor(ctx,{...obj,x:0,y:0,moving:false},time);ctx.restore();
        ctx.fillStyle='#ffd982';const xx=Math.round(obj.x),yy=Math.round(obj.y-10);ctx.fillRect(xx-4,yy,2,1);ctx.fillRect(xx+1,yy-2,2,2);
      } else drawActor(ctx,obj,time);
      ctx.globalAlpha=1;
    }
    for(const s of trails){
      ctx.save();ctx.strokeStyle=s.color;ctx.lineWidth=1;ctx.globalAlpha=Math.min(1,s.life*9);ctx.beginPath();
      if(s.kind==='fist'){
        const a=Math.atan2(s.ey-s.y,s.ex-s.x);ctx.arc(s.x,s.y,12,a-.6,a+.6);
      } else if(s.kind==='yarn'){
        const dx=s.ex-s.x,dy=s.ey-s.y,l=Math.hypot(dx,dy)||1;ctx.moveTo(s.x,s.y);
        for(let n=1;n<=20;n++){const f=n/20,w=Math.sin(f*Math.PI*8+time*13)*Math.sin(f*Math.PI)*3;ctx.lineTo(s.x+dx*f-dy/l*w,s.y+dy*f+dx/l*w);}
      } else {ctx.moveTo(s.x,s.y);ctx.lineTo(s.ex,s.ey);}
      ctx.stroke();ctx.restore();
    }
    for(const f of particles){ctx.globalAlpha=Math.min(1,f.life*6);ctx.fillStyle=f.color;ctx.fillRect(Math.round(f.x),Math.round(f.y),f.size,f.size);}
    ctx.globalAlpha=1;
    label({...p,vehicle:car},'VOUS','#98f1dd');
    for(const r of remotes)if(inCamera(r,camera)){label(r,r.name,'#f6aad4');emoji(r,r.id);}
    emoji(p,net?.id||'self');
    ctx.setTransform(1,0,0,1,0,0);
    if(hitFlash>0){ctx.fillStyle='rgba(227,112,142,'+(hitFlash*.38)+')';ctx.fillRect(0,0,canvas.width,canvas.height);}
    mapTimer-=dt;if(mapTimer<=0){paintMap(minimap,false);mapTimer=.13;}
  }
  function paintMap(target,full) {
    if(!target)return;
    const rect=target.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(target.width!==w||target.height!==h){target.width=w;target.height=h;}
    const c=target.getContext('2d');
    c.setTransform(1,0,0,1,0,0);c.fillStyle='#252636';c.fillRect(0,0,w,h);c.imageSmoothingEnabled=false;
    const scale=full?Math.min(w/WORLD_W,h/WORLD_H):Math.max(w/400,h/235);
    const dw=WORLD_W*scale,dh=WORLD_H*scale;
    const x=full?(w-dw)/2:cap(w*.5-p.x*scale,Math.min(w-dw,0),0);
    const y=full?(h-dh)/2:cap(h*.5-p.y*scale,Math.min(h-dh,0),0);
    drawMap(c,x,y,dw,dh,worldState);
    const at=o=>[x+o.x*scale,y+o.y*scale];
    for(const v of activeCars){const [vx,vy]=at(v),s=Math.max(1,scale*3.8);
      if(vx<0||vx>w||vy<0||vy>h)continue;
      c.fillStyle='#c8c2b7';c.fillRect(Math.round(vx-s),Math.round(vy-s/2),Math.max(2,s*2),Math.max(1,s));}
    for(const r of remotes){const [rx,ry]=at(r);c.fillStyle='#252133';c.beginPath();c.arc(rx,ry,4.3*dpr,0,TAU);c.fill();
      c.fillStyle='#ff9acb';c.beginPath();c.arc(rx,ry,3*dpr,0,TAU);c.fill();}
    const [px,py]=at(p);
    c.save();c.translate(px,py);c.rotate(p.angle);c.scale(dpr,dpr);
    c.fillStyle='#8cf8dd';c.strokeStyle='#25313b';c.lineWidth=1.5;
    c.beginPath();c.moveTo(7,0);c.lineTo(-4.5,4.3);c.lineTo(-2.5,0);c.lineTo(-4.5,-4.3);c.closePath();c.fill();c.stroke();c.restore();
  }
  function emote(symbol) {
    if(!symbol)return;
    const val=String(symbol).slice(0,12);emotes.set(net?.id||'self',{symbol:val,until:epoch+3400});
    emit('emote',{symbol:val});tone(625,.09,'sine',.028,770);
  }
  function action(name,pressed=true) {
    if(!pressed){if(name==='fire'||name==='shoot')fireHeld=false;if(name==='sprint')sprintHeld=false;return;}
    if(paused)return;
    unlock();
    if(name==='fire'||name==='shoot'){fireHeld=true;fire();}
    if(name==='sprint')sprintHeld=true;
    if(['vehicle','drive','interact','use','enter'].includes(name))interact();
    if(name==='reload')reload();
  }
  function setPaused(value) {paused=Boolean(value);if(paused)clearInput();}
  function onKeyDown(e){
    if(paused || isTyping(e.target) || e.altKey || e.metaKey || e.ctrlKey)return;
    const key=e.key.toLowerCase();
    if(key==='e' && !e.repeat){e.preventDefault();interact();return;}
    if(key==='r' && !e.repeat){reload();return;}
    if(!['arrowleft','arrowright','arrowup','arrowdown','a','q','s','d','z','w',' ','shift'].includes(key))return;
    if(key===' ' && e.target?.closest?.('button'))return;
    e.preventDefault();if(!e.repeat)unlock();keys.add(key);
  }
  function onKeyUp(e){keys.delete(e.key.toLowerCase());}
  function getPointer(e){
    const r=canvas.getBoundingClientRect();
    if(!r.width||!r.height)return;
    pointer={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};lastPointer=performance.now();
  }
  function pointerDown(e){
    if(e.button!==0||paused)return;
    e.preventDefault();canvas.focus({preventScroll:true});unlock();getPointer(e);pointerFiring=true;
    if(!car && pointer)p.angle=Math.atan2(camera.y+pointer.y*camera.h-p.y,camera.x+pointer.x*camera.w-p.x);
    fire();canvas.setPointerCapture?.(e.pointerId);
  }
  function pointerMove(e){if(!paused && (e.pointerType!=='touch'||pointerFiring))getPointer(e);}
  function pointerUp(e){pointerFiring=false;if(e.pointerType==='touch')pointer=null;}
  function preventMenu(e){e.preventDefault();}
  function visibility(){if(document.hidden)clearInput();else{lastFrame=performance.now();worldTimer=0;}}
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',visibility);canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);
  canvas.addEventListener('contextmenu',preventMenu);
  const unsubEvent=net?.onEvent?.(e=>{
    const d=e.data||{};
    if(e.type==='destroy'&&d.id){const o=objects.find(o=>o.id===d.id);if(o && !destroyed.has(d.id))addBurst(o.x,o.y,'#d9a282');destroyed.add(d.id);}
    if(e.type==='vehicleDenied'&&car?.id===d.id){dropCar(true);onNotice('Un autre joueur vient de prendre ce véhicule.');}
    if(e.type==='vehicle'&&d.id){vehicleStates.set(d.id,d);}
    if(e.type==='npc'&&d.id){if(d.kind&&d.started)incidents.set(d.id,d);else if(d.stunnedUntil)npcStates.set(d.id,d);}
    if(e.type==='hit'&&d.target===net?.id)damage(cap(Number(d.damage)||0,0,35));
    if(e.type==='emote'&&d.symbol)emotes.set(e.player,{symbol:String(d.symbol).slice(0,12),until:epoch+3200});
    if(e.type==='shot'&&Number.isFinite(d.x)&&Number.isFinite(d.angle)){
      const spec=WEAPONS[d.kind]||WEAPONS.pistol, q=pointAlong(d.x,d.y,d.angle,cap(Number(d.length)||spec.reach,2,spec.reach));
      trails.push({x:d.x,y:d.y,ex:q.x,ey:q.y,color:spec.color,kind:d.kind,life:d.kind==='yarn'?.28:.12});
    }
  });
  const unsubReset=net?.onReset?.(()=>{
    placedAtSpawn=false;destroyed.clear();npcStates.clear();vehicleStates.clear();incidents.clear();emotes.clear();peerViews.clear();
    activeActors=[];activeCars=[];remotes=[];particles.length=trails.length=0;car=null;speed=heat=p.wanted=0;
    p.x=SPAWN.x;p.y=SPAWN.y;p.health=100;p.moving=false;worldTimer=0;netTimer=0;lastHeat=0;
    clearInput();resize();sendHud(true);
  });
  function frame(t){
    if(!alive)return;
    const dt=cap((t-lastFrame)/1000,0,.06);lastFrame=t;
    simulate(dt);render(dt);frameId=requestAnimationFrame(frame);
  }
  syncClock();resize();updatePeers();makePopulation();render(0);publish();sendHud(true);frameId=requestAnimationFrame(frame);
  return { selectWeapon,action,emote,setPaused,
    setMove(x,y){stickX=cap(Number(x)||0,-1,1);stickY=cap(Number(y)||0,-1,1);if(stickX||stickY)unlock();},
    setAim(x,y){aimX=cap(Number(x)||0,-1,1);aimY=cap(Number(y)||0,-1,1);},
    setSound(value){sound=!!value;if(sound)unlock();},
    getPosition(){return {x:p.x,y:p.y,angle:p.angle,district:district(p)};},
    drawFullMap(target){paintMap(target,true);},
    destroy(){alive=false;cancelAnimationFrame(frameId);clearInput();if(typeof unsubEvent==='function')unsubEvent();if(typeof unsubReset==='function')unsubReset();
      window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',clearInput);
      document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',pointerDown);
      canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);
      canvas.removeEventListener('contextmenu',preventMenu);audio?.close?.().catch(()=>{});
    }
  };
}
