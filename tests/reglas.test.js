'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Reglas = require('../sitio/js/reglas.js');

test('a gate cell is a platform only while its lever group is on', () => {
  const levers = new Map();
  assert.equal(Reglas.gateOn(levers, 'a'), false);
  levers.set('a', true);
  assert.equal(Reglas.gateOn(levers, 'a'), true);
  assert.equal(Reglas.gateOn(levers, 'b'), false);
});

test('the punch finds the nearest lever on the same floor within reach', () => {
  const list = [{ row: 1, x: 0.2, g: 'a' }, { row: 1, x: 3.8, g: 'b' }, { row: 4, x: 1, g: 'c' }];
  assert.equal(Reglas.leverInReach(list, 1, 1, 1.3).g, 'a');
  assert.equal(Reglas.leverInReach(list, 1, 3, 1.3).g, 'b');
  assert.equal(Reglas.leverInReach(list, 1, 2, 1.3), null);   // too far from both
  assert.equal(Reglas.leverInReach(list, 2, 1, 1.3), null);   // other floor
  assert.equal(Reglas.leverInReach(undefined, 1, 1, 1.3), null);
});

test('toggling a lever flips its group and reports the new state', () => {
  const levers = new Map();
  assert.equal(Reglas.toggleLever(levers, 'a'), true);
  assert.equal(levers.get('a'), true);
  assert.equal(Reglas.toggleLever(levers, 'a'), false);
  assert.equal(levers.get('a'), false);
});

test('going up the goal is the sibling at the top; going down it is the ground floor', () => {
  const top = 9;
  assert.equal(Reglas.goalAt('up', 9, 2, top), 'rescue');
  assert.equal(Reglas.goalAt('up', 9, 1, top), null);        // top floor but not next to the sibling
  assert.equal(Reglas.goalAt('up', 0, 2, top), null);
  assert.equal(Reglas.goalAt('down', 0, 4, top), 'exit');    // any cell of the ground floor
  assert.equal(Reglas.goalAt('down', 9, 2, top), null);      // being back at the top does nothing
});

test('flags save progress upward on the way up and downward on the way down', () => {
  assert.equal(Reglas.flagAdvances('up', 4, 2), true);
  assert.equal(Reglas.flagAdvances('up', 2, 4), false);
  assert.equal(Reglas.flagAdvances('down', 4, 7), true);
  assert.equal(Reglas.flagAdvances('down', 7, 4), false);
  assert.equal(Reglas.flagAdvances('down', 4, 4), false);
});

test('the sibling follows one landing behind Pipo', () => {
  const trail = Reglas.newTrail(9, 2);
  assert.deepEqual(Reglas.followerSpot(trail), { row: 9, x: 2 });
  Reglas.pushTrail(trail, 8, 3);
  assert.deepEqual(Reglas.followerSpot(trail), { row: 9, x: 2 });
  Reglas.pushTrail(trail, 7, 3);
  assert.deepEqual(Reglas.followerSpot(trail), { row: 8, x: 3 });
  Reglas.pushTrail(trail, 7, 3);                               // landing on the same spot does not move the sibling
  assert.deepEqual(Reglas.followerSpot(trail), { row: 8, x: 3 });
});

test('a platform removed for the way down only disappears in that phase', () => {
  const gone = [[8, 1], [5, 2]];
  assert.equal(Reglas.cellGone(gone, 'up', 8, 1), false);
  assert.equal(Reglas.cellGone(gone, 'down', 8, 1), true);
  assert.equal(Reglas.cellGone(gone, 'down', 8, 3), false);
  assert.equal(Reglas.cellGone(undefined, 'down', 8, 1), false);
});

test('the punch reaches a drone on the same floor up to 1.3 cells away', () => {
  assert.equal(Reglas.PUNCH_REACH, 1.3);
  assert.equal(Reglas.inPunchReach(2, 2, 3.3, 2), true);
  assert.equal(Reglas.inPunchReach(2, 2, 3.4, 2), false);
  assert.equal(Reglas.inPunchReach(2, 2, 2.5, 3), false);     // other floor
});

test('a saved run can be continued at the first chapter it has not finished', () => {
  assert.equal(Reglas.resumeAt({ run: { id: 'r1', v: 2, completed: 3, levels: [] } }, 7), 3);
  assert.equal(Reglas.resumeAt({ run: { id: 'r1', v: 2, completed: 0, levels: [] } }, 7), 0);
  assert.equal(Reglas.resumeAt({ run: { id: 'r1', v: 2, completed: 7, levels: [] } }, 7), null);   // already finished
  assert.equal(Reglas.resumeAt({ run: { id: 'r1', completed: 2, levels: [] } }, 7), null);         // a version 1 run
  assert.equal(Reglas.resumeAt(null, 7), null);
  assert.equal(Reglas.resumeAt({ run: { v: 2, completed: 2 } }, 7), null);                         // no id, cannot be saved again
});

test('assist mode slows drones and the final shutdown, and is suggested once after four deaths', () => {
  assert.equal(Reglas.assisted(1.2, false, 'drone'), 1.2);
  assert.equal(Reglas.assisted(1.2, true, 'drone'), 0.72);
  assert.equal(Reglas.assisted(0.42, true, 'chase'), 0.273);
  assert.equal(Reglas.suggestAssist(3, false, false), false);
  assert.equal(Reglas.suggestAssist(4, false, false), true);
  assert.equal(Reglas.suggestAssist(6, false, true), false);    // already suggested in this chapter
  assert.equal(Reglas.suggestAssist(9, true, false), false);    // already on
});
