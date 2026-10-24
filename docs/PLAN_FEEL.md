# Plan de mejora — Movimiento, recolección y tensión (Fast Move)

> **Estado:** PROPUESTA con decisiones del equipo incorporadas (ver **Anexo D**, 24/10/2026). No se implementó nada de este documento. **Para personalizarlo, respondé el cuestionario del Anexo C (una sección de preguntas por apartado).**
> **Alcance:** pulir y potenciar lo ya implementado (jugador, puntos, combo, proyectiles, HUD, audio, ambiente) para lograr tres sensaciones: **moverse es un placer**, **recolectar es adictivo** y **cada partida se vive como un frenesí con tensión creciente**.
> **Relación con `docs/PLAN.md`:** este plan **no lo reemplaza**; absorbe y amplía las fases pendientes E11–E15 (ver §11.2) y numera las suyas como **J0–J10** ("juice") para no chocar con las E.
> **Reglas del repo que lo condicionan:** `AGENTS.md` (JavaScript + Phaser 4, sin dependencias nuevas, todo procedural, **no tocar controles ni mecánicas centrales sin avisar**, commit/push solo con autorización).

---

## 0. Resumen ejecutivo

**Objetivo.** Que en los primeros 10 segundos de una partida el jugador sienta velocidad, respuesta y recompensa, y que a los 30 segundos esté en un estado de "un punto más, un salto más".

**Estrategia en una frase.** Primero todo lo que **no cambia las reglas** (visual, audio, feedback, 100 % seguro), después lo que **ajusta mecánicas** (con aprobación y re-validación de niveles), y al final los **eventos nuevos** (oleadas, rush) si el equipo los quiere.

**Qué cambia, en cifras de partida:**

| Pilar | Hoy | Meta |
|---|---|---|
| Movimiento | Rectángulo con ojos, squash/stretch, estela solo en el dash | Polvo, derrapes, sombra, estela de velocidad, expresiones, dash con buffer, caída con peso |
| Recolección | Burst de 10 partículas + `+N` + blip por multiplicador | Cadena musical (escala ascendente), orbe que vuela al HUD, onda expansiva, ruta luminosa, hitstop que escala con el combo |
| Tensión | Viñeta roja ≤10 s, proyectiles que aceleran linealmente | Director de tensión (0–1) que gobierna música, ambiente y ritmo; protocolo de los últimos 10 s; estado FRENESÍ en x5; cerca-por-poco (graze) |
| Audio | Un oscilador por evento, sin música | Bus con compresor, ruido y filtros, paleta de SFX, **música procedural por capas** que sube con el combo y el reloj |

**Lo que NO se toca (hasta que se apruebe):** controles, física base de salto/velocidad, reglas de puntaje, estructura de niveles y el generador/validador.

---

## 1. Diagnóstico (verificado en el código)

Cada hallazgo cita el archivo; los marcados con **⚠** son defectos o riesgos, no solo oportunidades.

### 1.1 Movimiento (`entities/Player.js`)

- Aceleración 1600, giro 3600, velocidad 340: la respuesta horizontal ya es **buena** (llega a velocidad máxima en ~0,21 s). Se conserva.
- Gravedad **simétrica** (900 al subir y al bajar), salto 500 px/s con corte a 150: el salto es correcto pero algo "flotante" en la caída.
- No hay **ningún feedback de superficie**: ni polvo al correr/aterrizar/saltar, ni derrape al invertir dirección, ni chispas en la pared, ni sombra en el suelo (que ayuda mucho a leer dónde se aterrizará).
- La estela solo existe durante el dash. Al correr a tope no hay lectura de velocidad (líneas, afterimages tenues).
- Expresión: ojos que miran y parpadean, carita `>_<` al daño. Falta reaccionar a eventos (recoger, dash, peligro cerca, tiempo crítico).
- El dash exige haber soltado el cooldown (900 ms) justo en el frame: **no tiene buffer de input**, así que un Shift apretado 80 ms antes de estar listo se pierde.
- ⚠ `spawnDashTrail()` está **definida dos veces** idéntica (`Player.js:375` y `:399`), y existe además una segunda estela en `Game.js` (`updateTrail`, `spawnDashGhosts`, `spawnGhost`, líneas ~758-786). Tres implementaciones del mismo efecto, cada una creando y destruyendo rectángulos (sin pool).

### 1.2 Recolección (`Game.js`, `Point.js`, `PointSpawner.js`, `ScoreManager.js`)

- Al recoger un punto pasan: hitstop de 30 ms, 10 partículas, `+N`, blip cuyo tono depende **solo del multiplicador** (5 valores posibles). No hay sensación de *cadena*: el 3.er punto suena igual que el 1.º hasta que sube el multiplicador.
- El punto desaparece de golpe. No hay animación de "absorción" ni conexión visual con el puntaje del HUD.
- `PointSpawner.activateAnother()` elige **al azar** entre los spots libres: puede activar el punto justo al lado del que acabás de tomar (cadena sin ritmo) o el más lejano posible (corte de ritmo). No hay curaduría de ritmo ni escalado con el combo. Siempre hay **2** puntos activos (`initialActive: 2`).
- ⚠ `Game.burstAt()` (`Game.js:788`) crea un **emisor de partículas nuevo en cada llamada** y nunca lo destruye. En una partida frenética (decenas de recolecciones, escudos, portales) los emisores se acumulan en la escena: fuga de objetos y caída de FPS progresiva. Es el primer ítem a corregir.
- ⚠ `Game.updateAirStreak()`: al aterrizar en el **piso** con cadena aérea activa se llama `dropCombo()`, que **borra todo el combo**, no solo la cadena aérea. Es una regla muy punitiva y contraintuitiva para un juego "rápido" (decisión de diseño pendiente, §14).
- Ventana de combo: 3 s (`comboWindowMs`), multiplicador `1 + floor(combo/3)` hasta x5 (15 recolecciones seguidas). La ventana expira **en silencio** (el HUD nuevo ya muestra la barra, pero el audio y el mundo no reaccionan).

### 1.3 Tensión (`ProjectileManager.js`, `Projectile.js`, `GameTimer.js`, `Hud.js`)

- La dificultad es una **rampa lineal** (intervalo 1700→600 ms, velocidad x1→x2) sin picos ni valles: no hay clímax ni respiro, que es lo que genera frenesí percibido.
- El proyectil se origina en una pared a altura aleatoria (140–700) con un aviso de 400 ms; apunta al jugador en el momento del spawn. La **trayectoria no se anticipa** (solo un círculo parpadeante), así que la lectura del peligro es pobre y las muertes parecen injustas.
- Sin **near-miss**: pasar rozando un proyectil no premia ni se siente distinto de que no pase nada.
- Hay viñeta roja (≤10 s) y pulso del reloj, pero **no hay audio de tensión** (tic-tac, latido, música que acelera).
- Nivel 1 no tiene proyectiles: su tensión depende solo del reloj. Hace falta tensión "sin enemigos" (ritmo del reloj, música, presión de la cadena).
- Cámara: `setBounds(0,0,1024,768)` con viewport de 1024×768 → el **seguimiento de cámara no se mueve** (solo actúa con el zoom 1,03 de x4). La cámara no aporta feel salvo el shake y el zoom.

### 1.4 Audio (`Audio.js`)

- Un único oscilador por evento, sin ruido, filtros, reverb ni compresor; todo sale directo a un `master`. Sin música.
- Eventos sin sonido propio: aterrizaje, derrape, near-miss, tic-tac del reloj, ventana de combo agotándose, subida de rango (usa `perfect`), expiración del combo, inicio de nivel.

### 1.5 Visual (`Game.js`, entidades)

- Fondo: `tileSprite` con `setScrollFactor(0)` → **estático** (solo parpadea el alpha). El parallax de `PLAN.md` E11 está pendiente en la escena de juego.
- Plataformas, puntos y proyectiles son figuras planas con pulso de halo; sin brillo en bordes, sin estelas en proyectiles estándar, sin identidad cromática por nivel.
- La salida (`Goal`) es un rectángulo con halo; la animación de anillos (V3) está pendiente.

### 1.6 Riesgo estructural: el validador depende de la física

`systems/LevelValidator.js` importa `PLAYER_CONFIG` y **fija `GRAVITY = 900`** (línea 17). El generador de niveles y `assets/levelBaselines.js` se calcularon con esa física. **Cualquier cambio en gravedad, salto, velocidad, dash o hitbox cambia qué es alcanzable.** Por eso los cambios de física van segregados en la fase J8, con re-validación completa (§3.3).

---

## 2. Principios de diseño y gobernanza

### 2.1 Pilares de feel

1. **Respuesta inmediata:** ningún efecto retrasa el control (los hitstops son micro y escalan hacia abajo con el combo).
2. **Cada acción tiene eco:** visual + sonoro + (si corresponde) cámara, siempre las tres capas, escaladas por intensidad.
3. **Escalada legible:** más combo = más color, más sonido, más luz. El jugador "ve y oye" que va bien.
4. **Peligro justo:** todo lo que mata se ve venir. La tensión sube por **ritmo y música**, no por trampas invisibles.
5. **Densidad con control:** el frenesí no es caos. Se define un presupuesto de efectos en pantalla y un modo de reducción (§8.4).

### 2.2 Clasificación de cambios (obligatoria para aprobar)

Cada ítem de este plan lleva una etiqueta:

| Tier | Qué es | Aprobación | Riesgo para niveles |
|---|---|---|---|
| **A — Presentación** | Solo visual, sonido, cámara, UI, animaciones. No altera física, puntaje ni reglas | No requiere (cumple `AGENTS.md` §3); se informa en cada fase | Ninguno |
| **B — Ajuste de mecánica** | Cambia valores o reglas existentes (física del salto, spawns, scoring, hitbox de recolección) | **Aprobación explícita ítem por ítem** | Requiere re-validar niveles (§3.3) |
| **C — Mecánica nueva** | Eventos o reglas que no existen (oleadas, rush, graze scoring, dash refund) | **Aprobación explícita ítem por ítem** | Re-validar + playtest de balance |

> Regla de oro: **la fase J0–J7 es 100 % tier A.** Se puede ejecutar completa sin tocar una sola regla.

### 2.3 Convenciones de código (de `AGENTS.md`)

Clases chicas con una responsabilidad; nada de lógica nueva dentro de `Game.js` más allá del *wiring*; eventos por `scene.events` (ya usados: `player-dash`, `player-jump`, `player-land`); patrones solo donde aportan (listados en §4); reutilizar `Audio.play`, `FloatingText`, `GamePace`, `Lang`; todo lo visual con `Graphics`/formas primitivas; textos nuevos en `Texts.js` (es/en).

---

## 3. Restricciones técnicas

### 3.1 Presupuestos de rendimiento (medibles)

