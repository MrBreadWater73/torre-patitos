'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Reglas = require('../sitio/js/reglas.js');

test('the same seed always builds the same tower, and another seed a different one', () => {
  assert.deepEqual(Reglas.generate(11, 30), Reglas.generate(11, 30));
  assert.notDeepEqual(Reglas.generate(11, 30).rows, Reglas.generate(12, 30).rows);
});

test('every generated tower can be completed, up and down', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const lvl = Reglas.generate(seed, 30);
    assert.equal(lvl.rows.length, 31, 'seed ' + seed);
    assert.equal(lvl.packages.length, 3, 'seed ' + seed);
    assert.ok(lvl.down && lvl.down.chase, 'seed ' + seed);
    assert.deepEqual(Reglas.audit(lvl), [], 'seed ' + seed);
  }
});

test('a generated tower mixes at least four kinds of floor', () => {
  const kinds = new Set();
  for (const r of Reglas.generate(3, 30).rows) for (const k of ['crumble', 'blink', 'moving', 'wind', 'belt', 'ice']) if (r[k]) kinds.add(k);
  assert.ok(kinds.size >= 4, [...kinds].join(','));
});

test('the whole family follows in a line, each one a landing behind the previous', () => {
  const trail = Reglas.newTrail(9, 2, 3);
  for (const [row, x] of [[8, 2], [7, 2], [7, 3], [6, 3]]) Reglas.pushTrail(trail, row, x);
  assert.deepEqual(Reglas.followerSpot(trail, 0), { row: 7, x: 3 });
  assert.deepEqual(Reglas.followerSpot(trail, 1), { row: 7, x: 2 });
  assert.deepEqual(Reglas.followerSpot(trail, 2), { row: 8, x: 2 });
});

test('the shutdown waits, then comes down from above at a steady pace', () => {
  const chase = { speed: .5, delay: 2 };
  assert.equal(Reglas.chaseLine(30, 0, chase), 32);
  assert.equal(Reglas.chaseLine(30, 2, chase), 32);
  assert.equal(Reglas.chaseLine(30, 6, chase), 30);
  assert.equal(Reglas.chaseDead(30, 29), false);
  assert.equal(Reglas.chaseDead(30, 31), true);
});
