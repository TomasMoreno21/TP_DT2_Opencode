# Plan de trabajo — Fast Move (campaña de 5 niveles + expansión)

> Documento único y centralizado: acá vive **todo** lo planificado para el proyecto.
> Se actualiza al cerrar cada fase (estado, commit, decisiones nuevas).
> Fuente de diseño: [`docs/GDD.pdf`](./GDD.pdf). Reglas del repo: [`AGENTS.md`](../AGENTS.md).

**Estado:** flujo de escenas completo y verificado (`f782b10`); expansión **aprobada** por el equipo (`de212a1`).
**Siguiente fase a ejecutar:** E11 — Identidad por nivel + parallax + viñeta.

---

## 1. Contexto y reglas que condicionan el plan

- **Stack fijo:** JavaScript + Vite + Phaser 4. Sin TypeScript, sin dependencias nuevas.
- **Reglas del repo:** clases chicas con responsabilidad clara, nada de lógica concentrada en `Game`, evitar duplicación y variables globales, y **no modificar controles ni mecánicas centrales sin avisar**.
- **Controles:** la expansión agrega el **dash (Shift)** y los atajos **R** (reintentar) y **M** (mute). Están **aprobados explícitamente por el equipo**, por lo que la regla de avisar queda satisfecha; igual, cualquier control nuevo fuera de estos requiere aviso previo.
- **Principio de diseño:** la esencia original (*time-attack*, puntos, combo, proyectiles, wall grab/jump) queda **intacta**; la campaña de 5 niveles y la expansión se agregan encima.
- **Datos:** en `assets/levels.js` solo datos puros (posición, tamaño, color, tiempos). No se agrega un campo de mecánica hasta que esa mecánica esté implementada.
- **Flujo por fase:** análisis → plan → implementación → verificación → **commit + push** → revisión.

### Dónde vive cada cosa

```
src/
├── main.js               arranque, config global (gravedad, tamaño)
├── scenes/               Boot, Preloader, MainMenu, Game, GameOver
├── entities/             Player, Point, Projectile, Goal + las nuevas
├── systems/              Level, ScoreManager, ProjectileManager, Hud, GameTimer, PointSpawner, FloatingText, HighScore + las nuevas
├── patterns/EntityFactory.js   creación de entidades por tipo
└── assets/levels.js      datos de los 5 niveles
```

### Receta para agregar una entidad nueva (mecánicas, portal, gemas, escudo…)

1. `src/entities/<Nombre>.js`: clase chica, configuración por constructor, sin estado global.
2. `src/patterns/EntityFactory.js`: `create<Nombre>(scene, data)` con el mismo estilo que las existentes.
3. `src/systems/Level.js`: `materialize<Nombre>s()` que lee la config del nivel y llama a la factory.
4. `src/assets/levels.js`: datos puros de dónde va cada instancia.
5. `scenes/Game.js`: solo el wiring (collider / overlap y qué pasa al tocarlo). Si el wiring crece demasiado, la lógica se extrae a su propio handler.
6. `systems/Audio.js` (cuando exista): una línea para el sonido del evento.
7. Verificar con el checker de alcanzabilidad y con un recorrido en el navegador.

---

## 2. Estado actual (hecho)

