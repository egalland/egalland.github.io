const key='maillecity.travel.v1';
const target=url=>[url.searchParams.get('lon'),url.searchParams.get('lat'),url.pathname].join('|');
const lifetime=180000;

export function readSectorTransfer(url=new URL(location.href)){
  try{
    const packet=JSON.parse(sessionStorage.getItem(key)||'null');
    if(!packet?.state||!Number.isFinite(packet.at)||Math.abs(Date.now()-packet.at)>lifetime)return null;
    if(packet.target)return packet.target===target(url)?packet:null;
    const old=typeof packet.key==='string'?packet.key.split('|').slice(0,2).join('|'):null;
    return old===target(url).split('|').slice(0,2).join('|')?packet:null;
  }catch{return null;}
}
export function storeSectorTransfer(url,data){
  try{
    sessionStorage.setItem(key,JSON.stringify({...data,target:target(url),at:Date.now()}));
    return true;
  }catch{return false;}
}
export function clearSectorTransfer(){
  try{sessionStorage.removeItem(key);}catch{}
}
export function retreatFromSector(current,transfer){
  if(!transfer?.from||transfer.returning)return null;
  const previous=new URL(transfer.from,current);
  if(previous.origin!==current.origin||previous.pathname!==current.pathname||target(previous)===target(current))return null;
  const saved=storeSectorTransfer(previous,{...transfer,name:transfer.previousName,returning:true});
  return saved?previous.href:null;
}
