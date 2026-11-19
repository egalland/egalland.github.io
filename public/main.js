import {weaponList,starterWeapons} from './weapon-catalog.js';
import {installHudEditor} from './hud-editor.js';
import {installKikalmoLink} from './kikalmo-link.js';
import {createWanted,wantedRules,wantedThresholds} from './wanted.js';
import {attachSectorTravel} from './sector-travel.js';
import {createGame} from './game.js';
import {createNet} from './net.js';
import {createPanels} from './panels.js';
import {drawItemIcon} from './sprites.js';
import {portrait} from './portrait.js';
import {drawBrand} from './brand.js';
import {renderIcons,icon} from './icons.js';

const $=selector=>document.querySelector(selector);
const read=(key,defaultValue)=>{try{return localStorage.getItem('maillecity.'+key)??defaultValue;}catch{return defaultValue;}};
const write=(key,value)=>{try{localStorage.setItem('maillecity.'+key,value);}catch{}};
const defaultNames=['Renard','Filou','Roussi','Ficelle','Moka','Capucine','Noisette','Fauve'];
function guestName(){return defaultNames[Math.floor(Math.random()*defaultNames.length)]+' '+String(Math.floor(Math.random()*900)+100);}
const name=read('name',guestName());
write('name',name);
const weapons=weaponList.map(({id,name})=>[id,name]);
const shortcut=i=>i<9?String(i+1):i===9?'0':'';
const pursuitKey='maillecity.pursuit.v1';
function loadPursuit(){
  try{
    const entry=JSON.parse(sessionStorage.getItem(pursuitKey)||'null');
    if(!entry || !Number.isFinite(entry.savedAt))return null;
    const elapsed=Math.max(0,(Date.now()-entry.savedAt)/1000);
    return createWanted(entry.snapshot,-elapsed).snapshot(0);
  }catch{return null;}
}
const vitalityKey='maillecity.vitality.v1';
function loadVitality(){try{return JSON.parse(sessionStorage.getItem(vitalityKey)||'null');}catch{return null;}}
const loadout=weapons.map(([id])=>id).filter(id=>starterWeapons.includes(id)||read('arsenal.'+id,'0')==='1');
function saveLoadout(list) {
  for(const [id] of weapons) if(!starterWeapons.includes(id)&&list.includes(id))write('arsenal.'+id,'1');
}
const weaponNames=new Map(weapons);
const city=$('#city'),chat=$('#chat'),entry=$('#chatEntry');
let settingsSound=read('sound','false')==='true',panels=null,game=null, state={weapon:'pistol',ammo:12,health:100,wanted:0,wantedPoints:0,wantedProgress:0,ownedWeapons:loadout,district:'Place de l’Étoile'}, timer=0;
let touchAimEnabled=read('touchAimAssist','true')==='true';
let fireGesture=null;
const aimMarker=$('#touchAimMarker');
function showAimLock(point) {
  const visible=touchAimEnabled && fireGesture?.action==='touchFire' && point &&
    Number.isFinite(point.x) && point.x>=0 && point.x<=1 &&
    Number.isFinite(point.y) && point.y>=0 && point.y<=1;
  if(visible){
    aimMarker.style.left=(point.x*100)+'%';
    aimMarker.style.top=(point.y*100)+'%';
  }
  aimMarker.hidden=!visible;
}
function setTouchAim(enabled) {
  touchAimEnabled=Boolean(enabled);
  write('touchAimAssist',String(touchAimEnabled));
  game.setAimAssist(touchAimEnabled);
  if(!touchAimEnabled)showAimLock(null);
}
const controlsAreTouch=()=>matchMedia('(pointer:coarse),(max-width:670px)').matches;
renderIcons();
drawBrand($('#brandMark').getContext('2d'));
portrait($('#portrait').getContext('2d'),96);
function appendChat({name,text,system=false}){
  const log=$('#chatLog'),p=document.createElement('p');
  if(system){p.className='system';const dot=document.createElement('b');dot.textContent='◆';p.append(dot,document.createTextNode(text));}
  else{const author=document.createElement('b');author.textContent=name+' ';p.append(author,document.createTextNode(text));}
  log.append(p);
  while(log.children.length>60)log.firstElementChild.remove();
  log.scrollTop=log.scrollHeight;
}
function updateOnline(status,players){
  $('#online').dataset.status=status;
  $('#onlineLabel').textContent=status==='online'?players.length+' en ligne':status==='offline'?'Hors ligne':'Connexion…';
  $('#online').setAttribute('aria-label','Joueurs dans le monde, '+$('#onlineLabel').textContent);
  panels?.refresh();
}
let welcomed=false;
const net=createNet({name,onStatus:st=>{
  if(st==='online' && !welcomed){welcomed=true;appendChat({system:true,text:'Tu as rejoint le monde partagé.'});}
  updateOnline(st,net.players());
},onPlayers:players=>updateOnline(net.status,players),onChat:appendChat});
function notify(text){const box=$('#notice');box.textContent=text;box.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>box.classList.remove('show'),2800);}
function focusGame(){if(chat.contains(document.activeElement))document.activeElement.blur();city.focus({preventScroll:true});}
function selectWeapon(id){game?.selectWeapon(id);focusGame();}
let editor=null;
const buttons=new Map();
const pageSize=5;
let page=0,lastEquipped='';
const totalPages=Math.ceil(weapons.length/pageSize);
function showSlots(target){
  page=Math.max(0,Math.min(totalPages-1,target));
  weapons.forEach(([id],i)=>{buttons.get(id).hidden=Math.floor(i/pageSize)!==page;});
  $('#prevSlots').disabled=page===0;$('#nextSlots').disabled=page===totalPages-1;
}
$('#prevSlots').onclick=()=>showSlots(page-1);$('#nextSlots').onclick=()=>showSlots(page+1);