| Recurso | Presupuesto | Cómo se garantiza |
|---|---|---|
| FPS | 60 estables en un equipo medio, mínimo 55 en el peor momento (x5 + 3 proyectiles + dash) | Overlay de debug (J0) y prueba de estrés |
| Partículas vivas | ≤ 250 | Emisores en pool con tope; ver `Fx.js` |
| Objetos de escena creados por frame | 0 en régimen estable (todo en pool) | Pools para fantasmas, destellos, texto, anillos |
| Audio | ≤ 24 voces simultáneas | Contador en el bus; descartar las de menor prioridad |
| Fugas | Entidades y listeners estables tras 10 reinicios de nivel | Prueba de reinicios en J0 |

### 3.2 Phaser 4 (cosas a **verificar** antes de apostar por ellas)

- **Filtros/post-proceso de cámara** (bloom, glow, viñeta, aberración): Phaser 4 los incorpora, pero **la API exacta no está verificada en este proyecto**. Plan: spike de 1–2 h en J1. Si no es viable o cuesta FPS → alternativa con sprites aditivos (`blendMode: ADD`) y degradados generados con `generateTexture`, que **sí** son seguros.
- Los **listeners de `this.events`** registrados en `Game.create()` (líneas 282-287) podrían **duplicarse** al reiniciar la escena si no se remueven en `shutdown`. No está confirmado: se audita en J0 (síntoma: doble sonido/doble shake del dash tras reintentar).
- `GamePace.hitstop` usa `world.pause()` (el motivo está documentado en el archivo): se mantiene. No usar `timeScale = 0` jamás.

### 3.3 Re-validación obligatoria al tocar la física (solo J8)

Cualquier cambio B en gravedad/salto/velocidad/dash/hitbox exige, **en este orden**:

1. Parametrizar el validador (`GRAVITY` → `GRAVITY_UP`/`GRAVITY_DOWN`, etc.) y que **lea las mismas constantes** que el jugador (hoy hay un 900 duplicado).
2. Regenerar `assets/levelBaselines.js` con `tools/gen-baselines.mjs`.
3. Correr `npm run test-levels` (alcanzabilidad, bandas de timer, determinismo, variedad) y comparar tasa de mutación e intentos con la línea base (§12).
4. Probar manualmente los 5 niveles base y 5 semillas generadas.
5. Si la tasa de mutación cae o aparecen atajos → ajustar el cambio, no el validador.

---

## 4. Arquitectura propuesta

### 4.1 Módulos nuevos

```
src/
├── assets/feel.js              datos puros: TODAS las constantes de feel (hitstop, shake, zoom, partículas, tonos)
├── systems/
│   ├── Fx.js                   fachada de efectos con pools: burst, ring, dust, spark, streak, ghost, flash
│   ├── CameraFx.js             punch de zoom, kick direccional, presets de shake, flash tintado
│   ├── TensionDirector.js      calcula tensión 0–1 y emite eventos; no dibuja ni suena
│   ├── PointDirector.js        elige qué spot activar y cuántos a la vez (reemplaza la lógica de PointSpawner)
│   ├── WaveDirector.js         (tier C) oleadas de proyectiles con patrones y aviso
│   ├── Music.js                motor de música procedural por capas (usa el bus de Audio)
│   ├── AudioBus.js             master → compresor → salida; ruido, filtros, reverb, ducking, límite de voces
│   ├── DebugOverlay.js         solo en desarrollo: FPS, objetos, partículas, tensión, métricas
│   └── Metrics.js              contadores de playtest (recolecciones/min, near-misses, causa de muerte)
├── entities/
│   └── PlayerFx.js             (composición) todo lo cosmético del jugador: polvo, sombra, expresiones, afterimages
```

`Audio.js` se conserva como **único punto de entrada** (`Audio.play(...)`); por dentro delega en `AudioBus`/`Music`.

### 4.2 Patrones (con el porqué, como pide `AGENTS.md`)

| Patrón | Dónde | Por qué |
|---|---|---|
| **Object Pool** | `Fx` (partículas, anillos, fantasmas, destellos) | Elimina la fuga de `burstAt` y los picos de GC en el frenesí |
| **Observer** (`scene.events`) | Jugador/ScoreManager/Proyectiles → `Fx`, `Audio`, `CameraFx`, `Hud` | Desacopla "qué pasó" de "cómo se muestra"; `Game.js` deja de conocer los detalles |
| **Strategy** | `PointDirector` (reglas de elección), patrones de `WaveDirector`, capas de `Music` | Cambiar o sumar una regla sin tocar al consumidor |
| **State** (liviano) | Expresión de `PlayerFx` (neutral / feliz / dash / alerta / pánico) | Evita ifs encadenados en `update` |
| **Mediator** (`TensionDirector`) | Reduce señales dispersas (tiempo, combo, proyectiles) a un solo valor | Un solo lugar gobierna música, ambiente y ritmo |

### 4.3 Contrato de eventos (nuevos, además de los 3 existentes)

`point-collected {x,y,combo,multiplier,airborne}`, `combo-changed {multiplier}`, `combo-expired`, `combo-window {fraction}` (cada frame, barato), `graze {x,y}`, `projectile-spawned {x,y,dir}`, `projectile-warn {x,y}`, `time-tick {seconds}` (cada segundo ≤10), `tension {value}` (cuando cambia ≥0,05), `frenzy-start`/`frenzy-end`, `quota-met`, `level-start`, `level-complete`, `player-hurt`, `player-dead`.

`Game.js` emite; `Fx`/`Audio`/`Hud`/`CameraFx` escuchan. Los listeners se registran **con un helper que los remueve en `shutdown`** (cierra el riesgo de §3.2).

---

## 5. Pilar 1 — Movimiento

> Meta: que correr, saltar, pegarse a la pared y dashear se sienta **pesado donde corresponde, ágil donde corresponde y siempre legible**.

### Tier A (sin riesgo)

| ID | Ítem | Detalle técnico | Aceptación | Esf. |
|---|---|---|---|---|
| M-A1 | **Sombra proyectada** | Elipse oscura bajo el jugador, proyectada al piso/plataforma más cercana debajo (raycast contra la lista de plataformas), se achica y aclara con la altura | Siempre se sabe dónde se aterrizará; no parpadea en bordes | Bajo |
| M-A2 | **Polvo al correr** | 1 partícula cada ~110 ms al tocar piso con \|vx\| > 55 % de la velocidad máxima, opuesta al avance | Aparece solo al correr y desaparece en 300 ms | Bajo |
| M-A3 | **Polvo al saltar y aterrizar** | Salto: 4 motas laterales. Aterrizaje: 6–10 motas y anillo plano; cantidad ∝ velocidad vertical previa (`prevVy`) | Un aterrizaje desde lo alto se ve y suena más fuerte que uno bajito | Bajo |
| M-A4 | **Derrape al invertir** | Si `vx` y la dirección pedida se oponen y \|vx\| > 40 %: chispas bajo los pies + sonido de fricción corto | Se activa en cada giro brusco y no en reposo | Bajo |
| M-A5 | **Squash por energía** | La intensidad del squash de aterrizaje escala con `prevVy` (1,06 → 1,28); anticipación de 1 frame antes del salto (leve achatamiento) | Caídas largas "pesan" visiblemente más | Bajo |
| M-A6 | **Estela de velocidad** | Afterimages tenues (alpha 0,10–0,18) cada 80 ms cuando \|vx\| > 85 % o \|vy\| > 520; el dash conserva su estela fuerte. **Una sola implementación** en `PlayerFx` con pool | Hay lectura de velocidad sin saturar; dash se distingue | Medio |
| M-A7 | **Líneas de velocidad** | 3–5 líneas finas a los costados durante el dash y caídas > 600 px/s | Solo aparecen en esos casos | Bajo |
| M-A8 | **Pared con chispas** | Mientras `wallGrabbing`: chispitas intermitentes; al wall jump, onda de empuje en la pared | Se distingue agarrarse de rozar | Bajo |
| M-A9 | **Expresiones (estado)** | Neutral / feliz (^_^, 400 ms tras recoger) / determinado (dash) / alerta (proyectil a < 160 px) / pánico (≤5 s). Ojos y párpados, sin sprites | Cada estado se activa en su condición y vuelve a neutral solo | Medio |
| M-A10 | **Aura por combo** | Glow del jugador (ya existe) cambia color y radio por multiplicador; en x5 pulso rítmico y partículas ascendentes (FRENESÍ, §7) | Se nota el salto de x1→x2→…→x5 sin mirar el HUD | Bajo |
| M-A11 | **Buffer de dash** | Shift apretado ≤ 120 ms antes de estar listo se ejecuta al liberar el cooldown | Ya no se "come" el dash por apretar temprano. *Ver nota de tier abajo* | Bajo |
| M-A12 | **Unificar estelas** | Borrar `spawnDashTrail` duplicada y `updateTrail/spawnDashGhosts/spawnGhost` de `Game.js`; todo pasa a `PlayerFx` + `Fx.ghost` (pool) | Un solo lugar; sin duplicación; mismo aspecto o mejor | Bajo |

> **Nota de tier del buffer de dash (M-A11):** no cambia el alcance (el cooldown es el mismo) y el validador asume dash **disponible**, así que es A. Se avisa igual porque toca un control aprobado.

### Tier B (ajuste de mecánica — requiere aprobación y re-validación)

| ID | Ítem | Propuesta y valores de partida | Efecto esperado | Riesgo |
|---|---|---|---|---|
| M-B1 | **Gravedad de caída mayor** | `gravedadBajada = 900 × 1,35` cuando `vy > 0`; la subida no cambia | Caída con peso, saltos más "snappy"; **la altura máxima del salto no cambia**, sí el alcance horizontal en descenso | Valida: alcance horizontal baja ~8 %; validador a 2 gravedades |
| M-B2 | **Velocidad máxima de caída** | Clamp a 720 px/s | Evita caídas incontrolables en niveles altos | Bajo |
| M-B3 | **Hang time en el ápice** | Gravedad ×0,6 mientras \|vy\| < 60 y el salto sigue presionado | Más control fino para colocar el salto; sensación "de plataformas moderno" | Medio: aumenta alcance horizontal (positivo) |
| M-B4 | **Corner correction** | Si la cabeza golpea una esquina a ≤ 6 px, desplazar al jugador al costado y conservar el salto | Menos golpes frustrantes contra bordes | Bajo: solo agrega alcance |
| M-B5 | **Ledge forgiveness** | Si los pies apenas no llegan (≤ 5 px) a una plataforma, "subir" suave | Menos caídas por un pixel | Bajo |
| M-B6 | **Coyote/buffer visibles** | (ya en PLAN G7) squash al final del coyote y destello al consumir buffer | Se percibe la ayuda | A en realidad (tier A) |

> M-B1 + M-B3 juntos suelen ser el cambio de feel con mejor relación costo/beneficio, pero **son la razón de la fase J8** (validador). Recomendación: prototiparlos detrás de un flag `?physics=v2` para comparar A/B en playtest antes de oficializarlos.

### Tier C

