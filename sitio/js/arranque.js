'use strict';

/* ============================================================
   Ganchos de prueba (solo con ?qa en la URL)
   ============================================================ */
if (QA) window.towerQA = {
  state: () => ({ mode, level: L.n, phase, rise: +riseY.toFixed(2), rows: L.rows.length, segments: L.segments || 0, floors: ls && ls.best, levers: [...levers.entries()], packages: [...gotPk], pots: pots.map(p => [p.row, p.x, p.sunk]), drones: drones.map(d => ({ row: d.row, x: +(d.stun > 0 ? d.fx : droneX(d)).toFixed(2), stun: +(d.stun || 0).toFixed(2), destroyed: d.destroyed })), followers: followers.map(f => [f.kind, f.row, f.x]), chaseY, clock, cam, player: Object.assign({}, player), checkpoint, featherGot, ls: ls && JSON.parse(JSON.stringify(ls)), run: run && JSON.parse(JSON.stringify(run)), crumbles: [...crumbles.entries()], hitAreas: hitAreas.length }),
  music: () => music.key,
  musicSetSound: on => { sound = on; },
  async musicCheck(seconds) {   // toca cada pieza sin conexión y devuelve su volumen
    const out = [], names = ['menu', 'morning', 'greenhouse', 'storm', 'warehouse', 'cold', 'server'];
    const scs = [Musica.scene({ mode: 'menu' })];
    names.slice(1).forEach((theme, i) => ['up', 'down'].forEach(phase => scs.push(Musica.scene({ mode: 'playing', theme, level: i + 1, phase }))));
    scs.push(Musica.scene({ mode: 'playing', theme: 'storm', level: 7, phase: 'up' }), Musica.scene({ mode: 'playing', theme: 'storm', level: 7, phase: 'down', chase: true }));
    for (let tier = 0; tier <= 5; tier++) scs.push(Musica.scene({ mode: 'playing', endless: true, level: 8, tier }));
    for (const sc of scs) out.push(await musicRender(sc, seconds || 8));
    return out;
  },
  advance(dt) { for (let t = 0; t < dt; t += 1 / 120) simulate(Math.min(1 / 120, dt - t)); render(); if (vignette) drawVignette(); },
  act: name => actions[name](), move, attack, hop: beginHop, startLevel: i => { if (!run || !run.id) run = newRun('QA'); showLevelIntro(i); startPlaying(); },
  movingX, droneX, blinkState, platformAt, setView, render, Store, compute: v => Metricas.compute(Store.all().filter(r => Metricas.versionOf(r) === (v || 2)), v === 1 ? LEVELS_V1.length : LEVELS.length), place(row, x) { player.row = row; player.x = x; player.jump = null; player.fall = null; player.drop = null; },
  custom(lvl) { LEVELS[0] = Object.assign({ n: 1, name: 'Ensayo', theme: 'morning', sibling: 'Tina', sib: 'phone', tutorial: 0, bubble: '…', objective: '', tip: '', zones: [[99, 'Ensayo']], drones: [] }, lvl); this.startLevel(0); }, // nivel de ensayo
  // Foto del estado de la partida y vuelta atrás: permite probar un salto y deshacerlo si sale mal
  snap() { return JSON.stringify({ clock, amb, cam, player, checkpoint, drones, crumbles: [...crumbles], flags: [...flags], featherGot, cooldown, pending, phase, levers: [...levers], gotPk: [...gotPk], pots, plugs: [...plugs], beltT, windT, trail, followers, chaseT, chaseY, ls, mode, dusk, nextQuip, endless: L.endless ? { riseT, riseY, segments: L.segments, rowsLen: L.rows.length, droneLen: L.drones.length } : null }); },
  load(json) {
    const o = JSON.parse(json);
    clock = o.clock; amb = o.amb; cam = o.cam; player = o.player; checkpoint = o.checkpoint; drones = o.drones; crumbles = new Map(o.crumbles); flags = new Map(o.flags);
    featherGot = o.featherGot; cooldown = o.cooldown; pending = o.pending; phase = o.phase; levers = new Map(o.levers); gotPk = new Set(o.gotPk); pots = o.pots; plugs = new Set(o.plugs);
    beltT = o.beltT; windT = o.windT; trail = o.trail; followers = o.followers; chaseT = o.chaseT; chaseY = o.chaseY; mode = o.mode; dusk = o.dusk; nextQuip = o.nextQuip; punch = null; celebrate = null; particles = [];
    Object.keys(ls).forEach(k => delete ls[k]); Object.assign(ls, o.ls);
    if (o.endless) { riseT = o.endless.riseT; riseY = o.endless.riseY; L.segments = o.endless.segments; L.rows.length = o.endless.rowsLen; L.drones.length = o.endless.droneLen; }   // deshacer también lo que la torre creció
  },
  // Jugador automático: sigue la ruta de `Reglas.solve` y, para cada salto, espera el momento en que sale bien
  // y Pipo sigue vivo un instante después. Si se queda sin opciones, deshace el salto anterior y lo intenta más tarde.
  // Demuestra que el nivel se puede terminar con el reloj corriendo: drones, placas, bandas, viento y hielo incluidos.
  bot(maxSteps = 700, maxBack = 300) {
    const G = Reglas.graph(L), policy = Reglas.solve(L), out = { steps: 0, backtracks: 0, problems: [] };
    const busy = () => player.jump || player.drop || player.fall;
    const quiet = max => { for (let t = 0; busy() && t < max; t += .02) this.sim(.02); };
    const cur = () => ({ ph: phase, row: Math.round(player.row), x: Math.round(player.x), lv: G.groups.reduce((m, g, i) => m | (levers.get(g) ? 1 << i : 0), 0), got: [...gotPk].reduce((m, i) => m | 1 << i, 0), pots: pots.map(p => p.sunk ? p.x + 10 : p.x) });
    const here = () => policy.get(G.key(cur()));
    const droneNear = () => drones.some(d => !d.destroyed && !(d.stun > 0) && Reglas.inPunchReach(player.row, player.x, droneX(d), d.row));
    const attempt = (goal, punchFirst) => {   // hace la jugada que toca; vale si acerca a la meta y Pipo sobrevive 0.6 s más
      const now = here(); if (!now || !now.edge || busy()) return false;
      const deaths = ls.deaths.length, act = now.edge.act;
      if (punchFirst) { if (act.bridge || act.t === 'punch' || cooldown > 0 || !droneNear()) return false; attack(); this.sim(.1); }   // como haría una persona: aturdir al dron que estorba
      if (act.t === 'punch') attack(); else { if (act.bridge) { attack(); this.sim(.12); } move(act.t); }
      this.sim(.06); quiet(4); if (act.t === 'punch') this.sim(.25);
      if (ls.deaths.length !== deaths) return false;
      if (mode !== 'playing') return true;                                   // llegó a la meta
      const after = here(); if (!after || after.dist >= goal) return false;
      const safe = this.snap(); this.sim(.6); const alive = ls.deaths.length === deaths; this.load(safe); return alive;
    };
    const stack = []; let origin = this.snap(), wait0 = 0;
    while (mode === 'playing' && out.steps < maxSteps) {
      this.load(origin); quiet(4);
      const from = here(); if (from && from.dist === 0) { out.atGoal = true; break; }   // llegó a la parte más alta que existe
      if (!from) { out.problems.push('sin ruta desde piso ' + Math.round(player.row) + ' columna ' + Math.round(player.x) + ' (' + phase + ')'); break; }
      const where = 'piso ' + Math.round(player.row) + ' columna ' + Math.round(player.x) + ' (' + phase + '), ' + from.edge.act.t + (from.edge.act.bridge ? ' con dron' : '');
      this.sim(wait0); let ok = false, wait = wait0;
      for (; wait <= wait0 + 9; wait += .05) { const b = this.snap(); if (attempt(from.dist, false)) { ok = true; break; } this.load(b); if (attempt(from.dist, true)) { ok = true; break; } this.load(b); this.sim(.05); }
      if (ok) { stack.push({ origin, wait }); out.steps++; origin = this.snap(); wait0 = 0; continue; }
      const prev = stack.pop();
      if (!prev || ++out.backtracks > maxBack) { out.problems.push('no encontró el momento en ' + where); this.load(origin); break; }
      origin = prev.origin; wait0 = prev.wait + .05; out.steps--;
    }
    render();
    return Object.assign(out, { finished: mode === 'celebrate', phase, floor: Math.round(player.row), time: +ls.time.toFixed(1), upTime: ls.upTime, deaths: ls.deaths.length });
  },
  // Modo infinito
  endless() { startEndless(true); },
  unlockEndless() { store.set('torrePatitos.endless', true); },
  // Juega con el bot cada tramo del modo infinito como un nivel suelto, empezando en varias fases del reloj
  // (en la partida cada quien llega en un momento distinto); devuelve las semillas que termina en todas
  verifySegments(tier, seeds, phases = Array.from({ length: 60 }, (_, i) => i * .75)) {   // 60 momentos del reloj, de 0 a 44 s: los patrones se combinan con periodos largos
    const keep = LEVELS[0], good = [], bad = [], hard = {};
    for (const seed of seeds) {
      let ok = true, worst = 0, why = '';
      for (const c of phases) {
        run = null; this.custom(Object.assign({}, Reglas.endlessSegment(seed, tier))); clock = c;   // run = null: que el tiempo no se acumule entre pruebas
        const r = this.bot(); worst = Math.max(worst, r.backtracks);
        if (!r.finished) { ok = false; why = 'fase ' + c + ': ' + r.problems.join('; '); break; }
      }
      hard[seed] = worst;
      if (ok) good.push(seed); else bad.push([seed, why]);
    }
    LEVELS[0] = keep; return { tier, good, bad, hard };
  },
  // Modo infinito: sube con el bot hasta el piso `floors` (la torre crece por delante) o hasta que algo lo impida
  climb(floors, maxBack = 4000) {
    let last = -1, stalls = 0;
    while (mode === 'playing' && ls.best < floors && stalls < 3) { const r = this.bot(700, maxBack); if (r.problems.length) return { ok: false, floor: ls.best, problems: r.problems }; stalls = ls.best === last ? stalls + 1 : 0; last = ls.best; }
    return { ok: ls.best >= floors, floor: ls.best, time: +ls.time.toFixed(1), rise: +riseY.toFixed(1), mode, rows: L.rows.length };
  },
  // Pega los primeros `n` tramos de una partida en un solo nivel y lo recorre con el bot: prueba las uniones y mide la velocidad
  measureRun(runSeed, n, maxBack = 300) {
    const keep = LEVELS[0], rows = [{ cells: [0, 1, 2, 3, 4] }], dr = [];
    for (let i = 0; i < n; i++) { const s = Reglas.endlessSegmentAt(runSeed, i); rows.push(...s.rows); dr.push(...s.drones); }
    run = null; this.custom({ rows, drones: dr, bridges: false });
    const r = this.bot(2000, maxBack); LEVELS[0] = keep;
    return { floors: rows.length - 1, finished: r.finished, time: r.time, floorsPerSecond: +((rows.length - 1) / r.time).toFixed(3), deaths: r.deaths, problems: r.problems };
  },
  // Vuelve a jugar con el bot todas las torres finales de Reglas.TOWER_SEEDS; devuelve las que ya no termina
  verifyTowers(seeds = Reglas.TOWER_SEEDS) {
    const base = Object.assign({}, LEVELS[LEVELS.length - 1]), bad = [];
    for (const seed of seeds) { this.custom(Object.assign({}, base, Reglas.generate(seed, 30), { generated: false, n: 1 })); const r = this.bot(); if (!r.finished) bad.push([seed, r.problems.join('; ')]); }
    return { checked: seeds.length, bad };
  },
  sim(dt) { for (let t = 0; t < dt - 1e-9; t += 1 / 120) simulate(Math.min(1 / 120, dt - t)); },
  noDrones() { drones.forEach(d => { d.destroyed = true; }); }, // para probar el recorrido sin esperar a los drones
  setClock(t) { clock = t; }, keyFrom: p => hitAt(p), project: topCenter
};

/* ============================================================
   Arranque
   ============================================================ */
updateSoundUI();
preloadArt();
new ResizeObserver(resize).observe(canvas);
if (location.hash === '#estadisticas') setView('stats', true);
showTitle(); resize(); Store.init();
requestAnimationFrame(frame);
