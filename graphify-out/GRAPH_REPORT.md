# Graph Report - TP_DT2_Opencode  (2026-11-03)

## Corpus Check
- 107 files · ~143,049 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 5, .css 1)

## Summary
- 1303 nodes · 2860 edges · 63 communities (48 shown, 15 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 235 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc708857`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LevelGenerator
- main.js
- LevelGenerator.js
- package.json
- Game
- Projectile
- Hud
- EntityFactory
- test-tower.mjs
- MenuButton
- test-levels.mjs
- README.md
- PlayerFx
- MainMenu
- AchievementStore
- TutorialManager
- LevelValidator.js
- Trampoline
- Portal
- Niveles 3 a 5 — Diseño
- EntityFactory.js
- Goal
- playbot.js
- .onGoalReached
- MainMenu.js
- audit-fairness.mjs
- Game.js
- 2. Estado actual (hecho)
- LevelShapes.js
- GamePace
- Music.js
- Anexo C — Cuestionario para personalizar el plan
- test-shapes.mjs
- MenuBackground
- Hazard
- Plan de mejora — Movimiento, recolección y tensión (Fast Move)
- Audio.js
- Fx
- CameraFx
- 1. Diagnóstico (verificado en el código)
- test-variety.mjs
- GDD_b5443b99.md
- Metrics
- test-achievements.mjs
- GameOver.js
- FragilePlatform
- D.6 Registro de avance
- Hud.js
- Playtest 1 — Guía de la sesión
- TensionDirector
- EntityFactory.js
- 7. Pilar 3 — Tensión y frenesí
- Pause
- levels.js
- Point
- test-models.mjs
- LevelIntro
- test-levels-comprehensive.mjs
- CollectFx
- RisingVoid
- AchievementToast
- 12. Medición y playtest

## God Nodes (most connected - your core abstractions)
1. `LevelGenerator` - 112 edges
2. `Hud` - 48 edges
3. `Game` - 46 edges
4. `WORLD` - 32 edges
5. `MainMenu` - 32 edges
6. `top()` - 30 edges
7. `left()` - 30 edges
8. `right()` - 30 edges
9. `2. Estado actual (hecho)` - 28 edges
10. `Niveles aleatorios (generador + validador)` - 25 edges

## Surprising Connections (you probably didn't know these)
- `3. Nivel 3 — «Frágiles»` --references--> `FragilePlatform`  [INFERRED]
  docs/superpowers/specs/2026-10-26-niveles-3-a-5-design.md → src/entities/FragilePlatform.js
- `1.5 Visual (`Game.js`, entidades)` --references--> `Goal`  [INFERRED]
  docs/PLAN_FEEL.md → src/entities/Goal.js
- `4.2 Mecánica` --references--> `Projectile`  [INFERRED]
  docs/PLAN.md → src/entities/Projectile.js
- `Tier C` --references--> `EntityFactory`  [INFERRED]
  docs/PLAN_FEEL.md → src/patterns/EntityFactory.js
- `Enfoque` --references--> `LevelValidator`  [INFERRED]
  docs/superpowers/specs/2026-10-24-variedad-generador-niveles-design.md → src/systems/LevelValidator.js

## Import Cycles
- None detected.

## Communities (63 total, 15 thin omitted)

### Community 0 - "LevelGenerator"
Cohesion: 0.07
Nodes (23): Carriles y validación con tiempo (N3, E4c), Lecciones del generador (errores que no hay que repetir), Niveles aleatorios (generador + validador), File Structure, Resultado y desvíos (2026-10-24), Review Focus, Task 1: Arnés de variedad y línea base, Task 2: Tuning por nivel y rango de trampolines en el invariante (+15 more)

### Community 1 - "main.js"
Cohesion: 0.16
Nodes (5): phaser, config, Boot, Preloader, POINT_SPAWN_CONFIG

### Community 2 - "LevelGenerator.js"
Cohesion: 0.05
Nodes (40): ASSIST_MAX, CANDIDATE_POOL, CLEAR_HORIZONTAL, CLEAR_VERTICAL, DECONGEST_MAX, DEFAULT_ATTEMPTS, DIST_COLS, DIST_MIN_CELLS (+32 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (30): allowScripts, esbuild@0.25.2, author, bugs, url, dependencies, phaser, description (+22 more)

### Community 5 - "Projectile"
Cohesion: 0.08
Nodes (7): BEHAVIORS, Projectile, PROJECTILE_CONFIG, RastraBehavior, RicochetBehavior, StandardBehavior, ProjectileManager

### Community 6 - "Hud"
Cohesion: 0.10
Nodes (4): drawArc(), drawBar(), hex(), Hud

### Community 8 - "test-tower.mjs"
Cohesion: 0.15
Nodes (13): createRng(), BOUNCE_RISE, buildTower(), overlapX(), STYLES, COUNT, counts, FIRST (+5 more)

### Community 9 - "MenuButton"
Cohesion: 0.08
Nodes (5): GameOver, Ranking, Leaderboard, MenuButton, NameEntry

### Community 10 - "test-levels.mjs"
Cohesion: 0.12
Nodes (13): LEVEL_BASELINES, DIFFICULTY_BAND, LEVEL_TUNING, TIMER_BANDS, TIMER_RULES, COUNT, failures, FIRST (+5 more)

### Community 11 - "README.md"
Cohesion: 0.06
Nodes (32): 1. Idea y concepto, 2. Flujo de juego, 3. Controles, 4.1 Movimiento del jugador, 4.2 Puntos, combo, bono de tiempo y rangos, 4.3 Cadena aérea, 4.4 Trampolines (nivel 2), 4.5 Proyectiles (nivel 2) (+24 more)

### Community 12 - "PlayerFx"
Cohesion: 0.08
Nodes (9): 1.1 Movimiento (`entities/Player.js`), Apartado 4 — Arquitectura propuesta, Tier A (sin riesgo), FEEL, MULTIPLIER_COLORS, Player, clamp(), PlayerFx (+1 more)

### Community 14 - "AchievementStore"
Cohesion: 0.16
Nodes (16): File Structure, Global Constraints, Logros y medallas Implementation Plan, Review Focus, Self-review, Task 1: Reglas y almacén de logros, Task 2: Cableado en `Game.js`, Task 4: Verificación final y cierre en `docs/PLAN.md` (+8 more)

### Community 15 - "TutorialManager"
Cohesion: 0.06
Nodes (26): 10. Solicitar confirmación y realizar commit y push, 11. Comunicar el análisis y los resultados, 1. Alcance y contexto, 2. Revisar la documentación y el requisito, 3. Analizar conflictos e impacto, 4. Preguntar antes de avanzar ante dudas, 5. Utilizar POO y patrones de diseño, 6. Reutilizar código existente (+18 more)

### Community 16 - "LevelValidator.js"
Cohesion: 0.12
Nodes (16): TRAMPOLINE_CONFIG, buildPlatforms(), DASH_COOLDOWN_FRAMES, DASH_FRAMES, JUMP_V, LevelValidator, moveBody(), PORTAL_CHARGE_FRAMES (+8 more)

### Community 19 - "Niveles 3 a 5 — Diseño"
Cohesion: 0.13
Nodes (13): 1. Objetivo y principios, 2. Resumen, 3. Nivel 3 — «Frágiles», 5. Nivel 5 — «Final», 6. Qué se toca, 7. Conflictos y riesgos, 8. Fuera de alcance, 9. Verificación (criterios de aceptación) (+5 more)

### Community 20 - "EntityFactory.js"
Cohesion: 0.31
Nodes (3): 4. Nivel 4 — «Peligro», PowerUp, POWERUP_CONFIG

### Community 21 - "Goal"
Cohesion: 0.16
Nodes (8): 4.1 Visual, 4.2 Mecánica, 4.3 Game feel, 4. Propuesta de expansión (aprobada), Fuera de alcance (para cuidar el proyecto), Goal, GOAL_CONFIG, lerpColor()

### Community 22 - "playbot.js"
Cohesion: 0.50
Nodes (6): planBest(), playLevel(), realState(), setKeys(), step(), targets()

### Community 23 - ".onGoalReached"
Cohesion: 0.19
Nodes (10): Arquitectura, Catálogo (decidido por el usuario), Criterios de aceptación, Fuera de alcance, Logros y medallas — diseño, Objetivo, Pendientes a confirmar en implementación, Reglas (+2 more)

### Community 24 - "MainMenu.js"
Cohesion: 0.13
Nodes (13): COLORS, Badges, cache, CampaignBuilder, createPool(), generateLevelInWorker(), pending, HighScore (+5 more)

### Community 25 - "audit-fairness.mjs"
Cohesion: 0.17
Nodes (7): PLAYER_CONFIG, COUNT, FIRST, generator, issues, rows, validator

### Community 27 - "Game.js"
Cohesion: 0.16
Nodes (11): PRACTICE, PRACTICE_BY_LEVEL, themeFor(), THEMES, LevelSummary, applyToConfig(), bonusOf(), CLASHES (+3 more)

### Community 28 - "2. Estado actual (hecho)"
Cohesion: 0.12
Nodes (6): 2. Estado actual (hecho), 10. Pilar 6 — Transiciones, pantallas y cierre, Reglas de puntaje acordadas, Verificación realizada, GameTimer, ScoreManager

### Community 29 - "LevelShapes.js"
Cohesion: 0.11
Nodes (39): BOUNCE_ROWS, BOUNCE_STYLES, buildBounce(), buildLayout(), COUNT, distributed(), fitsLayout(), floorSpots() (+31 more)

### Community 30 - "GamePace"
Cohesion: 0.12
Nodes (10): 2.1 Pilares de feel, 2.2 Clasificación de cambios (obligatoria para aprobar), 2.3 Convenciones de código (de `AGENTS.md`), 2. Principios de diseño y gobernanza, 3.1 Presupuestos de rendimiento (medibles), 3.2 Phaser 4 (cosas a **verificar** antes de apostar por ellas), 3.3 Re-validación obligatoria al tocar la física (solo J8), 3. Restricciones técnicas (+2 more)

### Community 31 - "Music.js"
Cohesion: 0.10
Nodes (30): 8.1 Motor (`AudioBus.js` + extensión de `Audio.js`), StartGame(), bus, chain(), claim(), duck(), ensureContext(), makeImpulse() (+22 more)

### Community 32 - "Anexo C — Cuestionario para personalizar el plan"
Cohesion: 0.06
Nodes (29): Anexo C — Cuestionario para personalizar el plan, Apartado 0 — Resumen ejecutivo y visión, Apartado 10 — Pilar 6: Transiciones y pantallas, Apartado 11 — Plan de ejecución por fases, Apartado 12 — Medición y playtest, Apartado 13 — Riesgos, Apartado 14 — Decisiones del equipo (resumen), Apartado 15 — Fuera de alcance (+21 more)

### Community 33 - "test-shapes.mjs"
Cohesion: 0.08
Nodes (25): Task 5: Forma `pozo` (wall jump) y calibración de canales, BASE_WIDTH, stretchX(), unstretchX(), widen(), CRAMPED_HEADROOM, buildShape(), CHANNEL_MAX (+17 more)

### Community 35 - "Hazard"
Cohesion: 0.28
Nodes (3): Hazard, HAZARD_CONFIG, mix()

### Community 36 - "Plan de mejora — Movimiento, recolección y tensión (Fast Move)"
Cohesion: 0.11
Nodes (18): 0. Resumen ejecutivo, 13. Riesgos y mitigaciones, 15. Fuera de alcance (para cuidar el proyecto), 5. Pilar 1 — Movimiento, 6. Pilar 2 — Recolección, 8.2 Paleta de SFX (nuevos/rehechos), 8.3 Música procedural (`Music.js`), 8.4 Accesibilidad y modos (importante para un juego frenético) (+10 more)

### Community 37 - "Audio.js"
Cohesion: 0.17
Nodes (10): Audio, clamp(), EVENTS, panFor(), PENTATONIC, COMBO_COLORS, PROJECTILE_SPAWN_CONFIG, Lang (+2 more)

### Community 39 - "CameraFx"
Cohesion: 0.17
Nodes (5): 4.1 Módulos nuevos, 4.2 Patrones (con el porqué, como pide `AGENTS.md`), 4.3 Contrato de eventos (nuevos, además de los 3 existentes), 4. Arquitectura propuesta, CameraFx

### Community 40 - "1. Diagnóstico (verificado en el código)"
Cohesion: 0.16
Nodes (8): 14. Decisiones que necesito del equipo, 1.2 Recolección (`Game.js`, `Point.js`, `PointSpawner.js`, `ScoreManager.js`), 1.3 Tensión (`ProjectileManager.js`, `Projectile.js`, `GameTimer.js`, `Hud.js`), 1.4 Audio (`Audio.js`), 1.5 Visual (`Game.js`, entidades), 1.6 Riesgo estructural: el validador depende de la física, 1. Diagnóstico (verificado en el código), PointSpawner

### Community 41 - "test-variety.mjs"
Cohesion: 0.08
Nodes (20): ALL_LEVELS, GENERATION_COMFORT, validator, out, validator, args, base, bins (+12 more)

### Community 42 - "GDD_b5443b99.md"
Cohesion: 0.12
Nodes (15): 1. Idea y concepto, 2. Flujo de juego, 3. Controles, 4.1 Movimiento del jugador, 4.2 Puntos, combo, bono de tiempo y rangos, 4.3 Cadena aérea, 4.4 Trampolines (nivel 2), 4.5 Proyectiles (nivel 2) (+7 more)

### Community 43 - "Metrics"
Cohesion: 0.21
Nodes (4): ENABLED, Metrics, metricsEnabled(), installPlaytest()

### Community 44 - "test-achievements.mjs"
Cohesion: 0.14
Nodes (9): TIMER_CONFIG, all, before, mem, cfg, noProj, withProj, scene (+1 more)

### Community 45 - "GameOver.js"
Cohesion: 0.15
Nodes (13): ENDING_CONFIG, LEADERBOARD_SIZE, NAME_LENGTH, STORAGE_KEYS, CITY_LAYERS, STAR_LAYERS, STYLES, Music (+5 more)

### Community 47 - "D.6 Registro de avance"
Cohesion: 0.19
Nodes (7): D.6 Registro de avance, Global Constraints, Backdrop, drawRidge(), drawTowers(), rng(), PlatformGlow

### Community 48 - "Hud.js"
Cohesion: 0.18
Nodes (10): CampaignSummary, COMBO_COLORS, HUD_CONFIG, RANK_COLORS, RANK_ORDER, RANK_PER_QUOTA, rankFor(), rankThresholds() (+2 more)

### Community 49 - "Playtest 1 — Guía de la sesión"
Cohesion: 0.18
Nodes (10): 1. Las dos versiones, 2. Quién juega y en qué orden, 3. Qué probar en la versión B (checklist), 4. Cómo se miden los números (solo versión B), 5. El formulario (tres preguntas), 6. Metas (de `docs/PLAN_FEEL.md` §12.2), 7. Qué decidimos después (J8), 8. Limpieza al terminar (+2 more)

### Community 50 - "TensionDirector"
Cohesion: 0.17
Nodes (10): 11.1 Quick wins (primeras horas, máximo impacto), 11.2 Mapeo con `PLAN.md`, 11. Plan de ejecución por fases, 7.1 `TensionDirector` (tier A, infraestructura), Anexo D — Decisiones del equipo (cuestionario respondido el 24/10/2026), D.2 Decisiones por pilar, D.3 Tensiones entre respuestas (a confirmar), D.4 Cambios al alcance por estas decisiones (+2 more)

### Community 51 - "EntityFactory.js"
Cohesion: 0.29
Nodes (3): FRAGILE_CONFIG, POINT_CONFIG, PORTAL_CONFIG

### Community 52 - "7. Pilar 3 — Tensión y frenesí"
Cohesion: 0.33
Nodes (6): 7.2 Protocolo "últimos 10 segundos" (tier A), 7.3 Estado **FRENESÍ** (x5, tier A), 7.4 Telegrafiado y legibilidad de proyectiles (tier A), 7.5 Cerca-por-poco (graze), 7.6 Ritmo de la partida (tier C — requiere aprobación), 7. Pilar 3 — Tensión y frenesí

### Community 54 - "levels.js"
Cohesion: 0.16
Nodes (8): ACTIVE_LEVELS, BASE_LEVELS, LEVELS, WORLD, VOID_CONFIG, AmbientParticles, ParallaxBackground, generator

### Community 56 - "test-models.mjs"
Cohesion: 0.29
Nodes (6): LEVEL_SHAPES, COUNT, failures, FIRST, generator, validator

### Community 58 - "test-levels-comprehensive.mjs"
Cohesion: 0.22
Nodes (4): SX, errors, gen, LEVELS_TO_TEST

### Community 62 - "12. Medición y playtest"
Cohesion: 0.50
Nodes (4): 12.1 Instrumentación (`Metrics` + `DebugOverlay`, solo en desarrollo), 12.2 Metas cuantificables (se ajustan con la línea base de J0), 12.3 Protocolo, 12. Medición y playtest

## Knowledge Gaps
- **1 isolated node(s):** `terser`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 485 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LevelGenerator` connect `LevelGenerator` to `test-shapes.mjs`, `LevelGenerator.js`, `test-models.mjs`, `Game`, `test-variety.mjs`, `test-levels.mjs`, `levels.js`, `MainMenu.js`, `audit-fairness.mjs`, `test-levels-comprehensive.mjs`, `Game.js`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Hud` (e.g. with `2. Estado actual (hecho)` and `4.1 Visual`) actually correct?**
  _`Hud` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `terser` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LevelGenerator` be split into smaller, more focused modules?**
  _Cohesion score 0.07487542617361657 - nodes in this community are weakly interconnected._
- **Why does `Hud` connect `Hud` to `Game`, `CameraFx`, `Hud.js`, `TensionDirector`, `Goal`, `Game.js`, `2. Estado actual (hecho)`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `Game` (e.g. with `1. Contexto y reglas que condicionan el plan` and `2. Estado actual (hecho)`) actually correct?**
  _`Game` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `LevelGenerator.js` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._