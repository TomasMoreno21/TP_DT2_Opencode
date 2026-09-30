# Plan de trabajo — Fast Move (campaña de 5 niveles)

> Documento único y centralizado: acá vive **todo** lo planificado para el proyecto.
> Se actualiza al cerrar cada fase (estado, commit, decisiones nuevas).
> Fuente de diseño: [`docs/GDD.pdf`](./GDD.pdf). Reglas del repo: [`AGENTS.md`](../AGENTS.md).

**Estado actual:** flujo de escenas completo y verificado (commit `f782b10`).
**Fase siguiente propuesta:** trampolines (nivel 2).

---

## 1. Contexto y reglas que condicionan el plan

- **Stack fijo:** JavaScript + Vite + Phaser 4. Sin TypeScript, sin dependencias nuevas.
- **Reglas del repo:** clases chicas con responsabilidad clara, nada de lógica concentrada en `Game`, evitar duplicación y variables globales, y **no modificar controles ni mecánicas centrales sin avisar**.
- **Principio de diseño:** la esencia original (*time-attack*, puntos, combo, proyectiles, wall grab/jump) queda **intacta**; la campaña de 5 niveles y las mecánicas nuevas se agregan encima.
- **Flujo por fase:** análisis → plan → implementación → verificación → **commit + push** → revisión.

---

## 2. Estado actual (hecho)

| Fase | Contenido | Estado | Commit |
|---|---|---|---|
| Base | Jugador (movimiento, salto variable, coyote, buffer, wall grab/jump), puntos con combo x5, proyectiles con homing, HUD, `localStorage`, menú, derrota | Previo | `35ade35` y anteriores |
| Estructura multinivel | Niveles como datos en `assets/levels.js`, sistemas parametrizados | Hecho | `35ade35` |
| P1 — Datos de 5 niveles | 5 configs con plataformas, 12 spots, spawn, salida, timer, quota y proyectiles | **Hecho** | `f782b10` |
| P2 — Salida / flujo de escenas | Entidad `Goal` cerrada hasta cumplir la quota; el nivel termina al pisarla; victoria al completar el 5º; derrota con "Reintentar nivel" / "Salir"; puntaje de campaña acumulado | **Hecho** | `f782b10` |

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

### Fases pendientes

Cada fase se cierra con commit + push y revisión.

**F1 — Trampolines (nivel 2)**
- Qué: entidad `Trampoline` (banda elástica) que al ser pisada por arriba aplica un impulso vertical grande.
- Archivos: `entities/Trampoline.js`, `levels.js` (datos), `systems/Level.js` (materializar), `patterns/EntityFactory.js`, `scenes/Game.js` (overlap/collider).
- Aceptación: se puede alcanzar con el trampolín una zona alta; no rompe el recorrido a pie; el impulso no permite atravesar el techo del mapa.

**F2 — Plataformas móviles (nivel 3)**
- Qué: entidad `MovingPlatform` (eje X y/o Y, ida y vuelta) que arrastra al jugador que va montado en ella.
- Archivos: `entities/MovingPlatform.js`, `Level.js`, `EntityFactory.js`, datos de nivel.
- Aceptación: el jugador se mueve con la plataforma sin caerse; los puntos sobre ella siguen siendo recolectables; hay al menos un salto cronometrado obligatorio.

**F3 — Pinchos y escudo (nivel 4)**
- Qué: entidad `Hazard` (pinchos) — tocarlo equivale a impacto; entidad `PowerUp` (escudo) que absorbe **un** impacto (proyectil o pincho) antes de caer.
- Archivos: `entities/Hazard.js`, `entities/PowerUp.js`, `systems/Level.js`, `EntityFactory.js`, `systems/Hud.js` (indicador de escudo), `scenes/Game.js`, `ScoreManager`/`Player` para el estado del escudo.
- Aceptación: el escudo se ve en el HUD mientras está activo, se consume en un impacto y se puede volver a obtener; con escudo el impacto no termina el nivel.

**F4 — Portales y combinación (nivel 5)**
- Qué: entidad `Portal` (par A/B con color propio) que teletransporta al punto gemelo.
- Archivos: `entities/Portal.js`, `Level.js`, `EntityFactory.js`, datos de nivel.
- Aceptación: el nivel 5 usa trampolines + móviles + pinchos + portales combinados; los portales ahorran tiempo real de recorrido.

