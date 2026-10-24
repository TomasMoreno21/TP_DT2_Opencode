# Variedad del generador de niveles — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que el nivel 2 y los trampolines varíen mucho más entre semillas (formas favorables a wall jump y trampolines) sin tocar los criterios de validación.

**Architecture:** `LevelGenerator` gana dos mutaciones: `_rearrangeTrampolines` (cantidad/ancho/ubicación, incluso sobre plataformas) y `_reshapeMacro` (reconstruye la estructura central con una "forma" elegida). Las formas viven en un archivo nuevo `src/systems/MacroShapes.js` (builders puros, sin dependencia del generador) para no crecer más `LevelGenerator.js` (2396 líneas). Todo candidato sigue pasando los filtros baratos actuales y el BFS.

**Tech Stack:** JavaScript (ES modules), Phaser 4 (no tocado), scripts Node en `tools/` (no hay framework de tests: los "tests" son scripts `node tools/*.mjs` que salen con código 1 si fallan).

**Spec:** `docs/superpowers/specs/2026-10-24-variedad-generador-niveles-design.md`

## Global Constraints

- Solo JavaScript; **no TypeScript**, sin dependencias nuevas.
- No tocar `src/assets/levels.js`, `src/assets/levelBaselines.js`, `LevelValidator.js`, `TIMER_BANDS`, `TIMER_RULES` (salvo ajuste de banda **solo N2** y **con datos**, Task 7).
- Mundo fijo 1024×768 (`WORLD`); paredes en x=40 y x=984; `FLOOR_TOP = WORLD.floorTop`.
- Determinismo: todo azar sale del `rng` del generador (`rng.next/range/int/chance/pick`); mismas semillas → mismo nivel.
- Orden de iteración estable (nada de `sort(() => rng.next() - 0.5)` sobre estructuras nuevas sin copiar antes).
- Los candidatos deben cumplir los filtros existentes: `dense` (≤ `baseCount - MIN_REMOVED` plataformas = **≤ 13 en N2**), `crowded` (`CLEAR_VERTICAL` 100, `CLEAR_HORIZONTAL` 70 para plataformas nuevas), `structure`, `uneven`, `placement`, `trampolines`.
- Trampolín: ancho entre 60 y 100; rise útil `TRAMPOLINE_MIN_RISE` 70 … `TRAMPOLINE_MAX_RISE` 460.
- Git: **no commit ni push sin autorización explícita del usuario** (AGENTS.md §8). `TP_DT2_Opencode/` está sin trackear en `main`: antes del primer commit, preguntar qué incluir (ojo `graphify-out/`, `node_modules/`). Los pasos "Commit" valen solo tras el OK.
- Comentarios del código en español, estilo del archivo (comentarios largos explicando el porqué).
- Cierre de fase: actualizar `docs/PLAN.md`.

## Review Focus

- Semilla con N2 que ninguna forma logra validar → debe caer al nivel base sin romper (campaña siempre ok).
- Trampolín agregado sobre plataforma con otra plataforma encima → debe rechazarse (`trampolines`), no quedar tapado.
- Cantidad de trampolines fuera de `{min,max}` o distinta del base en niveles sin `trampolines` en tuning → N1/N3/N4/N5 deben quedar con su cantidad original.
- Pozo/canal demasiado angosto o ancho para wall jump → `_channelsOk` lo descarta.
- Espejo + forma: la forma espejada mantiene spawn/salida válidos (spawn x=360 puede quedar sobre una columna).
- Tiempo de generación de N2 sube por más rechazos → debe seguir < 8 s (timeout del worker).

---

## File Structure

- Create `src/systems/MacroShapes.js` — builders puros de formas del N2 y datos de canales.
- Create `tools/test-shapes.mjs` — chequea cada forma (layout, `crowded`, canales, ≤13 plataformas) con muchas semillas.
- Create `tools/test-variety.mjs` — mide variedad de N2/trampolines sobre N semillas; compara con `tools/variety-baseline.json`.
- Modify `src/systems/LevelGenerator.js` — tuning, `_rearrangeTrampolines`, `_reshapeMacro`, `_channelsOk`, hooks en `_mutate` y `_cheapReject`.
- Modify `tools/test-levels.mjs` — invariante de cantidad de trampolines con rango del tuning.
- Modify `docs/PLAN.md` — cierre.

