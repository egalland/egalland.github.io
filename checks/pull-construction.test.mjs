import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePullConstruction } from '../dist/pull-construction.js';

const sample = { chest: 104, length: 62, sleeve: 44, upperArm: 36, cuff: 19, neck: 44, armhole: 23, hem: 100 };
const step = { chest: 8, length: 2, sleeve: 1, upperArm: 2, cuff: 0.8, neck: 1.5, armhole: 1, hem: 8 };
const gauges = [[34, 44], [30, 40], [25, 34], [22, 30], [19, 26], [15, 21], [10, 14], [6, 9]];
const collars = ['round', 'v', 'high'];
const knitted = ['back', 'front', 'sleeve-left', 'sleeve-right', 'collar'];
const allIds = ['back', 'front', 'sleeve-left', 'sleeve-right', 'join-raglans', 'collar', 'assembly'];
const sum = spans => spans.reduce((n, [from, to]) => n + to - from + 1, 0);
const evenSt = x => 2 * Math.round(x / 2);
const made = (n = 0, collar = 'round', [stitches, rows] = gauges[3], m = {}, stitch = 'stockinette') => ({
  kind: 'pull', collar, stitch, gauge: { stitches, rows, manual: true },
  measures: { ...Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, v + step[k] * n])), ...m }
});
const by = (a, id) => a.pieces.find(piece => piece.id === id);