| Fase | Contenido | Estado | Commit |
|---|---|---|---|
| Base | Jugador (movimiento, salto variable, coyote, buffer, wall grab/jump), puntos con combo x5, proyectiles con homing, HUD, `localStorage`, menú, derrota | Previo | `35ade35` y anteriores |
| Estructura multinivel | Niveles como datos en `assets/levels.js`, sistemas parametrizados | Hecho | `35ade35` |
| P1 — Datos de 5 niveles | 5 configs con plataformas, 12 spots, spawn, salida, timer, quota y proyectiles | **Hecho** | `f782b10` |
| P2 — Salida / flujo de escenas | Entidad `Goal` cerrada hasta cumplir la quota; el nivel termina al pisarla; victoria al completar el 5º; derrota con "Reintentar nivel" / "Salir"; puntaje de campaña acumulado | **Hecho** | `f782b10` |
| E1 — Trampolines + rebote perfecto (nivel 2) | `entities/Trampoline.js` con zona perfecta central (más alto + destello), techo del mapa clampado, 4 trampolines en el nivel 2 (3 en el piso + 1 sobre el remate) | **Hecho** | `22868b8` |
| E2 — Audio procedural | `systems/Audio.js` (WebAudio, sin assets): `Audio.play(evento)` como único punto de entrada, contexto creado en el primer input, mute persistente con M; blips por punto/combo, boing de trampolín, perfect, hit, meta, salida, victoria y clics de UI | **Hecho** | `98f4f50` |
| E3 — Sensación base | `systems/GamePace.js` (hitstop 30 ms al punto / 80 ms al impacto + cámara lenta 0.35 al morir), camera follow con lerp y deadzone dentro de 1024×768 (HUD fijo con setScrollFactor 0), zoom sutil x1→x1.03 con multiplicador ≥4 | **Hecho** | `09b4375` |
| E4 — Plataformas móviles (nivel 3) | `entities/MovingPlatform.js` con eje x/y configurable, ruta visible (M2) con línea y ticks, arrastre del jugador parado; 2 plataformas en el nivel 3 (horizontal entre fila 2, vertical al piso→fila 3) | **Hecho** | `93be898` |
| E5 — Pinchos cíclicos con aviso (nivel 4) | `entities/Hazard.js` con ciclo rest→warn→active (temblor y color de aviso G4/M3, daño solo en fase activa), offset de desfase configurable; 5 pinchos en el nivel 4 (piso + fila 1 central + fila 2 derecha) | **Hecho** | `3a531a6` |
| E6 — Escudo + indicador en el HUD (nivel 4) | `entities/PowerUp.js` (pickup de escudo re-obtenible, bob + pulso), escudo temporal en `Player` (absorbe un impacto y da ventana de invulnerabilidad corta), proyectil absorbido se elimina del manager, indicador de escudo en `Hud` (V6); 3 power-ups en el nivel 4 | **Hecho** | `ca19193` |
| E7 — Portales que conservan impulso (nivel 5) | `entities/Portal.js` (pares vinculados, sensor con aviso G4 de 350 ms al pisar, cancela si se sale, conserva 80 % del impulso con clamp M4, cooldown del destino); 2 pares en el nivel 5 (de cada lado del piso a la ruta lateral alta) + combinación trampolín/móvil/pinchos para F4 | **Hecho** | `70d3f65` |
| E8 — Gemas + bonus sin pies en el suelo | `entities/Gem.js` (M5+V4: vale 25, +2 s al timer, no cuenta quota, bob+brillo), `ScoreManager.addValue` con flag `countQuota`/`airborne`, cadena aérea M6 (+10 × streak, texto "VOLANDO xN" en el HUD, se corta al tocar el piso); 1'2 gemas por nivel (1 en L1–L3, 3 en L5) | **Hecho** | `e9bcf35` |
| E9 — Variantes de proyectil | Refactor de `Projectile.js` con behaviors (standard, ricochet, rastra): ricochet rebota en bordes y expira por tiempo (M7), rastra deja estelas con fade; `ProjectileManager` recibe `variant` por nivel (L4 → ricochet, L5 → rastra) | **Hecho** | `309462a` |
| E10 — Dash con Shift + atajos R y M | Dash M8 en `Player` (empuje 420 px/s, 0.18 s, cooldown 1.2 s reseteado al tocar suelo o wall jump), sonido vía evento `player-dash`, barra de cooldown en el HUD; atajo R reinicia el nivel conservando el total de campaña | **Hecho** | próx. commit |

### Reglas de puntaje acordadas

