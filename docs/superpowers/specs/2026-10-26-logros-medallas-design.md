# Logros y medallas — diseño

Fuente: `docs/GDD.pdf` §9 «Alcance» («Logros y medallas: hitos como completar un nivel sin morir o llegar a x5, mostrados en el menú. Amplía las insignias de aprendizaje»). Es la base de los retos fijos y del salto doble, que son ciclos aparte.

## Objetivo

Ampliar las insignias de aprendizaje (`systems/Badges.js`) con 8 hitos de desempeño, mostrados en un botón LOGROS del menú. Sin sistema paralelo: se reutiliza el aviso de desbloqueo existente.

## Fuera de alcance

Retos fijos, salto doble, modo modificadores, skins. Las 5 insignias de aprendizaje y el ranking no cambian.

## Catálogo (decidido por el usuario)

| id | Nombre | Condición | Momento de evaluación |
|---|---|---|---|
| `noDeaths` | Sin caídas | Completar un nivel con `deaths === 0` | `Game.onGoalReached` |
| `maxCombo` | Al máximo | Llegar al multiplicador x5 en un nivel | `Game.onGoalReached` (`maxMult`) |
| `champion` | Campeón | Completar la campaña de 5 niveles | victoria final |
| `gold` | Medalla de oro | Rango oro en cualquier nivel | `Game.onGoalReached` (`rankFor`) |
| `goldAll` | Oro total | Rango oro en los 5 niveles | `RankStore.all()` tras actualizar |
| `airborne` | Volando | Cadena aérea (`airStreak`) de 5 | al sumar punto en el aire |
| `speedster` | Velocista | Llegar a la salida con ≥ 50 % del timer sobrante | `Game.onGoalReached` |
| `collector` | Coleccionista | 1000 puntos acumulados entre partidas | al sumar puntaje |

Descartados: Intocable, Cazagemas, Rebote de manual, Escudo salvador x3.

## Arquitectura

- **`src/systems/Achievements.js`** (puro, sin Phaser, estilo `Rank.js`):
  - `ACHIEVEMENTS`: definiciones `{ id, target? }`.
  - `evaluateLevel(summary)` → ids cumplidos, función pura. `summary` = `{ deaths, maxMult, rank, remainingRatio, maxAirStreak }`.
  - `AchievementStore`: `localStorage` clave `fastMoveAchievements` → `{ unlocked: [], points: 0 }`; `has`, `unlock` (devuelve `true` solo la primera vez), `addPoints(n)` (desbloquea `collector` al llegar a 1000), `progress(id)`. Todo en try/catch.
- **`Game.js`**: solo wiring. `unlockBadge(id)` pasa a aceptar también ids de logros (mismo banner con `★`). Se registra el máximo de `airStreak` (como `maxMult`). Al llegar a la salida arma el `summary` y desbloquea lo que devuelva `evaluateLevel`; `goldAll` se comprueba con `RankStore` luego de `RankStore.update`. `champion` se desbloquea en la victoria final.
- **`ScoreManager`/`Game`**: acumular los puntos recogidos hacia `collector` (solo puntos de nivel, no bonos).
- **`MainMenu.js`**: botón LOGROS que abre un popup con nombre, descripción y progreso (p. ej. 340/1000). El popup de Tutorial conserva solo las insignias de aprendizaje.
- **`Texts.js`**: textos es/en (`achievementsTitle`, `ach_<id>`, `ach_<id>_desc`, `achNew`).
- **Corrección previa:** la insignia `gem` se guarda pero no figura en `BADGES` ni tiene texto; se agrega a la lista de aprendizaje y a `Texts.js`.

## Reglas

- Con el código secreto de vida infinita no se otorgan logros (igual que no registra ranking).
- Un logro obtenido no se pierde al reintentar ni al perder un nivel.
- Perder un nivel no suma al contador `collector` (supuesto, ver Pendientes).
- Sin assets nuevos: el popup se dibuja con `Graphics`/texto como el resto del menú.

## Criterios de aceptación

1. Cada uno de los 8 hitos se desbloquea al cumplir su condición y no antes, mostrando el banner una sola vez.
2. El popup LOGROS lista los 8 con estado (★/☆), descripción y progreso de `collector`.
3. Los logros persisten tras recargar; sin `localStorage` el juego no falla.
4. Vida infinita no otorga logros.
5. `tools/test-achievements.mjs` (autoprueba de `evaluateLevel` y del contador) pasa; `npm run build-nolog` compila; consola sin errores en un recorrido manual del N1.

## Pendientes a confirmar en implementación

- `airborne`: el GDD no lo define; se toma «cadena aérea de 5 en un mismo vuelo» como interpretación aprobada por el usuario.
- `collector` y niveles perdidos: **supuesto mío, sin confirmar** — no suman (coherente con PLAN §2). Alternativa: que sumen todo lo recogido aunque se pierda el nivel.
