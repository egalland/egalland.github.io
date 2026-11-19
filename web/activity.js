const flight=(()=>{
 const formatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
 const day=t=>formatter.format(new Date(t));
 const calendar=()=>Array.from({length:7},(_,i)=>new Date(Date.parse(day(Date.now())+'T12:00:00Z')-(6-i)*864e5).toISOString().slice(0,10));
 let data=JSON.parse(localStorage.getItem('orbit-git-day')||'null'),busy=false,last=0,status='';
 const labels=['Commits','Lignes ajoutées','Prompts Codex'],names=['Vega','Echo','Atlas'];
 function paint(){
  const days=calendar(),period=Number(document.querySelector('#span').value),local=JSON.parse(localStorage.getItem('orbit-local')||'null');
  const box=document.querySelector('#rates');box.replaceChildren();
  labels.forEach((label,i)=>{
   const counts=days.map(d=>i===2?(local?.days&&d<=day(local.updatedAt)?local.days[d]||0:null):(data?.days[d]?.[i]??null));
   const values=counts.slice(-period),known=values.every(n=>n!==null),value=known?new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(values.reduce((a,b)=>a+b,0)/period):'—';
   const b=document.createElement('button');b.className='flightcard';b.innerHTML='<small>'+names[i]+'</small><strong>'+value+'</strong><b>'+label+' / jour</b><span class="bars"></span>';if(!known){const valueNode=b.querySelector('strong');valueNode.textContent=i===2?'Relier le PC':busy?'Collecte…':'Indisponible';valueNode.className='missing'}const bars=b.querySelector('.bars'),max=Math.max(1,...counts);
   counts.forEach((v,k)=>{let bar=document.createElement('i');bar.style.height=(v===null?2:Math.max(3,25*v/max))+'px';bar.title=days[k]+' · '+(v??'indisponible');if(v===null)bar.style.opacity='.25';bars.append(bar)});
   b.onclick=()=>{window.station?.dispatch(i);if(i===2){if(folder)scan();else connect()}else load(ship,true)};box.append(b)
  });
  document.querySelector('#coverage').textContent=[status,'GitHub public · auteur egalland · branches par défaut',data?'Relevé du '+new Date(data.at).toLocaleString('fr-FR'):'',local?.days?'Prompts des sessions reliées sur ce PC.':'Atlas attend le dossier sessions de Codex.'].filter(Boolean).join(' · ');
 }
 async function api(url){const r=await fetch('https://api.github.com'+url,{headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw Error('GitHub '+r.status);return r.json()}
 async function load(ship,force=false){
  paint();if(busy||!ship.repos.length||(!force&&Date.now()-last<900000))return;
  busy=true;last=Date.now();status='Vega relève les commits';window.station?.dispatch(0);paint();
  try{
   const dates=calendar(),days=Object.fromEntries(dates.map(d=>[d,[0,0]])),allowed=new Set(ship.repos.map(r=>(r.owner+'/'+r.name).toLowerCase())),seen=new Set(),items=[];
   let total=0;for(let page=1;;page++){const query='author:egalland author-date:>='+new Date(Date.parse(dates[0]) - 864e5).toISOString().slice(0,10);const r=await api('/search/commits?q='+encodeURIComponent(query)+'&per_page=100&page='+page);if(r.incomplete_results||r.total_count>1000)throw Error('Résultats GitHub incomplets');total+=r.items.length;for(let c of r.items){let repo=c.repository.full_name,dt=day(c.commit.author.date),key=repo+'/'+c.sha;if(!allowed.has(repo.toLowerCase())||!days[dt]||seen.has(key))continue;seen.add(key);days[dt][0]++;items.push({repo,sha:c.sha,dt})}if(total>=r.total_count)break;if(!r.items.length)throw Error('Page GitHub incomplète')}
   status='Echo compte les lignes ajoutées';window.station?.dispatch(1);paint();const cache=JSON.parse(localStorage.getItem('orbit-additions')||'{}');let incomplete=false;
   for(let c of items){let k=c.repo+'/'+c.sha;if(cache[k]===undefined&&!incomplete){try{let detail=await api('/repos/'+c.repo+'/commits/'+c.sha);if(!Number.isFinite(detail.stats?.additions))throw Error();cache[k]=detail.stats.additions}catch{incomplete=true}}
   if(cache[k]===undefined)days[c.dt][1]=null;else if(days[c.dt][1]!==null)days[c.dt][1]+=cache[k]}
   localStorage.setItem('orbit-additions',JSON.stringify(Object.fromEntries(items.filter(c=>cache[c.repo+'/'+c.sha]!==undefined).map(c=>[c.repo+'/'+c.sha,cache[c.repo+'/'+c.sha]]))));
   data={days,at:new Date().toISOString()};localStorage.setItem('orbit-git-day',JSON.stringify(data));status=incomplete?'Lignes partiellement disponibles':'Relevé terminé';log('Vega et Echo · '+items.length+' commits publics identifiés sur 7 jours.');
  }catch(e){status=e.message+' · collecte indisponible'}finally{busy=false;paint()}
 }
 document.querySelector('#span').onchange=paint;paint();return {paint,load,day}
})();
