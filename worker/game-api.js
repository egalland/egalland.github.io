import {normalizeAppearance} from '../public/kikalmo-schema.js';
import { decodeDropId, isEligibleDropId } from '../public/drop-id.js';

// The Worker owns these tables. They are initialized once per D1 binding and isolate.
const schemaReady = new WeakMap();
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS mc_members (
    room TEXT NOT NULL, id TEXT NOT NULL, secret TEXT NOT NULL, name TEXT NOT NULL,
    state TEXT NOT NULL, joined INTEGER NOT NULL, seen INTEGER NOT NULL,
    PRIMARY KEY (room,id))`,
  'CREATE INDEX IF NOT EXISTS mc_members_seen ON mc_members (seen)',
  `CREATE TABLE IF NOT EXISTS mc_events (
    seq INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL, player TEXT NOT NULL,
    op TEXT NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, data TEXT NOT NULL,
    at INTEGER NOT NULL, UNIQUE (room,player,op))`,
  'CREATE INDEX IF NOT EXISTS mc_events_room ON mc_events (room,seq)',
  'CREATE INDEX IF NOT EXISTS mc_chat_history ON mc_events (room,seq) WHERE type=\'chat\'',
  'CREATE INDEX IF NOT EXISTS mc_events_age ON mc_events (at)',
  `CREATE TABLE IF NOT EXISTS mc_items (
    room TEXT NOT NULL, kind TEXT NOT NULL, item TEXT NOT NULL,
    seq INTEGER NOT NULL, owner TEXT NOT NULL, data TEXT NOT NULL, at INTEGER NOT NULL,
    PRIMARY KEY (room,kind,item))`,
  'CREATE INDEX IF NOT EXISTS mc_items_age ON mc_items (at)',
  `CREATE TABLE IF NOT EXISTS mc_pickup_claims (
    room TEXT NOT NULL, player TEXT NOT NULL, op TEXT NOT NULL, item TEXT NOT NULL,
    ok INTEGER NOT NULL, available INTEGER NOT NULL, at INTEGER NOT NULL,
    PRIMARY KEY (room,player,op))`,
  'CREATE INDEX IF NOT EXISTS mc_pickup_item ON mc_pickup_claims (room,item,available DESC) WHERE ok=1',
  'CREATE INDEX IF NOT EXISTS mc_pickup_active ON mc_pickup_claims (room,available) WHERE ok=1',
  'CREATE INDEX IF NOT EXISTS mc_pickup_age ON mc_pickup_claims (at)'
];
// Keep the public Paris records in place. Earlier named games remain isolated in storage.
const WORLD_KEY = 'paris:public';
const GONE = 25_000;
const MAX_BATCH = 20;
const EVENT_RETENTION = 86_400_000;
const ITEM_RETENTION = 7 * EVENT_RETENTION;
const PICKUP_COOLDOWN = 60_000;
const PICKUP_REQUEST_AGE = 30_000;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const KEY = /^[\w:-]{1,68}$/;
const ITEM_TYPES = new Set(['destroy','vehicle','npc']);
const EVENTS = new Set(['destroy','vehicle','npc','emote','shot','alert','hit','chat']);
const MEMBERS_SQL = 'SELECT id,name,state,joined,seen FROM mc_members WHERE room=? AND seen>? ORDER BY joined,id';
function ready(db) {
  if (!schemaReady.has(db)) {
    const promise = db.batch(SCHEMA.map(q => db.prepare(q))).catch(error => {
      schemaReady.delete(db);
      throw error;
    });
    schemaReady.set(db,promise);
  }
  return schemaReady.get(db);
}
function json(value, status=200) {
  return new Response(JSON.stringify(value), {status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
const clean = (s, n) => typeof s === 'string' ? [...s.replace(/[\u0000-\u001f\u007f]/g,' ').trim()].slice(0,n).join('') : '';
const num = (x, fallback=0, min=-1e5, max=1e5) => typeof x === 'number' && Number.isFinite(x) ? Math.min(max,Math.max(min,x)) : fallback;
const dict = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
function key(x) {
  return typeof x === 'string' && KEY.test(x) && !['__proto__','constructor','prototype'].includes(x) ? x : '';
}
function pose(source) {
  const copy={};
  for (const k of ['x','y','angle','vx','vy','walk','speed','health','wanted']) {
    if (typeof source[k]==='number') copy[k]=num(source[k]);
  }
  for (const k of ['type','kind','weapon','color','skin','variant','role','symbol']) {
    if (typeof source[k]==='string') copy[k]=clean(source[k],40);
  }
  for (const k of ['moving','sprinting','shooting','dead','siren']) {
    if (typeof source[k]==='boolean') copy[k]=source[k];
  }
  return copy;
}
function vitalityFields(source,now) {
  const result={};
  if(Number.isFinite(source.health))result.health=num(source.health,100,0,100);
  if(Number.isFinite(source.downUntil))result.downUntil=num(source.downUntil,0,0,now+8000);
  if(Number.isFinite(source.healthAt))result.healthAt=num(source.healthAt,now,0,now+1000);
  const rag=source.ragdoll;
  if(rag && Number.isFinite(rag.at) && Number.isFinite(rag.until) && rag.at>=now-9000 && rag.until>now-1000){
    const at=num(rag.at,now,now-9000,now+500);
    result.ragdoll={at,until:num(rag.until,at,at,Math.min(at+8000,now+8000)),angle:num(rag.angle,0,-Math.PI*2,Math.PI*2),
      force:num(rag.force,.5,0,1),seed:Math.trunc(num(rag.seed,0,0,65535))};
  }
  return result;
}
function playerState(raw,now) {
  const s=dict(raw), result={...pose(s),...vitalityFields(s,now)};
  const appearance=normalizeAppearance(s.appearance);if(appearance)result.appearance=appearance;
  if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) return {};
  if (s.vehicle && key(s.vehicle.id)) result.vehicle={...pose(s.vehicle),id:key(s.vehicle.id)};
  else result.vehicle=null;
  return result;
}
function eventData(type,raw,now) {
  const d=dict(raw), result=pose(d);
  switch(type) {
    case 'chat': return clean(d.text,240) ? {text:clean(d.text,240)} : null;
    case 'emote': return clean(d.symbol,24) ? {symbol:clean(d.symbol,24)} : null;
    case 'destroy': return key(d.id) ? {id:d.id} : null;
    case 'vehicle': return key(d.id) ? {...result,id:d.id,occupied:!!d.occupied} : null;
    case 'npc':
      if (!key(d.id)) return null;
      if (d.kind && Number.isFinite(d.started)) {
        return {...result,id:d.id,started:num(d.started,now,now-120_000,now+2000),level:num(d.level,1,0,5)};
      }
      return {...result,...vitalityFields(d,now),id:d.id,stunnedUntil:num(d.stunnedUntil,0,0,now+8000),
        ...(Number.isFinite(d.damage)&&d.damage>0?{damage:num(d.damage,1,1,100)}:{})};
    case 'shot': {
      const out={...result,length:num(d.length,80,0,400)};
      const near=r=>Number.isFinite(r?.x)&&Number.isFinite(r?.y)&&Math.hypot(r.x-result.x,r.y-result.y)<=100;
      if(Array.isArray(d.rays))out.rays=d.rays.slice(0,13).filter(near).map(r=>({x:r.x,y:r.y,angle:num(r.angle,0,-8,8),length:num(r.length,0,0,100)}));
      if(near(d.impact))out.impact={x:d.impact.x,y:d.impact.y,radius:num(d.impact.radius,1,0,12)};
      return out;
    }
    case 'alert': return {...result,level:num(d.level,1,0,5)};
    case 'hit': return UUID.test(d.target) ? {target:d.target,damage:num(d.damage,1,1,100),
      ...(Number.isFinite(d.angle)?{angle:num(d.angle,0,-7,7)}:{}),...(Number.isFinite(d.force)?{force:num(d.force,0,0,1)}:{}),
      ...(['weapon','traffic'].includes(d.cause)?{cause:d.cause}:{})} : null;
    default: return null;
  }
}
function roster(rows) {
  return rows.map(r=>({...JSON.parse(r.state),id:r.id,name:r.name,joinedAt:r.joined,updatedAt:r.seen}));
}
function events(rows) {
  return rows.map(r=>({seq:r.seq,player:r.player,name:r.name,type:r.type,data:JSON.parse(r.data),at:r.at}));
}
function shared(rows) {
  const world={destroyed:[],vehicles:{},npcs:{},pickups:{}};
  for (const r of rows) {
    if (r.kind==='destroy') world.destroyed.push(r.item);
    if (r.kind==='vehicle') world.vehicles[r.item]={...JSON.parse(r.data),owner:r.owner};
    if (r.kind==='npc') world.npcs[r.item]=JSON.parse(r.data);
  }
  return world;
}
async function join(db,b,now) {
  const {id,token}=b, name=clean(b.name,24)||'Kikalmo';
  const room=WORLD_KEY;
  const q=(sql,...args)=>db.prepare(sql).bind(...args);
  const results=await db.batch([
    q('DELETE FROM mc_members WHERE seen<?',now-GONE),
    q('DELETE FROM mc_events WHERE at<?',now-EVENT_RETENTION),
    q('DELETE FROM mc_items WHERE at<?',now-ITEM_RETENTION),
    q(`INSERT INTO mc_members (room,id,secret,name,state,joined,seen)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT (room,id) DO UPDATE SET seen=excluded.seen,name=excluded.name,
       state=CASE WHEN excluded.state='{}' THEN mc_members.state ELSE excluded.state END
       WHERE mc_members.secret=excluded.secret`,
       room,id,token,name,JSON.stringify(playerState(b.state,now)),now,now),
    q('SELECT 1 AS ok FROM mc_members WHERE room=? AND id=? AND secret=?',room,id,token),
    q(MEMBERS_SQL,room,now-GONE),
    q('SELECT seq,player,name,type,data,at FROM mc_events WHERE room=? AND type=\'chat\' ORDER BY seq DESC LIMIT 30',room),
    q('SELECT COALESCE(MAX(seq),0) AS last FROM mc_events WHERE room=?',room),
    q('SELECT kind,item,data,owner FROM mc_items WHERE room=?',room),
    q('SELECT item,available FROM mc_pickup_claims WHERE room=? AND ok=1 AND available>?',room,now),
    q('DELETE FROM mc_pickup_claims WHERE at<?',now-EVENT_RETENTION)
  ]);
  if (!results[4].results.length) return json({error:'session'},403);
  const world=shared(results[8].results);
  for(const pickup of results[9].results)world.pickups[pickup.item]=pickup.available;
  return json({now,players:roster(results[5].results),history:events(results[6].results.reverse()),
    cursor:results[7].results[0].last,world});
}
function recordPickup(stmts,q,{room,id,token,name,op,item,weapon,state,now}){
  const p=decodeDropId(item);
  if(!p||p.weapon!==weapon||!isEligibleDropId(item))return false;
  const match=/^pick-([0-9a-z]{7,11})-([0-9a-z]{1,10})$/.exec(op);
  if(!match)return false;
  const issued=parseInt(match[1],36);
  const fresh=issued>=now-PICKUP_REQUEST_AGE&&issued<=now+2500;
  if(!fresh)return true; // An expired operation can only read its original receipt.
  const close=Number.isFinite(state.x)&&Number.isFinite(state.y)&&!state.vehicle&&state.health!==0&&!(state.downUntil>now)&&Math.hypot(state.x-p.x,state.y-p.y)<=4;
  // Reads, receipt and winner event share one D1 batch transaction. Another player
  // can enter only after it commits and will see the winning availability timestamp.
  stmts.push(q(`INSERT OR IGNORE INTO mc_pickup_claims (room,player,op,item,ok,available,at)
    SELECT ?,?,?,?, (previous<=? AND ?),
      CASE WHEN previous>? THEN previous WHEN ? THEN ? ELSE 0 END, ?
    FROM (SELECT COALESCE((SELECT available FROM mc_pickup_claims
      WHERE room=? AND item=? AND ok=1 ORDER BY available DESC LIMIT 1),0) AS previous)
    WHERE EXISTS (SELECT 1 FROM mc_members WHERE room=? AND id=? AND secret=? AND seen>?)`,
    room,id,op,item,now,close?1:0,now,close?1:0,now+PICKUP_COOLDOWN,now,room,item,room,id,token,now-GONE));
  stmts.push(q(`INSERT OR IGNORE INTO mc_events (room,player,op,name,type,data,at)
    SELECT room,player,op,?,'pickup',json_object('id',item,'weapon',?,'availableAt',available),at
    FROM mc_pickup_claims WHERE room=? AND player=? AND op=? AND item=? AND ok=1 AND at=?`,
    name,weapon,room,id,op,item,now));
  return true;
}
// Resolve each hit against the preceding shared HP inside the same transaction as the event.
function npcHitStatement(q,{room,id,op,name,data,now}) {
  return q(`WITH input(src,stamp) AS (VALUES (?,?)),
    previous AS (SELECT (SELECT data FROM mc_items WHERE room=? AND kind='npc' AND item=?) AS old,src,stamp FROM input),
    stats AS (SELECT *, COALESCE(json_extract(old,'$.health'),100) AS hp,
      COALESCE(json_extract(old,'$.healthAt'),stamp) AS last_hit,
      COALESCE(json_extract(old,'$.downUntil'),0) AS down_at FROM previous),
    remaining AS (SELECT *,
      CASE WHEN down_at>stamp THEN 0
        WHEN down_at>0 AND hp=0 THEN min(100,65+max(0,stamp-down_at-10000)*0.004)
        ELSE min(100,hp+max(0,stamp-last_hit-10000)*0.004) END AS current_hp FROM stats),
    result AS (SELECT *,max(0,current_hp-json_extract(src,'$.damage')) AS next_hp FROM remaining)
    INSERT OR IGNORE INTO mc_events (room,player,op,name,type,data,at)
      SELECT ?,?,?,?,'npc',
        CASE WHEN down_at>stamp THEN json_set(old,'$.damage',0)
        WHEN next_hp<=0 THEN json_set(src,'$.health',0,'$.healthAt',stamp,'$.downUntil',stamp+6500,'$.stunnedUntil',stamp+6500,
          '$.ragdoll',json_object('at',stamp,'until',stamp+6500,'angle',coalesce(json_extract(src,'$.ragdoll.angle'),json_extract(src,'$.angle'),0),
          'force',coalesce(json_extract(src,'$.ragdoll.force'),0.8),'seed',coalesce(json_extract(src,'$.ragdoll.seed'),stamp%65536)))
        ELSE json_set(src,'$.health',next_hp,'$.healthAt',stamp,'$.downUntil',0) END,stamp FROM result`,
      JSON.stringify(data),now,room,data.id,room,id,op,name);
}
async function sync(db,b,now) {
  const {id,token}=b,room=WORLD_KEY;
  const q=(sql,...args)=>db.prepare(sql).bind(...args);
  const member=await q('SELECT name,seen,state FROM mc_members WHERE room=? AND id=? AND secret=? AND seen>?',room,id,token,now-GONE).first();
  if (!member) return json({error:'rejoin'},401);
  const name=clean(b.name,24)||member.name;
  const rawState=playerState(b.state,now);
  const state=Number.isFinite(rawState.x) ? JSON.stringify(rawState) : member.state;
  const stmts=[];
  if (now-member.seen>3500 || state!==member.state || name!==member.name) {
    stmts.push(q('UPDATE mc_members SET seen=?,state=?,name=? WHERE room=? AND id=? AND secret=?',now,state,name,room,id,token));
    if (rawState.vehicle) {
      // Keep a last known parking spot for a driver who loses their connection.
      const {id:carId,...car}=rawState.vehicle;
      stmts.push(q(`UPDATE mc_items SET data=json_patch(data,?),at=? WHERE room=? AND kind='vehicle'
        AND item=? AND owner=? AND at<?`,JSON.stringify(car),now,room,carId,id,now-1000));
    }
  }
  const claims=new Set(),pickupOps=new Map();
  for (const input of (Array.isArray(b.events) ? b.events.slice(0,MAX_BATCH) : [])) {
    const {type,op}=dict(input);
    if(type==='pickup'&&key(op)){
      const {id:item,weapon}=dict(input.data);
      if(key(item)&&recordPickup(stmts,q,{room,id,token,name,op,item,weapon,now,state:Number.isFinite(rawState.x)?rawState:JSON.parse(member.state)}))
        pickupOps.set(op,item);
      continue;
    }
    if (!EVENTS.has(type) || !key(op)) continue;
    if(op.startsWith('pick-')) continue;
    const data=eventData(type,input.data,now);
    if (!data) continue;
    const requiresCar=type==='vehicle';
    if (requiresCar) {
      data.owner=data.occupied ? id : '';
      if (data.occupied) claims.add(data.id);
    }
    const payload=JSON.stringify(data);
    const accept=`INSERT OR IGNORE INTO mc_events (room,player,op,name,type,data,at) SELECT ?,?,?,?,?,?,?`;
    const values=[room,id,op,name,type,payload,now];
    if (requiresCar) {
      stmts.push(q(accept+` WHERE NOT EXISTS (
        SELECT 1 FROM mc_items i JOIN mc_members m ON m.room=i.room AND m.id=i.owner
        WHERE i.room=? AND i.kind='vehicle' AND i.item=? AND i.owner<>? AND m.seen>?)`,
        ...values,room,data.id,id,now-GONE));
    } else if(type==='npc' && data.damage>0) {
      stmts.push(npcHitStatement(q,{room,id,op,name,data,now}));
    } else stmts.push(q(accept,...values));
    if (ITEM_TYPES.has(type)) {
      // Use the stored payload and sequence. Retrying an older operation cannot rewind a car.
      stmts.push(q(`INSERT INTO mc_items (room,kind,item,seq,owner,data,at)
        SELECT room,type,json_extract(data,'$.id'),seq,CASE WHEN type='vehicle' THEN json_extract(data,'$.owner') ELSE '' END,data,at
        FROM mc_events WHERE room=? AND player=? AND op=? AND type=?
        ON CONFLICT (room,kind,item) DO UPDATE SET
        seq=excluded.seq,owner=excluded.owner,data=excluded.data,at=excluded.at
        WHERE excluded.seq>mc_items.seq`,room,id,op,type));
    }
  }
  const membersIndex=stmts.length;
  stmts.push(q(MEMBERS_SQL,room,now-GONE));
  const cursor=num(b.cursor,0,0,Number.MAX_SAFE_INTEGER);
  stmts.push(q('SELECT seq,player,name,type,data,at FROM mc_events WHERE room=? AND seq>? ORDER BY seq LIMIT 160',room,cursor));
  if (claims.size) {
    stmts.push(q(`SELECT item AS id,owner FROM mc_items WHERE room=? AND kind='vehicle' AND item IN (${[...claims].map(()=>'?').join(',')})`,room,...claims));
  }
  const pickupIndex=stmts.length;
  if(pickupOps.size)stmts.push(q(`SELECT op,item,ok,available FROM mc_pickup_claims WHERE room=? AND player=?
    AND op IN (${[...pickupOps].map(()=>'?').join(',')})`,room,id,...pickupOps.keys()));
  const result=await db.batch(stmts);
  const feed=events(result[membersIndex+1].results);
  const denied=claims.size ? result[membersIndex+2].results.filter(c=>c.owner && c.owner!==id) : [];
  const pickupResults=pickupOps.size?result[pickupIndex].results.filter(r=>pickupOps.get(r.op)===r.item)
    .map(r=>({op:r.op,id:r.item,ok:r.ok===1,availableAt:r.available})):undefined;
  return json({now,players:roster(result[membersIndex].results),events:feed,denied,pickupResults,cursor:feed.at(-1)?.seq??cursor});
}
export async function handleApi(request, env) {
  const pathname=new URL(request.url).pathname;
  const match=/^\/api(?:\/(world|paris))?\/(join|sync|leave)$/.exec(pathname);
  if(!match)return json({error:'route'},404);
  const [,generation,operation]=match;
  if(!generation)return json({error:'update_required'},410);
  if (request.method!=='POST') return json({error:'method'},405);
  const raw=await request.text();
  if (raw.length>32_000) return json({error:'length'},413);
  let b;
  try {b=JSON.parse(raw);} catch {return json({error:'json'},400);}
  if (!b || typeof b!=='object' || Array.isArray(b)) return json({error:'session'},400);
  if(generation==='paris' && b.room!==undefined && b.room!=='public')return json({error:'update_required'},410);
  if (!UUID.test(b.id) || !UUID.test(b.token)) return json({error:'session'},400);
  if (!env.DB) return json({error:'storage'},503);
  await ready(env.DB);
  if (operation==='join') return join(env.DB,b,Date.now());
  if (operation==='leave') {
    await env.DB.prepare('DELETE FROM mc_members WHERE room=? AND id=? AND secret=?').bind(WORLD_KEY,b.id,b.token).run();
    return json({left:true});
  }
  return sync(env.DB,b,Date.now());
}
