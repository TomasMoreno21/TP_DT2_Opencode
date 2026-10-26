# Niveles 3 a 5 — Diseño

> Fecha: 2026-10-26 · Estado: **implementado** (sin commitear); ver PLAN.md.
> Contexto: GDD §6 y §9 dejan los niveles 3 a 5 "sin definir"; el código y `docs/PLAN.md` tienen mecánicas provisorias. Esta spec las formaliza y reemplaza en el N3.

## 1. Objetivo y principios

Cerrar la campaña de 5 niveles con una identidad clara por nivel, respetando el principio del GDD §1: **una mecánica nueva por nivel**, y que la dificultad suba por presión de tiempo y por combinar mecánicas. El N5 es el único que combina todo.

Alcance elegido: **formalizar N3–N5** (no hay niveles 6+).

## 2. Resumen

| | N3 «Frágiles» | N4 «Peligro» | N5 «Final» |
|---|---|---|---|
| Mecánica central | Plataformas frágiles | Pinchos cíclicos | Portales que conservan el impulso |
| Soporte | Mitad frágiles, mitad seguras | Escudo (cubre pinchos y proyectiles) | Trampolines, frágiles, pinchos y escudo |
| Proyectiles | Estándar, apenas más rápidos que el N2, progresión muy lenta | Estándar, ritmo más rápido | Solo **ricochet**, 1100→680 ms, tope x1,9 |
| Tiempo / meta | 50 s / 13 | 44 s / 14 | 55 s / 18 |
| Diferencial | Puntos extra sobre frágiles | Esquivar con ritmo y administrar el escudo | Los portales como atajo estratégico |

Cambios globales: **se quitan las plataformas móviles del juego** y el N4 pasa de ricochet a proyectil estándar (el ricochet se reserva al N5).

## 3. Nivel 3 — «Frágiles»

**Mecánica.** Plataforma frágil (`FragilePlatform`):
- Al **pisarla desde arriba** empieza a temblar (aviso G4) y **cae a los 0,7 s**.
- **Reaparece a los 3 s**, translúcida 0,5 s antes de volverse sólida. Si el jugador está encima al solidificarse, queda apoyado sin consecuencias.
- **El wall grab no la activa** y **un dash por encima sin posarse tampoco**.
- Los proyectiles no la afectan.

**Composición.** Mitad de las plataformas flotantes frágiles y mitad seguras, con piso y paredes seguros. Hay una ruta segura y una ruta rápida por frágiles que premia la velocidad; ninguna ruta exige quedarse quieto sobre una frágil.

**Recompensa.** Algunos de los 12 spots (y los puntos de la quota) están sobre frágiles. No hay gema especial en el nivel (se mantiene 1 gema estándar como en N1–N3 del PLAN §E8).

**Dificultad.** Timer 50 s, quota 13. Proyectiles estándar, intervalo inicial apenas menor que el del N2 (2000 ms) y progresión muy lenta hacia un final apenas más rápido que el del N2 (1200 ms): valores a fijar al implementar, respetando que los rangos no se solapen entre niveles (`test-levels`).

## 4. Nivel 4 — «Peligro»

- **Mecánica:** pinchos cíclicos con aviso (ya implementados: `Hazard`).
- **Escudo:** `PowerUp` actual (absorbe un impacto, ~1 s de invulnerabilidad, re-obtenible). **Cubre pinchos y proyectiles** (hoy ya los cubre; se documenta como regla).
- **Proyectiles:** variante estándar con ritmo más rápido que el N3; se **elimina el ricochet** de este nivel.
- **Dificultad:** 44 s / meta 14.

## 5. Nivel 5 — «Final»

- **Mecánica central:** portales que conservan el impulso (ya implementados), con aviso de 350 ms y cooldown; los 2 pares actuales.
- **Combinación:** trampolines (N2), frágiles (N3), pinchos y escudo (N4), con menor densidad de cada uno que en su nivel de origen.
- **Proyectiles:** **solo ricochet**, 1100 → 680 ms, tope x1,9.
- **Dificultad:** 55 s / meta 18. Se descartó 60 s para no romper la regla del GDD §6 ("nunca más generoso que uno anterior"); con 44 s en el N4 la regla ya está en tensión (ver §7).
- **Diferencial:** los portales son el atajo que ahorra tiempo real; el reto es decidir cuándo usarlos.

## 6. Qué se toca

- **Entidad nueva:** `src/entities/FragilePlatform.js`, registro en `patterns/EntityFactory.js`, `materialize` en `systems/Level.js`, datos en `assets/levels.js`, wiring en `scenes/Game.js`, evento de audio en `systems/Audio.js` (temblor, caída, reaparición).
- **Validador (`LevelValidator`):** modelar la frágil como sólida durante 0,7 s tras el primer contacto desde arriba y ausente hasta reaparecer. Es el punto técnico más caro.
- **Generador:** reglas para frágiles (proporción ~50 %, que siempre exista ruta segura, spots sobre frágiles, que no queden aisladas); recalcular `levelBaselines.js` y las bandas `TIMER_BANDS` con los nuevos tiempos.
- **Móviles fuera:** eliminar `MovingPlatform` de N3 y N5; el modo con tiempo del validador, `_mutateLanes`, `laneZone` y `timedMovers` quedan sin uso (decidir al implementar si se borran o se dejan inactivos).
- **N4:** cambiar `variant` a estándar; **N5:** `variant: 'ricochet'` y reponer sin móviles su ruta.
- **Documentación:** actualizar GDD (§6 tabla de niveles, §9) con autorización explícita del usuario, `docs/PLAN.md` y `README.md`.

## 7. Conflictos y riesgos

1. **Regla de dificultad creciente (GDD §6).** Orden de tiempos: N3 50 s, N4 44 s, N5 55 s. El N5 es más generoso que el N4. Se justifica por la meta (18) y la densidad, pero requiere cambiar la redacción del GDD o dejar una excepción para el último nivel. **A decidir.**
2. **N5 denso.** Cinco mecánicas con una quota de 18; riesgo de nivel ilegible. Validar con el checker y con playtest antes de dar el nivel por cerrado.
3. **Validación de frágiles.** Un modelo optimista podría dar niveles imposibles (lección 1 del PLAN). Debe probarse contra el juego real (bot).
4. **N4 y N5 pierden ritmo distinto.** El N4 deja de tener un proyectil especial; su identidad pasa a ser solo pinchos y escudo.

## 8. Fuera de alcance

Corrientes de viento, plataformas que se mueven, pinchos en paredes, salida móvil, niveles 6+.

## 9. Verificación (criterios de aceptación)

- Frágil: cae a los 0,7 s tras pisarla desde arriba, reaparece a los 3 s con aviso, no se activa con wall grab ni dash.
- Los 3 niveles pasan `LevelValidator` (todos los spots y la salida alcanzables) y `npm run test-levels`.
- `npm run build-nolog` OK; consola sin errores; recorrido manual de N3, N4 y N5.
- N4 sin ricochet; N5 con ricochet.
- Playtest manual del N3 y N5 (pendiente, no verificable por el panel).
