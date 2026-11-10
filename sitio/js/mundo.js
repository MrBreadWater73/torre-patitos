'use strict';

/* ============================================================
   Mundo: temas, niveles e historia
   ============================================================ */
const THEMES = {
  morning: { sky: ['#8f969c', '#c9a283', '#b07b5c'], wall: '#7f796f', wall2: '#8f897e', plank: 'rgba(30,26,22,.22)', post: '#4f4840', postSide: '#3e3832', ground: '#615c53', groundSide: '#4b4740', guide: 'rgba(30,26,22,.35)', top: '#a5a89d', topSafe: '#b6b8ac', side1: '#7a7064', side2: '#625a50', tick: '#463f37', reach: 'rgba(240,138,60,.9)', graffiti: true },
  greenhouse: { sky: ['#bfc19c', '#9d9b6f', '#6f6c4a'], wall: 'rgba(160,178,150,.35)', wall2: 'rgba(190,205,180,.22)', plank: 'rgba(30,36,26,.4)', post: '#353c32', postSide: '#272d25', ground: '#5d5341', groundSide: '#463e30', guide: 'rgba(30,36,26,.45)', top: '#8d9a6c', topSafe: '#9caa78', side1: '#8e624a', side2: '#74503c', tick: '#4f3626', reach: 'rgba(240,138,60,.9)', mullions: true, graffiti: true },
  storm: { sky: ['#101320', '#1d2335', '#2c3242'], wall: 'rgba(52,58,76,.65)', wall2: 'rgba(70,78,98,.35)', plank: 'rgba(150,160,190,.18)', post: '#4a5164', postSide: '#383e4e', ground: '#2c313b', groundSide: '#21252d', guide: 'rgba(170,180,210,.3)', top: '#8a95a5', topSafe: '#9aa5b4', side1: '#5d6676', side2: '#4b5262', tick: '#2f3542', reach: 'rgba(255,170,90,.9)', lattice: true }
};
const GRAF = (() => { const r = rng(21), cols = ['rgba(196,64,74,.5)', 'rgba(64,120,170,.5)', 'rgba(226,189,72,.55)', 'rgba(230,230,220,.45)']; return Array.from({ length: 9 }, (_, i) => ({ row: 1 + r() * 8, x: -.2 + r() * 4.6, c: cols[i % cols.length], pts: Array.from({ length: 6 }, () => [r() * 46 - 23, r() * 22 - 11]) })); })();