let lastWantedEvent=null,feedbackTimer=0;
weapons.forEach(([id,label],i)=>{
  const b=document.createElement('button');b.className='slot';b.dataset.weapon=id;b.title=label+' ('+(i+1)+')';b.setAttribute('aria-label',label);
  const num=document.createElement('span');num.className='slot-n';num.textContent=shortcut(i);
  const c=document.createElement('canvas');c.width=c.height=36;c.setAttribute('aria-hidden','true');drawItemIcon(c.getContext('2d'),id,0,0,36);
  const ammo=document.createElement('small');ammo.className='ammo';
  const lock=document.createElement('i');lock.className='slot-lock';lock.innerHTML=icon('lock');lock.hidden=true;
  b.append(num,c,lock,ammo);$('#slots').append(b);buttons.set(id,b);b.onclick=()=>{if(state.ownedWeapons.includes(id))selectWeapon(id);else panels?.open('weapons',id);};
});
function showWanted() {
  const stars=state.wanted, points=Math.floor(state.wantedPoints||0);
  const next=wantedThresholds[stars];
  const progress=Math.round(100*Math.max(0,Math.min(1,state.wantedProgress||0)));
  const label='Indice de recherche, '+stars+' étoile'+(stars>1?'s':'')+' sur 5';
  const detail=next ? points+' / '+next+' points' : 'Niveau maximal';
  $('#stars div').style.clipPath='inset(0 '+(100-20*stars)+'% 0 0)';
  $('#stars').setAttribute('aria-label',label);
  $('#wantedRatio').textContent=next?points+'/'+next:'MAX';
  const meter=$('#wantedMeter');
  meter.title=next?detail+' pour la prochaine étoile':detail;
  meter.setAttribute('aria-valuemin','0');
  meter.setAttribute('aria-valuemax','100');
  meter.setAttribute('aria-valuenow',String(progress));
  meter.setAttribute('aria-valuetext',detail);
  meter.firstElementChild.style.transform='scaleX('+Math.max(0,Math.min(1,state.wantedProgress||0))+')';
  const event=state.wantedEvent;
  if(event && event.id!==lastWantedEvent && wantedRules[event.action]){
    lastWantedEvent=event.id;
    const box=$('#wantedFeedback');
    box.textContent='+'+event.points.toLocaleString('fr-FR',{maximumFractionDigits:1})+' · '+wantedRules[event.action].label;
    box.hidden=false;clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>box.hidden=true,2400);
  }
}
let seenLifeEvent=null;
function showLife(){
  const max=state.maxHealth||100,hp=Math.max(0,Math.min(max,Math.ceil(state.health))),life=state.lifeState||'healthy';
  const meter=$('#healthMeter');
  meter.setAttribute('aria-valuemax',String(max));meter.setAttribute('aria-valuenow',String(hp));
  meter.dataset.life=life;$('#hpBar').style.width=(hp/max*100)+'%';$('#hpNum').textContent=String(hp);
  const kits=state.medkits??1,canHeal=Boolean(state.canHeal);
  const label='Utiliser une trousse de secours · '+kits+' disponible'+(kits>1?'s':'');
  for(const control of [$('#heal'),$('#healHud')]){control.disabled=!canHeal;control.setAttribute('aria-label',label);control.title=label+' (H)';}
  $('#kitCount').textContent=String(kits);
  const down=life==='down';
  $('#koNotice').hidden=!down;
  if(down)$('#reviveTimer').textContent='Réapparition dans '+Math.ceil(state.downSeconds||0)+' s';
  const event=state.lifeEvent;
  if(event && event.id!==seenLifeEvent){
    seenLifeEvent=event.id;
    if(event.kind==='heal')notify('Soins · +'+Math.ceil(event.amount)+' PV');
    if(event.kind==='revive')notify('Tu es sur pied.');
  }
}
function onState(next){
  state={...state,...next};
  $('#district').textContent=state.district;
  const street=state.street||'';
  $('#street').textContent=street===state.district?'':street;
  $('#driveHud').hidden=!state.inVehicle;
  $('#carSpeed').textContent=(state.speed||0)+' km/h';
  const ride=$('#ride');
  ride.classList.toggle('near',Boolean(state.inVehicle||state.nearVehicle));
  ride.setAttribute('aria-label',state.inVehicle?'Sortir du véhicule':'Monter dans un véhicule');
  showLife();
  showWanted();
  $('#weaponLabel').textContent=weaponNames.get(state.weapon)||'';
  const owned=new Set(state.ownedWeapons||starterWeapons);
  $('#ownedCount').textContent=owned.size+'/'+weapons.length;
  for(const [i,[id,label]] of weapons.entries()){
    const button=buttons.get(id),active=id===state.weapon,locked=!owned.has(id);
    button.classList.toggle('locked',locked);button.classList.toggle('active',active);
    button.setAttribute('aria-label',locked?label+' à trouver':label);
    button.setAttribute('aria-pressed',String(active));button.title=locked?label+' · À trouver sur la carte':label+(shortcut(i)?' ('+shortcut(i)+')':'');
    button.querySelector('.slot-lock').hidden=!locked;
    button.querySelector('.ammo').textContent=active?String(state.ammo??''):'';
  }
  if(state.weapon!==lastEquipped){lastEquipped=state.weapon;showSlots(Math.floor(weapons.findIndex(([id])=>id===lastEquipped)/pageSize));}
  const hint=$('#pickupHint'),drop=state.nearPickup;
  hint.hidden=!drop;
  if(drop)hint.textContent=drop.online===false?'Ramassage disponible à la reconnexion':weaponNames.get(drop.weapon)+' · '+Math.max(0,Math.round(drop.distance))+' m';

}
function setName(value){const clean=net.setName(value);write('name',clean);$('#playerName').textContent=clean;}
function setSound(value){settingsSound=Boolean(value);write('sound',String(settingsSound));game?.setSound(settingsSound);const sound=$('#sound');sound.setAttribute('aria-pressed',String(settingsSound));const label=settingsSound?'Couper le son':'Activer le son';sound.title=label;sound.setAttribute('aria-label',label);sound.querySelector('i').innerHTML=icon(settingsSound?'volume':'volumeOff');}
$('#playerName').textContent=name;
game=createGame({canvas:city,minimap:$('#minimap'),net,onState,onNotice:notify,onAimLock:showAimLock,loadout,onLoadoutChange:saveLoadout,initialPursuit:loadPursuit(),initialVitality:loadVitality()});
installKikalmoLink({game,net,notify});
function openAvatar(){window.dispatchEvent(new Event('kikalmo:open'));}
$('#openAvatar').onclick=openAvatar;
$('#healHud').onclick=()=>game.action('heal');
$('#heal').onclick=()=>game.action('heal');
editor=installHudEditor({scene:$('#scene'),onEdit:()=>{
  if(panels?.isOpen())panels.close();stopStick();releaseFire();game.setPaused(true);
},onFinish:()=>{game.setPaused(false);focusGame();}});
$('#editHud').onclick=()=>editor.open();
panels=createPanels({game,editLayout:()=>editor.open(),openAvatar,net,getState:()=>({...state,name:net.name}),selectWeapon,setName,setSound,getSound:()=>settingsSound,setTouchAim,getTouchAim:()=>touchAimEnabled,notify,returnFocus:focusGame});
onState(state);setSound(settingsSound);game.setAimAssist(touchAimEnabled);
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{if(document.activeElement===entry)entry.blur();panels.open(b.dataset.panel);}));
$('#playNav').onclick=()=>{if(panels.isOpen())panels.close();chat.classList.remove('mobile-open');focusGame();};
$('#sound').onclick=()=>setSound(!settingsSound);
function openChat(){if(panels.isOpen())panels.close();chat.classList.add('mobile-open');chat.classList.remove('collapsed');$('#chatToggle').setAttribute('aria-expanded','true');entry.focus({preventScroll:true});}
$('#chatKey').onclick=openChat;$('#chatMobile').onclick=()=>{if(chat.classList.contains('mobile-open')){chat.classList.remove('mobile-open');focusGame();}else openChat();};
$('#chatToggle').onclick=()=>{if(controlsAreTouch()){chat.classList.remove('mobile-open');focusGame();return;}chat.classList.toggle('collapsed');$('#chatToggle').setAttribute('aria-expanded',String(!chat.classList.contains('collapsed')));};
$('#chatForm').onsubmit=e=>{e.preventDefault();const value=entry.value.trim();if(!value)return;if(net.sendChat(value)){entry.value='';focusGame();}else notify('Le chat mondial sera disponible à la reconnexion.');};
window.addEventListener('keydown',e=>{
  if(editor?.intercept(e))return;
  if(panels.handleKey(e,'down')){e.stopImmediatePropagation();return;}
  if(e.target===entry){if(e.key==='Escape'){e.preventDefault();chat.classList.remove('mobile-open');focusGame();}return;}
  if(e.altKey||e.metaKey||e.ctrlKey||e.repeat)return;
  if(e.key.toLowerCase()==='t'){e.preventDefault();e.stopImmediatePropagation();openChat();return;}
  const digit=/^(?:Digit|Numpad)([0-9])$/.exec(e.code);
  if(digit){const slot=weapons[(Number(digit[1])||10)-1];if(slot && state.ownedWeapons.includes(slot[0])){e.preventDefault();selectWeapon(slot[0]);}}
},true);
window.addEventListener('keyup',e=>{if(editor?.intercept(e))return;if(panels.handleKey(e,'up'))e.stopImmediatePropagation();},true);
const stick=$('#stick');let finger=null, stickSprint=false;
function moveStick(e){const rect=stick.getBoundingClientRect(),radius=rect.width*.36,dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2;
 const length=Math.hypot(dx,dy);const factor=length>radius?radius/length:1;stick.querySelector('span').style.transform='translate('+dx*factor+'px,'+dy*factor+'px)';game.setMove(dx*factor/radius,dy*factor/radius);
 const sprint=!state.inVehicle && length>radius*1.08;
 if(sprint!==stickSprint){stickSprint=sprint;game.action('sprint',sprint);}
}
stick.onpointerdown=e=>{e.preventDefault();finger=e.pointerId;stick.setPointerCapture(finger);moveStick(e);};
stick.onpointermove=e=>{if(e.pointerId===finger)moveStick(e);};
function stopStick(){if(stickSprint){stickSprint=false;game.action('sprint',false);}finger=null;stick.querySelector('span').style.transform='';game.setMove(0,0);}
stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=stopStick;
$('#recenter').onpointerdown=e=>{e.preventDefault();game.action('recenter');};
$('#ride').onpointerdown=e=>{e.preventDefault();game.action('vehicle');};
const fire=$('#fire');
fire.onpointerdown=e=>{
  if(fireGesture || e.button!==0)return;
  e.preventDefault();
  fire.setPointerCapture(e.pointerId);
  fireGesture={id:e.pointerId,x:e.clientX,y:e.clientY,action:e.pointerType==='touch'?'touchFire':'fire'};
  game.action(fireGesture.action,true);
};
fire.onpointermove=e=>{
  if(fireGesture?.id!==e.pointerId)return;
  const dx=e.clientX-fireGesture.x,dy=e.clientY-fireGesture.y,length=Math.hypot(dx,dy);
  if(length>6)game.setAim(dx/length,dy/length);
  else game.setAim(0,0);
};
function releaseFire(e) {
  if(!fireGesture || (e?.pointerId!==undefined && e.pointerId!==fireGesture.id))return;
  const {action}=fireGesture;
  fireGesture=null;
  game.action(action,false);
  game.setAim(0,0);
  showAimLock(null);
}
fire.onpointerup=fire.onpointercancel=fire.onlostpointercapture=releaseFire;
window.addEventListener('blur',()=>{stopStick();releaseFire();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseFire();});
city.addEventListener('pointerdown',()=>{if(controlsAreTouch())chat.classList.remove('mobile-open');});
window.addEventListener('pagehide',()=>{
  try{
    const vitals=game.getVitalitySnapshot();
    sessionStorage.setItem(vitalityKey,JSON.stringify(vitals));
    const snapshot=game.getPursuitSnapshot();
    if(snapshot.points>0)sessionStorage.setItem(pursuitKey,JSON.stringify({savedAt:Date.now(),snapshot}));
    else sessionStorage.removeItem(pursuitKey);
  }catch{}
});
window.addEventListener('pageshow',e=>{if(e.persisted)net.start();});
attachSectorTravel(game,net,$('#sectorEdge'));
net.start();
$('#loadScene').hidden=true;
