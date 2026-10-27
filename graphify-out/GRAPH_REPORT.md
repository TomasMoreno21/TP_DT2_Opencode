# Graph Report - TP_DT2_Opencode  (2026-10-27)

## Corpus Check
- 101 files · ~137,231 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 5, .css 1)

## Summary
- 1268 nodes · 2807 edges · 58 communities (45 shown, 13 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 241 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `52460ecd`
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
- AGENTS.md — Configuración de IA Asistente (Fast Move)
- MenuButton
- test-levels.mjs
- README.md
- PlayerFx
- MainMenu
- 2. Estado actual (hecho)
- TutorialManager
- LevelValidator.js
- Trampoline
- Portal
- Niveles 3 a 5 — Diseño
- PowerUp
- Goal
- playbot.js
- RankingTable.js
- Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)
- test-models.mjs
- Gem
- Game.js
- ScoreManager
- LevelShapes.js
- GamePace
- Music.js
- Anexo C — Cuestionario para personalizar el plan
- test-shapes.mjs
- D.6 Registro de avance
- MainMenu.js
- Plan de mejora — Movimiento, recolección y tensión (Fast Move)
- PlatformGlow
- Fx
- CameraFx
- PointSpawner
- test-variety.mjs
- GDD_b5443b99.md
- Metrics
- Achievements.js
- Audio.js
- FragilePlatform
- CollectFx.js
- Hud.js
- Playtest 1 — Guía de la sesión
- AchievementStore
- MenuBackground
- 5. Pilar 1 — Movimiento
- Pause
- levels.js
- Point
- Logros y medallas — diseño
- TensionDirector

## God Nodes (most connected - your core abstractions)
1. `LevelGenerator` - 111 edges
2. `Hud` - 48 edges
3. `Game` - 42 edges
4. `MainMenu` - 32 edges
5. `top()` - 30 edges
6. `left()` - 30 edges
7. `right()` - 30 edges
8. `2. Estado actual (hecho)` - 29 edges
9. `WORLD` - 27 edges
10. `Niveles aleatorios (generador + validador)` - 25 edges

## Surprising Connections (you probably didn't know these)
- `3. Nivel 3 — «Frágiles»` --references--> `FragilePlatform`  [INFERRED]
  docs/superpowers/specs/2026-10-26-niveles-3-a-5-design.md → src/entities/FragilePlatform.js
- `4.2 Mecánica` --references--> `Projectile`  [INFERRED]
  docs/PLAN.md → src/entities/Projectile.js
- `Tier C` --references--> `EntityFactory`  [INFERRED]
  docs/PLAN_FEEL.md → src/patterns/EntityFactory.js
- `Enfoque` --references--> `LevelValidator`  [INFERRED]
  docs/superpowers/specs/2026-10-24-variedad-generador-niveles-design.md → src/systems/LevelValidator.js
- `9. Verificación (criterios de aceptación)` --references--> `LevelValidator`  [INFERRED]
  docs/superpowers/specs/2026-10-26-niveles-3-a-5-design.md → src/systems/LevelValidator.js

## Import Cycles
- None detected.

## Communities (58 total, 13 thin omitted)

### Community 0 - "LevelGenerator"
Cohesion: 0.07
Nodes (25): Carriles y validación con tiempo (N3, E4c), Lecciones del generador (errores que no hay que repetir), Niveles aleatorios (generador + validador), File Structure, Resultado y desvíos (2026-10-24), Review Focus, Task 1: Arnés de variedad y línea base, Task 2: Tuning por nivel y rango de trampolines en el invariante (+17 more)

### Community 1 - "main.js"
Cohesion: 0.12
Nodes (8): phaser, config, StartGame(), Boot, Preloader, bus, Music, POINT_SPAWN_CONFIG

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

### Community 8 - "AGENTS.md — Configuración de IA Asistente (Fast Move)"
Cohesion: 0.12
Nodes (14): 10. Solicitar confirmación y realizar commit y push, 11. Comunicar el análisis y los resultados, 1. Alcance y contexto, 2. Revisar la documentación y el requisito, 3. Analizar conflictos e impacto, 4. Preguntar antes de avanzar ante dudas, 5. Utilizar POO y patrones de diseño, 6. Reutilizar código existente (+6 more)

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
Cohesion: 0.10
Nodes (5): 1.1 Movimiento (`entities/Player.js`), Apartado 4 — Arquitectura propuesta, Player, clamp(), PlayerFx

