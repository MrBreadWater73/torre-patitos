# v2-gameplay — La torre de los patitos 2.0

Objective: turn the Tarea 3 findings into a longer, deeper game (target: 30+ minutes) and ship it for Tarea 4 (itch.io + report).
Branch: `feat/v2-gameplay` · Delivery strategy: `ask-on-risk` (chain strategy not asked yet; ask before the first push) · Forecast: well above 400 authored lines.
Test runner: `node --test tests/` for pure modules (Node 20, zero dependencies). Canvas/UI behavior is checked in a browser through the `?qa` hook (`window.towerQA`).

## Specs

- **S1 — Tarea 4 deliverables.** Follow the professor's assignment quoted in `L1`: at least 3 observations from Tarea 3, prioritized improvements each "vinculada a una observación previa", design improvements applied to the prototype, "Generación de un gameplay mayor", updated dashboard "con nuevas mediciones o comparaciones antes/después", and publication on itch.io.
- **S2 — Length.** "necesito mas extenso el gameplay, minimo 30 minutos". Assumption (mine): measured as median total time of a first playthrough in the dashboard; 30 minutes is a design estimate until real runs exist.
- **S3 — Mechanics quality.** "planeemos mecanicas interesantes, divertidas e intuitivas".
- **S4 — Few, large levels.** "hay alguna manera de extender el gameplay sin extender tanto la cantidad de niveles?" Accepted proposal: "6 niveles de ida y vuelta más la torre final, en el motor actual".
  - Round trip: climb to the sibling, then go back down with the sibling following through the same tower, which has changed.
  - Taller levels with an objective: find 3 packages in side branches to open the door; secret places with feathers.
  - Final tower generated from pieces of every mechanic, different each run, with a record for the leaderboard.
- **S5 — Engine.** Stay on the current HTML/canvas engine (no migration). Split the single 144 KB file into modules without changing technology.
- **S6 — Levels, mechanics and story arc** (rewritten after L13). Narrative: flying is what went wrong, so the sky belongs to the drones and Pipo, the only one who never learned to fly, is the only one who can move through a tower; the siblings follow with "pisa donde yo piso"; Mamá Pata's rule is that nobody stays up; the tower changes because the night shift starts; the packages are the material to rebuild the nest.
  1. Torre del parque — bring Tina down. Levers activated by the punch switch bridges on.
  2. Vivero — convince Lalo. Pushable pots plus the existing glass; the sprinklers turn on for the way down.
  3. Antena — bring Mimi down; she decoded that the system registered the nest as "paquete pendiente". Wind with a warning plus the existing electric plates; the storm arrives for the way down.
  4. Almacén de Entregas Ya! (new) — the nest and Mamá Pata were collected for delivery; come down with Mamá Pata following and criticizing every hop. Conveyor belts and rideable drones; the belts run backwards at closing time.
  5. Cámara fría (new) — unclaimed packages, what was left of the nest. Ice sliding; the thaw starts for the way down.
  6. Centro de datos (new) — switch the routes off so it does not happen again. Combines the previous mechanics.
  7. Torre final — the headquarters shuts down from above and Pipo escapes with the whole family in a line behind him, each one a hop behind. Generated, different each run.
- **S7 — Retention.** Save progress to continue later; optional assist mode; in-level hints in the first floors and a retuned drone next to the feather in chapter 1.
- **S8 — Polish.** "investiga librerias y assets gratis en internet para pulir el juego". Better animations inside the current canvas (anticipation and stretch on hops, sibling following, transitions).
- **S9 — Illustrations.** "también la escritura de prompts para generar las imagenes, o si se las quieres delegar a codex, tambien es plausible, solo que se conserve el estilo." Write prompts for the new story images in the style of `PROMPTS-GEMINI.md`.
- **S10 — Data.** Store the game version per run and compare v1 against v2 in the dashboard. The database migration is written here and run by the user in the Supabase SQL Editor; it must not delete existing data.
- **S11 — itch.io page.** "Título del juego. Descripción breve. Controles e instrucciones. Imágenes o capturas. Versión del juego. Visibilidad pública o accesible mediante enlace. Etiquetas o categorías adecuadas. Desarrolladores" and the legend "que este trabajo fue desarrollado en la clase de diseño de videjugos de Jose Luis David Bonilla Carranza". The user uploads with their own account.