- El puntaje y el combo **se reinician en 0 en cada nivel**.
- Al completar un nivel, su puntaje se **bankea** al total de la campaña.
- Si se pierde el nivel, sus puntos **no cuentan** (se muestra "puntos perdidos en el nivel"), pero se conserva lo acumulado de los niveles completados.
- El **mejor puntaje total** se guarda en `localStorage` (`fast-move-high-score`).

### Verificación realizada

- Campaña completa 1→5 en el navegador: quota → se abre la salida → pisarla avanza → victoria con el total.
- Ambas derrotas (impacto y tiempo), "Reintentar nivel", "Salir", "Jugar de nuevo" y el botón del menú.
- Consola sin errores ni warnings; `npm run build-nolog` OK.
- **Checker de alcanzabilidad** (replica la física del jugador: salto, coyote, wall grab/jump y colisiones) ejecutado sobre los 5 mapas: **12/12 spots y la salida son alcanzables en todos los niveles**. Importante porque, con quota, un spot inalcanzable puede trabar el nivel. Vive fuera del repo, en `%TEMP%\opencode\reach.mjs`.

---

## 3. Plan de ejecución del GDD (mecánicas por nivel)

| Nivel | Nombre | Timer | Quota | Proyectiles (inicio→fin, vel.) | Mecánica que se suma |
|---|---|---|---|---|---|
| 1 | Arranque | 60 s | 8 | 1.7 s→1.0 s, x1→x1.5 | ninguna (enseña wall grab / wall jump) |
| 2 | Rebotes | 55 s | 10 | 1.5 s→0.8 s, x1.2→x1.8 | **Trampolines** |
| 3 | Movimiento | 55 s | 12 | 1.2 s→0.7 s, x1.4→x2.0 | **Plataformas móviles** (+ trampolines) |
| 4 | Peligro | 50 s | 14 | 1.0 s→0.6 s, x1.6→x2.2 | **Pinchos / zona de daño** + **power-up escudo** |
| 5 | Final | 60 s | 16 | 0.8 s→0.45 s, x1.8→x2.5 | **Portales** + combinación de todas |

Los valores de timer, quota y proyectiles son **de balance inicial** y se ajustan al final.

**F1 — Trampolines (nivel 2)** · `entities/Trampoline.js`, datos en `levels.js`, `systems/Level.js`, `EntityFactory.js`, wiring en `Game.js`.
Aceptación: el trampolín permite alcanzar una zona alta sin romper el recorrido a pie, y el impulso no deja atravesar el techo del mapa.

**F2 — Plataformas móviles (nivel 3)** · `entities/MovingPlatform.js`, `Level.js`, `EntityFactory.js`, datos.
Aceptación: el jugador se mueve con la plataforma sin caerse, los puntos sobre ella siguen siendo recolectables y hay al menos un salto que hay que cronometrar.

**F3 — Pinchos y escudo (nivel 4)** · `entities/Hazard.js`, `entities/PowerUp.js`, `systems/Level.js`, `EntityFactory.js`, `systems/Hud.js` (indicador de escudo), wiring en `Game.js`, estado del escudo en `Player`/`ScoreManager`.
Aceptación: el escudo se ve en el HUD mientras está activo, absorbe un impacto y se puede volver a obtener; tocar un pincho sin escudo equivale a recibir un impacto.

**F4 — Portales y combinación (nivel 5)** · `entities/Portal.js`, `Level.js`, `EntityFactory.js`, datos.
Aceptación: el nivel 5 usa trampolines + móviles + pinchos + portales combinados, y los portales ahorran tiempo real de recorrido.

**F5 — Balance, pulido y docs** · ajustar timers/quotas/proyectiles con lo que salga del playtest, alinear `README.md` y la sección de diseño de `AGENTS.md`, refrescar la tabla de controles.

---

## 4. Propuesta de expansión (aprobada)

Cada ítem tiene esfuerzo y **criterio de aceptación** para poder cerrarlo sin ambigüedad.

Numeración: **V** = visual, **M** = mecánica, **G** = game feel (se usa **G** para no chocar con las fases F1–F5 del GDD).

