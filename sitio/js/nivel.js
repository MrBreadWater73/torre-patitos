'use strict';

/* ============================================================
   Geometría del nivel
   ============================================================ */
const nRows = () => L.rows.length;
const maxCam = () => Math.max(0, (nRows() - 1) * RISE - 600);
const project = (x, row, lift = 0) => ({ x: W / 2 + (x - 2) * CELL, y: BASE - row * RISE + (x - 2) * 12 - lift + cam });
const topCenter = (x, row, lift = 0) => { const p = project(x, row, lift); return { x: p.x + 11, y: p.y - 10 }; };
const movingX = (row, t = clock) => { const m = L.rows[row].moving; return m.c + m.a * Math.sin(t * m.s + m.p); };
const droneX = (d, t = clock) => d.center + d.span * Math.sin(t * d.speed + d.phase);
const jumpLift = () => player.jump && !player.jump.flat ? Math.sin(Math.PI * clamp(player.jump.elapsed / player.jump.duration, 0, 1)) * 38 : 0;
function blinkState(row, b, t = clock) {
  const r = L.rows[row], ph = mod(t + b.o, r.period), on = ph < r.on;
  return { on, warn: on && r.on - ph < .55, appear: on ? clamp(ph / .18, 0, 1) : 0, charge: on ? 0 : (ph - r.on) / (r.period - r.on) };
}
const goneNow = (row, x) => Reglas.cellGone(L.down && L.down.gone, phase, row, x);
function kindAt(row, x) {
  if (row < 0 || row >= nRows()) return null;
  const r = L.rows[row], near = c => Math.abs(c - x) <= .501;
  if (r.moving) return 'moving';
  if ((r.cells || []).some(c => near(c) && !goneNow(row, c))) return 'fixed';
  if ((r.gate || []).some(q => near(q.x))) return 'gate';
  if ((r.ice || []).some(near)) return 'ice';
  if (r.belt && r.belt.cells.some(near)) return 'belt';
  if (plugs.has(row + ':' + Math.round(x))) return 'plug';
  if ((r.crumble || []).some(near)) return 'crumble';
  if ((r.blink || []).some(b => near(b.x))) return 'blink';
  return null;
}
function platformAt(row, x) {
  if (row < 0 || row >= nRows()) return null;
  const r = L.rows[row], near = c => Math.abs(c - x) <= .501;
  if (r.moving) { const mx = movingX(row); return Math.abs(x - mx) <= .52 ? { x: mx, kind: 'moving' } : null; }
  let c = (r.cells || []).find(c => near(c) && !goneNow(row, c)); if (c !== undefined) return { x: c, kind: 'fixed' };
  const q = (r.gate || []).find(q => near(q.x)); if (q) return Reglas.gateOn(levers, q.g) ? { x: q.x, kind: 'gate' } : null;
  c = (r.crumble || []).find(near);
  if (c !== undefined) { const s = crumbles.get(row + ':' + c); return s && s.state === 'broken' ? null : { x: c, kind: 'crumble' }; }
  const b = (r.blink || []).find(b => near(b.x)); if (b) return blinkState(row, b).on ? { x: b.x, kind: 'blink' } : null;
  c = (r.ice || []).find(near); if (c !== undefined) return { x: c, kind: 'ice' };
  if (r.belt) { c = r.belt.cells.find(near); if (c !== undefined) return { x: c, kind: 'belt' }; }
  if (plugs.has(row + ':' + Math.round(x))) return { x: Math.round(x), kind: 'plug' };
  const dr = drones.find(d => Reglas.droneHolds(d, row, x)); if (dr) return { x: dr.fx, kind: 'drone' };   // dron aturdido
  return null;
}
// La bandera se dibuja en la plataforma más cercana al centro del piso
const flagCol = row => { const r = L.rows[row], xs = [].concat(r.cells || [], (r.gate || []).map(q => q.x), r.ice || [], r.belt ? r.belt.cells : []); return xs.length ? xs.reduce((a, b) => Math.abs(b - 2) < Math.abs(a - 2) ? b : a) : 2; };
const windNow = r => Object.assign({}, r.wind, { dir: r.wind.dir * (phase === 'down' && L.down && L.down.windFlip ? -1 : 1) });
const beltNow = r => Reglas.beltDir(r.belt, phase, L.down && L.down.beltFlip);
// Para empujar macetas y resbalar: qué hay en la casilla de al lado
const lookAt = row => x => Reglas.potAt(pots, row, x) ? 'blocked' : kindAt(row, x) === null ? 'hole' : !platformAt(row, x) ? 'blocked' : kindAt(row, x) === 'ice' ? 'ice' : 'floor';
const causeFor = k => k === 'crumble' ? 'vidrio' : k === 'blink' ? 'apagon' : 'hueco';
function canReach(x, row) {
  if (!player || player.jump || player.fall || player.drop || x < -.1 || x > 4.1) return false;
  const dx = Math.abs(x - player.x), dr = Math.abs(row - player.row);
  return dr <= 1.01 && (dr > .1 ? dx <= .76 : dx > .08 && dx <= 1.18);
}
