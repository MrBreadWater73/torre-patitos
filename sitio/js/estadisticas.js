'use strict';

/* ============================================================
   Estadísticas
   ============================================================ */
const sum = a => a.reduce((s, v) => s + v, 0), avg = a => a.length ? sum(a) / a.length : null;
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
let heatLevel = 0;
const CAUSE_COLORS = { hueco: 'var(--pond)', dron: 'var(--danger)', vidrio: 'var(--reed)', apagon: 'var(--duck)' };
const CHAPTER_COLORS = ['var(--pond)', 'var(--reed)', 'var(--sodium)'];
const EMOTION_COLORS = ['var(--pond)', 'var(--sodium)', 'var(--reed)', 'var(--danger)', 'var(--muted)'];
function compute(runs) {
  const lv = i => runs.map(r => r.levels[i]).filter(Boolean);
  const per = [0, 1, 2].map(i => { const all = lv(i), done = all.filter(l => l.done); return { started: all.length, done: done.length, time: median(done.map(l => l.time)), falls: avg(all.map(l => l.falls || 0)), feather: pct(done.filter(l => l.feather).length, done.length), kills: avg(all.map(l => l.kills || 0)), restarts: avg(all.map(l => l.restarts || 0)) }; });
  const finished = runs.filter(r => r.completed >= 3), surveys = runs.map(r => r.survey).filter(Boolean);
  const count = (key, n) => { const c = Array(n).fill(0); surveys.forEach(s => { if (s[key] != null && c[s[key]] != null) c[s[key]]++; }); return c; };
  return {
    runs: runs.length, players: new Set(runs.filter(r => r.nick).map(r => String(r.nick).toLowerCase())).size, per, finished,
    medTotal: median(finished.map(r => r.totalTime)), fallsAvg: avg(runs.map(r => sum(r.levels.filter(Boolean).map(l => l.falls || 0)))),
    surveys: surveys.length, fun: avg(surveys.map(s => s.fun)), clarity: avg(surveys.map(s => s.clarity)),
    causes: runs.reduce((c, r) => { r.levels.forEach(l => (l && l.deaths || []).forEach(d => { c[d[2]] = (c[d[2]] || 0) + 1; })); return c; }, {}),
    difficulty: count('difficulty', 5), favorite: count('favorite', 3), emotion: count('emotion', 5),
    comments: runs.filter(r => r.survey && r.survey.comment).sort((a, b) => (b.survey.at || '').localeCompare(a.survey.at || '')).slice(0, 8),
    board: finished.filter(r => r.nick).sort((a, b) => a.totalTime - b.totalTime).slice(0, 10)
  };
}
function bars(items, fmtv) {
  const max = Math.max(1, ...items.map(i => i.value));
  return `<div class="bars">${items.map(i => `<div class="bar" data-tip="${esc(i.tip || (i.label + ': ' + fmtv(i.value)))}"><span class="lab">${esc(i.label)}</span><span class="tr"><i style="width:${(i.value / max * 100).toFixed(1)}%"></i></span><span class="val">${fmtv(i.value)}</span></div>`).join('')}</div>`;
}
/* Gráfica de pastel (dona): items = [{ label, value, color }] */
function pie(items, totalLabel) {
  const total = sum(items.map(i => i.value));
  if (!total) return '<p class="pie-empty">Sin datos todavía.</p>';
  const R = 60, r0 = 34, C = 66, pt = (a, rad) => (C + rad * Math.sin(a)).toFixed(2) + ' ' + (C - rad * Math.cos(a)).toFixed(2);
  let a = 0;
  const slices = items.filter(i => i.value > 0).map(i => {
    const tip = esc(i.label + ': ' + i.value + ' (' + pct(i.value, total) + '%)');
    if (i.value === total) return `<path data-tip="${tip}" style="fill:${i.color}" fill-rule="evenodd" d="M${C} ${C - R}A${R} ${R} 0 1 1 ${C - .01} ${C - R}ZM${C} ${C - r0}A${r0} ${r0} 0 1 0 ${C + .01} ${C - r0}Z"/>`;
    const a1 = a + i.value / total * Math.PI * 2, big = a1 - a > Math.PI ? 1 : 0;
    const d = `M${pt(a, R)}A${R} ${R} 0 ${big} 1 ${pt(a1, R)}L${pt(a1, r0)}A${r0} ${r0} 0 ${big} 0 ${pt(a, r0)}Z`; a = a1;
    return `<path data-tip="${tip}" style="fill:${i.color}" d="${d}"/>`;
  }).join('');
  return `<div class="pie"><svg viewBox="0 0 132 132" role="img" aria-label="${esc(items.map(i => i.label + ' ' + i.value).join(', '))}">${slices}<text class="tot" x="${C}" y="${C + 4}" text-anchor="middle">${total}</text><text class="tot-l" x="${C}" y="${C + 18}" text-anchor="middle">${esc(totalLabel)}</text></svg>
    <ul class="legend">${items.map(i => `<li data-tip="${esc(i.label + ': ' + i.value + ' (' + pct(i.value, total) + '%)')}"><i style="background:${i.color}"></i><span>${esc(i.label)}</span><b>${i.value}</b><small>${pct(i.value, total)}%</small></li>`).join('')}</ul></div>`;
}
/* Gráfica de columnas: items = [{ label, value, tip? }] */
function cols(items, fmtv, color) {
  const max = Math.max(1e-9, ...items.map(i => i.value || 0));
  return `<div class="cols">${items.map(i => `<div class="col" data-tip="${esc(i.tip || (i.label + ': ' + (i.value == null ? '—' : fmtv(i.value))))}"><span class="v">${i.value == null ? '—' : fmtv(i.value)}</span><span class="c" style="height:${((i.value || 0) / max * 100 * .82).toFixed(1)}%${color ? ';background:' + color : ''}"></span></div>`).join('')}</div><div class="col-labs">${items.map(i => `<span>${esc(i.label)}</span>`).join('')}</div>`;
}
function renderStats() {
  const body = $('#statsBody'), badge = $('#sourceBadge');
  badge.classList.toggle('shared', Store.shared()); badge.querySelector('span').textContent = Store.ready ? Store.label() : 'Conectando…';
  if (view !== 'stats') return;
  const runs = Store.all(), s = compute(runs), me = run && run.id;
  if (!runs.length) {
    body.innerHTML = `<div class="empty"><h3>Nadie ha jugado. Todavía.</h3><p>Cuando alguien juegue, aquí aparecerán el avance por capítulo, el mapa de muertes, los récords y las respuestas de la encuesta.</p><button class="btn duck" data-go="play">${ICON_PLAY}Jugar la primera partida</button></div>`;
    return;
  }
  const n1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toLocaleString('es-MX');
  body.innerHTML = `
  <div class="kpis">
    <div class="kpi"><span>Partidas</span><strong>${s.runs}</strong><small>${s.players} nombre${s.players === 1 ? '' : 's'} en el tablero</small></div>
    <div class="kpi"><span>Terminaron la historia</span><strong>${pct(s.finished.length, s.runs)}%</strong><small>${s.finished.length} de ${s.runs} partidas</small></div>
    <div class="kpi"><span>Tiempo mediano total</span><strong>${s.medTotal == null ? '—' : fmt(s.medTotal)}</strong><small>de quienes terminaron</small></div>
    <div class="kpi"><span>Muertes por partida</span><strong>${n1(s.fallsAvg)}</strong><small>promedio, sin contar la zona inicial</small></div>
  </div>
  <div class="grid2">
    <section class="panel"><h3>¿Hasta dónde llegan?</h3><p class="sub">Partidas que alcanzaron cada punto de la historia.</p>
      ${bars([{ label: 'Empezaron cap. 1', value: s.per[0].started }, { label: 'Bajaron a Tina', value: s.per[0].done }, { label: 'Rescataron a Lalo', value: s.per[1].done }, { label: 'Rescataron a Mimi', value: s.per[2].done }, { label: 'Respondieron encuesta', value: s.surveys }].map(i => Object.assign(i, { tip: i.label + ': ' + i.value + ' (' + pct(i.value, s.per[0].started) + '%)' })), v => v)}
    </section>
    <section class="panel"><h3>Por capítulo</h3><p class="sub">Tiempo mediano de quienes lo terminaron; muertes y drones en promedio.</p>
      <div class="table-wrap"><table><thead><tr><th>Capítulo</th><th class="num">Tiempo</th><th class="num">Muertes</th><th class="num">Reinicios</th><th class="num">Pluma</th><th class="num">Drones</th></tr></thead><tbody>
      ${s.per.map((p, i) => `<tr><td>${i + 1}. ${esc(LEVELS[i].name.replace(/^(La|El) /, ''))}</td><td class="num">${p.time == null ? '—' : fmt(p.time)}</td><td class="num">${n1(p.falls)}</td><td class="num">${n1(p.restarts)}</td><td class="num">${p.done ? p.feather + '%' : '—'}</td><td class="num">${n1(p.kills)}</td></tr>`).join('')}
      </tbody></table></div>
    </section>
  </div>
  <div class="grid2">
    <section class="panel"><h3>Por capítulo, en gráfica</h3><p class="sub">Muertes promedio por partida y tiempo mediano de quienes lo terminaron.</p>
      <div class="chart-pair">
        <div><h4>Muertes promedio</h4>${cols(s.per.map((p, i) => ({ label: 'Cap. ' + (i + 1), value: p.started ? p.falls : null, tip: LEVELS[i].name + ': ' + n1(p.falls) + ' muertes en promedio' })), n1, 'var(--danger)')}</div>
        <div><h4>Tiempo mediano</h4>${cols(s.per.map((p, i) => ({ label: 'Cap. ' + (i + 1), value: p.time, tip: LEVELS[i].name + ': ' + (p.time == null ? 'nadie lo ha terminado' : fmt(p.time)) })), fmt, 'var(--pond)')}</div>
      </div>
    </section>
    <section class="panel"><h3>¿De qué muere la gente?</h3><p class="sub">Todas las muertes registradas en los tres capítulos, por causa.</p>
      ${pie(Object.keys(CAUSES).map(k => ({ label: CAUSES[k], value: s.causes[k] || 0, color: CAUSE_COLORS[k] })), 'muertes')}
    </section>
  </div>
  <div class="grid2">
    <section class="panel"><h3>Dónde muere la gente</h3><p class="sub">Cada punto es un lugar donde alguien perdió a Pipo; más grande = más muertes. Las caídas de hasta 3 pisos no cuentan.</p>
      <div class="seg" role="group" aria-label="Capítulo del mapa">${LEVELS.map((l, i) => `<button data-heat="${i}" aria-pressed="${i === heatLevel}">Cap. ${i + 1}</button>`).join('')}</div>
      <canvas class="heat" id="heatCanvas" width="560" height="600" aria-label="Mapa de muertes del capítulo ${heatLevel + 1}"></canvas>
      <div class="heat-legend" id="heatLegend"></div>
    </section>
    <section class="panel"><h3>Encuesta</h3><p class="sub">${s.surveys} respuesta${s.surveys === 1 ? '' : 's'}.</p>
      <div class="stat-pair"><div>Diversión<strong>${n1(s.fun)}<small> / 5</small></strong></div><div>Claridad de controles<strong>${n1(s.clarity)}<small> / 5</small></strong></div></div>
      <h4>Dificultad</h4>${cols(SURVEY[1].opts.map((o, k) => ({ label: o, value: s.difficulty[k], tip: o + ': ' + s.difficulty[k] + ' (' + pct(s.difficulty[k], s.surveys) + '%)' })), v => v)}
      <h4>Capítulo favorito</h4>${pie(SURVEY[2].opts.map((o, k) => ({ label: o, value: s.favorite[k], color: CHAPTER_COLORS[k] })), 'votos')}
      <h4>Emoción principal</h4>${pie(SURVEY[4].opts.map((o, k) => ({ label: o, value: s.emotion[k], color: EMOTION_COLORS[k] })), 'votos')}
    </section>
  </div>
  <div class="grid2">
    <section class="panel"><h3>Tablero de récords</h3><p class="sub">Quienes terminaron los tres expedientes y firmaron.</p>
      ${s.board.length ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Nombre</th><th class="num">Tiempo</th><th class="num">Muertes</th><th class="num">Plumas</th></tr></thead><tbody>
      ${s.board.map((r, i) => `<tr class="${r.id === me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.nick)}</td><td class="num">${fmt(r.totalTime)}</td><td class="num">${sum(r.levels.filter(Boolean).map(l => l.falls || 0))}</td><td class="num">${r.levels.filter(l => l && l.feather).length}/3</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="sub">Nadie ha registrado un récord todavía.</p>'}
    </section>
    <section class="panel"><h3>Comentarios recientes</h3><p class="sub">Lo que escribieron al final, sin editar.</p>
      ${s.comments.length ? `<div class="quotes">${s.comments.map(r => `<div class="quote">${esc(r.survey.comment)}<small>Favorito: ${esc(LEVELS[r.survey.favorite] ? LEVELS[r.survey.favorite].name : '—')} · ${esc(SURVEY[4].opts[r.survey.emotion] || '')}</small></div>`).join('')}</div>` : '<p class="sub">Todavía no hay comentarios.</p>'}
    </section>
  </div>`;
  drawHeat(runs);
}
function drawHeat(runs) {
  const cv = $('#heatCanvas'); if (!cv) return;
  const lvl = LEVELS[heatLevel], n = lvl.rows.length, HX = 74, RY = 46, SK = 11, cx = 300, topY = 84;
  cv.width = 560; cv.height = Math.round(topY + (n - 1) * RY + 70); cv.setAttribute('aria-label', 'Mapa de muertes del capítulo ' + (heatLevel + 1));
  const c2 = cv.getContext('2d'), prev = g; g = c2; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  const css = getComputedStyle(document.documentElement), col = v => css.getPropertyValue(v).trim();
  const dark = /^#[01]/.test(col('--bg'));
  const mp = (x, row) => P(cx + (x - 2) * HX, topY + (n - 1 - row) * RY + (x - 2) * SK);
  const plat = (x, row, fill, dashed) => { const p = mp(x, row), w = 64, a = P(p.x - w / 2, p.y - 6), b = P(p.x + w / 2, p.y + 6), c = P(p.x + w / 2 + 18, p.y - 10), d = P(p.x - w / 2 + 18, p.y - 22); if (dashed) { line([a, b, c, d, a], fill, 2, [5, 4]); } else { poly([a, b, P(b.x, b.y + 9), P(a.x, a.y + 9)], col('--line')); poly([a, b, c, d], fill); } };
  g.font = '700 20px Figtree, system-ui, sans-serif'; g.fillStyle = col('--muted'); g.textAlign = 'right'; g.textBaseline = 'middle';
  lvl.rows.forEach((r, row) => {
    const y = mp(-.9, row).y; g.fillStyle = col('--muted'); g.fillText(String(row), 52, y - 4);
    if (r.moving) { const a = mp(r.moving.c - r.moving.a, row), b = mp(r.moving.c + r.moving.a, row); line([P(a.x, a.y - 6), P(b.x + 18, b.y - 6)], dark ? '#4d8796' : '#86cad8', 12); }
    (r.cells || []).forEach(x => plat(x, row, dark ? '#2e5a40' : '#bfdcc4'));
    (r.crumble || []).forEach(x => plat(x, row, dark ? '#3a6268' : '#cfeef0'));
    (r.blink || []).forEach(b => plat(b.x, row, dark ? '#9a7a2a' : '#e7c255', true));
  });
  g.textAlign = 'left'; g.fillStyle = col('--muted'); g.fillText('Piso', 14, 22);
  const buckets = new Map();
  runs.forEach(r => { const l = r.levels[heatLevel]; if (!l || !l.deaths) return; l.deaths.forEach(([row, x, cause]) => { const key = Math.round(row) + ':' + Math.round(x * 2) / 2; const b = buckets.get(key) || { row: Math.round(row), x: Math.round(x * 2) / 2, n: 0, causes: {} }; b.n++; b.causes[cause] = (b.causes[cause] || 0) + 1; buckets.set(key, b); }); });
  const list = [...buckets.values()], max = Math.max(1, ...list.map(b => b.n));
  const danger = col('--danger');
  cv._dots = list.map(b => { const p = mp(b.x, b.row); const r = 8 + 14 * Math.sqrt(b.n / max); return { x: p.x + 9, y: p.y - 9, r, b }; });
  for (const d of cv._dots) { g.globalAlpha = .28; ell(d.x, d.y, d.r + 5, d.r + 5, danger); g.globalAlpha = .9; ell(d.x, d.y, d.r, d.r, danger); g.globalAlpha = 1; g.lineWidth = 2; g.strokeStyle = col('--surface'); g.stroke(); }
  g = prev;
  const total = sum(list.map(b => b.n)), causes = {}; list.forEach(b => Object.entries(b.causes).forEach(([k, v]) => causes[k] = (causes[k] || 0) + v));
  $('#heatLegend').innerHTML = total ? `<span><i></i>${total} muerte${total === 1 ? ' registrada' : 's registradas'}</span>` + Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span>${esc(CAUSES[k] || k)}: <b>${v}</b></span>`).join('') : '<span>Nadie ha muerto aquí. Sospechoso.</span>';
}

