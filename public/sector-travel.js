import {sectorInfo} from './paris-world.js';
import {preloadTravelSector} from './paris-data.js';
import {worldURL} from './world-link.js';
import {adjacentSector,atSectorCut} from './sector-crossing.js';
import {clearSectorTransfer,readSectorTransfer,retreatFromSector,storeSectorTransfer} from './sector-transfer.js';

export function crossingURL(href,next){
  const url=worldURL(href);
  url.hash='';
  for(const param of ['lon','lat','lieu','halte'])url.searchParams.delete(param);
  if(next.key!=='core'){
    url.searchParams.set('lon',next.lon.toFixed(5));url.searchParams.set('lat',next.lat.toFixed(5));url.searchParams.set('lieu',next.name);
  }
  return url;
}

export function createRoadCrossing({load,commit,show,clock=Date.now}){
  let last=null,job=null,ready=null,failed=null,retryAt=0,crossing=false;
  function tick(position,edge,motion){
    if(crossing)return;
    const next=adjacentSector(position,edge,motion,last);
    if(!next){show('');return;}
    last=next;
    const close=atSectorCut(edge,motion);
    if(ready?.key===next.key){
      show('');
      if(close){
        crossing=commit(next);
        if(!crossing)show('La reprise de position est indisponible sur ce navigateur.');
      }
      return;
    }
    if(!job&&(failed!==next.key||clock()>=retryAt)){
      job=next;
      void load(next).then(()=>{
        ready=next;failed=null;
      },()=>{
        failed=next.key;retryAt=clock()+6500;
      }).finally(()=>{job=null;});
    }
    show(close?(failed===next.key&&!job?'Cartographie indisponible. Nouvel essai automatique…':'Chargement de '+next.name+'…'):'');
  }
  return {tick};
}

export function attachSectorTravel(game,net,status,transfer=readSectorTransfer()) {
  const current=new URL(location.href);
  if(transfer){
    const restored=game.restoreTravelState(transfer.state,{clearance:transfer.target&&!transfer.returning?8:55});
    if(!restored){
      const previous=retreatFromSector(current,transfer);
      if(previous){location.replace(previous);return false;}
    }
    clearSectorTransfer();
    if(restored&&transfer.target){
      status.textContent=transfer.returning?'Passage encombré. Position précédente retrouvée.':'Entrée dans '+transfer.name;
      status.hidden=false;
    }
  }else if(current.searchParams.get('halte'))game.travel(current.searchParams.get('halte'));
  const arrived=Boolean(transfer?.target),now=Date.now(),landing=game.getPosition();
  let turnedBack=Boolean(transfer?.returning);
  const show=text=>{
    if(status.textContent!==text)status.textContent=text;
    status.hidden=!text;
  };
  const controller=createRoadCrossing({
    load:preloadTravelSector,show,
    commit(next){
      const url=crossingURL(current.href,next);
      if(url.href===current.href)return false;
      const state=game.exportTravelState();
      if(!storeSectorTransfer(url,{name:next.name,state,from:current.href,
        previousName:game.getPosition().district,identity:net.getTransferIdentity?.()}))return false;
      const loading=document.getElementById('loadScene');
      loading.classList.add('sector-crossing');
      document.getElementById('loadingText').textContent='Entrée dans '+next.name+'…';
      loading.hidden=false;
      net.stop({preservePresence:true});
      // Give the short transition one paint before replacing the document.
      requestAnimationFrame(()=>requestAnimationFrame(()=>location.replace(url.href)));
      return true;
    }
  });
  function checkEdge(){
    if(document.hidden||!game.available||arrived&&Date.now()-now<1250)return;
    const p=game.getPosition(),motion=game.getRoadMotion();
    if(turnedBack){
      if(motion&&Math.hypot(p.x-landing.x,p.y-landing.y)<14)return;
      turnedBack=false;
    }
    controller.tick(p,sectorInfo(p.x,p.y),motion);
  }
  checkEdge();
  let tick=setInterval(checkEdge,100);
  window.addEventListener('pagehide',()=>clearInterval(tick));
  window.addEventListener('pageshow',e=>{if(e.persisted){checkEdge();tick=setInterval(checkEdge,100);}});
}
