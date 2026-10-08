(() => {
 'use strict';
 const fields=['note','done','appUrl','repoUrl','appTitle','promptMinutes','chatgptMinutes','devMinutes','opened'];
 const empty=()=>({version:1,days:[],settings:{vibeRateCents:null,devRateCents:null},updatedAt:null});
 function parse(value){
  if(!value||value.version!==1||!Array.isArray(value.days)||value.days.length>31)throw new Error('Le fichier du calendrier est invalide.');
  const out=empty(),seen=new Set();
  for(const row of value.days){
   if(!Number.isInteger(row.day)||row.day<1||row.day>31||seen.has(row.day))throw new Error('Un jour du calendrier est invalide.');
   seen.add(row.day);const next={day:row.day};
   for(const key of fields)if(row[key]!==undefined){validate(key,row[key]);next[key]=row[key];}
   out.days.push(next);
  }
  for(const key of ['vibeRateCents','devRateCents']){const v=value.settings?.[key]??null;if(v!==null&&(!Number.isInteger(v)||v<0||v>10000000))throw new Error('Tarif invalide.');out.settings[key]=v;}
  out.updatedAt=typeof value.updatedAt==='string'?value.updatedAt:null;return out;
 }
 function validate(key,value){
  if(['opened','done'].includes(key)){if(typeof value!=='boolean')throw new Error('Statut invalide.');return;}
  if(['promptMinutes','chatgptMinutes','devMinutes'].includes(key)){if(value!==null&&(!Number.isInteger(value)||value<0||value>100000))throw new Error('Durée invalide.');return;}
  const max=key==='appTitle'?120:2000;if(typeof value!=='string'||value.length>max)throw new Error('Texte invalide.');
  if(['appUrl','repoUrl'].includes(key)&&value){let url;try{url=new URL(value);}catch{throw new Error('Lien invalide.');}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('Lien invalide.');if(key==='repoUrl'&&(url.origin!=='https://github.com'||!/^\/egalland\/[a-z0-9_.-]+\/?$/i.test(url.pathname)||url.search||url.hash))throw new Error('Dépôt invalide.');}
 }
 window.githubCalendarStore={parse};
})();
