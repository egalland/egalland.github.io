import {normalize,uid} from './model.js';

const FORMAT='atelier-habitat-plan';
export const VERSION_LIMIT=20;

export function captureVersion(data,levelId,name){
 return {id:uid(),name:name.trim().slice(0,70),date:new Date().toISOString(),levelId,data:structuredClone(data)};
}

export function packPlan(data,levelId,versions){
 return {format:FORMAT,revision:1,exportedAt:new Date().toISOString(),data,levelId,versions};
}

export function unpackPlan(raw){
 if(raw?.format!==FORMAT)return {data:normalize(raw),levelId:'ground',versions:[]};
 if(raw.revision!==1)throw Error('Ce format de sauvegarde est inconnu.');
 const data=normalize(raw.data),versions=[];
 for(const item of Array.isArray(raw.versions)?raw.versions.slice(0,VERSION_LIMIT):[]){
  if(!item?.data?.building||!Array.isArray(item.data.rooms))continue;
  const saved=normalize(item.data);
  const date=new Date(item.date);
  versions.push({...captureVersion(saved,validLevel(saved,item.levelId),typeof item.name==='string'?item.name:'Version importée'),date:Number.isFinite(date.getTime())?date.toISOString():new Date().toISOString()});
 }
 return {data,levelId:validLevel(data,raw.levelId),versions};
}

function validLevel(data,id){
 return data.levels.some(l=>l.id===id)?id:data.levels[0].id;
}