| ID | Ítem | Detalle | Riesgo |
|---|---|---|---|
| M-C1 | **Dash refund por recolección** | Recoger un punto durante/justo tras un dash recupera 40 % del cooldown (se cuenta como "tecla de flow") | Altera el alcance del dash en el validador (`dashCd`); fuerte sinergia con frenesí; requiere playtest |
| M-C2 | **Dash cancel en pared** | Terminar el dash contra pared engancha automáticamente | Menor; solo si M-C1 entra |

---

## 6. Pilar 2 — Recolección

> Meta: que cada punto sea un **mini-clímax** y que encadenar se sienta como tocar un instrumento.

### Tier A

| ID | Ítem | Detalle técnico | Aceptación | Esf. |
|---|---|---|---|---|
| C-A1 | **Escala musical de cadena** | El tono sigue una escala pentatónica por **número de recolección en la ventana** (0→15 y más), no por multiplicador. Cadena rota = vuelve a la base. Con timbre que se "abre" (más armónicos) con el multiplicador | Recolectar 6 puntos seguidos suena a melodía ascendente; romper la cadena se oye | Bajo |
| C-A2 | **Orbe volador al HUD** | Al recoger, un orbe fantasma viaja en curva hasta el puntaje (180–260 ms, `Quad.easeIn`); al llegar, `Hud.pop` y destello del panel. Orbes de gema vuelan al reloj (+2 s) | El jugador "ve" a dónde van los puntos; no tapa la acción (alpha ≤ 0,9, 12 px) | Medio |
| C-A3 | **Onda expansiva** | Anillo que crece (0→56 px, 220 ms) + 6–10 chispas con dirección radial; más grande y colorida con el multiplicador | Se distingue x1 de x4 por la onda | Bajo |
| C-A4 | **Hitstop escalado** | Actual: 30 ms siempre. Propuesta: x1 = 34 ms, x2 = 28, x3 = 22, x4 = 14, x5 = 0 **sustituido por un punch de zoom** (1,0 → 1,018 en 80 ms) | A alto combo el juego se siente fluido, no a golpes; a bajo combo cada punto "pega" | Bajo |
| C-A5 | **Aparición guiada** | El punto nuevo "nace" con un trazo luminoso corto desde el punto recién recogido (140 ms), y un destello de aparición | Se ve **hacia dónde** ir sin leer nada | Medio |
| C-A6 | **Ruta luminosa** | Una línea fina une los últimos 3–4 puntos de la cadena activa y se apaga con la ventana del combo | Se visualiza el recorrido y el ritmo del combo | Medio |
| C-A7 | **Textos con jerarquía** | `+N` crece con el multiplicador; hitos de racha (5, 10, 15 recolecciones) muestran banner corto ("¡RACHA!", "¡IMPARABLE!", "¡FRENESÍ!") con eco sonoro | Los hitos se celebran sin interrumpir | Bajo |
| C-A8 | **Punto vivo** | Orbes con brillo rotatorio, destello cíclico, y escala "respirando" levemente más rápido cuando la ventana del combo está a punto de vencer (cerca de caducar = urgencia) | Un punto "pide" ser tomado | Bajo |
| C-A9 | **Agotamiento de la ventana** | Cuando la barra del combo cae bajo 25 %: tic sutil y borde del chip parpadeando; al expirar: sonido descendente corto + partículas que se apagan sobre el jugador | Se sabe que se perdió el combo, no pasa "en silencio" | Bajo |

### Tier B

| ID | Ítem | Detalle | Riesgo |
|---|---|---|---|
| C-B1 | **`PointDirector`: elección con ritmo** | Reglas: (a) no activar a < 140 px del punto recién tomado; (b) preferir spots que el jugador alcance en 0,6–1,4 s (estimado por distancia y alturas); (c) alternar altura (piso ↔ plataforma) para forzar saltos; (d) anti-repetición de los últimos 3 spots. **Los spots siguen siendo los del nivel**, así que la alcanzabilidad no cambia | Cambia el ritmo del juego → requiere playtest; sin riesgo para el validador |
| C-B2 | **Puntos simultáneos según combo** | 2 activos hasta x2; 3 en x3–x4; 4 en x5 | Más decisiones por segundo (más frenesí); balance de quota |
| C-B3 | **Radio de recolección +4 px** | Leve generosidad (el validador ya usa 24×32): más "pegajoso" | Muy bajo |
| C-B4 | **Imán suave en combo alto** | x3+: puntos a < 52 px se atraen (≤ 140 px/s) | Cambia hitbox efectiva; mantener pequeño |

### Tier C

| ID | Ítem | Detalle |
|---|---|---|
| C-C1 | **Punto dorado temporal** | 1 cada ~12 s, vale x3 y se apaga en 4 s; aparece con aviso. Entidad nueva en `EntityFactory` |
| C-C2 | **Graze (cerca-por-poco)** | Ver T-C1 (pilar 3); recompensa de recolección indirecta: refill del combo |

---

## 7. Pilar 3 — Tensión y frenesí

> Meta: una partida es una **curva dramática** (arranque, presión, picos, clímax), no una rampa lineal.

### 7.1 `TensionDirector` (tier A, infraestructura)

Valor continuo **T ∈ [0,1]** calculado cada frame (suavizado) a partir de:

```
T = 0.45·(1 − tiempoRestante/tiempoTotal)^1.4   // reloj
  + 0.25·min(multiplicador−1, 4)/4               // combo (también "emoción", no solo peligro)
  + 0.20·densidadProyectiles                      // proyectiles activos / 4, suavizado
  + 0.10·(quota cumplida ? 1 : 0)                 // "hay que correr a la salida"
// ≥ 0.85 durante los últimos 5 s fuerza T = 1
```

Emite `tension {value}`. **Consumidores** (no se mezclan responsabilidades): `Music` (capas), `Hud` (intensidad de viñeta), `Fx` (partículas ambientales), `CameraFx` (pulso). Si el equipo ajusta los pesos, se hace en `assets/feel.js`.

### 7.2 Protocolo "últimos 10 segundos" (tier A)

| Tiempo restante | Qué pasa |
|---|---|
| 10 → 6 s | Tic-tac suave por segundo; fondo vira levemente a rojo; música +6 % de tempo |
| 5 → 1 s | Latido (kick doble) sincronizado; reloj grande en rojo con pulso; **flash rojo sutil de borde a cada segundo**; música filtro paso-alto abriéndose; jugador con expresión de pánico |
| 0 | Corte seco, silencio de 150 ms, sonido de derrota |

### 7.3 Estado **FRENESÍ** (x5, tier A)

Entra al llegar a x5 y sale al perder el combo. Efectos: aura pulsante del jugador, borde de pantalla dorado respirando, música a capa máxima, partículas ascendentes, SFX más brillantes (+1 armónico), sacudida de 1 px rítmica del fondo con el beat. Dura mientras se sostenga; al terminar, "desinflado" breve (filtro cae + chispas que se apagan). **Solo presentación**: no cambia ninguna regla.

### 7.4 Telegrafiado y legibilidad de proyectiles (tier A)

| ID | Ítem | Detalle |
|---|---|---|
| T-A1 | **Línea de trayectoria** | En los 400 ms de aviso, línea punteada de la pared hacia la posición **del jugador al momento del disparo** (la que ya usa el proyectil), que se apaga al salir |
| T-A2 | **Flecha en el borde + sonido de aviso** | Chevron rojo en el borde de spawn con "tic" agudo de tono ascendente; refuerza al jugador que mira otra cosa |
| T-A3 | **Cola de cometa** | Estela en pool (6 segmentos que se achican) para **todos** los proyectiles (no solo `rastra`); color por variante; glow aditivo |
| T-A4 | **Zona de peligro en el HUD** | Si un proyectil sale de pantalla por el lado del jugador en < 0,6 s, destello de borde del lado de origen (cerca-por-poco visual) |
| T-A5 | **Nivel 1 con tensión sin enemigos** | Latido tenue desde 20 s; música más rápida con el reloj; ondas de color en el fondo sincronizadas |

### 7.5 Cerca-por-poco (graze)

| ID | Tier | Detalle |
|---|---|---|
| T-A6 | A | **Feedback**: al pasar un proyectil a < 36 px sin impactar, chispa + "tss" + microzoom y texto `¡CERCA!` pequeño |
| T-C1 | **C** | **Recompensa**: +25 puntos (sin multiplicador), +0,6 s de ventana de combo (tope una vez cada 1,2 s por proyectil). Cambia el balance del riesgo → **aprobación** |

### 7.6 Ritmo de la partida (tier C — requiere aprobación)

| ID | Ítem | Detalle |
|---|---|---|
| T-C2 | **`WaveDirector`: oleadas** | A ~35 %, 65 % y 90 % del tiempo: aviso `¡OLEADA!` (sonido + borde) y un patrón telegrafiado: *salva* (3 paralelos), *cruz* (izq+der simultáneo), *barrido* (arriba→abajo escalonado), *pinza* (2 convergentes). Entre oleadas, el spawn regular **baja** ~25 % (respiro). El N1 no tiene oleadas |
| T-C3 | **RUSH (opcional)** | A ~50 % del tiempo, 6 s en que los puntos valen x2 y los proyectiles +30 % de frecuencia. Banner, música intensifica y vuelve |
| T-C4 | **Curva por nivel** | Cada nivel define en datos qué oleadas usa y cuándo (`assets/levels.js` solo datos puros, como manda el plan) |

---

## 8. Pilar 4 — Audio (transversal)

### 8.1 Motor (`AudioBus.js` + extensión de `Audio.js`)

- **Cadena:** fuentes → `master` → `DynamicsCompressor` (umbral −12 dB, ratio 4) → salida. Evita saturación cuando hay muchos eventos.
- **Primitivas nuevas:** `noise()` (ruido blanco/rosa con filtro y envolvente → whoosh, polvo, impacto), `chord()`, `filterSweep()`, **reverb corta** (convolver con impulso generado al inicio), **ducking** (baja la música 6 dB ~120 ms en eventos grandes).
- **Límite de voces** (24) con prioridades (muerte > hito > recolección > UI).
- Se respeta la política de autoplay existente (`ensureContext` en el primer input) y el mute `M` persistente. Sumar al menú, más adelante, un control separado SFX / Música (backlog).

### 8.2 Paleta de SFX (nuevos/rehechos)

| Evento | Diseño |
|---|---|
| Recoger (cadena) | Pluck cuadrado + armónico, nota de la escala C-A1 (§6) |
| Aterrizaje | Golpe grave + ruido corto; más largo si cayó de alto |
| Derrape | Ruido filtrado 90 ms |
| Salto / wall jump | Ya existen; se agrega "puff" de ruido |
| Dash | Whoosh de ruido con sweep + el saw actual |
| Graze | "Tss" agudo de ruido filtrado |
| Combo sube | Arpegio de 3 notas ascendente |
| Combo se pierde | Glissando descendente corto |
| Frenesí entra | Acorde brillante + riser de 250 ms |
| Tic-tac / latido | Click seco / kick doble |
| Oleada | Sirena corta de 2 tonos |
| Nivel superado | Cascada de arpegio + brillo (hoy es un jingle simple) |
| Muerte | Impacto grave + low-pass sweep descendente de la música + silencio |

