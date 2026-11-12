# Página de itch.io · La torre de los patitos

Todo lo que pide la Tarea 4 para la página, listo para copiar. Los pasos están al final.

## Título

La torre de los patitos

## Descripción breve (tagline)

Pipo no vuela. Pipo trepa: siete torres de ida y vuelta para recuperar a su familia, y un ascenso sin fin.

## Descripción

Una flota de drones de reparto destruyó el nido de la familia Pata en horario de entrega garantizada. Tus hermanos quedaron repartidos por la ciudad y nadie más va a ir por ellos.

Pipo es el único pato que nunca aprendió a volar, y por eso es el único que sabe moverse por una torre. Sube siete estructuras de dudosa legalidad, encuentra a cada familiar y **baja con él siguiéndote**: la torre ya no es la misma cuando regresas.

- **7 capítulos de ida y vuelta**, cada uno con su mecánica: palancas, macetas que tapan huecos, viento, bandas transportadoras, drones que sirven de puente, hielo y un final donde el edificio se apaga detrás de ti.
- **3 paquetes por torre** abren la puerta de arriba, y una pluma dorada espera a quien busque el camino secreto.
- **La torre final cambia en cada partida.**
- **Modo infinito:** al terminar la historia se desbloquea un ascenso sin fin. La torre se arma sobre la marcha, cada tres tramos se pone más difícil y el apagón sube desde abajo cada vez más rápido. Cuenta los pisos que logras antes de que te alcance, con su propio tablero.
- **Se guarda tu avance** al cerrar cada capítulo y hay **modo asistido** para quien lo necesite.
- Al terminar firmas el tablero de récords. La pestaña **Estadísticas** muestra cómo le va a todo el grupo.

Humor seco, patos cansados y ningún tutorial largo.

## Controles e instrucciones

| Acción | Teclado | Táctil |
|---|---|---|
| Subir un piso | ↑, W o Espacio | Flecha ↑ o tocar la plataforma |
| Bajar un piso | ↓ o S | Flecha ↓ |
| Saltar a los lados | ← →, A o D | Flechas ← → |
| Golpear (palancas y drones) | J o X | Botón GOLPE |
| Pausa / reiniciar capítulo | P / R | Botones de arriba |
| Pantalla completa | F | Botón de arriba |

**Cómo se juega**

1. Sube hasta tu familiar. La puerta de arriba pide los 3 paquetes de la torre.
2. Al tocarlo empieza la bajada: te sigue pisando donde tú pisas.
3. Las banderas guardan tu avance, de subida y de bajada.
4. Caer hasta 3 pisos duele, pero no mata. Más de 3, sí.
5. El golpe mueve palancas y aturde drones: un dron aturdido aguanta 5 segundos como plataforma.
6. **Modo infinito** (se desbloquea al terminar el capítulo 7, botón en la pantalla de inicio): sube sin parar; lo que queda debajo de la línea roja ya se apagó. Si te alcanza, termina y puedes firmar tu récord en pisos.

## Versión

2.0 (noviembre de 2026). La versión 1.0 fue el prototipo de tres capítulos.

## Etiquetas

`platformer`, `puzzle-platformer`, `singleplayer`, `2d`, `isometric`, `funny`, `ducks`, `spanish`, `endless`, `high-score`

- **Clasificación:** Games
- **Género:** Platformer
- **Tipo de proyecto:** HTML
- **Estado:** Released (o Prototype, si prefieres seguir ajustándolo)
- **Idioma:** Español
- **Duración promedio:** About a half-hour
- **Entradas:** Keyboard, Touchscreen
- **Herramientas de IA:** márcalo como asistido por IA (código generado con Claude; ilustraciones con Gemini)

## Desarrolladores

Equipo 6 · Diseño de Videojuegos (IL384), sección D02 · CUCEI, Universidad de Guadalajara

- Diego Alejandro Guzmán Paniagua
- Uriel Alberto Hernandez Ruiz
- Jonathan Michell Gutierrez Padilla

## Leyenda de la clase

Este trabajo fue desarrollado en la clase de Diseño de Videojuegos de José Luis David Bonilla Carranza.

## Créditos

Código generado con asistencia de IA (Claude). Ilustraciones de la historia generadas con IA (Gemini y Codex/OpenAI), a partir de prompts propios. Música original generada en el navegador con Web Audio. Personajes y arte originales. Fuentes: Bricolage Grotesque, Instrument Sans e IBM Plex Mono (SIL Open Font License).

## Capturas

En `itch/capturas/` hay siete, tomadas de la versión 2.0:

1. `01-inicio.png` — pantalla de inicio
2. `02-palanca-y-paquetes.png` — capítulo 1: palanca, puente y letreros
3. `03-bajada-con-tina.png` — la bajada de noche, con Tina siguiéndote
4. `04-almacen-bandas.png` — capítulo 4: bandas transportadoras
5. `05-camara-fria-hielo.png` — capítulo 5: hielo y cajas
6. `06-final-apagon.png` — capítulo 7: toda la familia en fila
7. `07-modo-infinito.png` — modo infinito: el apagón sube desde abajo

La portada (630 × 500) ya está en `itch/portada-630x500.png`. Falta una captura de la pestaña Estadísticas con datos reales: tómala cuando el grupo ya haya jugado la versión 2.

## Pasos para publicar

1. **Antes que nada, actualiza la base:** pega todo `supabase.sql` en Supabase → SQL Editor → Run. Sin esto la base rechaza las partidas de la versión 2.
2. En la carpeta del proyecto corre `./empaquetar.sh`. Crea `dist/torre-patitos-v2.0-itch.zip`.
3. En itch.io: **Dashboard → Create new project**.
4. **Kind of project:** HTML. Sube el ZIP y marca **This file will be played in the browser**.
5. **Embed options:** *Click to launch in fullscreen*. Si prefieres incrustarlo, usa 1280 × 860 y activa *Fullscreen button* y *Mobile friendly*.
6. Copia de este archivo el título, la descripción, los controles y las etiquetas. Sube las capturas.
7. **Visibility & access:** *Public*, o *Restricted* con enlace secreto si solo lo verá el grupo.
8. Guarda, abre la página y juega el capítulo 1 completo. Luego abre **Estadísticas**: debe decir "Datos de todo el grupo · Supabase" y tu partida debe aparecer en la versión 2.