### Community 14 - "2. Estado actual (hecho)"
Cohesion: 0.13
Nodes (9): 2. Estado actual (hecho), 10. Pilar 6 — Transiciones, pantallas y cierre, Reglas de puntaje acordadas, Verificación realizada, Self-review, goldInAllLevels(), CollectFx, hex() (+1 more)

### Community 15 - "TutorialManager"
Cohesion: 0.24
Nodes (3): load(), save(), TutorialManager

### Community 16 - "LevelValidator.js"
Cohesion: 0.10
Nodes (20): 6. Qué se toca, moverOffset(), MOVING_PLATFORM_CONFIG, MovingPlatform, buildPlatforms(), DASH_COOLDOWN_FRAMES, DASH_FRAMES, JUMP_V (+12 more)

### Community 19 - "Niveles 3 a 5 — Diseño"
Cohesion: 0.13
Nodes (10): 1. Objetivo y principios, 2. Resumen, 3. Nivel 3 — «Frágiles», 4. Nivel 4 — «Peligro», 5. Nivel 5 — «Final», 7. Conflictos y riesgos, 8. Fuera de alcance, 9. Verificación (criterios de aceptación) (+2 more)

### Community 21 - "Goal"
Cohesion: 0.18
Nodes (8): 1.3 Tensión (`ProjectileManager.js`, `Projectile.js`, `GameTimer.js`, `Hud.js`), 1.4 Audio (`Audio.js`), 1.5 Visual (`Game.js`, entidades), 1.6 Riesgo estructural: el validador depende de la física, 1. Diagnóstico (verificado en el código), Goal, GOAL_CONFIG, lerpColor()

### Community 22 - "playbot.js"
Cohesion: 0.50
Nodes (6): planBest(), playLevel(), realState(), setKeys(), step(), targets()

### Community 23 - "RankingTable.js"
Cohesion: 0.32
Nodes (6): LEADERBOARD_SIZE, NAME_LENGTH, STORAGE_KEYS, createRankingTable(), formatDate(), PLACE_COLORS

### Community 24 - "Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)"
Cohesion: 0.13
Nodes (14): 1. Contexto y reglas que condicionan el plan, 3. Plan de ejecución del GDD (mecánicas por nivel), 4.1 Visual, 4.2 Mecánica, 4.3 Game feel, 4. Propuesta de expansión (aprobada), 5. Orden de ejecución consolidado, 6. Puertas de calidad (qué se verifica antes de cerrar cada fase) (+6 more)

### Community 25 - "test-models.mjs"
Cohesion: 0.08
Nodes (18): ALL_LEVELS, PLAYER_CONFIG, GENERATION_COMFORT, LEVEL_SHAPES, COUNT, FIRST, generator, issues (+10 more)

### Community 26 - "Gem"
Cohesion: 0.24
Nodes (3): FRAGILE_CONFIG, Gem, GEM_CONFIG

### Community 27 - "Game.js"
Cohesion: 0.13
Nodes (12): PRACTICE, PRACTICE_BY_LEVEL, themeFor(), THEMES, AchievementToast, Badges, applyToConfig(), bonusOf() (+4 more)

### Community 28 - "ScoreManager"
Cohesion: 0.15
Nodes (4): 14. Decisiones que necesito del equipo, 1.2 Recolección (`Game.js`, `Point.js`, `PointSpawner.js`, `ScoreManager.js`), Task 2: Cableado en `Game.js`, ScoreManager

### Community 29 - "LevelShapes.js"
Cohesion: 0.11
Nodes (40): HAZARD_CONFIG, BOUNCE_ROWS, BOUNCE_STYLES, buildBounce(), buildLayout(), COUNT, distributed(), fitsLayout() (+32 more)

