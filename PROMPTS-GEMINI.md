# Prompts para Gemini · La torre de los patitos

Genera primero la **hoja de personajes** y luego adjúntala como imagen de referencia en cada prompt ("usa a los personajes de la imagen adjunta, sin cambiar su diseño"). Así los patos se ven iguales en todas las escenas.

Formato de escenas: horizontal panorámico (21:9 o 16:9; el juego recorta a 2.26:1). Exporta a unos 1040 × 460 px y guárdalas en `sitio/arte/`.

## Estilo base (pégalo al inicio de cada prompt)

> Ilustración para animación adulta de humor seco, estilo plano con contornos negros gruesos y sombras duras, paleta urbana apagada: concreto gris, naranja de alumbrado público de sodio, verde musgo sucio, amarillo mostaza deslavado, acentos rojo sello. Ambiente melancólico y ligeramente absurdo, como una escena de comedia negra. Personajes originales de expresión impasible, párpados a media asta. Sin texto legible, sin letras, sin logotipos reales, sin marcas de agua.

## 0. Hoja de personajes (referencia)

> [Estilo base] Hoja de personajes sobre fondo gris claro liso, cinco patos de pie en vista de tres cuartos y del mismo tamaño relativo, todos con cara de cansancio existencial: PIPO, el más pequeño, patito mostaza con bufanda turquesa deslavada a rayas; TINA, patita con un moño rosa viejo sosteniendo un celular con la pantalla encendida; LALO, patito con lentes oscuros, recostado con total indiferencia; MIMI, patita con un gorro cónico de papel aluminio arrugado y mirada intensa; MAMÁ PATA, pata adulta color hueso con lentes de lectura con cadenita y expresión de decepción contenida.

## 1. `intro-1` · La familia Pata

> [Estilo base] Estanque municipal al atardecer bajo cielo de smog naranja. Un carrito de supermercado oxidado medio hundido en el agua, un poste de luz recién encendido, carrizos secos. Mamá Pata en un nido de ramitas con sus cuatro patitos, cada uno ignorando al otro. Calma resignada.

## 2. `intro-2` · Entrega garantizada

> [Estilo base] Cielo gris de tarde. Una flota de drones de reparto blancos con franja naranja, cada uno con una caja de cartón colgando, pasa en formación sin desviarse. El viento de las hélices levanta el nido: Tina, Lalo y Mimi salen girando por el aire con cara de "otra vez no"; abajo, Pipo se aferra a una ramita. Los paquetes siguen intactos.

## 3. `intro-3` · Tres torres

> [Estilo base] Panorama al anochecer con tres estructuras en fila: a la izquierda una torre de concreto con techo de lámina, cinta amarilla de clausura y grafiti; al centro un vivero de vidrio abandonado con paneles rotos y plantas descontroladas; a la derecha una antena metálica de telecomunicaciones con luz roja en la punta y un letrero de neón rojo, bajo nubes de tormenta. En la cima de cada una, un patito: Tina grabando con su celular, Lalo recostado, Mimi con su gorro de aluminio apuntando al cielo.

## 4. `intro-4` · Pipo no vuela

> [Estilo base] Pipo de frente, en primer plano a la izquierda, con la bufanda ondeando y expresión de "bueno, ni modo", frente a una torre de concreto altísima con plataformas grises en zigzag y grafiti. Poste de luz de sodio a un lado, cielo naranja contaminado.

## 5. `rescate-tina` · Expediente 1 cerrado

> [Estilo base] Azotea de la torre de concreto con cinta de clausura. Pipo, agotado, llega junto a Tina, que no deja de grabarlo con el celular y no parece agradecida. Un dron de reparto pasa al fondo, indiferente.

## 6. `rescate-lalo` · Expediente 2 cerrado

> [Estilo base] Interior de un vivero de vidrio abandonado con luz amarillenta enfermiza, macetas de barro rotas, plantas que se salieron de control y moscas flotando. Lalo, con lentes oscuros, está tumbado dentro de una maceta comiendo semillas. Pipo lo mira desde abajo, sin paciencia.

## 7. `final` · Caso cerrado

> [Estilo base] Noche despejada después de la lluvia, luna creciente, luces lejanas de la ciudad. Un nido nuevo y visiblemente peor que el anterior, hecho con cinta de clausura, cartón de cajas de reparto y ramitas. Mamá Pata con sus lentes de lectura y los cuatro patitos dormidos encima. A lo lejos, la luz roja de un solo dron cruza el cielo.

## Versión 2 · Escenas nuevas

La versión 2 tiene siete capítulos. Las escenas 1 a 6 de arriba siguen sirviendo; estas son las que faltan. Usa el mismo estilo base y adjunta la hoja de personajes ampliada (prompt 0b) para que Huevo se vea igual en todas.

