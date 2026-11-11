# La torre de los patitos · Netlify + Supabase

```
torre-patitos/
├── sitio/              ← esta carpeta es la que subes a Netlify
│   ├── index.html      la página del juego (solo el HTML)
│   ├── css/juego.css   estilos
│   ├── js/             el código, en archivos que se cargan en este orden:
│   │                   base, reglas, niveles, niveles-v1, metricas, mundo, estado,
│   │                   nivel, dibujo, partida,
│   │                   interfaz, datos, estadisticas, arranque
│   ├── config.js       aquí pegas la URL y la llave de Supabase
│   ├── netlify.toml    configuración del sitio estático
│   └── arte/           (opcional) ilustraciones generadas con Gemini
├── tests/              pruebas de las reglas del juego (`node --test tests/`)
├── supabase.sql        tablas, funciones y vistas de PostgreSQL
├── PROMPTS-GEMINI.md   prompts para las ilustraciones
└── LEEME.md
```

## 1. Base de datos en Supabase (≈5 min)

1. Crea un proyecto en supabase.com (el plan gratuito alcanza para la clase).
2. Abre **SQL Editor → New query**, pega todo `supabase.sql` y presiona **Run**.
   Crea 3 tablas (`partidas`, `niveles`, `encuestas`), 2 funciones y las vistas del esquema `analisis`.
3. Ve a **Project Settings → API Keys** y copia:
   - la **Project URL** (`https://xxxx.supabase.co`)
   - la **llave publicable** (`sb_publishable_…`). Si tu proyecto solo muestra la llave `anon` (empieza con `eyJ…`), también funciona.

> Nunca pongas la llave secreta (`sb_secret_…` o `service_role`) en `config.js`: esa da acceso total.

### Si tu base ya tiene partidas de la versión 1

Antes de publicar la versión 2, vuelve a pegar **todo** `supabase.sql` en el SQL Editor y presiona **Run**. El mismo archivo actualiza una base existente:

- No borra nada. Las partidas que ya tenías quedan marcadas como versión 1.
- Amplía los límites a 7 capítulos y agrega cinco columnas: `partidas.version`, `partidas.asistido`, `partidas.modo`, `partidas.pisos` y `niveles.tiempo_subida`. Las dos últimas de `partidas` son del modo infinito.
- Se puede correr más de una vez sin problema.

Si publicas la versión 2 sin hacer esto, la base rechaza las partidas nuevas (capítulos del 4 al 7) y cada jugador solo ve las suyas.

## 2. Conectar el juego

Abre `sitio/config.js` y pega los dos valores:

```js
SUPABASE_URL: 'https://xxxx.supabase.co',
SUPABASE_KEY: 'sb_publishable_xxxxxxxx',
```

Si los dejas vacíos, el juego funciona igual pero cada quien ve solo sus propias partidas.

## 3. Publicar en Netlify

**Lo más rápido:** entra a `app.netlify.com/drop` y arrastra la carpeta `sitio/`. En segundos te da una URL pública que puedes compartir con tu grupo. Para actualizar, vuelve a arrastrar la carpeta en la sección *Deploys* del mismo sitio.

**Con GitHub:** sube el proyecto a un repositorio, crea un sitio nuevo en Netlify desde ese repo y pon `sitio` como *Base directory*. No hace falta comando de build.

**Comprobar:** juega el capítulo 1, abre la pestaña *Estadísticas* (debe decir “Datos de todo el grupo · Supabase”) y revisa en Supabase **Table Editor → partidas** que apareció una fila.

## Cómo se guardan los datos (sin login)

- Al empezar, cada partida recibe un `id` y un token aleatorio que solo vive en ese navegador.
- Se guarda como **anónima** al iniciar cada capítulo y al terminarlo. Así el embudo cuenta también a quien abandona a la mitad.
- Al terminar los 7 capítulos aparece la pantalla de récord: el jugador escribe su nombre (2 a 14 caracteres) y se guarda con sus stats. Después responde la encuesta.
- El navegador solo puede llamar a dos funciones: `guardar_partida` y `listar_partidas`. Las tablas no se pueden leer ni escribir directo.
- Una partida solo la puede actualizar quien tiene su token, así que nadie puede cambiar el nombre o el tiempo de otro.
- Sin login no se puede impedir que alguien envíe partidas inventadas. Si ves algo raro, bórralo desde el Table Editor (la fila de `partidas` borra en cascada sus niveles y encuesta).

## Consultas útiles para tu reporte

Corre esto en el SQL Editor (el esquema `analisis` no se expone al público):

