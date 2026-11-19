import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const directory = new URL('./', import.meta.url);
const read = path => readFileSync(new URL(path, directory));
test('GLB is self-contained, generic and has indexed meshes', () => {
  const data = read('models/muscles.glb');
  assert.equal(data.toString('ascii',0,4), 'glTF');
  assert.equal(data.readUInt32LE(4), 2);
  assert.equal(data.readUInt32LE(8), data.length);
  const document = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
  assert.ok(document.meshes.length > 100);
  assert.ok(document.nodes.length >= document.meshes.length);
  assert.ok(document.buffers.every(buffer => !buffer.uri));
});
test('local imports resolve and the attribution is provided', () => {
  const scan = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) scan(path);
      else if (/\.(?:js|html)$/.test(entry.name)) {
        const code = readFileSync(path, 'utf8');
        for (const [, target] of code.matchAll(/(?:from\s*|src=)["'](\.\.?\/[^"'?#]+)(?:[?#][^"']*)?["']/g)) {
          assert.ok(statSync(new URL(target, pathToFileURL(path))).isFile(), target);
        }
      }
    }
  };
  scan(new URL('.', directory).pathname);
  for (const file of ['licenses/ATTRIBUTION.md','licenses/LICENSE-DATA.md','licenses/THREE-LICENSE.txt']) assert.ok(read(file).length > 500);
});
