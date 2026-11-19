import {worldURL} from './world-link.js';

const canonical=worldURL(location.href);
if(canonical.href!==location.href)history.replaceState(history.state,'',canonical.href);
// The loading scene remains interactive if a module fails on a slow mobile connection.
const retry=document.getElementById('retryLoad');
retry.onclick=()=>location.reload();
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
  }
  retry.hidden=false;
  document.getElementById('loadScene').classList.add('failed');
}
