import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainHeight,terrainGradient,sectorHeightGrid,selectSectorTerrain,buildingGround,waterLevel} from '../public/terrain-height.js';
import {water} from '../public/paris-data.js';

const map=(lon,lat)=>[(lon-2.25)*73190,(48.88-lat)*111320];
test('the embedded IGN street elevations preserve the Montmartre hill, Seine crossing and western ridge',()=>{
  const montmartre=terrainHeight(...map(2.343,48.88675));
  const pigalle=terrainHeight(...map(2.337,48.882));
  const deck=terrainHeight(325,-740),parvis=terrainHeight(-1034,-1399);
  assert.ok(montmartre>110&&montmartre<135);
  assert.ok(montmartre-pigalle>45);
  assert.ok(parvis-deck>25);
  assert.ok(water.some(lake=>deck-waterLevel(lake)>3&&deck-waterLevel(lake)<9));
});
test('height and grade stay continuous when crossing a 32 m raster seam on a steep street',()=>{
  const x=6784,y=-623;
  const left=terrainHeight(x-.002,y),right=terrainHeight(x+.002,y);
  assert.ok(Math.abs(left-right)<.001);
  assert.ok(Math.abs(terrainGradient(x-.1,y).x-terrainGradient(x+.1,y).x)<.003);
});
test('live WFS sectors keep their local road elevations after a cache round trip',t=>{
  const x=12300,y=11400,bounds=[x,y,x+320,y+320],lines=[];
  for(let row=0;row<=8;row++){
    const line=[];
    for(let col=0;col<=8;col++)line.push([2.25+(x+col*40)/73190,48.88-(y+row*40)/111320,98+col*4]);
    lines.push(line);
  }
  const data=sectorHeightGrid(lines,bounds);assert.ok(data);
  t.after(()=>selectSectorTerrain(null));selectSectorTerrain(JSON.parse(JSON.stringify(data)));
  const slope=terrainGradient(x+160,y+160),h=terrainHeight(x+160,y+160);
  assert.ok(Math.abs(h-114)<.25&&Math.abs(slope.x-.1)<.01&&Math.abs(slope.y)<.003);
  const roof=[[x+100,y+160],[x+160,y+100],[x+220,y+160],[x+160,y+220]];
  assert.ok(Math.abs(buildingGround(roof)-h)<.001);
  assert.equal(sectorHeightGrid([[[2.25,48.88],[2.26,48.88]]],bounds),null);
});
