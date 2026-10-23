# Graph Report - TP_DT2_Opencode  (2026-10-22)

## Corpus Check
- 49 files · ~72,834 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 5, .css 1)

## Summary
- 609 nodes · 1275 edges · 34 communities (17 shown, 17 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd900f60`
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
- LevelValidator.js
- AGENTS.md — Configuración de IA Asistente (Fast Move)
- test-levels.mjs
- README.md
- Player
- MainMenu
- 2. Estado actual (hecho)
- Game.js
- LevelValidator
- Trampoline
- Portal
- Hazard
- PowerUp
- Goal
- playbot.js
- Point
- PointSpawner.js
- levels.js
- Gem
- Game.js
- ScoreManager
- Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)
- GamePace
- FloatingText
- 4. Propuesta de expansión (aprobada)

## God Nodes (most connected - your core abstractions)
1. `LevelGenerator` - 94 edges
2. `Game` - 28 edges
3. `top()` - 25 edges
4. `left()` - 25 edges
5. `right()` - 25 edges
6. `Hud` - 21 edges
7. `Player` - 18 edges
8. `MainMenu` - 18 edges
9. `Niveles aleatorios (generador + validador)` - 18 edges
10. `EntityFactory` - 14 edges

## Surprising Connections (you probably didn't know these)
- `4.2 Mecánica` --references--> `Projectile`  [INFERRED]
  docs/PLAN.md → src/entities/Projectile.js
- `4.3 Game feel` --references--> `ScoreManager`  [INFERRED]
  docs/PLAN.md → src/systems/ScoreManager.js
- `2. Estado actual (hecho)` --references--> `Goal`  [INFERRED]
  docs/PLAN.md → src/entities/Goal.js
- `4.1 Visual` --references--> `Goal`  [INFERRED]
  docs/PLAN.md → src/entities/Goal.js
- `2. Estado actual (hecho)` --references--> `Player`  [INFERRED]
  docs/PLAN.md → src/entities/Player.js

## Import Cycles
- None detected.

## Communities (34 total, 17 thin omitted)

### Community 0 - "LevelGenerator"
Cohesion: 0.09
Nodes (11): Carriles y validación con tiempo (N3, E4c), Lecciones del generador (errores que no hay que repetir), Niveles aleatorios (generador + validador), bottom(), clone(), createRng(), left(), LevelGenerator (+3 more)

### Community 1 - "main.js"
Cohesion: 0.16
Nodes (3): config, Boot, Preloader

### Community 2 - "LevelGenerator.js"
Cohesion: 0.05
Nodes (38): ASSIST_MAX, CANDIDATE_POOL, CLEAR_HORIZONTAL, CLEAR_VERTICAL, CRAMPED_HEADROOM, DECONGEST_MAX, DEFAULT_ATTEMPTS, DIST_COLS (+30 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (27): allowScripts, esbuild@0.25.2, author, bugs, url, dependencies, phaser, description (+19 more)

### Community 5 - "Projectile"
Cohesion: 0.08
Nodes (7): BEHAVIORS, Projectile, PROJECTILE_CONFIG, RastraBehavior, RicochetBehavior, StandardBehavior, ProjectileManager

### Community 8 - "LevelValidator.js"
Cohesion: 0.13
Nodes (15): moverOffset(), MOVING_PLATFORM_CONFIG, MULTIPLIER_COLORS, PLAYER_CONFIG, TRAMPOLINE_CONFIG, DASH_COOLDOWN_FRAMES, DASH_FRAMES, JUMP_V (+7 more)

### Community 9 - "AGENTS.md — Configuración de IA Asistente (Fast Move)"
Cohesion: 0.14
Nodes (14): 10. Solicitar confirmación y realizar commit y push, 11. Comunicar el análisis y los resultados, 1. Alcance y contexto, 2. Revisar la documentación y el requisito, 3. Analizar conflictos e impacto, 4. Preguntar antes de avanzar ante dudas, 5. Utilizar POO y patrones de diseño, 6. Reutilizar código existente (+6 more)

### Community 10 - "test-levels.mjs"
Cohesion: 0.13
Nodes (12): LEVEL_BASELINES, DIFFICULTY_BAND, TIMER_BANDS, TIMER_RULES, COUNT, failures, FIRST, generator (+4 more)

### Community 11 - "README.md"
Cohesion: 0.06
Nodes (32): 1. Idea y concepto, 2. Flujo de juego, 3. Controles, 4.1 Movimiento del jugador, 4.2 Puntos, combo y multiplicador, 4.3 Cadena aérea ("sin pies en el suelo"), 4.4 Trampolines (nivel 2), 4.5 Proyectiles (nivel 2) (+24 more)

### Community 14 - "2. Estado actual (hecho)"
Cohesion: 0.19
Nodes (6): 2. Estado actual (hecho), Reglas de puntaje acordadas, Verificación realizada, MovingPlatform, GameTimer, TIMER_CONFIG

### Community 15 - "Game.js"
Cohesion: 0.05
Nodes (26): 8. Backlog posterior, ENDING_CONFIG, GameOver, COLORS, Audio, ensureContext(), EVENTS, muted (+18 more)

### Community 16 - "LevelValidator"
Cohesion: 0.24
Nodes (5): buildPlatforms(), LevelValidator, stateKey(), touchingWall(), withDash()

### Community 22 - "playbot.js"
Cohesion: 0.50
Nodes (6): planBest(), playLevel(), realState(), setKeys(), step(), targets()

### Community 25 - "levels.js"
Cohesion: 0.18
Nodes (9): ACTIVE_LEVELS, ALL_LEVELS, LEVELS, WORLD, GENERATION_COMFORT, generator, validator, out (+1 more)

### Community 27 - "Game.js"
Cohesion: 0.22
Nodes (8): phaser, base, frame, PRACTICE, PRACTICE_BY_LEVEL, PORTAL_CONFIG, POINT_SPAWN_CONFIG, PROJECTILE_SPAWN_CONFIG

### Community 29 - "Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)"
Cohesion: 0.20
Nodes (8): 1. Contexto y reglas que condicionan el plan, 3. Plan de ejecución del GDD (mecánicas por nivel), 5. Orden de ejecución consolidado, 6. Puertas de calidad (qué se verifica antes de cerrar cada fase), 7. Decisiones tomadas, Dónde vive cada cosa, Plan de trabajo — Fast Move (campaña de 5 niveles + expansión), Receta para agregar una entidad nueva (mecánicas, portal, gemas, escudo…)

### Community 33 - "4. Propuesta de expansión (aprobada)"
Cohesion: 0.40
Nodes (5): 4.1 Visual, 4.2 Mecánica, 4.3 Game feel, 4. Propuesta de expansión (aprobada), Fuera de alcance (para cuidar el proyecto)

## Knowledge Gaps
- **1 isolated node(s):** `terser`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 232 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LevelGenerator` connect `LevelGenerator` to `LevelGenerator.js`, `Game`, `test-levels.mjs`, `Game.js`, `levels.js`, `Game.js`?**
  _High betweenness centrality (0.209) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Game` (e.g. with `1. Contexto y reglas que condicionan el plan` and `8. Backlog posterior`) actually correct?**
  _`Game` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `terser` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LevelGenerator` be split into smaller, more focused modules?**
  _Cohesion score 0.08905380333951762 - nodes in this community are weakly interconnected._
- **Why does `phaser` connect `Game.js` to `main.js`, `package.json`, `Game.js`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Should `LevelGenerator.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `Game` connect `Game` to `LevelGenerator`, `main.js`, `Game.js`, `Game.js`, `Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._