const LEVELS = [
  { n: 1, name: 'Torre del parque', theme: 'morning', sibling: 'Tina', sib: 'phone', tutorial: 2, bubble: 'Llegas tarde.',
    objective: 'Baja a Tina de la torre antes de que se le acabe la batería.',
    tip: 'El golpe mueve palancas: la azul enciende el puente azul. Las banderas guardan tu avance. Los drones de reparto van y vienen con la puntualidad que no tuvieron con tu nido: espera o reclámales con un golpe.',
    zones: [[2, 'Planta baja'], [5, 'Zona de cruce'], [6, 'Plataforma móvil'], [99, 'Azotea']],
    rows: [
      { cells: [0, 1, 2, 3, 4] }, { cells: [1, 2, 3] }, { gate: [{ x: 1, g: 'a' }, { x: 2, g: 'a' }, { x: 3, g: 'a' }], checkpoint: true }, { cells: [0, 1, 2, 3, 4] },
      { cells: [1, 2, 3], checkpoint: true }, { cells: [2, 3, 4] }, { moving: { c: 2, a: 1.05, s: .9, p: -1.15 } },
      { cells: [1, 2, 3], checkpoint: true }, { cells: [1, 3] }, { cells: [1, 2, 3] }
    ],
    feather: { row: 5, x: 4 },
    levers: [{ row: 1, x: .1, g: 'a' }],
    drones: [{ row: 3, speed: .92, phase: 1.9, span: 2.65, center: 2 }, { row: 5, speed: 1.1, phase: -.9, span: .85, center: 3.7 }, { row: 8, speed: 1.35, phase: .35, span: 2.65, center: 2 }],
    // La bajada: misma torre, de noche. Se cayeron plataformas y hay más drones.
    down: {
      objective: 'Baja con Tina hasta la planta baja. Ya es de noche.',
      tip: 'Bajar es otro oficio: puedes dejarte caer hasta 3 pisos si hay algo abajo que te reciba. Las banderas ahora guardan tu avance hacia abajo. Tina te sigue; no ayuda, pero graba.',
      hello: 'Ya era hora.',
      gone: [[8, 1], [5, 2], [3, 0], [3, 4], [1, 2]],
      drones: [{ row: 8, speed: 1.35, phase: .35, span: 2.65, center: 2 }, { row: 6, speed: 1.05, phase: 2.4, span: 2.2, center: 2 }, { row: 5, speed: 1.1, phase: -.9, span: .85, center: 3.7 }, { row: 3, speed: 1.15, phase: 1.9, span: 2.65, center: 2 }, { row: 1, speed: .9, phase: .6, span: 2.3, center: 2 }]
    },
    quips: ['Esto va para mis historias.', 'Más lento, se mueve la toma.', 'Sin señal. Qué horror.', 'Pon cara de héroe.', 'Voy en vivo, no me empujes.']
  },
  { n: 2, name: 'Vivero abandonado', theme: 'greenhouse', sibling: 'Lalo', sib: 'shades', tutorial: 2, bubble: 'Aquí vivo ahora.',
    objective: 'Convence a Lalo de que no puede vivir en una maceta.',
    tip: 'El vidrio agrietado aguanta lo mismo que tus planes: menos de un segundo. Pisa y sigue. Se repone solo, a diferencia de ti.',
    zones: [[2, 'Recepción'], [4, 'Vidrios flojos'], [7, 'Las macetas'], [99, 'Techo roto']],
    rows: [
      { cells: [0, 1, 2, 3, 4] }, { cells: [1, 3], crumble: [2] }, { cells: [0, 1, 2, 3, 4], checkpoint: true }, { crumble: [1, 2, 3] },
      { cells: [1, 2, 3], checkpoint: true }, { moving: { c: 2, a: 1.2, s: 1, p: .3 } }, { cells: [0, 1], crumble: [2, 3, 4] },
      { cells: [1, 2, 3, 4], checkpoint: true }, { crumble: [1, 2, 3] }, { moving: { c: 2, a: 1.3, s: 1.15, p: 2 } },
      { cells: [2], crumble: [1, 3] }, { cells: [1, 2, 3] }
    ],
    feather: { row: 6, x: 4 },
    drones: [{ row: 3, speed: .85, phase: .4, span: 2.6, center: 2 }, { row: 8, speed: 1.2, phase: 2.2, span: 2.65, center: 2 }, { row: 10, speed: 1.5, phase: 0, span: 1.15, center: 2 }]
  },
  { n: 3, name: 'Antena de Entregas Ya!', theme: 'storm', sibling: 'Mimi', sib: 'foil', tutorial: 2, bubble: '¡Nos escuchan!',
    objective: 'Baja a Mimi de la antena antes de que descifre algo.',
    tip: 'Las placas eléctricas se prenden y se apagan según el humor del servidor. Parpadean antes de apagarse y muestran cuánto falta para volver. Salta cuando estén encendidas.',
    zones: [[3, 'Base de la antena'], [6, 'Primeros relámpagos'], [9, 'Cables altos'], [99, 'Punta de la antena']],
    rows: [
      { cells: [0, 1, 2, 3, 4] }, { cells: [1, 2, 3] },
      { blink: [{ x: 1, o: 0 }, { x: 2, o: 0 }, { x: 3, o: 0 }], period: 2.6, on: 1.7 },
      { cells: [1, 2, 3], checkpoint: true },
      { blink: [{ x: 0, o: 0 }, { x: 1, o: .6 }, { x: 2, o: 1.2 }, { x: 3, o: 1.8 }, { x: 4, o: 2.4 }], period: 3.2, on: 2 },
      { crumble: [1, 2, 3] }, { cells: [1, 2, 3], checkpoint: true }, { moving: { c: 2, a: 1.3, s: 1.05, p: 1 } },
      { blink: [{ x: 1, o: 0 }, { x: 2, o: 1.2 }, { x: 3, o: 0 }], period: 2.4, on: 1.35 },
      { cells: [1, 2, 3], checkpoint: true },
      { cells: [1, 2], crumble: [3], blink: [{ x: 4, o: .4 }], period: 2.8, on: 1.4 },
      { moving: { c: 2.3, a: 1.5, s: 1.3, p: 2.4 } },
      { blink: [{ x: 1, o: 0 }, { x: 2, o: .35 }, { x: 3, o: .7 }], period: 2.2, on: 1.4 },
      { cells: [1, 2, 3] }
    ],
    feather: { row: 10, x: 4 },
    drones: [{ row: 5, speed: 1, phase: .8, span: 2.6, center: 2 }, { row: 8, speed: 1.3, phase: -.6, span: 2.6, center: 2 }, { row: 12, speed: 1.6, phase: 1.5, span: 2.7, center: 2 }]
  }
];