### Community 30 - "GamePace"
Cohesion: 0.12
Nodes (10): 2.1 Pilares de feel, 2.2 Clasificación de cambios (obligatoria para aprobar), 2.3 Convenciones de código (de `AGENTS.md`), 2. Principios de diseño y gobernanza, 3.1 Presupuestos de rendimiento (medibles), 3.2 Phaser 4 (cosas a **verificar** antes de apostar por ellas), 3.3 Re-validación obligatoria al tocar la física (solo J8), 3. Restricciones técnicas (+2 more)

### Community 31 - "Music.js"
Cohesion: 0.10
Nodes (32): 8.1 Motor (`AudioBus.js` + extensión de `Audio.js`), 8.2 Paleta de SFX (nuevos/rehechos), 8.3 Música procedural (`Music.js`), 8.4 Accesibilidad y modos (importante para un juego frenético), 8. Pilar 4 — Audio (transversal), chain(), claim(), duck() (+24 more)

### Community 32 - "Anexo C — Cuestionario para personalizar el plan"
Cohesion: 0.06
Nodes (29): Anexo C — Cuestionario para personalizar el plan, Apartado 0 — Resumen ejecutivo y visión, Apartado 10 — Pilar 6: Transiciones y pantallas, Apartado 11 — Plan de ejecución por fases, Apartado 12 — Medición y playtest, Apartado 13 — Riesgos, Apartado 14 — Decisiones del equipo (resumen), Apartado 15 — Fuera de alcance (+21 more)

### Community 33 - "test-shapes.mjs"
Cohesion: 0.08
Nodes (25): BASE_WIDTH, stretchX(), SX, unstretchX(), widen(), CRAMPED_HEADROOM, buildShape(), CHANNEL_MAX (+17 more)

### Community 34 - "D.6 Registro de avance"
Cohesion: 0.15
Nodes (11): Anexo D — Decisiones del equipo (cuestionario respondido el 24/10/2026), D.2 Decisiones por pilar, D.3 Tensiones entre respuestas (a confirmar), D.4 Cambios al alcance por estas decisiones, D.5 Calendario propuesto hasta el 07/11 (ajustable), D.6 Registro de avance, Global Constraints, Backdrop (+3 more)

### Community 35 - "MainMenu.js"
Cohesion: 0.17
Nodes (13): ENDING_CONFIG, COLORS, cache, CampaignBuilder, createPool(), generateLevelInWorker(), pending, HighScore (+5 more)

### Community 36 - "Plan de mejora — Movimiento, recolección y tensión (Fast Move)"
Cohesion: 0.12
Nodes (15): 0. Resumen ejecutivo, 12.1 Instrumentación (`Metrics` + `DebugOverlay`, solo en desarrollo), 12.2 Metas cuantificables (se ajustan con la línea base de J0), 12.3 Protocolo, 12. Medición y playtest, 13. Riesgos y mitigaciones, 15. Fuera de alcance (para cuidar el proyecto), 6. Pilar 2 — Recolección (+7 more)

### Community 39 - "CameraFx"
Cohesion: 0.18
Nodes (5): 4.1 Módulos nuevos, 4.2 Patrones (con el porqué, como pide `AGENTS.md`), 4.3 Contrato de eventos (nuevos, además de los 3 existentes), 4. Arquitectura propuesta, CameraFx

### Community 41 - "test-variety.mjs"
Cohesion: 0.12
Nodes (15): args, base, bins, coarse, COUNT, failures, FILE, FIRST (+7 more)

### Community 42 - "GDD_b5443b99.md"
Cohesion: 0.12
Nodes (15): 1. Idea y concepto, 2. Flujo de juego, 3. Controles, 4.1 Movimiento del jugador, 4.2 Puntos, combo, bono de tiempo y rangos, 4.3 Cadena aérea, 4.4 Trampolines (nivel 2), 4.5 Proyectiles (nivel 2) (+7 more)

### Community 43 - "Metrics"
Cohesion: 0.21
Nodes (4): ENABLED, Metrics, metricsEnabled(), installPlaytest()

### Community 44 - "Achievements.js"
Cohesion: 0.11
Nodes (11): TIMER_CONFIG, hex(), LevelIntro, all, before, mem, cfg, noProj (+3 more)

