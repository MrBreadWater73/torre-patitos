'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Metricas = require('../sitio/js/metricas.js');

const lvl = (n, o = {}) => Object.assign({ n, time: 30, falls: 0, kills: 0, deaths: [], feather: false, done: true, restarts: 0 }, o);
const run = (id, o = {}) => Object.assign({ id, levels: [], completed: 0, totalTime: 0, survey: null }, o);

test('a run without a version mark belongs to version 1', () => {
  assert.equal(Metricas.versionOf(run('a')), 1);
  assert.equal(Metricas.versionOf(run('b', { v: 2 })), 2);
  assert.equal(Metricas.versionOf(run('c', { v: '2' })), 2);
});

test('finishing means completing every chapter of that version', () => {
  const runs = [run('a', { completed: 3, totalTime: 90, levels: [lvl(1), lvl(2), lvl(3)] }), run('b', { completed: 1, totalTime: 30, levels: [lvl(1)] })];
  assert.equal(Metricas.compute(runs, 3).finished.length, 1);
  assert.equal(Metricas.compute(runs, 7).finished.length, 0);
  assert.equal(Metricas.compute(runs, 7).per.length, 7);
  assert.equal(Metricas.compute(runs, 3).medTotal, 90);
});

test('the share that moves on from chapter 1 counts who starts chapter 2', () => {
  const runs = [run('a', { levels: [lvl(1), lvl(2, { done: false })] }), run('b', { levels: [lvl(1)] }), run('c', { levels: [lvl(1, { done: false })] }), run('d', { levels: [lvl(1), lvl(2)] })];
  assert.equal(Metricas.compute(runs, 3).passCh1, 50);
});

test('deaths per minute, punched drones per run and the share of deaths by drone', () => {
  const runs = [
    run('a', { levels: [lvl(1, { time: 60, falls: 2, kills: 3, deaths: [[3, 1, 'dron'], [5, 2, 'hueco']] }), lvl(2, { time: 60, falls: 1, kills: 1, deaths: [[4, 1, 'dron']] })] }),
    run('b', { levels: [lvl(1, { time: 120, falls: 1, kills: 0, deaths: [[3, 1, 'viento', 'd']] })] })
  ];
  const s = Metricas.compute(runs, 3);
  assert.equal(s.deathsPerMin, 1);            // 4 deaths in 4 minutes
  assert.equal(s.punchPerRun, 2);             // (4 + 0) / 2
  assert.equal(s.droneShare, 50);             // 2 of 4 recorded deaths
  assert.equal(s.causes.viento, 1);
  assert.equal(s.downDeaths, 1);              // deaths marked 'd' happened on the way down
});

test('way up and way down are timed apart when the level recorded the rescue', () => {
  const runs = [run('a', { levels: [lvl(1, { time: 100, upTime: 70 })] }), run('b', { levels: [lvl(1, { time: 80, upTime: 50 })] })];
  const p = Metricas.compute(runs, 7).per[0];
  assert.equal(p.up, 60);
  assert.equal(p.down, 30);
});

test('the before/after table pairs each metric of both versions and names the observation it answers', () => {
  const v1 = Metricas.compute([run('a', { completed: 3, totalTime: 87, levels: [lvl(1, { kills: 1 })], survey: { fun: 4, clarity: 5, difficulty: 2, favorite: 0, emotion: 1 } })], 3);
  const v2 = Metricas.compute([run('b', { v: 2, completed: 7, totalTime: 1800, levels: [lvl(1, { kills: 4 })], survey: { fun: 5, clarity: 4, difficulty: 3, favorite: 6, emotion: 2 } })], 7);
  const rows = Metricas.compare(v1, v2);
  const total = rows.find(r => r.key === 'medTotal');
  assert.deepEqual([total.v1, total.v2], [87, 1800]);
  assert.match(total.why, /corta|dura/i);
  assert.ok(rows.find(r => r.key === 'punchPerRun').v2 > rows.find(r => r.key === 'punchPerRun').v1);
  assert.ok(rows.every(r => r.label && 'v1' in r && 'v2' in r));
});

test('with no surveys or no runs the survey rows are empty instead of zero', () => {
  const v1 = Metricas.compute([run('a', { levels: [lvl(1)], survey: { fun: 4, clarity: 5, difficulty: 2, favorite: 0, emotion: 1 } })], 3);
  const v2 = Metricas.compute([run('b', { v: 2, levels: [lvl(1)] })], 7);
  const rows = Metricas.compare(v1, v2), fair = rows.find(r => r.key === 'fair');
  assert.equal(fair.v1, 100);
  assert.equal(fair.v2, null);
  assert.equal(rows.find(r => r.key === 'fun').v2, null);
  assert.equal(rows.find(r => r.key === 'passCh1').v2, 0);
});

const climb = (id, floors, o = {}) => Object.assign({ id, mode: 'endless', levels: [], completed: 0, totalTime: 60, floors }, o);

test('the endless board ignores story runs and counts only the climbs', () => {
  const e = Metricas.endless([run('a', { completed: 7, totalTime: 900 }), climb('b', 30), climb('c', 12)]);
  assert.equal(e.runs, 2);
  assert.equal(e.best, 30);
  assert.equal(e.medFloors, 21);
});

test('the board keeps the best climb of each name, ordered by floors and then by time', () => {
  const e = Metricas.endless([
    climb('a', 40, { nick: 'Pipo', totalTime: 200 }), climb('b', 55, { nick: 'pipo', totalTime: 300 }),
    climb('c', 55, { nick: 'Tina', totalTime: 250 }), climb('d', 70), climb('e', 12, { nick: 'Lalo', totalTime: 50 })
  ]);
  assert.deepEqual(e.board.map(r => [r.nick, r.floors]), [['Tina', 55], ['pipo', 55], ['Lalo', 12]]);   // anonymous climbs do not sign; the tie is broken by time
  assert.equal(e.players, 3);
});

test('floors reached are grouped in bins of twelve with an open last bin', () => {
  const e = Metricas.endless([climb('a', 0), climb('b', 11), climb('c', 12), climb('d', 59), climb('e', 60), climb('f', 400)]);
  assert.deepEqual(e.bins, [2, 1, 0, 0, 1, 2]);
});

test('an empty endless board has no best, no median and no bins filled', () => {
  const e = Metricas.endless([run('a')]);
  assert.equal(e.runs, 0);
  assert.equal(e.best, 0);
  assert.equal(e.medFloors, null);
  assert.deepEqual(e.bins, [0, 0, 0, 0, 0, 0]);
});

test('story views leave endless climbs out', () => {
  assert.equal(Metricas.isEndless(climb('a', 5)), true);
  assert.equal(Metricas.isEndless(run('b')), false);
  assert.equal(Metricas.compute([run('a', { levels: [lvl(1)] })].filter(r => !Metricas.isEndless(r)), 3).runs, 1);
});
