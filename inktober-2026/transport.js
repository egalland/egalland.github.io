(() => {
 'use strict';
 const owner='egalland',repo='egalland.github.io',branch='master',file='inktober-2026/calendar.json';
 const endpoint=`/repos/${owner}/${repo}/contents/${file}`,store=window.githubCalendarStore;
 let token='',state=store.empty(),writing=false,loaded=false,authEpoch=0;
 const $=id=>document.getElementById(id),dialog=$('github-login'),status=$('connection-status');
 let opened=new Set();try{opened=new Set(JSON.parse(localStorage.getItem('inktober-2026-opened-v1')||'[]').filter(n=>Number.isInteger(n)&&n>=1&&n<=31));}catch{}
 const connected=()=>!!token;
 function update(){document.documentElement.classList.toggle('account-connected',connected());$('connect-calendar').textContent=connected()?'Compte GitHub':'Connecter GitHub';$('disconnect-github').hidden=!connected();status.textContent=connected()?'Connecté à egalland · Les enregistrements créent un commit GitHub.':'Calendrier public · Connectez GitHub pour le modifier.';window.dispatchEvent(new Event('github-calendar-auth'));}
 async function request(path,{method='GET',body,credential=token}={}){
  if(!path.startsWith('/repos/egalland/')&&path!=='/user')throw new Error('Adresse GitHub non autorisée.');
  const response=await fetch('https://api.github.com'+path,{method,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10',...(credential?{Authorization:'Bearer '+credential}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
  if(response.status===204)return {};let data;try{data=await response.json();}catch{throw new Error('Réponse GitHub illisible.');}
  if(!response.ok){const error=new Error(response.status===401?'Jeton GitHub expiré ou invalide.':response.status===403?'Accès refusé. Vérifiez les dépôts sélectionnés et les permissions du jeton.':response.status===409||response.status===422?'Le dépôt a changé ou refuse la modification. Actualisez les données puis réessayez ; votre brouillon reste dans le formulaire.':response.status===404?'Dépôt ou fichier introuvable. Vérifiez l’accès du jeton.':'GitHub ne peut pas terminer cette action. Réessayez.');error.status=response.status;throw error;}return data;
 }
 async function readLatest(credential=token){const data=await request(endpoint+'?ref='+encodeURIComponent(branch),{credential});return {value:store.decode(data.content),sha:data.sha};}
 function publicData(){const value=store.clone(state);for(const day of connected()?[]:opened){let row=value.days.find(r=>r.day===day);if(!row){row={day,opened:true};value.days.push(row);}row.opened=true;}return value;}
 function localOpen(day){opened.add(day);try{localStorage.setItem('inktober-2026-opened-v1',JSON.stringify([...opened]));}catch{}return publicData().days.find(r=>r.day===day);}
 async function save(path,patch){
  if(!connected())throw new Error('Connectez GitHub pour enregistrer vos modifications.');if(writing)throw new Error('Un enregistrement est déjà en cours.');
  writing=true;$('disconnect-github').disabled=true;const credential=token,baseline=store.clone(state);
  try{
   const latest=await readLatest(credential),next=store.merge(latest.value,baseline,path,patch);
   const day=path.split('/').at(-1),message=path==='/api/settings'?'Inktober: update hourly rates':`Inktober: update day ${day}`;
   const result=await request(endpoint,{method:'PUT',credential,body:{message,content:store.encode(next),sha:latest.sha,branch}});
   state=next;loaded=true;const link=$('latest-commit');link.href=result.commit.html_url;link.textContent='Dernier enregistrement GitHub';link.hidden=false;
   return path==='/api/settings'?store.clone(state.settings):store.clone(state.days.find(r=>r.day===Number(day)));
  }finally{writing=false;$('disconnect-github').disabled=false;}
 }
 window.inktoberTransport={get connected(){return connected();},github:request,
  async api(path,body){
   if(path==='/api/calendar'&&!body){
    if(connected()){state=(await readLatest()).value;loaded=true;}
    else if(!loaded){const response=await fetch('/inktober-2026/calendar.json',{cache:'no-store',credentials:'omit'});if(!response.ok)throw new Error('Le calendrier ne peut pas être chargé. Réessayez.');state=store.parse(await response.json());loaded=true;}
    return publicData();
   }
   const m=path.match(/^\/api\/days\/([1-9]|[12][0-9]|3[01])$/);
   if(m&&body&&Object.keys(body).length===1&&body.opened===true&&!connected())return localOpen(Number(m[1]));
   if(body&&(m||path==='/api/settings'))return save(path,body);throw new Error('Action inconnue.');
  }
 };
 $('connect-calendar').addEventListener('click',()=>{if(connected()){$('github-login-status').textContent='Compte egalland connecté. Le jeton sera effacé à la fermeture ou à la déconnexion.';}else $('github-login-status').textContent='';dialog.showModal();$('github-token').focus();});
 $('close-github-login').addEventListener('click',()=>dialog.close());
 $('github-login-form').addEventListener('submit',async event=>{
  event.preventDefault();const candidate=$('github-token').value.trim(),epoch=++authEpoch;$('github-token').value='';$('github-login-status').textContent='Vérification du compte et du dépôt…';$('authorize-github').disabled=true;
  try{
   if(!/^github_pat_[A-Za-z0-9_]{20,}$/.test(candidate))throw new Error('Utilisez un jeton personnel fine-grained créé pour vos dépôts sélectionnés.');
   const user=await request('/user',{credential:candidate});if(user.id!==31864638||user.login.toLowerCase()!==owner)throw new Error('L’édition est réservée au compte egalland.');
   const repository=await request(`/repos/${owner}/${repo}`,{credential:candidate});if(!repository.permissions?.push)throw new Error('Ce compte ne peut pas modifier ce dépôt.');
   const latest=await readLatest(candidate);if(epoch!==authEpoch)return;state=latest.value;loaded=true;token=candidate;update();dialog.close();$('retry-load').click();
  }catch(error){if(epoch===authEpoch)$('github-login-status').textContent=error.message;}
  finally{$('authorize-github').disabled=false;}
 });
 $('disconnect-github').addEventListener('click',()=>{if(writing)return;token='';authEpoch++;update();$('retry-load').click();});
 dialog.addEventListener('close',()=>{$('github-token').value='';});
 addEventListener('pagehide',()=>{token='';authEpoch++;$('github-token').value='';});addEventListener('pageshow',event=>{if(event.persisted)update();});update();
})();
