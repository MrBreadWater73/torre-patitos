'use strict';

/* ============================================================
   HUD
   ============================================================ */
function zoneName(row) { for (const [lim, name] of L.zones) if (row <= lim) return name; return ''; }
function updateHud(force) {
  if (!player || !ls) return;
  const row = Math.round(player.row), top = nRows() - 1;
  ls.best = Math.max(ls.best || 0, row);
  const key = [L.n, row, Math.floor(ls.time), ls.falls, ls.kills, featherGot, mode, Math.ceil(cooldown * 10), combat, !!player.fall, ls.best].join('|');
  if (!force && key === lastHud) return; lastHud = key;
  ui.zone.innerHTML = esc(L.name) + '<small>' + esc(mode === 'celebrate' ? '¡' + L.sibling + ' a salvo!' : zoneName(row)) + '</small>';
  ui.chips.forEach((c, i) => { c.classList.toggle('current', i === L.n - 1); c.classList.toggle('done', !!(run && run.levels[i] && run.levels[i].done) && i !== L.n - 1); });
  ui.time.textContent = fmt(ls.time);
  ui.total.textContent = fmt(run.levels.reduce((s, l) => s + (l ? l.time : 0), 0));
  ui.falls.textContent = ls.falls; ui.drones.textContent = ls.kills;
  ui.feather.textContent = featherGot ? 'Conseguida ✦' : 'Por descubrir'; ui.feather.classList.toggle('got', featherGot);
  ui.height.textContent = 'Piso ' + ls.best + ' / ' + top; ui.fill.style.width = ls.best / top * 100 + '%';
  ui.track.setAttribute('aria-valuemax', String(top)); ui.track.setAttribute('aria-valuenow', String(ls.best));
  ui.punch.disabled = mode !== 'playing' || !combat || cooldown > 0 || !!player.fall;
  ui.punch.style.setProperty('--ready', String(1 - cooldown / .78));
  canvas.dataset.mode = mode; canvas.dataset.row = String(row); canvas.dataset.column = String(Math.round(player.x)); canvas.dataset.level = String(L.n);
}
function updateSide() {
  ui.sideRibbon.textContent = 'Expediente ' + L.n + ' de 3'; ui.sideTitle.textContent = L.name; ui.sideObjective.textContent = L.objective; ui.sideTip.textContent = L.tip;
}
function updateLegend() {
  const has = k => L.rows.some(r => k === 'moving' ? r.moving : (r[k] || []).length);
  const items = [[THEMES[L.theme].top, 'Plataforma fija', true], ['#93a6ae', 'Plataforma móvil', has('moving')], ['#c4d6d0', 'Vidrio agrietado', has('crumble')], ['#e3c24a', 'Placa eléctrica', has('blink')], ['#d7d3c8', 'Dron de reparto', true], ['#e0782c', 'Bandera de avance', true], ['#cdb76a', 'Pluma opcional', true]];
  ui.legend.innerHTML = items.filter(i => i[2]).map(i => `<span><i style="background:${i[0]};box-shadow:inset 0 -3px 0 rgba(0,0,0,.18)"></i>${i[1]}</span>`).join('');
}

/* ============================================================
   Pantallas (overlay)
   ============================================================ */
function showOverlay(html, opts = {}) {
  ui.overlay.hidden = false; ui.overlay.classList.toggle('center', !!opts.center);
  ui.card.className = 'overlay-card' + (opts.wide ? ' wide' : '');
  ui.card.innerHTML = html; ui.card.scrollTop = 0;
  void ui.card.offsetWidth; // reinicia la animación de entrada
  vignette = null;
  if (opts.scene) mountVignette(opts.scene, opts.art, opts.sib);
  const f = ui.card.querySelector('[autofocus]') || ui.card.querySelector('[data-primary]');
  if (f && !QA) setTimeout(() => { if (f.isConnected) f.focus({ preventScroll: true }); }, 60);
}
function hideOverlay() { ui.overlay.hidden = true; vignette = null; }
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>';
const ICON_BULB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3Z"/></svg>';

