import './portfolio-content.mjs?v=pratiques1';
import {THEMES,normalizeTheme,createThemeManager} from './theme-manager.mjs?v=crew2';
import {createPortfolioMenu} from './context-menu.mjs?v=chrome1';

const root=document.documentElement,buttons=[...document.querySelectorAll('[data-theme-choice]')],status=document.querySelector('#theme-status');
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let started=false,selected='curseurs',userPaused=false,projectMenu=null;
try{userPaused=localStorage.getItem('redline-lab-motion')==='paused';}catch{}
function readingPosition(){
 const elements=[...document.querySelectorAll('#home,.project,.lab-card,#inktober,#about,#contact')];
 const visible=elements.filter(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight*.3&&r.top<innerHeight*.7;});
 const el=visible.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-100)-Math.abs(b.getBoundingClientRect().top-100))[0];
 if(!el)return null;const r=el.getBoundingClientRect();return {el,ratio:(100-r.top)/Math.max(1,r.height)};
}
function setAppearance(theme){
 const position=started?readingPosition():null;
 root.dataset.theme=theme;document.body.classList.toggle('paused',preference.matches||userPaused);
 root.dataset.motion=preference.matches||userPaused?'paused':'active';
 buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));
 if(position){const r=position.el.getBoundingClientRect();scrollTo({top:scrollY+r.top+position.ratio*r.height-100,behavior:'instant'});}
}
const manager=createThemeManager({
 apply:setAppearance,
 async load(name,options){
  if(name==='curseurs')return import('./themes/cursors.mjs?v=robots1');
  if(name==='points'){
   const module=await import('./themes/points.mjs?v=kinetic1');const forms=await module.prepare(options.count);
   return {start:settings=>module.start({...settings,forms})};
  }
  throw new Error('Moteur inconnu : '+name);
 },
 report({theme,status:state,error}){
  root.dataset.themeStatus=state;
  buttons.forEach(button=>button.setAttribute('aria-busy',String(state==='loading'&&button.dataset.themeChoice===theme)));
  status.textContent=state==='loading'?'Chargement du thème '+THEMES[theme].label+'.':state==='ready'?'Thème '+THEMES[theme].label+' activé.':'Le thème n’a pas pu se charger. Le contenu reste accessible.';
  if(error)console.error('Chargement du thème',error);
  projectMenu?.refresh();
 }
});
async function choose(theme,{save=true}={}){
 if(theme==='points'||theme==='chrome'){
  const id=(started?readingPosition()?.el.id:null)||location.hash.slice(1)||'home';
  const url=new URL('/'+theme+'/',location.href);url.search=location.search;url.searchParams.delete('theme');url.hash=({work:'market-plus',atelier:'livre'})[id]||id;
  location.assign(url);return;
 }
 selected=normalizeTheme(theme);
 const promise=manager.select(selected,{reduced:preference.matches||userPaused,resume:started,count:innerWidth<=700?1680:2800});started=true;
 if(save){try{localStorage.setItem('portfolio-theme',selected);}catch{}const url=new URL(location.href);url.searchParams.set('theme',selected);history.replaceState(null,'',url);}
 await promise;
}
for(const button of buttons){button.disabled=false;button.addEventListener('click',()=>choose(button.dataset.themeChoice));}
projectMenu=createPortfolioMenu({
 getState:()=>({theme:selected,paused:userPaused||preference.matches,reduced:preference.matches}),
 onTheme:theme=>choose(theme),
 onPause:()=>{if(preference.matches)return;userPaused=!userPaused;try{localStorage.setItem('redline-lab-motion',userPaused?'paused':'active');}catch{}choose(selected,{save:false});}
});
preference.addEventListener('change',()=>choose(selected,{save:false}));
addEventListener('pagehide',()=>manager.stop());
addEventListener('pageshow',event=>{if(event.persisted)choose(selected,{save:false});});
const requested=new URL(location.href).searchParams.get('theme')||'curseurs';
choose(requested,{save:!['points','chrome','curseurs'].includes(requested)});
