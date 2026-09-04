### Fast Move

Fast Move es un videojuego de plataformas *time-attack*: en 60 segundos hay que recolectar la mayor cantidad de puntos posible mientras se esquivan proyectiles. El mapa es fijo, a pantalla única, con plataformas y paredes.

## Integrantes

- Tomas Moreno
- [Nombre del segundo integrante]

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
- `src/patterns/` — patrones de diseño de comportamiento.
- `src/assets/` — recursos del juego.

```
GameScene
 ├── Player
 ├── PointSpawner
 │   └── Point
 ├── ProjectileManager
 │   └── Projectile
 └── ScoreManager
```