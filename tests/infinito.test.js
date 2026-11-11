'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Reglas = require('../sitio/js/reglas.js');

const E = Reglas.ENDLESS;

test('the rising line waits, then climbs faster and faster until it reaches its cap', () => {
  assert.equal(Reglas.riseLine(0), E.start);
  assert.equal(Reglas.riseLine(E.delay), E.start);                       // nothing moves during the grace time
  let prev = Reglas.riseLine(E.delay);
  for (let t = E.delay + .5; t < 400; t += .5) {
    const now = Reglas.riseLine(t), speed = (now - prev) / .5;
    assert.ok(now > prev, 't ' + t);
    assert.ok(speed <= E.cap + 1e-9, 'speed ' + speed + ' at ' + t);
    prev = now;
  }
  const late = (Reglas.riseLine(500) - Reglas.riseLine(400)) / 100;
  assert.ok(Math.abs(late - E.cap) < 1e-9);                                // long runs climb at the cap
});

test('the line never outruns a perfect player and starts slow enough for a person', () => {
  assert.ok(E.cap < .45, 'a person must be able to keep ahead of the cap');
  assert.ok(E.base <= .15, 'the start must give time to think');
  assert.ok(E.delay >= 3);
});

test('assist mode slows the line by the same factor as the final shutdown', () => {
  const t = 60, free = Reglas.riseLine(t) - E.start, slow = Reglas.riseLine(t, Reglas.ASSIST.chase) - E.start;
  assert.ok(Math.abs(slow - free * Reglas.ASSIST.chase) < 1e-9);
});

test('a floor is gone once the line is half a floor above it, and Pipo is caught by the same rule', () => {
  assert.equal(Reglas.riseGone(0, 0), false);
  assert.equal(Reglas.riseGone(.5, 0), false);
  assert.equal(Reglas.riseGone(.51, 0), true);
  assert.equal(Reglas.riseGone(10, 10), false);
  assert.equal(Reglas.riseGone(10, 9), true);
  assert.equal(Reglas.riseGone(E.start, 0), false);                        // the starting floor is safe at first
});

test('difficulty rises every three segments and stops rising at tier 5', () => {
  assert.equal(Reglas.endlessTier(0), 0);
  assert.equal(Reglas.endlessTier(2), 0);
  assert.equal(Reglas.endlessTier(3), 1);
  assert.equal(Reglas.endlessTier(14), 4);
  assert.equal(Reglas.endlessTier(15), 5);
  assert.equal(Reglas.endlessTier(500), 5);
});

test('a segment is the same for the same seed and different for another', () => {
  assert.deepEqual(Reglas.endlessSegment(7, 2), Reglas.endlessSegment(7, 2));
  assert.notDeepEqual(Reglas.endlessSegment(7, 2).rows, Reglas.endlessSegment(8, 2).rows);
});

test('a segment has a safe floor at each end, five floors between and a flag at the top', () => {
  for (let tier = 0; tier <= 5; tier++) for (let seed = 1; seed <= 20; seed++) {
    const s = Reglas.endlessSegment(seed, tier), first = s.rows[0], last = s.rows[s.rows.length - 1];
    assert.equal(s.rows.length, 7, 'tier ' + tier + ' seed ' + seed);
    assert.deepEqual(first.cells, [0, 1, 2, 3, 4]);
    assert.deepEqual(last.cells, [0, 1, 2, 3, 4]);
    assert.equal(last.checkpoint, true);
    assert.equal(s.bridges, false);
  }
});

test('every segment the generator hands out can be completed', () => {
  for (let tier = 0; tier <= 5; tier++) for (let seed = 1; seed <= 25; seed++) {
    assert.deepEqual(Reglas.audit(Reglas.endlessSegment(seed, tier)), [], 'tier ' + tier + ' seed ' + seed);
  }
});

test('early tiers only use the mechanics the player already knows', () => {
  const kinds = rows => { const k = new Set(); rows.forEach(r => ['blink', 'wind', 'belt', 'ice', 'moving', 'crumble'].forEach(n => { if (r[n]) k.add(n); })); return k; };
  for (let seed = 1; seed <= 40; seed++) {
    const t0 = kinds(Reglas.endlessSegment(seed, 0).rows);
    for (const forbidden of ['blink', 'wind', 'belt', 'ice']) assert.ok(!t0.has(forbidden), forbidden + ' in tier 0, seed ' + seed);
  }
  const all = new Set(); for (let seed = 1; seed <= 40; seed++) Reglas.endlessSegment(seed, 5).rows.forEach(r => ['blink', 'wind', 'belt', 'ice'].forEach(n => { if (r[n]) all.add(n); }));
  assert.deepEqual([...all].sort(), ['belt', 'blink', 'ice', 'wind']);
});

test('later tiers put more drones on the floors than the first one', () => {
  const count = tier => { let n = 0; for (let seed = 1; seed <= 40; seed++) n += Reglas.endlessSegment(seed, tier).drones.length; return n; };
  assert.ok(count(5) > count(0), count(0) + ' vs ' + count(5));
});

test('drones never patrol the safe floors, plates, glass or moving platforms', () => {
  for (let tier = 0; tier <= 5; tier++) for (let seed = 1; seed <= 25; seed++) {
    const s = Reglas.endlessSegment(seed, tier);
    for (const d of s.drones) {
      const row = s.rows[d.row];
      assert.ok(d.row >= 1 && d.row <= 5, 'row ' + d.row);
      assert.ok(row.cells && !row.blink && !row.crumble && !row.moving && !row.checkpoint, 'tier ' + tier + ' seed ' + seed + ' row ' + d.row);
    }
  }
});

test('plates in a segment blink together so they can always be crossed', () => {
  for (let seed = 1; seed <= 40; seed++) for (const r of Reglas.endlessSegment(seed, 4).rows) if (r.blink) assert.ok(r.blink.every(b => b.o === 0));
});

test('the segment of a run sits on top of the previous one with absolute floors', () => {
  const a = Reglas.endlessSegmentAt(123, 0), b = Reglas.endlessSegmentAt(123, 1);
  assert.equal(a.rows.length, 6);
  assert.equal(a.base, 0);
  assert.equal(b.base, 6);
  for (const d of b.drones) assert.ok(d.row >= 7 && d.row <= 11, 'drone row ' + d.row);
  assert.equal(a.rows[a.rows.length - 1].checkpoint, true);
  assert.deepEqual(Reglas.endlessSegmentAt(123, 4), Reglas.endlessSegmentAt(123, 4));
  assert.notDeepEqual(Reglas.endlessSegmentAt(123, 4).rows, Reglas.endlessSegmentAt(124, 4).rows);
});

test('the game only serves segments the test bot has completed', () => {
  for (let tier = 0; tier <= 5; tier++) {
    const seeds = Reglas.ENDLESS_SEEDS[tier];
    assert.ok(seeds && seeds.length >= 20, 'tier ' + tier + ' has ' + (seeds && seeds.length));
    assert.equal(new Set(seeds).size, seeds.length);
    for (const seed of seeds) assert.deepEqual(Reglas.audit(Reglas.endlessSegment(seed, tier)), [], 'tier ' + tier + ' seed ' + seed);
  }
  for (const run of [1, 99, 123456789]) for (let i = 0; i < 40; i++) {
    const seg = Reglas.endlessSegmentAt(run, i);
    assert.ok(Reglas.ENDLESS_SEEDS[seg.tier].includes(seg.seed), 'run ' + run + ' segment ' + i);
  }
});
