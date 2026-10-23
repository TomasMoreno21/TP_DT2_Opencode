# Graph Report - TP_DT2_Opencode  (2026-10-21)

## Corpus Check
- 48 files · ~70,921 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 5, .css 1)

## Summary
- 587 nodes · 1247 edges · 22 communities (15 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6f2609f1`
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
- EntityFactory.js
- LevelValidator.js
- AGENTS.md — Configuración de IA Asistente (Fast Move)
- test-levels.mjs
- README.md
- Player
- MainMenu
- 2. Estado actual (hecho)
- TutorialManager
- LevelValidator
- Portal
- GamePace
- playbot.js
- levels.js

## God Nodes (most connected - your core abstractions)
1. `LevelGenerator` - 94 edges
2. `Game` - 28 edges
3. `top()` - 25 edges
4. `left()` - 25 edges
5. `right()` - 25 edges
6. `Hud` - 21 edges
7. `Player` - 18 edges
8. `Niveles aleatorios (generador + validador)` - 18 edges
9. `MainMenu` - 17 edges
10. `EntityFactory` - 14 edges

## Surprising Connections (you probably didn't know these)
- `4.2 Mecánica` --references--> `Projectile`  [INFERRED]
  docs/PLAN.md → src/entities/Projectile.js
- `2. Estado actual (hecho)` --references--> `Goal`  [INFERRED]
  docs/PLAN.md → src/entities/Goal.js
- `2. Estado actual (hecho)` --references--> `Player`  [INFERRED]
  docs/PLAN.md → src/entities/Player.js
- `3. Plan de ejecución del GDD (mecánicas por nivel)` --references--> `Player`  [INFERRED]
  docs/PLAN.md → src/entities/Player.js
- `1. Contexto y reglas que condicionan el plan` --references--> `Game`  [INFERRED]
  docs/PLAN.md → src/scenes/Game.js

## Import Cycles
- None detected.

## Communities (22 total, 7 thin omitted)

### Community 0 - "LevelGenerator"
Cohesion: 0.09
Nodes (8): Carriles y validación con tiempo (N3, E4c), Lecciones del generador (errores que no hay que repetir), Niveles aleatorios (generador + validador), bottom(), left(), LevelGenerator, right(), top()

### Community 1 - "Game.js"
Cohesion: 0.06
Nodes (26): phaser, base, frame, PRACTICE, PRACTICE_BY_LEVEL, config, Boot, ENDING_CONFIG (+18 more)

### Community 2 - "LevelGenerator.js"
Cohesion: 0.05
Nodes (40): ASSIST_MAX, CANDIDATE_POOL, CLEAR_HORIZONTAL, CLEAR_VERTICAL, clone(), CRAMPED_HEADROOM, createRng(), DECONGEST_MAX (+32 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (27): allowScripts, esbuild@0.25.2, author, bugs, url, dependencies, phaser, description (+19 more)

### Community 5 - "Projectile"
Cohesion: 0.12
Nodes (6): BEHAVIORS, Projectile, PROJECTILE_CONFIG, RastraBehavior, RicochetBehavior, StandardBehavior

### Community 7 - "EntityFactory.js"
Cohesion: 0.05
Nodes (14): Gem, GEM_CONFIG, Hazard, HAZARD_CONFIG, Point, POINT_CONFIG, PowerUp, POWERUP_CONFIG (+6 more)

### Community 8 - "LevelValidator.js"
Cohesion: 0.14
Nodes (14): MULTIPLIER_COLORS, PLAYER_CONFIG, PORTAL_CONFIG, TRAMPOLINE_CONFIG, DASH_COOLDOWN_FRAMES, DASH_FRAMES, JUMP_V, moveBody() (+6 more)

### Community 9 - "AGENTS.md — Configuración de IA Asistente (Fast Move)"
Cohesion: 0.05
Nodes (30): 10. Solicitar confirmación y realizar commit y push, 11. Comunicar el análisis y los resultados, 1. Alcance y contexto, 2. Revisar la documentación y el requisito, 3. Analizar conflictos e impacto, 4. Preguntar antes de avanzar ante dudas, 5. Utilizar POO y patrones de diseño, 6. Reutilizar código existente (+22 more)

### Community 10 - "test-levels.mjs"
Cohesion: 0.13
Nodes (12): LEVEL_BASELINES, DIFFICULTY_BAND, TIMER_BANDS, TIMER_RULES, COUNT, failures, FIRST, generator (+4 more)

### Community 11 - "README.md"
Cohesion: 0.13
Nodes (14): Agentes de OpenCode utilizados, Arquitectura, Build, Controles, Ejecutar, Fast Move, Gameplay, Instalación (+6 more)

### Community 14 - "2. Estado actual (hecho)"
Cohesion: 0.09
Nodes (11): 2. Estado actual (hecho), 7. Decisiones tomadas, Reglas de puntaje acordadas, Verificación realizada, moverOffset(), MOVING_PLATFORM_CONFIG, MovingPlatform, GameTimer (+3 more)

### Community 15 - "TutorialManager"
Cohesion: 0.23
Nodes (3): load(), save(), TutorialManager

### Community 16 - "LevelValidator"
Cohesion: 0.24
Nodes (5): buildPlatforms(), LevelValidator, stateKey(), touchingWall(), withDash()

### Community 22 - "playbot.js"
Cohesion: 0.50
Nodes (6): planBest(), playLevel(), realState(), setKeys(), step(), targets()

### Community 25 - "levels.js"
Cohesion: 0.15
Nodes (11): LEVELS, WORLD, cache, createPool(), generateLevelInWorker(), pending, GENERATION_COMFORT, generator (+3 more)

## Knowledge Gaps
- **1 isolated node(s):** `terser`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 216 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LevelGenerator` connect `LevelGenerator` to `Game.js`, `LevelGenerator.js`, `Game`, `test-levels.mjs`, `levels.js`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Game` (e.g. with `1. Contexto y reglas que condicionan el plan` and `8. Backlog posterior`) actually correct?**
  _`Game` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `terser` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LevelGenerator` be split into smaller, more focused modules?**
  _Cohesion score 0.09385964912280702 - nodes in this community are weakly interconnected._
- **Why does `phaser` connect `Game.js` to `package.json`, `EntityFactory.js`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Should `Game.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0576271186440678 - nodes in this community are weakly interconnected._
- **Why does `Game` connect `Game` to `LevelGenerator`, `AGENTS.md — Configuración de IA Asistente (Fast Move)`, `Game.js`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._