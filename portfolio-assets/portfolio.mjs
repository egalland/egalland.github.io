import './portfolio-content.mjs';
import {THEMES,normalizeTheme,createThemeManager} from './theme-manager.mjs?v=fracture2';

const root=document.documentElement,buttons=[...document.querySelectorAll('[data-theme-choice]')],status=document.querySelector('#theme-status');
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let started=false,selected='curseurs';
function readingPosition(){
 const elements=[...document.querySelectorAll('#home,.project,.lab-card,#about,#contact')];
 const visible=elements.filter(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight*.3&&r.top<innerHeight*.7;});
 const el=visible.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-100)-Math.abs(b.getBoundingClientRect().top-100))[0];
 if(!el)return null;const r=el.getBoundingClientRect();return {el,ratio:(100-r.top)/Math.max(1,r.height)};
}
function setAppearance(theme){
 const position=started?readingPosition():null;
 root.dataset.theme=theme;document.body.classList.toggle('paused',preference.matches);
 buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));
 if(position){const r=position.el.getBoundingClientRect();scrollTo({top:scrollY+r.top+position.ratio*r.height-100,behavior:'instant'});}
}
const manager=createThemeManager({
 apply:setAppearance,
 async load(name,options){
  if(name==='curseurs')return import('./themes/cursors.mjs');
  if(name==='glitch')return import('./themes/glitch.mjs');
  if(name==='points'){
   const module=await import('./themes/points.mjs');const forms=await module.prepare(options.count);
   return {start:settings=>module.start({...settings,forms})};
  }
  throw new Error('Moteur inconnu : '+name);
 },
 report({theme,status:state,error}){
  root.dataset.themeStatus=state;
  buttons.forEach(button=>button.setAttribute('aria-busy',String(state==='loading'&&button.dataset.themeChoice===theme)));
  status.textContent=state==='loading'?'Chargement du thème '+THEMES[theme].label+'.':state==='ready'?'Thème '+THEMES[theme].label+' activé.':'Le thème n’a pas pu se charger. Le contenu reste accessible.';
  if(error)console.error('Chargement du thème',error);
 }
});
async function choose(theme,{save=true}={}){
 selected=normalizeTheme(theme);
 const promise=manager.select(selected,{reduced:preference.matches,resume:started,count:innerWidth<=700?2100:3600});started=true;
 if(save){try{localStorage.setItem('portfolio-theme',selected);}catch{}const url=new URL(location.href);url.searchParams.set('theme',selected);history.replaceState(null,'',url);}
 await promise;
}
for(const button of buttons){button.disabled=false;button.addEventListener('click',()=>choose(button.dataset.themeChoice));}
preference.addEventListener('change',()=>choose(selected,{save:false}));
addEventListener('pagehide',()=>manager.stop());
addEventListener('pageshow',event=>{if(event.persisted)choose(selected,{save:false});});
let saved;try{saved=localStorage.getItem('portfolio-theme')||localStorage.getItem('portfolio-view');}catch{}
choose(new URL(location.href).searchParams.get('theme')||saved||'curseurs',{save:false});
