import {sectorInfo} from './paris-world.js';
import {worldURL} from './world-link.js';
import {areaAt} from './grand-paris.js';

const transferKey='maillecity.travel.v1';
export function attachSectorTravel(game,net,button) {
  const current=new URL(location.href);
  const key=url=>[url.searchParams.get('lon'),url.searchParams.get('lat')].join('|');
  try {
    const raw=sessionStorage.getItem(transferKey);
    sessionStorage.removeItem(transferKey);
    const transfer=raw&&JSON.parse(raw);
    const previousKey=typeof transfer?.key==='string'?transfer.key.split('|').slice(0,2).join('|'):null;
    if(previousKey===key(current)&&Date.now()-transfer.at<180000)game.restoreTravelState(transfer.state);
    else if(current.searchParams.get('halte'))game.travel(current.searchParams.get('halte'));
  } catch { /* Browser storage can be disabled. The sector has its own street spawn. */ }
  let next=null;
  function checkEdge() {
    if(document.hidden||!game.available)return;
    const p=game.getPosition(),info=sectorInfo(p.x,p.y);
    next=null;
    if(info.distanceToEdge<65 && info.closest) {
      const x=info.closest.x+info.outward.x*320,y=info.closest.y+info.outward.y*320;
      const lon=2.25+x/73190,lat=48.88-y/111320,area=areaAt(lon,lat);
      if(area)next={lon:lon.toFixed(5),lat:lat.toFixed(5),name:area.name};
    }
    button.hidden=!next;
    if(next)button.textContent='Continuer vers '+next.name+' →';
  }
  button.onclick=()=>{
    if(!next)return;
    const dest=worldURL(location.href);dest.searchParams.delete('halte');
    dest.searchParams.set('lon',next.lon);dest.searchParams.set('lat',next.lat);dest.searchParams.set('lieu',next.name);
    try{sessionStorage.setItem(transferKey,JSON.stringify({key:key(dest),at:Date.now(),state:game.exportTravelState()}));}catch{}
    net.stop();location.assign(dest.href);
  };
  checkEdge();
  let tick=setInterval(checkEdge,420);
  window.addEventListener('pagehide',()=>clearInterval(tick));
  window.addEventListener('pageshow',e=>{if(e.persisted){checkEdge();tick=setInterval(checkEdge,420);}});
}
