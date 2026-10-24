# Playtest 1 — Guía de la sesión

> **Qué es:** la comparación entre el juego **antes** de las mejoras de feel (versión A) y **después** de J0–J7 (versión B), con dos personas. Define si las decisiones de J8 (mecánicas con aprobación) hacen falta, y cuáles.
> **Relación con el plan:** `docs/PLAN_FEEL.md` §12 (medición y playtest) y Anexo D.5 (calendario). Participantes y formato salen de las respuestas 12.1–12.4.

---

## 1. Las dos versiones

| | Versión A · anterior | Versión B · nueva |
|---|---|---|
| Qué incluye | Menú, ranking y HUD nuevos, sin ninguna mejora de feel | Todo J0–J7: personaje, polvo y estelas, recolección con orbes, audio y música, tensión, fondo, intro, transiciones y opciones |
| Commit | `a031b9e` | `2bd91b2` + los archivos de playtest |
| Dirección | `http://localhost:5175/` | `http://localhost:5173/?playtest=1` |
| Carpeta | `C:\Users\Micaela\Desktop\fm-baseline-playtest` (checkout aparte) | `TP_DT2_Opencode` |

**Levantarlas** (dos terminales):

```bash
cd C:/Users/Micaela/Desktop/fm-baseline-playtest && npx vite --port 5175
```

```bash
cd C:/Users/Micaela/Desktop/desarrollo_tec_2/TP_DT2_Opencode && npm run dev-nolog
```

> Para que juegue otra persona desde otra PC de la misma red, abrí el servidor con `--host` (por ejemplo `npx vite --host --port 5173`) y que entre a `http://<tu-IP>:5173/?playtest=1`. Cualquier archivo que se guarde mientras se juega **recarga la página**: conviene no editar durante la sesión.

## 2. Quién juega y en qué orden

- **Dos personas** (vos y tu compañera). Cada una juega **2 o 3 partidas de cada versión**.
- **Orden alternado** para que no pese quién juega primero: una persona hace **A → B** y la otra **B → A**.
- No se explica nada antes: que prueben como si fuera la primera vez. Tiempo estimado: 20 minutos por persona.

## 3. Qué probar en la versión B (checklist)

Marcá lo que se llegó a ver. Sirve para detectar cosas que nadie probó.

- [ ] **Movimiento:** correr, saltar, wall jump, dash (probar apretar Shift un instante antes de que se recargue), derrapar al invertir dirección, caer desde lo alto.
- [ ] **Personaje:** antena, bufanda, piecitos, sombra bajo los pies, cara feliz al recoger, cara de pánico en los últimos 5 s.
- [ ] **Recolección:** encadenar puntos hasta x3, x4 y x5 (frenesí); orbe que vuela al puntaje; ruta luminosa; mensajes «¡RACHA!», «¡IMPARABLE!», «¡FRENESÍ!».
- [ ] **Tensión:** música que se suma con el combo, últimos 10 s (tic-tac) y últimos 5 s (latido y borde rojo), flecha de aviso al borde antes de cada disparo.
- [ ] **Nivel 2:** violeta, proyectiles con glow, trampolines.
- [ ] **Transiciones:** intro con cuenta 3-2-1, cuenta del bono al llegar a la salida, cortina entre niveles, reintento con `R`, muerte con fragmentos, fin de partida con «te faltaron N de la meta».
- [ ] **Opciones:** menú → OPCIONES → reducir destellos y movimiento.

## 4. Cómo se miden los números (solo versión B)

Abrir con **`?playtest=1`** en la dirección. Cada nivel terminado queda registrado en el navegador:

| Tecla | Qué hace |
|---|---|
| **F9** | Copia al portapapeles el resumen de los niveles jugados (si el navegador no deja copiar, lo escribe en la consola) |
| **F10** | Borra el historial: usalo antes de empezar cada sesión |
| F3 / F4 | Solo en desarrollo: overlay de FPS y objetos / bloom de prueba |

El resumen incluye por nivel: cómo terminó, segundos, recolecciones y por minuto, **mediana entre recolecciones**, combo máximo y **FPS mínimo**. Al terminar la sesión: **F9** y pegarlo en el campo «Métricas» del formulario.

## 5. El formulario (tres preguntas)

**https://claude.ai/artifact/Ayz2iibrt4ycozLkXD1jry**

Cada persona llena **una planilla por versión jugada**: nombre, versión (A o B), niveles completados, tres puntajes de 1 a 5 (movimiento, recolección, tensión) y tres preguntas abiertas:

1. ¿Qué te dio más ganas de seguir jugando?
2. ¿Hubo algo que te molestó o te cansó?
3. ¿Cuándo sentiste que ibas «bien»?

> La página es privada: para que tu compañera pueda enviar respuestas hay que compartírsela desde el menú **Compartir** de la página con permiso de **Colaborador** o superior. Si no, el formulario le da el texto para copiar y mandártelo.

## 6. Metas (de `docs/PLAN_FEEL.md` §12.2)

| Métrica | Meta |
|---|---|
| FPS mínimo | ≥ 55 |
| Mediana entre recolecciones (nivel medio) | 1,2 a 1,8 s |
| Muertes en la primera partida del nivel 2 | ≤ 1 de cada 3 |
| Puntaje subjetivo de movimiento, recolección y tensión | ≥ 4 en cada eje |

## 7. Qué decidimos después (J8)

| Si salió así… | Entonces |
|---|---|
| Movimiento < 4 o «tosco» | Prioridad a corner correction y ledge forgiveness; si sigue igual, plantear la caída pesada detrás de `?physics=v2` |
| Recolección < 4 o mediana > 1,8 s | `PointDirector` (puntos con ritmo) y más puntos activos con el combo |
| Tensión < 4 | Oleadas telegrafiadas y graze con recompensa |
| Muertes en el nivel 2 > 1 de cada 3 | **No** sumar oleadas todavía: primero el telegrafiado y la dificultad |
| FPS mínimo < 55 | Pasada de rendimiento antes de J8 |
| B no mejora a A en algún eje | Revisar ese eje antes de seguir: el objetivo de J0–J7 era mejorarlo |

## 8. Limpieza al terminar

```bash
git -C C:/Users/Micaela/Desktop/desarrollo_tec_2/TP_DT2_Opencode worktree remove --force C:/Users/Micaela/Desktop/fm-baseline-playtest
```

Cierra también el servidor del puerto 5175. El checkout base no toca ningún archivo del proyecto.

## 9. Limitaciones conocidas

- Los **sonidos y la música no fueron escuchados** por quien los programó: solo se midieron. Los volúmenes son lo primero que conviene ajustar.
- El **bloom** (F4) está apagado: todavía no se decidió si se activa.
- Con `?playtest=1` las métricas se guardan en el navegador de cada persona: cada una tiene que apretar F9 en el suyo.
- No usar el código secreto de vida infinita durante la sesión: falsea las muertes y los tiempos.
