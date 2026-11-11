'use strict';

/* ============================================================
   Ganchos de prueba (solo con ?qa en la URL)
   ============================================================ */
if (QA) window.towerQA = {
  state: () => ({ mode, level: L.n, phase, levers: [...levers.entries()], packages: [...gotPk], pots: pots.map(p => [p.row, p.x, p.sunk]), drones: drones.map(d => ({ row: d.row, x: +(d.stun > 0 ? d.fx : droneX(d)).toFixed(2), stun: +(d.stun || 0).toFixed(2), destroyed: d.destroyed })), followers: followers.map(f => [f.kind, f.row, f.x]), chaseY, clock, cam, player: Object.assign({}, player), checkpoint, featherGot, ls: ls && JSON.parse(JSON.stringify(ls)), run: run && JSON.parse(JSON.stringify(run)), crumbles: [...crumbles.entries()], hitAreas: hitAreas.length }),
  advance(dt) { for (let t = 0; t < dt; t += 1 / 120) simulate(Math.min(1 / 120, dt - t)); render(); if (vignette) drawVignette(); },
  act: name => actions[name](), move, attack, hop: beginHop, startLevel: i => { if (!run || !run.id) run = newRun('QA'); showLevelIntro(i); startPlaying(); },
  movingX, droneX, blinkState, platformAt, setView, render, Store, compute: () => compute(Store.all()), place(row, x) { player.row = row; player.x = x; player.jump = null; player.fall = null; player.drop = null; },
  custom(lvl) { LEVELS[0] = Object.assign({ n: 1, name: 'Ensayo', theme: 'morning', sibling: 'Tina', sib: 'phone', tutorial: 0, bubble: '…', objective: '', tip: '', zones: [[99, 'Ensayo']], drones: [] }, lvl); this.startLevel(0); }, // nivel de ensayo
  // Foto del estado de la partida y vuelta atrás: permite probar un salto y deshacerlo si sale mal
  snap() { return JSON.stringify({ clock, amb, cam, player, checkpoint, drones, crumbles: [...crumbles], flags: [...flags], featherGot, cooldown, pending, phase, levers: [...levers], gotPk: [...gotPk], pots, plugs: [...plugs], beltT, windT, trail, followers, chaseT, chaseY, ls, mode, dusk, nextQuip }); },
  load(json) {
    const o = JSON.parse(json);
    clock = o.clock; amb = o.amb; cam = o.cam; player = o.player; checkpoint = o.checkpoint; drones = o.drones; crumbles = new Map(o.crumbles); flags = new Map(o.flags);
    featherGot = o.featherGot; cooldown = o.cooldown; pending = o.pending; phase = o.phase; levers = new Map(o.levers); gotPk = new Set(o.gotPk); pots = o.pots; plugs = new Set(o.plugs);
    beltT = o.beltT; windT = o.windT; trail = o.trail; followers = o.followers; chaseT = o.chaseT; chaseY = o.chaseY; mode = o.mode; dusk = o.dusk; nextQuip = o.nextQuip; punch = null; celebrate = null; particles = [];
    Object.keys(ls).forEach(k => delete ls[k]); Object.assign(ls, o.ls);
  },
  // Jugador automático: sigue la ruta de `Reglas.solve` y, para cada salto, espera el momento en que sale bien
  // y Pipo sigue vivo un instante después. Si se queda sin opciones, deshace el salto anterior y lo intenta más tarde.
  // Demuestra que el nivel se puede terminar con el reloj corriendo: drones, placas, bandas, viento y hielo incluidos.
  bot(maxSteps = 700) {
    const G = Reglas.graph(L), policy = Reglas.solve(L), out = { steps: 0, backtracks: 0, problems: [] };
    const busy = () => player.jump || player.drop || player.fall;
    const quiet = max => { for (let t = 0; busy() && t < max; t += .02) this.sim(.02); };
    const cur = () => ({ ph: phase, row: Math.round(player.row), x: Math.round(player.x), lv: G.groups.reduce((m, g, i) => m | (levers.get(g) ? 1 << i : 0), 0), got: [...gotPk].reduce((m, i) => m | 1 << i, 0), pots: pots.map(p => p.sunk ? p.x + 10 : p.x) });
    const here = () => policy.get(G.key(cur()));
    const attempt = goal => {            // hace la jugada que toca; vale si acerca a la meta y Pipo sobrevive 0.6 s más
      const now = here(); if (!now || !now.edge || busy()) return false;
      const deaths = ls.deaths.length, act = now.edge.act;
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
      const from = here(); if (!from) { out.problems.push('sin ruta desde piso ' + Math.round(player.row) + ' columna ' + Math.round(player.x) + ' (' + phase + ')'); break; }
      const where = 'piso ' + Math.round(player.row) + ' columna ' + Math.round(player.x) + ' (' + phase + '), ' + from.edge.act.t + (from.edge.act.bridge ? ' con dron' : '');
      this.sim(wait0); let ok = false, wait = wait0;
      for (; wait <= wait0 + 9; wait += .05) { const b = this.snap(); if (attempt(from.dist)) { ok = true; break; } this.load(b); this.sim(.05); }
      if (ok) { stack.push({ origin, wait }); out.steps++; origin = this.snap(); wait0 = 0; continue; }
      const prev = stack.pop();
      if (!prev || ++out.backtracks > 300) { out.problems.push('no encontró el momento en ' + where); this.load(origin); break; }
      origin = prev.origin; wait0 = prev.wait + .05; out.steps--;
    }
    render();
    return Object.assign(out, { finished: mode === 'celebrate', phase, floor: Math.round(player.row), time: +ls.time.toFixed(1), upTime: ls.upTime, deaths: ls.deaths.length });
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