### 8.3 Música procedural (`Music.js`)

**Concepto:** un loop de 8 compases generado en tiempo real con el reloj de WebAudio (scheduler con *lookahead* de ~100 ms, sin `setInterval` impreciso). Tonalidad menor, 120 BPM base, sube hasta 138 BPM con la tensión.

| Capa | Contenido | Entra cuando |
|---|---|---|
| L0 Base | Bajo sinusoidal + pad suave | Siempre |
| L1 Ritmo | Kick, hi-hat | T > 0,25 o multiplicador ≥ 2 |
| L2 Arpegio | Arpegio de onda cuadrada filtrada | Multiplicador ≥ 3 |
| L3 Lead | Melodía brillante + brillos | Frenesí (x5) |
| L4 Presión | Pulso y riser | Últimos 10 s |

Las capas entran/salen con *fades* de 1 compás para no cortar. En la derrota: low-pass cae en 400 ms. En victoria: stinger y corte. Cada nivel puede variar **tónica y patrón de bajo** (identidad sonora por nivel, sin assets).

### 8.4 Accesibilidad y modos (importante para un juego frenético)

- **Reducir movimiento:** apaga shake, zoom punch y parallax reactivo.
- **Reducir destellos:** limita los flashes de cámara (fotosensibilidad) y baja la viñeta pulsante.
- **Calidad de efectos:** Alta / Media / Baja (cantidad de partículas y fantasmas), con **degradación automática** si el FPS cae < 50 durante 3 s.
- Se exponen en el menú ("OPCIONES" nuevo, o dentro de CONTROLES) y se guardan en `localStorage`.

---

## 9. Pilar 5 — Visual y ambiente

| ID | Ítem | Detalle | Relación con PLAN.md | Tier |
|---|---|---|---|---|
| V-1 | **Parallax real** | 3 capas con `Graphics` (cielo con degradado, siluetas lejanas, partículas) que se mueven 4–10 % con la posición del jugador y 1–2 px con el beat | E11 / V1 | A |
| V-2 | **Identidad por nivel** | `theme {bgTop,bgBottom,accent,glow}` por nivel aplicado al fondo, plataformas, HUD y música | E11 / V2 | A |
| V-3 | **Plataformas con borde luminoso** | Línea clara superior + degradado sutil + glow tenue del color del tema; pequeño "latido" con el beat en frenesí | E12 / V5 | A |
| V-4 | **Salida animada** | Anillos concéntricos giratorios, partículas que entran; abrir = destello y cambio de color inequívoco | E12 / V3 | A |
| V-5 | **Gemas distinguibles** | Forma de rombo con facetas y brillo en barrido | E12 / V4 | A |
| V-6 | **Cuadrícula reactiva** | La grilla del fondo pulsa en alpha con el beat y se acelera con la tensión | nuevo | A |
| V-7 | **Aberración y bloom (opcional)** | Solo si el spike de filtros de Phaser 4 resulta viable; fallback con aditivo | nuevo | A |
| V-8 | **Viñeta dinámica** | Hoy es roja a ≤10 s; pasa a ser del color del tema/dorada en frenesí y roja solo en peligro | E11 / V8 | A |
| V-9 | **Proyectiles con carácter** | Glow aditivo, color por variante, rotación, y chispa al desaparecer por el borde | nuevo | A |
| V-10 | **Mundo reacciona a la meta** | Al cumplir la quota la sala se "enciende": plataformas con pulso verde hacia la salida | nuevo | A |

---

## 10. Pilar 6 — Transiciones, pantallas y cierre

| ID | Ítem | Detalle | Relación | Tier |
|---|---|---|---|---|
| S-1 | **Intro de nivel** | Tarjeta con número y nombre (0,9 s), cuenta 3-2-1 breve con tic ascendente y "¡YA!". **El reloj no corre durante la tarjeta** (hoy `GameTimer` arranca en el primer update: se difiere al "¡YA!") | nuevo | A (toca el inicio del timer: avisar) |
| S-2 | **Wipe entre niveles** | Cortina diagonal o iris de 350 ms con el color del nivel siguiente | E14 / V7 | A |
| S-3 | **Llegada a la salida** | Slowmo 250 ms + punch de zoom + estela hacia la salida; el bono de tiempo se **cuenta en vivo** (cada segundo suma con tic ascendente) y la medalla "cae" con rebote | E14 | A |
| S-4 | **Muerte con peso** | Hitstop + desintegración del jugador en 12–16 fragmentos que caen, desaturación breve, low-pass en la música | E14 / V7 | A |
| S-5 | **Fin de partida más informativo** | "Te faltaron N puntos para la salida", mejor combo, causa de la muerte con un consejo; animación de entrada del panel | E14 / G8 | A |
| S-6 | **Reinicio instantáneo** | `R` en juego: wipe de 200 ms y vuelve en < 0,5 s | existente | A |

---

## 11. Plan de ejecución por fases

Cada fase: **un commit, un push con autorización y revisión** (regla del repo). Esfuerzo en jornadas de trabajo de 1 persona.

| Fase | Contenido | Tier | Depende de | Esfuerzo | Entregable verificable |
|---|---|---|---|---|---|
| **J0** | **Base y herramientas:** `assets/feel.js`; `DebugOverlay` (F3, solo dev); `Metrics`; auditoría de listeners y reinicios; corregir `burstAt`; borrar estelas duplicadas | A | — | 1 | FPS y objetos estables tras 10 reinicios; consola sin warnings; línea base medida |
| **J1** | **Núcleo de efectos:** `Fx` con pools (burst, ring, dust, spark, streak, ghost, flash); `CameraFx`; **spike de filtros de Phaser 4**; helper de listeners con limpieza | A | J0 | 1,5 | Todos los efectos existentes migrados a `Fx`; sin fugas; decisión sobre filtros |
| **J2** | **Recolección:** C-A1…C-A9 (escala, orbe volador, onda, hitstop escalado, aparición guiada, ruta, textos, punto vivo, agotamiento) | A | J1, J4 (parcial) | 2 | Recolectar 15 puntos suena y se ve distinto en cada tramo; HUD recibe el orbe |
| **J3** | **Movimiento A:** M-A1…M-A12 (`PlayerFx`, sombra, polvo, derrape, squash, estelas, expresiones, aura, buffer de dash) | A | J1 | 2 | Cada efecto aparece solo cuando corresponde; una sola estela |
| **J4** | **Audio v2:** `AudioBus`, primitivas de ruido/filtro/reverb, paleta de SFX, límite de voces, ducking | A | J0 | 1,5 | Sin clicks ni saturación en la prueba de estrés |
| **J5** | **Música + Tensión:** `Music` por capas, `TensionDirector`, protocolo de últimos 10 s, estado FRENESÍ, tensión del N1 | A | J1, J4 | 2,5 | Las capas entran y salen con el combo y el reloj; transiciones sin cortes |
| **J6** | **Mundo visual:** parallax, temas, plataformas con glow, salida animada, gemas, grilla reactiva, proyectiles con carácter y telegrafiado (T-A1…T-A5), viñeta dinámica | A | J1, J5 | 3 | Cada nivel se distingue por paleta; la trayectoria se lee antes de impactar |
| **J7** | **Transiciones y pantallas:** S-1…S-6, **opciones de accesibilidad** (§8.4) | A | J2, J5 | 2 | Nivel arranca con tarjeta; el reloj corre desde "¡YA!"; modos de reducción funcionan |
| **— Hito —** | **Playtest 1 con todo lo tier A** (ver §12) | — | J0–J7 | 1 | Informe de métricas y decisión sobre B y C |
| **J8** | **Mecánicas B (con aprobación):** M-B1…M-B5 (gravedad, hang, correcciones), C-B1…C-B4 (`PointDirector`, puntos simultáneos, radio, imán). **Validador parametrizado + `levelBaselines` regenerado + `test-levels`** (§3.3) | B | Hito | 3 | `npm run test-levels` sin regresión de tasa de mutación; 5 niveles base jugables |
| **J9** | **Mecánicas C (con aprobación):** `WaveDirector`, RUSH, graze con recompensa, dash refund, punto dorado | C | J8 | 3 | Cada evento telegrafiado; balance validado en playtest |
| **J10** | **Balance, rendimiento y documentación:** ajuste final con `feel.js`, prueba de estrés, actualizar `PLAN.md`/`README.md`/`GDD` (con solicitud explícita) | — | todas | 1,5 | Puertas de calidad de `PLAN.md` §6 en verde |

**Total estimado:** ~24 jornadas completas (J0–J7 ≈ 15,5 sin tocar reglas). Las fases A pueden entregarse una a una; el juego queda **siempre jugable y comparable**.

### 11.1 Quick wins (primeras horas, máximo impacto)

1. Pool de partículas (corrige la fuga, mejora FPS). 2. Escala musical de cadena (C-A1). 3. Orbe volador al puntaje (C-A2). 4. Sombra + polvo al aterrizar (M-A1/A3). 5. Hitstop escalado (C-A4). 6. Buffer de dash (M-A11). 7. Tic-tac de los últimos 5 s (§7.2). Con estos siete, la diferencia ya se percibe en la primera partida.

### 11.2 Mapeo con `PLAN.md`

| Pendiente en `PLAN.md` | Se absorbe en |
|---|---|
| E11 (parallax, temas, viñeta) | J6 (V-1, V-2, V-8) |
| E12 (salida, gemas, feedback de movimiento) | J3, J6 (V-4, V-5, M-A*) |
| E13 (HUD) | **Hecho** (HUD nuevo) |
| E14 (pantallas y mejor combo) | J7 (S-2…S-5) |
| E15 (turn boost, ventanas visibles, tutorial) | M-B6 / J3 (ventanas visibles); turn boost → backlog (evaluar tras J8) |
| E17 (balance final) | J10 |

---

## 12. Medición y playtest

### 12.1 Instrumentación (`Metrics` + `DebugOverlay`, solo en desarrollo)

Por partida: recolecciones/min, **tiempo mediano entre recolecciones**, % del tiempo con multiplicador ≥ x3, combo máximo, graze/near-miss, causa de muerte, ratio quota/tiempo, FPS mínimo y objetos activos. Volcado a consola (`console.table`) y, opcional, a `localStorage` para comparar sesiones.

### 12.2 Metas cuantificables (se ajustan con la línea base de J0)

| Métrica | Meta orientativa |
|---|---|
| FPS mínimo | ≥ 55 |
| Mediana entre recolecciones (nivel medio) | 1,2–1,8 s |
| Tiempo con combo ≥ x3 | 35–55 % |
| Muertes en la primera partida del N2 | ≤ 1 de cada 3 |
| Aprobación subjetiva (1–5) de *movimiento*, *recolección* y *tensión* | ≥ 4 en cada eje |

