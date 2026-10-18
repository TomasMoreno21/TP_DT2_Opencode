# Graph Report - TP_DT2_Opencode  (2026-10-17)

## Corpus Check
- 45 files · ~62,753 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 5, .css 1)

## Summary
- 535 nodes · 1114 edges · 34 communities (16 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aef3f6e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- LevelGenerator
- Game.js
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
- EntityFactory.js
- LevelValidator
- ScoreManager
- ProjectileManager
- GameOver
- GamePace
- Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)
- playbot.js
- Goal
- Hazard
- Portal
- PowerUp
- MovingPlatform
- Point
- PointSpawner.js
- 4. Propuesta de expansión (aprobada)
- gen-baselines.mjs
- Trampoline

## God Nodes (most connected - your core abstractions)
1. `LevelGenerator` - 84 edges
2. `Game` - 24 edges
3. `top()` - 23 edges
4. `left()` - 23 edges
5. `right()` - 23 edges
6. `Hud` - 21 edges
7. `Player` - 18 edges
8. `Niveles aleatorios (generador + validador)` - 17 edges
9. `MainMenu` - 15 edges
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

## Communities (34 total, 18 thin omitted)

### Community 0 - "LevelGenerator"
Cohesion: 0.10
Nodes (9): Lecciones del generador (errores que no hay que repetir), Niveles aleatorios (generador + validador), bottom(), clone(), createRng(), left(), LevelGenerator, right() (+1 more)

### Community 1 - "Game.js"
Cohesion: 0.07
Nodes (23): phaser, LEVELS, WORLD, config, Boot, ENDING_CONFIG, COLORS, Preloader (+15 more)

### Community 2 - "LevelGenerator.js"
Cohesion: 0.06
Nodes (33): ASSIST_MAX, CANDIDATE_POOL, CLEAR_HORIZONTAL, CLEAR_VERTICAL, CRAMPED_HEADROOM, DECONGEST_MAX, DEFAULT_ATTEMPTS, DIST_COLS (+25 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (27): allowScripts, esbuild@0.25.2, author, bugs, url, dependencies, phaser, description (+19 more)

### Community 5 - "Projectile"
Cohesion: 0.12
Nodes (6): BEHAVIORS, Projectile, PROJECTILE_CONFIG, RastraBehavior, RicochetBehavior, StandardBehavior

### Community 8 - "LevelValidator.js"
Cohesion: 0.15
Nodes (13): MULTIPLIER_COLORS, PLAYER_CONFIG, PORTAL_CONFIG, TRAMPOLINE_CONFIG, DASH_FRAMES, JUMP_V, moveBody(), overlaps() (+5 more)

### Community 9 - "AGENTS.md — Configuración de IA Asistente (Fast Move)"
Cohesion: 0.12
Nodes (14): 10. Solicitar confirmación y realizar commit y push, 11. Comunicar el análisis y los resultados, 1. Alcance y contexto, 2. Revisar la documentación y el requisito, 3. Analizar conflictos e impacto, 4. Preguntar antes de avanzar ante dudas, 5. Utilizar POO y patrones de diseño, 6. Reutilizar código existente (+6 more)

### Community 10 - "test-levels.mjs"
Cohesion: 0.13
Nodes (12): LEVEL_BASELINES, DIFFICULTY_BAND, TIMER_BANDS, TIMER_RULES, COUNT, failures, FIRST, generator (+4 more)

### Community 11 - "README.md"
Cohesion: 0.13
Nodes (14): Agentes de OpenCode utilizados, Arquitectura, Build, Controles, Ejecutar, Fast Move, Gameplay, Instalación (+6 more)

### Community 14 - "2. Estado actual (hecho)"
Cohesion: 0.20
Nodes (6): 2. Estado actual (hecho), 7. Decisiones tomadas, Reglas de puntaje acordadas, Verificación realizada, GameTimer, TIMER_CONFIG

### Community 15 - "EntityFactory.js"
Cohesion: 0.24
Nodes (3): Gem, GEM_CONFIG, PROJECTILE_SPAWN_CONFIG

### Community 16 - "LevelValidator"
Cohesion: 0.25
Nodes (5): buildPlatforms(), LevelValidator, stateKey(), touchingWall(), withDash()

### Community 21 - "Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)"
Cohesion: 0.25
Nodes (8): 1. Contexto y reglas que condicionan el plan, 3. Plan de ejecución del GDD (mecánicas por nivel), 5. Orden de ejecución consolidado, 6. Puertas de calidad (qué se verifica antes de cerrar cada fase), 8. Backlog posterior, Dónde vive cada cosa, Plan de trabajo — Fast Move (campaña de 5 niveles + expansión), Receta para agregar una entidad nueva (mecánicas, portal, gemas, escudo…)

### Community 22 - "playbot.js"
Cohesion: 0.50
Nodes (6): planBest(), playLevel(), realState(), setKeys(), step(), targets()

### Community 30 - "4. Propuesta de expansión (aprobada)"
Cohesion: 0.40
Nodes (5): 4.1 Visual, 4.2 Mecánica, 4.3 Game feel, 4. Propuesta de expansión (aprobada), Fuera de alcance (para cuidar el proyecto)

### Community 31 - "gen-baselines.mjs"
Cohesion: 0.40
Nodes (3): GENERATION_COMFORT, out, validator

## Knowledge Gaps
- **1 isolated node(s):** `terser`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 204 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LevelGenerator` connect `LevelGenerator` to `Game.js`, `LevelGenerator.js`, `test-levels.mjs`, `Game`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Game` (e.g. with `1. Contexto y reglas que condicionan el plan` and `Niveles aleatorios (generador + validador)`) actually correct?**
  _`Game` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `terser` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LevelGenerator` be split into smaller, more focused modules?**
  _Cohesion score 0.10398289227479283 - nodes in this community are weakly interconnected._
- **Why does `phaser` connect `Game.js` to `package.json`, `PointSpawner.js`, `EntityFactory.js`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Should `Game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06887755102040816 - nodes in this community are weakly interconnected._
- **Why does `2. Estado actual (hecho)` connect `2. Estado actual (hecho)` to `LevelGenerator`, `Hud`, `Player`, `ScoreManager`, `ProjectileManager`, `Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)`, `Goal`, `MovingPlatform`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._