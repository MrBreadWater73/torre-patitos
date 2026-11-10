'use strict';

/* ============================================================
   Niveles (solo datos; `Reglas.audit` los revisa en las pruebas)
   Filas de abajo hacia arriba. Columnas 0 a 4.
   ============================================================ */
const LEVELS = [
  { n: 1, name: 'Torre del parque', theme: 'morning', sibling: 'Tina', sib: 'phone', tutorial: 2, bubble: 'Llegas tarde.',
    objective: 'Baja a Tina de la torre antes de que se le acabe la batería. La puerta de la azotea pide 3 paquetes.',
    tip: 'El golpe mueve palancas: cada palanca enciende el puente de su color. Los paquetes de los drones abren la puerta de arriba y sirven para rehacer el nido. Las banderas guardan tu avance.',
    zones: [[2, 'Planta baja'], [7, 'Zona de cruce'], [12, 'Andamios'], [17, 'Bodega de la obra'], [22, 'Últimos pisos'], [99, 'Azotea']],
    rows: [
      { cells: [0, 1, 2, 3, 4] }, { cells: [1, 2, 3] }, { gate: [{ x: 1, g: 'a' }, { x: 2, g: 'a' }, { x: 3, g: 'a' }], checkpoint: true }, { cells: [0, 1, 2, 3, 4] },
      { cells: [1, 2, 3], checkpoint: true }, { cells: [2, 3, 4] }, { moving: { c: 2, a: 1.05, s: .9, p: -1.15 } },
      { cells: [1, 2, 3], checkpoint: true }, { cells: [1, 3] }, { cells: [0, 1, 2, 3] },
      { cells: [0, 2, 3] }, { cells: [0, 3, 4] }, { cells: [2, 3, 4], checkpoint: true },
      { moving: { c: 2, a: 1.3, s: 1.05, p: .4 } }, { cells: [0, 1, 2] }, { cells: [0, 1, 3, 4] },
      { cells: [1, 2, 3], checkpoint: true }, { cells: [3, 4], gate: [{ x: 0, g: 'b' }, { x: 1, g: 'b' }] }, { cells: [2, 3, 4] },
      { cells: [1, 2, 3] }, { moving: { c: 2, a: 1.2, s: 1.2, p: 2 } }, { cells: [0, 1, 2, 3, 4], checkpoint: true },
      { cells: [0, 2, 4] }, { gate: [{ x: 1, g: 'pk' }, { x: 2, g: 'pk' }, { x: 3, g: 'pk' }] }, { cells: [1, 2, 3] }
    ],
    packages: [{ row: 5, x: 4 }, { row: 11, x: 0 }, { row: 22, x: 4 }],
    feather: { row: 17, x: 0 },   // secreta: el puente rosa se enciende con una palanca escondida un piso abajo
    levers: [{ row: 1, x: .1, g: 'a' }, { row: 15, x: 4.9, g: 'b' }],
    drones: [{ row: 3, speed: .92, phase: 1.9, span: 2.65, center: 2 }, { row: 5, speed: 1.1, phase: -.9, span: .85, center: 3.7 }, { row: 8, speed: 1.3, phase: .35, span: 2.65, center: 2 },
      { row: 10, speed: 1.05, phase: 2.6, span: 2.2, center: 1.8 }, { row: 14, speed: 1.2, phase: 1.1, span: 1.6, center: 1 }, { row: 19, speed: 1.35, phase: -.4, span: 1.7, center: 2 }, { row: 22, speed: 1.15, phase: .9, span: 2.65, center: 2 }],
    // La bajada: misma torre, de noche. Se cayeron plataformas y hay más drones.
    down: {
      objective: 'Baja con Tina hasta la planta baja. Ya es de noche.',
      tip: 'Bajar es otro oficio: puedes dejarte caer hasta 3 pisos si hay algo abajo que te reciba. Las banderas ahora guardan tu avance hacia abajo. Tina pisa donde tú pisas; no ayuda, pero graba.',
      hello: 'Ya era hora.',
      gone: [[22, 2], [19, 2], [18, 3], [15, 1], [14, 1], [11, 3], [9, 2], [8, 1], [5, 2], [3, 0], [3, 4], [1, 2]],
      drones: [{ row: 22, speed: 1.15, phase: .9, span: 2.65, center: 2 }, { row: 19, speed: 1.35, phase: -.4, span: 1.7, center: 2 }, { row: 17, speed: 1, phase: 2, span: .9, center: 3.5 },
        { row: 14, speed: 1.2, phase: 1.1, span: 1.6, center: 1 }, { row: 10, speed: 1.05, phase: 2.6, span: 2.2, center: 1.8 }, { row: 8, speed: 1.35, phase: .35, span: 2.65, center: 2 },
        { row: 6, speed: 1.05, phase: 2.4, span: 2.2, center: 2 }, { row: 3, speed: 1.15, phase: 1.9, span: 2.65, center: 2 }, { row: 1, speed: .9, phase: .6, span: 2.3, center: 2 }]
    },
    quips: ['Esto va para mis historias.', 'Más lento, se mueve la toma.', 'Sin señal. Qué horror.', 'Pon cara de héroe.', 'Voy en vivo, no me empujes.', 'Piso donde pisas. Qué remedio.']
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

if (typeof module !== 'undefined') module.exports = LEVELS;