### Community 45 - "Audio.js"
Cohesion: 0.13
Nodes (14): Audio, clamp(), EVENTS, panFor(), PENTATONIC, CampaignSummary, PROJECTILE_SPAWN_CONFIG, Lang (+6 more)

### Community 47 - "CollectFx.js"
Cohesion: 0.31
Nodes (4): FEEL, MULTIPLIER_COLORS, SCARF_WIDTHS, COMBO_COLORS

### Community 48 - "Hud.js"
Cohesion: 0.26
Nodes (9): COMBO_COLORS, HUD_CONFIG, RANK_COLORS, RANK_ORDER, RANK_PER_QUOTA, rankFor(), rankThresholds(), TIME_BONUS_PER_SECOND (+1 more)

### Community 49 - "Playtest 1 — Guía de la sesión"
Cohesion: 0.18
Nodes (10): 1. Las dos versiones, 2. Quién juega y en qué orden, 3. Qué probar en la versión B (checklist), 4. Cómo se miden los números (solo versión B), 5. El formulario (tres preguntas), 6. Metas (de `docs/PLAN_FEEL.md` §12.2), 7. Qué decidimos después (J8), 8. Limpieza al terminar (+2 more)

### Community 50 - "AchievementStore"
Cohesion: 0.18
Nodes (13): File Structure, Global Constraints, Logros y medallas Implementation Plan, Review Focus, Task 1: Reglas y almacén de logros, Task 4: Verificación final y cierre en `docs/PLAN.md`, ACHIEVEMENTS, AchievementStore (+5 more)

### Community 52 - "5. Pilar 1 — Movimiento"
Cohesion: 0.50
Nodes (4): 5. Pilar 1 — Movimiento, Tier A (sin riesgo), Tier B (ajuste de mecánica — requiere aprobación y re-validación), Tier C

### Community 54 - "levels.js"
Cohesion: 0.17
Nodes (7): ACTIVE_LEVELS, BASE_LEVELS, LEVELS, WORLD, AmbientParticles, LevelSummary, generator

### Community 56 - "Logros y medallas — diseño"
Cohesion: 0.19
Nodes (10): Arquitectura, Catálogo (decidido por el usuario), Criterios de aceptación, Fuera de alcance, Logros y medallas — diseño, Objetivo, Pendientes a confirmar en implementación, Reglas (+2 more)

### Community 58 - "TensionDirector"
Cohesion: 0.15
Nodes (11): 11.1 Quick wins (primeras horas, máximo impacto), 11.2 Mapeo con `PLAN.md`, 11. Plan de ejecución por fases, 7.1 `TensionDirector` (tier A, infraestructura), 7.2 Protocolo "últimos 10 segundos" (tier A), 7.3 Estado **FRENESÍ** (x5, tier A), 7.4 Telegrafiado y legibilidad de proyectiles (tier A), 7.5 Cerca-por-poco (graze) (+3 more)

## Knowledge Gaps
- **1 isolated node(s):** `terser`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 457 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LevelGenerator` connect `LevelGenerator` to `test-shapes.mjs`, `LevelGenerator.js`, `MainMenu.js`, `Game`, `test-variety.mjs`, `test-levels.mjs`, `levels.js`, `test-models.mjs`, `Game.js`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Hud` (e.g. with `2. Estado actual (hecho)` and `4.1 Visual`) actually correct?**
  _`Hud` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `terser` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LevelGenerator` be split into smaller, more focused modules?**
  _Cohesion score 0.07288888888888889 - nodes in this community are weakly interconnected._
- **Why does `2. Estado actual (hecho)` connect `2. Estado actual (hecho)` to `LevelGenerator`, `Game`, `Projectile`, `Hud`, `EntityFactory`, `PlayerFx`, `MainMenu`, `Achievements.js`, `LevelValidator.js`, `Hud.js`, `AchievementStore`, `Niveles 3 a 5 — Diseño`, `Goal`, `Logros y medallas — diseño`, `Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)`, `ScoreManager`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `Game` (e.g. with `1. Contexto y reglas que condicionan el plan` and `2. Estado actual (hecho)`) actually correct?**
  _`Game` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._