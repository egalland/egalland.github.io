(() => {
 'use strict';
 const prompts=[['Apple','Pomme'],['Relic','Relique'],['Miniature','Miniature'],['Cactus','Cactus'],['Smack','Claque'],['Ogre','Ogre'],['Panic','Panique'],['Stinky','Malodorant'],['Ram','Bélier'],['Mystical','Mystique'],['Rescue','Sauvetage'],['Toss','Lancer'],['Flimsy','Fragile'],['Lady','Dame'],['Hooray','Hourra'],['Gangly','Dégingandé'],['Contraption','Engin'],['Flightless','Incapable de voler'],['Confused','Perplexe'],['Lounge','Salon'],['Hero','Héros'],['Beacon','Phare'],['Dapper','Élégant'],['Bake','Cuire au four'],['Fracture','Fracture'],['Zip','Fermeture éclair'],['Dumb','Stupide'],['Trophy','Trophée'],['Tusk','Défense'],['Cookie','Biscuit'],['Flex','Fléchir']].map(pair=>pair[1]);
 const $=id=>document.getElementById(id), pad=n=>String(n).padStart(2,'0');
 const calendar=$('calendar'), dialog=$('prompt-dialog');
 const inspiration=window.inktoberInspiration, choices=new Map();
 const metrics=window.inktoberMetrics;
 let settings={vibeRateCents:3500,devRateCents:4000};
 const records=new Map(); let current=0, ready=false, loading=false, lastAvailable=-1;
 const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const lock='<svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>';
 function parisDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).reduce((r,p)=>(r[p.type]=p.value,r),{});}
 function available(now=new Date()){const d=parisDate(now);const key=Number(d.year+d.month+d.day);return key<20261001?0:key>20261031?31:Number(d.day);}
 function today(now=new Date()){const d=parisDate(now);return d.year==='2026'&&d.month==='10'?Number(d.day):0;}
 const emptyRecord=()=>({note:'',done:false,appUrl:'',repoUrl:'',appTitle:'',promptMinutes:null,chatgptMinutes:null,devMinutes:null,vibeMinutes:null,vibeMinMinutes:null,vibeMaxMinutes:null,devMinMinutes:null,devMaxMinutes:null});
 const recordFor=day=>records.get(day)||emptyRecord();
 function safeUrl(value){
  const raw=value.trim();if(!raw)return '';
  try{
   let url;
   if(/^https?:\/\//i.test(raw)){url=new URL(raw);if(url.hostname==='github.com'){const m=url.pathname.match(/^\/egalland\/([a-z0-9_.-]+)(?:\.git)?\/?$/i);if(!m)throw new Error();url=new URL(m[1].replace(/\.git$/,'')+'/','https://egalland.github.io/');}}
   else {
    if(!/^\/?[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\/?$/i.test(raw))throw new Error();
    url=new URL(raw.replace(/^\//,'').replace(/\/?$/,'/'),'https://egalland.github.io/');
   }
   if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error();
   return url.href;
  }catch{throw new Error('Indiquez le nom du dépôt ou le chemin de l’app (ex. cactocalypse), ou une adresse complète https://.');}
 }
 function render(){
  const count=available(),day=today();calendar.replaceChildren();
  for(let n=1;n<=31;n++){
   const accessible=n<=count,isOpen=accessible,row=accessible?recordFor(n):emptyRecord();
   const tile=document.createElement('div');tile.className='day-tile'+(row.appUrl?' has-link':'')+(row.repoUrl?' has-project':'');tile.dataset.day=String(n);const button=document.createElement('button');
   button.className='door'+(accessible?' available-door':'')+(n===day?' today':'')+(isOpen?' opened':'')+(row.note.trim()?' has-note':'')+(accessible&&row.done?' completed':'');
   button.disabled=!accessible||!ready;button.dataset.day=String(n);
   button.setAttribute('aria-label',!accessible?`Jour ${n}, disponible le ${n} octobre 2026`:`Voir le jour ${n}${isOpen?', '+(row.appTitle||prompts[n-1]):''}, ${row.done?'fait':'à faire'}${n===day?', aujourd’hui':''}${row.appUrl?', lien vers l’app ajouté':''}`);
   if(n===day)button.setAttribute('aria-current','date');
   button.innerHTML=`<span class="door-face"><span class="door-corner" aria-hidden="true">✧</span><span class="door-number">${pad(n)}</span><span class="door-caption">${!accessible?lock+' OCTOBRE':n===day?'AUJOURD’HUI':'DISPONIBLE'}</span></span><span class="door-inside" aria-hidden="true">${isOpen?`<span class="tile-title">${escapeHtml(row.appTitle||prompts[n-1])}</span>${row.appTitle?`<small class="tile-theme">${escapeHtml(prompts[n-1])}</small>`:''}`:'✦'}${!isOpen?'<small>INKTOBER 2026</small>':`<span class="opened-day">${pad(n)}</span>`}${row.note.trim()?`<span class="door-note">${escapeHtml(row.note.trim())}</span>`:''}</span>${accessible?`<span class="tile-status ${row.done?'is-done':'is-todo'}" aria-hidden="true"><span>${row.done?'✓ Fait':'À faire'}</span></span>`:''}`;
   button.addEventListener('click',()=>openDay(n));tile.append(button);if(accessible&&(row.appUrl||row.repoUrl)){const actions=document.createElement('div');actions.className='tile-actions';for(const [url,label] of [[row.appUrl,'Ouvrir l’app'],[row.repoUrl,'Voir le code']]){if(!url)continue;const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.className='tile-app-button';link.textContent=label;link.setAttribute('aria-label',`${label} · ${row.appTitle||prompts[n-1]} dans un nouvel onglet`);actions.append(link);}tile.append(actions);}calendar.append(tile);
  }
  const b=$('today-button');b.disabled=count===0||!ready;b.innerHTML=`${day?'Ouvrir le thème du jour':count?'Ouvrir le dernier thème':'Rendez-vous le 1er octobre'} <span aria-hidden="true">✦</span>`;b.onclick=()=>openDay(day||count);lastAvailable=count;renderStats();
 }
 function showPrompt(n){const changed=current!==n;current=n;$('prompt-date').textContent=`${pad(n)} OCTOBRE 2026`;$('prompt-name').textContent=prompts[n-1];$('prompt-position').textContent=`${pad(n)} / 31`;$('previous').disabled=n<=1;$('next').disabled=n>=available();renderInspiration(n);showRecord();if(!dialog.open)dialog.showModal();if(changed)dialog.scrollTop=0;}
 function makePrompt(day,index){const data=inspiration[day-1],idea=data.ideas[index];return `Crée une app web en français inspirée du mot « ${prompts[day-1]} », appelée « ${idea[0]} ».

Objectif : ${idea[1]}

Réalise une première version utilisable, avec un parcours principal clair et un périmètre réalisable en une journée. Utilise TypeScript si la solution a besoin de code.

Prévois une interface adaptée au mobile, des boutons accessibles au clavier et les états vide, erreur et succès. Choisis une direction visuelle cohérente avec le sujet. Les animations doivent rester discrètes et respecter le mouvement réduit.

Les contrôles doivent fonctionner réellement. Si des données sont à conserver, prévois une sauvegarde durable et vérifie leur retour après actualisation. Signale clairement les données de démonstration et les services externes à connecter ; n’annonce pas une action comme réussie si elle ne l’est pas.

Conseil spécifique à ce projet : ${data.tip}

Avant de terminer, vérifie le parcours principal et un cas d’erreur, puis explique brièvement ce qui fonctionne et les limites de cette version.`;}
 function updateIdea(){const index=choices.get(current)||0;$('idea-prompt').value=makePrompt(current,index);$('prompt-tip').textContent=inspiration[current-1].tip;$('copy-status').textContent='';$('copy-prompt').textContent='Copier le prompt';}
 function renderInspiration(day){const selected=choices.get(day)||0;$('idea-options').replaceChildren();inspiration[day-1].ideas.forEach((idea,index)=>{const label=document.createElement('label');label.className='idea-option';label.innerHTML=`<input type="radio" name="app-idea" value="${index}" ${index===selected?'checked':''}><span class="idea-body"><span class="idea-number">PISTE ${index+1}</span><strong>${escapeHtml(idea[0])}</strong><span class="idea-description">${escapeHtml(idea[1])}</span></span>`;label.addEventListener('change',()=>{choices.set(current,index);updateIdea();});$('idea-options').append(label);});updateIdea();}
 $('copy-prompt').onclick=async()=>{const day=current,value=$('idea-prompt').value;try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(value);if(current===day){$('copy-status').textContent='Prompt copié';$('copy-prompt').textContent='Copié !';}}catch{if(current===day){$('idea-prompt').focus();$('idea-prompt').select();$('copy-status').textContent='Copie automatique indisponible : copiez le texte sélectionné.';}}};
 async function api(path){return window.inktoberTransport.api(path);}
 const money=value=>value===null||!Number.isFinite(value)?'—':new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(value/100);
 const duration=value=>value===null||!Number.isFinite(value)?'—':value<60?`${value} min`:`${Math.floor(value/60)} h${value%60?' '+String(value%60).padStart(2,'0')+' min':''}`;
 function normalizeSettings(value){return Object.fromEntries(Object.entries({vibeRateCents:3500,devRateCents:4000}).map(([key,fallback])=>[key,Number.isInteger(value?.[key])&&value[key]>=0?value[key]:fallback]));}
 function statistics(){return metrics.calculate([...records].filter(([day])=>day<=available()).map(([day,row])=>({day,...row})),settings);}
 function renderStats(){
  const data=statistics(),total=data.doneCount,coverage=count=>total?`${count} / ${total} apps renseignées`:'Aucune app terminée';
  $('view-stats').setAttribute('aria-busy',String(!ready));
  $('kpi-done').textContent=ready?String(total):'—';$('kpi-done-detail').textContent='sur les 31 jours';$('stats-progress-label').textContent=ready?`${total} app${total>1?'s':''} terminée${total>1?'s':''} sur 31`:'Chargement du bilan…';$('stats-progress').value=total;
  for(const [key,id] of [['vibeTime','vibe'],['dev','dev']]){$('kpi-'+id).textContent=duration(data[key].value);$('kpi-'+id+'-detail').textContent=(data[id+'Min'].count===total&&data[id+'Max'].count===total&&total?`Fourchette : ${duration(data[id+'Min'].value)} à ${duration(data[id+'Max'].value)} · `:'')+coverage(data[key].count);}
  $('kpi-vibe-cost').textContent=money(data.vibeCost.value);$('kpi-dev-cost').textContent=money(data.devCost.value);
  $('kpi-vibe-cost-detail').textContent=settings.vibeRateCents===null?'Tarif non renseigné':`${coverage(data.vibeCost.count)} · ${duration(data.vibeTime.value)} au total`;
  $('kpi-dev-cost-detail').textContent=settings.devRateCents===null?'Tarif non renseigné':coverage(data.devCost.count);
  $('stats-rates-note').textContent=`Tarifs fixes : Vibe Coding ${money(settings.vibeRateCents)}/h · Développeur ${money(settings.devRateCents)}/h. Temps Vibe Coding = conception, prompts, génération, tests et corrections. Les coûts utilisent les valeurs centrales estimées.`;
  $('stats-empty').hidden=total>0;$('stats-table-wrap').hidden=total===0;$('stats-rows').replaceChildren();
  for(const row of data.rows){const tr=document.createElement('tr');tr.innerHTML=`<th scope="row"><span class="stats-app-name">${escapeHtml(row.appTitle||prompts[row.day-1])}</span><span class="stats-app-day">Jour ${pad(row.day)} · ${escapeHtml(prompts[row.day-1])}</span></th><td>${timeCell(row,'vibe')}</td><td>${timeCell(row,'dev')}</td><td>${money(row.vibeCostCents)}</td><td>${money(row.devCostCents)}</td><td>${row.appUrl?`<a href="${escapeHtml(row.appUrl)}" target="_blank" rel="noopener noreferrer" class="table-app-link">Ouvrir<span class="sr-only"> ${escapeHtml(row.appTitle||prompts[row.day-1])}</span></a>`:'—'}</td>`;$('stats-rows').append(tr);}
 }
 function timeCell(row,prefix){const min=row[prefix+'MinMinutes'],max=row[prefix+'MaxMinutes'];return duration(row[prefix+'Minutes'])+(min!==null&&min!==undefined&&max!==null&&max!==undefined?`<small class="stats-time-range">${duration(min)} à ${duration(max)}</small>`:'');}
 const tabNames=['calendar','stats'];
 function selectTab(name,focus=false){if(!tabNames.includes(name))throw new Error('Onglet inconnu.');for(const candidate of tabNames){const selected=candidate===name;$('tab-'+candidate).setAttribute('aria-selected',String(selected));$('tab-'+candidate).tabIndex=selected?0:-1;$('view-'+candidate).hidden=!selected;}if(name==='stats')renderStats();if(focus)$('tab-'+name).focus();return {tab:name};}
 for(const [index,name] of tabNames.entries()){$('tab-'+name).addEventListener('click',()=>selectTab(name));$('tab-'+name).addEventListener('keydown',event=>{let target=null;if(event.key==='ArrowRight')target=(index+1)%tabNames.length;if(event.key==='ArrowLeft')target=(index+tabNames.length-1)%tabNames.length;if(event.key==='Home')target=0;if(event.key==='End')target=tabNames.length-1;if(target!==null){event.preventDefault();selectTab(tabNames[target],true);}});}
 function feedback(message='',retry=false){$('storage-status').textContent=message;$('retry-load').hidden=!retry;$('storage-feedback').hidden=!message;}
 function normalizeRecord(row){let repoUrl='';try{const u=new URL(row.repoUrl);if(u.origin==='https://github.com'&&/^\/egalland\/[a-z0-9_.-]+\/?$/i.test(u.pathname)&&!u.search&&!u.hash&&!u.username&&!u.password)repoUrl=u.href;}catch{}let appUrl='';try{appUrl=safeUrl(typeof row.appUrl==='string'?row.appUrl:'');}catch{}return {note:typeof row.note==='string'?row.note:'',done:row.done===true||row.done===1,appUrl,repoUrl,appTitle:typeof row.appTitle==='string'?row.appTitle:'',...Object.fromEntries(['promptMinutes','chatgptMinutes','devMinutes','vibeMinutes','vibeMinMinutes','vibeMaxMinutes','devMinMinutes','devMaxMinutes'].map(key=>[key,Number.isInteger(row[key])&&row[key]>=0?row[key]:null]))};}
 async function load(){if(loading)return;loading=true;ready=false;render();feedback('Chargement du calendrier…');try{const data=await api('/api/calendar');if(!Array.isArray(data.days))throw new Error('Impossible de charger le calendrier. Réessayez.');records.clear();for(const row of data.days){if(Number.isInteger(row.day)&&row.day>=1&&row.day<=31)records.set(row.day,normalizeRecord(row));}settings=normalizeSettings(data.settings);ready=true;feedback();}catch(error){feedback(error.message,true);}finally{loading=false;render();if(dialog.open)showRecord();}}
 async function openDay(n){if(!ready)return {error:'Le calendrier n’est pas encore chargé.'};if(!Number.isInteger(n)||n<1||n>available())return {error:'Cette porte n’est pas encore disponible.'};showPrompt(n);return {day:n,theme:prompts[n-1],...recordFor(n),ideas:inspiration[n-1].ideas,tip:inspiration[n-1].tip,prompt:makePrompt(n,choices.get(n)||0)};}
 function showRecord(){const row=recordFor(current);$('completed-project').hidden=!row.appUrl&&!row.repoUrl&&!row.note.trim();$('project-title').textContent=row.appTitle||prompts[current-1];$('project-description').textContent=row.note;const estimate=metrics.calculate([{...row,day:current,done:true}],settings).rows[0];$('project-estimates').hidden=estimate.vibeMinutes===null&&estimate.devMinutes===null;for(const prefix of ['vibe','dev']){$('project-'+prefix+'-time').textContent=duration(estimate[prefix+'Minutes']);$('project-'+prefix+'-cost').textContent=money(estimate[prefix+'CostCents']);$('project-'+prefix+'-range').textContent=estimate[prefix+'MinMinutes']!=null&&estimate[prefix+'MaxMinutes']!=null?`Fourchette : ${duration(estimate[prefix+'MinMinutes'])} à ${duration(estimate[prefix+'MaxMinutes'])}`:'';}for(const [id,url] of [['project-launch',row.appUrl],['project-code',row.repoUrl]]){const link=$(id);link.hidden=!url;if(url)link.href=url;else link.removeAttribute('href');}}
 $('retry-load').onclick=load;$('refresh-calendar').onclick=load;
 $('close-dialog').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}});dialog.addEventListener('close',()=>calendar.querySelector(`button[data-day="${current}"]`)?.focus());$('previous').onclick=()=>openDay(current-1);$('next').onclick=()=>openDay(current+1);
 function tick(){const now=new Date(),count=available(now);if(count!==lastAvailable){render();if(dialog.open)showPrompt(current);}const d=parisDate(now);$('date').textContent=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',day:'2-digit',month:'long'}).format(now).toUpperCase();if(count===31){$('clock').textContent='31 / 31';$('clock-caption').textContent='Toutes les portes sont ouvertes';$('calendar-note').innerHTML='<span aria-hidden="true">✧</span> Les 31 thèmes sont disponibles. À vous de créer vos apps.';$('clock').previousElementSibling.textContent='LE CALENDRIER EST COMPLET';return;}let target;if(count===0){target=new Date('2026-10-01T00:00:00+02:00');$('clock-caption').textContent='Le 1er octobre, à minuit à Paris';}else{const parisTime=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now).reduce((r,p)=>(r[p.type]=p.value,r),{});const parisAsUTC=Date.UTC(+d.year,+d.month-1,+d.day,+parisTime.hour,+parisTime.minute,+parisTime.second);const offset=Math.round((parisAsUTC-now.getTime())/3600000);target=new Date(`2026-10-${pad(count+1)}T00:00:00+${pad(count===25?1:offset)}:00`);$('clock-caption').textContent=`Le ${count+1} octobre, à minuit à Paris`;}
 const remaining=Math.max(0,Math.ceil((target-now)/1000));const hours=Math.floor(remaining/3600);$('clock').textContent=`${pad(hours)} : ${pad(Math.floor(remaining%3600/60))} : ${pad(remaining%60)}`;}
 render();tick();void load();setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 const context=document.modelContext;if(context?.registerTool){const life=new AbortController();const register=t=>{try{Promise.resolve(context.registerTool(t,{signal:life.signal})).catch(()=>{});}catch{}};
 register({name:'read_calendar_availability',description:'Lire les jours accessibles du calendrier Inktober 2026 sans dévoiler les thèmes futurs.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({year:2026,availableDays:available(),today:today(),timezone:'Europe/Paris',loaded:ready,openedDays:Array.from({length:available()},(_,i)=>i+1),progress:Object.fromEntries([...records].filter(([day])=>day<=available()))})});
 register({name:'open_inktober_day',description:'Afficher le détail d’une case disponible du calendrier.',inputSchema:{type:'object',properties:{day:{type:'integer',minimum:1,maximum:31}},required:['day'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='day')||!Number.isInteger(input.day))throw new Error('Indiquez un jour entier entre 1 et 31.');return openDay(input.day);}});
 register({name:'read_inktober_statistics',description:'Lire les temps et coûts estimés des apps terminées avec les tarifs enregistrés.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({loaded:ready,settings,...statistics()})});
 addEventListener('pagehide',()=>life.abort(),{once:true});}
})();
