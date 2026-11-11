'use strict';

/* ============================================================
   Estadísticas
   ============================================================ */
const sum = a => a.reduce((s, v) => s + v, 0), avg = a => a.length ? sum(a) / a.length : null;
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
let heatLevel = 0;
const CAUSE_COLORS = { hueco: 'var(--pond)', dron: 'var(--danger)', vidrio: 'var(--reed)', apagon: 'var(--duck)', viento: 'var(--muted)' };
const CHAPTER_COLORS = ['var(--pond)', 'var(--reed)', 'var(--sodium)', 'var(--duck)', 'var(--danger)', 'var(--muted)', 'var(--ink)'];
const EMOTION_COLORS = ['var(--pond)', 'var(--sodium)', 'var(--reed)', 'var(--danger)', 'var(--muted)'];
let statsV = null;   // 2, 1, 'cmp' (antes / después) o 'endless'; se elige sola la primera vez
const statsRuns = () => { const all = Store.all(), story = all.filter(r => !Metricas.isEndless(r)); return { all, endless: all.filter(Metricas.isEndless), 1: story.filter(r => Metricas.versionOf(r) === 1), 2: story.filter(r => Metricas.versionOf(r) === 2) }; };
const levelsOf = v => v === 1 ? LEVELS_V1 : LEVELS;
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
  const data = statsRuns(), me = run && run.id;
  if (!data.all.length) {
    body.innerHTML = `<div class="empty"><h3>Nadie ha jugado. Todavía.</h3><p>Cuando alguien juegue, aquí aparecerán el avance por capítulo, el mapa de muertes, los récords y las respuestas de la encuesta.</p><button class="btn duck" data-go="play">${ICON_PLAY}Jugar la primera partida</button></div>`;
    return;
  }
  if (statsV == null) statsV = data[2].length ? 2 : data[1].length ? 1 : 'endless';
  const n1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toLocaleString('es-MX');
  const tabs = `<div class="seg ver-seg" role="group" aria-label="Versión del juego">
    <button data-ver="2" aria-pressed="${statsV === 2}">Versión 2 · 7 capítulos <small>${data[2].length}</small></button>
    <button data-ver="1" aria-pressed="${statsV === 1}">Versión 1 · 3 capítulos <small>${data[1].length}</small></button>
    <button data-ver="cmp" aria-pressed="${statsV === 'cmp'}">Antes / después</button>
    <button data-ver="endless" aria-pressed="${statsV === 'endless'}">Modo infinito <small>${data.endless.length}</small></button></div>`;
  if (statsV === 'cmp') { body.innerHTML = tabs + compareHtml(data, n1); return; }
  if (statsV === 'endless') { body.innerHTML = tabs + endlessHtml(data.endless, n1, me); return; }
  const runs = data[statsV], lv = levelsOf(statsV), n = lv.length;
  if (!runs.length) { body.innerHTML = tabs + `<div class="empty"><h3>Todavía no hay partidas de la versión ${statsV}.</h3><p>${statsV === 2 ? 'Juega una partida y vuelve.' : 'Las partidas del prototipo de tres capítulos aparecerían aquí.'}</p></div>`; return; }
  const s = Metricas.compute(runs, n), v2 = statsV === 2, short = l => l.name.replace(/^(La|El) /, '').replace(' de Entregas Ya!', '');
  const heatable = lv.map((l, i) => l.generated ? -1 : i).filter(i => i >= 0); if (!heatable.includes(heatLevel)) heatLevel = 0;
  body.innerHTML = tabs + `
  <div class="kpis">
    <div class="kpi"><span>Partidas</span><strong>${s.runs}</strong><small>${s.players} nombre${s.players === 1 ? '' : 's'} en el tablero</small></div>
    <div class="kpi"><span>Terminaron la historia</span><strong>${pct(s.finished.length, s.runs)}%</strong><small>${s.finished.length} de ${s.runs} partidas</small></div>
    <div class="kpi"><span>Tiempo mediano total</span><strong>${s.medTotal == null ? '—' : fmt(s.medTotal)}</strong><small>de quienes terminaron</small></div>
    <div class="kpi"><span>Muertes por partida</span><strong>${n1(s.fallsAvg)}</strong><small>${s.deathsPerMin == null ? 'promedio' : n1(s.deathsPerMin) + ' por minuto de juego'}</small></div>
  </div>
  <div class="grid2">
    <section class="panel"><h3>¿Hasta dónde llegan?</h3><p class="sub">Partidas que alcanzaron cada punto de la historia.</p>
      ${bars([{ label: 'Empezaron cap. 1', value: s.per[0].started }].concat(lv.map((l, i) => ({ label: 'Cap. ' + (i + 1) + ' · ' + l.sibling, value: s.per[i].done })), [{ label: 'Respondieron encuesta', value: s.surveys }]).map(i => Object.assign(i, { tip: i.label + ': ' + i.value + ' (' + pct(i.value, s.per[0].started) + '%)' })), v => v)}
    </section>
    <section class="panel"><h3>Por capítulo</h3><p class="sub">Tiempo mediano de quienes lo terminaron${v2 ? ', separado en subida y bajada' : ''}; muertes y drones en promedio.</p>
      <div class="table-wrap"><table><thead><tr><th>Capítulo</th><th class="num">Tiempo</th>${v2 ? '<th class="num">Subida</th><th class="num">Bajada</th>' : ''}<th class="num">Muertes</th><th class="num">Pluma</th><th class="num">Drones</th></tr></thead><tbody>
      ${s.per.map((p, i) => `<tr><td>${i + 1}. ${esc(short(lv[i]))}</td><td class="num">${p.time == null ? '—' : fmt(p.time)}</td>${v2 ? `<td class="num">${p.up == null ? '—' : fmt(p.up)}</td><td class="num">${p.down == null ? '—' : fmt(p.down)}</td>` : ''}<td class="num">${n1(p.falls)}</td><td class="num">${p.done ? p.feather + '%' : '—'}</td><td class="num">${n1(p.kills)}</td></tr>`).join('')}
      </tbody></table></div>
    </section>
  </div>
  <div class="grid2">
    <section class="panel"><h3>Por capítulo, en gráfica</h3><p class="sub">Muertes promedio por partida y tiempo mediano de quienes lo terminaron.</p>
      <div class="chart-pair">
        <div><h4>Muertes promedio</h4>${cols(s.per.map((p, i) => ({ label: (n > 4 ? '' : 'Cap. ') + (i + 1), value: p.started ? p.falls : null, tip: lv[i].name + ': ' + n1(p.falls) + ' muertes en promedio' })), n1, 'var(--danger)')}</div>
        <div><h4>Tiempo mediano</h4>${cols(s.per.map((p, i) => ({ label: (n > 4 ? '' : 'Cap. ') + (i + 1), value: p.time, tip: lv[i].name + ': ' + (p.time == null ? 'nadie lo ha terminado' : fmt(p.time)) })), fmt, 'var(--pond)')}</div>
      </div>
    </section>
    <section class="panel"><h3>¿De qué muere la gente?</h3><p class="sub">Todas las muertes registradas, por causa.${v2 && s.downDeaths ? ' ' + s.downDeaths + ' ocurrieron en la bajada.' : ''}</p>
      ${pie(Object.keys(CAUSES).filter(k => v2 || k !== 'viento').map(k => ({ label: CAUSES[k], value: s.causes[k] || 0, color: CAUSE_COLORS[k] })), 'muertes')}
    </section>
  </div>
  <div class="grid2">
    <section class="panel"><h3>Dónde muere la gente</h3><p class="sub">Cada punto es un lugar donde alguien perdió a Pipo; más grande = más muertes.${v2 ? ' La torre final no aparece porque cambia en cada partida.' : ' Las caídas de hasta 3 pisos no cuentan.'}</p>
      <div class="seg" role="group" aria-label="Capítulo del mapa">${heatable.map(i => `<button data-heat="${i}" aria-pressed="${i === heatLevel}">Cap. ${i + 1}</button>`).join('')}</div>
      <canvas class="heat" id="heatCanvas" width="560" height="600" aria-label="Mapa de muertes del capítulo ${heatLevel + 1}"></canvas>
      <div class="heat-legend" id="heatLegend"></div>
    </section>
    <section class="panel"><h3>Encuesta</h3><p class="sub">${s.surveys} respuesta${s.surveys === 1 ? '' : 's'}.${v2 && s.assisted ? ' ' + s.assisted + ' partida' + (s.assisted === 1 ? ' usó' : 's usaron') + ' el modo asistido.' : ''}</p>
      <div class="stat-pair"><div>Diversión<strong>${n1(s.fun)}<small> / 5</small></strong></div><div>Claridad de controles<strong>${n1(s.clarity)}<small> / 5</small></strong></div></div>
      <h4>Dificultad</h4>${cols(SURVEY[1].opts.map((o, k) => ({ label: o, value: s.difficulty[k], tip: o + ': ' + s.difficulty[k] + ' (' + pct(s.difficulty[k], s.surveys) + '%)' })), v => v)}
      <h4>Capítulo favorito</h4>${pie(lv.map((l, k) => ({ label: l.name, value: s.favorite[k], color: CHAPTER_COLORS[k] })), 'votos')}
      <h4>Emoción principal</h4>${pie(SURVEY[4].opts.map((o, k) => ({ label: o, value: s.emotion[k], color: EMOTION_COLORS[k] })), 'votos')}
    </section>
  </div>
  <div class="grid2">
    <section class="panel"><h3>Tablero de récords</h3><p class="sub">Quienes terminaron los ${n} expedientes y firmaron.</p>
      ${s.board.length ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Nombre</th><th class="num">Tiempo</th><th class="num">Muertes</th><th class="num">Plumas</th></tr></thead><tbody>
      ${s.board.map((r, i) => `<tr class="${r.id === me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.nick)}</td><td class="num">${fmt(r.totalTime)}</td><td class="num">${sum(r.levels.filter(Boolean).map(l => l.falls || 0))}</td><td class="num">${r.levels.filter(l => l && l.feather).length}/${n}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="sub">Nadie ha registrado un récord todavía.</p>'}
    </section>
    <section class="panel"><h3>Comentarios recientes</h3><p class="sub">Lo que escribieron al final, sin editar.</p>
      ${s.comments.length ? `<div class="quotes">${s.comments.map(r => `<div class="quote">${esc(r.survey.comment)}<small>Favorito: ${esc(lv[r.survey.favorite] ? lv[r.survey.favorite].name : '—')} · ${esc(SURVEY[4].opts[r.survey.emotion] || '')}</small></div>`).join('')}</div>` : '<p class="sub">Todavía no hay comentarios.</p>'}
    </section>
  </div>`;
  drawHeat(runs, lv);
}
/* Modo infinito: cuánto sube la gente y quién va primero */
function endlessHtml(runs, n1, me) {
  const e = Metricas.endless(runs), labels = ['0 a 11', '12 a 23', '24 a 35', '36 a 47', '48 a 59', '60 o más'];
  if (!e.runs) return '<div class="empty"><h3>Nadie ha subido el modo infinito todavía.</h3><p>Se desbloquea al terminar los siete expedientes.</p></div>';
  return `<div class="kpis">
    <div class="kpi"><span>Intentos</span><strong>${e.runs}</strong><small>${e.players} nombre${e.players === 1 ? '' : 's'} en el tablero</small></div>
    <div class="kpi"><span>Mejor piso</span><strong>${e.best}</strong><small>el récord del grupo</small></div>
    <div class="kpi"><span>Piso mediano</span><strong>${n1(e.medFloors)}</strong><small>de todos los intentos</small></div>
    <div class="kpi"><span>Tiempo mediano</span><strong>${e.medTime == null ? '—' : fmt(e.medTime)}</strong><small>hasta que el apagón alcanza</small></div>
  </div>
  <div class="grid2">
    <section class="panel"><h3>¿Hasta dónde llegan?</h3><p class="sub">Intentos según el piso al que llegaron.</p>
      ${cols(labels.map((l, i) => ({ label: l, value: e.bins[i], tip: l + ' pisos: ' + e.bins[i] + ' intento' + (e.bins[i] === 1 ? '' : 's') })), v => v, 'var(--pond)')}
    </section>
    <section class="panel"><h3>Tablero del modo infinito</h3><p class="sub">El mejor intento de cada nombre.${e.assisted ? ' ' + e.assisted + ' intento' + (e.assisted === 1 ? '' : 's') + ' con modo asistido.' : ''}</p>
      ${e.board.length ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>Nombre</th><th class="num">Pisos</th><th class="num">Tiempo</th></tr></thead><tbody>
      ${e.board.map((r, i) => `<tr class="${r.id === me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.nick)}${r.assist ? ' <small>· asistido</small>' : ''}</td><td class="num">${r.floors}</td><td class="num">${fmt(r.totalTime)}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="sub">Nadie ha firmado todavía.</p>'}
    </section>
  </div>`;
}
/* Antes / después: cada métrica de las dos versiones, junto a la observación que motivó el cambio */
function compareHtml(data, n1) {
  if (!data[1].length || !data[2].length) return `<div class="empty"><h3>Falta una de las dos versiones.</h3><p>La comparación necesita partidas de la versión 1 (${data[1].length}) y de la versión 2 (${data[2].length}).</p></div>`;
  const rows = Metricas.compare(Metricas.compute(data[1], LEVELS_V1.length), Metricas.compute(data[2], LEVELS.length));
  const show = (r, v) => v == null ? '—' : r.kind === 'time' ? fmt(v) : r.kind === 'pct' ? v + '%' : n1(v);
  const mark = r => { if (r.v1 == null || r.v2 == null || !r.want || r.v1 === r.v2) return '<td class="num delta">·</td>'; const up = r.v2 > r.v1, good = up === (r.want === 'up'); return `<td class="num delta ${good ? 'good' : 'bad'}">${up ? '▲' : '▼'} ${good ? 'como se buscaba' : 'al revés de lo buscado'}</td>`; };
  return `<section class="panel"><h3>Antes y después</h3><p class="sub">Versión 1: el prototipo de tres capítulos. Versión 2: el juego de siete, con ida y vuelta. Cada fila responde a una observación de la versión 1.</p>
    <div class="table-wrap"><table class="cmp"><thead><tr><th>Métrica</th><th class="num">Versión 1</th><th class="num">Versión 2</th><th class="num">Cambio</th><th>Observación que la motivó</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${esc(r.label)}</td><td class="num">${show(r, r.v1)}</td><td class="num"><b>${show(r, r.v2)}</b></td>${mark(r)}<td class="why">${esc(r.why)}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="sub">La versión 2 es mucho más larga: por eso «terminan la historia» y «muertes por partida» no se comparan directo, y se usa «muertes por minuto».</p></section>`;
}
function drawHeat(runs, levels) {
  const cv = $('#heatCanvas'); if (!cv) return;
  const lvl = levels[heatLevel], n = lvl.rows.length, HX = 74, RY = 46, SK = 11, cx = 300, topY = 84;
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
    (r.cells || []).concat((r.gate || []).map(q => q.x), r.belt ? r.belt.cells : []).forEach(x => plat(x, row, dark ? '#2e5a40' : '#bfdcc4'));
    (r.ice || []).forEach(x => plat(x, row, dark ? '#3a6268' : '#d3edf4'));
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
  const ver = e.target.closest('[data-ver]'); if (ver) { statsV = ver.dataset.ver === 'cmp' || ver.dataset.ver === 'endless' ? ver.dataset.ver : +ver.dataset.ver; heatLevel = 0; renderStats(); return; }
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
