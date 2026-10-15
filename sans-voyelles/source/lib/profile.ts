export const PROFILE_KEY='sv-profile-v1';
export const COLORS=['#d8fc70','#c8b9ff','#ffae92','#8fe1dd','#f8d779','#ff8eb2','#80baff','#f2ede0','#bfa1ff','#b5dd9b'];
export const PARTS=[
 {key:'shape',label:'Visage',options:['Tout rond','Carré doux','Ovale','Petite poire','Nuage','Grand menton']},
 {key:'hair',label:'Coiffure',options:['Sans cheveux','Mèche rousse','Laine pétrole','Banane dorée','Boucles auburn','Carré de laine','Bonnet marine']},
 {key:'eyes',label:'Yeux',options:['Grand ouverts','Malicieux','Émerveillés','Petites perles','Endormis','Rieurs']},
 {key:'mouth',label:'Bouche',options:['Sourire','Grand rire','Surprise','Petit sourire','Grimace','La langue']},
 {key:'accessory',label:'Accessoires',options:['Sans accessoire','Lunettes miel','Lunettes de soleil','Petite fleur','Joues roses','Moustache de laine','Foulard corail']},
 {key:'outfit',label:'Vêtements',options:['Chemise rayée','Pull sauge','Veste prune','Sweat marine','Gilet rouille','Tweed et nœud']},
] as const;
export type PartKey=typeof PARTS[number]['key'];
export type Avatar={shape:number;hair:number;eyes:number;mouth:number;accessory:number;outfit:number;color:string};
export type Profile={version:1;name:string;avatar:Avatar};
export const DEFAULT_AVATAR:Avatar={shape:0,hair:1,eyes:0,mouth:0,accessory:0,outfit:0,color:'#f8d779'};
export function cleanAvatar(raw:unknown):Avatar{const value=(raw&&typeof raw==='object'?raw:{}) as Record<string,unknown>;const result={...DEFAULT_AVATAR};for(const p of PARTS){const n=value[p.key];result[p.key]=typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<p.options.length?n:DEFAULT_AVATAR[p.key];}result.color=typeof value.color==='string'&&COLORS.includes(value.color)?value.color:DEFAULT_AVATAR.color;return result;}
export function parseProfile(value:string|null):Profile|null{try{if(!value)return null;const p=JSON.parse(value);if(p.version!==1||typeof p.name!=='string'||!p.name.trim()||p.name.trim().length>20||!p.avatar||typeof p.avatar!=='object')return null;return {version:1,name:p.name.trim(),avatar:cleanAvatar(p.avatar)};}catch{return null;}}
export function randomIndex(length:number,current?:number){if(length<2)return 0;let n=Math.floor(Math.random()*(current===undefined?length:length-1));if(current!==undefined&&n>=current)n++;return n;}
export function shufflePart(avatar:Avatar,key:PartKey):Avatar{const part=PARTS.find(p=>p.key===key)!;return {...avatar,[key]:randomIndex(part.options.length,avatar[key])};}
export function shuffleColor(avatar:Avatar):Avatar{return {...avatar,color:COLORS[randomIndex(COLORS.length,COLORS.indexOf(avatar.color))]};}
export function randomAvatar(previous:Avatar=DEFAULT_AVATAR):Avatar{let avatar=shuffleColor(previous);for(const p of PARTS)avatar=shufflePart(avatar,p.key);return avatar;}
const NOUNS=['Kiwi','Panda','Lama','Pixel','Nuage','Koala','Poulpe','Biscuit','Renard','Citron','Tacos','Canard','Piment','Yéti','Robot','Flocon'];
const ADJECTIVES=['Cosmique','Magique','Solaire','Furtif','Malin','Électrique','Lunaire','Sauvage','Épique','Zen','Mystique','Turbo'];
const NAMES=NOUNS.flatMap(n=>ADJECTIVES.map(a=>n+a));
export function randomName(previous=''){const index=NAMES.indexOf(previous);return NAMES[randomIndex(NAMES.length,index<0?undefined:index)];}