### 4.1 Visual

| # | Propuesta | Detalle | Criterio de aceptación | Esfuerzo |
|---|---|---|---|---|
| V1 | **Fondo con parallax procedural** | 3 capas generadas con `Graphics` (degradado de cielo, siluetas lejanas, partículas/estrellas) que se mueven un 4–10 % según la posición del jugador. Sin assets nuevos ni scroll | Las 3 capas se desplazan de forma visible y proporcional a la posición del jugador, sin caída de fps | Bajo |
| V2 | **Identidad visual por nivel** | `theme` en cada config (`bgTop`, `bgBottom`, `accent`, `glow`) aplicado al fondo y a la `Hud` | Cada nivel se distingue de un vistazo solo por su paleta | Bajo |
| V3 | **Salida animada** | El `Goal` actual es un rectángulo: pasa a ser anillos concéntricos que rotan, con partículas entrantes | Anillos girando; al abrir se ve un destello y el cambio de color es inequívoco | Bajo |
| V4 | **Paleta de gemas** | Las gemas (M5) se distinguen de los puntos normales por color y brillo | La diferencia se entiende sin leer texto | Bajo |
| V5 | **Feedback de movimiento** | Estela (fantasmas) al mover rápido, polvo al aterrizar y glow en los bordes de las plataformas | Los tres efectos aparecen solo cuando corresponde y no saturan la pantalla | Medio |
| V6 | **HUD con barra de quota** | Hoy es "9/10": sumar barrita de progreso, pop de score al sumar, indicador de escudo y timer pulsando en rojo en los últimos 10 s | La quota se lee de un vistazo y el pop no tapa la acción | Bajo |
| V7 | **Pantallas con más carácter** | Victoria con partículas tipo fuegos artificiales (reusando `burstAt`), derrota con desintegración del jugador, wipe corto entre niveles | Las tres transiciones se ven pulidas y ninguna tarda lo suficiente como para molestar | Bajo |
| V8 | **Viñeta** | Viñeta suave en los bordes para dirigir la mirada al centro | Baja el contraste en los bordes sin estorbar la lectura del HUD | Bajo |

### 4.2 Mecánica

| # | Propuesta | Detalle | Criterio de aceptación | Esfuerzo |
|---|---|---|---|---|
| M1 | **Trampolín con timing** | Rebote base + "rebote perfecto" al pisarlo en el centro (más alto + destello). Sube el techo de skill sin endurecer el mapa | El rebote base siempre funciona; en el centro el salto es claramente más alto y se señala con destello y sonido | Bajo |
| M2 | **Móvil con ruta visible** | Una línea o silueta marca el trayecto de la plataforma móvil | Se puede planificar el salto antes de subirse | Bajo |
| M3 | **Pinchos cíclicos** | Aviso (temblor) → extendidos → retraídos, en vez de siempre activos: abre rutas con timing | Se puede pasar en la ventana retraída sin recibir daño, y el aviso se ve antes de que se active | Medio |
| M4 | **Portales que conservan impulso** | Al salir del portal se conserva parte de la velocidad | El atajo ahorra tiempo real de recorrido y se siente fluido, no un corte | Bajo |
| M5 | **Gemas / puntos valiosos** | 1–2 por nivel: valen más (25) y dan **+2 s** al timer. Fomentan risk/reward | Hay al menos una por nivel, no altera la quota y el tiempo extra se ve en el timer | Bajo |
| M6 | **Bonus "sin pies en el suelo"** | La cadena se mantiene mientras no se toque el piso; al aterrizar se corta. Recompensa el estilo agresivo, muy on-brand con "Fast Move" | La cadena se mantiene en el aire, se corta al tocar el piso y el bonus se comunica en el HUD | Medio |
| M7 | **Variantes de proyectil** | En niveles 4–5 sumar al menos un patrón más a la misma clase `Projectile` (ej. "ricochet" o "rastra"), configurado por nivel | La variante se activa por configuración de nivel, sin condicionales dentro del update | Medio |
| M8 | **Dash (Shift)** | Empuje horizontal corto (~420 px/s extra, ~0,18 s), cooldown ~1,2 s, se resetea al tocar suelo o hacer wall jump, con indicador en el HUD | El dash es utilizable pero no rompe el recorrido (no permite saltarse el mapa); el indicador refleja el cooldown | Medio |
| M9 | **Recordar último nivel** | Guardar en `localStorage` el nivel alcanzado y ofrecer "Continuar campaña" en el menú | El menú ofrece continuar desde el último nivel y arranca limpio si se elige empezar de nuevo | Bajo |

