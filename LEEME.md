# La torre de los patitos · Netlify + Supabase

```
torre-patitos/
├── sitio/              ← esta carpeta es la que subes a Netlify
│   ├── index.html      el juego completo (HTML, CSS y JS en un archivo)
│   ├── config.js       aquí pegas la URL y la llave de Supabase
│   ├── netlify.toml    configuración del sitio estático
│   └── arte/           (opcional) ilustraciones generadas con Gemini
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
- Al terminar los 3 capítulos aparece la pantalla de récord: el jugador escribe su nombre (2 a 14 caracteres) y se guarda con sus stats. Después responde la encuesta.
- El navegador solo puede llamar a dos funciones: `guardar_partida` y `listar_partidas`. Las tablas no se pueden leer ni escribir directo.
- Una partida solo la puede actualizar quien tiene su token, así que nadie puede cambiar el nombre o el tiempo de otro.
- Sin login no se puede impedir que alguien envíe partidas inventadas. Si ves algo raro, bórralo desde el Table Editor (la fila de `partidas` borra en cascada sus niveles y encuesta).

## Consultas útiles para tu reporte

Corre esto en el SQL Editor (el esquema `analisis` no se expone al público):

```sql
select * from analisis.records;              -- tablero completo
select * from analisis.resumen_capitulos;    -- % completado, tiempo mediano, caídas, pluma
select * from analisis.caidas_por_lugar;     -- dónde muere la gente (piso, columna, causa)
select * from analisis.encuesta;             -- respuestas con etiquetas legibles
```

Para exportar a Excel: ejecuta la consulta y usa **Export → CSV**.

Para borrar todo antes de la presentación: `truncate public.partidas cascade;`

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
