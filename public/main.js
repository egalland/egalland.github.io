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
const weapons=[['fist','Poings'],['pistol','Pistolet'],['smg','Mitraillette'],['shotgun','Fusil à pompe'],['yarn','Pelote']];
const city=$('#city'),chat=$('#chat'),entry=$('#chatEntry');
let settingsSound=read('sound','false')==='true',panels=null,game=null, state={weapon:'pistol',ammo:12,health:100,wanted:0,district:'Place de l’Étoile'}, timer=0;
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
const buttons=new Map();
weapons.forEach(([id,label],i)=>{
  const b=document.createElement('button');b.className='slot';b.dataset.weapon=id;b.title=label+' ('+(i+1)+')';b.setAttribute('aria-label',label);
  const num=document.createElement('span');num.className='slot-n';num.textContent=i+1;
  const c=document.createElement('canvas');c.width=c.height=36;c.setAttribute('aria-hidden','true');drawItemIcon(c.getContext('2d'),id,0,0,36);
  const ammo=document.createElement('small');ammo.className='ammo';
  b.append(num,c,ammo);$('#slots').append(b);buttons.set(id,b);b.onclick=()=>selectWeapon(id);
});
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
  $('#hpBar').style.width=state.health+'%';$('#hpNum').textContent=state.health;
  $('#stars div').style.clipPath='inset(0 '+(100-20*state.wanted)+'% 0 0)';
  $('#stars').setAttribute('aria-label','Indice de recherche '+state.wanted+' sur 5');
  $('#weaponLabel').textContent=weapons.find(w=>w[0]===state.weapon)?.[1]||'';
  buttons.forEach((b,id)=>{const active=id===state.weapon;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));b.querySelector('.ammo').textContent=active?String(state.ammo??''):'';});
}
function setName(value){const clean=net.setName(value);write('name',clean);$('#playerName').textContent=clean;}
function setSound(value){settingsSound=Boolean(value);write('sound',String(settingsSound));game?.setSound(settingsSound);const sound=$('#sound');sound.setAttribute('aria-pressed',String(settingsSound));const label=settingsSound?'Couper le son':'Activer le son';sound.title=label;sound.setAttribute('aria-label',label);sound.querySelector('i').innerHTML=icon(settingsSound?'volume':'volumeOff');}
$('#playerName').textContent=name;
game=createGame({canvas:city,minimap:$('#minimap'),net,onState,onNotice:notify});
panels=createPanels({game,net,getState:()=>({...state,name:net.name}),selectWeapon,setName,setSound,getSound:()=>settingsSound,notify,returnFocus:focusGame});
onState(state);setSound(settingsSound);
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{if(document.activeElement===entry)entry.blur();panels.open(b.dataset.panel);}));
$('#playNav').onclick=()=>{if(panels.isOpen())panels.close();chat.classList.remove('mobile-open');focusGame();};
$('#sound').onclick=()=>setSound(!settingsSound);
function openChat(){if(panels.isOpen())panels.close();chat.classList.add('mobile-open');chat.classList.remove('collapsed');$('#chatToggle').setAttribute('aria-expanded','true');entry.focus({preventScroll:true});}
$('#chatKey').onclick=openChat;$('#chatMobile').onclick=()=>{if(chat.classList.contains('mobile-open')){chat.classList.remove('mobile-open');focusGame();}else openChat();};
$('#chatToggle').onclick=()=>{if(controlsAreTouch()){chat.classList.remove('mobile-open');focusGame();return;}chat.classList.toggle('collapsed');$('#chatToggle').setAttribute('aria-expanded',String(!chat.classList.contains('collapsed')));};
$('#chatForm').onsubmit=e=>{e.preventDefault();const value=entry.value.trim();if(!value)return;if(net.sendChat(value)){entry.value='';focusGame();}else notify('Le chat mondial sera disponible à la reconnexion.');};
window.addEventListener('keydown',e=>{
  if(panels.handleKey(e,'down')){e.stopImmediatePropagation();return;}
  if(e.target===entry){if(e.key==='Escape'){e.preventDefault();chat.classList.remove('mobile-open');focusGame();}return;}
  if(e.altKey||e.metaKey||e.ctrlKey||e.repeat)return;
  if(e.key.toLowerCase()==='t'){e.preventDefault();e.stopImmediatePropagation();openChat();return;}
  const number=Number((/^(?:Digit|Numpad)([1-5])$/.exec(e.code)||[])[1]||0);if(number){e.preventDefault();selectWeapon(weapons[number-1][0]);}
},true);
window.addEventListener('keyup',e=>{if(panels.handleKey(e,'up'))e.stopImmediatePropagation();},true);
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
const fire=$('#fire');let aimStart=null;
fire.onpointerdown=e=>{e.preventDefault();fire.setPointerCapture(e.pointerId);aimStart=[e.clientX,e.clientY];game.action('fire',true);};
fire.onpointermove=e=>{if(!aimStart)return;const dx=e.clientX-aimStart[0],dy=e.clientY-aimStart[1],length=Math.hypot(dx,dy);if(length>5)game.setAim(dx/length,dy/length);};
const releaseFire=()=>{aimStart=null;game.action('fire',false);game.setAim(0,0);};
fire.onpointerup=fire.onpointercancel=fire.onlostpointercapture=releaseFire;
window.addEventListener('blur',()=>{stopStick();releaseFire();});
city.addEventListener('pointerdown',()=>{if(controlsAreTouch())chat.classList.remove('mobile-open');});
window.addEventListener('pageshow',e=>{if(e.persisted)net.start();});
attachSectorTravel(game,net,$('#sectorEdge'));
net.start();
$('#loadScene').hidden=true;