function showTitle() {
  mode = 'menu'; if (!run) run = { levels: [] }; loadPreview();
  showOverlay(`<p class="meta">Incidente 0427 · Estanque municipal</p><span class="ribbon">Caso abierto</span>
    <h2>Pipo no vuela. Pipo trepa.</h2>
    <p class="lead">Una flota de drones de reparto destruyó el nido familiar en horario de entrega garantizada. Tus hermanos quedaron repartidos en tres estructuras de dudosa legalidad. Nadie más va a ir por ellos.</p>
    <p>Al final firmas el tablero de récords y llenas una encuesta de 6 preguntas. Es lo justo.</p>
    <div class="actions"><button class="btn duck" data-action="begin" data-primary>${ICON_PLAY}Abrir el expediente</button><button class="btn link" data-action="stats">Ver récords</button></div>`, { center: true });
}
function loadPreview() { L = LEVELS[0]; resetLevelState(); updateSide(); updateLegend(); ls = { time: 0, falls: 0, kills: 0, deaths: [], best: 0 }; updateHud(true); }
function showStory(i) {
  storyIndex = i; const s = STORY.intro[i], last = i === STORY.intro.length - 1;
  showOverlay(`<p class="meta">${esc(s.meta)}</p><span class="ribbon">Prólogo ${i + 1}/${STORY.intro.length}</span>
    <canvas class="vignette" data-vignette aria-hidden="true"></canvas>
    <h2>${esc(s.title)}</h2><p class="lead story-text">${esc(s.text)}</p>
    <div class="actions"><div class="dots" aria-hidden="true">${STORY.intro.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    ${last ? '' : '<button class="btn link" data-action="skip-story">Saltar historia</button>'}
    <button class="btn" data-action="${last ? 'to-level' : 'next-story'}" data-primary>${last ? 'Ir a la torre' : 'Siguiente'}</button></div>`, { center: true, wide: true, scene: s.scene, art: s.art });
}
function showLevelIntro(i) {
  loadLevel(i); mode = 'menu'; ui.pause.disabled = true; ui.restart.disabled = true;
  flyover = maxCam() > 40 && !reduced ? { from: maxCam(), t: -.7, d: 2.4 } : null; if (flyover) cam = maxCam();
  showOverlay(`<p class="meta">Expediente ${L.n} de 3 · ${L.rows.length - 1} pisos</p><span class="ribbon">Rescate: ${esc(L.sibling)}</span><h2>${esc(L.name)}</h2>
    <p class="lead">${esc(L.objective)}</p>
    <div class="tip-box">${ICON_BULB}<span>${esc(L.tip)}</span></div>
    <div class="actions"><button class="btn duck" data-action="play" data-primary>${ICON_PLAY}Subir</button></div>`);
}
function showSummary() {
  mode = 'menu'; const i = L.n - 1, last = i === 2, st = STORY.rescue[i];
  const stats = `<div class="mini-stats"><div><strong>${fmt(ls.time)}</strong>Tiempo</div><div><strong>${ls.falls}</strong>Muertes</div><div><strong>${ls.kills}</strong>Drones</div><div><strong>${ls.feather ? '✦' : '—'}</strong>Pluma</div></div>`;
  if (!last) {
    showOverlay(`<p class="meta">Expediente ${L.n} · cerrado</p><span class="ribbon green">Rescatada: ${esc(L.sibling)}</span><canvas class="vignette" data-vignette aria-hidden="true"></canvas>
      <h2>${esc(L.sibling)} está a salvo. Más o menos.</h2><p class="lead story-text">${esc(st.text)}</p>${stats}
      <div class="actions"><button class="btn duck" data-action="next-level" data-primary>${ICON_PLAY}Siguiente expediente</button></div>`, { center: true, wide: true, scene: 'rescue', art: st.art, sib: i });
  } else {
    const tot = run.levels.reduce((s, l) => s + (l ? l.time : 0), 0), falls = run.levels.reduce((s, l) => s + (l ? l.falls : 0), 0), fe = run.levels.filter(l => l && l.feather).length;
    showOverlay(`<p class="meta">Incidente 0427 · resuelto</p><span class="ribbon green">Caso cerrado</span><canvas class="vignette" data-vignette aria-hidden="true"></canvas>
      <h2>La familia Pata, otra vez completa</h2><p class="lead story-text">${esc(st.text)}</p>
      <div class="mini-stats"><div><strong>${fmt(tot)}</strong>Total</div><div><strong>${falls}</strong>Muertes</div><div><strong>${run.levels.reduce((s, l) => s + (l ? l.kills : 0), 0)}</strong>Drones</div><div><strong>${fe}/3</strong>Plumas</div></div>
      <div class="actions"><button class="btn duck" data-action="name" data-primary>Firmar el expediente</button></div>`, { center: true, wide: true, scene: 'ending', art: st.art });
  }
}
function rankFor(time) {
  const done = Store.all().filter(r => r.completed >= 3 && r.nick && r.id !== run.id);
  return done.filter(r => r.totalTime < time).length + 1;
}
function showNameEntry(err) {
  const tot = run.totalTime, pos = rankFor(tot), last = store.get('torrePatitos.nick', '');
  showOverlay(`<div class="arcade"><p class="meta">Registro oficial de récords</p><span class="ribbon">${pos <= 3 ? 'Nuevo récord' : 'Fin del juego'}</span>
    <h2>Firma aquí</h2>
    <div class="score-line"><div><small>Tiempo</small><b>${fmt(tot)}</b></div><div><small>Lugar</small><b>#${pos}</b></div><div><small>Plumas</small><b>${run.levels.filter(l => l && l.feather).length}/3</b></div></div>
    <form id="nameForm" novalidate><div class="field"><label for="nameInput">Tu nombre para el tablero</label>
    <input id="nameInput" class="arcade-input" maxlength="14" autocomplete="nickname" spellcheck="false" placeholder="PIPO" value="${esc(last)}" autofocus>
    <p class="hint">Entre 2 y 14 letras o números. Quedará en el tablero para siempre, o hasta que alguien borre la base de datos.</p></div>
    ${err ? `<p class="form-error" role="alert">${esc(err)}</p>` : ''}
    <div class="actions"><button class="btn duck" type="submit" data-primary>Firmar</button></div></form></div>`, { center: true });
  $('#nameForm').addEventListener('submit', e => { e.preventDefault(); saveName($('#nameInput').value); });
}
function saveName(raw) {
  const name = String(raw || '').replace(/[^\p{L}\p{N} ._-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  if (name.length < 2) { showNameEntry('Escribe al menos 2 letras o números.'); return; }
  store.set('torrePatitos.nick', name); run.nick = name; Store.save(run); tone('checkpoint'); showSurvey();
}
const SURVEY = [
  { id: 'fun', q: '¿Qué tan divertido fue?', type: 'scale', ends: ['Nada', 'Muchísimo'] },
  { id: 'difficulty', q: '¿Cómo sentiste la dificultad?', type: 'choice', opts: ['Muy fácil', 'Fácil', 'Justa', 'Difícil', 'Muy difícil'] },
  { id: 'favorite', q: '¿Cuál capítulo te gustó más?', type: 'choice', opts: LEVELS.map(l => l.name) },
  { id: 'clarity', q: '¿Qué tan claros fueron los controles?', type: 'scale', ends: ['Confusos', 'Muy claros'] },
  { id: 'emotion', q: '¿Qué sentiste más durante el juego?', type: 'choice', opts: ['Curiosidad', 'Tensión', 'Satisfacción', 'Frustración', 'Aburrimiento'] }
];
function showSurvey(err) {
  const field = s => {
    if (s.type === 'scale') return `<fieldset><legend>${esc(s.q)}</legend><div class="choices">${[1, 2, 3, 4, 5].map(v => `<label class="choice num"><input type="radio" name="${s.id}" value="${v}" id="${s.id}${v}"><b>${v}</b>${v === 1 ? `<small>${s.ends[0]}</small>` : v === 5 ? `<small>${s.ends[1]}</small>` : '<small>&nbsp;</small>'}</label>`).join('')}</div></fieldset>`;
    return `<fieldset><legend>${esc(s.q)}</legend><div class="choices">${s.opts.map((o, k) => `<label class="choice"><input type="radio" name="${s.id}" value="${k}" id="${s.id}${k}">${esc(o)}</label>`).join('')}</div></fieldset>`;
  };
  showOverlay(`<p class="meta">Formulario de satisfacción · 6 preguntas</p><span class="ribbon">Opinión requerida</span><h2>¿Cómo te fue con Pipo?</h2>
    <p>Prometemos leerlas. Sirven para ajustar el diseño de los niveles y se guardan junto con tu récord.</p>
    <form class="survey" id="surveyForm" novalidate>${SURVEY.map(field).join('')}
    <div class="field"><label for="comment">¿Qué cambiarías o qué te gustó? (opcional)</label><textarea id="comment" maxlength="280" placeholder="Sé honesto. Pipo ya pasó por cosas peores."></textarea></div>
    ${err ? `<p class="form-error" role="alert">${esc(err)}</p>` : ''}
    <div class="actions"><button class="btn duck" type="submit" data-primary>Enviar respuestas</button><button class="btn link" type="button" data-action="skip-survey">Ahora no</button></div></form>`, { center: true, wide: true });
  $('#surveyForm').addEventListener('submit', e => { e.preventDefault(); submitSurvey(new FormData(e.target)); });
}
function submitSurvey(fd) {
  const out = {};
  for (const s of SURVEY) { const v = fd.get(s.id); if (v == null) { const keep = {}; SURVEY.forEach(x => keep[x.id] = fd.get(x.id)); const c = fd.get('comment') || $('#comment').value; showSurvey('Falta responder: “' + s.q + '”.'); for (const k in keep) if (keep[k] != null) { const el = document.getElementById(k + keep[k]); if (el) el.checked = true; } $('#comment').value = c; return; } out[s.id] = +v; }
  out.comment = String($('#comment').value || '').trim().slice(0, 280);
  out.at = new Date().toISOString(); run.survey = out; Store.save(run); tone('checkpoint'); showThanks(true);
}
function showThanks(answered) {
  const done = Store.all().filter(r => r.completed >= 3 && r.nick).sort((a, b) => a.totalTime - b.totalTime);
  const pos = done.findIndex(r => r.id === run.id) + 1;
  showOverlay(`<p class="meta">Expediente archivado</p><span class="ribbon green">${answered ? 'Recibido' : 'Archivado'}</span><h2>${answered ? 'Gracias por tu tiempo' : 'Récord guardado'}</h2>
    <p class="lead">${pos ? `${esc(run.nick)}, quedaste en el lugar <strong>${pos}</strong> de ${done.length} en el tablero. Felicidades, supongo.` : 'Tu partida ya aparece en las estadísticas.'}</p>
    <p>${esc(Store.note())}</p>
    <div class="actions"><button class="btn duck" data-action="stats" data-primary>Ver estadísticas del grupo</button><button class="btn ghost" data-action="replay">Otra vez, desde cero</button></div>`, { center: true });
}

const actions = {
  begin() { run = newRun(''); run.combat = combat; tone('click'); showStory(0); },
  'next-story'() { tone('click'); showStory(storyIndex + 1); },
  'skip-story'() { showLevelIntro(0); },
  'to-level'() { showLevelIntro(0); },
  play() { startPlaying(); },
  'next-level'() { showLevelIntro(L.n); },
  name() { showNameEntry(); },
  survey() { showSurvey(); },
  'skip-survey'() { showThanks(false); },
  resume() { resume(); },
  restart() { restartLevel(); },
  stats() { setView('stats'); },
  replay() { run = newRun(''); run.combat = combat; showLevelIntro(0); }
};
ui.card.addEventListener('click', e => { const b = e.target.closest('[data-action]'); if (b && actions[b.dataset.action]) actions[b.dataset.action](b); });

/* ============================================================
   Entrada
   ============================================================ */
function noteInput(kind) { if (run && run.input) run.input[kind]++; }
function screenPoint(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
function pointIn(x, y, pts) { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside; } return inside; }
// Bug #1: antes se elegía la plataforma de atrás. Las de adelante se dibujan al final, así que se busca desde el final.
function hitAt(p) { for (let i = hitAreas.length - 1; i >= 0; i--) if (pointIn(p.x, p.y, hitAreas[i].points)) return hitAreas[i]; return null; }
canvas.addEventListener('pointermove', e => { hover = hitAt(screenPoint(e)); canvas.style.cursor = hover && canReach(hover.x, hover.row) ? 'pointer' : 'default'; });
canvas.addEventListener('pointerleave', () => { hover = null; });
canvas.addEventListener('pointerdown', e => {
  if (mode !== 'playing') return; canvas.focus({ preventScroll: true });
  const hit = hitAt(screenPoint(e)); if (hit && canReach(hit.x, hit.row)) { noteInput('tap'); beginHop(hit.x, hit.row); }
});
document.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => { noteInput('pad'); move(b.dataset.move); }));
ui.punch.addEventListener('click', () => { noteInput('pad'); attack(); });
ui.pause.addEventListener('click', pause);
ui.restart.addEventListener('click', restartLevel);

