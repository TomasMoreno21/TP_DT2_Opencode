# Más variedad en el generador de niveles — diseño

Fecha: 2026-10-24 · Archivo principal: `src/systems/LevelGenerator.js`

## Objetivo
Que el nivel 2 (y la posición de los trampolines en general) varíe mucho más entre semillas, favoreciendo wall jump y trampolines, **sin** cambiar los criterios actuales: validación BFS, banda de dificultad, timers, espacio libre, determinismo por semilla.

## Problema actual
- N2 parte de un único base simétrico (dos escaleras + columna central + corona partida).
- Las escaleras tapan casi todo el piso: los únicos x válidos para trampolines del piso son las dos esquinas, y `_placeTrampoline` los deja ahí.
- El trampolín central va atado a la corona y no cambia.
- `LEVEL_TUNING[2]` limita la mutación (`maxIntensity` 0.75, `minNovelty` 5). El espejo casi no se nota por la simetría.

## Enfoque
Opción A (mutar el mismo base, más agresivo) ampliada con formas macro. Sin tocar `levels.js`, `LevelValidator`, timers ni bandas de dificultad (salvo ajuste medido solo para N2, ver Riesgos).

## Componentes

### 1. Trampolines variables — `_rearrangeTrampolines`
- Aplica a cualquier nivel con trampolines; en N2 es el foco.
- Cada trampolín puede ir: en el piso, sobre una plataforma (pasillo de rebote libre) o con ancho distinto (60–100 px).
- Cantidad variable; en N2 de 2 a 4, configurable en `LEVEL_TUNING[2].trampolines = { min, max }`.
- Reutiliza `_trampolineWorks`, `_blocksTrampoline`, `_entityNearTrampoline`, `_blockedCount`, `_trampolinesUsable` y la separación entre trampolines.
- El trampolín central sigue con su corona (`_carriedBy`/`_shiftColumn`); puede cambiar de ancho.

### 2. Formas macro del N2 — `_reshapeMacro`
Por intento se elige una forma y se reconstruye la estructura central. Se conservan paredes, piso, salida, spots y pinchos (los reubican `_repairSpots`, `_relocateGoal`, etc.).

| Forma | Descripción | Favorece |
|---|---|---|
| Escalera doble | La actual | Salto y trampolín central |
| Escalera + torre | Una escalera larga de un lado, torre alta del otro | Wall jump |
| Pozo | Dos columnas internas, canal ~120–160 px, trampolín al pie | Wall jump zigzag + rebote |
| Torres gemelas | Dos columnas altas separadas con plataformas cortas | Wall jump + rebotes cruzados |
| Terrazas con trampolines | Pisos escalonados con huecos; trampolines suben de nivel | Trampolines sobre plataformas |

- Parámetros aleatorios por forma (posiciones, anchos, alturas, cantidad de piezas); luego puede aplicarse el espejo.
- Filtro barato nuevo (`_channelsOk`): el ancho de pozos/canales debe estar en un rango jugable (ni angosto para entrar, ni ancho para saltar pared a pared). Rango exacto a calibrar con el validador.
- Cada candidato igual debe pasar todos los filtros existentes y el BFS (que ya simula wall jump —solo los que se alejan de la pared— y trampolines).

### 3. Ajuste de N2 en `LEVEL_TUNING`
- `maxIntensity` ~0.95, `minNovelty` ~8, `trampolines: { min: 2, max: 4 }`, lista de formas habilitadas.

### 4. Medición — `tools/test-levels.mjs`
Reporte de variedad para N2: firmas distintas, novedad promedio entre semillas, histograma de x de trampolines en franjas de 100 px, conteo de formas elegidas.

## Etapas
1. Línea base: correr `test-levels.mjs` actual + reporte de variedad (antes).
2. Trampolines variables (sección 1) y medir.
3. Formas macro, **una por vez** (sección 2), midiendo cada una.
4. Ajuste de tuning y cierre.

## Criterios de aceptación (100 semillas)
- Variedad de N2 sube claramente vs. línea base (firmas distintas, spread de trampolines, formas distintas usadas).
- Validez 100 %, determinismo intacto, sin pérdida de tasa de mutación.
- Dificultad dentro de la banda; timers dentro de `TIMER_BANDS`.
- Tiempo por nivel bajo el timeout del worker (8 s, `CampaignBuilder`).
- `npm run build-nolog` OK y recorrido visual con `npm run dev` sin errores de consola.

## Riesgos
- Formas nuevas pueden salir más fáciles/difíciles que el base (la banda se mide contra el base). Se mide primero; si hace falta se ajusta banda o calendario de intentos solo para N2, con datos.
- Más candidatos rechazados → más intentos/tiempo. Se vigila el tiempo por nivel.
- `levelBaselines.js` no cambia (el base no cambia).

## Git
Sin commit ni push sin autorización explícita. Repo en rama `main` (AGENTS.md menciona `master`); `TP_DT2_Opencode/` está sin trackear.