```sql
select * from analisis.antes_despues;        -- una fila por versión: la comparación antes / después
select * from analisis.records;              -- tablero completo de la historia, por versión
select * from analisis.infinito;             -- tablero del modo infinito: el mejor intento de cada nombre
select * from analisis.resumen_capitulos;    -- % completado, tiempo mediano, subida, caídas, pluma
select * from analisis.caidas_por_lugar;     -- dónde muere la gente (piso, columna, causa)
select * from analisis.caidas where en_bajada;  -- solo las muertes de la bajada
select * from analisis.encuesta;             -- respuestas con etiquetas legibles
```

Para exportar a Excel: ejecuta la consulta y usa **Export → CSV**.

Para borrar todo antes de la presentación: `truncate public.partidas cascade;`

## Modo infinito

Se desbloquea al terminar el capítulo 7 (también hay un botón en la pantalla final). Es un ascenso sin fin: la torre se genera por tramos de 5 pisos, sube de dificultad cada tres tramos y el apagón sube desde abajo, cada vez más rápido hasta un tope de 0.35 pisos por segundo.

- **Los tramos son los que el jugador automático terminó.** `Reglas.ENDLESS_SEEDS` guarda las semillas aceptadas por nivel de dificultad. Si cambias `Reglas.endlessDraft`, repite la verificación en el navegador con `?qa`: `towerQA.verifySegments(nivel, semillas)` prueba cada tramo empezando en 60 momentos distintos del reloj (unos 4 minutos por nivel) y devuelve cuántas veces tuvo que retroceder el jugador automático.
- **Uniones y velocidad:** `towerQA.measureRun(semillaDePartida, 18)` pega 18 tramos de una partida en un solo nivel, lo recorre y mide pisos por segundo. Sirve para comprobar que el tope del apagón sigue por debajo de lo que alcanza un jugador perfecto.
- **Tiempos del apagón:** `Reglas.ENDLESS` (espera, velocidad inicial, aceleración y tope). El modo asistido lo reduce al 65 %.
- **Datos:** cada intento se guarda como una partida con `mode: 'endless'` y `floors`; el dashboard los separa de la historia en la pestaña *Modo infinito*.

## Ilustraciones opcionales

Genera las imágenes con los prompts de `PROMPTS-GEMINI.md`, guárdalas en `sitio/arte/` (WebP o JPG, unos 1040 × 460 px) y escribe sus rutas en el bloque `ART` de `config.js`. Las que dejes vacías se siguen dibujando con el canvas del juego.

## Bugs corregidos del prototipo original

1. Tocar o hacer clic sobre plataformas que se enciman elegía la de atrás, no la de adelante.
2. Después de cambiar “Golpe secundario”, el foco se quedaba en la casilla y el teclado dejaba de mover al patito.
3. `ctx.roundRect` no existe en Safari 15 y navegadores viejos: el juego dejaba de dibujarse. Ahora hay un respaldo.
4. Las teclas presionadas durante un salto se perdían. Ahora se guarda una en búfer y se ejecuta al aterrizar.
5. Las partículas usaban `roundRect` una por una y la URL se leía en cada cuadro: costo de rendimiento innecesario.
6. Aterrizar en la fila de la meta fuera del centro no daba ninguna pista; ahora el juego avisa que camines hasta tu hermano.
7. Reiniciar (R) borraba toda la partida; ahora reinicia solo el capítulo y conserva el tiempo acumulado.
8. En celulares los controles quedaban debajo del borde de la pantalla; el área de juego ahora se ajusta a la altura disponible.
9. Se quitó la referencia a personajes de una serie con derechos de autor: Pipo y su familia son personajes originales.
10. Saltar al vacío mataba siempre. Ahora Pipo cae al piso de abajo y solo muere si la caída es de más de 3 pisos; lo mismo al romperse el vidrio o apagarse una placa debajo de él. Tampoco se puede saltar fuera de la torre.

## Desarrollo

- **Probar en local:** el juego necesita un servidor web (no funciona abriendo el archivo con doble clic). Dentro de `sitio/` corre `python3 -m http.server 8000` y abre `http://localhost:8000`. Ojo: si `config.js` tiene las llaves de Supabase, las partidas de prueba se guardan en la base real; vacíalas mientras pruebas.
- **Pruebas:** `node --test tests/` corre las pruebas de `sitio/js/reglas.js` (las reglas del juego que no dependen del dibujo), de los niveles (un verificador comprueba que cada uno se pueda terminar, subida y bajada) y de `sitio/js/metricas.js` (los números del dashboard).
- **Modo de prueba:** agrega `?qa` a la URL para pausar el reloj y manejar el juego desde la consola con `towerQA`. `towerQA.startLevel(0); towerQA.bot()` hace que un jugador automático termine el capítulo con todos los peligros activos.