/* Pantalla completa: se pone en pantalla completa la tarjeta entera para que sigan visibles los controles táctiles. */
const gameCard = $('.game-card'), fullscreenBtn = $('#fullscreenBtn');
const fullscreenEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
const fullscreenSupported = !!(gameCard.requestFullscreen || gameCard.webkitRequestFullscreen);
function toggleFullscreen() {
  if (fullscreenEl()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) { const p = exit.call(document); if (p && p.catch) p.catch(() => {}); }
    return;
  }
  const request = gameCard.requestFullscreen || gameCard.webkitRequestFullscreen;
  if (request) { const p = request.call(gameCard); if (p && p.catch) p.catch(() => {}); }
}
function updateFullscreenUI() {
  const on = fullscreenEl() === gameCard;
  gameCard.classList.toggle('is-fullscreen', on);
  fullscreenBtn.classList.toggle('on', on); fullscreenBtn.setAttribute('aria-pressed', String(on));
  const label = on ? 'Salir de pantalla completa' : 'Pantalla completa'; fullscreenBtn.setAttribute('aria-label', label); fullscreenBtn.title = on ? label : 'Pantalla completa (F)';
  announce(on ? 'Pantalla completa activada.' : 'Pantalla completa desactivada.');
}
if (fullscreenSupported) {
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);
} else {
  fullscreenBtn.hidden = true; $('#fullscreenKeyRow').hidden = true;
}