---

### Task 1: Arnés de variedad y línea base

**Files:**
- Create: `tools/test-variety.mjs`
- Create: `tools/variety-baseline.json` (generado)

**Interfaces:**
- Produces: `node tools/test-variety.mjs [semillas=100] [primera=1] [--save-baseline]` imprime y devuelve métricas de N2:
  `{ distinctSignatures, meanNovelty, trampolineBins: Record<number,number>, trampolineBinCount, distinctTrampolineSets, shapes: Record<string,number> }`.
  Sale con código 1 si algún umbral de `tools/variety-baseline.json` (`thresholds`) no se cumple.

- [ ] **Step 1:** Implementar el script: por semilla generar solo N2 con `new LevelGenerator().generateLevelFor(2, seed, ALL_LEVELS[1])`; `signature` = `JSON.stringify([platforms, trampolines])`; `meanNovelty` = media de `generator._novelty(base, cfg)`; `trampolineBins` = histograma de `Math.floor(t.x / 100)`; `distinctTrampolineSets` = conjunto de `trampolines` serializados; `shapes` = conteo de entradas de `entry.mutations` que empiezan con `forma:`.
- [ ] **Step 2:** Correr `node tools/test-variety.mjs 100 1 --save-baseline`. Esperado: escribe `tools/variety-baseline.json` con `metrics` (hoy) y `thresholds` iniciales = `{ distinctSignatures: metrics.distinctSignatures * 1.5, trampolineBinCount: metrics.trampolineBinCount + 3, distinctTrampolineSets: metrics.distinctTrampolineSets * 2 }` (redondeados hacia arriba). Anotar los números en el resumen.
- [ ] **Step 3:** Correr `node tools/test-variety.mjs 100 1` sin flag. Esperado: **falla** (código 1) porque el código actual no supera los umbrales. Ese es el test rojo que cierran las tasks siguientes.
- [ ] **Step 4:** Correr `node tools/test-levels.mjs 30 1`. Esperado: `OK: sin fallas.` (línea base de regresión). Commit (tras OK): `tools/test-variety.mjs tools/variety-baseline.json`.

---

### Task 2: Tuning por nivel y rango de trampolines en el invariante

**Files:**
- Modify: `src/systems/LevelGenerator.js` (`LEVEL_TUNING`, `generateLevelFor` donde se leen los tuning)
- Modify: `tools/test-levels.mjs:65-67`

**Interfaces:**
- Produces: `LEVEL_TUNING[id].trampolines?: { min: number, max: number }` y `LEVEL_TUNING[id].shapes?: string[]`; en el generador `this.trampolineRange = tuning.trampolines ?? null` y `this.shapes = tuning.shapes ?? []`.
- Consumes: `LEVEL_TUNING` actual.

- [ ] **Step 1 (test rojo):** En `tools/test-levels.mjs`, cambiar el chequeo de cantidad para `trampolines`: si `LEVEL_TUNING[base.id]?.trampolines` existe, exigir `min ≤ cfg.trampolines.length ≤ max`; si no, igualdad con el base como hoy. Importar `LEVEL_TUNING`. Correr `node tools/test-levels.mjs 5 1` → sigue OK (aún sin cambios de cantidad).
- [ ] **Step 2:** En `LEVEL_TUNING[2]` agregar `trampolines: { min: 2, max: 4 }` y `shapes: []` (se llena en Task 7); leer ambos en `generateLevelFor` junto a los demás campos del tuning.
- [ ] **Step 3:** `node tools/test-levels.mjs 10 1` → `OK`. Commit (tras OK).

---

### Task 3: `_rearrangeTrampolines`

**Files:**
- Modify: `src/systems/LevelGenerator.js` (nuevo método junto a `_jitterTrampolines`; hook en `_mutate` paso 4)

