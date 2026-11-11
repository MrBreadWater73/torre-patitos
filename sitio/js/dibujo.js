'use strict';

/* ============================================================
   Partículas
   ============================================================ */
function spawn(q) { if (particles.length < 420) particles.push(Object.assign({ age: 0, life: .8, grav: 110, rot: 0, vr: 0, shape: 'sq', size: 3 }, q)); }
function burst(x, row, color, count = 12, opts = {}) {
  if (reduced) return;
  const p = topCenter(x, row, opts.lift ?? 20);
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2 + Math.random() * .3, sp = (opts.speed || 1) * (25 + Math.random() * 50);
    spawn({ x: p.x, y: p.y - cam, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .8 - 45, life: .6 + Math.random() * .45, color, size: 2 + Math.random() * 3, shape: opts.shape || 'sq', vr: (Math.random() - .5) * 10 });
  }
}
function dust(x, row) {
  if (reduced) return;
  const p = topCenter(x, row, 0);
  for (let i = 0; i < 7; i++) { const dir = i % 2 ? 1 : -1; spawn({ x: p.x + dir * 6, y: p.y - 2 - cam, vx: dir * (20 + Math.random() * 30), vy: -10 - Math.random() * 15, grav: 20, life: .45, color: 'rgba(255,255,255,.75)', size: 2.5 + Math.random() * 2.5, shape: 'circle' }); }
}
function confetti() {
  if (reduced) return;
  const cols = ['#d9b23a', '#c8621f', '#2f6b57', '#3f8c93', '#e7e4dc', '#8a8378'];
  for (let i = 0; i < 110; i++) spawn({ x: Math.random() * W, y: -20 - Math.random() * 200 - cam, vx: (Math.random() - .5) * 60, vy: 40 + Math.random() * 90, grav: 40, life: 2.6 + Math.random() * 1.2, color: cols[i % cols.length], size: 4 + Math.random() * 4, shape: 'conf', vr: (Math.random() - .5) * 8 });
}
function hearts(x, y) {
  if (reduced) return;
  for (let i = 0; i < 6; i++) spawn({ x: x + (Math.random() - .5) * 40, y: y - cam, vx: (Math.random() - .5) * 30, vy: -50 - Math.random() * 40, grav: -10, life: 1.2 + Math.random() * .6, color: '#f06f8f', size: 7 + Math.random() * 4, shape: 'heart' });
}
function updateParticles(dt) {
  for (const q of particles) { q.age += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.grav * dt; q.rot += q.vr * dt; }
  particles = particles.filter(q => q.age < q.life && q.y + cam < H + 60);
}
function drawParticles() {
  for (const q of particles) {
    g.globalAlpha = Math.max(0, 1 - q.age / q.life);
    const y = q.y + cam;
    if (q.shape === 'circle') ell(q.x, y, q.size, q.size, q.color);
    else if (q.shape === 'heart') drawHeart(q.x, y, q.size, q.color);
    else if (q.shape === 'conf' || q.shape === 'shard') { g.save(); g.translate(q.x, y); g.rotate(q.rot); g.fillStyle = q.color; if (q.shape === 'shard') { g.beginPath(); g.moveTo(-q.size, 0); g.lineTo(q.size, -q.size * .6); g.lineTo(q.size * .3, q.size); g.closePath(); g.fill(); } else g.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2); g.restore(); }
    else { g.fillStyle = q.color; g.fillRect(q.x, y, q.size, q.size); }
  }
  g.globalAlpha = 1;
}

/* ============================================================
   Dibujo base
   ============================================================ */
