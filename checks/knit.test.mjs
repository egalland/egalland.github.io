import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultState,validateState,floodFill,resizePattern,rowRuns,PRESETS,pattern} from '../dist/knit.js';
test('A project round-trips without losing colors, dimensions or knitting progress',()=>{const s=defaultState();s.progress=17;s.palette[1].hex='#abcdef';s.name='<Mon pull>';assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))),s);});
test('Import rejects malformed grids and out-of-palette cells',()=>{const s=defaultState();s.grid[0][0]=8;assert.throws(()=>validateState(s),/incomplet ou invalide/);s.grid[0][0]=0;s.rows=100000;assert.throws(()=>validateState(s),/8 à 64/);});
test('Fill respects disconnected areas',()=>{const grid=[[0,1,0],[0,1,0],[1,1,0]];floodFill(grid,0,0,2);assert.deepEqual(grid,[[2,1,0],[2,1,0],[1,1,0]]);});
test('Resizing preserves existing chart in the common area',()=>{assert.deepEqual(resizePattern([[1,0],[2,1]],3,3),[[1,0,0],[2,1,0],[0,0,0]]);});
test('Row instructions start at the bottom right; flat knitting alternates',()=>{const s={rows:2,progress:1,direction:'round',grid:[[0,1,1],[2,2,0]]};assert.deepEqual(rowRuns(s),[{color:0,count:1},{color:2,count:2}]);s.progress=2;s.direction='flat';assert.deepEqual(rowRuns(s),[{color:0,count:1},{color:1,count:2}]);});
test('All supplied patterns can be exported and restored at the largest supported size',()=>{for(const p of PRESETS){const s=defaultState();s.cols=64;s.rows=64;s.grid=pattern(p.id,64,64);assert.equal(validateState(s).grid.flat().length,4096);}});
