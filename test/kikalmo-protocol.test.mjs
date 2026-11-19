import test from 'node:test';
import assert from 'node:assert/strict';
import {avatarProfile,checkAvatarReturn,connectionUrl} from '../public/kikalmo-protocol.js';
import {normalizeAppearance} from '../public/kikalmo-schema.js';
const state=crypto.randomUUID(),link=crypto.randomUUID(),now=Date.now();
const envelope={type:'kikalmo.avatar.v1',state,name:'Pivoine',link,avatar:{shape:1,color:'#aa77cc',costume:163,adornment:227,facewear:94,unexpected:'private'}};
test('A consent return binds to one fresh request. Only wardrobe fields form a multiplayer appearance',()=>{
 const flow={state,created:now};const profile=checkAvatarReturn(envelope,flow,now);
 assert.equal(profile.link,link);assert.equal(profile.avatar.costume,163);assert.equal(profile.avatar.adornment,227);assert.equal(profile.avatar.unexpected,undefined);
 assert.equal(checkAvatarReturn(envelope,{...flow,state:link},now),null);
 assert.equal(checkAvatarReturn(envelope,flow,now+600001),null);
 assert.equal(checkAvatarReturn({...envelope,type:'other'},flow,now),null);
 assert(!('link' in normalizeAppearance({...profile.avatar,link})));
 assert.equal(avatarProfile({...envelope,avatar:{url:'https://example.org'}}),null);
 const url=new URL(connectionUrl(state,'return'));assert.equal(url.pathname,'/maille-city.html');assert.equal(url.search,'');assert.equal(new URLSearchParams(url.hash.slice(1)).get('state'),state);
});