**Interfaces:**
- Produces: `_rearrangeTrampolines(rng, cfg, intensity): boolean` — con `this.trampolineRange` definido ajusta la cantidad (quita o agrega hasta caer en `[min,max]`, eligiendo el objetivo con `rng.int`), y para cada trampolín propone: ancho `rng.int(60,100)` (con paso de 10), y ubicación en el piso (`_placeTrampoline`) o sobre una plataforma. Sin `trampolineRange` no hace nada y devuelve `false`.
- Produces: `_placeTrampolineOnPlatform(rng, cfg, t): boolean` — elige una plataforma de juego libre (`_surfaces(cfg)`), pone `t.x` dentro de su ancho (margen 30) y `t.y = top(p) - TRAMPOLINE_HALF_HEIGHT - ...` coherente con `_isSupportOf` (`|top(p) - (t.y + TRAMPOLINE_HALF_HEIGHT)| ≤ 8`); acepta solo si `_trampolineWorks`, `!_entityNearTrampoline(cfg, t, true)` y `_blockedCount` no empeora; si no, deshace.
- Consumes: `_trampolineWorks(t, playPlatforms)`, `_entityNearTrampoline`, `_blockedCount`, `_surfaces`, `_clearAroundTrampolines`, `_isPortalBound`.

- [ ] **Step 1 (test rojo):** agregar a `tools/test-variety.mjs` el aserto `distinctTrampolineSets ≥ thresholds.distinctTrampolineSets` y `trampolineBinCount ≥ thresholds.trampolineBinCount` (ya existen del Task 1). Correr: falla.
- [ ] **Step 2:** Implementar `_placeTrampolineOnPlatform` y `_rearrangeTrampolines`. Reglas: agregar un trampolín clona uno existente (mismo `w` ±) y lo coloca; si no hay lugar, no se agrega (el filtro `trampolines` descarta lo roto). Quitar solo si quedan ≥ `min`. Nunca tocar trampolines `_isPortalBound`.
- [ ] **Step 3:** Hook en `_mutate`: `apply('trampolines-forma', 0.9, () => this._rearrangeTrampolines(rng, cfg, intensity));` justo después de `apply('trampolines', ...)`; luego `this._fixTrampolines(rng, cfg)` ya corre en el flujo existente (confirmar el orden: debe quedar un `_fixTrampolines` después de este paso).
- [ ] **Step 4:** `node tools/test-levels.mjs 30 1` → `OK: sin fallas.` (incluye re-validación, determinismo, rangos de cantidad). `node tools/test-variety.mjs 100 1` → los asertos de trampolines pasan; reportar bins y sets. Mirar `rechazos: ... trampolines=` de N2; si la tasa de `mutado` de N2 cae a < 60 %, aflojar probabilidades antes de seguir.
- [ ] **Step 5:** Commit (tras OK).

---

### Task 4: Infraestructura de formas + `escalera-torre`

**Files:**
- Create: `src/systems/MacroShapes.js`
- Create: `tools/test-shapes.mjs`
- Modify: `src/systems/LevelGenerator.js` (`_reshapeMacro`, `_channelsOk`, hooks)

**Interfaces:**
- Produces (`MacroShapes.js`):
  `export const MACRO_SHAPES: Record<string, (rng) => ShapeResult>`
  `type ShapeResult = { platforms: Platform[]; trampolines: {x:number,y:number,w:number}[]; channels: {x:number; width:number; y1:number; y2:number}[] }`
  `export const CHANNEL_MIN = 110; export const CHANNEL_MAX = 170;` (valores iniciales; se calibran en Task 5).
  `export function buildShape(name: string, rng): ShapeResult`.
  `Platform` = `{ x, y, w, h, color }` con `color: 0x3a3a5c` (plataformas) o `0x4a4270` (columnas altas), igual que `levels.js`.
