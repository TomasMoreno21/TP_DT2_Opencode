# AGENTS.md — Configuración de IA Asistente (Fast Move)

## 1. Alcance y contexto

- Aplicar estas instrucciones al inicio de cada consulta y antes de modificar el proyecto.
- Responder en **español** y adaptar la profundidad del análisis a la complejidad de la solicitud.
- Documentación del proyecto:
  - `docs/GDD.pdf` — documento principal de requisitos y diseño del juego (videojuego).
  - `docs/PLAN.md` — plan de trabajo vigente: fases E1–E17, criterios de aceptación y decisiones tomadas. Se actualiza al cerrar cada fase.
  - `README.md` — contexto, instalación, controles y arquitectura.
- Revisar la información vigente en `docs/` y el código; no depender exclusivamente de resúmenes de conversaciones anteriores.
- Preservar el trabajo existente del usuario.

## 2. Revisar la documentación y el requisito

Antes de proponer o implementar una solución:

1. Identificar el requisito solicitado y su comportamiento esperado.
2. Revisar `docs/` (GDD.pdf y PLAN.md principalmente).
3. Consultar las secciones pertinentes:
   - `docs/GDD.pdf` para requisitos de diseño y mecánicas.
   - `docs/PLAN.md` para el estado del plan, fases, criterios de aceptación y decisiones tomadas.
4. Clasificar el requisito como:
   - **Definido:** la documentación describe suficientemente el comportamiento.
   - **Parcialmente definido:** está contemplado, pero faltan detalles necesarios.
   - **No definido:** no aparece en la documentación revisada.
   - **En contradicción:** la solicitud difiere de una regla documentada.
   - **No aplica:** es una consulta técnica o documental sin una regla funcional asociada.
5. Citar el documento y la sección que respaldan el análisis:
   - Para `docs/GDD.pdf`, indicar la página (distinguir numeración del archivo e impresa si difieren).
   - Para `docs/PLAN.md`, citar el título o número del apartado.
6. Diferenciar las reglas documentadas de las propuestas y los supuestos.

Si la documentación no existe o no puede leerse, indicarlo claramente y no afirmar que el requisito está definido o ausente.

Un requisito no documentado puede ser una ampliación válida: identificarlo como tal y consultar las decisiones necesarias.

No modificar `docs/GDD.pdf` para justificar una implementación sin una solicitud explícita del usuario. `docs/PLAN.md` sí se actualiza en el cierre de cada fase, según su propio encabezado.

## 3. Analizar conflictos e impacto

Antes de modificar una funcionalidad:

- Revisar tanto las reglas documentadas como la implementación existente.
- Identificar dependencias, restricciones compartidas, excepciones, prioridades entre comportamientos y posibles regresiones.
- Analizar las interacciones con otras funcionalidades.
- Comparar el comportamiento actual con la documentación; no asumir que el código existente es necesariamente correcto.
- Detectar contradicciones internas de la documentación.
- Comunicar los conflictos relevantes antes de modificar la parte afectada.

En este videojuego, considerar cuando corresponda:

- Mecánicas por nivel y su activación (trampolines, plataformas móviles, pinchos, escudo, portales, gemas).
- Movimiento, salto, wall grab / wall jump y dash; límites del mapa fijo 1024×768.
- Puntos, spots fijos, quota, combo/multiplicador x1–x5 y mejor puntaje (localStorage).
- Proyectiles: spawn, homing, línea recta acelerada y variantes.
- Función de la salida (Goal) y condición de victoria/derrota.
- Navegación de escenas (MainMenu → Game → GameOver) y flujo de campaña por niveles.
- Controles de teclado (sin soporte móvil): A/D, espacio/W, Shift (dash), R (reintentar), M (mute).
- Estado del HUD, temporizador, quota y combo.
- Audio procedural de `systems/Audio.js`.

## 4. Preguntar antes de avanzar ante dudas

Cuando una duda afecte el alcance, las reglas, el comportamiento, la compatibilidad o la implementación:

- Utilizar la herramienta de preguntas al usuario disponible en el entorno (`question`).
- Formular preguntas concretas.
- Explicar qué decisión falta y por qué importa.
- Ofrecer opciones cuando faciliten la decisión.
- Incluir una recomendación fundamentada cuando corresponda.
- Esperar la respuesta antes de adoptar una decisión que cambie el comportamiento solicitado.
- No inventar reglas para resolver omisiones o contradicciones.
- Continuar con tareas independientes cuyo alcance esté claro.

Si la herramienta de preguntas no está disponible, preguntar directamente en la conversación y esperar la aclaración.

## 5. Utilizar POO y patrones de diseño

- Modelar entidades y comportamientos con programación orientada a objetos, respetando el stack (JavaScript + Phaser 4) y la arquitectura existente.
- Encapsular el estado y las reglas.
- Mantener responsabilidades claras, alta cohesión y bajo acoplamiento.
- Favorecer composición cuando evite jerarquías de herencia innecesarias.
- Separar lógica de negocio de presentación y entrada del usuario.
- Utilizar patrones de diseño cuando resuelvan una necesidad concreta.
- Explicar brevemente la elección y utilidad de los patrones aplicados.
- Evitar abstracciones innecesarias y refactorizaciones ajenas al requisito.

Estándares del proyecto (YA en uso, mantener):
- `patterns/EntityFactory.js` — patrón Factory para crear entidades (Point, Projectile, Goal, Trampoline y las nuevas) desacoplando la creación de los consumidores.
- Clases pequeñas con responsabilidad clara; **no concentrar toda la lógica en `GameScene`**.
- Sin lógica duplicada ni variables globales innecesarias.

No imponer patrones cuando no aporten valor.

## 6. Reutilizar código existente

Antes de crear clases, componentes, servicios o utilidades:

1. Buscar implementaciones relacionadas en `src/`.
2. Revisar sus contratos, comportamiento y consumidores.
3. Priorizar su reutilización o extensión cuando sean compatibles.
4. Evitar duplicar lógica de negocio.
5. Extraer lógica común solo cuando haya una necesidad real, preservando el comportamiento de sus consumidores.
6. Respetar las convenciones de estructura, nombres y estilo del proyecto.

Referencias de reutilización:
- Entidades nuevas → registrarlas en `patterns/EntityFactory.js` y materializarlas desde `systems/Level.js` o `scenes/Game.js`.
- Eventos de audio → `systems/Audio.js` (`Audio.play(...)`).
- Textos flotantes → `systems/FloatingText.js`.
- Datos de niveles → `assets/levels.js` (solo datos puros).

Repetir esta revisión en cada tarea; no asumir que la estructura permanece igual entre consultas.

## 7. Recursos gráficos (procedural)

Este proyecto **no usa sprites ni imágenes**: todo lo visual se genera con `Graphics` y `generateTexture` en runtime, con formas primitivas (rectángulos, círculos). `src/assets/` contiene solo datos.

- Respetar esa convención: implementar lo visual con `Graphics`/formas primitivas salvo justificación.
- Si una tarea requiriera un **asset externo** (imagen, spritesheet, fuente, audio), preguntar antes de agregarlo:
  - Confirmar si se genera un mockup o se usa un recurso existente (pedir ruta o archivo si no se localiza).
  - No inventar nombres ni rutas de recursos.
- Consultar detalles como spritesheet, fotogramas o animaciones solo cuando sean necesarios y no estén documentados.
- Continuar con la lógica independiente del recurso gráfico mientras se resuelve la consulta.

## 8. Flujo Git

- Este repositorio usa Git con rama única **master** (remote: `origin`, GitHub). No hay GitFlow.
- **No crear ramas feature por defecto:** trabajar directamente en master, salvo que el usuario lo pida explícitamente.
- Antes de implementar:
  - Revisar `git status`, la rama actual y los remotos.
  - Preservar cambios previos del usuario; si interfieren con la tarea, consultar antes de tocarlos.
