'use strict';

/* ============================================================
   Mundo: temas, niveles e historia
   ============================================================ */
const THEMES = {
  morning: { sky: ['#8f969c', '#c9a283', '#b07b5c'], wall: '#7f796f', wall2: '#8f897e', plank: 'rgba(30,26,22,.22)', post: '#4f4840', postSide: '#3e3832', ground: '#615c53', groundSide: '#4b4740', guide: 'rgba(30,26,22,.35)', top: '#a5a89d', topSafe: '#b6b8ac', side1: '#7a7064', side2: '#625a50', tick: '#463f37', reach: 'rgba(240,138,60,.9)', graffiti: true },
  greenhouse: { sky: ['#bfc19c', '#9d9b6f', '#6f6c4a'], wall: 'rgba(160,178,150,.35)', wall2: 'rgba(190,205,180,.22)', plank: 'rgba(30,36,26,.4)', post: '#353c32', postSide: '#272d25', ground: '#5d5341', groundSide: '#463e30', guide: 'rgba(30,36,26,.45)', top: '#8d9a6c', topSafe: '#9caa78', side1: '#8e624a', side2: '#74503c', tick: '#4f3626', reach: 'rgba(240,138,60,.9)', mullions: true, graffiti: true },
  storm: { sky: ['#101320', '#1d2335', '#2c3242'], wall: 'rgba(52,58,76,.65)', wall2: 'rgba(70,78,98,.35)', plank: 'rgba(150,160,190,.18)', post: '#4a5164', postSide: '#383e4e', ground: '#2c313b', groundSide: '#21252d', guide: 'rgba(170,180,210,.3)', top: '#8a95a5', topSafe: '#9aa5b4', side1: '#5d6676', side2: '#4b5262', tick: '#2f3542', reach: 'rgba(255,170,90,.9)', lattice: true },
  warehouse: { sky: ['#23262b', '#343940', '#474d55'], wall: 'rgba(96,102,110,.6)', wall2: 'rgba(126,132,140,.28)', plank: 'rgba(18,20,24,.35)', post: '#3a3d42', postSide: '#2b2e32', ground: '#3d4046', groundSide: '#2c2f34', guide: 'rgba(226,189,72,.4)', top: '#9aa0a8', topSafe: '#aeb4bb', side1: '#6a707a', side2: '#555b64', tick: '#33373d', reach: 'rgba(255,170,90,.9)', mullions: true },
  cold: { sky: ['#1b2830', '#2b404d', '#3f5968'], wall: 'rgba(150,186,201,.4)', wall2: 'rgba(190,221,233,.22)', plank: 'rgba(232,246,250,.2)', post: '#4b6373', postSide: '#3a4f5d', ground: '#33444f', groundSide: '#26343d', guide: 'rgba(205,232,241,.4)', top: '#a9b9c2', topSafe: '#c0cfd6', side1: '#6f8590', side2: '#5a6e78', tick: '#3a4b54', reach: 'rgba(255,170,90,.9)', mullions: true },
  server: { sky: ['#0b0f14', '#111a21', '#19262f'], wall: 'rgba(30,44,52,.72)', wall2: 'rgba(50,72,84,.3)', plank: 'rgba(90,230,170,.13)', post: '#2a3a44', postSide: '#1f2c34', ground: '#1c252c', groundSide: '#141b20', guide: 'rgba(90,230,170,.4)', top: '#8a9aa2', topSafe: '#a0b4b8', side1: '#56666e', side2: '#45535a', tick: '#2b363c', reach: 'rgba(255,170,90,.9)', lattice: true }
};
const GRAF = (() => { const r = rng(21), cols = ['rgba(196,64,74,.5)', 'rgba(64,120,170,.5)', 'rgba(226,189,72,.55)', 'rgba(230,230,220,.45)']; return Array.from({ length: 9 }, (_, i) => ({ row: 1 + r() * 8, x: -.2 + r() * 4.6, c: cols[i % cols.length], pts: Array.from({ length: 6 }, () => [r() * 46 - 23, r() * 22 - 11]) })); })();

