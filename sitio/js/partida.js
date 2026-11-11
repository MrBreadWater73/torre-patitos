'use strict';

/* ============================================================
   Partida
   ============================================================ */
function newRun(nick) {
  return { id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), v: 2, nick, startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    device: matchMedia('(pointer: coarse)').matches ? 'táctil' : 'teclado', input: { key: 0, pad: 0, tap: 0 }, combat: true, assist: false, levels: [], totalTime: 0, completed: 0, survey: null };
}
function resetLevelState() {
  clock = 0; cam = 0; flyover = null; shake = 0; flash = 0; nextFlash = 5;
  player = { row: 0, x: 2, jump: null, fall: null, drop: null, shield: 0, sq: 0, face: 1 };
  checkpoint = { row: 0, x: 2 }; drones = L.drones.map(d => Object.assign({}, d, { speed: Reglas.assisted(d.speed, assist, 'drone'), destroyed: false, stun: 0 })); assistTold = false;
  pots = (L.pots || []).map(p => ({ row: p.row, x: p.x, sunk: false, fromX: p.x, t: 1 })); plugs = new Set(); beltT = 0; windT = 0;
  phase = 'up'; gotPk = new Set(); levers = new Map(); trail = null; followers = []; chaseT = 0; chaseY = 99; dusk = 0; sibQuip = null; leverHit = null;
  crumbles.clear(); flags.clear(); featherGot = false; cooldown = 0; punch = null; pending = null; celebrate = null; particles = []; hover = null; lastHud = '';
}
// La torre final se arma con una semilla que sale de la partida: cada partida tiene la suya
const chaseCfg = () => L.down && L.down.chase && { delay: L.down.chase.delay, speed: Reglas.assisted(L.down.chase.speed, assist, 'chase') };
const seedOf = id => { let h = 2166136261; for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
function loadLevel(i) {
  L = LEVELS[i];
  if (L.generated && run.id) { Object.assign(L, Reglas.generate(seedOf(run.id), 30)); Object.assign(L.down, L.downText); }
  resetLevelState();
  ls = run.levels[i] || (run.levels[i] = { n: i + 1, time: 0, falls: 0, kills: 0, feather: false, done: false, restarts: 0, deaths: [] });
  if (assist) run.assist = true;
  if (run.id) store.set('torrePatitos.progress', { run });   // para continuar después
  canvas.setAttribute('aria-label', 'Capítulo ' + L.n + ': ' + L.name + '. Usa las flechas o WASD para saltar, o toca una plataforma cercana.');
  updateSide(); updateLegend(); updateHud(true);
  Store.save(run);
}
function startPlaying() {
  hideOverlay(); mode = 'playing'; lastStamp = 0; flyover = flyover && !reduced ? Object.assign(flyover, { fast: true }) : null;
  ui.pause.disabled = false; ui.restart.disabled = false; canvas.focus({ preventScroll: true }); announce('Capítulo ' + L.n + ' en marcha.'); updateHud(true);
}
function pause() {
  if (mode === 'paused') { resume(); return; }
  if (mode !== 'playing') return;
  mode = 'paused'; ui.pause.setAttribute('aria-label', 'Continuar'); ui.pause.title = 'Continuar (P)';
  showOverlay(`<p class="meta">Pausa</p><span class="ribbon">Receso</span><h2>Pipo se sienta a pensar en su vida</h2><p>Nada ha cambiado mientras tanto. Ese es el problema.</p>
    <div class="actions"><button class="btn" data-action="resume" data-primary>Continuar</button><button class="btn ghost" data-action="restart">Reiniciar capítulo</button></div>`, { center: true });
  announce('Partida en pausa.');
}
function resume() { if (mode !== 'paused') return; mode = 'playing'; lastStamp = 0; hideOverlay(); ui.pause.setAttribute('aria-label', 'Pausar'); ui.pause.title = 'Pausar (P)'; canvas.focus({ preventScroll: true }); }
function restartLevel() {
  if (!run || !ls || (mode !== 'playing' && mode !== 'paused')) return;
  ls.restarts++; const keepTime = ls.time; resetLevelState(); ls.time = keepTime;
  mode = 'playing'; hideOverlay(); ui.pause.setAttribute('aria-label', 'Pausar'); ui.pause.title = 'Pausar (P)'; canvas.focus({ preventScroll: true });
  announce('Capítulo reiniciado.'); showToast('De vuelta al principio. Pipo finge que no pasó nada.', 'drop'); updateHud(true);
}
function fail(cause) {
  if (mode !== 'playing' || player.fall) return;
  const origin = player.drop ? player.drop.from : Math.round(player.row), counted = phase === 'down' || origin > L.tutorial;
  player.fall = { elapsed: 0, duration: .7, x: player.x, row: player.row, lift: jumpLift(), cause, fromDrop: !!player.drop };
  player.jump = null; player.drop = null; pending = null;
  if (ls.deaths.length < 80) ls.deaths.push([+player.row.toFixed(2), +player.x.toFixed(2), cause].concat(phase === 'down' ? ['d'] : [])); // 'd' = murió en la bajada
  if (counted) ls.falls++;
  shake = cause === 'dron' ? 10 : 6;
  burst(player.x, player.row, cause === 'dron' ? '#e77966' : '#e8dcc0', 10);
  tone('fall');
  const hint = Reglas.suggestAssist(ls.falls, assist, assistTold); if (hint) assistTold = true;
  const quip = hint ? '¿Se puso difícil? Activa el modo asistido en el panel de controles.' : deathQuip(cause); showToast(quip, 'death');
  announce((counted ? 'Muerte por ' + CAUSES[cause].toLowerCase() + '. ' : 'En la zona inicial no cuenta. ') + quip);
  updateHud(true);
}
/* Caer al vacío ya no mata: Pipo baja hasta el piso de abajo. Solo muere si cae más de 3 pisos. */
const MAX_DROP = 3;
function startDrop(cause) {
  if (mode !== 'playing' || player.fall || player.drop) return;
  const from = Math.round(player.row);
  player.row = from; player.jump = null; player.sq = -.18;
  player.drop = { from, cause, vy: 1.5 };
  tone('whoosh');
}
function stepDrop(dt) {
  const d = player.drop, prev = player.row;
  d.vy = Math.min(d.vy + 26 * dt, 16);
  const next = prev - d.vy * dt;
  for (let k = Math.ceil(prev) - 1; k >= Math.ceil(next) && k >= 0; k--) {
    if (k >= d.from || d.from - k > MAX_DROP) continue;
    const sup = platformAt(k, player.x);
    if (sup) { const floors = d.from - k; player.drop = null; ls.drops = (ls.drops || 0) + 1; settle(k, sup, floors); return; }
  }
  player.row = next;
  if (d.from - next > MAX_DROP + .35 || next < -.4) fail(d.cause === 'hueco' ? 'hueco' : d.cause);
}
function settle(row, sup, floors, dir) {
  player.row = row; player.x = sup.x; player.jump = null; beltT = 0; windT = 0;
  player.sq = floors ? .32 + floors * .08 : .3; dust(player.x, row);
  if (floors) { shake = 2 + floors * 2; tone('thud'); if (floors >= 2) showToast(DROP_QUIPS[floors] || 'Auch.', 'drop'); announce('Caíste ' + floors + (floors === 1 ? ' piso.' : ' pisos.')); }
  else tone('land');
  if (sup.kind === 'crumble') { const k = row + ':' + sup.x, s = crumbles.get(k); if (!s || s.state === 'returning') { crumbles.set(k, { state: 'shaking', t: 0 }); tone('crack'); } }
  if (L.rows[row].checkpoint && Reglas.flagAdvances(phase, row, checkpoint.row)) { checkpoint = { row, x: sup.x }; flags.set(row, amb); burst(player.x, row, '#e0782c', 14); tone('checkpoint'); announce('Bandera alcanzada: tu avance está guardado.'); }
  if (L.feather && row === L.feather.row && Math.abs(player.x - L.feather.x) < .5 && !featherGot) { featherGot = true; burst(player.x, row, '#d9b23a', 24, { shape: 'circle' }); tone('feather'); showToast('Pluma dorada. No sirve para nada, pero es tuya.', 'drop'); announce('Pluma dorada conseguida.'); }
  const pi = Reglas.packageAt(L.packages, row, sup.x);
  if (pi >= 0 && !gotPk.has(pi)) {
    gotPk.add(pi); burst(player.x, row, '#d9a441', 18, { lift: 20 }); tone('feather');
    const left = L.packages.length - gotPk.size;
    if (!left) { levers.set('pk', true); shake = 4; showToast('Tienes los ' + L.packages.length + ' paquetes. La puerta de arriba se abrió.', 'drop'); announce('Tienes todos los paquetes. La puerta de arriba se abrió.'); }
    else { showToast('Paquete ' + gotPk.size + ' de ' + L.packages.length + '.', 'drop'); announce('Paquete ' + gotPk.size + ' de ' + L.packages.length + '.'); }
  }
  if (trail) moveFollower(row, sup.x);
  const goal = Reglas.goalAt(phase, row, player.x, nRows() - 1);
  if (goal === 'exit' || (goal === 'rescue' && !L.down)) { levelClear(); return; }
  if (goal === 'rescue') rescue();
  else if (phase === 'up' && row === nRows() - 1) announce('Camina hasta ' + L.sibling + '.');
  updateHud(true);
  // Hielo: si venía de lado, Pipo sigue resbalando hasta topar con algo
  if (sup.kind === 'ice' && dir && !floors) {
    const nx = Math.round(sup.x) + dir;
    if (nx >= 0 && nx <= 4 && lookAt(row)(nx) !== 'blocked') { pending = null; beginHop(nx, row, 'slide'); return; }
  }
  if (pending && amb - pending.t < .32) { const p = pending; pending = null; move(p.dir, true); } else pending = null;
}
/* Ida y vuelta: al tocar al hermano empieza la bajada por la misma torre, que ya cambió */
function rescue() {
  const top = nRows() - 1;
  phase = 'down'; checkpoint = { row: top, x: 2 }; flags.clear(); pending = null;
  const kinds = L.family || [L.sib];   // en el final, toda la familia en fila
  trail = Reglas.newTrail(top, 2, kinds.length); followers = kinds.map(kind => ({ kind, fromRow: top, fromX: 2, row: top, x: 2, t: 1 }));
  chaseT = 0; chaseY = Reglas.chaseLine(top, 0, chaseCfg() || { delay: 0, speed: 0 });
  drones = (L.down.drones || L.drones).map(d => Object.assign({}, d, { speed: Reglas.assisted(d.speed, assist, 'drone'), destroyed: false, stun: 0 }));
  ls.upTime = +ls.time.toFixed(2); player.shield = 1.6; shake = 6;
  sibQuip = L.down.hello ? { text: L.down.hello, until: amb + 3 } : null; nextQuip = amb + 8;
  for (const [r, x] of L.down.gone || []) burst(x, r, '#8d897e', 12, { lift: 0 });
  const c = topCenter(2, top); hearts(c.x, c.y - 30); tone('win');
  showToast(L.down.chase ? 'La central se apaga desde arriba. ¡Baja!' : L.sibling + ' va contigo. Ahora toca bajar.', L.down.chase ? 'death' : 'drop');
  announce('Rescataste a ' + L.sibling + '. Ahora baja con ' + L.sibling + ' hasta la planta baja.');
  updateSide(); updateLegend();
}
function moveFollower(row, x) {
  Reglas.pushTrail(trail, row, x);
  followers.forEach((f, i) => {
    const now = Reglas.followerSpot(trail, i);
    if (now.row !== f.row || Math.abs(now.x - f.x) > .05) Object.assign(f, { fromRow: f.row, fromX: f.x, row: now.row, x: now.x, t: -i * .12 });   // cada uno sale un instante después
  });
}
function pushPlayer(row, dir, why) {
  const nx = Math.round(player.x) + dir;
  if (nx < 0 || nx > 4 || Reglas.potAt(pots, row, nx)) return;
  pending = null; beginHop(nx, row, why);
}
function land() {
  const row = Math.round(player.row), sup = platformAt(row, player.x), j = player.jump || {};
  player.row = row;
  if (!sup) { startDrop(j.why === 'wind' ? 'viento' : causeFor(kindAt(row, player.x))); return; }
  settle(row, sup, 0, j.dir || 0);
}
function beginHop(tx, tr, why) {   // why: 'slide' (hielo), 'belt' (banda) o 'wind' (viento) cuando no lo decidió el jugador
  if (mode !== 'playing' || player.jump || player.fall || player.drop) return false;
  if (tr < 0 || tr >= nRows()) return false;
  if (tx < -.1 || tx > 4.1) { player.sq = .12; return false; } // fuera de la torre no hay nada que pisar
  const dx = Math.abs(tx - player.x), dr = Math.abs(tr - player.row);
  if (dr > 1.01 || (dr > .1 && dx > .76) || (dr < .1 && (dx > 1.18 || dx < .08))) return false;
  const side = dr < .1 ? Math.sign(tx - player.x) || 1 : 0;
  if (Reglas.potAt(pots, tr, tx)) {            // hay una maceta: de lado se empuja, de frente estorba
    const res = side ? Reglas.pushPot(pots, tr, Math.round(tx), side, lookAt(tr)) : { moved: false };
    if (!res.moved) { player.sq = .12; if (!why) tone('thud'); return false; }
    res.pot.fromX = res.from; res.pot.t = 0; tone('thud'); dust(res.pot.x, tr);
    if (res.sunk) { plugs.add(tr + ':' + res.pot.x); shake = 3; announce('La maceta tapó el hueco.'); }
  }
  player.jump = { fromX: player.x, fromRow: player.row, toX: tx, toRow: tr, elapsed: 0, duration: why === 'slide' ? .2 : why ? .3 : JUMP, dir: side, why, flat: !!why };
  if (!why) { if (tx < player.x - .05) player.face = -1; else if (tx > player.x + .05) player.face = 1; }
  player.sq = why ? 0 : -.2; if (!why) tone('hop'); return true;
}
const DIRS = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] };
function move(dir, fromBuffer) {
  if (mode !== 'playing') return;
  // Bug #4: antes se ignoraban las teclas presionadas durante un salto. Ahora se guarda una en búfer.
  if (player.jump || player.fall || player.drop) { if (!fromBuffer) pending = { dir, t: amb }; return; }
  const d = DIRS[dir]; if (!d) return;
  beginHop(Math.round(player.x) + d[0], Math.round(player.row) + d[1]);
}
function attack() {
  if (mode !== 'playing' || !combat || cooldown > 0 || player.fall) return false;
  cooldown = .78;
  const near = drones.filter(d => !d.destroyed && !(d.stun > 0) && Reglas.inPunchReach(player.row, player.x, droneX(d), d.row)).sort((a, b) => Math.abs(player.x - droneX(a)) - Math.abs(player.x - droneX(b)));
  const d = near[0], lv = d ? null : Reglas.leverInReach(L.levers, Math.round(player.row), player.x, Reglas.PUNCH_REACH);
  const dir = d ? Math.sign(droneX(d) - player.x) || 1 : lv ? Math.sign(lv.x - player.x) || 1 : player.face;
  punch = { age: 0, dir, far: !!(d || lv) }; tone('punch');
  if (d) { d.fx = droneX(d); d.stun = 5; ls.kills++; shake = 5; burst(d.fx, d.row, '#ffce4c', 16, { lift: 40 }); tone('destroy'); announce('Dron aturdido. Aguanta unos segundos como plataforma.'); }
  if (lv) {
    const on = Reglas.toggleLever(levers, lv.g); leverHit = { g: lv.g, t: amb }; shake = 3;
    burst(lv.x, lv.row, '#6fb1cf', 14, { lift: 30 }); tone('checkpoint');
    announce(on ? 'Palanca activada: el puente se encendió.' : 'Palanca desactivada: el puente se apagó.');
  }
  updateHud(true); return !!(d || lv);
}
function levelClear() {
  mode = 'celebrate'; celebrate = { t: 0 }; player.jump = null;
  ls.done = true; ls.feather = ls.feather || featherGot;
  run.completed = Math.max(run.completed, L.n); run.totalTime = run.levels.reduce((s, l) => s + (l ? l.time : 0), 0);
  Store.save(run); store.set('torrePatitos.progress', run.completed >= LEVELS.length ? null : { run });
  ui.pause.disabled = true; ui.restart.disabled = true;
  confetti(); tone('win');
  announce('¡Rescataste a ' + L.sibling + '!'); updateHud(true);
}

