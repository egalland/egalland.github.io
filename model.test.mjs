import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarize } from './bilan-model.mjs';
import { chartWindow } from './chart-window.mjs';
const { rows } = JSON.parse(readFileSync(new URL('./example.json', import.meta.url)));

test('combines comparable estimates and line counts', () => {
  const day = summarize(rows[0].date, rows);
  assert.equal(day.gapMin, 60);
  assert.equal(day.gapMax, 150);
  assert.equal(day.net, 13);
});
test('omitted estimates stay unknown', () => {
  const day = summarize('2000-01-02', [{ date: '2000-01-02' }]);
  assert.equal(day.vmin, null);
  assert.equal(day.net, null);
  assert.equal(day.vibePartial, true);
});
test('compact chart separates older and current days', () => {
  const days = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepEqual(chartWindow(days, true, 1).days, [1]);
  assert.deepEqual(chartWindow(days, true).days, days.slice(1));
});
