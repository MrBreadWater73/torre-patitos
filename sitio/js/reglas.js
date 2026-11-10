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
  followerSpot: trail => ({ row: trail[0].row, x: trail[0].x })
};

if (typeof module !== 'undefined') module.exports = Reglas;