**F5 — Balance, pulido y docs**
- Qué: ajustar timers/quotas/proyectiles con lo que salga del playtest, actualizar `README.md` y la sección de diseño de `AGENTS.md` (hoy describen el time-attack de 60 s sin niveles ni quota) y refrescar la tabla de controles.
- Aceptación: los 5 niveles se completan de forma secuencial y la dificultad se nota; docs alineadas con el juego real.

---

## 4. Propuesta de expansión

Además de las mecánicas del GDD, esta es la propuesta para **elevar la calidad visual, la profundidad y la sensación de juego**. Cada ítem indica impacto, esfuerzo y si requiere confirmación.

### 4.1 Visual

| # | Propuesta | Detalle | Impacto | Esfuerzo |
|---|---|---|---|---|
| V1 | **Fondo con parallax procedural** | 3 capas generadas con `Graphics` (degradado de cielo, siluetas lejanas, partículas/estrellas) que se mueven un 4–10 % según la posición del jugador. Sin assets nuevos ni scroll | Alto | Bajo |
| V2 | **Identidad visual por nivel** | `theme` en cada config (`bgTop`, `bgBottom`, `accent`, `glow`): cada nivel se ve distinto y se reconoce de un vistazo | Alto | Bajo |
| V3 | **Portal de salida animado** | El `Goal` actual es un rectángulo: convertirlo en anillos concéntricos que rotan, con partículas entrantes y un destello al abrirse | Alto | Bajo |
| V4 | **Paleta de puntaje por valor** | Los puntos valiosos (ver M6) se distinguen por color y brillo, no solo por valor | Medio | Bajo |
| V5 | **Feedback de movimiento** | Estela (fantasmas) al mover rápido, polvo al aterrizar, y glow en los bordes de las plataformas | Medio | Medio |
| V6 | **HUD con barra de quota** | Hoy es "9/10": sumar una barrita de progreso, pop de score al sumar y color del timer pulsando en los últimos 10 s (el pulso ya existe, parcial) | Medio | Bajo |
| V7 | **Pantallas con más carácter** | Victoria con partículas tipo fuegos artificiales (reusando `add.particles` de `burstAt`), derrota con desintegración del jugador, transición de nivel con wipe corto | Medio | Bajo |
| V8 | **Viñeta y contraste** | Viñeta suave en los bordes para dirigir la mirada al centro de la acción | Bajo | Bajo |

### 4.2 Mecánica

| # | Propuesta | Detalle | Impacto | Esfuerzo | Confirmación |
|---|---|---|---|---|---|
| M1 | Trampolín con **timing** | Rebote base + "rebote perfecto" al pisarlo en el centro (más alto + destello). Sube el techo de skill sin endurecer el mapa | Alto | Bajo | — |
| M2 | Móvil con **ruta visible** | Una línea/ghost marca el trayecto de la plataforma móvil para poder planear el salto | Medio | Bajo | — |
| M3 | Pinchos **cíclicos** | Aviso (temblor) → extendidos → retraídos, en vez de siempre activos: abre rutas con timing | Alto | Medio | — |
| M4 | **Portales** que conservan impulso | Al salir del portal se conserva parte de la velocidad: son atajos, no teletransporte gratis | Medio | Bajo | — |
| M5 | **Gemas / puntos valiosos** | 1–2 por nivel: valen más (25) y dan **+2 s** al timer. Fomentan risk/reward sin tocar la quota | Alto | Bajo | **Sí** (agrega contenido) |
| M6 | **Bonus "sin pies en el suelo"** | La cadena de combo se mantiene mientras no se toque el piso; al aterrizar se corta. Recompensa el estilo agresivo, muy on-brand con "Fast Move" | Alto | Medio | **Sí** (mecánica nueva) |
| M7 | **Variantes de proyectil** | En niveles 4–5 sumar un patrón más a la misma clase `Projectile` (ej. "ricochet" o "rastra"), configurado por nivel | Medio | Medio | — |
| M8 | **Dash (Shift)** | Empuje horizontal corto, cooldown ~1,2 s, se resetea al tocar suelo o wall jump, indicador en el HUD | Alto | Medio | **Sí** (control nuevo) |
| M9 | **Recordar último nivel** | Guardar en `localStorage` el nivel alcanzado y ofrecer "Continuar campaña" en el menú | Bajo | Bajo | — |