### 12.3 Protocolo

1. **Línea base** (J0): 3 personas, 3 partidas cada una, sin cambios; registrar métricas y puntuar los tres ejes.
2. **Playtest 1** (hito tras J7): mismo grupo + 2 personas nuevas; comparar contra la base. Preguntas fijas: ¿qué te dio más ganas de seguir?, ¿hubo algo que molestó o cansó?, ¿cuándo sentiste que ibas "bien"?
3. **A/B de física** (J8): flag `?physics=v2` vs actual; 5 partidas cada uno, comparar mediana entre recolecciones y muertes.
4. **Prueba de estrés** (J10): partida con x5 sostenido + 4 proyectiles + dash continuo; el FPS no baja de 55.

---

## 13. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Sobrecarga visual/sonora ("ruido") que tape el peligro | Alta | Alto | Presupuestos (§3.1), jerarquía de capas, modos de reducción, playtest dedicado a legibilidad |
| Caída de FPS por partículas/audio | Media | Alto | Pools, tope de partículas, degradación automática, overlay de debug |
| Cambiar física rompe la alcanzabilidad de niveles | Media | Alto | Aislado en J8; validador parametrizado; `test-levels`; A/B con flag |
| Música procedural suena mal/repetitiva | Media | Medio | Prototipo corto en J5; capas simples; variación por nivel; opción de silenciarla (M) |
| Filtros de Phaser 4 inviables | Media | Bajo | Spike en J1 con fallback aditivo ya definido |
| Fotosensibilidad / mareo | Baja | Alto | Opciones de §8.4 desde J7; sin flashes > 3 por segundo |
| Aumento de dificultad percibida (más proyectiles + más estímulos) | Media | Medio | Telegrafiado (T-A1…A5) **antes** de cualquier cambio de ritmo (T-C2) |
| Duplicar listeners al reiniciar | Media | Medio | Auditoría en J0 + helper de limpieza |
| Alcance inflado | Alta | Medio | Fases A entregables por separado; B y C solo con aprobación |

---

## 14. Decisiones que necesito del equipo

Cada una cambia lo que se implementa. Mi recomendación va primera.

1. **Aprobación por tiers.** ¿Autorizan ejecutar **todo lo tier A (J0–J7)** sin más consultas, informando al cierre de cada fase? *(Recomendado: sí.)*
2. **Combo y cadena aérea (`updateAirStreak`).** Hoy aterrizar en el piso con cadena aérea **borra el combo completo**. Opciones: (a) mantener; (b) **solo cortar la cadena aérea y conservar el combo** *(recomendado: es la mecánica más contraintuitiva del juego rápido)*; (c) cortar solo si el aterrizaje supera cierta caída. Es **tier B**.
3. **Física del salto (M-B1/B3).** ¿Se prueba la caída pesada + hang time detrás de `?physics=v2`? *(Recomendado: sí, A/B antes de oficializar.)*
4. **Graze con recompensa (T-C1).** ¿Premiar el riesgo con +25 puntos y refill de combo? *(Recomendado: sí; se desactiva con una constante.)*
5. **Oleadas y RUSH (T-C2/C3).** ¿Querés eventos de ritmo o preferís mantener la rampa lineal? *(Recomendado: oleadas sí, RUSH opcional tras playtest.)*
6. **Dash refund (M-C1).** ¿Lo habilitamos? Es el mayor generador de flow, pero también el que más puede romper atajos. *(Recomendado: evaluar tras J8.)*
7. **Música.** ¿Procedural (sin assets, recomendado) o se aceptaría un asset externo? (`AGENTS.md` exige preguntar antes de agregar assets.)
8. **Timer del nivel.** S-1 propone que el reloj arranque en el "¡YA!" y no al entrar. Toca una regla de tiempo (+~2 s de presentación que no cuentan). ¿Aprobado?
9. **Opciones de accesibilidad.** ¿Agregamos el menú de OPCIONES (reducir movimiento/destellos, calidad de efectos) en J7? *(Recomendado: sí.)*

---

## 15. Fuera de alcance (para cuidar el proyecto)

Sin sprites ni assets externos, sin dependencias nuevas, sin cambiar los 5 niveles base ni el generador (salvo parametrizar el validador en J8), sin multijugador ni scroll, sin soporte móvil. El *turn boost* (G6), el modo práctica, las estadísticas por nivel y las skins quedan en el backlog de `PLAN.md` §8.

---

## Anexo A — Valores de partida de `assets/feel.js`

```js
export const FEEL = {
    hitstop:  { point: [34, 28, 22, 14, 0], gem: 30, hurt: 80, death: 80 },   // ms por multiplicador x1..x5
    slowmo:   { death: { ms: 700, factor: 0.35 }, goal: { ms: 250, factor: 0.5 } },
    shake:    { dash: [90, 0.0035], land: [60, 0.002], hit: [400, 0.02], shield: [160, 0.008], combo: [70, 0.002], frenzyPulse: [40, 0.0012] },
    zoom:     { comboHigh: 1.03, punch: 1.018, punchMs: 80 },
    dash:     { bufferMs: 120, refundOnCollect: 0.4 },              // refund = tier C
    jump:     { fallGravityMul: 1.35, hangMul: 0.6, hangVy: 60, maxFall: 720, cornerPx: 6 },   // tier B
    collect:  { ringRadius: 56, ringMs: 220, orbFlyMs: [180, 260], sparks: [6, 10] },
    combo:    { warnFraction: 0.25, grazePx: 36, grazeBonus: 25, grazeRefillMs: 600 },        // graze = tier C
    tension:  { wTime: 0.45, wCombo: 0.25, wProj: 0.20, wQuota: 0.10, smooth: 0.08 },
    music:    { bpm: [120, 138], layerFadeBars: 1 },
    fx:       { maxParticles: 250, ghostAlpha: [0.10, 0.18], dustEveryMs: 110 },
    waves:    { at: [0.35, 0.65, 0.90], breathPct: 0.25 }           // tier C
};
```

*Todos los valores son de partida: se afinan en J10 con las métricas de §12.*

## Anexo B — Archivos que toca cada fase (para revisar el impacto antes de aprobar)

| Fase | Archivos existentes modificados | Archivos nuevos |
|---|---|---|
| J0 | `Game.js` (burstAt, listeners), `Player.js` (estela duplicada) | `assets/feel.js`, `DebugOverlay.js`, `Metrics.js` |
| J1 | `Game.js`, `Projectile.js`, `Point.js` | `Fx.js`, `CameraFx.js` |
| J2 | `Game.js` (wiring), `Hud.js` (recibir orbes), `Point.js`, `ScoreManager.js` (solo exponer índice de cadena) | — |
| J3 | `Player.js` (hooks y buffer de dash) | `PlayerFx.js` |
| J4 | `Audio.js` | `AudioBus.js` |
| J5 | `Audio.js`, `Hud.js`, `Game.js` | `Music.js`, `TensionDirector.js` |
| J6 | `Game.js`, `Level.js`, `Goal.js`, `Gem.js`, `Projectile.js`, `ProjectileManager.js`, `levels.js` (temas) | — |
| J7 | `Game.js`, `GameOver.js`, `GameTimer.js`, `MainMenu.js`, `Texts.js` | — |
| J8 | `Player.js`, `LevelValidator.js`, `LevelGenerator.js`, `levelBaselines.js`, `PointSpawner.js`, `ScoreManager.js` | `PointDirector.js` |
| J9 | `ProjectileManager.js`, `Game.js`, `levels.js` | `WaveDirector.js` |

---

## Anexo C — Cuestionario para personalizar el plan

**Cómo responder:** completá la línea `Respuesta:` de cada pregunta (podés poner solo la letra, ej. `b`, o escribir lo que quieras). Las opciones marcadas con ⭐ son mi recomendación. Si algo no te importa, poné `da igual` y uso la recomendación. Al final de cada bloque hay una pregunta abierta para sumar o quitar cosas de ese apartado.

Podés contestarme por el chat citando el número (por ejemplo: `5.2 b, 5.3 a, 7.1 quiero oleadas pero suaves`) o editando este archivo.

---

### Apartado 0 — Resumen ejecutivo y visión

**0.1 — ¿Qué referencia de "sensación" tenés en mente?**
a) Arcade retro con mucho color y sonido (estilo *Super Meat Boy* / *Celeste* en juice) ⭐
b) Minimalista y limpio, con feedback sutil
c) Caótico y exagerado (*Vampire Survivors*, *Nuclear Throne*)
d) Otra: ______
Respuesta: ____

**0.2 — ¿Para quién es la versión final?**
a) Presentación/evaluación de la materia (hay que impresionar en una demo corta de 3–5 min) ⭐
b) Publicación para jugadores reales (Vercel, sesiones largas)
c) Ambas
Respuesta: ____

**0.3 — Ordená los tres pilares por prioridad (1 = el más importante):** Movimiento __ · Recolección __ · Tensión/frenesí __

**0.4 — Si hubiera que recortar, ¿qué se sacrifica primero?**
a) Música procedural ⭐ (es lo más complejo)
b) Mecánicas B/C (oleadas, graze, dash refund)
c) Transiciones y pantallas
d) Parallax y temas por nivel
Respuesta: ____

**0.5 — ¿Hay una fecha de entrega o de demo que ordene el trabajo?** (fecha y qué debería estar sí o sí): ______

**0.6 — Pregunta abierta:** ¿algo que quieras agregar o quitar de la visión general? ______

---

### Apartado 1 — Diagnóstico

**1.1 — De lo que describe el diagnóstico, ¿qué es lo que más te molesta al jugar hoy?** (podés marcar varias)
a) Los saltos se sienten flotantes en la caída
b) Recoger puntos no da suficiente satisfacción
c) No hay tensión ni urgencia
d) Los proyectiles se sienten injustos o difíciles de leer
e) El personaje y el mundo se ven planos
f) Falta música/sonido
g) Otra cosa: ______
Respuesta: ____

**1.2 — ¿Estás de acuerdo con que aterrizar con cadena aérea borre el combo completo?**
a) Sí, es parte del desafío
b) No, debería cortar solo la cadena aérea y conservar el combo ⭐
c) Debería depender de cuánto se cae
Respuesta: ____

**1.3 — ¿Notaste problemas que NO están en el diagnóstico?** (bugs, tirones, cosas confusas, niveles injustos): ______

**1.4 — ¿Qué nivel del 1 al 5 se siente peor hoy?** ______  ¿por qué?: ______

---

### Apartado 2 — Principios de diseño y gobernanza

**2.1 — ¿Se ejecuta todo lo tier A (J0–J7) sin consultarte fase por fase?**
a) Sí, informame al cerrar cada fase ⭐
b) No, quiero aprobar cada fase antes de empezarla
c) Aprobar por bloques (J0–J3, J4–J7)
Respuesta: ____

