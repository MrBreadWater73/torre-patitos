'use strict';

/* ============================================================
   Ganchos de prueba (solo con ?qa en la URL)
   ============================================================ */
if (QA) window.towerQA = {
  state: () => ({ mode, level: L.n, phase, levers: [...levers.entries()], packages: [...gotPk], pots: pots.map(p => [p.row, p.x, p.sunk]), drones: drones.map(d => ({ row: d.row, x: +(d.stun > 0 ? d.fx : droneX(d)).toFixed(2), stun: +(d.stun || 0).toFixed(2), destroyed: d.destroyed })), follower: follower && Object.assign({}, follower), clock, cam, player: Object.assign({}, player), checkpoint, featherGot, ls: ls && JSON.parse(JSON.stringify(ls)), run: run && JSON.parse(JSON.stringify(run)), crumbles: [...crumbles.entries()], hitAreas: hitAreas.length }),
  advance(dt) { for (let t = 0; t < dt; t += 1 / 120) simulate(Math.min(1 / 120, dt - t)); render(); if (vignette) drawVignette(); },
  act: name => actions[name](), move, attack, hop: beginHop, startLevel: i => { if (!run || !run.id) run = newRun('QA'); showLevelIntro(i); startPlaying(); },
  movingX, droneX, blinkState, platformAt, setView, render, Store, compute: () => compute(Store.all()), place(row, x) { player.row = row; player.x = x; player.jump = null; player.fall = null; player.drop = null; },
  custom(lvl) { LEVELS[0] = Object.assign({ n: 1, name: 'Ensayo', theme: 'morning', sibling: 'Tina', sib: 'phone', tutorial: 0, bubble: '…', objective: '', tip: '', zones: [[99, 'Ensayo']], drones: [] }, lvl); this.startLevel(0); }, // nivel de ensayo
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