### 4.3 Game feel

| # | Propuesta | Detalle | Impacto | Esfuerzo | Confirmación |
|---|---|---|---|---|---|
| F1 | **Hitstop / time scale** | 60–90 ms de congelación al impacto, ~30 ms al recoger punto, y cámara en cámara lenta breve al morir | **Muy alto** | Bajo | — |
| F2 | **Cámara con follow suave** | Follow con lerp y deadzone chiquito (respetando los límites de 1024×768). El HUD queda fijo con `setScrollFactor(0)` | Alto | Bajo | — |
| F3 | **Zoom por combo** | La cámara hace un zoom sutil (x1.00→x1.03) al llegar a multiplicadores altos y vuelve | Medio | Bajo | — |
| F4 | **Anticipación (telegraphs)** | Pinchos, portales y la apertura de la salida avisan antes de activarse | Alto | Medio | — |
| F5 | **Audio procedural (WebAudio)** | Blip ascendente por punto (pitch según el multiplicador), "boing" del trampolín, whoosh de portal, impacto y jingle de victoria, con **sin assets ni dependencias** (`systems/Audio.js`, un solo punto de entrada `Audio.play(...)`). Tocar en el primer input (autoplay policy) | **Muy alto** | Medio | **Sí** (nueva dimensión) |
| F6 | **Curva de input: turn boost** | Invertir la dirección horizontal en el aire da un empujón corto (~15 % de velocidad, 120 ms). Clásico del género | Alto | Bajo | — |
| F7 | **Ventanas de gracia visibles** | El coyote time y el buffer ya existen: mostrarlo (squash al final del coyote, destello al buffered) para que el jugador sienta la asistencia | Medio | Bajo | — |
| F8 | **Contexto en la derrota** | Mostrar el **mejor combo** alcanzado en la partida (requiere registrar el máximo en `ScoreManager`) | Bajo | Bajo | — |
| F9 | **Tutorial contextual (nivel 1)** | 3 hints que aparecen y desaparecen al usar la mecánica (mover → wall grab → wall jump) | Medio | Medio | — |

### Fuera de alcance (para cuidar el proyecto)

Sin enemigos con IA compleja, sin scroll, sin multijugador, sin más de 5 niveles, sin dependencias externas. Las mecánicas se agregan al mapa fijo existente, no lo reemplazan.

---

## 5. Puertas de calidad (qué se verifica antes de cerrar cada fase)

- [ ] `npm run build-nolog` compila sin errores.
- [ ] Consola del navegador sin errores ni warnings.
- [ ] Recorrido manual de la fase en el dev server.
- [ ] Tests de flujo en el navegador: quota → salida → avance → victoria, y ambas derrotas.
- [ ] Checker de alcanzabilidad: todos los spots y la salida del nivel siguen siendo alcanzables (crítico con quota).
- [ ] Revisión de rendimiento: 60 fps estables y sin fugas de objetos/timers entre niveles.
- [ ] `git status` limpio, commit con mensaje descriptivo y push a `master`.

---

## 6. Decisiones abiertas (requieren tu confirmación)

1. **Audio procedural (F5)** — ¿lo sumamos? Es la mejora de game feel con más impacto y no requiere assets.
2. **Bonus "sin pies en el suelo" (M6)** — ¿entra en el alcance del trabajo? Es mecánica nueva, no solo pulido.
3. **Gemas / puntos valiosos (M5)** — ¿entran? Agregan contenido y decisiones de diseño.
4. **Dash con Shift (M8)** — es un control nuevo; requiere tu OK explícito.
5. **Atajo de reintento y mute** — si se aceptan, se agregan teclas (R y M). Requieren tu OK.
6. **Recordar último nivel (M9)** — ¿lo sumamos al menú?
7. **Balance** — los timers/quota/proyectiles actuales son de arranque; ¿los ajustamos al final con datos del playtest?

---

## 7. Backlog posterior

- Guardar en `localStorage` estadísticas por nivel (mejor tiempo, mejor combo).
- Rejugar un nivel ya superado ("modo práctica") sin afectar el récord de campaña.
- Niveles extra (6+) o variantes de mapa.