function poly(pts, fill, stroke, width = 1) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); } }
function line(pts, color, width = 1, dash) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.strokeStyle = color; g.lineWidth = width; if (dash) g.setLineDash(dash); g.stroke(); if (dash) g.setLineDash([]); }
function ell(x, y, rx, ry, fill, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } }
function rrect(x, y, w, h, r, fill, stroke, lw = 1) { g.beginPath(); g.roundRect(x, y, w, h, r); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
function drawHeart(x, y, s, color) { g.save(); g.translate(x, y); g.scale(s / 10, s / 10); g.beginPath(); g.moveTo(0, 4); g.bezierCurveTo(-10, -3, -5, -11, 0, -5); g.bezierCurveTo(5, -11, 10, -3, 0, 4); g.fillStyle = color; g.fill(); g.restore(); }
function drawArrow(x, y, dir, color, size = 6) { g.save(); g.translate(x, y); g.rotate(dir); poly([P(-size, -size * .65), P(size, 0), P(-size, size * .65)], color); g.restore(); }
function drawCloud(x, y, s, alpha, color = '#fffef6') { g.save(); g.globalAlpha = alpha; ell(x, y, 39 * s, 12 * s, color); ell(x - 19 * s, y - 7 * s, 20 * s, 15 * s, color); ell(x + 10 * s, y - 12 * s, 24 * s, 18 * s, color); g.restore(); }

/* Personajes originales: Pipo (bufanda), Tina (celular), Lalo (lentes oscuros), Mimi (gorro de aluminio) y Mamá Pata (lentes de lectura). */
function drawDuck(x, y, s = 1, face = 1, o = {}) {
  const ink = '#1f211d', body = o.body || '#e6c64e', shade = o.shade || '#c9a73c', belly = o.belly || '#f1dc84';
  g.save(); g.translate(x, y);
  if (!o.noShadow) ell(0, 2, 15 * s, 4.2 * s, 'rgba(10,10,10,.25)');
  g.scale(s * face, s); if (o.rot) g.rotate(o.rot);
  const sq = o.sq || 0; g.scale(1 + sq * .55, 1 - sq);
  g.lineWidth = 1.3; g.strokeStyle = ink;
  ell(-6, 0, 5, 2.4, '#c8621f'); g.stroke(); ell(6, 1, 5, 2.4, '#c8621f'); g.stroke();
  poly([P(-15, -14), P(-24, -21), P(-19, -8)], shade, ink, 1.4);
  ell(0, -12, 17, 13.5, body); g.lineWidth = 1.7; g.strokeStyle = ink; g.stroke();
  ell(3, -9, 9, 6.5, belly);
  if (o.acc === 'scarf') {
    const w = Math.sin(amb * 9) * (o.wind || 1) * 2.6;
    g.beginPath(); g.moveTo(-3, -23); g.quadraticCurveTo(-13, -22 + w, -23, -17 + w * 1.4); g.lineTo(-21, -12 + w); g.quadraticCurveTo(-12, -16 + w * .6, -2, -18); g.closePath();
    g.fillStyle = '#356f75'; g.fill(); g.strokeStyle = ink; g.lineWidth = 1.2; g.stroke();
    rrect(-6, -25, 23, 7, 2, '#3f8c93', ink, 1.2); line([P(1, -25), P(1, -18)], '#2a5e63', 1.5); line([P(8, -25), P(8, -18)], '#2a5e63', 1.5);
  }
  for (const [a, l] of [[-.6, 6], [-.15, 8], [.3, 6]]) { g.save(); g.translate(5, -43); g.rotate(a); ell(0, -l / 2, 2, l / 2, body); g.strokeStyle = ink; g.lineWidth = 1.1; g.stroke(); g.restore(); }
  g.beginPath(); g.arc(7, -32, 13, 0, Math.PI * 2); g.fillStyle = body; g.fill(); g.strokeStyle = ink; g.lineWidth = 1.7; g.stroke();
  // ojo: párpado a media asta (cara de "no otra vez"); bien abierto cuando cae
  if (o.blink) line([P(9, -34), P(14.5, -34)], ink, 1.8);
  else if (o.alarm) { ell(11.6, -35, 3.4, 4, '#fbf8ee'); g.strokeStyle = ink; g.lineWidth = 1.1; g.stroke(); ell(12.2, -34.6, 1.5, 1.7, '#141512'); }
  else { ell(11.6, -34.4, 2.7, 3.1, '#141512'); g.beginPath(); g.ellipse(11.6, -34.4, 3.6, 3.8, 0, Math.PI, Math.PI * 2); g.fillStyle = body; g.fill(); line([P(7.8, -34.6), P(15.3, -34.6)], ink, 1.5); ell(12.6, -33.4, .8, .8, '#fff'); }
  g.beginPath(); g.moveTo(16, -31); g.quadraticCurveTo(28, -32, 27, -28); g.quadraticCurveTo(22, -24, 15, -27); g.closePath();
  g.fillStyle = '#c8621f'; g.fill(); g.strokeStyle = ink; g.lineWidth = 1.3; g.stroke();
  if (o.acc === 'phone') { rrect(14, -21, 7, 12, 1.5, '#1c1d1f'); g.fillStyle = 'rgba(150,210,255,' + (.6 + .3 * Math.sin(amb * 5)) + ')'; g.fillRect(15.2, -19.8, 4.6, 8); g.save(); g.translate(-1, -42); g.rotate(-.3); poly([P(0, 0), P(-8, -5), P(-8, 5)], '#b9667e', ink, 1); poly([P(0, 0), P(8, -5), P(8, 5)], '#b9667e', ink, 1); g.restore(); }
  if (o.acc === 'shades') { rrect(4, -38.5, 15, 6, 2, '#141512'); line([P(-4, -36), P(4, -36)], '#141512', 1.6); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(7, -37.5, 4, 1.4); }
  if (o.acc === 'foil') { poly([P(-5, -41), P(19, -41), P(8, -66)], '#c3c8cf', '#5f656e', 1.2); line([P(1, -45), P(9, -52)], 'rgba(255,255,255,.7)', 1.2); line([P(6, -42), P(11, -58)], 'rgba(95,101,110,.6)', 1); line([P(14, -44), P(10, -50)], 'rgba(255,255,255,.6)', 1); }
  if (o.acc === 'mom') { g.lineWidth = 1.3; g.strokeStyle = '#3a2f26'; g.beginPath(); g.arc(11.6, -34.4, 4.6, 0, Math.PI * 2); g.stroke(); line([P(7, -34.6), P(-1, -35.5)], '#3a2f26', 1.2); line([P(-1, -35.5), P(-4, -26)], 'rgba(58,47,38,.6)', 1); }
  if (o.shield) { g.beginPath(); g.ellipse(0, -21, 28, 32, 0, 0, Math.PI * 2); g.strokeStyle = 'rgba(240,236,224,.7)'; g.lineWidth = 2; g.setLineDash([4, 5]); g.stroke(); g.setLineDash([]); }
  g.restore();
}
const MOM = { acc: 'mom', body: '#e9e2d0', shade: '#cfc6b0', belly: '#f4efe2' };
/* Quien espera arriba y luego sigue a Pipo: un hermano, Mamá Pata o Huevo */
function drawSibling(kind, x, y, s, face, o = {}) {
  if (kind === 'egg') return drawEgg(x, y, s, o);
  if (kind === 'mom') return drawDuck(x, y, s * 1.12, face, Object.assign({}, MOM, o));
  drawDuck(x, y, s, face, Object.assign({ acc: kind }, o));
}
function drawEgg(x, y, s = 1, o = {}) {
  const ink = '#1f211d', wob = reduced ? 0 : (o.flap || 0) * .35 + Math.sin(amb * 2.1) * .04;
  g.save(); g.translate(x, y); ell(0, 2, 13 * s, 4 * s, 'rgba(10,10,10,.25)'); g.scale(s, s); g.rotate(wob);
  g.beginPath(); g.ellipse(0, -17, 13, 17, 0, 0, Math.PI * 2); g.fillStyle = '#efe6d0'; g.fill(); g.strokeStyle = ink; g.lineWidth = 1.7; g.stroke();
  ell(-4, -23, 4, 6, 'rgba(255,255,255,.55)', -.4);
  for (const [a, b] of [[5, -12], [-6, -9], [2, -26], [7, -21]]) ell(a, b, 1.6, 1.3, '#c9b48a');
  line([P(-3, -31), P(0, -27), P(-2, -24), P(2, -21)], ink, 1.1);
  rrect(-13, -9, 26, 6, 2, '#3f8c93', ink, 1.1);     // la bufanda que le puso Mamá Pata
  g.restore();
}

/* ============================================================
   Escenario
   ============================================================ */
const R = rng(7), MOTES = Array.from({ length: 34 }, () => ({ x: R() * W, y: R() * H, s: 1 + R() * 2.2, v: 6 + R() * 12, ph: R() * 6 }));
const RAIN = Array.from({ length: 90 }, () => ({ x: R() * (W + 200), y: R() * H, l: 10 + R() * 14, v: 520 + R() * 260 }));
const CITY = Array.from({ length: 18 }, (_, i) => ({ x: i * 46 - 10, w: 30 + R() * 30, h: 50 + R() * 120, win: Math.floor(R() * 5) }));

function drawBackground() {
  const T = THEMES[L.theme], n = nRows();
  const sky = g.createLinearGradient(0, 0, 0, H); T.sky.forEach((c, i) => sky.addColorStop(i / (T.sky.length - 1), c));
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  if (L.theme === 'morning') {
    ell(600, 170 + cam * .12, 80, 80, 'rgba(255,190,130,.22)'); ell(600, 170 + cam * .12, 36, 36, 'rgba(255,205,160,.7)');
    const d = reduced ? 0 : Math.sin(amb * .05) * 14;
    drawCloud(110 + d, 120 + cam * .3, 1.6, .35, '#d8c2ab'); drawCloud(660 - d, 300 + cam * .3, 1.3, .3, '#d8c2ab'); drawCloud(140 - d, 500 + cam * .3, 1, .28, '#cdb7a0');
    const by = 690 + cam * .4;
    if (by < H + 260) for (const b of CITY) rrect(b.x, by - b.h * .9, b.w, b.h * .9 + 300, 0, 'rgba(58,54,58,.32)');
    for (const [x, y] of [[84, 590], [696, 620]]) {
      const yy = y + cam; if (yy - 120 > H) continue;
      if (!reduced) { g.save(); g.globalAlpha = .2 + .04 * Math.sin(amb * 9 + x); ell(x + 26, yy - 30, 70, 110, '#ffb066'); g.restore(); }
      line([P(x, yy + 140), P(x, yy - 92)], '#2f2c28', 5); line([P(x, yy - 92), P(x + 26, yy - 98)], '#2f2c28', 4); ell(x + 28, yy - 94, 10, 5, '#ffd29a');
    }
  } else if (L.theme === 'greenhouse') {
    g.save(); g.globalAlpha = .45;
    for (let i = -1; i < 6; i++) { const x = i * 150 + 40, y = 120 + cam * .35; g.beginPath(); g.moveTo(x, H + 40); g.lineTo(x, y + 60); g.quadraticCurveTo(x + 75, y - 20, x + 150, y + 60); g.lineTo(x + 150, H + 40); g.strokeStyle = 'rgba(40,46,34,.7)'; g.lineWidth = 3; g.stroke(); if (i % 2) poly([P(x + 30, y + 90), P(x + 70, y + 40), P(x + 52, y + 120)], 'rgba(30,34,24,.25)'); }
    g.restore();
    for (const [x, len] of [[60, 150], [210, 90], [560, 120], [700, 170]]) { const y0 = -20 + cam * .55; line([P(x, y0), P(x, y0 + len)], '#3b4428', 2); for (let k = 12; k < len; k += 16) ell(x + (Math.floor(k / 16) % 2 ? 6 : -6), y0 + k, 7, 4, '#55613a', Math.floor(k / 16) % 2 ? .5 : -.5); }
    for (const m of MOTES.slice(0, 16)) { const x = m.x + Math.sin(amb * 9 + m.ph) * 16, y = m.y * .8 + Math.cos(amb * 7 + m.ph) * 10 + cam * .2; ell(x, y, 1.6, 1.6, 'rgba(25,25,20,.75)'); }
    for (const [x, y, s] of [[66, 690, 1], [702, 700, .85]]) { const yy = y + cam; if (yy > H + 140) continue; rrect(x - 26 * s, yy, 52 * s, 44 * s, 4, '#7c5641'); line([P(x - 20 * s, yy + 12), P(x + 10 * s, yy + 30)], '#4f3626', 1.5); for (let k = -2; k <= 2; k++) ell(x + k * 9 * s, yy - 18 * s, 6 * s, 24 * s, k % 2 ? '#6b6a3c' : '#7d7a46', k * .35); }
  } else {
    for (const [x, y, s] of [[120, 90, 1.8], [420, 60, 2.2], [690, 140, 1.6], [260, 230, 1.3]]) drawCloud(x + (reduced ? 0 : Math.sin(amb * .05 + x) * 18), y + cam * .25, s, .55, '#3a4258');
    const by = 760 + cam * .5;
    if (by < H + 200) for (const b of CITY) { rrect(b.x, by - b.h, b.w, b.h + 200, 0, '#1a1f30'); for (let k = 0; k < b.win; k++) { g.fillStyle = (k + b.x) % 3 ? 'rgba(255,180,90,.5)' : 'rgba(255,180,90,.18)'; g.fillRect(b.x + 6 + (k % 2) * 12, by - b.h + 10 + Math.floor(k / 2) * 18, 6, 8); } }
  }
  const a = project(-1.25, -.3), b = project(5.15, -.3), dv = P(42, 30);
  if (a.y < H + 60) { poly([a, b, P(b.x + dv.x, b.y + dv.y), P(a.x + dv.x, a.y + dv.y)], T.ground); poly([P(a.x + dv.x, a.y + dv.y), P(b.x + dv.x, b.y + dv.y), P(b.x + dv.x, b.y + dv.y + 16), P(a.x + dv.x, a.y + dv.y + 16)], T.groundSide); }
  drawStructure(T, n);
}
function drawStructure(T, n) {
  const top = n - .25, bot = -.45, L0 = -.62, R0 = 4.72;
  poly([project(L0, bot), project(L0, top), project(R0, top), project(R0, bot)], T.wall);
  poly([project(L0 + .1, bot), project(L0 + .1, top - .1), project(R0 - .1, top - .1), project(R0 - .1, bot)], T.wall2);
  for (let r = bot + .45; r < top; r += .5) line([project(L0 + .1, r), project(R0 - .1, r)], T.plank, 1);
  if (T.mullions) for (const x of [.4, 1.4, 2.4, 3.4]) line([project(x, bot), project(x, top - .1)], T.plank, 2);
  if (T.lattice) for (let r = 0; r < n - 1; r++) { line([project(L0 + .1, r - .35), project(R0 - .1, r + .65)], T.plank, 2); line([project(L0 + .1, r + .65), project(R0 - .1, r - .35)], T.plank, 2); }
  if (T.graffiti) for (const gf of GRAF) { if (gf.row > n - 1) continue; const o = project(gf.x, gf.row + .45); g.beginPath(); gf.pts.forEach((q, i) => i ? g.quadraticCurveTo(o.x + q[0] - 6, o.y + q[1] - 8, o.x + q[0], o.y + q[1]) : g.moveTo(o.x + q[0], o.y + q[1])); g.strokeStyle = gf.c; g.lineWidth = 4; g.lineCap = 'round'; g.stroke(); g.lineCap = 'butt'; }
  L.rows.forEach((r, i) => { if (r.checkpoint) line([project(L0, i - .36), project(R0, i - .36)], T.guide, 1, [3, 5]); });
  for (const x of [L0, R0]) { const b = project(x, bot - .15), t = project(x, top + .12); poly([P(b.x - 9, b.y), P(t.x - 9, t.y), P(t.x + 9, t.y), P(b.x + 9, b.y)], T.post); poly([P(t.x + 9, t.y), P(t.x + 20, t.y - 9), P(b.x + 20, b.y - 9), P(b.x + 9, b.y)], T.postSide); }
  const cl = project(L0, top + .12), cr = project(R0, top + .12), apex = project(2.05, top + 1.25);
  if (apex.y > -200) {
    if (L.theme === 'morning') {
      poly([P(cl.x - 18, cl.y + 4), P(apex.x, apex.y), P(cr.x + 26, cr.y - 2)], '#6e4a3d', '#4d3329', 2);
      const t1 = project(L0, n - 1.55), t2 = project(R0, n - 1.05);
      g.save(); g.beginPath(); g.moveTo(t1.x, t1.y); g.lineTo(t2.x, t2.y); g.lineTo(t2.x, t2.y + 12); g.lineTo(t1.x, t1.y + 12); g.closePath(); g.clip();
      g.fillStyle = '#e2bd48'; g.fillRect(0, 0, W, H); g.fillStyle = '#1c1d1f'; for (let x = t1.x - 40; x < t2.x + 40; x += 22) { g.beginPath(); g.moveTo(x, t1.y - 80); g.lineTo(x + 10, t1.y - 80); g.lineTo(x + 70, t2.y + 80); g.lineTo(x + 60, t2.y + 80); g.closePath(); g.fill(); }
      g.restore();
      const sx = cl.x + 6, sy = cl.y + 34; line([P(sx + 20, sy - 30), P(sx + 20, sy)], '#2f2c28', 1.5); line([P(sx + 110, sy - 22), P(sx + 110, sy)], '#2f2c28', 1.5);
      g.save(); g.translate(sx, sy); g.rotate(.05); rrect(0, 0, 130, 26, 3, '#e9e4d8', '#4d3329', 1.5);
      g.font = '600 13px "IBM Plex Mono", ui-monospace, monospace'; g.fillStyle = '#b4362b'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CLAUSURADO', 65, 13.5); g.restore();
    }
    if (L.theme === 'greenhouse') { g.beginPath(); g.moveTo(cl.x, cl.y); g.quadraticCurveTo(apex.x, apex.y - 70, cr.x + 12, cr.y); g.strokeStyle = '#353c32'; g.lineWidth = 3; g.stroke(); for (let i = 1; i < 5; i++) { const u = i / 5; line([P(lerp(cl.x, cr.x + 12, u), lerp(cl.y, cr.y, u)), P(apex.x, apex.y - 34)], 'rgba(53,60,50,.7)', 1.5); if (i % 2) poly([P(lerp(cl.x, cr.x + 12, u), lerp(cl.y, cr.y, u)), P(lerp(cl.x, cr.x + 12, u + .2), lerp(cl.y, cr.y, u + .2)), P(apex.x, apex.y - 34)], 'rgba(170,190,160,.3)'); } }
    if (L.theme === 'storm') {
      const bx = apex.x, by = apex.y - 10; line([P(bx, cl.y + 10), P(bx, by - 120)], '#6b7488', 5); line([P(bx - 40, by - 20), P(bx + 40, by - 20)], '#6b7488', 3); line([P(bx - 26, by - 70), P(bx + 26, by - 70)], '#6b7488', 3);
      const on = reduced || Math.sin(amb * 3) > 0; ell(bx, by - 124, on ? 9 : 6, on ? 9 : 6, on ? '#ff5a4e' : '#7a3530'); if (on) ell(bx, by - 124, 20, 20, 'rgba(255,90,78,.25)');
      const flick = reduced ? 1 : (Math.sin(amb * 13) > -.85 ? 1 : .35), nx = cr.x - 34, sy = cr.y + 20;
      line([P(cr.x + 4, cr.y + 8), P(cr.x + 4, sy)], '#4a5164', 3);
      rrect(nx, sy, 160, 32, 4, '#141826', 'rgba(255,90,78,' + .7 * flick + ')', 2);
      g.save(); g.globalAlpha = flick; g.font = '600 15px "IBM Plex Mono", ui-monospace, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ff5a4e'; g.shadowBlur = reduced ? 0 : 12; g.fillStyle = '#ff8a7c'; g.fillText('ENTREGAS YA!', nx + 80, sy + 17); g.restore();
    }
  }
}
function drawRain() {
  if (L.theme !== 'storm') return;
  g.strokeStyle = 'rgba(200,215,245,.32)'; g.lineWidth = 1.3; g.beginPath();
  for (const d of RAIN) { const t = reduced ? 0 : amb; const y = mod(d.y + t * d.v, H + 40) - 20, x = mod(d.x - t * d.v * .25, W + 200) - 100; g.moveTo(x, y); g.lineTo(x - d.l * .3, y + d.l); }
  g.stroke();
}

function drawPlatform(x, row, kind, o = {}) {
  const T = THEMES[L.theme], p = project(x, row);
  if (o.shake) p.x += (Math.random() - .5) * 3.2;
  const w = kind === 'moving' ? 84 : 74, h = kind === 'crumble' ? 14 : kind === 'blink' || kind === 'gate' ? 15 : 19;
  const a = P(p.x - w / 2, p.y - 7), b = P(p.x + w / 2, p.y + 7), c = P(p.x + w / 2 + 22, p.y - 12), d = P(p.x - w / 2 + 22, p.y - 26);
  const geo = { a, b, c, d };
  g.save(); g.globalAlpha = o.alpha ?? 1;
  if (o.ghost) {
    poly([a, b, c, d], o.ghostFill || 'rgba(255,255,255,.08)'); line([a, b, c, d, a], o.ghostColor, 1.5, [4, 4]);
    if (o.charge != null) { const cc = P((a.x + c.x) / 2, (a.y + c.y) / 2); g.beginPath(); g.arc(cc.x, cc.y, 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * o.charge); g.strokeStyle = 'rgba(255,214,90,.9)'; g.lineWidth = 2.5; g.stroke(); }
    g.restore(); return geo;
  }
  let top = T.top, s1 = T.side1, s2 = T.side2;
  if (kind === 'fixed' && L.rows[row].checkpoint) top = T.topSafe;
  if (kind === 'moving') { top = '#93a6ae'; s1 = '#6f828b'; s2 = '#58686f'; }
  if (kind === 'crumble') { top = 'rgba(196,214,208,.92)'; s1 = 'rgba(132,156,152,.92)'; s2 = 'rgba(108,132,128,.92)'; }
  if (kind === 'blink') { top = o.warn && Math.sin(amb * 38) > 0 ? '#fff1c0' : '#e3c24a'; s1 = '#9c7c25'; s2 = '#7f641d'; }
  if (kind === 'gate') { [top, s1, s2] = groupColors(o.group); }
  if (kind === 'ice') { top = '#d3edf4'; s1 = '#8fbfd0'; s2 = '#73a5b8'; }
  if (kind === 'belt') { top = '#3f4248'; s1 = '#2a2c30'; s2 = '#1f2124'; }
  if (kind === 'plug') { top = '#6a5238'; s1 = '#a5674a'; s2 = '#8a543b'; }
  if (o.feather && kind === 'fixed') top = '#cdb76a';
  if (kind === 'blink' && !reduced) { g.save(); g.globalAlpha = (o.alpha ?? 1) * (o.warn ? .22 : .35); ell((a.x + c.x) / 2, (a.y + c.y) / 2, 52, 22, '#ffd36a'); g.restore(); }
  poly([b, c, P(c.x, c.y + h), P(b.x, b.y + h)], s2);
  poly([a, b, P(b.x, b.y + h), P(a.x, a.y + h)], s1);
  poly([a, b, c, d], top, 'rgba(255,255,255,.45)', 1);
  if (kind === 'fixed' || kind === 'moving') { for (let i = 6; i < w - 4; i += 7) { const k = i / w; line([P(lerp(a.x, b.x, k), lerp(a.y, b.y, k) + h - 8), P(lerp(a.x, b.x, k), lerp(a.y, b.y, k) + h - 3)], kind === 'moving' ? '#3f4c52' : T.tick, 1); } }
  if (kind === 'moving') { const cc = P((a.x + c.x) / 2, (a.y + c.y) / 2); drawArrow(cc.x - 22, cc.y + 3, Math.PI + .15, 'rgba(255,255,255,.7)', 4); drawArrow(cc.x + 22, cc.y - 3, .15, 'rgba(255,255,255,.7)', 4); }
  if (kind === 'crumble') {
    const cc = P((a.x + c.x) / 2, (a.y + c.y) / 2), k = o.crack || 0;
    line([P(cc.x - 18, cc.y + 2), P(cc.x - 4, cc.y - 2), P(cc.x + 2, cc.y + 5), P(cc.x + 16, cc.y - 1)], 'rgba(40,58,56,.7)', 1.2);
    line([P(cc.x - 4, cc.y - 2), P(cc.x - 1, cc.y - 11)], 'rgba(40,58,56,.6)', 1);
    if (k > 0) { line([P(cc.x + 2, cc.y + 5), P(cc.x + 8, cc.y + 12)], 'rgba(40,58,56,.85)', 1.4); line([P(cc.x - 18, cc.y + 2), P(cc.x - 26, cc.y - 5)], 'rgba(40,58,56,.85)', 1.4); }
    line([P(a.x + 8, a.y - 2), P(d.x + 8, d.y + 2)], 'rgba(255,255,255,.45)', 2);
  }
  if (kind === 'ice') { line([P(a.x + 14, a.y - 3), P(a.x + 34, a.y - 9)], 'rgba(255,255,255,.9)', 2); line([P(a.x + 44, a.y - 4), P(a.x + 56, a.y - 8)], 'rgba(255,255,255,.7)', 1.5); }
  if (kind === 'belt') {
    const cc = P((a.x + c.x) / 2, (a.y + c.y) / 2), dir = o.dir || 1, ph = reduced ? 0 : (amb * 1.8 * dir) % 1;
    for (let i = -1; i <= 1; i++) { const k = (i + ph) * 24; if (Math.abs(k) < 30) drawArrow(cc.x + k, cc.y - k * .15, dir > 0 ? -.15 : Math.PI - .15, 'rgba(226,189,72,.9)', 5); }
    line([a, b], 'rgba(226,189,72,.55)', 1.5);
  }
  if (kind === 'plug') { const cc = P((a.x + c.x) / 2, (a.y + c.y) / 2); ell(cc.x, cc.y, 24, 8, '#4a3826'); line([P(cc.x, cc.y - 1), P(cc.x - 5, cc.y - 12)], '#55613a', 2); ell(cc.x - 7, cc.y - 13, 5, 2.6, '#6b7a44', -.5); ell(cc.x + 3, cc.y - 9, 5, 2.6, '#7d8c50', .5); }
  if (kind === 'blink') { const cc = P((a.x + c.x) / 2, (a.y + c.y) / 2); poly([P(cc.x + 2, cc.y - 9), P(cc.x - 6, cc.y + 1), P(cc.x - 1, cc.y + 1), P(cc.x - 3, cc.y + 8), P(cc.x + 6, cc.y - 2), P(cc.x + 1, cc.y - 2)], '#8a5a12'); }
  g.restore(); return geo;
}
function drawFlag(x, y, raised) {
  const t = raised == null ? 0 : clamp((amb - raised) / .5, 0, 1), up = raised == null ? 0 : easeOut(t);
  line([P(x, y + 9), P(x, y - 22)], '#2f2c28', 2);
  const fy = y - 6 - up * 14, wave = reduced ? 0 : Math.sin(amb * 6) * 2;
  poly([P(x, fy - 8), P(x + 18, fy - 5 + wave), P(x + 1, fy + 3)], raised == null ? '#8d897e' : '#e0782c');
}
function drawFeather(x, row) {
  const p = topCenter(x, row, 6), bob = reduced ? 0 : Math.sin(amb * 2.4) * 3;
  g.save(); g.translate(p.x, p.y - 18 + bob); g.rotate(.37);
  if (!reduced) ell(0, 0, 20, 30, 'rgba(255,220,100,' + (.18 + Math.sin(amb * 4) * .08) + ')');
  ell(0, 0, 11, 24, '#ffd258'); ell(-3, -3, 7, 20, '#ffe68b'); line([P(0, 27), P(0, -18)], '#b89133', 1.5);
  for (let y = -12; y < 17; y += 6) { line([P(0, y + 3), P(8, y - 4)], '#e6b33d', 1); line([P(0, y + 3), P(-7, y - 3)], '#e6b33d', 1); }
  g.restore();
}
function drawDrone(d) {
  if (d.destroyed) return;
  if (d.stun > 0) {   // aturdido: baja a la altura del piso y sirve de plataforma
    const q = topCenter(d.fx, d.row), blink = d.stun < 1.4 && !reduced && Math.sin(amb * 22) > 0;
    ell(q.x, q.y + 6, 26, 7, 'rgba(20,20,20,.25)');
    g.save(); g.translate(q.x, q.y + 2); g.globalAlpha = blink ? .45 : 1; drawDroneBody(1, true); g.restore(); return;
  }
  const x = droneX(d), p = topCenter(x, d.row), y = p.y - 34 + (reduced ? 0 : Math.sin(amb * 5 + d.phase) * 2.5);
  line([P(140, project(0, d.row).y - 32), P(648, project(4, d.row).y - 26)], 'rgba(184,153,117,.3)', 2, [2, 6]);
  ell(p.x, p.y + 1, 22, 6, 'rgba(60,40,30,.15)');
  g.save(); g.translate(p.x, y);
  const dir = Math.cos(clock * d.speed + d.phase) > 0 ? 1 : -1;
  drawDroneBody(dir);
  drawArrow(dir * 41, 0, dir > 0 ? 0 : Math.PI, 'rgba(240,138,60,.85)', 4);
  g.restore();
}
function drawDroneBody(dir = 1, off = false) {
  line([P(-25, -4), P(25, -4)], '#3a3c40', 4);
  line([P(0, 8), P(0, 13)], '#2a2b2e', 1.2);
  rrect(-8, 12, 16, 12, 2, '#a98457', '#4f3a24', 1); line([P(-8, 17), P(8, 17)], 'rgba(226,189,72,.9)', 2);
  rrect(-16, -11, 32, 20, 5, '#d7d3c8', '#26272a', 1.3);
  g.fillStyle = '#e0782c'; g.fillRect(-15, -1, 30, 4);
  rrect(-11, -8, 16, 7, 3, '#26272a'); ell(-3 + dir * 4, -4.5, 2.6, 2.6, off ? '#3a3c40' : Math.sin(amb * 8) > -.6 ? '#ff4b3e' : '#7a2a24');
  for (const a of [-25, 25]) { rrect(a - 4, -15, 8, 14, 2, '#55575c'); const spin = off ? 1 : reduced ? 1 : Math.abs(Math.sin(amb * 40 + a)); ell(a, -15, 17 * spin + 3, 3.2, 'rgba(60,60,64,.55)'); }
}
function drawMovingRail(row) {
  const m = L.rows[row].moving, a = project(m.c - m.a - .25, row), b = project(m.c + m.a + .25, row);
  line([P(a.x, a.y + 15), P(b.x + 25, b.y + 15)], 'rgba(40,42,46,.8)', 8); line([P(a.x, a.y + 12), P(b.x + 25, b.y + 12)], 'rgba(180,176,166,.85)', 3);
}
function drawBubble(x, y, text) {
  g.save(); g.font = '600 13px "IBM Plex Mono", ui-monospace, monospace'; const w = g.measureText(text).width + 18;
  rrect(x - w / 2, y - 30, w, 26, 4, '#efece4', '#1c1d1f', 1.4); poly([P(x - 5, y - 5), P(x + 3, y - 5), P(x - 3, y + 4)], '#efece4');
  g.fillStyle = '#1c1d1f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y - 17); g.restore();
}
function drawGoal(x, row) {
  const c = topCenter(x, row); const jumping = mode === 'celebrate';
  const hop = jumping ? Math.abs(Math.sin(amb * 9)) * 18 : (reduced ? 0 : Math.abs(Math.sin(amb * 2.2)) * 3);
  ell(c.x, c.y + 2, 30, 9, 'rgba(20,20,20,.22)');
  drawSibling(L.sib, c.x + 4, c.y - 2 - hop, .9, -1, { blink: amb < sibBlink.until, flap: jumping ? Math.sin(amb * 30) * .6 : Math.sin(amb * 3) * .15 });
  if (mode !== 'celebrate') drawBubble(c.x + 4, c.y - 64 - hop, L.bubble);
  (L.family || []).slice(1).forEach((k, i) => { const q = topCenter(i < 2 ? 1 : 3, row); drawSibling(k, q.x + (i % 2 ? 12 : -12), q.y - 2 - (jumping ? hop * .7 : 0), .78, i < 2 ? 1 : -1, { blink: amb < sibBlink.until }); });
}

/* Cada grupo de puentes tiene su color; la palanca que lo enciende usa el mismo */
const GROUP_COLORS = { a: ['#6fb1cf', '#3f7f9c', '#2f6a85', 'rgba(111,177,207,.18)'], b: ['#d98ab3', '#a85d85', '#8a4a6c', 'rgba(217,138,179,.18)'], pk: ['#d9a441', '#a87a26', '#8a631c', 'rgba(217,164,65,.16)'] };
const groupColors = g => GROUP_COLORS[g] || GROUP_COLORS.a;
/* Paquete de reparto: hay que juntarlos todos para abrir la puerta */
function drawPackage(x, row) {
  const p = topCenter(x, row), bob = reduced ? 0 : Math.sin(amb * 2.6 + row) * 3, y = p.y - 16 + bob;
  if (!reduced) ell(p.x, p.y - 12, 24, 20, 'rgba(217,164,65,' + (.16 + Math.sin(amb * 4) * .06) + ')');
  ell(p.x, p.y + 1, 15, 4.5, 'rgba(20,20,20,.22)');
  rrect(p.x - 13, y - 11, 26, 20, 2.5, '#b98d5b', '#4f3a24', 1.3);
  g.fillStyle = '#e2bd48'; g.fillRect(p.x - 2.5, y - 11, 5, 20); g.fillRect(p.x - 13, y - 3.5, 26, 4);
  line([P(p.x - 13, y - 11), P(p.x - 6, y - 16), P(p.x + 6, y - 16), P(p.x + 13, y - 11)], '#4f3a24', 1.3);
}
/* Palanca: se activa con el golpe y enciende los puentes de su color */
function drawLever(lv) {
  const T = THEMES[L.theme], c = topCenter(lv.x, lv.row), on = Reglas.gateOn(levers, lv.g);
  const k = leverHit && leverHit.g === lv.g ? clamp((amb - leverHit.t) / .3, 0, 1) : 1;
  const ang = (on ? .6 : -.6) + (reduced ? 0 : Math.sin(k * Math.PI) * (on ? .35 : -.35));
  const tip = P(c.x + Math.sin(ang) * 26, c.y - 4 - Math.cos(ang) * 26);
  ell(c.x, c.y + 9, 20, 6, 'rgba(20,20,20,.2)');
  rrect(c.x - 17, c.y + 2, 34, 8, 2, T.side1, 'rgba(0,0,0,.35)', 1);
  rrect(c.x - 11, c.y - 7, 22, 11, 3, '#2f2c28');
  ell(c.x + 6, c.y - 2, 2.4, 2.4, on ? '#8fe0ff' : '#5a5650');
  line([P(c.x, c.y - 4), tip], '#1c1d1f', 6); line([P(c.x, c.y - 4), tip], '#b9b4a8', 3);
  ell(tip.x, tip.y, 7, 7, '#1c1d1f'); ell(tip.x, tip.y, 5, 5, groupColors(lv.g)[0]); if (!on) ell(tip.x, tip.y, 2.2, 2.2, '#1c1d1f');
  const inReach = mode === 'playing' && combat && Math.round(player.row) === lv.row && Math.abs(player.x - lv.x) <= Reglas.PUNCH_REACH;
  if (inReach && !levers.has(lv.g)) drawBubble(c.x + 4, c.y - 40 - (reduced ? 0 : Math.abs(Math.sin(amb * 4)) * 4), coarse ? 'GOLPE' : 'GOLPE: J');
  else if (!levers.has(lv.g) && !reduced && mode === 'playing') { g.beginPath(); g.arc(tip.x, tip.y, 11 + Math.sin(amb * 5) * 2, 0, Math.PI * 2); g.strokeStyle = 'rgba(224,120,44,.8)'; g.lineWidth = 1.6; g.stroke(); }
}
/* Maceta: se empuja de lado; si cae en un hueco, lo tapa */
function drawPot(p) {
  const e = smooth(clamp(p.t, 0, 1)), x = lerp(p.fromX, p.x, e), c = topCenter(x, p.row), sink = p.sunk ? e * 14 : 0;
  g.save(); g.translate(c.x, c.y + sink); g.globalAlpha = p.sunk ? 1 - e * .6 : 1;
  ell(0, 3, 17, 5, 'rgba(20,20,20,.22)');
  if (L.potStyle === 'box') {   // en el almacén y el congelador son cajas
    rrect(-15, -26, 30, 28, 2.5, '#b98d5b', '#4f3a24', 1.4); g.fillStyle = '#e2bd48'; g.fillRect(-3, -26, 6, 28);
    line([P(-15, -12), P(15, -12)], '#4f3a24', 1); line([P(-9, -20), P(-5, -16)], '#4f3a24', 1.2); g.restore(); return;
  }
  poly([P(-14, -22), P(14, -22), P(10, 2), P(-10, 2)], '#a5674a', '#3a2f26', 1.4); rrect(-16, -26, 32, 6, 2, '#b97a5a', '#3a2f26', 1.3);
  for (const [k, h] of [[-.5, 22], [0, 28], [.5, 20]]) { line([P(k * 8, -25), P(k * 18, -25 - h)], '#55613a', 2); ell(k * 18, -27 - h, 6, 3.2, k ? '#6b7a44' : '#7d8c50', k); }
  g.restore();
}
/* Viento: una manga en la pared marca hacia dónde sopla; las rayas avisan y luego empujan */
function drawWind(row, w) {
  const st = Reglas.gust(w, clock), side = w.dir > 0 ? -.55 : 4.65, c = topCenter(side, row), sway = reduced ? 0 : Math.sin(amb * (st.blowing ? 18 : 3)) * (st.blowing ? 3 : 1);
  line([P(c.x, c.y + 6), P(c.x, c.y - 26)], '#2f2c28', 2);
  const len = st.blowing ? 30 : st.warn ? 18 : 9, drop = st.blowing ? 2 : st.warn ? 8 : 16;
  poly([P(c.x, c.y - 26), P(c.x + w.dir * len, c.y - 24 + drop + sway), P(c.x + w.dir * len, c.y - 16 + drop + sway), P(c.x, c.y - 14)], st.blowing ? '#e0782c' : st.warn ? '#e2bd48' : '#b9b4a8', '#2f2c28', 1.2);
  if (!(st.blowing || st.warn) || reduced && !st.blowing) return;
  g.save(); g.globalAlpha = st.blowing ? .75 : .35; g.strokeStyle = '#f2efe6'; g.lineWidth = st.blowing ? 2 : 1.3; g.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const u = ((reduced ? 0 : amb * (st.blowing ? 1.9 : .9)) + i / 6) % 1, x = w.dir > 0 ? lerp(-.6, 4.6, u) : lerp(4.6, -.6, u), q = topCenter(x, row), y = q.y - 12 - (i % 3) * 13;
    g.beginPath(); g.moveTo(q.x, y); g.lineTo(q.x + w.dir * (st.blowing ? 34 : 16), y - w.dir * 2); g.stroke();
  }
  g.restore();
}
/* Quien fue rescatado sigue a Pipo un aterrizaje atrás; en el final, toda la familia en fila */
function drawFollowers() {
  const jumping = mode === 'celebrate';
  for (let i = followers.length - 1; i >= 0; i--) {
    const f = followers[i], u = clamp(f.t, 0, 1), e = smooth(u);
    const tx = L.rows[f.row].moving ? movingX(f.row) : f.x, x = lerp(f.fromX, tx, e), row = lerp(f.fromRow, f.row, e);
    const lift = u > 0 && u < 1 ? Math.sin(Math.PI * u) * 34 : 0, c = topCenter(x, row, lift), ox = -13 - (i % 3) * 5;
    const hop = jumping && !reduced ? Math.abs(Math.sin(amb * 9 + i)) * 16 : 0;
    if (Reglas.chaseDead(chaseY, row) && chaseOn()) continue;
    ell(c.x + ox, c.y + 2 + lift, 16, 5, 'rgba(20,20,20,.2)');
    drawSibling(f.kind, c.x + ox, c.y - 3 - hop, .86, Math.sign(player.x - x) || 1, { blink: amb < sibBlink.until, flap: lift || jumping ? Math.sin(amb * 30 + i) * .5 : 0 });
    if (!i && sibQuip && amb < sibQuip.until && !jumping) drawBubble(c.x + ox, c.y - 58, sibQuip.text);
  }
}
/* Final: lo que queda arriba de la línea roja ya se apagó */
function drawChase() {
  const y = project(2, chaseY + .5).y - 20; if (y < -40) return;
  g.fillStyle = 'rgba(6,8,14,.86)'; g.fillRect(0, -40, W, y + 40);
  const grad = g.createLinearGradient(0, y, 0, y + 46); grad.addColorStop(0, 'rgba(255,70,60,.5)'); grad.addColorStop(1, 'rgba(255,70,60,0)');
  g.fillStyle = grad; g.fillRect(0, y, W, 46);
  g.fillStyle = reduced || Math.sin(amb * 12) > -.2 ? '#ff5a4e' : '#a8302a'; g.fillRect(0, y - 2, W, 4);
}
function drawExit() {
  const c = topCenter(2, 0), bob = reduced ? 0 : Math.sin(amb * 3) * 4;
  drawBubble(c.x, c.y - 44 + bob, 'SALIDA'); drawArrow(c.x - 1, c.y - 30 + bob, Math.PI / 2, 'rgba(240,138,60,.95)', 6);
}
function platformAndExtras(x, row, kind, b) {
  const o = {};
  if (kind === 'crumble') { const s = crumbles.get(row + ':' + x); if (s) { if (s.state === 'broken') { o.ghost = true; o.ghostColor = 'rgba(160,215,222,.55)'; } else if (s.state === 'shaking') { o.shake = !reduced; o.crack = s.t; } else if (s.state === 'returning') o.alpha = clamp(s.t / .35, 0, 1); } }
  if (kind === 'blink') { const st = blinkState(row, b); if (!st.on) { o.ghost = true; o.ghostColor = 'rgba(255,214,90,.6)'; o.ghostFill = 'rgba(255,214,90,.07)'; o.charge = st.charge; } else { o.warn = st.warn; o.alpha = .4 + .6 * st.appear; } }
  if (kind === 'belt') o.dir = beltNow(L.rows[row]);
  if (kind === 'gate') { o.group = b.g; if (!Reglas.gateOn(levers, b.g)) { o.ghost = true; o.ghostColor = groupColors(b.g)[0]; o.ghostFill = groupColors(b.g)[3]; } }
  if (L.feather && row === L.feather.row && Math.abs(x - L.feather.x) < .1) o.feather = true;
  const geo = drawPlatform(x, row, kind, o), center = topCenter(x, row);
  const T = THEMES[L.theme];
  if (L.n === 1 && row <= 2 && Math.abs(x - 2) < .1) footprints(center.x, center.y, .75);
  const off = kind === 'gate' && o.ghost; // puente apagado: no se puede pisar
  if (L.rows[row].checkpoint && x === flagCol(row) && !off) drawFlag(center.x + 15, center.y - 6, flags.get(row));
  if (phase === 'up' && row === nRows() - 1 && x === 2) drawGoal(x, row);
  if (o.feather && !featherGot && !off) drawFeather(x, row);
  const pi = Reglas.packageAt(L.packages, row, x); if (pi >= 0 && !gotPk.has(pi)) drawPackage(x, row);
  if (off && b.g === 'pk' && x === 2) drawBubble(center.x, center.y - 16, gotPk.size + ' / ' + L.packages.length + ' paquetes');
  const reachable = mode === 'playing' && !off && canReach(x, row);
  if (reachable) { g.beginPath(); g.ellipse(center.x, center.y, 21, 7, .12, 0, Math.PI * 2); g.strokeStyle = T.reach; g.lineWidth = 1.6; g.setLineDash([3, 4]); g.stroke(); g.setLineDash([]); }
  if (reachable && hover && hover.row === row && Math.abs(hover.x - x) < .3) { g.beginPath(); g.ellipse(center.x, center.y, 26, 9, .12, 0, Math.PI * 2); g.strokeStyle = T.reach; g.lineWidth = 2.6; g.stroke(); }
  hitAreas.push({ x, row, points: [geo.a, geo.b, geo.c, geo.d], kind });
}
function footprints(x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); for (const [a, b] of [[-7, 2], [5, -4]]) { ell(a, b, 3, 4, 'rgba(40,36,30,.45)'); ell(a - 2, b - 4, 1.4, 1.5, 'rgba(40,36,30,.45)'); ell(a + 1, b - 5, 1.4, 1.5, 'rgba(40,36,30,.45)'); ell(a + 3, b - 3, 1.4, 1.5, 'rgba(40,36,30,.45)'); } g.restore(); }