const STORY = {
  intro: [
    { scene: 'nest', art: 'intro1', meta: 'Estanque municipal · 19:30', title: 'La familia Pata', text: 'La familia Pata vive en el estanque municipal, entre un carrito de súper y una bolsa que lleva ahí desde 2019. Pipo es el menor de cuatro. No sabe volar. Tampoco le ha hecho falta.' },
    { scene: 'storm', art: 'intro2', meta: 'Incidente 0427 · 19:42', title: 'Entrega garantizada', text: 'A las 19:42, la flota de Entregas Ya! recalculó su ruta por encima del estanque. Treinta drones, cero criterio. El nido salió volando. Los hermanos también. Los paquetes llegaron a tiempo.' },
    { scene: 'scatter', art: 'intro3', meta: 'Reporte de daños', title: 'Tres torres', text: 'Tina cayó en la torre del parque, clausurada desde el día que la inauguraron. Lalo aterrizó en el vivero abandonado y decidió quedarse a vivir. Mimi trepó la antena de la empresa para escuchar lo que dicen los drones.' },
    { scene: 'pipo', art: 'intro4', meta: 'Plan de rescate · versión única', title: 'Pipo no vuela', text: 'Mamá Pata se quedó cuidando lo que quedó del nido y dejando claro que esperaba más de todos. Pipo se ajusta la bufanda. Tres torres, tres hermanos y ningún seguro médico.' }
  ],
  // Una por nivel, en orden; la última es el cierre de la historia
  rescue: [
    { art: 'rescue1', text: '—Llegas tarde y con mal ángulo —dijo Tina, grabándolo todo—. Lalo cayó en el vivero. Ojo con el vidrio agrietado: se rompe si te quedas parado encima. Como todo, la verdad.' },
    { art: 'rescue2', text: 'Lalo bajó de su maceta con la dignidad de quien fue desalojado. —Allá arriba todo era más simple. —No. —Bueno. Mimi está en la antena; dice que los drones hablan entre ellos. Arriba sopla fuerte: fíjate en la manga antes de pisar.' },
    { art: 'rescue3', text: 'Mimi bajó con una libreta llena de rayas. —Lo descifré. El sistema registró el nido como «paquete pendiente». —¿Y eso qué significa? —Que ya vinieron por él. Cuando llegaron al estanque, no había nido. Tampoco Mamá Pata.' },
    { art: 'rescue4', text: 'Mamá Pata salió del almacén con una etiqueta de «frágil» pegada en la espalda y cero comentarios al respecto. —Falta Huevo —dijo—. Lo mandaron a paquetes no reclamados. Al frío. —¿Cuál huevo? —El que estaba empollando mientras ustedes se dejaban llevar por el viento.' },
    { art: 'rescue5', text: 'Huevo salió del congelador un poco frío y sin decir nada, lo cual en esta familia es una virtud. Mamá Pata lo acomodó bajo el ala. —Si no apagamos esas rutas, mañana nos recogen otra vez —dijo Mimi—. El servidor está en el centro de datos. Yo sé cuál botón es. Más o menos.' },
    { art: 'ending', text: 'Con las rutas apagadas, los drones se quedaron flotando sin saber a dónde ir, como todos. Esa noche la familia Pata durmió junta otra vez, en un nido nuevo y ligeramente peor, hecho con cartón de paquetes ajenos. Mamá Pata dijo que estaba orgullosa, con el tono de quien no lo está del todo. Pipo sigue sin volar. Ya no le hace falta.' }
  ]
};

const CAUSES = { hueco: 'Caída larga', dron: 'Dron', vidrio: 'Vidrio roto', apagon: 'Apagón', viento: 'Viento' };
const DEATH_QUIPS = {
  any: ['La gravedad sigue invicta.', 'Mamá Pata no se va a enterar. Probablemente.', 'Técnicamente eso fue volar. Un ratito.', 'Otra vez desde la bandera. Como la vida.', 'Pipo reconsidera sus decisiones. Brevemente.', 'Eso cuenta como cardio.', 'Nadie vio eso. Bueno, Tina sí, y lo grabó.'],
  dron: ['Entregado a domicilio.', 'El dron ni siquiera frenó.', 'Entregas Ya! lamenta las molestias. No es cierto.'],
  vidrio: ['El vidrio no estaba para esto.', 'Te advirtieron del vidrio. Literalmente.'],
  apagon: ['Se fue la luz. Y el piso.', 'El servidor decidió que hoy no.'],
  viento: ['El viento tenía prisa. Tú no.', 'Te avisó. Con tiempo.'],
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
