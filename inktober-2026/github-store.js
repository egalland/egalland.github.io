(() => {
 'use strict';
 const fields=['note','done','appUrl','appTitle','promptMinutes','chatgptMinutes','devMinutes','opened'];
 const empty=()=>({version:1,days:[],settings:{vibeRateCents:null,devRateCents:null},updatedAt:null});
 const clone=value=>JSON.parse(JSON.stringify(value));
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
  if(key==='appUrl'&&value){let url;try{url=new URL(value);}catch{throw new Error('Lien invalide.');}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('Lien invalide.');}
 }
 const defaults={note:'',done:false,appUrl:'',appTitle:'',promptMinutes:null,chatgptMinutes:null,devMinutes:null,opened:false};
 function merge(latest,baseline,path,patch){
  const out=clone(latest);let dest,base,keys;
  if(path==='/api/settings'){dest=out.settings;base=baseline.settings;keys=['vibeRateCents','devRateCents'];}
  else {
   const m=path.match(/^\/api\/days\/([1-9]|[12][0-9]|3[01])$/);if(!m)throw new Error('Action inconnue.');
   const day=Number(m[1]);dest=out.days.find(r=>r.day===day);if(!dest){dest={day,...defaults};out.days.push(dest);}base={...defaults,...baseline.days.find(r=>r.day===day)};keys=fields;
  }
  if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length||Object.keys(patch).some(k=>!keys.includes(k)))throw new Error('Modification invalide.');
  for(const [key,value] of Object.entries(patch)){
   if(path==='/api/settings'){if(value!==null&&(!Number.isInteger(value)||value<0||value>10000000))throw new Error('Tarif invalide.');}
   else validate(key,value);
   const current=dest[key]??(key in defaults?defaults[key]:null),prior=base[key]??(key in defaults?defaults[key]:null);
   if(current!==prior&&current!==value)throw new Error('Cette valeur a changé ailleurs. Actualisez les données avant d’enregistrer ; votre brouillon reste dans le formulaire.');
   dest[key]=value;
  }
  if(path!=='/api/settings')dest.opened=true;
  out.days.sort((a,b)=>a.day-b.day);out.updatedAt=new Date().toISOString();return parse(out);
 }
 function encode(value){const bytes=new TextEncoder().encode(JSON.stringify(value,null,2)+'\n');let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary);}
 function decode(value){return parse(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(value.replace(/\s/g,'')),c=>c.charCodeAt(0)))));}
 window.githubCalendarStore={empty,parse,clone,merge,encode,decode};
})();
