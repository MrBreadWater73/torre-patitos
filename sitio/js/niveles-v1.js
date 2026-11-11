'use strict';

/* ============================================================
   Niveles de la versión 1 (el prototipo de tres capítulos).
   Solo los usa el dashboard para dibujar el mapa de muertes de las partidas viejas.
   ============================================================ */
const LEVELS_V1 = [
  { n: 1, name: "Torre del parque", sibling: "Tina",
    rows: [{"cells":[0,1,2,3,4]},{"cells":[1,2,3]},{"cells":[0,1,2,3,4],"checkpoint":true},{"cells":[0,1,2,3,4]},{"cells":[1,2,3],"checkpoint":true},{"cells":[2,3,4]},{"moving":{"c":2,"a":1.05,"s":0.9,"p":-1.15}},{"cells":[1,2,3],"checkpoint":true},{"cells":[1,3]},{"cells":[1,2,3]}] },
  { n: 2, name: "Vivero abandonado", sibling: "Lalo",
    rows: [{"cells":[0,1,2,3,4]},{"cells":[1,3],"crumble":[2]},{"cells":[0,1,2,3,4],"checkpoint":true},{"crumble":[1,2,3]},{"cells":[1,2,3],"checkpoint":true},{"moving":{"c":2,"a":1.2,"s":1,"p":0.3}},{"cells":[0,1],"crumble":[2,3,4]},{"cells":[1,2,3,4],"checkpoint":true},{"crumble":[1,2,3]},{"moving":{"c":2,"a":1.3,"s":1.15,"p":2}},{"cells":[2],"crumble":[1,3]},{"cells":[1,2,3]}] },
  { n: 3, name: "Antena de Entregas Ya!", sibling: "Mimi",
    rows: [{"cells":[0,1,2,3,4]},{"cells":[1,2,3]},{"blink":[{"x":1,"o":0},{"x":2,"o":0},{"x":3,"o":0}],"period":2.6,"on":1.7},{"cells":[1,2,3],"checkpoint":true},{"blink":[{"x":0,"o":0},{"x":1,"o":0.6},{"x":2,"o":1.2},{"x":3,"o":1.8},{"x":4,"o":2.4}],"period":3.2,"on":2},{"crumble":[1,2,3]},{"cells":[1,2,3],"checkpoint":true},{"moving":{"c":2,"a":1.3,"s":1.05,"p":1}},{"blink":[{"x":1,"o":0},{"x":2,"o":1.2},{"x":3,"o":0}],"period":2.4,"on":1.35},{"cells":[1,2,3],"checkpoint":true},{"cells":[1,2],"crumble":[3],"blink":[{"x":4,"o":0.4}],"period":2.8,"on":1.4},{"moving":{"c":2.3,"a":1.5,"s":1.3,"p":2.4}},{"blink":[{"x":1,"o":0},{"x":2,"o":0.35},{"x":3,"o":0.7}],"period":2.2,"on":1.4},{"cells":[1,2,3]}] }
];
