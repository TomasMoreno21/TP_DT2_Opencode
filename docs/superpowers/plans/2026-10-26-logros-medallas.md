# Logros y medallas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar 8 logros de desempeño a las insignias existentes, con un botón LOGROS en el menú.

**Architecture:** Módulo puro `systems/Achievements.js` (reglas + `AchievementStore` en `localStorage`, sin Phaser, estilo `Rank.js`) probado con node. `Game.js` solo cablea los disparos y `MainMenu.js` dibuja el popup. Reutiliza el banner de `unlockBadge`.

**Tech Stack:** JavaScript (ES modules), Phaser 4, Vite. Sin dependencias nuevas, sin TypeScript, sin assets.

**Spec:** `docs/superpowers/specs/2026-10-26-logros-medallas-design.md`

## Global Constraints

- Solo JavaScript; Phaser 4; sin dependencias ni assets externos (popup con `Graphics`/texto).
- Clave de almacenamiento: `fastMoveAchievements` → `{ unlocked: string[], points: number }`; todo acceso a `localStorage` en try/catch.
- Catálogo exacto (ids): `noDeaths`, `maxCombo`, `champion`, `gold`, `goldAll`, `airborne`, `speedster`, `collector`.
- Umbrales: x5 de combo; cadena aérea de 5; ≥ 50 % del timer sobrante; `collector` = 1000 puntos acumulados.
- Con `registry.get('infiniteLife')` o en práctica (`this.practice`) **no** se otorgan logros ni se suman puntos.
- Textos es/en en `Texts.js`. Las 5 insignias de aprendizaje y el ranking no cambian.
- Git: master; **no commitear ni pushear sin autorización explícita del usuario** (AGENTS.md §8). Los pasos «Commit» son solo la propuesta; se piden al usuario.

## Review Focus

1. `localStorage` ausente, con JSON dañado o con tipos erróneos: no debe romper el juego ni el popup.
2. `addPoints` con 0, negativo o `NaN`: no suma ni desbloquea.
3. Un logro ya obtenido no vuelve a mostrar el banner (reintentar, recargar).
4. `collector` cruza 1000 a mitad de acumulación: desbloquea una sola vez y el progreso se muestra topado en 1000/1000.
5. Cambiar idioma con el popup LOGROS: textos en el idioma elegido; en vida infinita el menú muestra el estado real sin otorgar nada.

---

## File Structure

- Create `src/systems/Achievements.js` — catálogo, reglas puras y `AchievementStore`.
- Create `tools/test-achievements.mjs` — autoprueba (patrón de `tools/test-rank.mjs`).
- Modify `package.json` — script `test-achievements`.
- Modify `src/scenes/Game.js` — wiring de disparos y `unlockAchievement`.
- Modify `src/systems/Texts.js` — textos es/en.
- Modify `src/scenes/MainMenu.js` — botón y popup LOGROS; insignia `gem` en la lista de aprendizaje.
- Modify `src/systems/Badges.js` — agregar `'gem'` a `BADGES`.
- Modify `docs/PLAN.md` — registrar la fase al cerrar.

---

### Task 1: Reglas y almacén de logros

**Files:**
- Create: `src/systems/Achievements.js`
- Create/Test: `tools/test-achievements.mjs`
- Modify: `package.json` (script `"test-achievements": "node tools/test-achievements.mjs"`)

**Interfaces:**
- Produces (todo exportado de `Achievements.js`):
  - `ACHIEVEMENTS: { id: string, target?: number }[]` — los 8 ids del catálogo en ese orden; `collector` lleva `target: 1000`.
  - `AIR_STREAK_TARGET = 5`, `SPEEDSTER_RATIO = 0.5`, `COLLECTOR_TARGET = 1000`.
  - `evaluateLevel({ deaths: number, maxMult: number, rank: 'bronze'|'silver'|'gold'|null, remainingRatio: number }): string[]` — ids cumplidos al llegar a la salida (`noDeaths`, `maxCombo`, `gold`, `speedster`).
  - `goldInAllLevels(ranks: Record<number,string>, levelCount: number): boolean` — `ranks` es lo que devuelve `RankStore.all()` (claves 1..levelCount).
  - `AchievementStore` (métodos estáticos): `has(id): boolean`, `unlock(id): boolean` (true solo la primera vez), `points(): number`, `addPoints(n: number): boolean` (true si esa suma desbloqueó `collector`), `progress(id): { value: number, target: number } | null` (solo `collector` tiene progreso; `value` topado en `target`).

