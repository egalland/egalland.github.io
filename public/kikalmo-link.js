import {portrait} from './portrait.js';
import {KIKALMO_ORIGIN,avatarProfile,checkAvatarReturn,connectionUrl} from './kikalmo-protocol.js';

const profileKey='maillecity.kikalmo.appearance.v1';
const flowKey='maillecity.kikalmo.request.v1';
const api=KIKALMO_ORIGIN+'/api/maille-avatar';
function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
function persist(key,value){try{if(value)localStorage.setItem(key,JSON.stringify(value));else localStorage.removeItem(key);}catch{}}

export function installKikalmoLink({game,notify}) {
  let profile=avatarProfile(stored(profileKey)),pending=stored(flowKey),popup=null,watch=0,checking=false;
  let portraitGeneration=0,lastRefresh=0,returnFocus=null;
  const dialog=document.createElement('dialog');
  dialog.className='kikalmo-link';dialog.setAttribute('aria-labelledby','link-title');
  dialog.innerHTML=`<button class="link-close" aria-label="Fermer">×</button><div class="link-eyebrow">KIKALMO × MAILLE CITY</div>
    <h2 id="link-title">Ton personnage Kikalmo</h2>
    <div class="link-summary"><canvas width="104" height="104" aria-hidden="true"></canvas>
      <div><strong class="link-name"></strong><span class="link-source"></span></div></div>
    <p class="link-explain"></p><p class="link-status" role="status"></p>
    <button class="link-primary"></button><button class="link-secondary" hidden>Continuer dans cet onglet</button>
    <button class="link-unlink" hidden>Délier ce personnage</button>`;
  document.body.append(dialog);
  const q=s=>dialog.querySelector(s);
  const badge=document.getElementById('portrait'),preview=q('canvas'),primary=q('.link-primary'),alternate=q('.link-secondary'),unlink=q('.link-unlink');
  function describe(){
    q('.link-name').textContent=profile?.name||'Renard de Maille City';
    q('.link-source').textContent=profile?.link?'Tenue liée':profile?'Tenue importée':'Personnage actuel';
    q('.link-explain').textContent=profile?.link?'Les changements de tenue enregistrés dans Kikalmo se retrouvent ici et sont visibles par les autres joueurs.':
      'Porte ta tenue Kikalmo dans les rues de Paris. Kikalmo te demandera de partager ton pseudo et ton apparence équipée.';
    primary.textContent=profile?'Relier une tenue depuis Kikalmo':'Lier mon avatar Kikalmo';
    unlink.hidden=!profile;
  }
  async function draw(){
    const serial=++portraitGeneration,targets=[badge,preview].filter(Boolean);
    if(!profile){for(const c of targets)portrait(c.getContext('2d'),c.width);return;}
    try{
      const {drawKikalmoPortrait}=await import('./kikalmo-avatar.js');
      const buffer=document.createElement('canvas');buffer.width=buffer.height=128;
      await drawKikalmoPortrait(buffer,profile.avatar);
      if(serial!==portraitGeneration)return;
      for(const c of targets){
        const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(buffer,0,0,c.width,c.height);
      }
    }catch{if(serial===portraitGeneration)q('.link-status').textContent='Le portrait est en cours de chargement.';}
  }
  function apply(value,save=true){
    profile=value;
    if(save)persist(profileKey,value);
    game.setAppearance(value?.avatar||null);
    badge?.setAttribute('aria-label',value?'Avatar Kikalmo de '+value.name:'Renard Kikalmo');
    describe();void draw();
  }
  function status(message){q('.link-status').textContent=message;}
  function restoreAfterReturn(){
    try{
      const previous=JSON.parse(sessionStorage.getItem(flowKey+'.route')||'null');
      sessionStorage.removeItem(flowKey+'.route');
      if(previous && previous.state===pending?.state && previous.route && previous.route.startsWith('/')&&!previous.route.startsWith('//')){
        const next=new URL(previous.route,location.origin);
        if(next.origin===location.origin && next.search!==location.search){location.replace(next.href);return;}
        if(previous.pose){
          const key=[next.searchParams.get('lon'),next.searchParams.get('lat')].join('|');
          sessionStorage.setItem('maillecity.travel.v1',JSON.stringify({key,at:Date.now(),state:previous.pose}));
        }
      }
    }catch{}
  }
  function accept(data,wasReturn){
    const flow=pending||stored(flowKey);
    const incoming=checkAvatarReturn(data,flow);if(!incoming)return false;
    apply(incoming);persist(flowKey,null);
    if(wasReturn)restoreAfterReturn();
    pending=null;alternate.hidden=true;clearInterval(watch);
    status('Personnage prêt.');notify?.('Tenue de '+incoming.name+' équipée.');
    if(dialog.open)dialog.close();
    return true;
  }
  function begin(mode){
    if(!pending||Date.now()-pending.created>600000){
      pending={state:crypto.randomUUID(),created:Date.now()};persist(flowKey,pending);
    }
    const url=connectionUrl(pending.state,mode);
    if(mode==='return'){
      try{sessionStorage.setItem(flowKey+'.route',JSON.stringify({state:pending.state,route:location.pathname+location.search,pose:game.exportTravelState?.()}));}catch{}
      location.assign(url);return;
    }
    popup=window.open(url,'maille-kikalmo-avatar','popup,width=540,height=730');
    alternate.hidden=false;
    status(popup?'Confirme la tenue dans la fenêtre Kikalmo.':'Tu peux continuer dans cet onglet.');
    if(!popup){begin('return');return;}
    clearInterval(watch);watch=setInterval(()=>{
      if(!popup||popup.closed){clearInterval(watch);if(pending)status('La fenêtre Kikalmo est fermée. Tu peux reprendre la liaison.');}
    },900);
  }
  window.addEventListener('message',e=>{
    if(e.origin!==KIKALMO_ORIGIN || !popup || e.source!==popup)return;
    if(accept(e.data,false))e.source.postMessage({type:'maille.avatar.ack',state:e.data.state},KIKALMO_ORIGIN);
  });
  window.addEventListener('storage',e=>{
    if(e.key!==profileKey)return;
    const next=avatarProfile(stored(profileKey));
    if(JSON.stringify(next)!==JSON.stringify(profile)){apply(next,false);if(next&&dialog.open)dialog.close();}
  });
  async function refresh(force=false){
    const link=profile?.link;
    if(!link||checking||document.hidden||(!force&&Date.now()-lastRefresh<25000))return;
    lastRefresh=Date.now();checking=true;
    try{
      const result=await fetch(api,{cache:'no-store',credentials:'omit',headers:{Authorization:'Bearer '+link},signal:AbortSignal.timeout(8500)});
      if(profile?.link!==link)return;
      if(result.status===404||result.status===410){
        apply(null);status('La liaison a expiré. Tu peux la renouveler.');return;
      }
      if(!result.ok)throw Error('sync');
      const data=await result.json();if(profile?.link!==link)return;
      const next=avatarProfile({...data,link});
      if(next&&JSON.stringify(next)!==JSON.stringify(profile))apply(next);
      if(next&&dialog.open)status('Tenue à jour.');
    }catch{if(dialog.open&&profile?.link===link)status('Dernière tenue conservée. Nouvelle tentative à la reconnexion.');}
    finally{checking=false;}
  }
  primary.onclick=()=>begin('popup');alternate.onclick=()=>begin('return');
  unlink.onclick=async()=>{
    const linked=profile?.link;
    if(linked){
      unlink.disabled=true;status('Dissociation du personnage…');
      try{
        const r=await fetch(api,{method:'DELETE',credentials:'omit',headers:{Authorization:'Bearer '+linked},signal:AbortSignal.timeout(8000)});
        if(!r.ok&&r.status!==404&&r.status!==410)throw Error('revoke');
      }catch{status('Kikalmo est indisponible. Réessaie pour révoquer la liaison.');return;}
      finally{unlink.disabled=false;}
      if(profile?.link!==linked)return;
    }
    pending=null;persist(flowKey,null);apply(null);status('Ton renard de Maille City est rééquipé.');
  };
  q('.link-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog && !q('.link-primary').contains(e.target)){
    const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  }});
  // Stop gameplay shortcuts while a native modal owns the keyboard. Tab and Escape stay native.
  const shield=e=>{if(dialog.open && !['Tab','Escape'].includes(e.key))e.stopPropagation();};
  dialog.addEventListener('keydown',shield);dialog.addEventListener('keyup',shield);
  dialog.addEventListener('close',()=>{game.setPaused(false);returnFocus?.focus?.({preventScroll:true});});
  window.addEventListener('kikalmo:open',()=>{
    if(dialog.open)return;
    returnFocus=document.activeElement;describe();status('');alternate.hidden=true;
    game.setPaused(true);dialog.showModal();primary.focus();void refresh(true);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
  window.addEventListener('online',()=>void refresh(true));
  const params=new URLSearchParams(location.hash.slice(1)),payload=params.get('kikalmo');
  apply(profile,false);
  if(payload){
    history.replaceState(history.state,'',location.pathname+location.search);
    try{if(!accept(JSON.parse(payload),true))notify?.('Liaison expirée. Ouvre ton portrait pour réessayer.');}catch{notify?.('Réponse Kikalmo illisible.');}
  }
  window.setInterval(()=>void refresh(),45000);void refresh();
}