### 4.3 Game feel

| # | Propuesta | Detalle | Criterio de aceptación | Esfuerzo |
|---|---|---|---|---|
| G1 | **Hitstop / time scale** | 60–90 ms de congelación al impacto, ~30 ms al recoger punto y cámara lenta breve al morir | Los tres momentos se perciben distintos y ninguno interrumpe el control más de lo debido | Bajo |
| G2 | **Cámara con follow suave** | Follow con lerp y deadzone chico, respetando los límites de 1024×768. El HUD queda fijo con `setScrollFactor(0)` | La cámara reacciona al jugador sin revelar fuera del mapa y el HUD nunca se mueve | Bajo |
| G3 | **Zoom por combo** | Zoom sutil (x1.00→x1.03) al llegar a multiplicadores altos, y de vuelta al normal | El cambio se nota pero no corta la lectura de los proyectiles | Bajo |
| G4 | **Anticipación (telegraphs)** | Pinchos, portales y la apertura de la salida avisan antes de activarse | Cada activador tiene un aviso perceptible ~0,3–0,4 s antes | Medio |
| G5 | **Audio procedural (WebAudio)** | Blip ascendente por punto (pitch según el multiplicador), "boing" del trampolín, whoosh de portal, impacto y jingle de victoria, en `systems/Audio.js` con un único punto de entrada `Audio.play(...)`. Sin assets ni dependencias; el contexto se crea en el primer input (autoplay policy) y hay mute con M | Cada evento suena con un timbre coherente, no hay clicks ni errores en consola y el mute funciona | Medio |
| G6 | **Curva de input: turn boost** | Invertir la dirección horizontal en el aire da un empujón corto (~15 % de velocidad, 120 ms) | Se siente un pequeño "punto" al girar en el aire, sin controlar la inercia normal | Bajo |
| G7 | **Ventanas de gracia visibles** | El coyote time y el buffer ya existen: mostrarlo (squash al final del coyote, destello al buffered) | Se percibe cuándo el coyote o el buffer están activos | Bajo |
| G8 | **Contexto en la derrota** | Mostrar el mejor combo alcanzado (registrando el máximo en `ScoreManager`) | La pantalla de derrota muestra el combo máximo de la partida | Bajo |
| G9 | **Tutorial contextual (nivel 1)** | 3 hints que aparecen y desaparecen al usar la mecánica (mover → wall grab → wall jump) | Los hints no estorban y desaparecen una vez usada la mecánica | Medio |

### Fuera de alcance (para cuidar el proyecto)

Sin enemigos con IA compleja, sin scroll, sin multijugador, sin más de 5 niveles, sin dependencias externas. Las mecánicas se agregan al mapa fijo existente, no lo reemplazan.

---

## 5. Orden de ejecución consolidado

Cada fila es una fase: **un commit, un push y revisión** antes de pasar a la siguiente.