- [ ] **Step 1: Escribir `tools/test-achievements.mjs`** con un `localStorage` falso en `globalThis` (Map) y estas aserciones (`node:assert/strict`):
  - `evaluateLevel({ deaths: 0, maxMult: 5, rank: 'gold', remainingRatio: 0.5 })` devuelve exactamente `['noDeaths','maxCombo','gold','speedster']`.
  - `deaths: 1, maxMult: 4, rank: 'silver', remainingRatio: 0.49` devuelve `[]`.
  - `remainingRatio: 0.5` justo en el borde cuenta; `0.499` no.
  - `goldInAllLevels({1:'gold',2:'gold',3:'gold',4:'gold',5:'gold'}, 5) === true`; con un nivel `silver` o faltante, `false`.
  - `AchievementStore.unlock('gold') === true` y luego `=== false`; `has('gold') === true`.
  - `addPoints(999)` → `false`; `addPoints(1)` → `true` (desbloquea `collector`); `addPoints(50)` → `false` (ya desbloqueado); `progress('collector')` → `{ value: 1000, target: 1000 }`.
  - `addPoints(0)`, `addPoints(-5)`, `addPoints(NaN)` no cambian `points()` ni desbloquean.
  - Con `localStorage` que lanza al leer (`getItem` throws) y con JSON dañado (`'{{'`): `has('x') === false`, `points() === 0` y `unlock` no lanza.
  - Termina con `console.log('test-achievements: OK')`.

- [ ] **Step 2: Correr y ver que falla**

Run: `node tools/test-achievements.mjs`
Expected: FAIL (`Cannot find module .../Achievements.js`).

- [ ] **Step 3: Implementar `src/systems/Achievements.js`** con las firmas de arriba. Estado interno: `{ unlocked, points }` leído/escrito en `fastMoveAchievements`; normalizar al leer (si no es objeto, `unlocked` no es array o `points` no es finito → valores por defecto). `addPoints` ignora valores no finitos o ≤ 0 y llama a `unlock('collector')` al llegar a `COLLECTOR_TARGET`. Comentario de cabecera que diga «módulo puro, probar con node» como `Rank.js`.

- [ ] **Step 4: Agregar el script `test-achievements` a `package.json`.**

- [ ] **Step 5: Correr y ver que pasa**

Run: `node tools/test-achievements.mjs` (y `node tools/test-rank.mjs` para confirmar que no se rompió nada)
Expected: `test-achievements: OK` y `test-rank: OK`.

- [ ] **Step 6: Commit (pedir autorización)** — `git add src/systems/Achievements.js tools/test-achievements.mjs package.json` · «Logros: reglas puras y almacén».

---

### Task 2: Cableado en `Game.js`

**Files:**
- Modify: `src/scenes/Game.js` (`unlockBadge` ~L499, overlaps de punto/gema ~L322–382, `onGoalReached` ~L721, victoria final ~L808)

**Interfaces:**
- Consumes (Task 1): `evaluateLevel`, `goldInAllLevels`, `AIR_STREAK_TARGET`, `AchievementStore.unlock/addPoints`, `RankStore.all()` (de `Rank.js`).
- Produces: `Game.unlockAchievement(id: string): void` — si `infiniteLife` o `this.practice`, no hace nada; si `AchievementStore.unlock(id)` devuelve true, muestra `floatingText.showBanner(512, 118, '★ ' + Lang.t('achNew', { n: Lang.t('ach_' + id) }), '#ffdd44', 20, 1200)`.
- Textos usados (los define la Task 3): `achNew`, `ach_<id>`.

- [ ] **Step 1: Implementar `unlockAchievement(id)`** junto a `unlockBadge`, con la guarda de vida infinita y práctica descrita arriba.