function render() {
  g = ctx; g.save(); g.clearRect(0, 0, W, H);
  if (shake > .2 && !reduced) g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  hitAreas = [];
  drawBackground();
  const n = nRows();
  for (let row = n - 1; row >= 0; row--) {
    const yy = project(2, row).y; if (yy < -120 || yy > H + 100) continue;
    const r = L.rows[row];
    if (r.moving) { drawMovingRail(row); platformAndExtras(movingX(row), row, 'moving'); }
    else {
      const items = [];
      (r.cells || []).forEach(x => { if (!goneNow(row, x)) items.push([x, 'fixed']); }); (r.gate || []).forEach(q => items.push([q.x, 'gate', q])); (r.ice || []).forEach(x => items.push([x, 'ice'])); if (r.belt) r.belt.cells.forEach(x => items.push([x, 'belt']));
      for (let x = 0; x < 5; x++) if (plugs.has(row + ':' + x)) items.push([x, 'plug']); (r.crumble || []).forEach(x => items.push([x, 'crumble'])); (r.blink || []).forEach(b => items.push([b.x, 'blink', b]));
      items.sort((p, q) => p[0] - q[0]).forEach(it => platformAndExtras(it[0], row, it[1], it[2]));
    }
    for (const d of drones) if (d.row === row) drawDrone(d);
    for (const lv of L.levers || []) if (lv.row === row) drawLever(lv);
    for (const p of pots) if (p.row === row && !(p.sunk && p.t >= 1)) drawPot(p);
    if (r.wind) drawWind(row, windNow(r));
  }
  if (phase === 'down') drawExit();
  if (dusk > .01) { g.fillStyle = 'rgba(' + ((L.down && L.down.tint) || '14,18,44') + ',' + (.36 * dusk).toFixed(3) + ')'; g.fillRect(0, 0, W, H); } // cae la noche en la bajada
  if (followers.length) drawFollowers();
  if (L.n === 1 && phase === 'up' && player.row <= 1 && mode !== 'celebrate') { const a = topCenter(2, 0), b = topCenter(2, 1); g.beginPath(); g.moveTo(a.x, a.y - 3); g.quadraticCurveTo(a.x + 30, a.y - 55, b.x, b.y + 6); g.strokeStyle = 'rgba(240,138,60,.7)'; g.lineWidth = 2; g.setLineDash([4, 6]); g.stroke(); g.setLineDash([]); drawArrow(b.x, b.y + 6, -Math.PI / 2, 'rgba(240,138,60,.85)', 5); }
  drawPlayer();
  if (chaseOn()) drawChase();
  drawRain();
  drawParticles();
  if (flash > 0) { g.fillStyle = 'rgba(235,240,255,' + flash + ')'; g.fillRect(0, 0, W, H); }
  g.restore();
}
function drawPlayer() {
  let p = topCenter(player.x, player.row, jumpLift()), alpha = 1, rot = 0;
  const face = punch ? punch.dir : player.face;
  if (player.fall) { const f = player.fall, u = clamp(f.elapsed / f.duration, 0, 1); p = topCenter(f.x, f.row, f.lift - u * u * 170); alpha = 1 - u * u; rot = u * 1.3; }
  else if (player.drop) rot = Math.sin(amb * 26) * .12;
  else if (!player.jump && !reduced) p.y += Math.sin(amb * 3.2) * .7;
  if (mode === 'celebrate' && !reduced) p.y -= Math.abs(Math.sin(amb * 9 + 1)) * 14;
  g.save(); g.globalAlpha = alpha;
  drawDuck(p.x, p.y - 3, 1, face, { acc: 'scarf', sq: player.sq, blink: amb < blinkEye.until, wind: player.jump ? 2.2 : 1, flap: player.drop ? Math.sin(amb * 48) * .9 : player.jump ? Math.sin(amb * 32) * .5 : 0, alarm: !!(player.drop || player.fall), shield: player.shield > 0 && Math.sin(amb * 20) > -.3, rot });
  if (punch && !player.fall) {
    const u = punch.age / .25, reach = Math.sin(Math.PI * u) * (punch.far ? 58 : 31);
    g.save(); g.translate(p.x, p.y - 23); g.scale(punch.dir, 1);
    line([P(9, 0), P(19 + reach, -3)], '#2c3529', 9); line([P(9, 0), P(19 + reach, -3)], '#ffd23f', 6);
    rrect(15 + reach, -10, 15, 13, 4, '#ffd23f', '#2c3529');
    if (u < .7) { line([P(36 + reach, -8), P(44 + reach, -12)], '#e8b331', 2); line([P(38 + reach, 0), P(48 + reach, 0)], '#e8b331', 2); line([P(36 + reach, 7), P(44 + reach, 12)], '#e8b331', 2); }
    g.restore();
  }
  g.restore();
}