/* ============================================================
   Bucle principal
   ============================================================ */
function simulate(dt) {
  amb += dt; updateParticles(dt);
  shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt * .9);
  if (amb > blinkEye.next) { blinkEye.until = amb + .13; blinkEye.next = amb + 2 + Math.random() * 3.5; }
  if (amb > sibBlink.next) { sibBlink.until = amb + .13; sibBlink.next = amb + 2.5 + Math.random() * 3; }
  player.sq *= Math.exp(-dt * 9);
  dusk += ((phase === 'down' ? 1 : 0) - dusk) * (1 - Math.exp(-dt * 1.2));
  for (const f of followers) if (f.t < 1) f.t = Math.min(1, f.t + dt / .34);
  // Cámara
  const target = clamp(player.row * RISE - 300, 0, maxCam());
  if (flyover) {
    flyover.t += dt * (flyover.fast ? 3 : 1);
    const u = clamp(flyover.t / flyover.d, 0, 1); cam = lerp(flyover.from, target, smooth(u));
    if (u >= 1) flyover = null;
  } else cam += (target - cam) * (1 - Math.exp(-dt * 5));
  if (L.theme === 'storm' && !reduced && mode !== 'paused') { nextFlash -= dt; if (nextFlash <= 0) { flash = .16; nextFlash = 6 + Math.random() * 5; tone('thunder'); } }
  if (mode === 'celebrate') { celebrate.t += dt; if (celebrate.t > 2) { celebrate = null; showSummary(); } return; }
  if (mode !== 'playing') return;
  clock += dt; ls.time += dt;
  if (chaseOn()) { chaseT += dt; chaseY = Reglas.chaseLine(nRows() - 1, chaseT, chaseCfg()); if (!player.fall && Reglas.chaseDead(chaseY, player.row)) fail('apagon'); }
  if (phase === 'down' && L.quips && amb > nextQuip) { sibQuip = { text: L.quips[Math.floor(Math.random() * L.quips.length)], until: amb + 2.6 }; nextQuip = amb + 9 + Math.random() * 5; }
  cooldown = Math.max(0, cooldown - dt); player.shield = Math.max(0, player.shield - dt);
  if (punch) { punch.age += dt; if (punch.age > .25) punch = null; }
  for (const d of drones) if (d.stun > 0) { d.stun -= dt; if (d.stun <= 0) { d.destroyed = true; burst(d.fx, d.row, '#e97c62', 20, { lift: 30 }); tone('crack'); } }
  for (const p of pots) if (p.t < 1) p.t = Math.min(1, p.t + dt / .22);
  for (const [k, s] of crumbles) {
    s.t += dt;
    if (s.state === 'shaking' && s.t >= .8) { s.state = 'broken'; s.t = 0; const [r, x] = k.split(':').map(Number); burst(x, r, 'rgba(200,236,240,.95)', 10, { shape: 'shard', lift: 0 }); tone('crack'); }
    else if (s.state === 'broken' && s.t >= 2.8) { s.state = 'returning'; s.t = 0; }
    else if (s.state === 'returning' && s.t >= .35) crumbles.delete(k);
  }
  if (player.fall) {
    player.fall.elapsed += dt;
    if (player.fall.elapsed >= player.fall.duration) { player = { row: checkpoint.row, x: checkpoint.x, jump: null, fall: null, drop: null, shield: 1.1, sq: .25, face: 1 }; pending = null; burst(player.x, player.row, '#b9b4a8', 10);
      if (trail) { trail = Reglas.newTrail(checkpoint.row, checkpoint.x, followers.length); followers.forEach(f => Object.assign(f, { fromRow: checkpoint.row, fromX: checkpoint.x, row: checkpoint.row, x: checkpoint.x, t: 1 })); }
      // El apagón retrocede para dar ventaja: queda 4 pisos arriba de la bandera
      if (chaseOn()) { const c = chaseCfg(); chaseT = Math.max(0, c.delay + (nRows() + 1 - (checkpoint.row + 4)) / c.speed); chaseY = Reglas.chaseLine(nRows() - 1, chaseT, c); } }
    updateHud(); return;
  }
  if (player.jump) {
    const j = player.jump; j.elapsed += dt;
    const u = clamp(j.elapsed / j.duration, 0, 1), e = smooth(u);
    player.x = lerp(j.fromX, j.toX, e); player.row = lerp(j.fromRow, j.toRow, e);
    if (u >= 1) land();
  } else if (player.drop) {
    stepDrop(dt);
  } else {
    const row = Math.round(player.row), r = L.rows[row];
    if (r.moving) player.x = movingX(row);
    else {
      const sup = platformAt(row, player.x);
      if (!sup) startDrop(causeFor(kindAt(row, player.x)));
      else {
        // Banda transportadora: arrastra una casilla cada poco más de medio segundo
        if (sup.kind === 'belt') { beltT += dt; if (beltT >= .55) { beltT = 0; pushPlayer(row, beltNow(r), 'belt'); } } else beltT = 0;
        // Ráfaga: mientras sopla, empuja una casilla cada rato; la pared y las macetas frenan
        if (r.wind && Reglas.gust(r.wind, clock).blowing) { windT += dt; if (windT >= .4) { windT = 0; pushPlayer(row, windNow(r).dir, 'wind'); } } else windT = 0;
      }
    }
  }
  if (mode === 'playing' && !player.fall && player.shield <= 0) {
    const p = topCenter(player.x, player.row, jumpLift());
    for (const d of drones) {
      if (d.destroyed || d.stun > 0 || Math.abs(player.row - d.row) > .52) continue;
      const q = topCenter(droneX(d), d.row, 0), dx = (p.x - q.x) / 35, dy = (p.y - 23 - q.y + 34) / 32;
      if (dx * dx + dy * dy < 1) { fail('dron'); break; }
    }
  }
  updateHud();
}
function frame(stamp) {
  const dt = lastStamp ? Math.min((stamp - lastStamp) / 1000, .04) : 0; lastStamp = stamp;
  if (!QA) simulate(dt);
  if (view === 'play') { render(); if (vignette) drawVignette(); }
  requestAnimationFrame(frame);
}
function resize() {
  const r = canvas.getBoundingClientRect(); if (!r.width) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0); render();
}
