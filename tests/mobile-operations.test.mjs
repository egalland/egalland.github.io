import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,objectRect} from '../dist/engine.js';
import {nudgeElement} from '../dist/mobile-operations.js';

test('small room moves stay exact and stop at the building edge',()=>{
 const s=defaults(),r=s.rooms[0],selection={type:'room',id:r.id};r.x=0;r.y=0;
 nudgeElement(s,selection,-.1,-.1);assert.equal(r.x,0);assert.equal(r.y,0);
 for(let i=0;i<20;i++)nudgeElement(s,selection,.1,0);
 assert.equal(r.x,2);nudgeElement(s,selection,100,100);
 assert.equal(r.x,s.building.w-r.w);assert.equal(r.y,s.building.l-r.l);
});
test('furniture leaves and re-enters a room using absolute coordinates on its own level',()=>{
 const s=defaults();s.levels.push({id:'upper',name:'Étage',kind:'floor',elevation:2.8,height:2.4,thickness:.2,platform:null});
 s.rooms=[{...s.rooms[0],id:'other-floor',levelId:'upper',x:2,y:1,w:4,l:4},{...s.rooms[0],id:'room',levelId:'ground',x:2,y:1,w:4,l:4}];
 s.objects=[{id:'o',kind:'plant',roomId:'room',levelId:'ground',x:3.3,y:1,w:.5,l:.5}];
 const selection={type:'object',id:'o'},o=s.objects[0];nudgeElement(s,selection,1,0);
 assert.equal(o.roomId,null);assert.equal(objectRect(s,o).x,6.3);assert.equal(objectRect(s,o).y,2);
 nudgeElement(s,selection,-1.5,0);assert.equal(o.roomId,'room');assert.equal(o.x,2.8);assert.equal(objectRect(s,o).x,4.8);
});
test('stairs stay independent of rooms when moved',()=>{
 const s=defaults();s.objects=[{id:'stair',kind:'stairs',roomId:null,levelId:'ground',x:0,y:0,w:.9,l:3.4}];
 nudgeElement(s,{type:'object',id:'stair'},.5,.1);assert.equal(s.objects[0].roomId,null);assert.equal(s.objects[0].x,.5);
});
test('opening arrows follow the wall and respect its usable length',()=>{
 const s=defaults();s.openings=[{id:'win',kind:'window',host:'room',roomId:s.rooms[0].id,wall:'north',offset:.5,w:1.2,h:1.2,sill:.9,levelId:'ground'}];
 const o=s.openings[0],selection={type:'opening',id:'win'};
 nudgeElement(s,selection,0,.5);assert.equal(o.offset,.5);
 nudgeElement(s,selection,.1,0);assert.equal(o.offset,.6);
 nudgeElement(s,selection,100,0);assert.ok(Math.abs(o.offset-(s.rooms[0].w-o.w))<1e-9);
 o.wall='east';o.offset=.5;nudgeElement(s,selection,.5,0);assert.equal(o.offset,.5);
 nudgeElement(s,selection,0,-100);assert.equal(o.offset,0);
});
test('imported free-wall openings keep their anchor while moving along it',()=>{
 const s=defaults();s.openings=[{id:'legacy',kind:'door',host:'free',roomId:null,wall:'north',anchorX:3,anchorY:4,offset:.2,w:.9,h:2.1,sill:0,levelId:'ground'}];
 nudgeElement(s,{type:'opening',id:'legacy'},.5,0);
 assert.equal(s.openings[0].offset,.7);assert.equal(s.openings[0].anchorX,3);assert.equal(s.openings[0].anchorY,4);
});
