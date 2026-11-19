import {decodeDropId,isEligibleDropId} from './drop-id.js';
import {createRosterWire} from './roster-wire.js';
import {createStateEncoder} from './state-wire.js';

// Each tab is a separate player. State snapshots may coalesce; actions have stable IDs and are retried.
const actionPoses=new Set(['jump','fall','vault','climb','land']);
const cosmeticQueue=new Set(['emote','alert','shot']);
const socialQueue=new Set(['chat','emote']);
const combatActions=new Set(['fire','shot','hit','melee']);
const onlineOnly=new Set([...combatActions,'chat','alert','emote']);
const COMBAT_WINDOW=1400;
const MAX_BATCH=20, MAX_QUEUE=120;
const blankWorld=()=>({destroyed:[],vehicles:{},npcs:{},pickups:{},propHealth:{}});
const cleanName=s=>[...String(s||'Kikalmo').replace(/[\u0000-\u001f\u007f]/g,' ').trim()].slice(0,24).join('')||'Kikalmo';
const uuid=/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
export function createNet(options={}) {
  const {onStatus=()=>{},onPlayers=()=>{},onChat=()=>{}}=options;
  const fetcher=options.fetcher || ((url,init)=>fetch(url,init));
  const uid=()=>crypto.randomUUID();
  const saved=options.identity, resume=uuid.test(saved?.id)&&uuid.test(saved?.token)&&Number.isSafeInteger(saved?.op)&&saved.op>=0;
  const id=resume?saved.id:uid(), token=resume?saved.token:uid();
  let name=cleanName(options.name);
  const rosterWire=createRosterWire(),stateEncoder=createStateEncoder();
  const clockSamples=[];
  let timerDue=Infinity,poseDue=false,leaving=null;
  let activeOps=new Set(),rosterRevision=0;
  let run=0,request=null,timer=null,started=false,busy=false,joined=false,status='connecting',cursor=0,offset=0;
  let roster=[], context=blankWorld(), pending=[], state={}, failures=0, op=resume?saved.op:0;
  let rosterKey='', lifetimeChats=new Set();
  const listeners=new Set();
  const pickupRequests=new Map(),claimingItems=new Set();
  let lastPickupPrune=0,combatUntil=0,lastReply=-Infinity;
  const serverTime=()=>Date.now()+offset;
  function sampleClock(serverAt,sent,received){
    if(!Number.isFinite(serverAt))return;
    const rtt=received-sent;
    // A resumed background tab or a queued response can be seconds late.
    // Prefer the shortest recent round trip over an asymmetric delay spike.
    if(rtt<0 || (clockSamples.length && (rtt>2200 || (typeof document!=='undefined'&&document.hidden))))return;
    while(clockSamples.length && received-clockSamples[0].received>20000)clockSamples.shift();
    const first=!clockSamples.length;
    clockSamples.push({rtt,received,offset:serverAt-(sent+rtt/2)});
    if(clockSamples.length>8)clockSamples.shift();
    const best=clockSamples.reduce((a,b)=>a.rtt<b.rtt?a:b);
    offset=Math.round(first||Math.abs(best.offset-offset)>1000?best.offset:offset+(best.offset-offset)*.3);
  }
  function rememberPickup(item,availableAt){
    if(Number.isFinite(availableAt)&&availableAt>Date.now()+offset&&availableAt>(context.pickups[item]||0))
      context.pickups[item]=availableAt;
  }
  function finishClaim(operation,answer){
    const request=pickupRequests.get(operation);
    if(!request)return;
    pickupRequests.delete(operation);claimingItems.delete(request.item);clearTimeout(request.timeout);
    const until=Number.isFinite(answer?.availableAt)?answer.availableAt:0;
    rememberPickup(request.item,until);
    request.resolve({ok:answer?.ok===true && until>Date.now()+offset,availableAt:until});
  }
  function cancelClaims(){
    for(const operation of pickupRequests.keys())finishClaim(operation);
    pending=pending.filter(e=>e.type!=='pickup');
  }
  function updateStatus(next) {
    if (status!==next) {status=next;onStatus(next);}
  }
  function updatePlayers(next) {
    const present=new Set(next.map(p=>p.id));
    for (const previous of roster) {
      const car=previous.vehicle;
      if (car && !present.has(previous.id) && context.vehicles[car.id]?.owner===previous.id) {
        context.vehicles[car.id]={...context.vehicles[car.id],...car,occupied:false,owner:''};
      }
    }
    roster=next;rosterRevision++;
    const key=next.map(p=>p.id+'|'+p.name).join(';');
    if (key!==rosterKey) {rosterKey=key;onPlayers(next);}
  }
  function receive(e) {
    const d=e.data||{};
    const clock=serverTime();
    // Effects can expire on the wire. Damage and shared world changes still go to the game.
    if(e.type==='shot'&&clock-(d.firedAt??e.at)>950)return;
    if(e.type==='melee'&&clock-(d.started??e.at)>1400)return;
    if(combatActions.has(e.type)&&clock-(d.firedAt??e.at)<COMBAT_WINDOW&&
        (d.target===id||Math.hypot(d.x-state.x,d.y-state.y)<145))combatUntil=Date.now()+COMBAT_WINDOW;
    if (e.type==='destroy' && !context.destroyed.includes(d.id)) context.destroyed.push(d.id);
    if(e.type==='propDamage'){
      const previous=context.propHealth[d.id];
      if(previous && previous.health<d.health)return;
      context.propHealth[d.id]=d;
      if(d.health===0 && !context.destroyed.includes(d.id))context.destroyed.push(d.id);
    }
    if (e.type==='vehicle') context.vehicles[d.id]=d;
    if (e.type==='npc') context.npcs[d.id]=d;
    if (e.type==='pickup') rememberPickup(d.id,d.availableAt);
    if (e.type==='chat') {
      if (lifetimeChats.has(e.seq)) return;
      lifetimeChats.add(e.seq);
      if (lifetimeChats.size>1000) lifetimeChats.delete(lifetimeChats.values().next().value);
      onChat({seq:e.seq,player:e.player,name:e.name,text:d.text,at:e.at});
    } else if (e.player!==id || e.type==='propDamage' || (e.type==='npc' && Number.isFinite(d.damage))) {
      for (const fn of listeners) fn(e);
    }
  }
  function schedule(delay) {
    if (!started) return;
    const due=Date.now()+delay;
    if(timer!==null && timerDue<=due)return;
    clearTimeout(timer);
    timerDue=due;
    timer=setTimeout(tick,delay);
  }
  function cadence(roundTrip) {
    if (options.pollMs) return options.pollMs;
    if (typeof document!=='undefined' && document.hidden) return 3200;
    if(roster.length<=1)return 850;
    const nearby=roster.filter(p=>p.id!==id&&Math.hypot(p.x-state.x,p.y-state.y)<150);
    if(!nearby.length)return 420;
    if(Date.now()<combatUntil || nearby.some(p=>p.shooting && serverTime()-p.updatedAt<600))
      return Math.max(20,78-roundTrip);
    const moving=state.moving||actionPoses.has(state.motion)||nearby.some(p=>p.moving||actionPoses.has(p.motion));
    return Math.max(36,(moving?120:175)-roundTrip);
  }
  function chooseBatch() {
    const now=Date.now(), clock=serverTime();
    pending=pending.filter(e=>{
      if(e.type==='fire'&&Number.isFinite(e.data?.firedAt))return clock-e.data.firedAt<=2200;
      if(cosmeticQueue.has(e.type))return now-e.queuedAt<=3500;
      return true;
    });
    if(pending.length<=MAX_BATCH)return pending.slice();
    // Chat and emotes are independent of gameplay. Reserve them space without
    // separating a wind-up from its contact or overtaking earlier world mutations.
    const social=pending.filter(e=>socialQueue.has(e.type));
    const actions=pending.filter(e=>!socialQueue.has(e.type)).slice(0,MAX_BATCH-Math.min(4,social.length));
    const keep=new Set([...actions,...social.slice(0,MAX_BATCH-actions.length)]);
    return pending.filter(e=>keep.has(e));
  }
  function discardSessionActions(keepChat=false) {
    cancelClaims();
    const abandoned=pending;
    pending=keepChat?abandoned.filter(e=>e.type==='chat'):[];
    for(const e of abandoned)if(e.type==='propDamage')
      for(const fn of listeners)fn({type:'propDamageDenied',data:{id:e.data.id,impactId:e.data.impactId},at:serverTime(),player:id});
  }
  async function tick() {
    timer=null;timerDue=Infinity;
    if (!started || busy) return false;
    busy=true;poseDue=false;
    const attempt=run, joining=!joined;
    if(joining)rosterWire.reset();
    const batch=joining?[]:chooseBatch();
    const payload={protocol:2,id,token,name,...stateEncoder.packet(state,joining),cursor,rosterBase:rosterWire.baseline()};
    // A burst of multi-ray weapons can reach the Worker's 32 KB body limit
    // before reaching its event-count limit. Leave overflow for the next flush.
    const encode=()=>JSON.stringify({...payload,events:batch.map(({op,type,data})=>({op,type,data}))});
    let body=encode();
    while(body.length>32000 && batch.length>1){
      batch.length=Math.ceil(batch.length/2);
      body=encode();
    }
    activeOps=new Set(batch.map(e=>e.op));
    let delay;
    const controller=new AbortController();
    request=controller;
    const deadline=setTimeout(()=>controller.abort(),8500);
    const sent=Date.now();
    try {
      const response=await fetcher(joining?'/api/world/join':'/api/world/sync',{
        method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:controller.signal,body
      });
      const received=Date.now();
      if (attempt!==run) return false;
      if (response.status===401 && !joining) {stateEncoder.ack(null);discardSessionActions(true);joined=false;rosterWire.reset();delay=0;updateStatus('connecting');return false;}
      if (!response.ok) throw new Error('network');
      const data=await response.json();
      if (attempt!==run) return false;
      stateEncoder.ack(data.stateRefs);
      sampleClock(data.now,sent,received);
      const next=rosterWire.apply(data);
      if(!next)delay=0;
      else if(next!==roster)updatePlayers(next);
      if (joining) {
        context={...blankWorld(),...data.world};
        joined=true;
        (data.history||[]).forEach(receive);
      } else {
        if (batch.length) {
          const ack=new Set(batch.map(e=>e.op));
          pending=pending.filter(e=>!ack.has(e.op));
        }
        // Pages can overlap after a retry. Sequence numbers include events from
        // distant districts that were filtered out by a newer server.
        for(const event of data.events||[]){
          if(!Number.isSafeInteger(event.seq)||event.seq<=cursor)continue;
          cursor=event.seq;
          receive(event);
        }
        if(Array.isArray(data.propAccepted)){
          const accepted=new Set(data.propAccepted);
          for(const item of batch)if(item.type==='propDamage' && !accepted.has(item.data.impactId))
            for(const fn of listeners)fn({type:'propDamageDenied',data:{id:item.data.id,impactId:item.data.impactId},at:data.now,player:id});
        }
        const replies=new Map((data.pickupResults||[]).map(r=>[r.op,r]));
        for(const item of batch)if(item.type==='pickup'){
          const answer=replies.get(item.op);
          finishClaim(item.op,answer?.id===item.data.id?answer:null);
        }
        for (const denied of data.denied||[]) {
          for (const fn of listeners) fn({type:'vehicleDenied',data:denied,at:data.now,player:denied.owner});
        }
        if (data.more || data.events?.length===160) delay=0;
      }
      if(Number.isSafeInteger(data.cursor))cursor=joining?data.cursor:Math.max(cursor,data.cursor);
      if(data.now-lastPickupPrune>5000){
        for(const [item,until] of Object.entries(context.pickups))if(until<=data.now)delete context.pickups[item];
        lastPickupPrune=data.now;
      }
      failures=0;lastReply=received;
      updateStatus('online');
      return true;
    } catch {
      if (attempt!==run) return false;
      stateEncoder.ack(null);failures++;
      updateStatus('offline');
      if (failures>=2) updatePlayers([]);
      const base=activeOps.size&&Date.now()<combatUntil?160:650;
      delay=Math.min(6000,base*2**Math.min(5,failures-1));
      return false;
    } finally {
      clearTimeout(deadline);
      if (attempt===run) {
        activeOps.clear();busy=false;request=null;
        schedule(delay??(pending.length||poseDue?0:cadence(Math.max(0,Date.now()-sent))));
      }
    }
  }
  function send(type,data) {
    if(type==='pickup')return false;
    if (!started) return false;
    const now=Date.now();
    // A single dropped reply must not swallow the next round of a burst. The
    // server's shot window and the next failure close this short recovery window.
    const recovering=joined&&failures===1&&now-lastReply<1500&&combatActions.has(type);
    if (status!=='online' && onlineOnly.has(type) && !recovering) return false;
    if(socialQueue.has(type)&&pending.length>=MAX_QUEUE-12)return false;
    if (pending.length>=MAX_QUEUE) {
      const effects=pending.findIndex(e=>cosmeticQueue.has(e.type)&&!activeOps.has(e.op));
      if (effects>=0) pending.splice(effects,1);
      else return false;
    }
    const combat=combatActions.has(type)||((type==='npc'||type==='propDamage')&&Number.isFinite(data?.damage));
    if(combat)combatUntil=now+COMBAT_WINDOW;
    pending.push({op:(++op).toString(36),type,data,queuedAt:now});
    if (!busy && joined){
      if(status==='online')schedule(combat?0:16);
      else if(recovering)schedule(80);
    }
    return true;
  }
  function claimPickup(item,weapon){
    if(decodeDropId(item)?.weapon!==weapon||!isEligibleDropId(item))return Promise.resolve({ok:false,availableAt:0});
    const clock=Date.now()+offset, availableAt=context.pickups[item]||0;
    if(!started||!joined||status!=='online'||pending.length>=MAX_QUEUE||claimingItems.has(item)||availableAt>clock)
      return Promise.resolve({ok:false,availableAt});
    const operation='pick-'+Math.trunc(clock).toString(36)+'-'+(++op).toString(36);
    return new Promise(resolve=>{
      claimingItems.add(item);
      const timeout=setTimeout(()=>{
        pending=pending.filter(e=>e.op!==operation);
        finishClaim(operation);
      },16000);
      pickupRequests.set(operation,{item,resolve,timeout});
      pending.push({op:operation,type:'pickup',data:{id:item,weapon},queuedAt:Date.now()});
      if(!busy)schedule(0);
    });
  }
  function leave() {
    if (!joined) return;
    const body=JSON.stringify({id,token});
    // Same-origin keepalive also works when a player closes the tab.
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),2500);
    const result=fetcher('/api/world/leave',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,signal:controller.signal})
      .catch(()=>{}).finally(()=>{clearTimeout(timeout);if(leaving===result)leaving=null;});
    leaving=result;
  }
  function pageHide() {net.stop();}
  function wake() {if (started && !busy && !leaving && (typeof document==='undefined' || !document.hidden)) schedule(0);}
  const net={
    get id(){return id;}, get name(){return name;}, get status(){return status;},
    get rosterRevision(){return rosterRevision;},
    players:()=>roster.slice(),
    peers:()=>roster.filter(p=>p.id!==id && Number.isFinite(p.x) && Number.isFinite(p.y)),
    world:()=>context,
    serverTime,
    publish(next){
      const previous=state.motion;
      state=next||{};
      if(started&&joined&&status==='online'&&previous!==state.motion&&
          (actionPoses.has(previous)||actionPoses.has(state.motion))&&!options.pollMs){
        if(busy)poseDue=true;else schedule(16);
      }
    },
    claimPickup,
    emit:send,
    onEvent(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
    sendChat(text){text=String(text||'').trim();return !!text && send('chat',{text:[...text].slice(0,240).join('')});},
    setName(value){name=cleanName(value);if (!busy && joined) schedule(0);return name;},
    start(){
      if (started) return Promise.resolve(joined);
      started=true;
      if (typeof window!=='undefined') {
        window.addEventListener('pagehide',pageHide);
        window.addEventListener('online',wake);
        document.addEventListener('visibilitychange',wake);
      }
      status='connecting';
      onStatus(status);
      const attempt=run;
      return leaving?leaving.then(()=>started&&run===attempt?tick():false):tick();
    },
    getTransferIdentity(){return {id,token,op};},
    stop({preservePresence=false}={}){
      if(!preservePresence)leave();
      started=false;run++;clearTimeout(timer);timer=null;timerDue=Infinity;request?.abort();request=null;
      busy=false;joined=false;activeOps.clear();combatUntil=0;poseDue=false;failures=0;lastReply=-Infinity;
      stateEncoder.ack(null);discardSessionActions();rosterWire.reset();updatePlayers([]);updateStatus('offline');
      if (typeof window!=='undefined') {
        window.removeEventListener('pagehide',pageHide);
        window.removeEventListener('online',wake);
        document.removeEventListener('visibilitychange',wake);
      }
    }
  };
  return net;
}