**2.2 — ¿Cómo querés ver el avance de cada fase?**
a) Capturas/video corto en el chat + build funcionando en el puerto 5173 ⭐
b) Solo descripción y archivos modificados
c) Un artefacto web con antes/después
Respuesta: ____

**2.3 — Commits:** `AGENTS.md` dice "rama única `master`" pero el repo está en `main`. ¿Dónde se commitea?
a) `main` (la actual) ⭐
b) Crear `master`
c) Una rama por fase y después se fusiona
Respuesta: ____

**2.4 — ¿Un commit por fase o por ítem?**
a) Un commit por fase ⭐
b) Un commit por ítem (más historial)
c) Un commit por pilar
Respuesta: ____

**2.5 — ¿Quién más revisa o aprueba cambios (el compañero Facundo, el docente)?** ______

**2.6 — Pregunta abierta sobre reglas de trabajo:** ______

---

### Apartado 3 — Restricciones técnicas

**3.1 — ¿En qué equipo se va a jugar/mostrar el juego?**
a) PC con GPU integrada o gama media ⭐ (diseño al límite seguro)
b) PC potente
c) Notebook básica o proyector de aula
Respuesta: ____

**3.2 — ¿Autorizás el spike de 1–2 h sobre filtros de Phaser 4 (bloom/glow)?** Si no resulta, se usa el plan B con sprites aditivos.
a) Sí ⭐
b) No, directo con sprites aditivos
Respuesta: ____

**3.3 — ¿Degradación automática de efectos si el FPS cae de 50?**
a) Sí, sin avisar ⭐
b) Sí, avisando con un cartel
c) No, quiero control manual por menú
Respuesta: ____

**3.4 — ¿Navegadores que tienen que funcionar?** (Chrome / Edge / Firefox / Safari): ______

**3.5 — ¿El overlay de debug (F3) debe poder usarse durante la demo, o solo en desarrollo?**
a) Solo desarrollo ⭐
b) También en producción con un atajo oculto
Respuesta: ____

**3.6 — Pregunta abierta:** ______

---

### Apartado 4 — Arquitectura propuesta

**4.1 — ¿Te parece bien centralizar todas las constantes de feel en `assets/feel.js`?**
a) Sí ⭐
b) Prefiero dejarlas en cada clase
Respuesta: ____

**4.2 — ¿Separamos lo cosmético del jugador en `PlayerFx` (composición) y dejamos `Player.js` solo con física?**
a) Sí ⭐
b) No, todo dentro de `Player.js`
Respuesta: ____

**4.3 — `Player.update` tiene ~280 líneas. ¿Se refactoriza a máquina de estados?**
a) No, solo extraer lo cosmético ⭐ (menos riesgo)
b) Sí, en una fase aparte con pruebas de equivalencia
Respuesta: ____

**4.4 — ¿Un panel de tuning en vivo (sliders o comandos de consola) para ajustar valores jugando?**
a) Comandos de consola solo en desarrollo ⭐
b) Panel con sliders en pantalla
c) No hace falta
Respuesta: ____

**4.5 — ¿Eventos por `scene.events` con helper de limpieza, o preferís otro mecanismo?** ______

**4.6 — Pregunta abierta:** ______

---

### Apartado 5 — Pilar 1: Movimiento

**5.1 — Hoy, ¿cómo describirías el movimiento y cómo lo querés?**
Hoy: a) flotante b) justo c) pesado
Quiero: a) más ágil y ligero b) más pesado y con peso ⭐ (caída pesada, subida rápida) c) igual, solo con efectos
Respuesta: ____

**5.2 — Caída pesada (M-B1) y hang time en el ápice (M-B3):**
a) Probar ambas detrás de `?physics=v2` y comparar ⭐
b) Solo caída pesada
c) No tocar la física
Respuesta: ____

**5.3 — Corner correction y ledge forgiveness (M-B4/B5):**
a) Sí, las dos ⭐
b) Solo corner correction
c) No
Respuesta: ____

**5.4 — Buffer de dash de 120 ms (M-A11):**
a) Sí ⭐
b) Sí pero más corto (80 ms)
c) No
Respuesta: ____

**5.5 — Dash refund al recoger un punto (M-C1):** más flow, pero puede romper atajos.
a) Sí, probarlo después de J8 ⭐
b) Sí, ya en J3
c) No
Respuesta: ____

**5.6 — Expresiones del personaje (feliz, alerta, pánico):**
a) Sí, todas ⭐
b) Solo feliz y pánico
c) Mantener solo ojos y parpadeo
Respuesta: ____

**5.7 — Sombra bajo el personaje:** a) Sí ⭐  b) No (prefiero limpio)  Respuesta: ____

**5.8 — Cantidad de polvo/partículas de movimiento:** a) sutil ⭐  b) moderada  c) exagerada  Respuesta: ____

**5.9 — ¿Querés movimientos nuevos?** (el GDD menciona un salto doble desbloqueable): a) No por ahora ⭐  b) Salto doble  c) Deslizamiento  d) Otro: ______  Respuesta: ____

**5.10 — Pregunta abierta sobre el movimiento (qué juego te gustaría que se sintiera parecido):** ______

---

### Apartado 6 — Pilar 2: Recolección

**6.1 — Sonido al recolectar:**
a) Escala musical ascendente por cadena ⭐
b) Blips retro estilo 8 bits, sin escala
c) Sonidos más "orgánicos" (pops, burbujas)
Respuesta: ____

**6.2 — Orbe que vuela al puntaje (C-A2):** a) Sí ⭐  b) No, es demasiado ruido visual  Respuesta: ____

**6.3 — Hitstop al recoger:**
a) Escalado: más corto cuanto más combo, y en x5 se reemplaza por zoom ⭐
b) Mantener 30 ms fijo
c) Eliminarlo
Respuesta: ____

**6.4 — Elección de los puntos (`PointDirector`, tier B):**
a) Con ritmo: lejos del último, alternando alturas ⭐
b) Seguir al azar como hoy
c) Que siempre aparezca el más cercano (más fácil)
Respuesta: ____

**6.5 — Puntos activos a la vez:**
a) Más con el combo (2 → 3 → 4) ⭐
b) Siempre 2
c) Siempre 3
Respuesta: ____

**6.6 — Imán suave en combo alto (C-B4):** a) Sí  b) No ⭐ (puede sentirse "automático")  Respuesta: ____

**6.7 — Punto dorado temporal (C-C1):** a) Sí  b) Más adelante ⭐  c) No  Respuesta: ____

**6.8 — Ventana del combo (hoy 3 s) y tope x5:**
a) Mantener ambos ⭐
b) Ventana más corta (2,5 s) para más tensión
c) Ventana más larga (4 s) para más relajado
d) Tope más alto (x8)
Respuesta: ____

**6.9 — Hitos de racha con banner ("¡RACHA!", "¡FRENESÍ!"):** a) Sí ⭐  b) Solo sonido, sin texto  Respuesta: ____

**6.10 — Pregunta abierta sobre recolección:** ______

---

### Apartado 7 — Pilar 3: Tensión y frenesí

**7.1 — Curva de dificultad durante el nivel:**
a) Con oleadas y respiros ⭐
b) Rampa lineal como hoy
c) Rampa lineal más empinada
Respuesta: ____

**7.2 — Oleadas telegrafiadas (T-C2):** a) Sí, 3 por nivel ⭐  b) Sí, solo 1 al final  c) No  Respuesta: ____

**7.3 — RUSH (puntos x2 + más proyectiles durante 6 s):** a) Sí  b) Probar tras el playtest ⭐  c) No  Respuesta: ____

**7.4 — Graze / cerca-por-poco (T-A6 feedback, T-C1 recompensa):**
a) Feedback + recompensa (+25 y refill) ⭐
b) Solo feedback visual y sonoro
c) Nada
Respuesta: ____

**7.5 — Intensidad del protocolo de los últimos 10 s:**
a) Fuerte: tic-tac, latido, flash de borde por segundo ⭐
b) Media: solo tic-tac y color
c) Suave: solo lo que existe hoy
Respuesta: ____

**7.6 — Estado FRENESÍ en x5:** a) Pleno (aura, borde dorado, música al máximo) ⭐  b) Solo música y aura  c) No  Respuesta: ____

**7.7 — Línea de trayectoria del proyectil durante el aviso (T-A1):**
a) Sí, para que sea justo ⭐
b) Solo la flecha en el borde
c) Quiero que sea más difícil de leer
Respuesta: ____

**7.8 — Dificultad objetivo:**
a) Accesible: que la mayoría complete el nivel 2 al segundo intento
b) Equilibrada: el que juega bien completa, hay que esforzarse ⭐
c) Exigente: pocos llegan al final
Respuesta: ____

**7.9 — Nivel 1 (sin proyectiles):** a) Sumarle tensión de música y reloj ⭐  b) Dejarlo tranquilo para aprender  c) Agregarle algún peligro  Respuesta: ____

**7.10 — Pregunta abierta sobre tensión:** ______

---

### Apartado 8 — Pilar 4: Audio

**8.1 — Estilo de la música procedural:**
a) Synthwave / electrónica oscura ⭐ (encaja con el neón)
b) Chiptune 8 bits
c) Techno minimalista
d) Otro: ______
Respuesta: ____

**8.2 — ¿La música arranca activa por defecto?** a) Sí, con volumen moderado ⭐  b) Silenciada hasta que se active  Respuesta: ____

**8.3 — Controles de volumen:**
a) Un solo mute (`M`) como hoy
b) Mute `M` + botones separados SFX/Música en opciones ⭐
c) Sliders de volumen
Respuesta: ____

**8.4 — Música distinta por nivel (tonalidad y bajo propios):** a) Sí ⭐  b) Una sola música para todo  Respuesta: ____

**8.5 — Música en el menú:** a) Sí, una versión tranquila ⭐  b) Silencio en el menú  Respuesta: ____

**8.6 — Intensidad sonora general:** a) Contenida, profesional ⭐  b) Fuerte y llamativa  Respuesta: ____

**8.7 — Pregunta abierta de audio** (¿alguna canción o juego de referencia?): ______

---

### Apartado 9 — Pilar 5: Visual y ambiente

**9.1 — Paleta por nivel (V-2):** ¿qué clima querés para cada uno?
N1 ______ · N2 ______ · N3 ______ · N4 ______ · N5 ______
(sugerencia: N1 cian, N2 violeta, N3 ámbar, N4 rojo, N5 multicolor)

**9.2 — Intensidad del parallax:** a) Sutil ⭐  b) Marcado  c) Sin parallax  Respuesta: ____

**9.3 — Bloom/aberración (si el spike resulta viable):** a) Sí, moderado ⭐  b) No, estilo plano  Respuesta: ____

**9.4 — Aspecto del personaje:**
a) Mantener el rectángulo con ojos y sumarle brillo y outline ⭐
b) Darle más carácter (antena, bufanda, piernitas)
c) Cambiarlo por completo
Respuesta: ____

