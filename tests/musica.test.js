'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Musica = require('../sitio/js/musica.js');

const THEMES = ['morning', 'greenhouse', 'storm', 'warehouse', 'cold', 'server'];
const play = o => Musica.scene(Object.assign({ mode: 'playing', theme: 'morning', level: 1, phase: 'up', chase: false, endless: false, tier: 0 }, o));
const scenes = () => {
  const out = [Musica.scene({ mode: 'menu' })];
  THEMES.forEach((theme, i) => ['up', 'down'].forEach(phase => out.push(play({ theme, level: i + 1, phase }))));
  out.push(play({ theme: 'storm', level: 7, phase: 'up' }), play({ theme: 'storm', level: 7, phase: 'down', chase: true }));
  for (let tier = 0; tier <= 5; tier++) out.push(play({ endless: true, theme: 'endless', level: 8, tier }));
  return out;
};

test('menus and every chapter get their own music, and the way down sounds different', () => {
  const keys = new Set(scenes().map(s => s.key));
  assert.equal(keys.size, scenes().length);
  assert.equal(Musica.scene({ mode: 'menu' }).key, 'menu');
  for (let i = 0; i < THEMES.length; i++) assert.notEqual(play({ theme: THEMES[i], level: i + 1 }).key, play({ theme: THEMES[i], level: i + 1, phase: 'down' }).key);
  assert.notEqual(play({ theme: 'storm', level: 3 }).key, play({ theme: 'storm', level: 7 }).key);   // chapters 3 and 7 share a theme
});

test('the game is silent on defeat and on victory, and the music waits while paused', () => {
  assert.equal(play({ mode: 'over' }).silent, true);
  assert.equal(play({ mode: 'celebrate' }).silent, true);
  assert.equal(play({ mode: 'playing' }).silent, false);
  const paused = play({ mode: 'paused', theme: 'cold', level: 5 });
  assert.equal(paused.paused, true);
  assert.equal(paused.key, play({ theme: 'cold', level: 5 }).key);       // resuming keeps the same piece
});

test('every note belongs to the key of its scene and sits in a pleasant register', () => {
  for (const sc of scenes()) for (let step = 0; step < 64 * 2; step++) for (const ev of Musica.events(sc, step)) {
    const rel = ((ev.midi - sc.root) % 12 + 12) % 12;
    assert.ok(Musica.SCALES[sc.scale].includes(rel), sc.key + ' step ' + step + ' note ' + ev.midi);
    assert.ok(ev.midi >= 28 && ev.midi <= 96, sc.key + ' register ' + ev.midi);
    assert.ok(ev.vel > 0 && ev.vel <= 1 && ev.steps >= 1, sc.key);
  }
});

test('a piece is four bars long, repeats exactly and never changes between runs', () => {
  for (const sc of scenes()) for (let step = 0; step < 64; step++) {
    assert.deepEqual(Musica.events(sc, step), Musica.events(sc, step + 64), sc.key);
    assert.deepEqual(Musica.events(sc, step), Musica.events(Object.assign({}, sc), step), sc.key);
  }
});

test('the tempo stays inside a danceable range and the final shutdown is the fastest chapter piece', () => {
  for (const sc of scenes()) assert.ok(sc.bpm >= 60 && sc.bpm <= 160, sc.key + ' ' + sc.bpm);
  const chase = play({ theme: 'storm', level: 7, phase: 'down', chase: true });
  for (const sc of scenes()) if (!sc.key.startsWith('endless')) assert.ok(chase.bpm >= sc.bpm, sc.key);
  assert.ok(Math.abs(Musica.stepSeconds(120) - 0.125) < 1e-12);
  assert.equal(Musica.hz(69), 440);
  assert.ok(Math.abs(Musica.hz(81) - 880) < 1e-9);
});

test('the endless climb speeds up and thickens with each difficulty tier until it stops at tier 5', () => {
  const at = tier => play({ endless: true, theme: 'endless', level: 8, tier });
  for (let tier = 1; tier <= 5; tier++) assert.ok(at(tier).bpm > at(tier - 1).bpm, 'tier ' + tier);
  assert.equal(at(9).key, at(5).key);
  assert.equal(at(9).bpm, at(5).bpm);
  assert.ok(at(5).intensity > at(0).intensity);
});

test('higher intensity adds layers instead of replacing them', () => {
  const count = intensity => { let n = 0; for (let step = 0; step < 64; step++) n += Musica.events(Object.assign({}, play({ theme: 'server', level: 6 }), { intensity }), step).length; return n; };
  assert.ok(count(1) > count(0) && count(2) > count(1) && count(3) > count(2));
  const voices = intensity => new Set([...Array(64).keys()].flatMap(step => Musica.events(Object.assign({}, play({ theme: 'server', level: 6 }), { intensity }), step).map(e => e.voice)));
  assert.deepEqual([...voices(0)].sort(), ['bass', 'pad']);
  assert.ok(voices(3).has('lead') && voices(3).has('tick'));
});

test('a silent or unknown scene produces no notes', () => {
  assert.deepEqual(Musica.events(play({ mode: 'over' }), 0), []);
  assert.deepEqual(Musica.events(null, 0), []);
});