/* ============================================================
   Viñetas de la historia (o imágenes opcionales)
   ============================================================ */
function drawScene(kind, sib) {
  const w = 520, h = 230;
  const grad = (cols) => { const gr = g.createLinearGradient(0, 0, 0, h); cols.forEach((c, i) => gr.addColorStop(i / (cols.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
  const bob = k => reduced ? 0 : Math.sin(amb * 3 + k) * 1.6;
  const lamp = (x, y) => { if (!reduced) { g.save(); g.globalAlpha = .22; ell(x + 20, y + 50, 50, 80, '#ffb066'); g.restore(); } line([P(x, 240), P(x, y)], '#26241f', 4); line([P(x, y), P(x + 20, y - 4)], '#26241f', 3); ell(x + 21, y - 2, 7, 4, '#ffd29a'); };
  if (kind === 'nest' || kind === 'ending') {
    const night = kind === 'ending';
    grad(night ? ['#0f1322', '#1f2638', '#2e3445'] : ['#8f969c', '#c9a283', '#9f7458']);
    if (night) { const r2 = rng(3); for (let i = 0; i < 34; i++) ell(r2() * w, r2() * 110, 1.1, 1.1, 'rgba(255,255,255,' + (.3 + .3 * Math.sin(amb * 2 + i)) + ')'); ell(440, 48, 20, 20, '#e8e2c8'); ell(449, 42, 18, 18, '#1f2638'); const dx = mod(amb * 18, w + 80) - 40; ell(dx, 70, 2.4, 2.4, Math.sin(amb * 6) > 0 ? '#ff4b3e' : 'rgba(255,75,62,.3)'); }
    else ell(400, 80, 30, 30, 'rgba(255,205,160,.6)');
    lamp(60, 70);
    ell(260, 214, 300, 40, night ? '#1f2c35' : '#4f6464');
    g.save(); g.translate(420, 196); g.rotate(.12); line([P(0, 0), P(46, 0), P(40, 18), P(6, 18), P(0, 0)], night ? '#4a5260' : '#6b6f72', 2); for (let k = 1; k < 5; k++) line([P(k * 9, 0), P(k * 8 + 3, 18)], night ? '#4a5260' : '#6b6f72', 1.2); line([P(0, 0), P(-10, -12)], night ? '#4a5260' : '#6b6f72', 2); ell(10, 22, 4, 4, '#2a2b2e'); ell(36, 22, 4, 4, '#2a2b2e'); g.restore();
    for (let i = 0; i < 9; i++) line([P(110 + i * 9, 222), P(106 + i * 9 + Math.sin(amb + i) * 2, 160 - (i % 3) * 12)], night ? '#24342b' : '#3b4a32', 2.5);
    ell(270, 190, 92, 22, '#6e5638'); ell(270, 183, 82, 16, '#8b6c45'); ell(270, 182, 64, 11, '#4f3c26');
    drawDuck(242, 182 + bob(0), 1.55, 1, Object.assign({ blink: night }, MOM));
    drawDuck(304, 186 + bob(1), .82, -1, { acc: 'scarf' }); drawDuck(206, 190 + bob(2), .72, 1, { acc: 'phone' });
    drawDuck(336, 192 + bob(3), .7, -1, { acc: 'shades' }); drawDuck(284, 197 + bob(4), .7, -1, { acc: 'foil', blink: night });
  } else if (kind === 'storm') {
    grad(['#7d838a', '#a99a86', '#8c7a66']);
    for (let i = 0; i < 6; i++) { const y = 40 + i * 28, x = mod(amb * 160 + i * 90, w + 200) - 100; line([P(x, y), P(x + 70, y + 4)], 'rgba(235,230,220,.45)', 2); }
    for (const [x, y, k] of [[110, 64, 0], [260, 40, 1], [410, 72, 2]]) { g.save(); g.translate(x + Math.sin(amb * 1.6 + k) * 20, y + Math.cos(amb * 2 + k) * 8); g.scale(.95, .95); drawDroneBody(k % 2 ? -1 : 1); g.restore(); }
    for (let i = 0; i < 3; i++) { const t = mod(amb * .7 + i * .33, 1); rrect(150 + i * 110, 90 + t * 140, 14, 11, 2, '#a98457', '#4f3a24', 1); }
    drawDuck(150, 160, .8, 1, { acc: 'phone', rot: amb * 3, alarm: true }); drawDuck(260, 135, .8, -1, { acc: 'shades', rot: -amb * 2.6 }); drawDuck(380, 165, .8, 1, { acc: 'foil', rot: amb * 2.2, alarm: true });
    ell(250, 222, 90, 12, '#5f4d36'); drawDuck(250, 214, .9, 1, { acc: 'scarf', flap: Math.sin(amb * 20) * .5 });
  } else if (kind === 'scatter') {
    grad(['#9b9a98', '#a7867a', '#38405a']);
    const t1 = 60, t2 = 210, t3 = 380, base = 210;
    poly([P(t1, base), P(t1 + 10, 70), P(t1 + 90, 78), P(t1 + 100, base)], '#6f685e'); poly([P(t1 - 4, 74), P(t1 + 50, 40), P(t1 + 104, 80)], '#5a3c31');
    g.save(); g.beginPath(); g.moveTo(t1 + 6, 120); g.lineTo(t1 + 96, 132); g.lineTo(t1 + 96, 140); g.lineTo(t1 + 6, 128); g.closePath(); g.clip(); g.fillStyle = '#e2bd48'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1d1f'; for (let x = t1; x < t1 + 110; x += 14) g.fillRect(x, 110, 6, 40); g.restore();
    g.beginPath(); g.moveTo(t2, base); g.lineTo(t2, 120); g.quadraticCurveTo(t2 + 70, 40, t2 + 140, 120); g.lineTo(t2 + 140, base); g.closePath(); g.fillStyle = 'rgba(150,165,140,.55)'; g.fill(); g.strokeStyle = '#2d3329'; g.lineWidth = 3; g.stroke(); poly([P(t2 + 40, 110), P(t2 + 70, 70), P(t2 + 58, 130)], 'rgba(30,34,24,.35)');
    line([P(t3 + 50, base), P(t3 + 50, 34)], '#272d3f', 6); line([P(t3 + 20, 80), P(t3 + 80, 80)], '#272d3f', 4); line([P(t3 + 30, 130), P(t3 + 70, 130)], '#272d3f', 4); poly([P(t3 + 10, base), P(t3 + 50, 60), P(t3 + 90, base)], null, '#272d3f', 3); ell(t3 + 50, 30, 6, 6, Math.sin(amb * 3) > 0 ? '#ff4b3e' : '#7a2a24');
    drawDuck(t1 + 50, 70 + bob(0), .62, 1, { acc: 'phone' }); drawDuck(t2 + 70, 75 + bob(1), .62, -1, { acc: 'shades' }); drawDuck(t3 + 50, 58 + bob(2), .55, 1, { acc: 'foil' });
  } else if (kind === 'pipo') {
    grad(['#8f969c', '#c9a283', '#b07b5c']);
    poly([P(300, 230), P(310, -10), P(500, 4), P(510, 230)], '#7f796f'); for (let y = 20; y < 230; y += 26) line([P(312, y), P(498, y + 8)], 'rgba(30,26,22,.25)', 1);
    g.save(); g.lineCap = 'round'; g.beginPath(); g.moveTo(330, 140); g.quadraticCurveTo(360, 110, 390, 150); g.quadraticCurveTo(420, 120, 450, 150); g.strokeStyle = 'rgba(196,64,74,.55)'; g.lineWidth = 5; g.stroke(); g.restore();
    for (let i = 0; i < 4; i++) { const yy = 200 - i * 52; poly([P(350, yy), P(420, yy + 10), P(440, yy - 6), P(370, yy - 16)], '#a5a89d'); }
    ell(200, 226, 220, 22, '#615c53'); lamp(40, 60);
    drawDuck(200, 214 + bob(0), 2.1, 1, { acc: 'scarf', wind: 2 });
  } else if (kind === 'rescue') {
    const lv = LEVELS[sib], T = THEMES[lv.theme]; grad(T.sky);
    ell(260, 214, 240, 28, T.ground);
    const j = reduced ? 0 : Math.abs(Math.sin(amb * 4)) * 6;
    drawDuck(220, 204 - j, 1.8, 1, { acc: 'scarf' });
    drawSibling(lv.sib, 306, 204, 1.7, -1, { blink: Math.sin(amb * 1.3) > .96 });
    const prev = g; drawBubble(312, 114, lv.bubble); g = prev;
  }
}
function drawMiniDrone(x, y) { g.save(); g.translate(x, y); g.scale(.9, .9); drawDroneBody(1); g.restore(); }
/* Ilustraciones opcionales: se precargan al arrancar para que al abrir una viñeta ya estén listas */
const artCache = {};
function preloadArt() {
  Object.values(CONFIG.ART).forEach(src => {
    if (!src || artCache[src]) return;
    const img = artCache[src] = new Image();
    img.alt = ''; img.decoding = 'async'; img.src = src;
    img.decode().catch(() => { /* si falla, mountVignette usa el dibujo del juego */ });
  });
}
function mountVignette(scene, art, sib) {
  vignette = null;
  const slot = ui.card.querySelector('[data-vignette]'); if (!slot) return;
  const src = CONFIG.ART[art];
  const cached = src && artCache[src];
  if (cached && cached.complete && cached.naturalWidth) { // ya en memoria: mostrar la imagen sin pasar por el canvas
    const el = cached.cloneNode(); el.className = 'vignette'; slot.replaceWith(el); return;
  }
  if (src) { const img = new Image(); img.className = 'vignette'; img.alt = ''; img.onload = () => { slot.replaceWith(img); vignette = null; }; img.src = src; }
  const vc = slot; const dpr = Math.min(window.devicePixelRatio || 1, 2); vc.width = 520 * dpr; vc.height = 230 * dpr;
  vignette = { el: vc, ctx: vc.getContext('2d'), dpr, scene, sib };
}
function drawVignette() {
  if (!vignette || !vignette.el.isConnected) { vignette = null; return; }
  const prev = g; g = vignette.ctx; g.setTransform(vignette.dpr, 0, 0, vignette.dpr, 0, 0); g.clearRect(0, 0, 520, 230); drawScene(vignette.scene, vignette.sib); g = prev;
}