**9.5 — Proyectiles:** a) Cometas con cola de brillo ⭐  b) Los actuales con un poco de glow  c) Cambiar formas por variante (espinas, cruces)  Respuesta: ____

**9.6 — Grilla del fondo que pulsa con el beat:** a) Sí ⭐  b) No  Respuesta: ____

**9.7 — Salida (V-4):** a) Anillos giratorios ⭐  b) Portal con vórtice  c) Puerta clásica  Respuesta: ____

**9.8 — Cantidad de partículas:** a) Alta, "juicy" ⭐  b) Media  c) Baja  Respuesta: ____

**9.9 — Pregunta abierta visual** (colores o juegos que te gusten): ______

---

### Apartado 10 — Pilar 6: Transiciones y pantallas

**10.1 — Tarjeta de inicio de nivel con cuenta 3-2-1:** a) Sí ⭐  b) Solo el nombre del nivel  c) No  Respuesta: ____

**10.2 — El reloj arranca en el "¡YA!" y no al entrar al nivel (+~2 s que no cuentan):** a) Sí ⭐  b) No, que corra desde el inicio  Respuesta: ____

**10.3 — Transición entre niveles:** a) Cortina diagonal ⭐  b) Iris circular  c) Fundido simple  Respuesta: ____

**10.4 — Muerte:** a) Desintegración en fragmentos ⭐  b) Parpadeo y fundido  c) Como hoy  Respuesta: ____

**10.5 — Cuenta del bono de tiempo en vivo al llegar a la salida:** a) Sí, segundo a segundo con tic ascendente ⭐  b) Directo, como hoy  Respuesta: ____

**10.6 — Fin de partida:** a) Más informativo (te faltaron N puntos, consejo según la causa) ⭐  b) Igual que ahora  Respuesta: ____

**10.7 — Reinicio con `R`:** a) Instantáneo con wipe corto ⭐  b) Sin transición  Respuesta: ____

**10.8 — Pregunta abierta sobre pantallas:** ______

---

### Apartado 11 — Plan de ejecución por fases

**11.1 — ¿Cambiarías el orden de las fases?**
a) Dejarlo como está ⭐
b) Audio y música antes que recolección/movimiento
c) Visual del mundo primero (lo que más se ve en una demo)
d) Otro: ______
Respuesta: ____

**11.2 — ¿Empezamos con los *quick wins* (§11.1) antes de J0?**
a) No, J0 primero porque corrige una fuga ⭐
b) Sí, quiero ver cambios rápido
Respuesta: ____

**11.3 — Entregas:** a) Fase por fase con tu revisión ⭐  b) Dos o tres fases seguidas  c) Todo el tier A y reviso al final  Respuesta: ____

**11.4 — ¿Hay alguna fase que quieras saltear?** ______

**11.5 — ¿Cuántas horas por semana hay disponibles para revisar y probar?** ______

**11.6 — Pregunta abierta de planificación:** ______

---

### Apartado 12 — Medición y playtest

**12.1 — ¿Quiénes pueden probar el juego?** (cantidad y perfil: compañeros, familia, gente que juega seguido): ______

**12.2 — ¿Instrumentamos métricas (recolecciones/min, muertes, combo)?**
a) Sí, solo en desarrollo ⭐
b) Sí, y mostrarlas al final de cada partida
c) No hace falta
Respuesta: ____

**12.3 — Formato de feedback de los testers:** a) Formulario corto de 3 preguntas ⭐  b) Charla libre  c) Observación sin preguntas  Respuesta: ____

**12.4 — ¿Grabamos partidas para ver dónde se traba la gente?** a) Sí  b) No ⭐ (más simple)  Respuesta: ____

**12.5 — Metas de la tabla (§12.2): ¿están bien?** a) Sí ⭐  b) Cambiar: ______

**12.6 — Pregunta abierta de playtest:** ______

---

### Apartado 13 — Riesgos

**13.1 — Tolerancia al "ruido" visual/sonoro:** a) Prefiero que sobre, después se baja ⭐  b) Prefiero que falte, después se sube  c) Ni uno ni otro: probar siempre con la opción de reducir  Respuesta: ____

**13.2 — Fotosensibilidad:** ¿limitamos los flashes desde el inicio?
a) Sí, máximo 3 por segundo y con opción de apagarlos ⭐
b) Sí, sin opción
c) No
Respuesta: ____

**13.3 — Si la música procedural no suena bien, ¿qué hacemos?**
a) Dejar solo ritmo y bajo simples ⭐
b) Proponerte un asset externo para que lo apruebes
c) Quitarla
Respuesta: ____

**13.4 — Si los cambios de física (J8) rompen niveles, ¿qué prevalece?**
a) Ajustar el cambio hasta que los niveles queden bien ⭐
b) Ajustar el validador y regenerar
c) Revertir
Respuesta: ____

**13.5 — Pregunta abierta de riesgos:** ______

---

### Apartado 14 — Decisiones del equipo (resumen)

Las nueve decisiones de §14 ya están desglosadas en las preguntas anteriores. Referencia cruzada:

| Decisión §14 | Preguntas |
|---|---|
| 1. Aprobación por tiers | 2.1, 11.3 |
| 2. Combo y cadena aérea | 1.2 |
| 3. Física del salto | 5.1, 5.2, 5.3 |
| 4. Graze con recompensa | 7.4 |
| 5. Oleadas y RUSH | 7.1, 7.2, 7.3 |
| 6. Dash refund | 5.5 |
| 7. Música | 8.1, 13.3 |
| 8. Timer del nivel | 10.2 |
| 9. Accesibilidad | 8.3, 13.2, 3.3 |

---

### Apartado 15 — Fuera de alcance

**15.1 — ¿Hay algo del "fuera de alcance" que quieras incluir?**
a) No, está bien ⭐
b) Soporte táctil/móvil
c) Skins del personaje
d) Estadísticas por nivel
e) Modo práctica
f) Otro: ______
Respuesta: ____

**15.2 — ¿Hay algo que te gustaría agregar y no está en ninguna parte del plan?** (mecánicas, pantallas, efectos, modos): ______

**15.3 — Cualquier otra idea, referencia o restricción que quieras sumar:** ______

---

## Anexo D — Decisiones del equipo (cuestionario respondido el 24/10/2026)

> Fuente: respuestas del Anexo C (87 de 102 preguntas contestadas; las 15 sin responder eran abiertas opcionales). Este anexo **manda** sobre el resto del documento cuando haya diferencias.

### D.1 Marco del proyecto

| Tema | Decisión |
|---|---|
| Referencia de sensación | Arcade retro con mucho color y sonido (*Super Meat Boy* / *Celeste* en juice) |
| Destino | Presentación/evaluación de la materia (demo de 3–5 min) |
| **Fecha límite** | **Antes del 07/11/2026** (14 días desde hoy) |
| Disponibilidad para revisar | 2 a 3 horas por día |
| Prioridad de pilares | **1.º Movimiento · 2.º Tensión/frenesí · 3.º Recolección** |
| Si hay que recortar | Se recortan primero las **mecánicas tier B/C** (oleadas, graze, dash refund) |
| Aprobación | **Todo tier A autorizado**; se informa al cierre de cada fase, con capturas/video + build en el puerto 5173 y **revisión fase por fase** |
| Git | Rama `main`, **un commit por fase**, siempre con autorización antes de commitear |
| Revisores | Solo vos por ahora (compañera prueba de vez en cuando) |
| Equipo/navegadores | PC de gama media; Chrome, Opera GX y Edge. Diseño con margen para 60 FPS |
| Qué más molesta hoy | Recoger no satisface, no hay tensión, el mundo y el personaje se ven planos, y **el parkour/exploración a veces no es fluido** (se siente "tosco", incómodo con proyectiles) |

### D.2 Decisiones por pilar

**Movimiento**
- **No se toca la física base** (5.1 «igual que hoy», 5.2 «no tocar la física»). Se descartan M-B1 (caída pesada), M-B2 y M-B3 (hang time). **No hace falta parametrizar el validador.**
- **Sí:** corner correction y ledge forgiveness (M-B4/B5), buffer de dash 120 ms, sombra, polvo **moderado**, todas las expresiones, aura por combo, estela de velocidad. Sin movimientos nuevos.
- **Dash refund (M-C1):** aprobado para **probar después de J8**.
- **Personaje con más carácter** (antena, bufanda, piernitas): **ítem nuevo M-A13**, dibujado con `Graphics`.

**Recolección**
- Escala musical por cadena, orbe volador al puntaje, hitstop escalado, `PointDirector` con ritmo (lejos del último, alternando alturas) y **más puntos activos con el combo (2→3→4)**, hitos de racha con banner. Se mantiene la ventana de 3 s y el tope x5.
- **No:** imán (C-B4). **Más adelante:** punto dorado.
- **Combo y cadena aérea (1.2):** al aterrizar se corta **solo la cadena aérea** y el combo se conserva (cambio B aprobado).

**Tensión**
- **Oleadas** telegrafiadas, 3 por nivel (solo en niveles con proyectiles: hoy **N2**), con respiros. **RUSH:** después del playtest. **Graze:** feedback **y** recompensa (+25 y refill de combo).
- Últimos 10 s: protocolo **fuerte**. Estado FRENESÍ: **pleno**.
- **Telegrafiado:** solo la **flecha en el borde** (sin línea de trayectoria). Proyectiles: **los actuales con un poco de glow** (se descarta la cola de cometa T-A3, queda solo el glow).
- **Nivel 1 se mantiene tranquilo** para aprender: se descarta T-A5 (tensión sin enemigos en N1).
- Dificultad: **equilibrada**.

**Audio**
- Música procedural **synthwave/electrónica oscura**, activa por defecto con volumen moderado, **distinta por nivel**, con una versión tranquila en el menú. SFX **fuertes y llamativos**.
- Un solo mute (`M`) como hoy. Si la música no suena bien: dejar solo ritmo y bajo simples.

**Visual**
- Paleta: **N1 cian, N2 violeta** (ámbar, magenta y multicolor quedan para N3–N5 si se agregan).
- Parallax **sutil**, bloom/aberración **moderado** (sujeto al spike), grilla que pulsa con el beat, partículas en cantidad **alta**.
- **Salida: portal con vórtice** (no anillos).
- Personaje: **más carácter** (M-A13).

**Transiciones**
- Todo como se propuso: tarjeta con 3-2-1, **reloj desde el «¡YA!»**, cortina diagonal, muerte con fragmentos, cuenta del bono en vivo, fin de partida informativo, reinicio instantáneo con `R`.

**Riesgos**
- Preferís que **sobre** efecto y después se baje; flashes limitados a 3 por segundo **con opción de apagarlos** (hay que incluir un OPCIONES mínimo: reducir flashes/movimiento).
- Si J8 rompiera niveles: **se te presentan opciones y decidís vos**.

**Fuera de alcance → dentro:** **skins del personaje** (backlog: se apoya en M-A13).

### D.3 Tensiones entre respuestas (a confirmar)