function inspect(p, a) {
  assert.ifError(a.error && Error(a.error));
  assert.deepEqual(a.pieces.map(x => x.id), allIds);
  const back = by(a, 'back'), front = by(a, 'front'), sleeve = by(a, 'sleeve-left'), second = by(a, 'sleeve-right'), col = by(a, 'collar');
  const stcm = p.gauge.stitches / 10, rcm = p.gauge.rows / 10;
  for (const piece of a.pieces) {
    assert.ok(piece.setup?.length && piece.finish?.length);
    if (!knitted.includes(piece.id)) {
      assert.equal(piece.mode, 'finish');
      assert.equal(piece.rows.length, 0);
      assert.ok(piece.tasks.length >= 4);
      continue;
    }
    const isPanel = piece.id !== 'collar';
    assert.equal(piece.setupCount, piece.castOn ?? piece.pickUp);
    assert.ok(piece.setup.includes(String(piece.setupCount)));
    let previous = piece.setupCount;
    for (const [index, row] of piece.rows.entries()) {
      assert.equal(row.before, previous);
      assert.ok(row.action.length && row.stitch.length);
      let last = -1;
      for (const [start, end] of row.spans) {
        assert.ok(Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start <= end && end < piece.width && start > last);
        last = end;
      }
      if (isPanel) {
        assert.equal(row.action.startsWith(index % 2 ? 'Envers.' : 'Endroit.'), true);
        if (index < piece.shaping.ribRows) {
          assert.equal(row.stitch, 'rib');
          assert.equal(row.phase, 'rib');
          assert.equal(row.colors, false);
          assert.equal(sum(row.spans), piece.setupCount);
        } else {
          assert.equal(row.stitch, p.stitch);
        }
      }
      if (row.spans.length === 2) {
        assert.equal(piece.id, 'front');
        assert.equal(row.spans[0][1] - row.spans[0][0], row.spans[1][1] - row.spans[1][0]);
      } else assert.equal(row.spans.length, 1);
      previous = sum(row.spans);
      assert.ok(previous >= 1);
    }
    assert.equal(piece.finishCount, previous);
    assert.equal(piece.bindOff, previous);
    if (isPanel) {
      const start = piece.shaping.underarmRow - 1;
      assert.equal(piece.shaping.raglanRow, start + 3);
      assert.equal(piece.mapping.vStart, piece.shaping.ribRows);
      assert.equal(piece.mapping.vEnd, piece.rows.length - 1);
      const under = a.seams.underarmBindOff;
      for (const ri of [start, start + 1]) {
        const row = piece.rows[ri], prev = piece.rows[ri - 1].spans[0], next = row.spans[0];
        assert.equal(row.phase, 'underarm');
        assert.equal(row.before - sum(row.spans), under);
        assert.ok(row.action.includes('rabattre ' + under + ' m.'));
        assert.deepEqual(next, ri % 2 ? [prev[0] + under, prev[1]] : [prev[0], prev[1] - under]);
      }
      const mid = piece.rows[start + 1].spans[0];
      assert.equal(mid[0] + mid[1], piece.width - 1);
      for (let i = start + 2; i < piece.rows.length; i++) {
        const prev = piece.rows[i - 1], row = piece.rows[i];
        const lo = row.spans[0][0] - prev.spans[0][0], hi = prev.spans.at(-1)[1] - row.spans.at(-1)[1];
        assert.ok(lo === hi && (lo === 0 || lo === 1));
        if (prev.spans.length === 2) {
          const inside = prev.spans[0][1] - row.spans[0][1];
          assert.ok(inside === 0 || inside === 1);
          const previousGroup = sum([prev.spans[0]]);
          if (lo && inside && previousGroup < 4) {
            assert.equal(previousGroup, 3);
            assert.ok(row.action.includes('3 m. ensemble'));
          }
          if (previousGroup === 1) assert.ok(!lo && !inside);
        }
      }
    }
  }
  assert.equal(back.rows.length, Math.round(p.measures.length * rcm));
  assert.equal(back.rows.length, front.rows.length);
  assert.equal(back.rows.length - back.shaping.underarmRow + 1, Math.round(p.measures.armhole * rcm));
  assert.equal(sleeve.shaping.underarmRow - 1, Math.round(p.measures.sleeve * rcm));
  assert.equal(back.castOn, evenSt(p.measures.hem * stcm / 2) + 2);
  assert.equal(sleeve.castOn, evenSt(p.measures.cuff * stcm) + 2);
  assert.equal(back.rows[back.shaping.underarmRow - 1].before, evenSt(p.measures.chest * stcm / 2) + 2);
  assert.equal(sleeve.rows[sleeve.shaping.underarmRow - 1].before, evenSt(p.measures.upperArm * stcm) + 2);
  assert.equal(sleeve.rows.length, second.rows.length);
  for (let r = 0; r < sleeve.rows.length; r++) assert.deepEqual(sleeve.rows[r].spans, second.rows[r].spans);
  const seam = a.seams;
  assert.ok(Math.abs(seam.bodyRaglanCm - seam.sleeveRaglanCm) <= 0.5 / rcm + 1e-9);
  for (const [piece, side] of [[back, 'body'], [sleeve, 'sleeve']]) {
    const start = piece.shaping.raglanRow - 1;
    const first = piece.rows[start - 1].spans[0][0], last = piece.rows.at(-1).spans[0][0];
    const count = piece.rows.length - start;
    assert.equal(count, seam[side + 'RaglanRows']);
    assert.ok(Math.abs(Math.hypot(count / rcm, (last - first) / stcm) - seam[side + 'RaglanCm']) < 1e-9);
  }
  const nr = front.shaping.neckRow - 1, split = front.rows[nr];
  assert.equal(nr % 2, 0); // right side, 0-indexed
  assert.equal(split.phase, 'neck');
  assert.equal(front.rows[nr - 1].spans.length, 1);
  assert.ok(split.action.includes('seconde pelote'));
  const center = split.spans[1][0] - split.spans[0][1] - 1;
  assert.equal(center, col.pickupSections.frontCenter);
  assert.equal(center === 0, p.collar === 'v');
  assert.equal(col.mode, p.collar === 'v' ? 'flat' : 'round');
  assert.equal(col.rows[0].action.startsWith(p.collar === 'v' ? 'Envers.' : 'En rond.'), true);
  assert.equal(col.pickUp, evenSt(p.measures.neck * stcm));
  assert.equal(Object.values(col.pickupSections).reduce((s, x) => s + x, 0), col.pickUp);
  assert.equal(col.pickupSections.sleeveLeft, sleeve.bindOff - 2);
  assert.equal(col.pickupSections.sleeveRight, second.bindOff - 2);
  assert.equal(col.pickupSections.back, back.bindOff - 2);
  assert.equal(col.pickupSections.frontLeft, col.pickupSections.frontRight);
  // Each picked stitch must be assignable to a distinct exposed stitch or row end.
  assert.ok(col.pickupSections.frontLeft <= front.rows.length - nr + split.spans[0][1] - front.rows.at(-1).spans[0][1] + front.bindOff / 2);
}

