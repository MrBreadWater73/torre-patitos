'use strict';

/* ============================================================
   Estado
   ============================================================ */
const ui = {
  overlay: $('#overlay'), card: $('#overlayCard'), zone: $('#zoneLabel'), chips: LEVELS.map((l, i) => { const c = document.createElement('span'); c.className = 'chip'; c.id = 'chip' + (i + 1); c.title = 'Capítulo ' + (i + 1); c.textContent = i + 1; $('#chips').appendChild(c); return c; }),
  sound: $('#soundBtn'), pause: $('#pauseBtn'), restart: $('#restartBtn'), punch: $('#punchBtn'),
  height: $('#heightLabel'), fill: $('#progressFill'), track: $('#progressTrack'),
  sideRibbon: $('#sideRibbon'), sideTitle: $('#sideTitle'), sideObjective: $('#sideObjective'), sideTip: $('#sideTip'),
  time: $('#statTime'), total: $('#statTotal'), falls: $('#statFalls'), drones: $('#statDrones'), feather: $('#statFeather'), packages: $('#statPackages'), rowPackages: $('#rowPackages'),
  legend: $('#legend'), live: $('#live'), assist: $('#assistToggle'), tooltip: $('#tooltip')
};

let L = LEVELS[0];
let mode = 'menu';           // menu | playing | paused | celebrate | over
let view = 'play';
let clock = 0, amb = 0, cam = 0, flyover = null, shake = 0, flash = 0, nextFlash = 5;
let player, checkpoint, drones = [], crumbles = new Map(), flags = new Map(), featherGot = false;
let particles = [], hover = null, hitAreas = [], cooldown = 0, punch = null, pending = null, celebrate = null;
let blinkEye = { next: 2.5, until: 0 }, sibBlink = { next: 3.2, until: 0 };
let sound = store.get('torrePatitos.sound', false), audio = null, combat = true;
let phase = 'up', levers = new Map(), trail = null, followers = [], chaseT = 0, chaseY = 99, dusk = 0, sibQuip = null, nextQuip = 0, leverHit = null, gotPk = new Set(); // ida y vuelta, palancas, paquetes
let assist = store.get('torrePatitos.assist', false), assistTold = false; // modo asistido
let riseT = 0, riseY = -99; // modo infinito: tiempo del apagón y piso hasta el que llegó
let pots = [], plugs = new Set(), beltT = 0, windT = 0; // macetas, bandas, viento
let run = null, ls = null, lastHud = '', lastStamp = 0, vignette = null, storyIndex = 0;

/* ============================================================
   Sonido (síntesis simple, sin archivos)
   ============================================================ */
const TONES = {
  hop: [[520, 700, .09, 'sine', .035]], land: [[200, 130, .06, 'triangle', .04]],
  fall: [[300, 90, .32, 'sine', .05]], checkpoint: [[600, 840, .14, 'sine', .04], [840, 1060, .16, 'sine', .035, .11]],
  feather: [[880, 1320, .18, 'sine', .04], [1320, 1760, .24, 'sine', .03, .13]], punch: [[160, 330, .08, 'square', .02]],
  destroy: [[420, 80, .22, 'sawtooth', .02]], crack: [[1500, 700, .08, 'triangle', .03], [900, 450, .1, 'triangle', .025, .07]],
  thunder: [[75, 38, .9, 'sine', .07]],
  lever: [[220, 440, .07, 'square', .03], [660, 880, .12, 'sine', .035, .07]], package: [[660, 990, .1, 'sine', .04], [990, 1320, .16, 'sine', .035, .1]],
  stun: [[900, 200, .18, 'square', .025], [180, 120, .2, 'triangle', .03, .1]], slide: [[900, 500, .2, 'sine', .018]], gust: [[240, 120, .4, 'triangle', .02]], alarm: [[620, 620, .16, 'square', .02], [460, 460, .16, 'square', .02, .2]], click: [[700, 780, .05, 'sine', .025]],
  whoosh: [[620, 220, .35, 'triangle', .025]], thud: [[140, 55, .18, 'sine', .07], [90, 40, .12, 'triangle', .04, .02]],
  win: [[523, 523, .13, 'sine', .045], [659, 659, .13, 'sine', .045, .13], [784, 784, .13, 'sine', .045, .26], [1047, 1047, .34, 'sine', .045, .39]]
};
function tone(kind) {
  if (!sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    for (const [a, b, d, type, vol, off = 0] of TONES[kind] || TONES.hop) {
      const o = audio.createOscillator(), gn = audio.createGain(), n = audio.currentTime + off;
      o.type = type; o.frequency.setValueAtTime(a, n); o.frequency.exponentialRampToValueAtTime(b, n + d);
      gn.gain.setValueAtTime(.0001, n); gn.gain.exponentialRampToValueAtTime(vol, n + .012); gn.gain.exponentialRampToValueAtTime(.0001, n + d);
      o.connect(gn); gn.connect(audio.destination); o.start(n); o.stop(n + d + .03);
    }
  } catch (e) { /* sin audio */ }
}
function updateSoundUI() {
  ui.sound.classList.toggle('on', sound); ui.sound.setAttribute('aria-pressed', String(sound));
  const label = sound ? 'Silenciar' : 'Activar sonido'; ui.sound.setAttribute('aria-label', label); ui.sound.title = label;
  $('#soundPath').setAttribute('d', sound ? 'M16 8q5 4 0 8M19 5q8 7 0 14' : 'm16 9 5 6m0-6-5 6');
}
/* ============================================================
   Música (síntesis con Web Audio; las piezas están en musica.js)
   Sigue al botón de sonido y se decide cada cuadro según el estado del juego.
   ============================================================ */
