'use strict';

/* ============================================================
   Reglas puras (sin canvas ni DOM): se prueban con `node --test tests/`
   ============================================================ */
const Reglas = {
  PUNCH_REACH: 1.3,   // alcance del golpe en casillas, sobre el mismo piso

  /* Palancas: cada una controla un grupo de puentes */
  gateOn: (levers, group) => levers.get(group) === true,
  toggleLever(levers, group) { const on = !levers.get(group); levers.set(group, on); return on; },
  leverInReach(list, row, x, reach) {
    let best = null;
    for (const lv of list || []) {
      const d = Math.abs(lv.x - x);
      if (lv.row === row && d <= reach && (!best || d < Math.abs(best.x - x))) best = lv;
    }
    return best;
  },
  inPunchReach: (row, x, targetX, targetRow) => Math.abs(row - targetRow) <= .57 && Math.abs(x - targetX) <= Reglas.PUNCH_REACH,

  /* Ida y vuelta: 'up' hasta el hermano, 'down' de regreso a la planta baja */
  goalAt(phase, row, x, top) {
    if (phase === 'up') return row === top && Math.abs(x - 2) < .5 ? 'rescue' : null;
    return row === 0 ? 'exit' : null;
  },
  flagAdvances: (phase, row, savedRow) => phase === 'up' ? row > savedRow : row < savedRow,
  cellGone: (gone, phase, row, x) => phase === 'down' && (gone || []).some(c => c[0] === row && Math.abs(c[1] - x) < .1),

  /* El hermano rescatado va un aterrizaje detrás de Pipo */
  newTrail: (row, x, n = 1) => Array.from({ length: n + 1 }, () => ({ row, x })),   // n = cuántos lo siguen
  pushTrail(trail, row, x) {
    const last = trail[trail.length - 1];
    if (last.row === row && Math.abs(last.x - x) < .1) return;
    trail.push({ row, x }); trail.shift();
  },
  followerSpot(trail, i = 0) { const p = trail[trail.length - 2 - i]; return { row: p.row, x: p.x }; },

  /* Final: la central se apaga desde arriba. La línea espera `delay` segundos y luego baja `speed` pisos por segundo */
  chaseLine: (top, t, chase) => top + 2 - Math.max(0, t - chase.delay) * chase.speed,
  chaseDead: (line, row) => row > line + .5,

  /* Macetas: se empujan una casilla; en un hueco lo tapan y dejan de estorbar */
  potAt: (pots, row, x) => (pots || []).find(p => !p.sunk && p.row === row && Math.abs(p.x - x) < .5) || null,
  pushPot(pots, row, x, dir, look) {   // look(x) → 'floor' | 'hole' | 'blocked'
    const pot = Reglas.potAt(pots, row, x); if (!pot) return null;
    const nx = Math.round(x) + dir;
    if (nx < 0 || nx > 4 || Reglas.potAt(pots, row, nx)) return { moved: false };
    const what = look(nx); if (what !== 'floor' && what !== 'hole') return { moved: false };
    const from = pot.x; pot.x = nx; pot.sunk = what === 'hole';
    return { moved: true, sunk: pot.sunk, from, pot };
  },
  /* Hielo: Pipo sigue de largo hasta topar con piso, un hueco, una maceta o la pared */
  slide(x, dir, look) {                // look(x) → 'ice' | 'floor' | 'hole' | 'blocked'
    for (let cur = x; ;) {
      const nx = cur + dir; if (nx < 0 || nx > 4) return { x: cur, fall: false };
      const what = look(nx);
      if (what === 'blocked') return { x: cur, fall: false };
      if (what !== 'ice') return { x: nx, fall: what === 'hole' };
      cur = nx;
    }
  },
  /* Viento: sopla `on` segundos de cada `period`, y avisa 0.9 s antes */
  gust(w, t) { const ph = ((t + (w.o || 0)) % w.period + w.period) % w.period, blowing = ph < w.on; return { blowing, warn: !blowing && w.period - ph < .9 }; },
  /* Bandas: en la bajada pueden girar al revés */
  beltDir: (belt, phase, flip) => belt.dir * (phase === 'down' && flip ? -1 : 1),
  /* Dron aturdido por el golpe: sirve de plataforma donde quedó congelado */
  droneHolds: (d, row, x) => d.stun > 0 && d.row === row && Math.abs(d.fx - x) <= .6,

  /* Paquetes: al juntarlos todos se enciende el grupo 'pk' (la puerta) */
  packageAt(list, row, x) { return (list || []).findIndex(p => p.row === row && Math.abs(p.x - x) < .5); },

  /* ----------------------------------------------------------
     Auditoría de un nivel: ¿se puede completar? No simula el tiempo: da por hecho que
     un dron, una placa o una plataforma móvil se pasan esperando el momento. Revisa la
     forma del nivel: saltos, caídas de hasta 3 pisos, palancas, paquetes y la bajada.
     Devuelve una lista de problemas (vacía si todo está bien).
     ---------------------------------------------------------- */
  MAX_DROP: 3,
  /* El nivel como un mapa de estados: dónde está Pipo, qué palancas movió, qué paquetes lleva
     y dónde quedaron las macetas. `next` da los movimientos posibles desde un estado. */
  graph(level) {
    const rows = level.rows, top = rows.length - 1;
    const groups = [...new Set((level.levers || []).map(l => l.g))], pk = level.packages || [];
    const allPk = (1 << pk.length) - 1;
    const movingCols = m => [0, 1, 2, 3, 4].filter(k => Math.abs(k - m.c) <= m.a + .25);   // columnas que la plataforma cubre con margen, no las que apenas roza
    const gateOpen = (g, lv, got) => g === 'pk' ? got === allPk : !!(lv & (1 << groups.indexOf(g)));
    // Estado de las macetas: columna de cada una, o columna + 10 si ya tapó un hueco
    const pots0 = (level.pots || []).map(p => p.x), potRow = (level.pots || []).map(p => p.row);
    const potIn = (pots, row, x) => pots.findIndex((px, i) => potRow[i] === row && px === x);
    const dronesOf = ph => (ph === 'down' && level.down && level.down.drones) || level.drones || [];
    const floorKind = (ph, row, x) => {           // lo que hay dibujado en el nivel, sin estado
      const r = rows[row]; if (!r) return null;
      if (r.moving) return movingCols(r.moving).includes(x) ? 'moving' : null;
      if ((r.cells || []).includes(x) && !Reglas.cellGone(level.down && level.down.gone, ph, row, x)) return 'floor';
      if ((r.ice || []).includes(x)) return 'ice';
      if (r.belt && r.belt.cells.includes(x)) return 'floor';
      if ((r.crumble || []).includes(x) || (r.blink || []).some(b => b.x === x)) return 'floor';
      return (r.gate || []).some(q => q.x === x) ? 'gate' : null;
    };
    const firm = (ph, row, x, s) => {             // piso de verdad (no un dron)
      const k = floorKind(ph, row, x);
      if (k === 'gate') return gateOpen(rows[row].gate.find(q => q.x === x).g, s.lv, s.got);
      return !!k || potIn(s.pots, row, x + 10) >= 0;                                      // maceta tapando el hueco
    };
    // Dron aturdido como puente: solo sirve de lado, porque el golpe no alcanza otro piso
    const bridge = (ph, row, x) => level.bridges !== false && dronesOf(ph).some(d => d.row === row && Math.abs(x - d.center) <= d.span);
    // Dónde termina Pipo si salta a (row, x): ahí mismo, o tras caer hasta 3 pisos, o null si muere
    const landing = (ph, row, x, s, viaDrone) => {
      if (x < 0 || x > 4 || row < 0 || row > top) return null;
      if (firm(ph, row, x, s) || (viaDrone && bridge(ph, row, x))) return row;
      for (let k = row - 1; k >= 0 && row - k <= Reglas.MAX_DROP; k--) if (firm(ph, k, x, s)) return k;
      return null;
    };
    const key = s => s.ph + ':' + s.row + ':' + s.x + ':' + s.lv + ':' + s.got + ':' + s.pots.join(',');
    const arrive = (s, row, x) => {
      let ph = s.ph, got = s.got;
      if (ph === 'up') { const i = Reglas.packageAt(pk, row, x); if (i >= 0) got |= 1 << i; }
      if (ph === 'up' && level.down && row === top && x === 2) ph = 'down';   // tocó al hermano: empieza la bajada
      return { ph, row, x, lv: s.lv, got, pots: s.pots };
    };
    const next = s => {
      const out = [], onMoving = !!rows[s.row].moving;
      const hop = (t, from, row, x, st, viaDrone) => {     // salto a (row, x) con el estado st; puede acabar más abajo
        const k = landing(st.ph, row, x, st, viaDrone); if (k == null) return null;
        return { act: { t, col: from, bridge: k === row && !firm(st.ph, row, x, st) }, s: arrive(st, k, x) };
      };
      const vertical = (t, row, x) => { if (potIn(s.pots, row, x) >= 0) return; const e = hop(t, x, row, x, s); if (e) out.push(e); };
      const lateral = (x, dir) => {
        let nx = x + dir, st = s; if (nx < 0 || nx > 4) return;
        const pi = potIn(s.pots, s.row, nx);
        if (pi >= 0) {                              // empujar la maceta
          const to = nx + dir; if (to < 0 || to > 4 || potIn(s.pots, s.row, to) >= 0) return;
          const pots = s.pots.slice();
          if (floorKind(s.ph, s.row, to) === null && !firm(s.ph, s.row, to, s)) pots[pi] = to + 10; else if (firm(s.ph, s.row, to, s)) pots[pi] = to; else return;
          st = Object.assign({}, s, { pots });
        }
        const e = hop(dir < 0 ? 'left' : 'right', x, s.row, nx, st, firm(s.ph, s.row, x, s)); if (!e) return;
        if (e.s.row === s.row && floorKind(st.ph, s.row, nx) === 'ice') {   // resbalar
          const end = Reglas.slide(nx, dir, c => potIn(st.pots, s.row, c) >= 0 ? 'blocked' : floorKind(st.ph, s.row, c) === 'ice' ? 'ice' : firm(st.ph, s.row, c, st) ? 'floor' : 'hole');
          const row = end.fall ? landing(st.ph, s.row, end.x, st) : s.row; if (row == null) return;
          e.s = arrive(st, row, end.x);
        }
        out.push(e);
      };
      for (const x of onMoving ? movingCols(rows[s.row].moving) : [s.x]) {   // sobre una plataforma móvil Pipo viaja con ella
        if (s.row < top && firm(s.ph, s.row + 1, x, s)) vertical('up', s.row + 1, x);
        if (s.row > 0) vertical('down', s.row - 1, x);
        if (!onMoving) { lateral(x, -1); lateral(x, 1); }
      }
      for (const l of level.levers || []) if (l.row === s.row && Math.abs(l.x - s.x) <= Reglas.PUNCH_REACH) out.push({ act: { t: 'punch', g: l.g, col: s.x }, s: Object.assign({}, s, { lv: s.lv ^ (1 << groups.indexOf(l.g)) }) });
      return out;
    };
    const done = s => level.down ? s.ph === 'down' && s.row === 0 : s.row === top && s.x === 2;
    return { top, groups, pk, flagRows: rows.map((r, i) => r.checkpoint ? i : -1).filter(i => i >= 0), start: arrive({ ph: 'up', lv: 0, got: 0, pots: pots0 }, 0, 2), next, done, key };
  },
  /* Ruta más corta desde un estado hasta la meta: lista de { act, s }, o null si no hay */
  plan(level, from) {
    const G = Reglas.graph(level), prev = new Map([[G.key(from), null]]), queue = [from];
    while (queue.length) {
      const s = queue.shift();
      if (G.done(s)) { const path = []; for (let k = G.key(s), p; (p = prev.get(k)); k = p.from) path.unshift(p.edge); return path; }
      for (const e of G.next(s)) { const k = G.key(e.s); if (!prev.has(k)) { prev.set(k, { from: G.key(s), edge: e }); queue.push(e.s); } }
    }
    return null;
  },
  /* Torre final: se arma sola con pisos de todas las mecánicas. La misma semilla da la misma torre;
     solo se acepta una torre que pase la auditoría, así que siempre se puede terminar. */
  rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
  draft(seed, floors) {
    const r = Reglas.rng(seed), int = n => Math.floor(r() * n), pick = a => a[int(a.length)], rows = [{ cells: [0, 1, 2, 3, 4] }];
    const some = n => { const c = [0, 1, 2, 3, 4]; while (c.length > n) c.splice(int(c.length), 1); return c; };
    const kinds = ['plain', 'plain', 'plain', 'glass', 'blink', 'moving', 'wind', 'belt', 'ice'];
    let last = '';
    for (let i = 1; i < floors - 1; i++) {
      if (i % 5 === 0) { rows.push({ cells: pick([[1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2], [2, 3, 4]]), checkpoint: true }); last = 'flag'; continue; }
      let k = pick(kinds); if (k === last && k !== 'plain') k = 'plain';
      if (k === 'plain') rows.push({ cells: some(3 + int(2)) });
      else if (k === 'glass') { const c = some(4), g = c.splice(int(c.length), 1 + int(2)); rows.push({ cells: c, crumble: g }); }
      else if (k === 'blink') { const x0 = int(3); rows.push({ blink: [0, 1, 2].map(j => ({ x: x0 + j, o: +(j * (.3 + r() * .5)).toFixed(2) })), period: +(2.3 + r() * .8).toFixed(2), on: +(1.35 + r() * .3).toFixed(2) }); }
      else if (k === 'moving') rows.push({ moving: { c: 2, a: +(1.1 + r() * .4).toFixed(2), s: +(.9 + r() * .4).toFixed(2), p: +(r() * 6).toFixed(2) } });
      else if (k === 'wind') rows.push({ cells: [0, 1, 2, 3, 4], wind: { dir: pick([-1, 1]), period: +(2.7 + r() * .8).toFixed(2), on: 1.1, o: +(r() * 2).toFixed(2) } });
      else if (k === 'belt') rows.push({ belt: { cells: pick([[0, 1, 2, 3, 4], [0, 1, 2, 3], [1, 2, 3, 4]]), dir: pick([-1, 1]) } });
      else rows.push(pick([{ cells: [0, 4], ice: [1, 2, 3] }, { ice: [0, 1, 2, 3, 4] }, { cells: [0], ice: [1, 2, 3, 4] }]));
      last = k;
    }
    rows.push({ gate: [{ x: 1, g: 'pk' }, { x: 2, g: 'pk' }, { x: 3, g: 'pk' }] }, { cells: [1, 2, 3] });
    const withCells = i => rows[i] && !rows[i].checkpoint && (rows[i].cells || []).length ? i : -1;
    const near = t => { for (let d = 0; d < floors; d++) for (const i of [t + d, t - d]) if (i > 2 && i < floors - 2 && withCells(i) >= 0) return i; return 1; };
    const packages = [.25, .5, .75].map(f => { const row = near(Math.round(floors * f)); return { row, x: pick(rows[row].cells) }; }).filter((p, i, a) => a.findIndex(q => q.row === p.row) === i);
    while (packages.length < 3) { const row = near(3 + int(floors - 6)); if (!packages.some(p => p.row === row)) packages.push({ row, x: pick(rows[row].cells) }); }
    // Drones solo sobre pisos firmes: nada de dron encima de placas que parpadean o vidrio que se rompe
    const patrol = () => rows.map((row, i) => i > 2 && i < floors - 1 && !row.checkpoint && !row.moving && !row.blink && !row.crumble && r() < .4 ? { row: i, speed: +(.9 + r() * .45).toFixed(2), phase: +(r() * 6).toFixed(2), span: +(1 + r() * 1.6).toFixed(2), center: 2 } : null).filter(Boolean).slice(0, 9);
    const gone = []; rows.forEach((row, i) => { if (i > 1 && i < floors - 1 && !row.checkpoint && (row.cells || []).length >= 3 && r() < .4) gone.push([i, pick(row.cells)]); });
    return { rows, packages, bridges: false, drones: patrol(), down: { chase: { speed: .42, delay: 3 }, gone, drones: patrol() } };   // bridges: false = la ruta no depende de aturdir drones
  },
  generate(seed, floors = 30) {
    for (let k = 0; k < 300; k++) { const lvl = Reglas.draft(seed + k * 7919, floors); if (!Reglas.audit(lvl).length) return lvl; }
    const rows = Array.from({ length: floors + 1 }, (_, i) => i === floors - 1 ? { gate: [{ x: 1, g: 'pk' }, { x: 2, g: 'pk' }, { x: 3, g: 'pk' }] } : { cells: [0, 1, 2, 3, 4], checkpoint: i > 0 && i % 5 === 0 });
    return { rows, packages: [{ row: 3, x: 0 }, { row: 9, x: 4 }, { row: 14, x: 0 }], bridges: false, drones: [], down: { chase: { speed: .42, delay: 3 }, gone: [], drones: [] } };
  },
  /* Para cada estado alcanzable: a cuántos movimientos está la meta y cuál conviene hacer */
  solve(level) {
    const G = Reglas.graph(level), seen = new Map([[G.key(G.start), G.start]]), back = new Map(), queue = [G.start], goals = [];
    while (queue.length) {
      const s = queue.shift(); if (G.done(s)) { goals.push(G.key(s)); continue; }
      for (const e of G.next(s)) {
        const k = G.key(e.s); if (!back.has(k)) back.set(k, []); back.get(k).push({ from: G.key(s), edge: e });
        if (!seen.has(k)) { seen.set(k, e.s); queue.push(e.s); }
      }
    }
    const policy = new Map(goals.map(k => [k, { dist: 0, edge: null }])), q = goals.slice();
    while (q.length) { const k = q.shift(), d = policy.get(k).dist; for (const b of back.get(k) || []) if (!policy.has(b.from)) { policy.set(b.from, { dist: d + 1, edge: b.edge }); q.push(b.from); } }
    return policy;
  },
  audit(level) {
    const G = Reglas.graph(level), top = G.top, pk = G.pk, problems = [];
    // Recorrido hacia delante desde la planta baja
    const seen = new Map([[G.key(G.start), G.start]]), edges = new Map(), queue = [G.start];
    while (queue.length) {
      const s = queue.shift(), list = G.done(s) ? [] : G.next(s).map(e => e.s);
      edges.set(G.key(s), list.map(G.key));
      for (const n of list) if (!seen.has(G.key(n))) { seen.set(G.key(n), n); queue.push(n); }
    }
    const all = [...seen.values()], key = G.key, done = G.done;
    if (!all.some(s => s.row === top && s.x === 2)) problems.push('no se puede llegar arriba');
    else if (level.down && !all.some(done)) problems.push('no se puede bajar hasta la planta baja');
    pk.forEach((p, i) => { if (!all.some(s => s.got & (1 << i))) problems.push('paquete ' + (i + 1) + ' inalcanzable (piso ' + p.row + ')'); });
    if (level.feather && !all.some(s => s.row === level.feather.row && s.x === Math.round(level.feather.x))) problems.push('pluma inalcanzable (piso ' + level.feather.row + ')');
    // Lugares de los que solo se sale muriendo: desde ahí ya no hay camino a la meta
    if (all.some(done)) {
      const back = new Map(); for (const [k, list] of edges) for (const n of list) { if (!back.has(n)) back.set(n, []); back.get(n).push(k); }
      const good = new Set(all.filter(done).map(key)), q = [...good];
      while (q.length) for (const p of back.get(q.shift()) || []) if (!good.has(p)) { good.add(p); q.push(p); }
      const stuck = new Set(all.filter(s => !good.has(key(s))).map(s => (s.ph === 'down' ? 'bajada, ' : '') + 'piso ' + s.row + ' columna ' + s.x));
      for (const where of stuck) problems.push('sin salida: ' + where);
    }
    // Un dron sobre un piso con bandera mata a Pipo al reaparecer
    const flags = G.flagRows;
    for (const d of (level.drones || []).concat((level.down && level.down.drones) || [])) if (flags.includes(d.row)) problems.push('dron en el piso ' + d.row + ', que tiene bandera');
    for (const c of (level.down && level.down.gone) || []) if (flags.includes(c[0])) problems.push('plataforma retirada en el piso ' + c[0] + ', que tiene bandera');
    return [...new Set(problems)];
  }
};

if (typeof module !== 'undefined') module.exports = Reglas;
