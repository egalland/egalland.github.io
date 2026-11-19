// Each tab is a separate player. State snapshots may coalesce; actions have stable IDs and are retried.
export function normalizeRoom(value) {
  const room=String(value||'public').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,32).replace(/-$/,'');
  return room || 'public';
}
const blankWorld=()=>({destroyed:[],vehicles:{},npcs:{}});
const cleanName=s=>[...String(s||'Kikalmo').replace(/[\u0000-\u001f\u007f]/g,' ').trim()].slice(0,24).join('')||'Kikalmo';
export function createNet(options={}) {
  const {onStatus=()=>{},onPlayers=()=>{},onChat=()=>{}}=options;
  const fetcher=options.fetcher || ((url,init)=>fetch(url,init));
  const uid=()=>crypto.randomUUID();
  let id=uid(), token=uid(), room=normalizeRoom(options.room), name=cleanName(options.name);
  let run=0,request=null,timer=null,started=false,busy=false,joined=false,status='connecting',cursor=0,offset=0;
  let roster=[], context=blankWorld(), pending=[], state={}, revision=0, failures=0, op=0;
  let rosterKey='', lifetimeChats=new Set();
  const listeners=new Set(), resets=new Set();
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
    roster=next;
    const key=next.map(p=>p.id+'|'+p.name).join(';');
    if (key!==rosterKey) {rosterKey=key;onPlayers(next);}
  }
  function receive(e) {
    const d=e.data||{};
    if (e.type==='destroy' && !context.destroyed.includes(d.id)) context.destroyed.push(d.id);
    if (e.type==='vehicle') context.vehicles[d.id]=d;
    if (e.type==='npc') context.npcs[d.id]=d;
    if (e.type==='chat') {
      if (lifetimeChats.has(e.seq)) return;
      lifetimeChats.add(e.seq);
      if (lifetimeChats.size>1000) lifetimeChats.delete(lifetimeChats.values().next().value);
      onChat({seq:e.seq,player:e.player,name:e.name,text:d.text,at:e.at});
    } else if (e.player!==id) {
      for (const fn of listeners) fn(e);
    }
  }
  function schedule(delay) {
    if (!started) return;
    clearTimeout(timer);
    timer=setTimeout(tick,delay);
  }
  function cadence() {
    if (options.pollMs) return options.pollMs;
    if (pending.length) return 85;
    if (typeof document!=='undefined' && document.hidden) return 3200;
    return roster.length>1 ? 300 : 1100;
  }
  async function tick() {
    if (!started || busy) return false;
    busy=true;
    const attempt=run, joining=!joined;
    const batch=joining?[]:pending.slice(0,20);
    let delay=0;
    const controller=new AbortController();
    request=controller;
    const deadline=setTimeout(()=>controller.abort(),8500);
    try {
      const response=await fetcher(joining?'/api/join':'/api/sync',{
        method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:controller.signal,
        body:JSON.stringify({room,id,token,name,state,cursor,events:batch})
      });
      if (attempt!==run) return false;
      if (response.status===401) {joined=false;updateStatus('connecting');return false;}
      if (response.status===409) {updateStatus('full');delay=4500;return false;}
      if (!response.ok) throw new Error('network');
      const data=await response.json();
      if (attempt!==run) return false;
      offset=data.now-Date.now();
      if (joining) {
        context=data.world || blankWorld();
        joined=true;
        (data.history||[]).forEach(receive);
      } else {
        if (batch.length) {
          const ack=new Set(batch.map(e=>e.op));
          pending=pending.filter(e=>!ack.has(e.op));
        }
        (data.events||[]).forEach(receive);
        for (const denied of data.denied||[]) {
          for (const fn of listeners) fn({type:'vehicleDenied',data:denied,at:data.now,player:denied.owner});
        }
        if (data.events?.length===160) delay=30;
      }
      cursor=data.cursor;
      failures=0;
      updatePlayers(data.players||[]);
      updateStatus('online');
      return true;
    } catch {
      if (attempt!==run) return false;
      failures++;
      updateStatus('offline');
      if (failures>=2) updatePlayers([]);
      delay=Math.min(6000,650*2**Math.min(4,failures-1));
      return false;
    } finally {
      clearTimeout(deadline);
      if (attempt===run) {busy=false;request=null;schedule(delay||cadence());}
    }
  }
  function send(type,data) {
    if (!started || status==='full') return false;
    if (status!=='online' && ['chat','shot','hit','alert','emote'].includes(type)) return false;
    if (pending.length>=120) {
      const effects=pending.findIndex(e=>['shot','alert','emote'].includes(e.type));
      if (effects>=0) pending.splice(effects,1);
      else return false;
    }
    pending.push({op:(revision.toString(36)+'-'+(++op).toString(36)),type,data});
    if (!busy && joined && status==='online') schedule(24);
    return true;
  }
  function leave() {
    if (!joined) return;
    const body=JSON.stringify({room,id,token});
    // Same-origin keepalive also works when a player closes the tab.
    void fetcher('/api/leave',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
  }
  function pageHide(e) {if (!e.persisted) net.stop();}
  function wake() {if (started && !busy && (typeof document==='undefined' || !document.hidden)) schedule(0);}
  const net={
    get id(){return id;}, get name(){return name;}, get room(){return room;}, get status(){return status;},
    capacity:16,
    players:()=>roster.slice(),
    peers:()=>roster.filter(p=>p.id!==id && Number.isFinite(p.x) && Number.isFinite(p.y)),
    world:()=>context,
    leader:()=>!roster.length || roster[0].id===id,
    roomTime:()=>Date.now()+offset,
    publish(next){state=next||{};},
    emit:send,
    onEvent(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
    onReset(fn){resets.add(fn);return ()=>resets.delete(fn);},
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
      onStatus('connecting');
      return tick();
    },
    setRoom(value) {
      const next=normalizeRoom(value);
      if (next===room) return started ? Promise.resolve(joined) : net.start();
      leave();run++;clearTimeout(timer);request?.abort();request=null;busy=false;
      room=next;cursor=0;revision++;op=0;joined=false;pending=[];failures=0;context=blankWorld();
      // New credentials avoid an old, in-flight leave deleting the new membership when hopping back.
      id=uid();token=uid();lifetimeChats=new Set();updatePlayers([]);updateStatus('connecting');
      for (const fn of resets) fn(next);
      if (typeof location!=='undefined' && typeof history!=='undefined') {
        const url=new URL(location.href);url.searchParams.set('salon',room);
        history.replaceState(history.state,'',url);
      }
      return started?tick():net.start();
    },
    stop(){
      leave();started=false;run++;clearTimeout(timer);request?.abort();request=null;busy=false;joined=false;updatePlayers([]);
      if (typeof window!=='undefined') {
        window.removeEventListener('pagehide',pageHide);
        window.removeEventListener('online',wake);
        document.removeEventListener('visibilitychange',wake);
      }
    }
  };
  return net;
}
