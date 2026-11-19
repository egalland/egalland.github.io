import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,normalize} from '../dist/model.js';
import {compute} from '../dist/stats.js';
import {roomComfort} from '../dist/comfort.js';
import {hasNetwork,removeTechnicalPoints,technicalEstimate} from '../dist/technical.js';

test('disconnecting a mixed point preserves its water circuits across saving',()=>{
 const s=normalize(defaults());
 const p={id:'washer',kind:'washer',name:'Linge',source:'obj-1',levelId:'ground',x:2,y:2,via:{electric:{x:0,y:1}},circuit:'Linge'};
 s.technical.points.push(p);
 assert.equal(technicalEstimate(s).circuits.length,1);
 removeTechnicalPoints(s.technical,[p.id],'electric');
 const saved=normalize(s);
 const kept=saved.technical.points[0];
 assert.equal(hasNetwork(kept,'electric'),false);
 assert.equal(hasNetwork(kept,'cold'),true);
 assert.equal(kept.via.electric,undefined);
 assert.equal(technicalEstimate(saved).circuits.length,0);
 removeTechnicalPoints(saved.technical,[p.id]);
 assert.deepEqual(saved.technical.points,[]);
 assert.deepEqual(saved.technical.excluded,[p.source]);
});

test('comfort calculates flux, deduplicates fixtures and predicts shorter reverb after treatment',()=>{
 const s=normalize(defaults());
 const room=s.rooms[0];
 const x=room.x+1,y=room.y+1;
 s.objects.push({id:'physical-spot',kind:'spot',roomId:room.id,levelId:room.levelId,x:1,y:1,w:.2,l:.2,price:0});
 s.technical.points.push({id:'light',kind:'light',source:'physical-spot',levelId:room.levelId,x,y,via:{}});
 const measured=compute(s).roomRows[0];
 const info=roomComfort(s,measured);
 assert.equal(info.source,measured.area*room.lux/s.light.factor);
 assert.equal(info.lighting,1);
 assert.ok(info.rt>info.after&&info.after>0);
 assert.ok(info.openings>0&&info.soundReduction<s.acoustic.wallR);
 s.acoustic.target=.3;
 assert.ok(roomComfort(s,measured).extra>0);
});