- **Solicitar autorización explícita del usuario antes de cada `commit` y `push`** (no commitear ni pushear sin permiso).
- No hacer force push, omitir hooks, modificar configuración de Git ni fusionar ramas sin solicitud expresa.
- Si commit o push falla, informar el resultado sin afirmar que la operación se completó.
- Un pull request o integración en otra rama requiere autorización adicional.

## 9. Implementar y verificar

- Definir criterios de aceptación a partir del requisito, la documentación y las aclaraciones del usuario (revisar los criterios de `docs/PLAN.md` cuando aplique a una fase).
- Realizar cambios enfocados en el alcance acordado, siguiendo la receta de entidades del PLAN.md cuando corresponda.
- Verificaciones disponibles en este proyecto (NO hay scripts de test ni lint):
  - Compilar: `npm run build-nolog` (sin telemetría).
  - Recorrido manual con `npm run dev` en el navegador.
  - Revisar consola del navegador sin errores ni warnings.
- Verificar las interacciones identificadas durante el análisis de impacto.
- No afirmar resultados que no fueron comprobados; informar qué se verificó y qué quedó pendiente.

## 10. Solicitar confirmación y realizar commit y push

Al terminar la implementación:

1. Presentar al usuario:
   - Resumen del comportamiento implementado.
   - Archivos afectados.
   - Verificaciones realizadas y sus resultados.
   - Pendientes o limitaciones reales.
   - Rama utilizada (master).
2. Solicitar autorización para commit y push (puede ser parte de la misma pregunta de confirmación).
3. Esperar la respuesta; si el usuario pide ajustes, realizarlos, repetir las verificaciones y volver a solicitar confirmación.

Después de recibir autorización:

1. Revisar `git status`, `git diff` y `git log --oneline -10`.
2. Revisar archivos nuevos que se incluirán.
3. Preparar únicamente los cambios de la tarea, sin incluir cambios ajenos ni secretos.
4. Crear un commit descriptivo coherente con el estilo del repositorio.
5. Push a `master` y verificar el resultado.
6. Informar identificador y mensaje del commit y el resultado del push.

## 11. Comunicar el análisis y los resultados

Antes de implementar, presentar un análisis breve:

- **Requisito:** comportamiento solicitado.
- **Documentación:** estado y referencias (GDD.pdf / PLAN.md).
- **Conflictos e impacto:** funcionalidades y reglas afectadas.
- **Reutilización:** código existente aprovechable.
- **Diseño:** enfoque POO y patrones pertinentes.
- **Recursos gráficos:** confirmados o consulta pendiente.
- **Git:** estado y plan (master; se pedirá autorización para commit).
- **Dudas:** decisiones que requieren respuesta.

Para consultas simples, reducir el formato a los puntos aplicables.

Al finalizar, resumir: cambios y archivos afectados, decisiones, verificaciones ejecutadas, pendientes reales y confirmación solicitada. No presentar propuestas como funcionalidades implementadas.

---

## Comandos del proyecto

- Instalar dependencias: `npm install`
- Ejecutar (dev server): `npm run dev`
- Build de producción: `npm run build`
- Sin telemetría: `npm run dev-nolog` / `npm run build-nolog`

## Reglas técnicas del proyecto (preservadas)

- JavaScript únicamente. **No agregar TypeScript.**
- Utilizar Phaser 4.
- No agregar dependencias externas sin justificar su necesidad.
- No modificar los controles ni las mecánicas centrales sin avisar al equipo.
  - Controles ya aprobados (ver `docs/PLAN.md` §7): dash (Shift), R (reintentar), M (mute).
- Respetar la arquitectura existente: `src/scenes/`, `src/entities/`, `src/systems/`, `src/patterns/`, `src/assets/`.
- Cada fase planificada (E*) cierra con verificación y commit+push **autorizado**; el estado se actualiza en `docs/PLAN.md`.