| # | Fase | Ítems | Depende de | Esfuerzo |
|---|---|---|---|---|
| E1 | **Trampolines + rebote perfecto** (nivel 2) | F1, M1 | — | Bajo |
| E2 | **Audio procedural** (con el "boing" del trampolín ya integrado) | G5 | E1 | Medio |
| E3 | **Sensación base**: hitstop, follow de cámara, zoom por combo | G1, G2, G3 | — | Bajo |
| E4 | **Plataformas móviles con ruta visible** (nivel 3) | F2, M2 | E1 | Medio |
| E5 | **Pinchos cíclicos con aviso** (nivel 4) | F3, M3, G4 | — | Medio |
| E6 | **Escudo + indicador en el HUD** (nivel 4) | F3, V6 | E2 | Medio |
| E7 | **Portales que conservan impulso** (nivel 5) | F4, M4, G4 | E4, E5 | Medio |
| E8 | **Gemas + bonus sin pies en el suelo** | M5, M6 | E2 | Medio |
| E9 | **Variantes de proyectil** | M7 | — | Medio |
| E10 | **Dash con Shift + atajos R y M** (controles nuevos, aprobados) | M8 | E3 | Medio |
| E11 | **Identidad por nivel + parallax + viñeta** | V1, V2, V8 | E4, E5 | Medio |
| E12 | **Salida animada + paleta de gemas + feedback de movimiento** | V3, V4, V5 | E1, E8 | Medio |
| E13 | **HUD**: barra de quota y pop de score | V6 | E6 | Bajo |
| E14 | **Pantallas, transiciones y mejor combo en la derrota** | V7, G8 | E2 | Bajo |
| E15 | **Game feel fino**: turn boost, ventanas visibles, tutorial del nivel 1 | G6, G7, G9 | E3 | Medio |
| E16 | **Recordar último nivel** | M9 | E1 | Bajo |
| E17 | **Balance final + docs + tabla de controles** | F5 (GDD), `README.md`, `AGENTS.md` | todas | Bajo |

Notas de orden:

- **E2 antes que las mecánicas**: con el audio centralizado, cada mecánica nueva solo agrega una llamada a `Audio.play(...)` y se evita tocar cada entidad dos veces.
- **E3 agrupa la "base de sensación"**: son tres sistemas centrales, sin tocar entidades, y el playtest de E4 en adelante ya se siente como el juego final.
- **E10 concentra los controles nuevos** para que la tabla de controles de `README.md` se actualice una sola vez.
- **E17 al final** porque el balance depende de cómo se juega todo lo anterior.

---

## 6. Puertas de calidad (qué se verifica antes de cerrar cada fase)

- [ ] `npm run build-nolog` compila sin errores.
- [ ] Consola del navegador sin errores ni warnings.
- [ ] Recorrido manual de la fase en el dev server.
- [ ] Tests de flujo en el navegador: quota → salida → avance → victoria, y ambas derrotas.
- [ ] Checker de alcanzabilidad: todos los spots y la salida del nivel siguen siendo alcanzables (crítico con quota).
- [ ] Revisión de rendimiento: 60 fps estables y sin fugas de objetos ni timers entre niveles.
- [ ] `git status` limpio, commit con mensaje descriptivo y push a `master`.

---

## 7. Decisiones tomadas

Aprobadas por el equipo (Tomas Moreno) el **30/09/2026**:

1. **Audio procedural (G5)** — entra. Es la mejora de game feel con más impacto y no requiere assets.
2. **Bonus "sin pies en el suelo" (M6)** — entra. Es mecánica nueva y está aprobada como tal.
3. **Gemas / puntos valiosos (M5)** — entran. Agregan contenido y decisiones de diseño propias.
4. **Dash con Shift (M8)** — entra. Control nuevo aprobado explícitamente.
5. **Atajos R (reintentar nivel) y M (mute)** — entran.
6. **Recordar último nivel (M9)** — entra al menú.
7. **Balance** — timers, quotas y proyectiles se ajustan al final con datos del playtest (E17).

Queda en firme la regla: cualquier control o mecánica central **fuera** de los aprobados requiere aviso previo.

---

## 8. Backlog posterior

- Estadísticas por nivel en `localStorage` (mejor tiempo, mejor combo).
- Rejugar un nivel ya superado ("modo práctica") sin afectar el récord de campaña.
- Niveles extra (6+) o variantes de mapa.
