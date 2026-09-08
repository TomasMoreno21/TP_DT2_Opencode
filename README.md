### Fast Move

Fast Move es un videojuego de plataformas *time-attack*: en 60 segundos hay que recolectar la mayor cantidad de puntos posible mientras se esquivan proyectiles. El mapa es fijo, a pantalla única, con plataformas y paredes.

## Integrantes

- Tomas Moreno
- Facundo Ibañez

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

Cada partida dura 60 segundos. En el escenario aparecen puntos en posiciones fijas que rotan su activación. El jugador debe moverse, saltar y agarrarse a las paredes para recolectarlos antes de que el tiempo termine. Al mismo tiempo, proyectiles entran desde fuera de la pantalla: recibir un impacto termina la partida.

### Objetivo

Conseguir la mayor cantidad de puntos en un minuto y batir el mejor puntaje.

### Mecánicas principales

- Recolección de puntos (spots fijos con activación rotativa).
- Movimiento, salto y wall grab (agarrarse a las paredes).
- Esquiva de proyectiles que entran desde fuera de la pantalla.
- Récord personal persistente (localStorage).

## Controles

| Acción | Control |
|---|---|
| Mover | A / D o Flechas Izquierda / Derecha |
| Saltar | Espacio o Flecha Arriba / W |
| Agarrarse a pared | Mantener la dirección contra la pared |

## Arquitectura

El código se organiza en `src/` con responsabilidades separadas:

- `src/scenes/` — escenas de Phaser (Boot, Preloader, MainMenu, Game, GameOver).
- `src/entities/` — entidades del juego (Player, Point, etc.).
- `src/systems/` — sistemas (ScoreManager, PointSpawner, ProjectileManager, etc.).
- `src/patterns/` — patrones de diseño (EntityFactory: patrón Factory para crear Point y Projectile, desacopla spawners de las clases concretas).
- `src/assets/` — recursos del juego.

```
GameScene
 ├── Player
 ├── PointSpawner ──► EntityFactory ──► Point
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