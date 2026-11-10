'use strict';

/* ============================================================
   Guardado: Claude (db) → Supabase (PostgreSQL) → este navegador
   ============================================================ */
const Supa = {
  on: !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) && !inClaude,
  async rpc(fn, body) {
    const headers = { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_KEY };
    if (/^eyJ/.test(CONFIG.SUPABASE_KEY)) headers.Authorization = 'Bearer ' + CONFIG.SUPABASE_KEY; // llave anon heredada (JWT)
    const r = await fetch(CONFIG.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers, body: JSON.stringify(body || {}) });
    if (!r.ok) { let msg = r.status + ''; try { const j = await r.json(); msg = j.message || msg; } catch (e) { /* sin cuerpo */ } throw new Error(msg); }
    const t = await r.text(); return t ? JSON.parse(t) : null;
  }
};
function tokenFor(id) {
  const all = store.get('torrePatitos.tokens', {});
  if (!all[id]) { const a = new Uint8Array(16); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 256); all[id] = [...a].map(b => b.toString(16).padStart(2, '0')).join(''); store.set('torrePatitos.tokens', all); }
  return all[id];
}
function normalizeRun(r) {
  if (!r || !r.id) return null;
  const levels = []; (r.levels || []).forEach((l, i) => { if (l) levels[(l.n || i + 1) - 1] = l; });
  for (let i = 0; i < levels.length; i++) if (!levels[i]) levels[i] = null;
  return Object.assign({}, r, { levels, totalTime: +r.totalTime || 0, completed: +r.completed || 0 });
}
const Store = {
  mode: 'local', canWrite: true, remote: new Map(), queue: Promise.resolve(), db: null, ready: false, failed: false, lastError: '',
  local() { return store.get('torrePatitos.runs', []); },
  async init() {
    if (Supa.on) { this.mode = 'supabase'; await this.pull(); setInterval(() => { if (view === 'stats' && !document.hidden) this.pull(); }, 20000); }
    else if (inClaude) {
      try {
        const db = await window.claude.use('db');
        if (db) {
          this.db = db; this.mode = 'claude';
          const timer = setTimeout(() => { this.ready = true; renderStats(); }, 10000);
          db.collection('runs').limit(1000).onSnapshot(snap => {
            clearTimeout(timer); this.remote = new Map(snap.docs.filter(d => d.exists).map(d => [d.id, d.data()])); this.ready = true; renderStats();
          }, () => { clearTimeout(timer); this.ready = true; renderStats(); });
        }
      } catch (e) { this.mode = 'local'; }
    }
    this.ready = this.ready || this.mode === 'local'; renderStats();
  },
  async pull() {
    try { const list = await Supa.rpc('listar_partidas'); this.remote = new Map((list || []).map(normalizeRun).filter(Boolean).map(x => [x.id, x])); this.failed = false; }
    catch (e) { this.failed = true; this.lastError = e.message; }
    this.ready = true; renderStats();
  },
  save(r) {
    if (!r || !r.id) return;
    r.updatedAt = new Date().toISOString();
    const clean = JSON.parse(JSON.stringify(r, (k, v) => typeof v === 'number' ? Math.round(v * 100) / 100 : v));
    clean.levels = (clean.levels || []).map(l => l || null);
    const mine = this.local().filter(x => x.id !== clean.id); mine.push(clean); store.set('torrePatitos.runs', mine.slice(-30));
    this.queue = this.queue.then(() => this.push(clean)).catch(() => {});
    renderStats();
  },
  async push(clean) {
    if (this.mode === 'claude' && this.db && this.canWrite) {
      try { await this.db.collection('runs').doc(clean.id).set(clean); }
      catch (e) {
        if (e && (e.code === 'invalid_argument' || e.code === 'not_granted' || e.code === 'revoked')) { this.canWrite = false; renderStats(); }
        else if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 400 + Math.random() * 600)); try { await this.db.collection('runs').doc(clean.id).set(clean); } catch (_) { /* queda local */ } }
      }
    } else if (this.mode === 'supabase') {
      for (let attempt = 0; attempt < 2; attempt++) {
        try { await Supa.rpc('guardar_partida', { p: clean, p_token: tokenFor(clean.id) }); this.remote.set(clean.id, normalizeRun(clean)); this.failed = false; return; }
        catch (e) { this.lastError = e.message; if (attempt === 0) await new Promise(r => setTimeout(r, 800 + Math.random() * 800)); }
      }
      this.failed = true; renderStats();
    }
  },
  all() {
    const m = new Map(this.remote);
    for (const r of this.local()) { const o = m.get(r.id); if (!o || (o.updatedAt || '') < (r.updatedAt || '')) m.set(r.id, normalizeRun(r)); }
    return [...m.values()].filter(r => r && Array.isArray(r.levels));
  },
  shared() { return (this.mode === 'claude' && this.canWrite) || (this.mode === 'supabase' && !this.failed); },
  label() {
    if (this.mode === 'supabase') return this.failed ? 'Sin conexión con la base de datos · mostrando este navegador' : 'Datos de todo el grupo · Supabase';
    if (this.mode === 'claude') return this.canWrite ? 'Datos compartidos del grupo' : 'Datos del grupo · tus partidas quedan en este navegador';
    return 'Solo partidas de este navegador';
  },
  note() {
    if (this.shared()) return 'Tus resultados ya forman parte de las estadísticas del grupo.';
    if (this.mode === 'supabase') return 'No pudimos conectar con la base de datos; tus resultados quedaron guardados en este navegador.';
    return 'Esta versión guarda tus resultados solo en este navegador.';
  }
};
