'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Reglas = require('../sitio/js/reglas.js');

const full = { cells: [0, 1, 2, 3, 4] };
const base = extra => Object.assign({ name: 'prueba', rows: [full, full, full], drones: [] }, extra);

test('a pot is pushed one cell when the next cell is floor', () => {
  const pots = [{ row: 1, x: 2, sunk: false }];
  const res = Reglas.pushPot(pots, 1, 2, 1, () => 'floor');
  assert.deepEqual([res.moved, res.sunk, res.from], [true, false, 2]);
  assert.deepEqual(pots[0], { row: 1, x: 3, sunk: false });
});

test('a pot pushed into a hole plugs it and stops being an obstacle', () => {
  const pots = [{ row: 1, x: 2, sunk: false }];
  const res = Reglas.pushPot(pots, 1, 2, 1, () => 'hole');
  assert.equal(res.sunk, true);
  assert.equal(pots[0].sunk, true);
  assert.equal(Reglas.potAt(pots, 1, 3), null);
});

test('a pot does not move against the wall, another pot or a switched-off platform', () => {
  assert.equal(Reglas.pushPot([{ row: 1, x: 4, sunk: false }], 1, 4, 1, () => 'floor').moved, false);
  assert.equal(Reglas.pushPot([{ row: 1, x: 2, sunk: false }, { row: 1, x: 3, sunk: false }], 1, 2, 1, () => 'floor').moved, false);
  assert.equal(Reglas.pushPot([{ row: 1, x: 2, sunk: false }], 1, 2, 1, () => 'blocked').moved, false);
  assert.equal(Reglas.pushPot([], 1, 2, 1, () => 'floor'), null);
});

test('on ice Pipo slides until floor, a hole, a pot or the wall', () => {
  const look = map => x => map[x];
  assert.deepEqual(Reglas.slide(0, 1, look({ 1: 'ice', 2: 'ice', 3: 'floor', 4: 'floor' })), { x: 3, fall: false });
  assert.deepEqual(Reglas.slide(0, 1, look({ 1: 'ice', 2: 'hole' })), { x: 2, fall: true });
  assert.deepEqual(Reglas.slide(0, 1, look({ 1: 'ice', 2: 'ice', 3: 'blocked' })), { x: 2, fall: false });
  assert.deepEqual(Reglas.slide(1, 1, look({ 2: 'ice', 3: 'ice', 4: 'ice' })), { x: 4, fall: false });   // wall
  assert.deepEqual(Reglas.slide(3, -1, look({ 2: 'ice', 1: 'ice', 0: 'ice' })), { x: 0, fall: false });
});

test('a gust warns before it blows', () => {
  const w = { dir: 1, period: 4, on: 1.5 };
  assert.deepEqual(Reglas.gust(w, 0.5), { blowing: true, warn: false });
  assert.deepEqual(Reglas.gust(w, 2), { blowing: false, warn: false });
  assert.deepEqual(Reglas.gust(w, 3.5), { blowing: false, warn: true });
  assert.deepEqual(Reglas.gust(w, 4.2), { blowing: true, warn: false });
});

test('belts run backwards on the way down when the level says so', () => {
  assert.equal(Reglas.beltDir({ dir: 1 }, 'up', true), 1);
  assert.equal(Reglas.beltDir({ dir: 1 }, 'down', true), -1);
  assert.equal(Reglas.beltDir({ dir: -1 }, 'down', false), -1);
});

test('a stunned drone holds Pipo only where it froze', () => {
  const d = { row: 3, stun: 2, fx: 2.2 };
  assert.equal(Reglas.droneHolds(d, 3, 2), true);
  assert.equal(Reglas.droneHolds(d, 3, 3), false);
  assert.equal(Reglas.droneHolds(d, 4, 2), false);
  assert.equal(Reglas.droneHolds({ row: 3, stun: 0, fx: 2.2 }, 3, 2), false);
});

test('audit: a hole is crossed by pushing a pot into it', () => {
  const rows = [{ cells: [0, 1, 2] }, { cells: [0, 1, 2, 4] }, { cells: [4] }, { cells: [2, 3, 4] }];
  assert.match(Reglas.audit(base({ rows })).join('\n'), /no se puede llegar arriba/);
  assert.deepEqual(Reglas.audit(base({ rows, pots: [{ row: 1, x: 2 }] })), []);
});

test('audit: ice carries Pipo past the column he needs unless something stops him', () => {
  const rows = [full, { cells: [0] }, { cells: [0], ice: [1, 2, 3, 4] }, { cells: [2] }, { cells: [2] }];
  assert.match(Reglas.audit(base({ rows })).join('\n'), /no se puede llegar arriba/);
  const stop = [full, { cells: [0] }, { cells: [0, 3], ice: [1, 2] }, { cells: [3] }, { cells: [2, 3] }];
  assert.deepEqual(Reglas.audit(base({ rows: stop })), []);
});

test('audit: a drone crossing a gap is a bridge, and a belt counts as floor', () => {
  const rows = [{ cells: [0, 1, 2] }, { cells: [0, 1, 3] }, { cells: [3] }, { belt: { cells: [1, 2, 3], dir: 1 } }, { cells: [2] }];
  const lvl = base({ rows, drones: [{ row: 1, center: 2, span: 1.5 }] });
  assert.deepEqual(Reglas.audit(lvl), []);
  assert.match(Reglas.audit(Object.assign({}, lvl, { drones: [] })).join('\n'), /no se puede llegar arriba/);
});

test('audit: a drone can only be used as a bridge from its own floor, never from below', () => {
  // The only way up is the gap at floor 1 column 2; the drone flies over it but cannot be punched from floor 0.
  const rows = [{ cells: [2] }, {}, { cells: [2] }];
  const lvl = base({ rows, drones: [{ row: 1, center: 2, span: 1 }] });
  assert.match(Reglas.audit(lvl).join('\n'), /no se puede llegar arriba/);
});
