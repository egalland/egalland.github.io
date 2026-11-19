import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeEvents } from './analysis.mjs';
const event = (minute, action, more = {}) => ({name: 'Agent Démo', at: new Date(Date.UTC(2000, 0, 1, 0, minute)).toISOString(), action, ...more});
test('orders events and reconstructs a double pause and a sale', () => {
  const logs = [event(0, 'join'), event(2, 'factory/pause', { order:{ target:'A' } }), event(3, 'factory/pause', { order:{ target:'B' } }), event(8, 'factory/pause', {order:{target:'B'}}), event(10, 'townSell/', { before:{credits:1}, after:{credits:4} })];
  const [result] = analyzeEvents(logs.reverse());
  assert.equal(result.pausePct, 50);
  assert.equal(result.sales, 1);
  assert.equal(result.revenue, 3);
});
test('reports gaps and recovers empty input', () => {
  const [result] = analyzeEvents([event(0, 'townSell/')]);
  assert.equal(result.pausePct, null);
  assert.equal(result.unvaluedSales, 1);
  assert.deepEqual(analyzeEvents([]), []);
});