- [ ] **Step 2: `airborne`** — en los overlaps de punto y de gema, después de `scorePoint`/`scoreGem`, si `this.scoreManager.airStreak >= AIR_STREAK_TARGET` llamar `this.unlockAchievement('airborne')`. (Diferencia con el spec: el spec lo ubica en `evaluateLevel` vía `maxAirStreak`; se evalúa al recoger porque la cadena se corta al aterrizar y así no hay que registrar un máximo nuevo. Mismo resultado.)

- [ ] **Step 3: `onGoalReached`** — justo después de `RankStore.update(...)` y antes de armar el bono visual:
  - `remainingRatio = Math.min(seconds / (this.timer.durationMs / 1000), 1)`.
  - Para cada id de `evaluateLevel({ deaths: this.deaths, maxMult: this.maxMult, rank, remainingRatio })` llamar `unlockAchievement(id)`.
  - Si `goldInAllLevels(RankStore.all(), LEVELS.length)` → `unlockAchievement('goldAll')`.
  - Sumar `baseScore` (puntaje del nivel **antes** del bono de tiempo) con `AchievementStore.addPoints(baseScore)` salvo vida infinita; si devuelve true → `unlockAchievement('collector')` (el banner lo muestra esa llamada; como `unlock` ya fue consumido por `addPoints`, hacer que `unlockAchievement` muestre el banner cuando `AchievementStore.unlock` sea true **o** exponer un helper `showAchievement(id)`; elegir la opción más simple y que no duplique el aviso).
  - Los banners de logro y el de «Nivel superado» no deben pisarse: escalonar los logros con `this.time.delayedCall(…)` o usar la `y` 118 que ya usa `unlockBadge`.

- [ ] **Step 4: `champion`** — en la rama de victoria final (`else` que arranca `GameOver` con `reason: 'victory'`), llamar `AchievementStore.unlock('champion')` antes del `Wipe`/cambio de escena si no es vida infinita (no hay banner aquí: la pantalla final no tiene `floatingText`; se muestra en GameOver, ver Step 5) **o** desbloquear en `onGoalReached` cuando `this.levelIndex + 1 >= LEVELS.length` para que el banner salga en el mismo nivel. Elegir esta última (mismo flujo, banner garantizado).

- [ ] **Step 5: Verificación manual de disparo** — con `npm run dev`, N1: completar un nivel sin morir y con ≥ 50 % del tiempo → banners `Sin caídas` y `Velocista`. Chequear en consola del navegador: `JSON.parse(localStorage.getItem('fastMoveAchievements'))` contiene los ids y `points` > 0.
Expected: banners una sola vez; al repetir el nivel no reaparecen; consola sin errores.

- [ ] **Step 6: Commit (pedir autorización)** — «Logros: disparos en Game».

---

### Task 3: Textos, popup LOGROS y corrección de `gem`

**Files:**
- Modify: `src/systems/Texts.js` (es ~L96–113, en ~L204–221)
- Modify: `src/systems/Badges.js` (`BADGES`)
- Modify: `src/scenes/MainMenu.js` (`createButtons` ~L130, `buildTutorialPopup` ~L616 como modelo, `toggleTutorial` ~L678, `isModalOpen`/`closeModals` ~L102–115, y cada `toggleX(false)` cruzado)

**Interfaces:**
- Consumes (Task 1): `ACHIEVEMENTS`, `AchievementStore.has`, `AchievementStore.progress`.
- Produces: `MainMenu.buildAchievementsPopup()` y `MainMenu.toggleAchievements(show = null)`, con el mismo contrato que `toggleTutorial` (cierra los demás popups, usa `controlsDim`, `Audio.play('ui')`).
- Claves de `Texts.js` (es y en): `achievementsBtn` («LOGROS» / «ACHIEVEMENTS»), `achievementsTitle`, `achNew` («Logro: {n}» / «Achievement: {n}»), `ach_<id>` y `ach_<id>_desc` para los 8 ids, `badge_gem` («Gema» / «Gem»).