/* Tooltips para barras y mapa */
function showTip(text, x, y) { ui.tooltip.textContent = text; ui.tooltip.hidden = false; const r = ui.tooltip.getBoundingClientRect(); ui.tooltip.style.left = clamp(x + 12, 8, innerWidth - r.width - 8) + 'px'; ui.tooltip.style.top = clamp(y - r.height - 10, 8, innerHeight - r.height - 8) + 'px'; }
function hideTip() { ui.tooltip.hidden = true; }
$('#statsBody').addEventListener('pointermove', e => {
  const bar = e.target.closest('[data-tip]'); if (bar) { showTip(bar.dataset.tip, e.clientX, e.clientY); return; }
  const cv = e.target.closest('#heatCanvas');
  if (cv && cv._dots) { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * cv.width, y = (e.clientY - r.top) / r.height * cv.height; const d = cv._dots.find(d => Math.hypot(d.x - x, d.y - y) < d.r + 6); if (d) { showTip('Piso ' + d.b.row + ' · ' + d.b.n + ' muerte' + (d.b.n === 1 ? '' : 's') + ' (' + Object.entries(d.b.causes).map(([k, v]) => (CAUSES[k] || k).toLowerCase() + ' ' + v).join(', ') + ')', e.clientX, e.clientY); return; } }
  hideTip();
});
$('#statsBody').addEventListener('pointerleave', hideTip);
$('#statsBody').addEventListener('click', e => {
  const h = e.target.closest('[data-heat]'); if (h) { heatLevel = +h.dataset.heat; renderStats(); return; }
  if (e.target.closest('[data-go="play"]')) setView('play');
});

/* ============================================================
   Vistas
   ============================================================ */
function setView(v, fromHash) {
  view = v; const stats = v === 'stats';
  if (stats && mode === 'playing') pause();
  $('#viewPlay').hidden = stats; $('#viewStats').hidden = !stats;
  $('#tabPlay').setAttribute('aria-selected', String(!stats)); $('#tabStats').setAttribute('aria-selected', String(stats));
  if (!fromHash) { try { history.replaceState(null, '', stats ? '#estadisticas' : '#jugar'); } catch (e) { /* hash no disponible */ } }
  hideTip();
  if (stats) { if (Store.mode === 'supabase') Store.pull(); renderStats(); } else { requestAnimationFrame(resize); }
}
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => setView(t.dataset.view)));
window.addEventListener('hashchange', () => setView(location.hash === '#estadisticas' ? 'stats' : 'play', true));
