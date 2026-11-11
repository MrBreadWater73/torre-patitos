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
  newTrail: (row, x) => [{ row, x }, { row, x }],
  pushTrail(trail, row, x) {
    const last = trail[trail.length - 1];
    if (last.row === row && Math.abs(last.x - x) < .1) return;
    trail.push({ row, x }); if (trail.length > 2) trail.shift();
  },
  followerSpot: trail => ({ row: trail[0].row, x: trail[0].x }),

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
  audit(level) {
    const rows = level.rows, top = rows.length - 1, problems = [];
    const groups = [...new Set((level.levers || []).map(l => l.g))], pk = level.packages || [];
    const allPk = (1 << pk.length) - 1;
    const movingCols = m => [0, 1, 2, 3, 4].filter(k => Math.abs(k - m.c) <= m.a + .5);
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
    // ¿Hay algo que pisar en (row, x) con este estado?
    const solid = (ph, row, x, s) => {
      const k = floorKind(ph, row, x);
      if (k === 'gate') return gateOpen(rows[row].gate.find(q => q.x === x).g, s.lv, s.got);
      if (k) return true;
      if (potIn(s.pots, row, x + 10) >= 0) return true;                                   // maceta tapando el hueco
      return dronesOf(ph).some(d => d.row === row && Math.abs(x - d.center) <= d.span);   // dron aturdido como puente
    };
    // Dónde termina Pipo si salta a (row, x): ahí mismo, o tras caer hasta 3 pisos, o null si muere
    const landing = (ph, row, x, s) => {
      if (x < 0 || x > 4 || row < 0 || row > top) return null;
      if (solid(ph, row, x, s)) return row;
      for (let k = row - 1; k >= 0 && row - k <= Reglas.MAX_DROP; k--) if (solid(ph, k, x, s)) return k;
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
      const out = [];
      const vertical = (row, x) => { if (potIn(s.pots, row, x) >= 0) return; const k = landing(s.ph, row, x, s); if (k != null) out.push(arrive(s, k, x)); };
      const lateral = (x, dir) => {
        let nx = x + dir, t = s; if (nx < 0 || nx > 4) return;
        const pi = potIn(s.pots, s.row, nx);
        if (pi >= 0) {                              // empujar la maceta
          const to = nx + dir; if (to < 0 || to > 4 || potIn(s.pots, s.row, to) >= 0) return;
          const pots = s.pots.slice();
          if (floorKind(s.ph, s.row, to) === null && !solid(s.ph, s.row, to, s)) pots[pi] = to + 10; else if (solid(s.ph, s.row, to, s)) pots[pi] = to; else return;
          t = Object.assign({}, s, { pots });
        }
        let row = landing(t.ph, s.row, nx, t); if (row == null) return;
        if (row === s.row && floorKind(t.ph, row, nx) === 'ice') {   // resbalar
          const end = Reglas.slide(nx, dir, c => potIn(t.pots, row, c) >= 0 ? 'blocked' : floorKind(t.ph, row, c) === 'ice' ? 'ice' : solid(t.ph, row, c, t) ? 'floor' : 'hole');
          nx = end.x; if (end.fall) { row = landing(t.ph, row, nx, t); if (row == null) return; }
        }
        out.push(arrive(t, row, nx));
      };
      const cols = rows[s.row].moving ? movingCols(rows[s.row].moving) : [s.x];
      for (const x of cols) {                       // sobre una plataforma móvil Pipo viaja con ella
        if (s.row < top && solid(s.ph, s.row + 1, x, s)) vertical(s.row + 1, x);
        if (s.row > 0) vertical(s.row - 1, x);
        if (!rows[s.row].moving) { lateral(x, -1); lateral(x, 1); } else if (x !== s.x) out.push(Object.assign({}, s, { x }));
      }
      for (const l of level.levers || []) if (l.row === s.row && Math.abs(l.x - s.x) <= Reglas.PUNCH_REACH) out.push(Object.assign({}, s, { lv: s.lv ^ (1 << groups.indexOf(l.g)) }));
      return out;
    };
    const done = s => level.down ? s.ph === 'down' && s.row === 0 : s.row === top && s.x === 2;
    // Recorrido hacia delante desde la planta baja
    const start = arrive({ ph: 'up', lv: 0, got: 0, pots: pots0 }, 0, 2), seen = new Map([[key(start), start]]), edges = new Map(), queue = [start];
    while (queue.length) {
      const s = queue.shift(), k = key(s), list = done(s) ? [] : next(s);
      edges.set(k, list.map(key));
      for (const n of list) if (!seen.has(key(n))) { seen.set(key(n), n); queue.push(n); }
    }
    const all = [...seen.values()];
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
    const flags = rows.map((r, i) => r.checkpoint ? i : -1).filter(i => i >= 0);
    for (const d of (level.drones || []).concat((level.down && level.down.drones) || [])) if (flags.includes(d.row)) problems.push('dron en el piso ' + d.row + ', que tiene bandera');
    for (const c of (level.down && level.down.gone) || []) if (flags.includes(c[0])) problems.push('plataforma retirada en el piso ' + c[0] + ', que tiene bandera');
    return [...new Set(problems)];
  }
};

if (typeof module !== 'undefined') module.exports = Reglas;
