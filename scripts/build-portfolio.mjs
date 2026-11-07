import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(root,'portfolio/content.json'),'utf8'));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const plain=value=>String(value).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const render=(template,values)=>template.replace(/\{\{([\w.]+)\}\}/g,(_,key)=>{
 const value=key.split('.').reduce((v,k)=>v?.[k],values);
 if(value===undefined)throw new Error('Missing portfolio field: '+key);
 return key.endsWith('Html')?value:escape(value);
});
const save=(name,content)=>{const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);};
const link=({label,href,external},className='project-link')=>`<a class="${className}" href="${escape(href)}"${external?' target="_blank" rel="noopener noreferrer"':''}>${escape(label)} <span aria-hidden="true">↗</span></a>`;
const tags=items=>`<div class="skills">${items.map(t=>`<span>${escape(t)}</span>`).join('')}</div>`;
const [market,kikalmo,maison,bodyos]=data.projects;
const [livre,redim,atlas]=data.atelier.projects;
const inktober=data.inktober;
const chapters=[];
function chapter({id,formation,label,title,description='',category='',links=[],extra='',cursor=id,theme=formation,sharp=false,className=''}){
 const i=chapters.length;
 chapters.push(`<section class="chapter ${className}" id="${id}" data-scene="${i}" data-formation="${formation}" data-theme="${theme}" data-label="${escape(label)}" data-cursor="${cursor}"${sharp?' data-sharp="true"':''} aria-labelledby="${id}-title"><div class="panel"><article class="copy"><p class="eyebrow">${escape(category)}</p><h2 id="${id}-title">${title}</h2>${description?`<p class="description">${escape(description)}</p>`:''}${extra}<div class="point-links">${links.map(l=>link(l)).join('')}</div></article></div></section>`);
}
chapters.push(`<section class="chapter intro current" id="home" data-scene="0" data-formation="0" data-theme="0" data-label="${escape(data.profile.name)}" data-cursor="home" aria-labelledby="intro-title"><div class="panel"><div class="intro-kicker mono">${data.hero.eyebrowHtml}</div><h1 id="intro-title">${data.hero.titleHtml.replace('class="muted"','class="elastic-word"')}</h1><div class="intro-bottom"><p>${escape(data.hero.intro)}</p>${tags(data.hero.metrics.map(m=>m.value))}<a class="text-link" href="#market-plus">Explorer mes projets <span>↘</span></a></div><div class="scroll-cue mono"><span class="wheel"></span>DÉFILER POUR EXPLORER ↓</div></div></section>`);
chapter({id:market.id,formation:4,label:market.title,title:'Market<br><em>Plus.</em>',category:market.category+' · '+market.status,description:market.description,links:market.links,extra:tags(market.tags)});
chapter({id:'market-interface',formation:5,label:'Market Plus / Point marché',title:'Point<br><em>marché.</em>',category:market.title,description:market.description,extra:`<p class="demo-note">${escape(market.preview.caption)}</p>`,links:market.links,cursor:market.id,sharp:true});
chapter({id:kikalmo.id,formation:1,label:kikalmo.title,title:`<em>${escape(kikalmo.title)}.</em>`,category:kikalmo.category+' · '+kikalmo.status,description:kikalmo.description,links:kikalmo.links,extra:tags(kikalmo.tags)});
chapter({id:'kikalmo-personnage',formation:2,label:'Kikalmo / Personnalisation',title:'Les<br><em>avatars.</em>',category:kikalmo.title,description:kikalmo.description,links:kikalmo.links,cursor:kikalmo.id});
chapter({id:'kikalmo-interface',formation:3,label:'Kikalmo / Salons',title:'Les<br><em>salons.</em>',category:kikalmo.title,description:kikalmo.description,links:kikalmo.links,cursor:kikalmo.id,sharp:true});
chapter({id:maison.id,formation:6,label:maison.title,title:`<em>${escape(maison.title)}.</em>`,category:maison.category+' · '+maison.status,description:maison.description,links:maison.links,extra:tags(maison.tags)});
chapter({id:'maison-reseaux',formation:7,label:'Maison / Tableau électrique',title:'Tableau<br><em>électrique.</em>',category:maison.title,description:maison.description,links:maison.links,cursor:maison.id,extra:'<p class="demo-note">Esquisse visuelle · les outils s’ouvrent séparément</p>'});
chapter({id:bodyos.id,formation:8,label:bodyos.title,title:'Body<em>OS.</em>',category:bodyos.category+' · '+bodyos.status,description:bodyos.description,extra:tags(bodyos.tags)+'<p class="private-label">Projet privé · présentation sans données personnelles</p>'});
chapter({id:'bodyos-tendance',formation:9,label:'BodyOS / Progression',title:'La<br><em>progression.</em>',category:bodyos.title,description:data.details.bodyos.description,extra:`<ul class="point-features">${data.details.bodyos.features.map(t=>`<li>${escape(t)}</li>`).join('')}</ul><p class="demo-note">Courbes fictives.</p>`,cursor:bodyos.id});
for(const [project,formation] of [[livre,10],[redim,11],[atlas,13]]){
 const title=project.id==='livre'?'Atelier<br><em>du livre.</em>':project.id==='atlas'?'Atlas /<br><em>WikiCartes.</em>':`<em>${escape(project.title)}.</em>`;
 chapter({id:project.id,formation,label:project.title,title,category:project.category,description:project.description,extra:`<p class="demo-note">${escape(project.tagline)}</p>`,links:[{label:'Ouvrir '+project.title,href:project.href,external:true}],cursor:project.id,sharp:project.id==='redim',theme:formation>12?10:formation});
}
chapter({id:'inktober',formation:16,label:'Inktober / Le calendrier des ombres',title:data.inktober.titleHtml.replace('class="muted"','class="point-accent"'),category:data.inktober.category,description:data.inktober.description,extra:'<p class="point-manifesto">31 mots. Un terrain de jeu.</p>'+tags(['Jeux','Outils','Expériences web']),links:[{label:'Explorer le calendrier',href:data.inktober.href,external:false}],theme:0,className:'inktober-chapter'});
chapter({id:'about',formation:17,label:'Parcours & pratique',title:data.about.titleHtml.replace('class="muted"','class="point-accent"'),category:'PARCOURS & PRATIQUE',description:data.about.description,extra:`<p class="point-manifesto">${escape(data.about.manifesto)}</p>${tags(data.about.interests)}`,theme:0});
chapter({id:'parcours',formation:17,label:'Parcours & compétences',title:'Parcours &<br><em>pratique.</em>',category:'PARCOURS & PRATIQUE',extra:`<ol class="point-timeline">${data.about.timeline.map(t=>`<li><time>${escape(t.date)}</time><div>${escape(t.label)}<small>${escape(t.note)}</small></div></li>`).join('')}</ol>${tags(data.about.skills)}`,cursor:'about',theme:0,className:'timeline-chapter'});
chapter({id:'contact',formation:12,label:'La suite',title:data.contact.titleHtml.replace('class="muted"','class="point-accent"'),category:'LA SUITE',description:data.contact.description,links:[{label:'Mon GitHub',href:data.profile.github,external:true}],theme:0,className:'outro'});
const groups=[['market-plus','Market Plus',2],['kikalmo','Kikalmo',3],['maison','Maison',2],['bodyos','BodyOS',2],['livre','L’atelier',3],['inktober','Inktober',1],['about','Parcours',2]];
const dockHtml=`<nav class="project-dock" aria-label="Accès direct aux projets">${groups.map(([id,name,count],i)=>`<a href="#${id}" data-project="${i}"><span class="dock-order">0${i+1}</span><span class="dock-name">${name}</span><i>${'<b></b>'.repeat(count)}</i></a>`).join('')}<button class="dock-next" id="nextProject" aria-label="Passer au projet suivant">↗</button></nav>`;
const positions=[[18,20],[50,5],[82,20],[84,61],[67,88],[33,88],[15,61]];
const nodes=groups.map(([id,name],i)=>`<a class="particle-destination" href="#${id}" style="--nx:${positions[i][0]}%;--ny:${positions[i][1]}%;--order:${i}"><span class="particle-cluster" aria-hidden="true">${Array.from({length:9},(_,n)=>`<i style="--dot:${n}"></i>`).join('')}</span><small>0${i+1}</small><span>${name}</span></a>`).join('');
const menuHtml=`<div id="projectMenu" popover="auto" aria-label="Constellation des projets"><div class="constellation-heading mono"><span>CHOISIR UNE ORBITE</span><button class="close-menu" aria-label="Fermer la navigation">×</button></div><nav class="constellation" aria-label="Projets et parcours"><div class="constellation-orbit" aria-hidden="true"></div><div class="constellation-dust" aria-hidden="true">${Array.from({length:25},(_,i)=>`<i style="--x:${(i*37+13)%100}%;--y:${(i*53+7)%100}%;--delay:${-i*.37}s"></i>`).join('')}</div>${nodes}<a class="constellation-home" href="#home" aria-label="Retour à l’accueil"><span>eg.</span><small>ACCUEIL</small></a></nav><div class="constellation-tools"><button id="restartButton">↺ Recommencer</button><button id="motionButton" aria-pressed="false">Ⅱ Pause</button></div></div>`;
const metaDescription='Les projets d’Emmanuel Galland : Market Plus, Kikalmo, Maison, BodyOS, Atelier du livre et Redim. Développement web, données et automatisation.';
save('points/index.html',render(fs.readFileSync(path.join(root,'portfolio/points.template.html'),'utf8'),{chaptersHtml:chapters.join('\n'),dockHtml,menuHtml,metaDescription}));
save('index.html',render(fs.readFileSync(path.join(root,'portfolio/page.template.html'),'utf8'),data));
save('portfolio-assets/content.js','window.PORTFOLIO_CONTENT='+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');
save('portfolio-assets/content.mjs','export default '+JSON.stringify(data).replaceAll('<','\\u003c')+';\n');
console.log('Generated two independent presentations from portfolio/content.json.');
