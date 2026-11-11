'use strict';

/* ============================================================
   Métricas del dashboard (puras: se prueban con `node --test tests/`)
   Versión 1 = el prototipo de tres capítulos. Versión 2 = el juego de siete.
   ============================================================ */
const Metricas = {
  sum: a => a.reduce((s, v) => s + v, 0),
  avg: a => a.length ? Metricas.sum(a) / a.length : null,
  median(a) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; },
  pct: (a, b) => b ? Math.round(a / b * 100) : 0,
  versionOf: run => +run.v >= 2 ? 2 : 1,

  /* Todo lo que muestra el dashboard para un grupo de partidas; n = capítulos de esa versión */
  compute(runs, n) {
    const { sum, avg, median, pct } = Metricas;
    const lv = i => runs.map(r => r.levels[i]).filter(Boolean);
    const per = Array.from({ length: n }, (_, i) => {
      const all = lv(i), done = all.filter(l => l.done), timed = done.filter(l => typeof l.upTime === 'number');
      return { started: all.length, done: done.length, time: median(done.map(l => l.time)), up: median(timed.map(l => l.upTime)), down: median(timed.map(l => l.time - l.upTime)),
        falls: avg(all.map(l => l.falls || 0)), feather: pct(done.filter(l => l.feather).length, done.length), kills: avg(all.map(l => l.kills || 0)), restarts: avg(all.map(l => l.restarts || 0)) };
    });
    const finished = runs.filter(r => r.completed >= n), surveys = runs.map(r => r.survey).filter(Boolean);
    const count = (key, size) => { const c = Array(size).fill(0); surveys.forEach(s => { if (s[key] != null && c[s[key]] != null) c[s[key]]++; }); return c; };
    const levels = runs.flatMap(r => r.levels.filter(Boolean)), deaths = levels.flatMap(l => l.deaths || []);
    const causes = deaths.reduce((c, d) => { c[d[2]] = (c[d[2]] || 0) + 1; return c; }, {});
    const minutes = sum(levels.map(l => l.time || 0)) / 60, falls = sum(levels.map(l => l.falls || 0));
    return {
      n, runs: runs.length, players: new Set(runs.filter(r => r.nick).map(r => String(r.nick).toLowerCase())).size, per, finished,
      medTotal: median(finished.map(r => r.totalTime)), fallsAvg: avg(runs.map(r => sum(r.levels.filter(Boolean).map(l => l.falls || 0)))),
      passCh1: pct(per[1] ? per[1].started : 0, per[0].started),
      deathsPerMin: minutes ? Math.round(falls / minutes * 100) / 100 : null,
      punchPerRun: avg(runs.map(r => sum(r.levels.filter(Boolean).map(l => l.kills || 0)))),
      droneShare: pct(causes.dron || 0, deaths.length), downDeaths: deaths.filter(d => d[3] === 'd').length, assisted: runs.filter(r => r.assist).length,
      surveys: surveys.length, fun: avg(surveys.map(s => s.fun)), clarity: avg(surveys.map(s => s.clarity)), causes,
      difficulty: count('difficulty', 5), favorite: count('favorite', n), emotion: count('emotion', 5),
      comments: runs.filter(r => r.survey && r.survey.comment).sort((a, b) => (b.survey.at || '').localeCompare(a.survey.at || '')).slice(0, 8),
      board: finished.filter(r => r.nick).sort((a, b) => a.totalTime - b.totalTime).slice(0, 10)
    };
  },

  /* Antes / después: una fila por métrica, con la observación de la versión 1 que busca responder.
     `kind` dice cómo mostrarla: time (segundos), pct, num. `want` es hacia dónde se buscaba moverla. */
  compare(a, b) {
    const { pct } = Metricas, row = (key, label, kind, want, why, f) => ({ key, label, kind, want, why, v1: f(a), v2: f(b) });
    return [
      row('runs', 'Partidas registradas', 'num', null, 'Tamaño de la muestra de cada versión.', s => s.runs),
      row('passCh1', 'Pasan del capítulo 1 al 2', 'pct', 'up', 'En la versión 1, 12 de 37 partidas nunca empezaron el capítulo 2.', s => s.passCh1),
      row('finished', 'Terminan la historia', 'pct', null, 'La versión 2 es mucho más larga, así que no se espera que suba.', s => pct(s.finished.length, s.runs)),
      row('medTotal', 'Tiempo mediano total', 'time', 'up', 'La versión 1 era muy corta: duraba menos de minuto y medio.', s => s.medTotal),
      row('punchPerRun', 'Drones golpeados por partida', 'num', 'up', 'En la versión 1 el golpe casi no se usaba.', s => s.punchPerRun),
      row('droneShare', 'Muertes causadas por drones', 'pct', 'down', 'En la versión 1, 83 % de las muertes eran por un solo obstáculo.', s => s.droneShare),
      row('deathsPerMin', 'Muertes por minuto de juego', 'num', null, 'Compara la dificultad sin que pese la duración.', s => s.deathsPerMin),
      row('fair', 'Sintieron la dificultad «justa»', 'pct', 'up', 'En la versión 1 tendía a fácil y pedían más reto.', s => s.surveys ? pct(s.difficulty[2], s.surveys) : null),
      row('fun', 'Diversión (1 a 5)', 'num', 'up', 'Que alargar el juego no lo vuelva aburrido.', s => s.fun),
      row('clarity', 'Claridad de los controles (1 a 5)', 'num', 'up', 'Que las mecánicas nuevas no confundan.', s => s.clarity)
    ];
  }
};

if (typeof module !== 'undefined') module.exports = Metricas;
