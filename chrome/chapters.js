import {setChromeType} from './chrome-type.js';
import data from '../portfolio-assets/content.mjs';

export const chapters=[
 {id:'chrome',group:'Accueil',title:data.profile.name,short:'Chrome',type:'Portfolio · Chrome',copy:'Jeux de mots · Images en mouvement · Outils sur mesure',features:data.hero.metrics.map(item=>item.label.toLowerCase()+' — '+item.value),action:'Voir les projets'},
 ...data.projects.map(project=>{
  const details=project.id==='market-plus'?data.details.market:data.details[project.id];
  return {id:project.id,group:'Projets',title:project.title,type:project.category,copy:project.description,status:project.status.replace('● ',''),
   tags:project.tags,features:details?.features,links:project.links};
 }),
 ...data.atelier.projects.map(project=>({id:project.id,group:'L’atelier',title:project.title,short:project.id==='atlas'?'Atlas':project.title,
  type:'L’atelier · '+project.category,copy:project.description,tags:[project.tagline],links:[{label:'Ouvrir '+project.title,href:project.href}]})),
 {id:'inktober',group:'Inktober',title:data.inktober.title,type:data.inktober.category,copy:data.inktober.description,tags:[data.inktober.tagline],
  links:[{label:'Explorer le calendrier',href:data.inktober.href}]},
 {id:'about',group:'Pratiques',short:'Pratiques',title:'Savoir-faire',type:'Pratiques',copy:data.about.practices.map(p=>p.verb).join(' · '),practices:data.about.practices,action:'Explorer les pratiques'},
 {id:'contact',group:'Code',short:'Code',title:'Code source',type:data.profile.name,copy:'Retrouver les dépôts sur GitHub.',links:data.contact.links}
];
export const groups=[...new Set(chapters.map(c=>c.group))];
export function chapterFromHash(hash){
 const id=decodeSafe(hash.replace(/^#/,''));
 const aliases={home:'chrome',work:'market-plus',atelier:'livre',parcours:'about'};
 return chapters.findIndex(item=>item.id===(aliases[id]||id));
}
function decodeSafe(value){try{return decodeURIComponent(value)}catch{return value}}
export function renderChapters(strip,nav){
 chapters.forEach((item,i)=>{
  const section=document.createElement('section');section.id=item.id;
  const copy=document.createElement('div');copy.className='copy';section.append(copy);
  const category=document.createElement('p');category.className='meta';category.textContent=item.type;
  const heading=document.createElement(i?'h2':'h1');heading.textContent=item.title;
  if(item.title.length>10)heading.className='long-title';
  setChromeType(heading,item.id,item.title);
  const summary=document.createElement('p');summary.className='summary';summary.textContent=item.copy;
  const action=document.createElement('button');action.type='button';action.className='visit';action.dataset.open=i;
  action.textContent=item.action||'Ouvrir la fiche';
  const icon=document.createElement('i');icon.setAttribute('aria-hidden','true');icon.textContent=i?'':'→';icon.classList.toggle('diagonal',Boolean(i));icon.setAttribute('aria-hidden','true');action.append(icon);
  copy.append(category,heading,summary);
  if(!i){
   const axes=document.createElement('ul');axes.className='axes';axes.setAttribute('aria-label','Domaines de pratique');
   for(const metric of data.hero.metrics){const li=document.createElement('li');li.textContent=metric.value;axes.append(li)}
   copy.append(axes);
  }
  if(item.id==='contact'){
   const link=document.createElement('a');link.className='visit';link.href=item.links[0].href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=item.links[0].label;link.append(icon);copy.append(link);
  }else{if(i)action.setAttribute('aria-label',(item.action||'Ouvrir la fiche')+' · '+item.title);copy.append(action)}
  if(!i){const practices=document.createElement('a');practices.href='#about';practices.className='inline-practices';practices.textContent='Pratiques';copy.append(practices)}
  strip.append(section);
 });
 for(const group of groups){
  const a=document.createElement('a');a.href='#'+chapters.find(c=>c.group===group).id;a.textContent=group;nav.append(a);
 }
}