1. **«Parkour no fluido» vs «no tocar la física».** Marcaste que el movimiento a veces es tosco y también que no se cambie la física. Propuesta: atacarlo con lo que **no altera el alcance** (buffer de dash, corner/ledge, polvo y feedback, ventanas de coyote/buffer visibles) y re-evaluar tras el playtest 1. Si seguís sintiéndolo tosco, volvemos a plantear caída pesada con `?physics=v2`.
2. **Corner/ledge (físico, tier B) con «no tocar la física».** Lo tomo como excepción aprobada: **solo agrega alcance** (nunca lo quita), así que no rompe niveles. Se corre `npm run test-levels` igual.
3. **«Fuerte y llamativa» vs «volumen moderado».** Se interpreta como **SFX con mucho carácter y música a volumen moderado**.

### D.4 Cambios al alcance por estas decisiones

| Ítem | Cambio |
|---|---|
| M-B1, M-B2, M-B3 | **Descartados** (física base intacta) |
| T-A1 (línea de trayectoria), T-A3 (cola de cometa), T-A5 (tensión en N1) | **Descartados** |
| V-4 (salida) | Anillos → **vórtice** |
| M-A13 personaje con carácter | **Nuevo** (medio) |
| OPCIONES mínimo (flashes/movimiento) | Se mantiene en J7 |
| J8 | Se reduce a: corner/ledge, `PointDirector`, puntos simultáneos, combo/cadena aérea, graze, oleadas, dash refund (prueba) |
| Skins | Backlog, tras M-A13 |

### D.5 Calendario propuesto hasta el 07/11 (ajustable)

El cuello de botella es **tu tiempo de revisión** (2–3 h/día), no la implementación. Una fase por día con revisión es viable. Orden según tus prioridades (Movimiento → Tensión → Recolección):

| Día | Fase | Entregable a revisar |
|---|---|---|
| Sáb 24 – Dom 25 | **J0 + J1** base, corrección de fuga, `Fx` con pools, spike de filtros | Build estable + resultado del spike |
| Lun 26 | **J3** movimiento (sombra, polvo, derrape, expresiones, aura, buffer de dash, M-A13) | Capturas/video de movimiento |
| Mar 27 | **J4** audio v2 (bus, SFX, escala de cadena) | Prueba sonora |
| Mié 28 | **J5** música + `TensionDirector` + últimos 10 s + FRENESÍ | N2 con tensión completa |
| Jue 29 | **J2** recolección (orbe volador, onda, hitstop, ruta, hitos) | Recolección de punta a punta |
| Vie 30 | **J6a** parallax, temas N1/N2, plataformas con glow, portal-vórtice | Aspecto de ambos niveles |
| Sáb 31 – Dom 1 | **J6b + J7** proyectiles con glow, flecha de aviso, transiciones, OPCIONES | Flujo completo menú → victoria/derrota |
| Lun 2 | **Playtest 1** (vos + compañera) y ajustes | Planilla de métricas + formulario de 3 preguntas |
| Mar 3 – Mié 4 | **J8** reducido (corner/ledge, `PointDirector`, graze, oleadas, cadena aérea) | Comparación antes/después |
| Jue 5 | **J10** balance, prueba de estrés, documentación | Puertas de calidad en verde |
| Vie 6 | Ensayo de demo y margen de seguridad | Demo de 3–5 min |
| **Sáb 7** | **Entrega** | — |

**Regla de recorte (por 0.4):** si hay retraso, se cae primero J8 (oleadas, graze, dash refund), después la música por nivel, y se protege el núcleo: movimiento, tensión del N2 y recolección.

### D.6 Registro de avance

| Fase | Estado | Resultado |
|---|---|---|
| J0 | **Hecho** (`3fa7f68`) | Fuga de emisores y listeners duplicados corregidos (20 → 3 listeners tras 4 reinicios; 40 → 2 emisores tras 40 ráfagas); estelas unificadas; `feel.js`, `Metrics` y overlay F3 (solo dev) |
| J1 | **Hecho** (`2a850ff`) | `Fx` con pools y topes (ráfaga, chispa, polvo, anillo, línea, fantasma); `CameraFx` (sacudidas por nombre, destello, punch de zoom, bloom, con ganchos para reducir movimiento/destellos); estela del dash migrada al pool; **spike de filtros resuelto (ver abajo)** |
| J3 | **Hecho** (`508e724`) | `PlayerFx` (cosmética del jugador fuera de `Player.js`): sombra proyectada, cara con expresiones (feliz, alerta, dash, pánico), aura y brasas por combo, **personaje con más carácter** (antena con resorte, bufanda, piecitos que alternan), polvo al correr/saltar/aterrizar, derrape, chispas en pared, estelas y líneas de velocidad, squash según energía de la caída, **buffer de dash (120 ms)**. Física intacta; `Player.js` sigue cargando desde node. Fuera de J3: sonidos (J4), corner/ledge (J8) y ventanas de coyote/buffer visibles (M-B6) |
| J4 | **Hecho** (`36531ac`) | `AudioBus` (master → compresor → salida; reverb corta, ruido con filtros, panorama, ducking de música, límite de 24 voces con prioridades) y paleta nueva en `Audio.js`: **recolección por escala pentatónica** según la posición en la cadena (con armónicos que se abren con el combo), aterrizaje según la caída, derrape, whoosh del dash, impacto con ruido, combo que sube/se pierde, entrada al frenesí, tic-tac y latido (los usa J5). Eventos nuevos de `Game`: `combo-up`, `combo-lost`, `frenzy-start/end`, `player-skid`. **Medido, no escuchado:** los 21 eventos suenan sin errores, la escala sube 294→1397 Hz, el límite de voces se respeta y hay señal en la salida. Falta tu oído para afinar volúmenes |
| J5 | **Hecho** (`226a85f`) | `Music` (synthwave procedural en menor, 5 capas con scheduler de lookahead sobre el reloj de audio: base, ritmo, arpegio, melodía del frenesí y presión; tempo 108→138 según tensión; pista propia por nivel: N1 La menor, N2 Re menor; versión tranquila en el menú), `TensionDirector` (T 0..1 desde reloj, combo, proyectiles y meta; evento `tension`), protocolo de últimos 10 s (tic-tac, latido y borde rojo que late cada segundo desde 5 s, presión +6 % de tempo), **FRENESÍ** (melodía + borde dorado), muerte con filtro que cierra la música. **Medido:** las capas entran y salen con combo/tensión/reloj, el tempo sube, la música se apaga al perder y vuelve al reintentar, 60 FPS, sin listeners acumulados. **Falta tu oído** para el mix y si la música funciona; si no, plan de contingencia (13.3): solo ritmo y bajo |
| J2 | **Hecho** (`90013db`) | `CollectFx` (feedback de recolección fuera de `Game.js`): **hitstop escalado** por multiplicador (34/28/22/14 ms y en x5 un punch de zoom), onda y chispas que crecen con el combo, **orbe que vuela al puntaje** (a la hora para las gemas), **aparición guiada** del punto siguiente (trazo + anillo), **ruta luminosa** de la cadena que se apaga con la ventana del combo, `+N` más grande y del color del combo, hitos de racha (¡RACHA! a 5, ¡IMPARABLE! a 10, ¡FRENESÍ! al entrar a x5), **punto vivo** (brillo en cruz que gira y halo que late ×2,4 cuando el combo está por vencer), chip que parpadea (~1,5 Hz) y tic suave en el último 25 %, chispas grises al perder el combo. **Medido:** hitstops 34→28→22→14 según combo, orbes y líneas con tope, sin fugas tras reiniciar, 60 FPS. Sin cambios de reglas ni de puntaje |
| J6a | **Hecho** (`0c4accb`) | `assets/themes.js` (N1 cian, N2 violeta; datos puros, sin tocar `levels.js` ni el generador), `Backdrop` (cielo con degradado del tema, cordillera y ciudad lejanas generadas con Graphics, grilla que late con el beat y estrellas; **parallax sutil**: lejana ±16 px, media ±28 px, estrellas ±41 px), `PlatformGlow` (halo del color del tema sobre bordes de plataformas y paredes; en frenesí late con la música), `Level` recibe el tema, `Music.pulse` (latido de la negra) y **salida como portal con vórtice** (brazos en espiral que giran lento y apagados al estar cerrada, y verdes, rápidos y absorbiendo luz al abrirse; el cuerpo físico no cambió). **Medido:** parallax por posición, salida que completa el nivel, 60 FPS, objetos estables tras reiniciar. Pendiente de tu ojo: intensidad del fondo y del glow; el bloom (F4) sigue apagado por defecto |
| J6b + J7 | **Hecho** (`2bd91b2`) | **J6b:** proyectiles con glow aditivo (el aspecto de siempre con un resplandor, decisión 9.5 b), **flecha en el borde** de donde sale cada disparo con tic de aviso (sin línea de trayectoria, decisión 7.7 b) y chispa al salir de la pantalla. **J7:** `Settings` + menú **OPCIONES** (reducir destellos / reducir movimiento, guardado en el navegador y leído por `CameraFx`, Hud, Backdrop y Wipe); **intro de nivel** con tarjeta y cuenta 3-2-1 (el juego queda congelado y el reloj arranca en el ¡YA!; al reintentar solo el ¡YA!); **cortina diagonal** entre niveles y en el reinicio con R (fundido con "reducir movimiento"); llegada a la salida con cámara lenta, **cuenta del bono en vivo** con tic ascendente y medalla que cae con rebote; **muerte con fragmentos** y pantalla que se desatura; fin de partida con "te faltaron N de la meta" y un consejo según la causa. **Medido:** intro ~2,2 s con el juego congelado, bono 0→315 en ~1,3 s, cortina + nivel siguiente con el puntaje acumulado, sin errores y 60 FPS. Pendiente de tu ojo: duración de la intro y de la cuenta del bono |
| Playtest 1 | **Preparado** | Guía en `docs/PLAYTEST_1.md`; versión A (`a031b9e`, checkout aparte, puerto 5175) contra versión B (`?playtest=1`, puerto 5173); métricas con `Metrics` + F9/F10 (`systems/Playtest.js`); formulario de tres preguntas como página interactiva. **Adelanto:** J0–J7 se completaron antes de lo previsto en el calendario D.5, así que el playtest puede hacerse ya |

**Spike de filtros de Phaser 4 (4.0.0):** viable. La cámara admite filtros y `Actions.AddEffectBloom` arma el bloom (umbral + desenfoque en paralelo, mezcla aditiva). Medido en el navegador de desarrollo: **~60 FPS con y sin bloom**. Se deja **apagado por defecto** y se prueba con **F4** (solo desarrollo); la decisión de activarlo y sus valores (`FEEL.bloom`) van en J6. Pendiente: medirlo en una GPU integrada de gama media (3.1) antes de fijarlo. Phaser 4 trae además filtros útiles para fases siguientes: `Wipe` (cortina de transición, S-2), `Vignette`, `Glow` y `Displacement`.
