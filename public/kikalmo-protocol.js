import {normalizeAppearance} from './kikalmo-schema.js';

export const KIKALMO_ORIGIN='https://kikalmo.emmanuel-galland117.chatgpt.site';
export const UUID_PATTERN=/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
export function avatarProfile(input) {
  if (!input || typeof input.name!=='string')return null;
  const name=[...input.name.trim().replace(/[\u0000-\u001f\u007f]/g,'')].slice(0,20).join('');
  const avatar=normalizeAppearance(input.avatar);
  if(!name||!avatar)return null;
  return {name,avatar,...(typeof input.link==='string'&&UUID_PATTERN.test(input.link)?{link:input.link}:{})};
}
export function checkAvatarReturn(message,pending,now=Date.now()){
  if(message?.type!=='kikalmo.avatar.v1' || !pending || message.state!==pending.state ||
     !UUID_PATTERN.test(pending.state) || !Number.isFinite(pending.created) ||
     now-pending.created>600000 || now<pending.created-5000)return null;
  return avatarProfile(message);
}
export function connectionUrl(state,mode){
  const url=new URL('/maille-city.html',KIKALMO_ORIGIN);
  url.hash=new URLSearchParams({state,mode}).toString();
  return url.href;
}