- Produces (generador): `_reshapeMacro(rng, cfg, levelId): boolean` — si `this.shapes` está vacío devuelve `false`; elige `name = rng.pick(this.shapes)`, quita de `cfg.platforms` las plataformas de juego flotantes (`_isPlayPlatform(p)` y `p.y < FLOOR_TOP - 20`, sin paredes ni piso) y las reemplaza por `shape.platforms`; reemplaza los trampolines del nivel que no son `_isPortalBound` por `shape.trampolines`; reubica spots (`_placeSpot` para cada índice), gemas (`_relocateGems`), salida (`_relocateGoal`); guarda `cfg._channels = shape.channels` (se borra al final de `_mutate`); registra `forma:<name>` en el log de mutaciones.
- Produces: `_channelsOk(cfg): boolean` — para cada canal verifica ancho en `[CHANNEL_MIN, CHANNEL_MAX]` midiendo el hueco horizontal real entre las dos plataformas/columnas que lo flanquean en `[y1,y2]`; sin `cfg._channels` devuelve `true`. Se invoca desde `_cheapReject` como motivo `'channels'` (agregar la clave a `stats`).
- Forma `escalera-torre`: una escalera de 3–4 escalones de un lado (separación vertical 85–95 px, para respetar la subida ≤ 102 px) y del otro lado una torre: columna `h ≥ 300, w ≤ 80` más 2–3 plataformas cortas (100–140 px) apoyadas contra ella a distinta altura; un trampolín en el piso junto a la base de la escalera; total ≤ 13 plataformas incluyendo piso y paredes.

- [ ] **Step 1 (test rojo):** `tools/test-shapes.mjs [semillas=200]`: para cada nombre en `MACRO_SHAPES` y cada semilla, arma `cfg` = N2 base con las plataformas flotantes reemplazadas por la forma, y exige: `validator.checkLayout(cfg).length === 0`; ≤ 13 plataformas totales; `generator._crowdedPlatforms(cfg, new Set()) === 0` ignorando columnas; todas las plataformas dentro de x ∈ [60, 964]; cada canal declarado mide entre `CHANNEL_MIN` y `CHANNEL_MAX`; determinismo (misma semilla → mismo resultado). Correr: falla (módulo inexistente).
- [ ] **Step 2:** Implementar `MacroShapes.js` con `escalera-torre` (parámetros aleatorios con `rng.range/int`; variante espejada la aporta el espejo del generador).
- [ ] **Step 3:** `node tools/test-shapes.mjs` → pasa. Si algún rango de parámetros produce fallas, acotar el rango en el builder (no relajar el test).
- [ ] **Step 4:** Implementar `_reshapeMacro` y `_channelsOk`; hook en `_mutate` justo después del espejo y antes de `quitar/agregar`: `if (this.shapes.length) apply('forma', 1.0, () => this._reshapeMacro(rng, cfg, id));` (para N2 el resto de mutaciones sigue encima de la forma, con la intensidad del tuning). Agregar `channels: 0` a `stats` y el filtro en `_cheapReject`. Poner `LEVEL_TUNING[2].shapes = ['escalera-doble', 'escalera-torre']`, donde `escalera-doble` es "no reconstruir" (se deja el base; `_reshapeMacro` devuelve `false` para ese nombre).
- [ ] **Step 5:** `node tools/test-levels.mjs 30 1` → OK. `node tools/test-variety.mjs 100 1` → reporta `shapes` con ambas formas usadas (si `escalera-torre` casi no aparece, mirar `rechazos` de N2 y arreglar el builder).
- [ ] **Step 6:** Commit (tras OK).

---

### Task 5: Forma `pozo` (wall jump) y calibración de canales

**Files:**
- Modify: `src/systems/MacroShapes.js`, `tools/test-shapes.mjs`, `src/systems/LevelGenerator.js` (`LEVEL_TUNING[2].shapes`)

**Interfaces:**
- Produces: `MACRO_SHAPES['pozo']`: dos columnas internas (`h ≥ 300`, `w` 24–40) separadas por un canal de ancho `rng.range(CHANNEL_MIN, CHANNEL_MAX)`, centradas en x ∈ [330, 690]; un trampolín en el piso al pie del canal (ancho 60–80); plataformas de salida/remate en lo alto a cada lado (≥ `CLEAR_VERTICAL` del techo del mundo) y 2–3 escalones laterales para llegar a la boca del pozo; `channels = [{ x: centro, width, y1: ytope, y2: FLOOR_TOP }]`.
- Consumes: `buildShape`, `CHANNEL_MIN/MAX`.

