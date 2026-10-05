(() => {
 'use strict';
 const origin='https://inktober-2026.emmanuel-galland117.chatgpt.site';
 const channel='inktober-saved-calendar-v1',requests=new Map(),preview=new Map();
 let popup=null,session='',connected=false,sequence=0,timer=null;
 const button=document.getElementById('connect-calendar'),status=document.getElementById('connection-status');
 function update(){document.documentElement.classList.toggle('account-connected',connected);button.textContent=connected?'Rouvrir la connexion':'Connecter ma sauvegarde';status.textContent=connected?'Votre sauvegarde est connectée. Gardez l’onglet de connexion ouvert.':'Connectez votre compte pour retrouver vos apps, notes et statistiques.';}
 function disconnect(){connected=false;for(const pending of requests.values()){clearTimeout(pending.timeout);pending.reject(new Error('La connexion à votre sauvegarde a été fermée. Cliquez sur « Connecter ma sauvegarde ».'));}requests.clear();update();}
 function request(path,body){return new Promise((resolve,reject)=>{const id=String(++sequence),timeout=setTimeout(()=>{requests.delete(id);reject(new Error('La sauvegarde ne répond pas. Vérifiez l’onglet de connexion puis réessayez.'));},20000);requests.set(id,{resolve,reject,timeout});popup.postMessage({channel,session,type:'request',id,path,method:body?'PATCH':'GET',body},origin);});}
 window.inktoberTransport={
  async api(path,body){
   if(connected&&popup&&!popup.closed)return request(path,body);
   if(connected)disconnect();
   if(path==='/api/calendar'&&!body)return {days:[...preview.values()],settings:{vibeRateCents:null,devRateCents:null}};
   if(/^\/api\/days\/[0-9]+$/.test(path)&&body&&Object.keys(body).length===1&&body.opened===true){const day=Number(path.split('/').at(-1)),row={day,opened:1,note:'',done:false,appUrl:'',appTitle:'',promptMinutes:null,chatgptMinutes:null,devMinutes:null};preview.set(day,row);return row;}
   throw new Error('Connectez votre sauvegarde pour enregistrer vos modifications.');
  }
 };
 button.addEventListener('click',()=>{
  if(popup&&!popup.closed){popup.focus();return;}
  disconnect();session=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
  popup=window.open(origin+'/github-bridge.html#session='+session,'inktober-account','popup,width=620,height=720');
  if(!popup){status.textContent='Autorisez la fenêtre de connexion, ou utilisez le calendrier sur Sites.';return;}
  status.textContent='Connectez votre sauvegarde dans la fenêtre qui vient de s’ouvrir.';
  if(timer)clearInterval(timer);timer=setInterval(()=>{if(!popup||popup.closed){clearInterval(timer);timer=null;disconnect();return;}popup.postMessage({channel,session,type:'ping'},origin);},1000);
 });
 addEventListener('message',event=>{
  const m=event.data;if(event.origin!==origin||event.source!==popup||!m||m.channel!==channel||m.session!==session)return;
  if(m.type==='ready'){if(!connected){connected=true;update();document.getElementById('retry-load').click();}return;}
  if(m.type==='closed'){disconnect();return;}
  if(m.type!=='response'||!requests.has(m.id))return;
  const pending=requests.get(m.id);requests.delete(m.id);clearTimeout(pending.timeout);if(m.error)pending.reject(new Error(m.error));else pending.resolve(m.data);
 });
 addEventListener('pagehide',()=>{if(timer)clearInterval(timer);disconnect();});
 update();
})();
