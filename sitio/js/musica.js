'use strict';

/* ============================================================
   Música (reglas puras): qué suena en cada momento y qué notas toca.
   No usa audio ni DOM, así que se prueba con `node --test tests/`.
   El motor que la toca con Web Audio está en estado.js.
   ============================================================ */
const Musica = {
  STEPS: 16,                    // pasos (semicorcheas) por compás
  BARS: 4,                      // una pieza dura cuatro compases y se repite
  SCALES: {
    major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10],
    minor: [0, 2, 3, 5, 7, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10]
  },

  /* Una pieza por ambiente. root = nota MIDI; prog = grado de la escala de cada compás;
     bass y lead son patrones de 16 pasos ('x' golpe; dígito = nota del acorde 0 a 3). */
  THEMES: {
    menu:       { root: 50, scale: 'dorian',   bpm: 78,  level: 1, prog: [0, 3, 5, 4], bass: 'x.......x.......', lead: '0.......2...1...' },
    morning:    { root: 55, scale: 'major',    bpm: 96,  level: 1, prog: [0, 4, 5, 3], bass: 'x..x..x.x..x..x.', lead: '0.1.2.3.2.1.0...' },
    greenhouse: { root: 52, scale: 'dorian',   bpm: 88,  level: 1, prog: [0, 2, 3, 4], bass: 'x.....x.x.......', lead: '..0..1..2..1..0.' },
    storm:      { root: 52, scale: 'phrygian', bpm: 108, level: 2, prog: [0, 5, 3, 4], bass: 'x.x.x.x.x.x.x.xx', lead: '0..0.2..0..3.2..' },
    warehouse:  { root: 45, scale: 'minor',    bpm: 104, level: 2, prog: [0, 0, 5, 4], bass: 'x...x...x...x.x.', lead: '0.0.0.0.2.2.1.1.' },
    cold:       { root: 54, scale: 'major',    bpm: 72,  level: 1, prog: [0, 5, 3, 4], bass: 'x...............', lead: '3.....2.....1...' },
    server:     { root: 48, scale: 'minor',    bpm: 118, level: 2, prog: [0, 5, 6, 4], bass: 'x.x.xx.xx.x.xx.x', lead: '0.1.2.1.0.1.3.2.' },
    final:      { root: 50, scale: 'minor',    bpm: 112, level: 2, prog: [0, 5, 3, 6], bass: 'x..xx..xx..xx..x', lead: '0.2.3.2.0.2.3.1.' },
    chase:      { root: 50, scale: 'phrygian', bpm: 148, level: 3, prog: [0, 1, 0, 4], bass: 'x.x.x.x.x.x.x.x.', lead: '0.2.0.3.0.2.0.3.' },
    endless:    { root: 47, scale: 'minor',    bpm: 104, level: 1, prog: [0, 5, 3, 4], bass: 'x.x.x.x.x.x.x.x.', lead: '0.1.2.3.2.1.0.1.' }
  },
  FILL: '.1.2.3.2.1.2.3.1',       // relleno que se suma a la melodía en la máxima intensidad
  ENDLESS_STEP_BPM: 7,           // cuánto acelera cada nivel de dificultad del modo infinito
  ENDLESS_MAX_TIER: 5,

  stepSeconds: bpm => 60 / bpm / 4,
  hz: midi => 440 * Math.pow(2, (midi - 69) / 12),

  /* Decide qué pieza suena según el estado del juego. */
  scene(s) {
    if (!s) return { key: 'silent', silent: true, paused: false };
    if (s.mode === 'over' || s.mode === 'celebrate') return { key: 'silent', silent: true, paused: false };
    const paused = s.mode === 'paused';
    const make = (key, name, o = {}) => {
      const t = Musica.THEMES[name];
      return { key, theme: name, root: t.root + (o.shift || 0), scale: o.scale || t.scale, bpm: Math.round(t.bpm + (o.bpm || 0)),
        intensity: Math.min(3, t.level + (o.more || 0)), silent: false, paused };
    };
    if (s.mode === 'menu') return make('menu', 'menu');
    const down = s.phase === 'down';
    if (s.endless) {
      const tier = Math.max(0, Math.min(Musica.ENDLESS_MAX_TIER, s.tier | 0));
      return make('endless-' + tier, 'endless', { bpm: tier * Musica.ENDLESS_STEP_BPM, more: Math.floor((tier + 1) / 2) });
    }
    if (s.chase) return make('chase', 'chase');
    const name = s.level === 7 ? 'final' : Musica.THEMES[s.theme] ? s.theme : 'morning';
    const key = (s.level === 7 ? 'final' : name) + (down ? '-down' : '-up');
    return make(key, name, down ? { shift: -3, scale: 'minor', bpm: 6, more: 1 } : {});
  },

  /* Notas que empiezan en un paso (contado desde que arranca la pieza). Cada nota:
     { voice, midi, steps, vel }. voice = pad | bass | lead | tick. */
  events(sc, step) {
    if (!sc || sc.silent) return [];
    const t = Musica.THEMES[sc.theme]; if (!t) return [];
    const n = Musica.STEPS, pos = ((step % n) + n) % n, bar = Math.floor(step / n) % Musica.BARS, scale = Musica.SCALES[sc.scale];
    const degree = i => scale[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
    const d = t.prog[bar], chord = [d, d + 2, d + 4, d + 7].map(degree);
    const out = [];
    if (pos === 0) for (const c of chord.slice(0, 3)) out.push({ voice: 'pad', midi: sc.root + c, steps: n, vel: .5 });
    if (t.bass[pos] === 'x') out.push({ voice: 'bass', midi: sc.root - 12 + chord[0], steps: 2, vel: .8 });
    if (sc.intensity >= 1) {
      let c = t.lead[pos]; if (c === '.' && sc.intensity >= 3) c = Musica.FILL[pos];
      if (c !== '.') out.push({ voice: 'lead', midi: sc.root + 12 + chord[Number(c)], steps: 2, vel: .6 });
    }
    if ((sc.intensity >= 2 && pos % 4 === 2) || (sc.intensity >= 3 && pos % 2 === 0)) out.push({ voice: 'tick', midi: sc.root + 24, steps: 1, vel: .4 });
    return out;
  }
};

if (typeof module !== 'undefined') module.exports = Musica;