const MUSIC_LEVEL = .6, MUSIC_LOOKAHEAD = .4;
const MUSIC_VOL = { pad: .016, bass: .05, lead: .026, tick: .012 };
const music = { key: null, bus: null, scene: null, step: 0, at: 0, timer: 0 };
function musicBus(ctx, dest) {
  const g = ctx.createGain(), f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 2600; g.gain.value = .0001; g.connect(f); f.connect(dest);
  return g;
}
function musicVoice(ctx, bus, ev, when, sec) {
  const dur = ev.steps * sec, vol = MUSIC_VOL[ev.voice] * ev.vel, g = ctx.createGain();
  g.connect(bus);
  if (ev.voice === 'tick') {
    if (!ctx.noise) { ctx.noise = ctx.createBuffer(1, 2048, ctx.sampleRate); const d = ctx.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500;
    src.buffer = ctx.noise; src.connect(hp); hp.connect(g);
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(.0001, when + .045); src.start(when); src.stop(when + .05);
    return;
  }
  const o = ctx.createOscillator(), attack = ev.voice === 'pad' ? Math.min(.3, dur / 3) : .012;
  o.type = ev.voice === 'pad' ? 'sine' : ev.voice === 'bass' ? 'triangle' : 'square';
  o.frequency.value = Musica.hz(ev.midi); o.connect(g);
  g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + attack); g.gain.exponentialRampToValueAtTime(.0001, when + dur * (ev.voice === 'pad' ? .98 : .9));
  o.start(when); o.stop(when + dur + .05);
}
function musicSchedule(ctx, bus, sc, step, when) {
  const sec = Musica.stepSeconds(sc.bpm);
  for (const ev of Musica.events(sc, step)) musicVoice(ctx, bus, ev, when, sec);
}
function musicPump() {
  const m = music; if (!m.scene || !m.bus || !audio) return;
  const sec = Musica.stepSeconds(m.scene.bpm);
  while (m.at < audio.currentTime + MUSIC_LOOKAHEAD) { musicSchedule(audio, m.bus, m.scene, m.step, m.at); m.at += sec; m.step++; }
}
function musicStop(fade = .45) {
  const m = music; clearInterval(m.timer); m.timer = 0;
  if (m.bus && audio) {
    const old = m.bus, t = audio.currentTime; old.gain.cancelScheduledValues(t); old.gain.setTargetAtTime(.0001, t, fade / 3);
    setTimeout(() => { try { old.disconnect(); } catch (e) { /* ya desconectado */ } }, fade * 1000 + 400);
  }
  m.bus = null; m.key = null; m.scene = null;
}
function musicSync(state) {
  try {
    const sc = sound ? Musica.scene(state) : null;
    if (!sc || sc.silent || sc.paused) { if (music.key) musicStop(); return; }
    if (sc.key === music.key) return;
    if (!audio) { if (!(navigator.userActivation && navigator.userActivation.hasBeenActive)) return; audio = new (window.AudioContext || window.webkitAudioContext)(); }
    if (audio.state === 'suspended') { audio.resume(); return; }
    if (music.key) musicStop(.5);
    music.bus = musicBus(audio, audio.destination);
    music.bus.gain.setValueAtTime(.0001, audio.currentTime); music.bus.gain.linearRampToValueAtTime(MUSIC_LEVEL, audio.currentTime + .6);
    music.key = sc.key; music.scene = sc; music.step = 0; music.at = audio.currentTime + .08;
    musicPump(); music.timer = setInterval(musicPump, 80);
  } catch (e) { /* sin audio */ }
}
/* Para pruebas: toca una pieza sin conexión y mide qué tan fuerte suena. */
async function musicRender(sc, seconds) {
  const rate = 22050, ctx = new OfflineAudioContext(1, rate * seconds, rate), bus = musicBus(ctx, ctx.destination), sec = Musica.stepSeconds(sc.bpm);
  bus.gain.value = MUSIC_LEVEL;
  for (let step = 0, at = 0; at < seconds; step++, at += sec) musicSchedule(ctx, bus, sc, step, at);
  const d = (await ctx.startRendering()).getChannelData(0);
  let peak = 0, sum = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; }
  return { key: sc.key, peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4) };
}
const announce = t => { ui.live.textContent = t; };