- [ ] **Step 1: Textos** — agregar las claves de arriba en ambos idiomas. Nombres (es): Sin caídas, Al máximo, Campeón, Medalla de oro, Oro total, Volando, Velocista, Coleccionista. Descripciones es: «Completá un nivel sin morir», «Llegá a x5 de combo», «Completá la campaña», «Rango oro en un nivel», «Rango oro en los 5 niveles», «Cadena aérea de 5», «Llegá con la mitad del tiempo sobrante», «Sumá 1000 puntos». Traducir al inglés con el mismo criterio.

- [ ] **Step 2: Insignia `gem`** — agregar `'gem'` al final de `BADGES` en `Badges.js`. Verificar que el popup de Tutorial sigue entrando (7 fichas en filas de 3).

- [ ] **Step 3: Botón LOGROS** — agregar `[Lang.t('achievementsBtn'), () => this.toggleAchievements()]` a `secondary`; con 5 botones, ajustar `spacing`/ancho (`spacing` ≈ 190, `w` ≈ 176) para que quepan en 1024 px sin pisarse.

- [ ] **Step 4: Popup** — `buildAchievementsPopup()` replicando el estilo de `buildTutorialPopup` (panel `COLORS.panel`, título `achievementsTitle` con contador `N/8`), 2 columnas × 4 filas: ★/☆ + nombre, descripción debajo en gris y, para `collector`, `valor/1000`. Obtenidos en `COLORS.gold`, pendientes en gris (`#6b6b8a`). Agregar `achievementsPopup` a `isModalOpen`/`closeModals`, y llamar `this.toggleAchievements(false)` desde los `toggle*` existentes y desde las demás rutas donde ya se llama `toggleTutorial(false)`.

- [ ] **Step 5: Verificar en el navegador** — abrir el menú, abrir LOGROS (estado coincide con `localStorage`), cambiar a inglés y volver a abrir (textos traducidos), abrir Tutorial y comprobar que lista 6 insignias sin pisarse con LOGROS (se cierran entre sí); ESC cierra el popup.
Expected: sin errores ni warnings en consola.

- [ ] **Step 6: Commit (pedir autorización)** — «Logros: popup LOGROS y textos; insignia gem visible».

---

### Task 4: Verificación final y cierre en `docs/PLAN.md`

**Files:**
- Modify: `docs/PLAN.md` (tabla §2 y `Estado`)

- [ ] **Step 1: Pruebas automáticas**

Run: `node tools/test-achievements.mjs && node tools/test-rank.mjs && npm run build-nolog`
Expected: dos `OK` y build sin errores.

- [ ] **Step 2: Recorrido manual** (checklist de aceptación del spec): los 8 logros se pueden obtener (usar `localStorage.setItem('fastMoveAchievements', …)` desde la consola para acercar `collector` y `goldAll`), persisten tras recargar, vida infinita no otorga nada, la práctica no otorga nada, y reintentar no repite banners.

- [ ] **Step 3: Actualizar `docs/PLAN.md`** — agregar fila «Logros y medallas» (GDD §9) a la tabla de §2 con lo implementado y lo no verificado; aclarar que quedan pendientes retos fijos, salto doble y modo modificadores.

- [ ] **Step 4: Presentar resumen al usuario y pedir autorización de commit + push** (AGENTS.md §10).

---

## Self-review

- **Cobertura del spec:** catálogo → Task 1/2; `collector` sin niveles perdidos → Task 2 Step 3 (suma `baseScore` solo al completar); popup y progreso → Task 3; vida infinita y práctica → `unlockAchievement` y suma; corrección `gem` → Task 3 Step 2; criterios 1–5 → Task 1 test, Task 3 Step 5, Task 4.
- **Desvío del spec declarado:** `airborne` se evalúa al recoger (Task 2 Step 2), no vía `maxAirStreak`; `evaluateLevel` no recibe `maxAirStreak`.
- **Consistencia de tipos:** `evaluateLevel`, `goldInAllLevels`, `AchievementStore.*` y `unlockAchievement` mantienen la misma firma en las cuatro tareas.
- **Riesgo abierto:** `timer.durationMs` puede crecer con gemas (`addSeconds`); en ese caso `remainingRatio` se calcula sobre el tiempo total ya extendido. Aceptable, a revisar en playtest.
