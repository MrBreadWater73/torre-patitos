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
    signs: [{ row: 1, text: 'GOLPE = PALANCA' }, { row: 3, text: 'ESPERA O GOLPEA' }, { row: 5, text: 'PAQUETE: 1 DE 3' }, { row: 6, text: 'SUBE AL PASAR' }],
    drones: [{ row: 3, speed: .92, phase: 1.9, span: 2.65, center: 2 }, { row: 5, speed: .85, phase: -.9, span: .7, center: 3.8 }, { row: 8, speed: 1.3, phase: .35, span: 2.65, center: 2 },
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
    objective: 'Convence a Lalo de que no puede vivir en una maceta. La puerta del techo pide 3 paquetes.',
    tip: 'Las macetas se empujan de lado: si caen en un hueco, lo tapan y puedes pasar. El vidrio agrietado aguanta menos de un segundo: pisa y sigue.',
    zones: [[2, 'Recepción'], [6, 'Vidrios flojos'], [11, 'Las macetas'], [16, 'Invernadero alto'], [21, 'Vivero viejo'], [99, 'Techo roto']],
    rows: [
      { cells: [0, 1, 2, 3, 4] }, { cells: [0, 1, 2] }, { cells: [3, 4], checkpoint: true }, { cells: [4], crumble: [2, 3] },
      { cells: [1, 2, 3] }, { moving: { c: 2, a: 1.2, s: 1, p: .3 } }, { cells: [0, 1, 2, 3], checkpoint: true },
      { cells: [0, 1], crumble: [2, 3, 4] }, { cells: [0, 1, 2] }, { cells: [0, 1, 2] },
      { cells: [0, 1, 2, 3] }, { cells: [3, 4], checkpoint: true }, { crumble: [1, 2, 3] },
      { cells: [0, 1], crumble: [2] }, { cells: [0, 1, 2, 3, 4] }, { cells: [0, 1], gate: [{ x: 3, g: 'a' }, { x: 4, g: 'a' }] },
      { cells: [0, 1, 2], checkpoint: true }, { moving: { c: 2, a: 1.3, s: 1.15, p: 2 } }, { cells: [2, 3, 4], crumble: [1] },
      { cells: [0, 1, 2, 3] }, { cells: [0, 1, 4] }, { cells: [0, 1, 2], checkpoint: true },
      { crumble: [2, 3, 4] }, { cells: [3, 4], crumble: [1, 2] }, { gate: [{ x: 1, g: 'pk' }, { x: 2, g: 'pk' }, { x: 3, g: 'pk' }] }, { cells: [1, 2, 3] }
    ],
    pots: [{ row: 1, x: 2 }, { row: 10, x: 2 }, { row: 19, x: 3 }],
    signs: [{ row: 1, text: 'EMPUJA LA MACETA' }, { row: 3, text: 'VIDRIO: NO PARES' }],
    packages: [{ row: 7, x: 4 }, { row: 15, x: 4 }, { row: 23, x: 1 }],
    feather: { row: 20, x: 4 },   // secreta: hay que tapar el hueco del piso 19 con la maceta
    levers: [{ row: 13, x: -.1, g: 'a' }],
    drones: [{ row: 4, speed: .9, phase: .4, span: 1.2, center: 2 }, { row: 8, speed: 1.1, phase: 2.2, span: 1.2, center: 1 }, { row: 14, speed: 1.2, phase: .8, span: 2.6, center: 2 },
      { row: 18, speed: 1.3, phase: -.5, span: 1.4, center: 3 }, { row: 22, speed: .95, phase: 1.7, span: 1.3, center: 3 }],
    down: {
      objective: 'Baja con Lalo hasta la planta baja. Se prendió el riego automático.',
      tip: 'El riego tiró plataformas y despertó a más drones. Las macetas que ya tapaste siguen en su lugar. Lalo pisa donde tú pisas, a su ritmo.',
      hello: 'Cinco minutos más.',
      gone: [[23, 4], [20, 1], [19, 0], [18, 3], [14, 2], [14, 3], [13, 1], [9, 1], [8, 1], [4, 2], [3, 4]],
      drones: [{ row: 22, speed: .95, phase: 1.7, span: 1.3, center: 3 }, { row: 19, speed: 1.1, phase: .3, span: 1.5, center: 1.5 }, { row: 14, speed: 1.3, phase: .8, span: 2.6, center: 2 },
        { row: 12, speed: 1, phase: 2.5, span: 1.2, center: 2 }, { row: 9, speed: 1.15, phase: 1.2, span: 1.1, center: 1 }, { row: 7, speed: 1.2, phase: -.8, span: 2.4, center: 2 }, { row: 4, speed: 1.1, phase: .4, span: 1.2, center: 2 }, { row: 1, speed: .9, phase: .6, span: 1.1, center: 1 }]
    },
    quips: ['Íbamos tan bien allá arriba.', 'Voy. Despacio. Pero voy.', '¿Falta mucho?', 'En la maceta no había drones.', 'Tú brinca. Yo te alcanzo.']
  },
  { n: 3, name: 'Antena de Entregas Ya!', theme: 'storm', sibling: 'Mimi', sib: 'foil', tutorial: 3, bubble: '¡Nos escuchan!',
    objective: 'Baja a Mimi de la antena antes de que descifre algo. La puerta de la punta pide 3 paquetes.',
    tip: 'El viento avisa: cuando la manga se levanta, viene la ráfaga y te empuja una casilla. La pared te detiene; el hueco, no. Las placas eléctricas parpadean antes de apagarse.',
    zones: [[3, 'Base de la antena'], [6, 'Primeras ráfagas'], [10, 'Primeros relámpagos'], [14, 'Cables medios'], [19, 'Cables altos'], [23, 'Mástil'], [99, 'Punta de la antena']],
    rows: [
      { cells: [0, 1, 2, 3, 4] }, { cells: [1, 2, 3] }, { cells: [0, 1, 2, 3, 4], wind: { dir: 1, period: 3.4, on: 1.2 } }, { cells: [1, 2, 3], checkpoint: true },
      { cells: [0, 1, 2, 3], wind: { dir: 1, period: 3.4, on: 1.2, o: 1.5 } },
      { blink: [{ x: 1, o: 0 }, { x: 2, o: 0 }, { x: 3, o: 0 }], period: 2.6, on: 1.7 },
      { cells: [1, 2, 3], checkpoint: true }, { cells: [0, 1, 2, 3, 4], wind: { dir: -1, period: 3, on: 1.2 } },
      { blink: [{ x: 0, o: 0 }, { x: 1, o: .6 }, { x: 2, o: 1.2 }, { x: 3, o: 1.8 }, { x: 4, o: 2.4 }], period: 3.2, on: 2 },
      { crumble: [1, 2, 3] }, { cells: [1, 2, 3], checkpoint: true }, { moving: { c: 2, a: 1.3, s: 1.05, p: 1 } },
      { cells: [0, 1, 3, 4], wind: { dir: 1, period: 3, on: 1.1 } }, { cells: [0, 4] }, { cells: [0, 1, 2, 3, 4], checkpoint: true },
      { blink: [{ x: 1, o: 0 }, { x: 2, o: 1.2 }, { x: 3, o: 0 }], period: 2.4, on: 1.35 },
      { cells: [0, 1, 2, 3], wind: { dir: -1, period: 3.2, on: 1.2 } }, { cells: [2, 3], crumble: [0] }, { moving: { c: 2.3, a: 1.5, s: 1.3, p: 2.4 } },
      { cells: [1, 2, 3], checkpoint: true }, { cells: [0, 1, 2, 3, 4], wind: { dir: 1, period: 2.8, on: 1.2 } },
      { blink: [{ x: 1, o: 0 }, { x: 2, o: .35 }, { x: 3, o: .7 }], period: 2.2, on: 1.4, gate: [{ x: 4, g: 'a' }] },
      { cells: [0, 1, 2, 3, 4], wind: { dir: -1, period: 2.6, on: 1.1 } }, { cells: [1, 2, 3], checkpoint: true },
      { gate: [{ x: 1, g: 'pk' }, { x: 2, g: 'pk' }, { x: 3, g: 'pk' }] }, { cells: [1, 2, 3] }
    ],
    packages: [{ row: 7, x: 4 }, { row: 17, x: 0 }, { row: 22, x: 4 }],
    feather: { row: 21, x: 4 },   // secreta: la palanca está a contraviento, en la pared izquierda del piso 20
    levers: [{ row: 20, x: -.2, g: 'a' }],
    signs: [{ row: 2, text: 'MIRA LA MANGA' }, { row: 5, text: 'PARPADEA: SE APAGA' }],
    drones: [{ row: 9, speed: 1, phase: .8, span: 1.3, center: 2 }, { row: 13, speed: 1.2, phase: -.6, span: 2.6, center: 2 }, { row: 17, speed: 1.3, phase: 1.5, span: .7, center: 2.5 }, { row: 21, speed: 1.4, phase: .2, span: 1.3, center: 2 }],
    down: {
      objective: 'Baja con Mimi hasta la planta baja. Llegó la tormenta y el viento cambió de lado.',
      tip: 'Todas las ráfagas soplan ahora al revés: fíjate en la manga antes de pisar. Mimi pisa donde tú pisas y sospecha de cada piso.',
      hello: '¡Ya sé qué planean!', windFlip: true,
      gone: [[22, 2], [20, 2], [17, 3], [16, 1], [13, 0], [12, 3], [7, 1], [7, 3], [4, 2], [1, 2]],
      drones: [{ row: 22, speed: 1.2, phase: .4, span: 2.5, center: 2 }, { row: 20, speed: 1.1, phase: 2.1, span: 1.2, center: 3 }, { row: 17, speed: 1.3, phase: 1.5, span: .7, center: 2.5 }, { row: 13, speed: 1.2, phase: -.6, span: 2.6, center: 2 },
        { row: 9, speed: 1.1, phase: .8, span: 1.3, center: 2 }, { row: 7, speed: 1, phase: 1.9, span: 1.2, center: 2 }, { row: 4, speed: 1.1, phase: .2, span: 1.4, center: 1.5 }, { row: 1, speed: .9, phase: 1, span: 1.1, center: 2 }]
    },
    quips: ['Nos están escuchando.', 'Ese dron me miró feo.', 'Dice la antena que vamos tarde.', 'No pises la tercera. Corazonada.', 'Todo está conectado. Menos tú.']
  },
  { n: 4, name: 'Almacén de Entregas Ya!', theme: 'warehouse', sibling: 'Mamá Pata', sib: 'mom', tutorial: 2, bubble: 'Te tardaste.', potStyle: 'box',
    objective: 'Encuentra a Mamá Pata antes de que la entreguen. La puerta de la oficina pide 3 paquetes.',
    tip: 'Las bandas te arrastran: salta antes de que se acabe el piso. Un dron aturdido de un golpe aguanta cinco segundos como plataforma: úsalo de puente sobre los huecos.',
    zones: [[2, 'Andén de carga'], [6, 'Primer puente'], [11, 'Clasificación'], [16, 'Estantes'], [21, 'Pasillo de drones'], [99, 'Oficina']],
    rows: [
      { cells: [0, 1, 2, 3, 4] }, { belt: { cells: [0, 1, 2, 3, 4], dir: 1 } }, { cells: [3, 4], checkpoint: true },
      { cells: [4], belt: { cells: [0, 1, 2, 3], dir: -1 } }, { cells: [0, 1] }, { cells: [0, 1, 3, 4] }, { cells: [3, 4], checkpoint: true },
      { belt: { cells: [0, 1, 2, 3, 4], dir: -1 } }, { cells: [1, 2] }, { cells: [0, 1, 2, 4] }, { cells: [0, 1] },
      { cells: [0, 1, 2, 3, 4], checkpoint: true }, { belt: { cells: [0, 1, 2], dir: 1 } }, { cells: [0, 1, 2, 3] },
      { cells: [4], belt: { cells: [1, 2, 3], dir: -1 } }, { cells: [2, 3] }, { cells: [1, 2, 3], checkpoint: true },
      { cells: [0, 1, 3, 4] }, { cells: [0, 4] }, { belt: { cells: [0, 1, 2, 3, 4], dir: 1 } }, { cells: [2, 3] },
      { cells: [1, 2, 3], checkpoint: true }, { cells: [0, 1, 3] }, { cells: [0, 1, 4] },
      { belt: { cells: [0, 1, 2, 3], dir: -1 } }, { gate: [{ x: 1, g: 'pk' }, { x: 2, g: 'pk' }, { x: 3, g: 'pk' }] }, { cells: [1, 2, 3] }
    ],
    pots: [{ row: 13, x: 2 }],
    signs: [{ row: 1, text: 'LA BANDA TE LLEVA' }, { row: 5, text: 'GOLPEA: ES PUENTE' }],
    packages: [{ row: 9, x: 4 }, { row: 18, x: 4 }, { row: 24, x: 3 }],
    feather: { row: 23, x: 4 },   // secreta: solo se llega aturdiendo al dron sobre el hueco del piso 22
    drones: [{ row: 5, speed: .8, phase: .3, span: 1.2, center: 2 }, { row: 9, speed: .85, phase: 1.6, span: 1.2, center: 3 }, { row: 15, speed: 1.2, phase: 2.4, span: .6, center: 2.5 },
      { row: 17, speed: .9, phase: .9, span: 1.4, center: 2 }, { row: 22, speed: .9, phase: -.3, span: 1.6, center: 2.8 }],
    down: {
      objective: 'Baja con Mamá Pata hasta la planta baja. Es la hora de cierre y las bandas giran al revés.',
      tip: 'Todas las bandas cambiaron de sentido. Bajando casi no necesitas puentes: déjate caer. Mamá Pata pisa donde tú pisas y opina de cada salto.',
      hello: 'Te tardaste.', beltFlip: true,
      gone: [[23, 0], [20, 3], [18, 0], [17, 1], [15, 3], [13, 0], [10, 1], [9, 1], [8, 2], [4, 0]],
      drones: [{ row: 23, speed: 1, phase: .5, span: .6, center: .8 }, { row: 20, speed: 1.1, phase: 1.3, span: .6, center: 2.3 }, { row: 17, speed: 1, phase: .9, span: 1.4, center: 2 }, { row: 15, speed: 1.2, phase: 2.4, span: .6, center: 2.5 },
        { row: 13, speed: 1, phase: -.4, span: 1.4, center: 1.6 }, { row: 10, speed: .9, phase: 2, span: .5, center: .5 }, { row: 8, speed: 1.1, phase: .1, span: .6, center: 1.4 }, { row: 5, speed: .9, phase: .3, span: 1.2, center: 2 }, { row: 4, speed: 1, phase: 1.8, span: .5, center: .7 }]
    },
    quips: ['Así no se brinca.', 'Tu hermana lo habría hecho más rápido.', 'No es crítica. Es observación.', 'Ponte bien la bufanda.', 'Yo a tu edad ya volaba.', 'Sigo aquí. Por si te lo preguntabas.']
  },
  { n: 5, name: 'Cámara fría', theme: 'cold', sibling: 'Huevo', sib: 'egg', tutorial: 2, bubble: '· · ·', potStyle: 'box',
    objective: 'Saca a Huevo del congelador de paquetes no reclamados. La puerta pide 3 paquetes.',
    tip: 'En el hielo no frenas: resbalas hasta topar con piso, pared o una caja. Si entras al hielo desde abajo, te quedas quieto. Usa las cajas para detenerte donde quieres.',
    zones: [[2, 'Antecámara'], [5, 'Primer resbalón'], [10, 'Estantes helados'], [15, 'Pasillo de cajas'], [20, 'Congelador profundo'], [99, 'No reclamados']],
    rows: [
      { cells: [0, 1, 2, 3, 4] }, { ice: [0, 1, 2, 3, 4] }, { cells: [0, 4], checkpoint: true }, { cells: [0, 4], ice: [1, 2, 3] },
      { cells: [1, 2, 3] }, { cells: [1, 2, 3], checkpoint: true }, { ice: [0, 1, 2, 3] }, { cells: [0, 1] },
      { cells: [0, 4], ice: [1, 2, 3] }, { cells: [0, 1] }, { cells: [0, 1, 2], checkpoint: true }, { ice: [0, 1, 2, 3, 4] },
      { cells: [3, 4] }, { cells: [3, 4], ice: [0, 1, 2] }, { cells: [0, 4], ice: [1, 2, 3] }, { cells: [0, 1, 2], checkpoint: true },
      { ice: [0, 1, 2, 3, 4] }, { cells: [2, 3] }, { cells: [0], ice: [1, 2, 3, 4] }, { cells: [0, 4], gate: [{ x: 2, g: 'a' }] },
      { cells: [0, 1, 3, 4], checkpoint: true }, { ice: [0, 1, 2, 3, 4] }, { cells: [1, 3] }, { cells: [0, 4], ice: [1, 2, 3] },
      { gate: [{ x: 1, g: 'pk' }, { x: 2, g: 'pk' }, { x: 3, g: 'pk' }] }, { cells: [1, 2, 3] }
    ],
    pots: [{ row: 3, x: 3 }, { row: 11, x: 4 }, { row: 21, x: 2 }],
    signs: [{ row: 1, text: 'HIELO: RESBALAS' }, { row: 3, text: 'LA CAJA TE FRENA' }],
    packages: [{ row: 8, x: 4 }, { row: 14, x: 4 }, { row: 23, x: 0 }],
    feather: { row: 19, x: 2 },   // secreta: un puente rosa en medio de dos huecos; la palanca está en el piso 12
    levers: [{ row: 12, x: 4.9, g: 'a' }],
    drones: [{ row: 7, speed: .9, phase: .6, span: .6, center: .5 }, { row: 9, speed: 1, phase: 2, span: .6, center: .5 }, { row: 13, speed: 1.1, phase: 1.1, span: 1.4, center: 1.4 }, { row: 16, speed: 1.1, phase: -.7, span: 2.4, center: 2 }, { row: 22, speed: 1.2, phase: .3, span: 1.3, center: 2 }],
    down: {
      objective: 'Baja con Huevo antes de que se enfríe. Empezó el deshielo.',
      tip: 'El deshielo se llevó plataformas. Bajando por hielo, entra de frente para no resbalar. Huevo rueda detrás de ti sin opinar.',
      hello: '(crac)',
      gone: [[22, 1], [19, 0], [17, 3], [12, 4], [9, 1], [7, 1], [4, 2]],
      drones: [{ row: 23, speed: 1, phase: 1.4, span: 1.2, center: 2 }, { row: 21, speed: 1.1, phase: .2, span: 1.3, center: 3 }, { row: 18, speed: 1.2, phase: 2.2, span: 1.6, center: 2.4 }, { row: 16, speed: 1.1, phase: -.7, span: 2.4, center: 2 },
        { row: 13, speed: 1.1, phase: 1.1, span: 1.4, center: 1.4 }, { row: 11, speed: 1, phase: .5, span: 1.5, center: 1.5 }, { row: 8, speed: 1.1, phase: 1.9, span: 1.2, center: 2 }, { row: 6, speed: 1, phase: .9, span: 1.4, center: 1.5 }, { row: 3, speed: .9, phase: 2.6, span: 1, center: 2 }]
    },
    quips: ['(crac)', '(silencio de huevo)', '(se tambalea)', '(rueda con dignidad)', '(algo se movió adentro)']
  },
  { n: 6, name: 'Centro de datos', theme: 'server', sibling: 'Mimi', sib: 'foil', tutorial: 2, bubble: 'Es ese botón. Creo.', potStyle: 'box',
    objective: 'Sube al servidor de rutas y apágalo para que no vuelva a pasar. La puerta pide 3 paquetes.',
    tip: 'Aquí está todo junto: bandas, ventiladores, hielo del enfriamiento, placas y palancas de tres colores. Nada es nuevo. Solo es mucho.',
    zones: [[2, 'Recepción'], [7, 'Cableado'], [12, 'Enfriamiento'], [18, 'Pasillo caliente'], [23, 'Núcleo'], [99, 'Servidor de rutas']],
    rows: [
      { cells: [0, 1, 2, 3, 4] }, { cells: [1, 2, 3] }, { cells: [0, 1, 2, 3, 4], checkpoint: true }, { belt: { cells: [0, 1, 2, 3], dir: 1 } },
      { cells: [1, 2] }, { gate: [{ x: 1, g: 'a' }, { x: 2, g: 'a' }, { x: 3, g: 'a' }] },
      { blink: [{ x: 1, o: 0 }, { x: 2, o: .5 }, { x: 3, o: 1 }], period: 2.6, on: 1.6 }, { cells: [1, 2, 3], checkpoint: true },
      { cells: [0, 1, 2, 3, 4], wind: { dir: -1, period: 3, on: 1.2 } }, { ice: [0, 1, 2, 3, 4] }, { cells: [0, 1] }, { cells: [0, 1, 3, 4] },
      { cells: [3, 4], checkpoint: true }, { belt: { cells: [0, 1, 2, 3, 4], dir: -1 } }, { cells: [2, 3] },
      { cells: [3], gate: [{ x: 0, g: 'b' }, { x: 1, g: 'b' }, { x: 2, g: 'b' }] }, { cells: [0, 4], ice: [1, 2, 3] }, { cells: [0, 4] },
      { cells: [0, 1, 2, 3, 4], checkpoint: true }, { moving: { c: 2, a: 1.4, s: 1.2, p: .5 } }, { cells: [0, 1, 3, 4], wind: { dir: 1, period: 2.8, on: 1.1 } },
      { cells: [0, 4] }, { cells: [0, 4], crumble: [1, 3], gate: [{ x: 2, g: 'c' }] }, { cells: [1, 2, 3], checkpoint: true },
      { belt: { cells: [0, 1, 2, 3, 4], dir: 1 } }, { blink: [{ x: 1, o: 0 }, { x: 2, o: .4 }, { x: 3, o: .8 }], period: 2.2, on: 1.3 },
      { gate: [{ x: 1, g: 'pk' }, { x: 2, g: 'pk' }, { x: 3, g: 'pk' }] }, { cells: [1, 2, 3] }
    ],
    pots: [{ row: 9, x: 3 }],
    packages: [{ row: 8, x: 4 }, { row: 15, x: 0 }, { row: 24, x: 0 }],
    feather: { row: 22, x: 2 },   // secreta: puente verde entre dos vidrios; la palanca está en el piso 17
    levers: [{ row: 4, x: .1, g: 'a' }, { row: 14, x: 4.1, g: 'b' }, { row: 17, x: -.1, g: 'c' }],
    drones: [{ row: 5, speed: .9, phase: .2, span: 1.2, center: 2 }, { row: 9, speed: 1, phase: 1.3, span: 2.4, center: 2 }, { row: 11, speed: .85, phase: 2.2, span: 1.3, center: 2 },
      { row: 15, speed: 1.1, phase: .7, span: .9, center: 1 }, { row: 21, speed: 1.2, phase: -.5, span: 2.4, center: 2 }, { row: 24, speed: 1.1, phase: 1.8, span: 2.4, center: 2 }],
    down: {
      objective: 'Rutas apagadas. Baja con Mimi: sonó la alarma y todo gira al revés.',
      tip: 'Con la alarma, las bandas y los ventiladores cambiaron de sentido. Los puentes que encendiste siguen encendidos.',
      hello: 'Listo. Fui yo, técnicamente.', beltFlip: true, windFlip: true, tint: '70,12,16',
      gone: [[24, 2], [21, 0], [20, 3], [17, 4], [16, 0], [14, 2], [11, 1], [10, 0], [8, 2], [4, 1], [1, 2]],
      drones: [{ row: 25, speed: 1.1, phase: .3, span: 1.2, center: 2 }, { row: 22, speed: 1.2, phase: 1.6, span: 2.4, center: 2 }, { row: 20, speed: 1.1, phase: .9, span: 1.2, center: 1 }, { row: 16, speed: 1.2, phase: 2.3, span: 1.4, center: 2 },
        { row: 14, speed: 1.1, phase: .4, span: .5, center: 2.9 }, { row: 11, speed: 1, phase: 2.2, span: 1.3, center: 2 }, { row: 9, speed: 1.1, phase: 1.3, span: 2.4, center: 2 }, { row: 6, speed: 1.2, phase: -.2, span: 1.2, center: 2 }, { row: 3, speed: 1, phase: 1.1, span: 1.6, center: 1.5 }, { row: 1, speed: .9, phase: 2, span: 1.1, center: 2 }]
    },
    quips: ['Ya no nos escuchan. Creo.', 'Ese foco parpadea en clave.', 'Corre, pero con calma.', 'La alarma dice tu nombre.', 'Yo apagué. Tú solo golpeaste.']
  },
  // Torre final: los pisos se generan en cada partida (ver Reglas.generate); aquí va una de muestra
  { n: 7, name: 'Central de Entregas Ya!', theme: 'storm', sibling: 'toda la familia', sib: 'mom', family: ['mom', 'phone', 'shades', 'foil', 'egg'], tutorial: 2, bubble: 'Ya estamos todos.', generated: true,
    objective: 'La familia subió por el nido a la azotea de la central y el montacargas se apagó. Sube por ellos. La puerta pide 3 paquetes.',
    tip: 'Esta torre se arma distinta en cada partida, con todo lo que ya conoces. Al tocar a la familia, la central empieza a apagarse desde arriba: baja sin detenerte.',
    zones: [[5, 'Vestíbulo'], [10, 'Atención a clientes'], [15, 'Recursos humanos'], [20, 'Gerencia'], [25, 'Dirección'], [99, 'Azotea']],
    downText: {
      objective: 'La central se apaga desde arriba. Baja con toda la familia en fila. No te detengas.',
      tip: 'Lo que queda arriba de la línea roja ya no existe. Las banderas te devuelven con ventaja. Todos pisan donde tú pisas.',
      hello: 'Tú adelante. Nosotros te seguimos.', tint: '70,12,16'
    },
    quips: ['Así no se brinca.', 'Esto sí lo subo.', '¿Falta mucho?', 'Nos están escuchando.', '(crac)', 'Fila india. Sin empujar.']
  }
];
{ // la torre de muestra para el nivel generado
  const R = typeof Reglas !== 'undefined' ? Reglas : require('./reglas.js'), last = LEVELS[LEVELS.length - 1];
  Object.assign(last, R.generate(7, 30)); Object.assign(last.down, last.downText);
}

if (typeof module !== 'undefined') module.exports = LEVELS;