Mientras no existan, el juego dibuja esas escenas con su propio canvas, así que puedes generarlas poco a poco.

### 0b. Hoja de personajes ampliada (referencia)

> [Estilo base] Hoja de personajes sobre fondo gris claro liso, seis figuras de pie en vista de tres cuartos: los cinco patos de la imagen adjunta, sin cambiar su diseño, y HUEVO, un huevo de pato color crema con pecas café claro, una grieta pequeña arriba y una bufanda turquesa deslavada a rayas amarrada a la mitad, igual a la de Pipo pero más chica. Huevo no tiene cara, ojos ni patas: es un huevo. Mismo tamaño relativo que Pipo.

### 8. `rescate-mimi` · Expediente 3 cerrado

> [Estilo base] Base de una antena metálica de telecomunicaciones bajo tormenta, con una manga de viento naranja estirada por la ráfaga y un letrero de neón rojo apagándose. Mimi, con su gorro cónico de papel aluminio, le enseña a Pipo una libreta llena de rayas y flechas con la intensidad de quien descubrió una conspiración. Pipo, empapado, la mira sin entender. Lluvia en diagonal.

### 9. `rescate-mama` · Expediente 4 cerrado

> [Estilo base] Interior de un almacén de paquetería enorme y gris, con bandas transportadoras negras con flechas amarillas y cajas de cartón apiladas hasta el techo. Mamá Pata sale caminando entre las cajas con una etiqueta de envío pegada en la espalda y los lentes de lectura bien puestos, sin perder la compostura. Pipo va detrás, agotado. Un dron de reparto apagado cuelga torcido de una viga.

### 10. `rescate-huevo` · Expediente 5 cerrado

> [Estilo base] Cámara frigorífica azulada con escarcha en las paredes, estantes metálicos con cajas congeladas y vaho en el aire. En primer plano, Pipo sostiene con cuidado a Huevo, que lleva su bufanda turquesa y una ligera capa de hielo encima. Al fondo, una puerta pesada entreabierta deja entrar luz naranja. Silencio incómodo.

### 11. `rescate-servidor` · Expediente 6 cerrado

> [Estilo base] Sala de servidores oscura con filas de gabinetes negros y lucecitas verdes, cables por el piso y una luz roja de alarma girando. Mimi, con su gorro de aluminio, señala orgullosa un interruptor grande recién bajado; Pipo tiene todavía el ala extendida del golpe. En una pantalla al fondo, un mapa de rutas se apaga línea por línea. Sin texto legible en las pantallas.

### 12. `final` · Caso cerrado (reemplaza a la escena 7)

> [Estilo base] Noche despejada después de la lluvia, luna creciente, luces lejanas de la ciudad y, al fondo, un edificio corporativo alto con todas las ventanas apagadas. Un nido nuevo y visiblemente peor que el anterior, hecho con cartón de cajas de reparto, cinta de embalaje amarilla y ramitas. Mamá Pata con sus lentes de lectura, los cuatro patitos dormidos encima y Huevo con su bufanda en el centro, con una grieta un poco más grande. Varios drones de reparto flotan quietos en el cielo, sin rumbo.

Guárdalas en `sitio/arte/` con estos nombres y escribe la ruta en `config.js`:

| Escena | Archivo sugerido | Llave en `ART` |
|---|---|---|
| 8 | `arte/rescate-mimi.jpg` | `rescue3` |
| 9 | `arte/rescate-mama.jpg` | `rescue4` |
| 10 | `arte/rescate-huevo.jpg` | `rescue5` |
| 11 | `arte/rescate-servidor.jpg` | `rescue6` |
| 12 | `arte/final.jpg` (reemplaza la actual) | `ending` |

### Portada para itch.io (opcional)

> [Estilo base] Imagen horizontal 630 × 500 para portada de videojuego: corte de una torre absurda vista en diagonal, con plataformas grises, un puente azul encendido, una banda transportadora y un piso de hielo. Pipo salta en primer plano con la bufanda al viento; detrás, en fila y un salto atrás cada uno, lo siguen Tina grabando con el celular, Lalo con lentes oscuros, Mimi con gorro de aluminio, Mamá Pata con lentes de lectura y Huevo con bufanda. Arriba, una línea roja horizontal y oscuridad total sobre ella. Dejar espacio libre en la parte superior izquierda para el título. Sin texto.

## Extra · Portada para tu presentación (opcional)

> [Estilo base] Póster vertical 3:4 tipo expediente policial: corte de una torre absurda en tres secciones apiladas (concreto clausurado abajo, vivero de vidrio en medio, antena bajo tormenta arriba). Pipo salta entre plataformas mientras drones de reparto lo ignoran. Un sello rojo de "caso abierto" sin texto legible en una esquina. Dejar espacio libre arriba para un título.
