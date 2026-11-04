export const THEMES = [
  { id:'rescue', day:11, name:'Sauvetage', verb:'Rassembler les fragments', icon:'HeartHandshake', detail:'Une forme brisée retrouve son unité. Cliquez à nouveau pour libérer les fragments.' },
  { id:'flight', day:18, name:'Incapable de voler', verb:'Tenter l’envol', icon:'Feather', detail:'Les ailes s’agitent. L’objet s’élève… et la gravité le rappelle doucement.' },
  { id:'salon', day:20, name:'Salon', verb:'Faire respirer le salon', icon:'Armchair', detail:'Un halo accueille le visiteur. Le salon prend une respiration autour de cet objet.' },
  { id:'zip', day:26, name:'Fermeture éclair', verb:'Ouvrir le passage', icon:'UnfoldVertical', detail:'La matière s’écarte et laisse apparaître le souvenir caché à l’intérieur.' },
  { id:'silly', day:27, name:'Stupide', verb:'Provoquer l’impossible', icon:'Orbit', detail:'L’objet perd son sérieux, se dandine et invente une réponse parfaitement absurde.' },
  { id:'trophy', day:28, name:'Trophée', verb:'Célébrer la curiosité', icon:'Award', detail:'Une couronne d’étoiles se déploie autour de votre pièce de collection.' },
  { id:'defense', day:29, name:'Défense', verb:'Déployer la protection', icon:'Shield', detail:'Deux défenses sculptées veillent sur la graine. Une enceinte de verre se referme pour préserver ce qui grandit.' },
  { id:'bend', day:31, name:'Fléchir', verb:'Courber la matière', icon:'Waves', detail:'La sculpture se plie sans rompre. Sa silhouette change sous une force invisible.' },
] as const;
export type Behavior = typeof THEMES[number]['id'];
export const SHAPES = [{id:'bird',name:'L’oiseau de cuivre'},{id:'orb',name:'La sphère fragmentée'},{id:'chair',name:'Le fauteuil miniature'},{id:'portal',name:'Le cadre secret'},{id:'creature',name:'Le gardien distrait'},{id:'trophy',name:'L’astre couronné'},{id:'seed',name:'La graine précieuse'},{id:'ribbon',name:'Le ruban vivant'}] as const;
export type Shape = typeof SHAPES[number]['id'];
export interface Curiosity { id:string; title:string; story:string; secret:string; shape:Shape; color:string; behaviors:Behavior[]; x:number; z:number; scale:number; rotation:number; image?:string; discovered:Behavior[]; }
export interface Cabinet { version:1; title:string; ambience:'night'|'amber'|'dawn'; objects:Curiosity[]; }
export const colors = ['#c49356','#d3c6a3','#779b8d','#a66d58','#8194af','#c4a56c'];
export function defaults():Cabinet {
 const rows:[string,string,string,Shape,Behavior,number,number,string][]=[
  ['Ce qui reste','Même brisé, un souvenir conserve sa forme. Approchez les morceaux : ils se souviennent encore les uns des autres.','Les fissures aussi savent dessiner des chemins.','orb','rescue',-5,-2.7,'#d3c6a3'],
  ['Le rêve d’Icare','Il possède tout ce qu’il faut pour voler. Sauf, peut-être, la permission de quitter son socle.','On peut aller très loin sans quitter la pièce.','bird','flight',-1.8,-2.5,'#c49356'],
  ['Une place pour l’absence','Un fauteuil attend quelqu’un qui n’est pas encore arrivé. Ici, même le silence peut s’asseoir.','Prenez le temps. Cette place est la vôtre.','chair','salon',2,-2.6,'#779b8d'],
  ['De l’autre côté','Un cadre qui ne contient pas une image, mais une possibilité. La couture du réel n’est jamais tout à fait fermée.','Derrière les choses ordinaires, il reste toujours une porte.','portal','zip',5,-2.7,'#c49356'],
  ['Le gardien distrait','Chargé de surveiller l’éternité, il a oublié pourquoi. Il prend néanmoins sa mission très au sérieux.','J’ai rangé l’infini dans le mauvais tiroir.','creature','silly',-5,1.2,'#a66d58'],
  ['La petite victoire','Pour toutes les choses achevées, même celles que personne n’a vues. Un astre à la mesure de vos efforts.','Ce que vous avez fait aujourd’hui compte.','trophy','trophy',-1.8,1.7,'#c4a56c'],
  ['Le dernier printemps','Une graine fragile, protégée par une architecture de verre. Tout ce qui grandit commence par être vulnérable.','Garder vivant ce qui peut encore pousser.','seed','defense',2,1.6,'#779b8d'],
  ['L’élégance de céder','La matière a appris une chose que nous oublions parfois : se courber est aussi une façon de tenir.','Plier n’est pas disparaître.','ribbon','bend',5,1.2,'#d3c6a3'],
 ];
 return {version:1,title:'Le salon des étranges',ambience:'night',objects:rows.map((a,i)=>({id:'piece-'+i,title:a[0],story:a[1],secret:a[2],shape:a[3],behaviors:[a[4]],x:a[5],z:a[6],color:a[7],scale:1,rotation:0,discovered:[]}))};
}
const bounded=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validateCabinet(input:unknown):Cabinet {
 if(!input||typeof input!=='object')throw Error('Ce fichier ne contient pas un cabinet.');
 const a=input as Cabinet;
 if(a.version!==1||!Array.isArray(a.objects)||a.objects.length>24||typeof a.title!=='string'||a.title.length>80||!['night','amber','dawn'].includes(a.ambience))throw Error('Format de cabinet non reconnu (version 1, 24 objets maximum).');
 const ids=new Set<string>();
 const objects=a.objects.map(o=>{
  if(!o||typeof o.id!=='string'||!o.id||o.id.length>80||ids.has(o.id)||typeof o.title!=='string'||!o.title.trim()||o.title.length>60||typeof o.story!=='string'||o.story.length>600||typeof o.secret!=='string'||o.secret.length>400||!SHAPES.some(s=>s.id===o.shape)||!/^#[0-9a-f]{6}$/i.test(o.color)||!Array.isArray(o.behaviors)||!o.behaviors.length||o.behaviors.length>8||o.behaviors.some(b=>!THEMES.some(t=>t.id===b))||!bounded(o.x,-6,6)||!bounded(o.z,-3.2,3.5)||!bounded(o.scale,.5,1.5)||!bounded(o.rotation,-180,180))throw Error('Une curiosité contient des valeurs invalides. Rien n’a été remplacé.');
  if(o.image!==undefined&&(typeof o.image!=='string'||o.image.length>1500000||!/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(o.image)))throw Error('Image non prise en charge.');
  ids.add(o.id);
  return {id:o.id,title:o.title,story:o.story,secret:o.secret,shape:o.shape,color:o.color,behaviors:[...new Set(o.behaviors)],x:o.x,z:o.z,scale:o.scale,rotation:o.rotation,...(o.image?{image:o.image}:{}),discovered:Array.isArray(o.discovered)?o.discovered.filter(b=>o.behaviors.includes(b)):[]};
 });
 return {version:1,title:a.title,ambience:a.ambience,objects};
}
let database:Promise<IDBDatabase>|undefined;
function db(){return database??=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('cabinet-des-impossibles',1);r.onupgradeneeded=()=>r.result.createObjectStore('cabinet');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function loadCabinet():Promise<Cabinet|null>{const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('cabinet').objectStore('cabinet').get('current');r.onsuccess=()=>{try{resolve(r.result?validateCabinet(r.result):null);}catch(e){reject(e);}};r.onerror=()=>reject(r.error);});}
export async function saveCabinet(data:Cabinet){const snapshot=structuredClone(data);const d=await db();return new Promise<void>((resolve,reject)=>{const t=d.transaction('cabinet','readwrite');t.objectStore('cabinet').put(snapshot,'current');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