test('Six catalog sizes × eight weights × three collars: complete courses, counts, plausible hookups, matching seams', () => {
  let i = 0;
  for (const n of [-2, -1, 0, 1, 2, 3]) for (const gauge of gauges) for (const collar of collars) {
    const p = made(n, collar, gauge, {}, ['stockinette', 'seed', 'rib', 'garter'][i++ % 4]);
    inspect(p, makePullConstruction(p));
  }
  assert.equal(i, 144);
});

test('Independent dimensions, noninteger custom gauge, waist shaping and straight sleeve', () => {
  for (const m of [
    { hem: 120, chest: 100, upperArm: 42, cuff: 20, armhole: 25, sleeve: 48 },
    { hem: 92, chest: 116, upperArm: 40, cuff: 19, neck: 49, armhole: 25, length: 67 },
    { cuff: 32, upperArm: 32, chest: 100, hem: 100 }
  ]) {
    const p = made(0, 'round', [21.3, 28.8], m);
    inspect(p, makePullConstruction(p));
  }
});

test('Collar geometry, pickup order, V overlap and chronological assembly', () => {
  const variants = Object.fromEntries(collars.map(k => [k, makePullConstruction(made(0, k))]));
  assert.ok(variants.high.neckline.depthCm < variants.round.neckline.depthCm);
  assert.ok(variants.round.neckline.depthCm < variants.v.neckline.depthCm);
  assert.ok(by(variants.high, 'collar').rows.length > by(variants.round, 'collar').rows.length);
  assert.match(by(variants.v, 'collar').finish, /croiser les deux/);
  for (const a of Object.values(variants)) {
    const join = by(a, 'join-raglans');
    assert.equal(join.tasks.length, 5);
    assert.equal(join.tasks.filter(t => t.startsWith('Coudre ')).length, 4);
    assert.ok(join.tasks.some(t => t.includes(a.seams.bodyRaglanRows + ' rangs du corps')));
    assert.ok(by(a, 'assembly').tasks.every(t => !/raglan|relevage|relever/.test(t)));
  }
});

test('Unrealizable measures return a reason and no misleading partial pieces', () => {
  for (const p of [
    { ...made(), kind: 'robe' }, { ...made(), collar: 'other' },
    made(0, 'v', [3, 21], { neck: 12 }), made(0, 'round', [22, 30], { armhole: 55 }),
    made(0, 'high', [22, 30], { cuff: 42 }), made(0, 'round', [22, 30], { upperArm: 78, sleeve: 8 }),
    made(0, 'round', [38, 12], { hem: 188, chest: 77, length: 29, armhole: 15 }),
    made(0, 'round', [NaN, 30]), made(0, 'round', [22, 30], { length: Infinity }), null
  ]) {
    const a = makePullConstruction(p);
    assert.ok(a.error && a.error.length > 20);
    assert.deepEqual(a.pieces, []);
    assert.ok(a.warnings.includes(a.error));
  }
  const draft = made(); draft.gauge.manual = false;
  assert.ok(makePullConstruction(draft).warnings.some(x => x.includes('échantillon indicatif')));
});

test('Custom inputs: each successful plan is fully workable; impossible combinations are explicit', () => {
  let seed = 71629, success = 0, invalid = 0;
  const rand = () => (seed = seed * 48271 % 2147483647) / 2147483647;
  for (let i = 0; i < 400; i++) {
    const m = { chest: 25 + rand() * 175, neck: 14 + rand() * 64, armhole: 5 + rand() * 43,
      length: 18 + rand() * 92, sleeve: 8 + rand() * 69, upperArm: 12 + rand() * 54,
      cuff: 6 + rand() * 32, hem: 27 + rand() * 142 };
    const p = made(0, collars[i % 3], [4 + rand() * 34, 5 + rand() * 42], m);
    const a = makePullConstruction(p);
    if (a.error) { assert.equal(a.pieces.length, 0); invalid++; } else { inspect(p, a); success++; }
  }
  assert.ok(success > 70 && invalid > 150);
});
