'use strict';

/* ============================================================
   Configuración
   ============================================================ */
const CONFIG = Object.assign({
  // Conexión a Supabase (PostgreSQL) para reunir las partidas de todo el grupo cuando el juego
  // está publicado fuera de Claude, por ejemplo en Netlify. Se llenan en config.js (ver LEEME.md).
  SUPABASE_URL: '',
  SUPABASE_KEY: '', // llave publicable (sb_publishable_…) o la anon key heredada
  // Rutas opcionales a ilustraciones (por ejemplo, generadas con Gemini). Vacío = ilustración dibujada.
  ART: { intro1:'', intro2:'', intro3:'', intro4:'', rescue1:'', rescue2:'', rescue3:'', rescue4:'', rescue5:'', rescue6:'', ending:'' }
}, window.TORRE_CONFIG || {});

/* ============================================================
   Utilidades
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const canvas = $('#gameCanvas'), ctx = canvas.getContext('2d');
let g = ctx; // contexto de dibujo activo (se cambia para viñetas y mapas)
const W = 760, H = 840, CELL = 82, RISE = 68, BASE = 756, JUMP = .5;
const QA = new URLSearchParams(location.search).has('qa');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches; // pantalla táctil
const inClaude = !!(window.claude && typeof window.claude.use === 'function');
const lerp = (a, b, t) => a + (b - a) * t, clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const smooth = u => u * u * (3 - 2 * u), easeOut = u => 1 - Math.pow(1 - u, 3);
const P = (x, y) => ({ x, y });
const mod = (a, n) => ((a % n) + n) % n;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = t => { const s = Math.max(0, Math.floor(t || 0)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } }
};
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
if (!CanvasRenderingContext2D.prototype.roundRect) {
  // Bug #3: Safari < 16 y navegadores viejos no tienen roundRect y el juego dejaba de dibujar.
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.min(typeof r === 'number' ? r : 0, Math.abs(w) / 2, Math.abs(h) / 2);
    this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); return this;
  };
}
