### Fast Move

Fast Move es un videojuego de plataformas *time-attack*: en cada nivel hay que juntar una meta de puntos antes de que se acabe el tiempo y llegar a la salida, mientras se esquivan proyectiles y otros peligros. Son 5 niveles de pantalla única; el último es una torre que sube sola.

## Integrantes

- Tomas Moreno
- Micaela Córdoba

## Tecnologías

- JavaScript
- Node.js
- Vite
- Phaser 4

## Instalación

```sh
npm install
```

## Ejecutar

```sh
npm run dev
```

## Build

```sh
npm run build
```

## Gameplay

Plataformas 2D *time-attack* de pantalla única. En cada nivel hay que recolectar una **meta de puntos** antes de que se acabe el tiempo; al cumplirla se abre la **salida**, y pisarla pasa al siguiente nivel. La campaña tiene **5 niveles**: al completar el quinto se gana.

Documento de diseño completo: [`docs/GDD.pdf`](docs/GDD.pdf) (fuente editable: [`docs/GDD.md`](docs/GDD.md)).

### Objetivo

Completar los niveles y conseguir el mayor puntaje total. El mejor puntaje se guarda en el navegador.

### Niveles

| # | Nombre | Tiempo | Meta | Novedad |
|---|---|---|---|---|
| 1 | Arranque | 60 s | 10 puntos | Sin peligros: movimiento, wall jump y combo |
| 2 | Rebotes | 50 s | 12 puntos | Trampolines y proyectiles |
| 3 | Frágiles | 50 s | 14 puntos | Plataformas frágiles que caen al pisarlas |
| 4 | Peligro | 47 s | 15 puntos | Pinchos con aviso |
| 5 | Final | 55 s | 16 puntos | Torre: el escenario sube solo con el **Vacío** |

En el **nivel 5** el escenario sube solo y el borde del Vacío mata al tocarlo. Hay que trepar y juntar **16 orbes**; al cumplir la cuota la torre se detiene, el Vacío desaparece y aparece la salida sobre una plataforma visible.

### Mecánicas principales

- **Movimiento:** correr, salto variable, wall grab, wall jump y dash invulnerable (SHIFT).
- **Puntos y combo:** cada punto vale 10; encadenar recolecciones (menos de 3 s entre una y otra) sube el multiplicador hasta x5.
- **Cadena aérea:** recolectar sin tocar el piso suma un bono creciente.
- **Trampolines:** rebote alto, con una zona perfecta en el centro.
- **Plataformas frágiles:** caen poco después de pisarlas.
- **Pinchos:** tiemblan antes de salir y se retraen por ciclos.
- **Vacío (nivel 5):** el escenario sube solo; ver arriba.
- **Proyectiles:** nacen en las paredes, persiguen medio segundo y luego aceleran en línea recta.
- **Insignias:** wall jump, dash, rebote perfecto y Vacío (por escapar de la torre).

### Menú y extras

- **Ranking local:** top 10 de la campaña con iniciales, guardado en el navegador.
- **Logros** (8) e **insignias** de aprendizaje (5).
- **Rangos:** bronce, plata y oro por nivel, con medalla en el menú.
- **Modo modificadores:** un modificador al azar por nivel (Reloj corto, Dash lento, Un solo punto, Meta alta, Luna, Sin dash, Orbes efímeros, Pinchos rápidos, Niebla) que suma un bonus; tiene su propio ranking.
- **Opciones:** reducir destellos y reducir movimiento. Idiomas: español e inglés.
- **NUEVOS NIVELES:** genera otra semilla de mapas.

### Cómo se pierde

- Se acaba el tiempo antes de pisar la salida.
- Un proyectil o un pincho impacta al jugador.
- El Vacío alcanza al jugador (nivel 5).

Los puntos de un nivel perdido no cuentan; se conserva lo ya acumulado.

## Controles

| Acción | Control |
|---|---|
| Mover | A / D o flechas izquierda / derecha |
| Saltar | Espacio, W o flecha arriba (mantener = más alto) |
| Agarrarse a la pared | Mantener la dirección contra la pared |
| Wall jump | Saltar mientras se toca una pared |
| Dash | SHIFT |
| Pausa | Esc |
| Reiniciar nivel | R |
| Silenciar | M |
| Saltear tutorial | T |

## Arquitectura

El código se organiza en `src/` con responsabilidades separadas:

- `src/scenes/`: escenas de Phaser (Boot, Preloader, MainMenu, Game, Pause, GameOver, Ranking).
- `src/entities/`: entidades (Player, Point, Trampoline, FragilePlatform, Hazard, Projectile, RisingVoid, Goal).
- `src/systems/`: sistemas (ScoreManager, GameTimer, ProjectileManager, TutorialManager, LevelGenerator, LevelValidator, TowerLevel, Badges, Achievements, Leaderboard, etc.).
- `src/patterns/`: EntityFactory (patrón Factory que desacopla los spawners de las clases concretas).
- `src/assets/`: datos de niveles (`levels.js`), prácticas y recursos.
- `tools/`: validación de niveles y bot de prueba.

Los niveles son datos en `src/assets/levels.js`. `ACTIVE_LEVELS` define cuántos se juegan: están activos los 5. El nivel 5 no sale de `levels.js` tal cual: `systems/TowerLevel.js` genera la torre y `entities/RisingVoid.js` es el Vacío.

```
GameScene
 ├── Player
 ├── Level ──► EntityFactory ──► Point, Trampoline, Goal...
 ├── PointSpawner
 ├── ProjectileManager ──► EntityFactory ──► Projectile
 ├── ScoreManager
 ├── GameTimer
 └── Hud
```

## Agentes de OpenCode utilizados

- **opencode** (agente principal): análisis del código, planificación de fases (modo Plan) e implementación de cada fase (modo Build).
- No se utilizaron subagentes especializados; todo el trabajo se realizó con el agente principal en Plan/Build.

## Principales instrucciones o prompts empleados

- "Analizá el GDD y el estado actual del proyecto; armá el plan de la Fase 1 (mapa + jugador) sin modificar archivos."
- "Fase 2: sistema de puntos híbrido (spots fijos con activación rotativa) + HUD con puntaje y timer de 60 s."
- "Fase 3: agregar wall grab y wall jump manteniendo los controles actuales."
- "Fase 4: proyectiles desde fuera de pantalla y flujo de derrota/fin de partida con Reiniciar/Salir."
- "Fase 5: mejor puntaje persistente (localStorage), pantalla de inicio y entregables (docs/GDD.pdf, README)."

## Problemas encontrados y soluciones aplicadas

| Problema | Solución |
|---|---|
| La consigna exige JavaScript pero el scaffold eligió TypeScript | Repetir `npx @phaserjs/create-game@latest` seleccionando **JavaScript** en el prompt de lenguaje |
| El instalador Phaser es interactivo y bloquea la automatización | Script Node auxiliar que envía las teclas (flechas + Enter) con delays entre prompts |
| PowerShell bloquea `npm.ps1`/`npx.ps1` por Execution Policy | Usar `npm.cmd` / `npx.cmd` que evitan la policy de scripts |
| **GoLive** de VS Code mostraba pantalla en blanco | No usar Live Server: el proyecto requiere el dev server de Vite (`npm run dev`) |
| `import Phaser from 'phaser'` fallaba en build | El ESM de Phaser 4 no exporta default; usar exports nombrados (`import { Math as PhaserMath } from 'phaser'`) |
| Wall grab no tenía suficientes paredes | Agregar columna central en el layout del nivel |