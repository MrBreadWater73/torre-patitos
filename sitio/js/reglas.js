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
    // ¿Hay algo que pisar en (row, x) con este estado?
    const solid = (ph, row, x, lv, got) => {
      const r = rows[row]; if (!r) return false;
      if (r.moving) return movingCols(r.moving).includes(x);
      if ((r.cells || []).includes(x) && !Reglas.cellGone(level.down && level.down.gone, ph, row, x)) return true;
      if ((r.crumble || []).includes(x) || (r.blink || []).some(b => b.x === x)) return true;
      const q = (r.gate || []).find(q => q.x === x); return !!q && gateOpen(q.g, lv, got);
    };
    // Dónde termina Pipo si salta a (row, x): ahí mismo, o tras caer hasta 3 pisos, o null si muere
    const landing = (ph, row, x, lv, got) => {
      if (x < 0 || x > 4 || row < 0 || row > top) return null;
      if (solid(ph, row, x, lv, got)) return row;
      for (let k = row - 1; k >= 0 && row - k <= Reglas.MAX_DROP; k--) if (solid(ph, k, x, lv, got)) return k;
      return null;
    };
    const key = s => s.ph + ':' + s.row + ':' + s.x + ':' + s.lv + ':' + s.got;
    const arrive = (ph, row, x, lv, got) => {
      if (ph === 'up') { const i = Reglas.packageAt(pk, row, x); if (i >= 0) got |= 1 << i; }
      if (ph === 'up' && level.down && row === top && x === 2) ph = 'down';   // tocó al hermano: empieza la bajada
      return { ph, row, x, lv, got };
    };
    const next = s => {
      const out = [], go = (row, x) => { const k = landing(s.ph, row, x, s.lv, s.got); if (k != null) out.push(arrive(s.ph, k, x, s.lv, s.got)); };
      const cols = rows[s.row].moving ? movingCols(rows[s.row].moving) : [s.x];
      for (const x of cols) {                       // sobre una plataforma móvil Pipo viaja con ella
        if (s.row < top && solid(s.ph, s.row + 1, x, s.lv, s.got)) go(s.row + 1, x);
        if (s.row > 0) go(s.row - 1, x);
        if (!rows[s.row].moving) { go(s.row, x - 1); go(s.row, x + 1); } else if (x !== s.x) out.push(Object.assign({}, s, { x }));
      }
      for (const l of level.levers || []) if (l.row === s.row && Math.abs(l.x - s.x) <= Reglas.PUNCH_REACH) out.push(Object.assign({}, s, { lv: s.lv ^ (1 << groups.indexOf(l.g)) }));
      return out;
    };
    const done = s => level.down ? s.ph === 'down' && s.row === 0 : s.row === top && s.x === 2;
    // Recorrido hacia delante desde la planta baja
    const start = arrive('up', 0, 2, 0, 0), seen = new Map([[key(start), start]]), edges = new Map(), queue = [start];
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