ui.sound.addEventListener('click', () => { sound = !sound; store.set('torrePatitos.sound', sound); updateSoundUI(); if (sound) tone('checkpoint'); });
ui.combat.addEventListener('change', e => {
  combat = e.target.checked; if (run) run.combat = run.combat && combat;
  // Bug #2: el foco se quedaba en la casilla y el teclado dejaba de mover a Pipo.
  e.target.blur(); canvas.focus({ preventScroll: true });
  if (mode === 'playing' || mode === 'paused') restartLevel();
  announce(combat ? 'Golpe activado.' : 'Solo saltos.'); updateHud(true);
});
const KEYMAP = { arrowup: 'up', w: 'up', ' ': 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
document.addEventListener('keydown', e => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (view !== 'play') return;
  const k = e.key.toLowerCase();
  if (!ui.overlay.hidden) {
    if ((k === 'enter' || k === ' ') && tag !== 'BUTTON' && tag !== 'A') { const b = ui.card.querySelector('[data-primary]'); if (b) { e.preventDefault(); b.click(); } }
    else if ((k === 'p' || k === 'escape') && mode === 'paused') { e.preventDefault(); resume(); }
    return;
  }
  if (k === 'p' || k === 'escape') { e.preventDefault(); pause(); return; }
  if (k === 'r') { e.preventDefault(); restartLevel(); return; }
  if (k === 'f' && fullscreenSupported) { e.preventDefault(); toggleFullscreen(); return; }
  if (k === 'j' || k === 'x') { e.preventDefault(); if (!e.repeat) { noteInput('key'); attack(); } return; }
  if (!KEYMAP[k]) return;
  if (k === ' ' && tag === 'BUTTON') return;
  e.preventDefault(); if (e.repeat) return; noteInput('key'); move(KEYMAP[k]);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'playing') pause(); });
window.addEventListener('blur', () => { if (mode === 'playing') pause(); });
