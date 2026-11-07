export const QUICK_DESTINATIONS=['market-plus','kikalmo','maison','bodyos','atelier','about'];
export function preservesNativeMenu(target,{shiftKey=false,selection=''}={}){
 return shiftKey||Boolean(selection.trim())||Boolean(target?.closest?.('a,input,textarea,select,[contenteditable],dialog'));
}

/** One wheel shared by both views, with native links and a modal focus trap. */
export function createPortfolioMenu({getState,onTheme,onPause}){
 const abort=new AbortController(),on=(el,type,fn)=>el.addEventListener(type,fn,{signal:abort.signal});
 const menu=document.createElement('dialog');menu.id='portfolio-menu';menu.className='portfolio-orbital-menu';menu.setAttribute('aria-labelledby','portfolio-menu-title');
 menu.innerHTML='<div class="orbital-header"><h2 id="portfolio-menu-title">Explorer</h2><span>PROJETS & PARCOURS</span><button type="button" class="close-menu" aria-label="Fermer le menu">✕</button></div><nav class="orbital-map" aria-label="Projets et parcours"><svg class="navigation-wheel" viewBox="0 0 360 360" aria-label="Roue de navigation"></svg><a class="menu-center" href="#home" aria-label="Retour à l’accueil"><strong>eg.</strong><span>ACCUEIL ↑</span></a></nav><div class="menu-themes" role="group" aria-label="Choisir une vue"></div><div class="menu-utilities"><span>Clic droit ou Explorer</span><button type="button" class="menu-motion"></button></div><p class="menu-key">Tab pour parcourir · Entrée pour ouvrir · Échap pour fermer</p>';
 const svg=menu.querySelector('svg'),ns='http://www.w3.org/2000/svg';
 const polar=(radius,angle)=>{const a=angle*Math.PI/180;return [180+radius*Math.cos(a),180+radius*Math.sin(a)];};
 const sector=(start,end)=>{
  const a=polar(171,start),b=polar(171,end),c=polar(65,end),d=polar(65,start);
  return `M${a} A171 171 0 0 1 ${b} L${c} A65 65 0 0 0 ${d} Z`;
 };
 QUICK_DESTINATIONS.forEach((id,i)=>{
  const target=document.getElementById(id);if(!target)return;
  const label=id==='atelier'?'L’atelier':id==='about'?'Parcours':target.querySelector('h3').textContent;
  const link=document.createElementNS(ns,'a');link.classList.add('wheel-sector');link.setAttribute('href','#'+id);link.setAttribute('aria-label',label);link.dataset.destination=id;
  const path=document.createElementNS(ns,'path');path.setAttribute('d',sector(-119+i*60,-61+i*60));
  const [x,y]=polar(118,-90+i*60);
  const number=document.createElementNS(ns,'text');number.classList.add('wheel-number');number.setAttribute('x',x);number.setAttribute('y',y-9);number.textContent=String(i+1).padStart(2,'0');
  const title=document.createElementNS(ns,'text');title.classList.add('wheel-label');title.setAttribute('x',x);title.setAttribute('y',y+12);title.textContent=label;
  link.append(path,number,title);svg.append(link);
 });
 const themes=menu.querySelector('.menu-themes'),themeButtons=[];
 for(const [key,label] of [['points','Points'],['curseurs','Curseurs']]){
  const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.menuTheme=key;themes.append(button);themeButtons.push(button);
  on(button,'click',()=>{onTheme(key);refresh();});
 }
 const motion=menu.querySelector('.menu-motion');
 const explorer=document.createElement('button');explorer.type='button';explorer.className='quickmenu-trigger';explorer.textContent='Explorer';explorer.setAttribute('aria-haspopup','dialog');explorer.setAttribute('aria-controls',menu.id);explorer.setAttribute('aria-expanded','false');
 document.querySelector('.nav nav').append(explorer);document.body.append(menu);
 function refresh(){
  const state=getState();themeButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.menuTheme===state.theme)));
  motion.textContent=state.reduced?'Mouvements réduits':state.paused?'▷ Animer':'Ⅱ Pause';motion.setAttribute('aria-pressed',String(state.paused));motion.disabled=state.reduced;
  motion.title=state.reduced?'Les mouvements sont réduits par votre système.':'';
  const current=QUICK_DESTINATIONS.filter(id=>document.getElementById(id)?.getBoundingClientRect().top<=innerHeight*.4).at(-1);
  for(const link of svg.querySelectorAll('a')){if(link.dataset.destination===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
 }
 function close(){if(menu.open)menu.close();}
 function open(x=innerWidth/2,y=innerHeight/2){
  if(document.querySelector('dialog[open]'))return;refresh();
  document.querySelector('.nav').classList.remove('mobile-open');document.querySelector('#menu').setAttribute('aria-expanded','false');
  menu.style.left='12px';menu.style.top='12px';menu.showModal();explorer.setAttribute('aria-expanded','true');
  const r=menu.getBoundingClientRect();menu.style.left=Math.max(12,Math.min(innerWidth-r.width-12,x-r.width/2))+'px';menu.style.top=Math.max(12,Math.min(innerHeight-r.height-12,y-r.height/2))+'px';
 }
 on(explorer,'click',()=>open());on(menu.querySelector('.close-menu'),'click',close);
 on(menu,'close',()=>explorer.setAttribute('aria-expanded','false'));
 on(motion,'click',()=>{onPause();refresh();});
 on(menu,'click',e=>{
  const link=e.target.closest('a');
  if(link){
   const hash=link.getAttribute('href');if(!hash?.startsWith('#'))return;
   e.preventDefault();const target=document.getElementById(hash.slice(1));close();
   if(target){target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:getState().paused?'instant':'smooth'});}
   const url=new URL(location.href);url.hash=hash;history.replaceState(null,'',url);return;
  }
  if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}
 });
 on(document,'contextmenu',e=>{if(preservesNativeMenu(e.target,{shiftKey:e.shiftKey,selection:window.getSelection()?.toString()||''}))return;e.preventDefault();open(e.clientX,e.clientY);});
 on(document,'keydown',e=>{if(e.key!=='ContextMenu'&&!(e.key==='F10'&&e.shiftKey))return;if(preservesNativeMenu(e.target,{selection:window.getSelection()?.toString()||''}))return;e.preventDefault();open();});
 on(window,'resize',()=>{if(menu.open){close();open();}});
 on(window,'pagehide',close);refresh();
 return {refresh,close,destroy(){abort.abort();close();menu.remove();explorer.remove();}};
}