const STORY = {
  intro: [
    { scene: 'nest', art: 'intro1', meta: 'Estanque municipal · 19:30', title: 'La familia Pata', text: 'La familia Pata vive en el estanque municipal, entre un carrito de súper y una bolsa que lleva ahí desde 2019. Pipo es el menor de cuatro. No sabe volar. Tampoco le ha hecho falta.' },
    { scene: 'storm', art: 'intro2', meta: 'Incidente 0427 · 19:42', title: 'Entrega garantizada', text: 'A las 19:42, la flota de Entregas Ya! recalculó su ruta por encima del estanque. Treinta drones, cero criterio. El nido salió volando. Los hermanos también. Los paquetes llegaron a tiempo.' },
    { scene: 'scatter', art: 'intro3', meta: 'Reporte de daños', title: 'Tres torres', text: 'Tina cayó en la torre del parque, clausurada desde el día que la inauguraron. Lalo aterrizó en el vivero abandonado y decidió quedarse a vivir. Mimi trepó la antena de la empresa para escuchar lo que dicen los drones.' },
    { scene: 'pipo', art: 'intro4', meta: 'Plan de rescate · versión única', title: 'Pipo no vuela', text: 'Mamá Pata se quedó cuidando lo que quedó del nido y dejando claro que esperaba más de todos. Pipo se ajusta la bufanda. Tres torres, tres hermanos y ningún seguro médico.' }
  ],
  rescue: [
    { art: 'rescue1', text: '—Llegas tarde y con mal ángulo —dijo Tina, grabándolo todo—. Lalo cayó en el vivero. Ojo con el vidrio agrietado: se rompe si te quedas parado encima. Como todo, la verdad.' },
    { art: 'rescue2', text: 'Lalo estaba tirado en una maceta, comiendo semillas. —Aquí todo es más simple. —No. —Bueno. Mimi está en la antena; dice que los drones hablan entre ellos. Las placas de allá arriba se prenden y se apagan. Fíjate en el ritmo.' },
    { art: 'ending', text: 'Mimi bajó convencida de que la antena le había dicho algo importante. Nadie preguntó qué. Esa noche la familia Pata durmió junta otra vez, en un nido nuevo y ligeramente peor. Mamá Pata dijo que estaba orgullosa, con el tono de quien no lo está del todo. Pipo sigue sin volar. Ya no le hace falta.' }
  ]
};

const CAUSES = { hueco: 'Caída larga', dron: 'Dron', vidrio: 'Vidrio roto', apagon: 'Apagón' };
const DEATH_QUIPS = {
  any: ['La gravedad sigue invicta.', 'Mamá Pata no se va a enterar. Probablemente.', 'Técnicamente eso fue volar. Un ratito.', 'Otra vez desde la bandera. Como la vida.', 'Pipo reconsidera sus decisiones. Brevemente.', 'Eso cuenta como cardio.', 'Nadie vio eso. Bueno, Tina sí, y lo grabó.'],
  dron: ['Entregado a domicilio.', 'El dron ni siquiera frenó.', 'Entregas Ya! lamenta las molestias. No es cierto.'],
  vidrio: ['El vidrio no estaba para esto.', 'Te advirtieron del vidrio. Literalmente.'],
  apagon: ['Se fue la luz. Y el piso.', 'El servidor decidió que hoy no.'],
  hueco: ['Más de tres pisos ya no es una caída, es una decisión.', 'El suelo siempre gana.']
};
const DROP_QUIPS = { 2: 'Dos pisos. Pipo finge que fue a propósito.', 3: 'Tres pisos. Algo crujió. Seguramente no era importante.' };
let lastQuip = '';
function deathQuip(cause) { const pool = (DEATH_QUIPS[cause] || []).concat(DEATH_QUIPS.any).filter(q => q !== lastQuip); lastQuip = pool[Math.floor(Math.random() * pool.length)]; return lastQuip; }
let toastTimer = 0;
function showToast(text, kind) {
  const el = document.getElementById('toast'); if (!el) return;
  el.innerHTML = ''; const sp = document.createElement('span'); sp.className = kind || ''; sp.textContent = text; el.appendChild(sp);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { if (sp.isConnected) sp.remove(); }, 2700);
}
