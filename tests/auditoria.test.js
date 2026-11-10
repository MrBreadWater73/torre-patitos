'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Reglas = require('../sitio/js/reglas.js');
const LEVELS = require('../sitio/js/niveles.js');

const full = { cells: [0, 1, 2, 3, 4] };
const base = extra => Object.assign({ name: 'prueba', rows: [full, full, full], drones: [] }, extra);

test('a level that can be climbed and has no way down defined audits clean', () => {
  assert.deepEqual(Reglas.audit(base()), []);
});

test('an unreachable top floor is reported', () => {
  const lvl = base({ rows: [full, { cells: [0] }, {}, { cells: [1, 2, 3] }] });
  assert.match(Reglas.audit(lvl).join('\n'), /no se puede llegar arriba/);
});

test('a bridge needs its lever within reach of the punch', () => {
  const gate = { gate: [{ x: 1, g: 'a' }, { x: 2, g: 'a' }, { x: 3, g: 'a' }] };
  const ok = base({ rows: [full, gate, full], levers: [{ row: 0, x: -0.2, g: 'a' }] });
  assert.deepEqual(Reglas.audit(ok), []);
  const far = base({ rows: [full, gate, full], levers: [{ row: 0, x: -2, g: 'a' }] });
  assert.match(Reglas.audit(far).join('\n'), /no se puede llegar arriba/);
});

test('the door opens only with every package, so an unreachable package is reported', () => {
  const door = { gate: [{ x: 2, g: 'pk' }] };
  const ok = base({ rows: [full, full, door, full], packages: [{ row: 1, x: 0 }, { row: 1, x: 4 }] });
  assert.deepEqual(Reglas.audit(ok), []);
  const bad = base({ rows: [{ cells: [1, 2, 3] }, { cells: [1, 2, 3] }, door, full], packages: [{ row: 1, x: 0 }] });
  const out = Reglas.audit(bad).join('\n');
  assert.match(out, /paquete 1/);
  assert.match(out, /no se puede llegar arriba/);
});

test('an unreachable feather is reported', () => {
  const lvl = base({ rows: [{ cells: [1, 2, 3] }, { cells: [1, 2, 3] }, { cells: [1, 2, 3] }], feather: { row: 1, x: 0 } });
  assert.match(Reglas.audit(lvl).join('\n'), /pluma/);
});

test('the way down counts drops of up to 3 floors and removed platforms', () => {
  const c0 = { cells: [0] };
  const rows = [full, c0, c0, c0, c0, full, full];
  assert.deepEqual(Reglas.audit(base({ rows, down: {} })), []);
  // Hopping down from floor 5 into the hole at floor 4 can land at most on floor 1.
  const short = base({ rows, down: { gone: [[2, 0], [3, 0], [4, 0]] } });
  assert.deepEqual(Reglas.audit(short), []);
  const stuck = base({ rows, down: { gone: [[1, 0], [2, 0], [3, 0], [4, 0]] } });
  assert.match(Reglas.audit(stuck).join('\n'), /no se puede bajar/);
});

test('a moving platform connects the floors under its whole travel', () => {
  const lvl = base({ rows: [full, { moving: { c: 2, a: 1, s: 1, p: 0 } }, { cells: [3] }] , drones: [] });
  lvl.rows.push({ cells: [2, 3] });                                // top: sibling at column 2
  assert.deepEqual(Reglas.audit(lvl), []);
});

test('drones never patrol a flag floor, going up or down', () => {
  const rows = [full, Object.assign({ checkpoint: true }, full), full];
  assert.match(Reglas.audit(base({ rows, drones: [{ row: 1 }] })).join('\n'), /dron en el piso 1/);
  assert.match(Reglas.audit(base({ rows, down: { drones: [{ row: 1 }] } })).join('\n'), /dron en el piso 1/);
});

test('a place the player can get stuck in without dying is reported', () => {
  // Floor 1 column 0 is a pit: stepping off floor 2 drops you into it and the only way out is to die.
  const lvl = base({ rows: [{ cells: [2, 3, 4] }, { cells: [0, 2] }, { cells: [1, 2] }, { cells: [2] }] });
  assert.match(Reglas.audit(lvl).join('\n'), /sin salida/);
});

for (const lvl of LEVELS) {
  test('level "' + lvl.name + '" can be completed', () => {
    assert.deepEqual(Reglas.audit(lvl), []);
  });
}
