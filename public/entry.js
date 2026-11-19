import {worldURL} from './world-link.js';
import {readSectorTransfer,retreatFromSector} from './sector-transfer.js';

const canonical=worldURL(location.href);
// Restore the sector before its geography modules load on a same-tab Kikalmo return.
if(canonical.hash.startsWith('#kikalmo=')){
  try{
    const packet=JSON.parse(new URLSearchParams(canonical.hash.slice(1)).get('kikalmo'));
    const last=JSON.parse(sessionStorage.getItem('maillecity.kikalmo.request.v1.route')||'null');
    const pending=JSON.parse(localStorage.getItem('maillecity.kikalmo.request.v1')||'null');
    if(last?.state===packet?.state && pending?.state===packet?.state && Date.now()-pending.created<600000){
      const prior=new URL(last.route,location.origin);
      if(prior.origin===location.origin&&prior.pathname==='/')canonical.search=prior.search;
    }
  }catch{}
}
if(canonical.href!==location.href)history.replaceState(history.state,'',canonical.href);
// The loading scene remains interactive if a module fails on a slow mobile connection.
const retry=document.getElementById('retryLoad');
retry.onclick=()=>location.reload();
const crossing=readSectorTransfer(canonical);
if(crossing?.target){
  document.getElementById('loadScene').classList.add('sector-crossing');
  document.getElementById('loadingText').textContent='Entrée dans '+crossing.name+'…';
}
try {
  await import('./main.js');
} catch(error) {
  console.error('Maille City startup:',error);
  const text=document.getElementById('loadingText');
  const isGPU=/webgl|context|graphic|gpu/i.test(String(error));
  text.textContent=isGPU?'Le rendu 3D nécessite WebGL 2. Active l’accélération graphique ou essaie un navigateur compatible.':'Le chargement de la ville a été interrompu.';
  const url=new URL(location.href);
  if(url.searchParams.has('lon')){
    text.textContent='Le secteur demandé n’a pas pu être chargé. Tu peux réessayer ou revenir sur l’axe du Louvre à La Défense.';
    const back=document.getElementById('returnToCity');
    for(const k of ['lon','lat','lieu','halte'])url.searchParams.delete(k);
    back.href=url.href;back.hidden=false;
    if(crossing?.from&&!crossing.returning){
      back.textContent='Reprendre dans le secteur précédent';
      back.onclick=e=>{
        const previous=retreatFromSector(canonical,crossing);
        if(previous){e.preventDefault();location.replace(previous);}
      };
    }
  }
  retry.hidden=false;
  document.getElementById('loadScene').classList.add('failed');
}
