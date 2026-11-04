import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,validateCabinet} from '../src/model.ts';

test('an exported cabinet round-trips its text, imagery and placement',()=>{
 const a=defaults();a.title='Salon personnel';a.objects[0].title='<Un souvenir & ses éclats>';a.objects[0].image='data:image/png;base64,aGVsbG8=';a.objects[0].behaviors=['rescue','zip','defense'];a.objects[0].discovered=['zip'];a.objects[0].x=2.4;
 assert.deepEqual(validateCabinet(JSON.parse(JSON.stringify(a))),a);
});
test('an empty cabinet is valid and does not repopulate itself',()=>{const a=defaults();a.objects=[];assert.deepEqual(validateCabinet(a),a);});
test('rejects non-finite coordinates, oversized scenes and duplicate identifiers',()=>{
 for(const mutate of [a=>a.objects[0].x=Infinity,a=>a.objects[0].scale=-1,a=>a.objects[0].z=7,a=>a.objects.push({...a.objects[0]}),a=>a.objects=Array.from({length:25},(_,i)=>({...a.objects[0],id:String(i)}))]){const a=defaults();mutate(a);assert.throws(()=>validateCabinet(a));}
});
test('refuses remote URLs, SVG markup, unsupported behavior and invalid images',()=>{
 for(const value of ['https://example.com/image.jpg','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,?!']){const a=defaults();a.objects[0].image=value;assert.throws(()=>validateCabinet(a));}
 const a=defaults();a.objects[0].behaviors=['unknown'];assert.throws(()=>validateCabinet(a));
});
test('keeps the existing cabinet untouched after an invalid import',()=>{const original=defaults(),before=JSON.stringify(original),bad=structuredClone(original);bad.objects[2].title='';assert.throws(()=>validateCabinet(bad));assert.equal(JSON.stringify(original),before);});
test('only retains supported persisted properties and discovery tags',()=>{const a=defaults();a.objects[0].unexpected='ignored';a.objects[0].discovered=['zip','rescue'];a.objects[0].behaviors=['rescue','rescue'];const result=validateCabinet(a);assert.equal(result.objects[0].unexpected,undefined);assert.deepEqual(result.objects[0].discovered,['rescue']);assert.deepEqual(result.objects[0].behaviors,['rescue']);});