- [ ] **Step 1 (test rojo):** agregar `'pozo'` a la lista esperada en `test-shapes.mjs` (exigir `Object.keys(MACRO_SHAPES)` ⊇ lista) y un aserto: en `pozo` existe al menos un trampolín cuyo x está dentro del canal ±`w/2`. Falla.
- [ ] **Step 2:** Implementar `pozo`; correr `node tools/test-shapes.mjs` → pasa.
- [ ] **Step 3 (calibración, con datos):** agregar `'pozo'` a `LEVEL_TUNING[2].shapes`. Para anchos de canal 90…200 en pasos de 10 forzando la forma (script temporal en el scratchpad que llama `validator.validate(cfg)` sobre el N2 con `pozo` de ancho fijo), registrar cuáles validan. Fijar `CHANNEL_MIN/MAX` en el rango contiguo que valida con margen de 10 px por lado. Anotar el rango hallado en el comentario de la constante.
- [ ] **Step 4:** `node tools/test-levels.mjs 30 1` → OK; `node tools/test-variety.mjs 100 1` → `pozo` aparece en `shapes`. Si `pozo` nunca sobrevive (rechazos `unreachable`/`difficulty`), ajustar el builder (más escalones de acceso) antes de seguir.
- [ ] **Step 5:** Commit (tras OK).

---

### Task 6: Formas `torres-gemelas` y `terrazas`

**Files:**
- Modify: `src/systems/MacroShapes.js`, `tools/test-shapes.mjs`, `src/systems/LevelGenerator.js` (`LEVEL_TUNING[2].shapes`)

**Interfaces:**
- Produces: `MACRO_SHAPES['torres-gemelas']`: dos columnas altas (`h ≥ 300`, `w ≤ 80`) con canal entre ellas en `[CHANNEL_MIN, CHANNEL_MAX]` **o** separadas > 250 px (en ese caso `channels = []`), 2 plataformas cortas (100–140) a distinta altura en cada columna, trampolín en el piso entre ellas o a un costado. `MACRO_SHAPES['terrazas']`: 3 pisos escalonados de 160–260 px de ancho con huecos de 90–140 px, trampolines (1 por hueco, ancho 60–100) que suben al piso siguiente, ≥ `TRAMPOLINE_MIN_RISE` de subida; `channels = []`.

- [ ] **Step 1 (test rojo):** extender la lista esperada de formas en `test-shapes.mjs` con ambas; aserto de `terrazas`: cada trampolín tiene una plataforma ≥ 70 y ≤ 460 px más alta a ≤ 260 px en x (misma regla que `_trampolinesUsable`). Falla.
- [ ] **Step 2:** Implementar ambas; `node tools/test-shapes.mjs` → pasa.
- [ ] **Step 3:** Sumarlas a `LEVEL_TUNING[2].shapes` (lista final: `escalera-doble, escalera-torre, pozo, torres-gemelas, terrazas`). `node tools/test-levels.mjs 40 1` → OK; `node tools/test-variety.mjs 100 1` → las 5 formas con uso > 0. Forma con uso 0 → revisar su builder, no quitarla de la lista sin avisar.
- [ ] **Step 4:** Commit (tras OK).

---

### Task 7: Calibración de dificultad y tuning final del N2

**Files:**
- Modify: `src/systems/LevelGenerator.js` (`LEVEL_TUNING[2]`)
- Modify: `tools/variety-baseline.json` (umbrales finales)

**Interfaces:**
- Consumes: resultados de `tools/test-levels.mjs` (`rechazos`, `mutado %`, `intentos/medio`, tiempos).