## Tasks

- [x] T1 · S5 · inline · Split `sitio/index.html` into CSS and JS files with identical behavior; add the test runner. Commit `8aaf0af`; proof: scripts byte-identical, `?qa` trace hash 1231654435 before and after.
- [x] T2 · S4, S6 · inline · Vertical slice on level 1: round trip with the sibling following, levers activated by the punch. RED→GREEN in `tests/reglas.test.js` (8 tests); browser check through `?qa`. Awaiting the user's play check.
- [~] T3 · S4 · inline · Packages that open the door, secret feather behind a second lever, level 1 at 24 floors, `Reglas.audit` level checker. Committed; logic checked through `?qa`, visuals of packages and door not looked at yet, no user play check yet.
- [ ] T4 · S6 · Levels 2 to 6 with their mechanics (pots, conveyors and rideable drones, ice, wind, combination).
- [ ] T5 · S4, S6 · Generated final tower and chase finale.
- [ ] T6 · S7 · Save and continue, assist mode, chapter 1 onboarding.
- [ ] T7 · S10 · Version per run, SQL migration, dashboard comparison v1 vs v2.
- [ ] T8 · S8, S9 · Animation and audio polish, story for the new levels, illustration prompts.
- [ ] T9 · S11 · itch.io package (ZIP), page copy, screenshots.
- [ ] T10 · S1 · Tarea 4 report (docx and pdf) with the Tarea 2/3 format.

## Log

- **L1 (2026-11-10, user, original request):**

  > Tarea 4: Mejora del diseño a partir de las observaciones y publicación en itch.io
  >
  > Introducción
  > A partir de los resultados obtenidos en la tarea anterior —métricas de validación de diseño, dashboard y observaciones del prototipo digital creado con IA—, el estudiante deberá mejorar el diseño del videojuego, aplicando cambios justificados en función de los hallazgos. Además, deberá ampliar el gameplay para ofrecer una experiencia más completa y publicar el juego en itch.io, dejando evidencia del proceso y del resultado final.
  >
  > El propósito es que las observaciones no queden como datos aislados, sino que se traduzcan en decisiones concretas de diseño: ajustes de jugabilidad, dificultad, interfaz, flujo, claridad de objetivos o experiencia general.
  >
  > Desarrollo
  > Análisis de las observaciones anteriores
  > Revisa las métricas, el dashboard y las conclusiones de la tarea anterior. Identifica al menos 3 observaciones principales que afecten el diseño del juego, por ejemplo:
  >
  > Dificultad demasiado alta o baja.
  > Falta de claridad en objetivos o controles.
  > Interfaz confusa.
  > Ritmo de juego poco fluido.
  > Necesidad de más contenido o duración.
  >
  > Priorización de mejoras
  > Clasifica las observaciones según su impacto en la experiencia del jugador. Justifica qué cambios se implementarán primero y por qué. Cada mejora debe estar vinculada a una observación previa.
  >
  > Implementación de mejoras de diseño
  > Aplica los cambios al prototipo digital. Puedes modificar:
  >
  > Mecánicas de juego.
  > Nivel de dificultad.
  > Tutorial o instrucciones.
  > Interfaz y feedback visual.
  > Flujo de niveles o progresión.
  > Ritmo y duración de la experiencia.
  >
  > Generación de un gameplay mayor
  > Amplía el gameplay para que la experiencia sea más completa. Esto puede incluir:
  >
  > Nuevos niveles, escenarios o retos.
  > Mayor duración de la partida.
  > Nuevas mecánicas o variaciones de las existentes.
  > Mejor progresión y curva de dificultad.
  > Un cierre o condición de final más clara.
  >
  > Actualización del dashboard o de las métricas
  > Si es posible, actualiza el dashboard con nuevas mediciones o comparaciones antes/después. Esto permitirá demostrar si las mejoras tuvieron efecto en la experiencia de juego.
  >
  > Publicación en itch.io
  > Publica el juego mejorado en https://itch.io/. La página debe incluir:
  >
  > Título del juego.
  > Descripción breve.
  > Controles e instrucciones.
  > Imágenes o capturas.
  > Versión del juego.
  > Visibilidad pública o accesible mediante enlace.
  > Etiquetas o categorías adecuadas.
  > Desarrolladores
  > leyeanda que este trabajo fue desarrollado en la clase de diseño de videjugos de Jose Luis David Bonilla Carranza

