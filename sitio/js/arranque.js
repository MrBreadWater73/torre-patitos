'use strict';

/* ============================================================
   Ganchos de prueba (solo con ?qa en la URL)
   ============================================================ */
if (QA) window.towerQA = {
  state: () => ({ mode, level: L.n, phase, levers: [...levers.entries()], packages: [...gotPk], follower: follower && Object.assign({}, follower), clock, cam, player: Object.assign({}, player), checkpoint, featherGot, ls: ls && JSON.parse(JSON.stringify(ls)), run: run && JSON.parse(JSON.stringify(run)), crumbles: [...crumbles.entries()], hitAreas: hitAreas.length }),
  advance(dt) { for (let t = 0; t < dt; t += 1 / 120) simulate(Math.min(1 / 120, dt - t)); render(); if (vignette) drawVignette(); },
  act: name => actions[name](), move, attack, hop: beginHop, startLevel: i => { if (!run || !run.id) run = newRun('QA'); showLevelIntro(i); startPlaying(); },
  movingX, droneX, blinkState, platformAt, setView, render, Store, compute: () => compute(Store.all()), place(row, x) { player.row = row; player.x = x; player.jump = null; player.fall = null; player.drop = null; },
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