- [ ] **Step 1:** Subir `LEVEL_TUNING[2]` a `maxIntensity: 0.95`, `minNovelty: 8`. Correr `node tools/test-levels.mjs 100 1`. Esperado: `OK: sin fallas.`; mirar para N2: `mutado`, `intentos/medio`, `rechazos`, y el tiempo por campaña.
- [ ] **Step 2:** Si `mutado` < 90 % o aparecen caídas al base frecuentes (`attempts` ≈ 60): mirar el rechazo dominante. Si es `difficulty`, ensanchar **solo** `LEVEL_TUNING[2].difficulty` (hoy `{0.7,1.25}`) lo mínimo necesario y anotar en el comentario el dato que lo justifica. No tocar la banda global.
- [ ] **Step 3:** Medir el tiempo de generación de N2: script temporal que mida `generateLevelFor(2, seed, ...)` en 100 semillas; máximo debe ser < 4 s en el hilo principal (margen sobre los 8 s del worker). Si no, reducir `CANDIDATE_POOL` solo con evidencia o bajar probabilidades de las mutaciones nuevas.
- [ ] **Step 4:** Reescribir `thresholds` de `tools/variety-baseline.json` a los valores finales logrados menos 10 % (para que el test proteja contra regresión). `node tools/test-variety.mjs 100 1` → pasa; `node tools/test-levels.mjs 100 1` → OK; `node tools/test-levels.mjs 100 1001` (otro rango) → OK.
- [ ] **Step 5:** Commit (tras OK).

---

### Task 8: Verificación final y cierre de fase

**Files:**
- Modify: `docs/PLAN.md`

- [ ] **Step 1:** `npm run build-nolog` → build OK, sin errores.
- [ ] **Step 2:** `npm run dev` y recorrer varias semillas de N2 en el navegador (preview): ver cada forma, trampolines sobre plataformas, wall jump en el pozo; consola sin errores ni warnings. Informar qué formas se vieron realmente.
- [ ] **Step 3:** Agregar a `docs/PLAN.md` una fase (siguiente número libre) con: qué se hizo, métricas antes/después de `tools/test-variety.mjs`, y la lección sobre filtros vs. formas nuevas. Pedir autorización para commit + push; informar archivos afectados y pendientes reales.

---

## Resultado y desvíos (2026-10-24)

Implementado: las 8 tareas, salvo el recorrido visual en el juego real (se miró un render de 8 semillas de N2, no el juego). Desvíos decididos durante la ejecución:

- **Las 5 formas están habilitadas** (`escalera-doble`, `terrazas`, `pozo`, `escalera-torre`, `torres-gemelas`). En una primera etapa solo andaban las dos primeras: las columnas apoyadas en el piso partían el escenario y el recorrido salía 1,5–2,3× más difícil que el del base (y el BFS tardaba hasta 41 s por nivel). Se resolvió con **pilares** que no llegan al piso (puerta de 130 px) y, en `pozo`, un pilar pegado a la pared del mapa. Esfuerzo resultante 0,85–1,05 del base, ~1,2 s por validación.
- Tarea 5 (calibración de canales): el pozo valida con canales de 80 a 220 px; `CHANNEL_MIN/MAX` quedan en 110/170 por margen de juego (no por límite del validador).
- `LEVEL_TUNING[2].candidatePool = 2` (nuevo): las formas con wall jump validan en ~1,5 s y casi todos los candidatos pasan; con 5 por ronda el nivel tardaba ~7,6 s (cerca del timeout del worker).
- La forma se sortea una vez por semilla (`shapeForSeed`) en vez de por candidato (si no, `terrazas` ganaba casi siempre por pasar más filtros).
- Con una forma activa se desactivan `quitar/agregar/desplazar/alturas/anchos/spots/trampolines`: rompían el reparto que la forma trae.
- `tools/variety-baseline.json`: el umbral `distinctSignatures` del plan era inalcanzable (ya daba 100/100 en el base); se reemplazó por `coarseSignatures`, `topBinShare`, `distinctTrampolineSets`, `trampolineBinCount` y `shapesUsed`.
- Se tocaron dos reglas compartidas: `structureStats` (una columna apoyada ya no cuenta como superposición) y `_spotIsFree` (nada dentro ni pegado a una columna). Ninguna cambia los niveles sin columnas.
- No se hizo worktree ni commits (la carpeta está sin trackear y AGENTS.md pide autorización explícita).

Verificado: `node tools/test-levels.mjs` con 12 semillas (primera etapa) y 6+6+6 más (etapa final, semillas 101, 201 y 301) → OK sin fallas; `node tools/test-shapes.mjs 500` → OK; `node tools/test-variety.mjs 60 1` → OK (ver `after` en `tools/variety-baseline.json`); `npm run build-nolog` → OK.
