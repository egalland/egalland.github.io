// A client echoes the last roster baseline it actually applied. The room stays global.
// Large crowds share checksum buckets so the request stays below 1.6 KB for any population.
const bucketLimit=64;
const maxBaseline=1800;
const fields=['profile','motion','traffic'];

function checksum(text,seed=2166136261){
  let hash=seed;
  for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
  return (hash>>>0).toString(36);
}
function rosterKey(players){
  const orderedIds=players.map(p=>p.id).join(',');
  return players.length.toString(36)+'-'+checksum(orderedIds)+'-'+checksum(orderedIds,5381);
}
function sections(player){
  const {id,name,joinedAt,appearance,traffic,...motion}=player;
  const profile=appearance===undefined?{name,joinedAt}:{name,joinedAt,appearance};
  return {profile,motion,traffic:traffic??null};
}
function bucketStart(index,size,count){return Math.floor(index*size/count);}
function unpack(token){
  if(typeof token!=='string'||token.length>maxBaseline)return null;
  const divider=token.indexOf('/');
  if(divider<0)return null;
  const stamps=token.slice(divider+1);
  return {key:token.slice(0,divider),buckets:stamps?stamps.split(','):[]};
}
function makeToken(key,buckets){return key+'/'+buckets.join(',');}

export function encodeRoster(players,previous){
  const key=rosterKey(players),count=Math.min(bucketLimit,players.length),before=unpack(previous);
  const sameMembers=before?.key===key&&before.buckets.length===count;
  const stamps=[],edits=[];
  for(let i=0;i<count;i++){
    const start=bucketStart(i,players.length,count),end=bucketStart(i+1,players.length,count);
    const rows=players.slice(start,end).map(sections);
    const columns=fields.map(name=>rows.map(row=>row[name]));
    const hashes=columns.map((column,index)=>index===2&&column.every(value=>value===null)?'0':checksum(JSON.stringify(column)));
    const stamp=hashes.join('.');
    stamps.push(stamp);
    if(!sameMembers||stamp===before.buckets[i])continue;
    const old=before.buckets[i].split('.'),changed=[];
    let mask=0;
    for(let j=0;j<fields.length;j++)if(hashes[j]!==old[j]){
      mask|=1<<j;
      changed.push(columns[j]);
    }
    edits.push([i,stamp,mask,...changed]);
  }
  if(!sameMembers)return {players,rosterBase:makeToken(key,stamps)};
  return {rosterDelta:{from:checksum(previous),edits}};
}

// Compare to the last successfully applied snapshot, never to a sent request.
// apply() returns null on a baseline mismatch; the next request asks for a full roster.
export function createRosterWire(){
  let players=[],baseline;
  function reset(){players=[];baseline=undefined;}
  function invalid(){reset();return null;}
  function apply(packet){
    if(Array.isArray(packet?.players)){
      players=packet.players;
      const next=unpack(packet.rosterBase);
      baseline=next?.key===rosterKey(players)&&next.buckets.length===Math.min(players.length,bucketLimit)?packet.rosterBase:undefined;
      return players;
    }
    const delta=packet?.rosterDelta,parts=unpack(baseline);
    if(!parts||delta?.from!==checksum(baseline)||!Array.isArray(delta.edits))return invalid();
    if(!delta.edits.length)return players;
    const next=players.slice(),count=parts.buckets.length;
    for(const edit of delta.edits){
      if(!Array.isArray(edit))return invalid();
      const [index,stamp,mask,...columns]=edit;
      if(!Number.isInteger(index)||index<0||index>=count||typeof stamp!=='string'||!Number.isInteger(mask)||mask<=0||mask>7)return invalid();
      const start=bucketStart(index,next.length,count),end=bucketStart(index+1,next.length,count);
      let col=0;
      const revised=fields.map((name,bit)=>mask&(1<<bit)?columns[col++]:undefined);
      if(columns.length!==col||columns.some(values=>!Array.isArray(values)||values.length!==end-start))return invalid();
      for(let j=start;j<end;j++){
        const old=next[j],row=sections(old);
        for(let f=0;f<fields.length;f++)if(revised[f])row[fields[f]]=revised[f][j-start];
        next[j]={...row.motion,...row.profile,id:old.id,...(row.traffic?{traffic:row.traffic}:{})};
      }
      parts.buckets[index]=stamp;
    }
    players=next;baseline=makeToken(parts.key,parts.buckets);
    return players;
  }
  return {baseline:()=>baseline,apply,reset};
}