- **L2 (2026-11-10, user):** "necesito mas extenso el gameplay, minimo 30 minutos, planeemos mecanicas interesantes, divertidas e intuitivas. Investiga en internet inspiraciones o algo"
- **L3 (2026-11-10, user):** "hay alguna manera de extender el gameplay sin extender tanto la cantidad de niveles? podríamos migrar a otro motor que permita mejores animaciones, mecanicas, etc, lo sugieres?" Answer given: yes (round trip, taller levels with objectives, generated final tower); no engine migration.
- **L4 (2026-11-10, user):** "si, vamos con eso. Y tambien investiga librerias y assets gratis en internet para pulir el juego"
- **L5 (2026-11-10, user):** "también la escritura de prompts para generar las imagenes, o si se las quieres delegar a codex, tambien es plausible, solo que se conserve el estilo."
- **L6 (2026-11-10, evidence):** Tarea 3 baseline from Supabase, 37 runs on 3–4 Nov 2026: 57 % finish, median total 1:27, 3.2 deaths per run; funnel 37 → 29 → 23 → 21 → 16 surveys; deaths per chapter 1.3 / 1.8 / 1.2; causes drone 100 (83 %), blackout 14, long fall 6, glass 0; drones punched per run 0.5 / 0.4 / 0.2; feather 52 / 57 / 71 %; fun 4.4, clarity 4.5. Punch reach today: same floor, 0.84 cells.
- **L7 (2026-11-10, decision):** Library and asset research. Adopt ZzFX (MIT, under 1 KB) for sound effects and CC0 music loops (OpenGameArt, Kenney) played with native audio; keep the hand-drawn vector art instead of external sprite packs because they would break the style; skip GSAP (free but not open source, and the game loop already owns timing) and Howler (not needed for one music loop). Everything is bundled in the ZIP, no CDN at runtime.
- **L8 (2026-11-10, route):** T1 and T2 inline. T1 has no meaningful RED (mechanical move); proof is byte equality of the concatenated scripts plus an identical `?qa` trace before and after.
- **L9 (2026-11-10, evidence, T2):** Level 1 slice verified in the browser with `?qa`: hopping into the bridge while it is off drops Pipo back to floor 1; the punch out of reach does nothing; the punch within 1.3 cells flips the lever and the bridge holds; touching Tina switches to the way down (night tint, 5 drones, 5 platforms gone, flags saving downward, death marked `d`); reaching the ground floor closes the level. Chapters 2 and 3 keep the old behavior: movement trace hash -2098329918 on both the base and the branch. No console errors in normal mode.
- **L10 (2026-11-10, decision):** Punch reach raised from 0.84 to 1.3 cells (observation: punch barely used, players asked for more range). The sibling is a follower that cannot die, to avoid escort frustration. A night drone placed on a flag floor killed Pipo right after respawn, so drones never patrol flag floors.
- **L11 (2026-11-10, open):** Rescued siblings could get an ability each (idea for T4). Dropping makes the way down faster than the way up, so the 30 minute estimate must be re-measured once level 1 has its final height.
- **L12 (2026-11-10, user):** "si siente bien, pero cómo se justificará narrativamente?" (play check of the T2 slice passed).
- **L13 (2026-11-10, user):** "me parece bien tu propuesta" — accepts the narrative justification and the seven-step arc with Mamá Pata packed by mistake halfway through; Antena moves to third place, wind goes to level 3 and ice to level 5. S6 rewritten.
- **L14 (2026-11-10, route):** T3 to T6 inline, sequentially: every mechanic edits the same engine files (`nivel.js`, `partida.js`, `dibujo.js`), so the units are not disjoint and parallel writers do not apply. Level layouts are guarded by `Reglas.audit`, a timing-free reachability check run by `node --test`.
- **L15 (2026-11-10, evidence, T3):** 20 node tests green, including the audit of the three levels. Through `?qa` without drones on level 1: packages 1 to 3 are collected, hopping into the closed door drops Pipo back to floor 22, the door opens with the third package, lever b switches the pink bridge on and the feather is collected, touching Tina starts the way down. The audit tests were written before the implementation but only run after it, so RED was not observed for them. Stopped here because the session's usage limit was reached. Next: look at the package and door drawing, play level 1 end to end, then T4.
