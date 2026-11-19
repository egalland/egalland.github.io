import test from 'node:test';
import assert from 'node:assert/strict';
import {pinchView} from '../dist/gestures.js';
const bounds={x:-1.15,y:-1.2,w:17.3,h:12.4};
function screenPoint(world,view,viewport){const w=bounds.w/view.zoom,h=bounds.h/view.zoom,x=bounds.x+bounds.w/2-w/2+view.panX,y=bounds.y+bounds.h/2-h/2+view.panY,scale=Math.min(viewport.width/w,viewport.height/h);return{x:(world.x-x)*scale+(viewport.width-w*scale)/2,y:(world.y-y)*scale+(viewport.height-h*scale)/2};}
for(const viewport of [{width:360,height:550},{width:393,height:570},{width:700,height:210}])test(`pinch keeps its world anchor under the moving fingers at ${viewport.width}px`,()=>{const anchor={x:5.6,y:3.2},center={x:viewport.width*.63,y:viewport.height*.41};const v=pinchView({bounds,zoom:2.6,anchor,center,viewport});const result=screenPoint(anchor,v,viewport);assert.ok(Math.abs(result.x-center.x)<1e-9);assert.ok(Math.abs(result.y-center.y)<1e-9);});
test('pinch remains anchored when the requested zoom reaches its limits',()=>{const viewport={width:393,height:570},anchor={x:9,y:4},center={x:190,y:260};for(const zoom of [.01,100]){const v=pinchView({bounds,zoom,anchor,center,viewport});assert.ok(v.zoom>=.5&&v.zoom<=6);const result=screenPoint(anchor,v,viewport);assert.ok(Math.abs(result.x-center.x)<1e-9&&Math.abs(result.y-center.y)<1e-9);}});
