# Fast Move — Game Design Document

**Equipo:** Tomás Moreno, Facundo Ibañez
**Género:** plataformas 2D *time-attack* de pantalla única
**Plataforma:** navegador (PC, teclado) — Phaser 4 + Vite, publicado en Vercel
**Versión del documento:** entrega de versión jugable (campaña de 2 niveles)

---

## 1. Idea y concepto

Fast Move es un juego de plataformas donde cada nivel es una sola pantalla fija. El jugador tiene poco tiempo para recolectar una **meta de puntos** y llegar a la **salida** antes de que el reloj llegue a cero. La tensión viene de combinar tres cosas: moverse rápido, encadenar recolecciones para subir un multiplicador y esquivar los peligros del nivel.

**Pilares de diseño**

1. **Velocidad con control:** el personaje responde de inmediato (salto variable, wall jump, dash), así que ir rápido es una habilidad y no un azar.
2. **Riesgo y recompensa:** el combo premia no frenar y la cadena aérea premia las rutas arriesgadas.
3. **Una mecánica nueva por nivel:** cada nivel presenta algo y lo explota sin sumar ruido.

**Objetivo del jugador:** completar los niveles de la campaña y conseguir el mayor puntaje total posible (se guarda el récord).

## 2. Flujo de juego

1. **Menú principal:** JUGAR, CONTROLES, IDIOMA (es/en), TUTORIAL y NUEVOS NIVELES (genera otra semilla de mapas). Se muestra el mejor puntaje.
2. **Nivel:** el jugador recolecta puntos hasta cumplir la meta. Al cumplirla, la **salida** (cerrada hasta ese momento) se abre.
3. **Pisar la salida** termina el nivel y suma su puntaje al total de la campaña.
4. **Victoria:** al completar el último nivel de la campaña aparece la pantalla final con el puntaje total, el combo máximo y el récord.
5. **Derrota:** ver sección 5. La pantalla de fin ofrece *Reintentar nivel* o *Salir* al menú.

La campaña de esta versión tiene **2 niveles**. El juego incluye contenido adicional (niveles 3 a 5) que está desactivado para esta entrega y se describe como alcance futuro en la sección 9.

## 3. Controles

| Acción | Control |
|---|---|
| Mover | A / D o flechas izquierda / derecha |
| Saltar | Espacio, W o flecha arriba (mantener = salto más alto) |
| Agarrarse a la pared | Mantener la dirección contra la pared |
| Salto de pared | Saltar mientras se toca una pared |
| Dash | Shift |
| Reiniciar el nivel | R |
| Silenciar | M |
| Saltear tutorial | T |

## 4. Mecánicas

### 4.1 Movimiento del jugador

- **Correr:** velocidad máxima 340 px/s con aceleración y frenado propios en suelo y aire.
- **Salto variable:** soltar el botón pronto corta el salto, así se controla la altura.
- **Ayudas de entrada:** *coyote time* (140 ms para saltar justo después de dejar una plataforma) y *jump buffer* (170 ms para registrar un salto pedido un instante antes de aterrizar).
- **Wall grab y wall jump:** el jugador se agarra a las paredes y salta hacia el lado opuesto. Permite subir por los bordes del mapa.
- **Dash:** impulso en línea recta de 700 px/s durante 170 ms. Mientras dura, el jugador no recibe daño y no puede saltar. Tiene enfriamiento de 0,9 s, que se muestra en el HUD como una barra.

### 4.2 Puntos, combo y multiplicador

- Los **puntos** (esferas amarillas) valen 10. El mapa tiene 12 spots fijos y hay **2 puntos activos a la vez**; al recoger uno se activa otro spot al azar.
- Cada recolección suma al **combo**. Si pasan más de **3 segundos** sin recolectar, el combo se pierde.
- El **multiplicador** es `1 + combo / 3` (redondeado hacia abajo), con tope en **x5**. Cada recolección vale `valor × multiplicador`.
- **Meta del nivel (quota):** cantidad de puntos que hay que recolectar para abrir la salida. Es 12 en el nivel 1 y 10 en el nivel 2.

### 4.3 Cadena aérea ("sin pies en el suelo")

Recolectar estando en el aire suma un bono de **+10 × la racha aérea**. La racha sigue mientras el jugador no toque el piso. El HUD muestra "VOLANDO xN". Premia las rutas que encadenan saltos, wall jumps y dashes.

### 4.4 Trampolines (nivel 2)

Rebotan al jugador hacia arriba. Tienen una **zona perfecta** en el centro: caer ahí da un rebote más alto (−900 contra −620 px/s) y un destello dorado. El dash atraviesa el trampolín sin rebotar.

### 4.5 Proyectiles (nivel 2)

Nacen en las paredes de los bordes. Primero **persiguen** al jugador durante unos 0,5 s y después siguen en línea recta **acelerando** hasta 360 px/s. Un impacto termina el nivel. Su frecuencia aumenta con el tiempo. El dash los esquiva gracias a la invulnerabilidad.

### 4.6 Tabla resumen

| Mecánica | Qué hace | Aparece en |
|---|---|---|
| Salto, wall jump | Movimiento base | Niveles 1 y 2 |
| Dash | Impulso invulnerable | Niveles 1 y 2 |
| Puntos y combo | Fuente principal de puntaje | Niveles 1 y 2 |
| Cadena aérea | Bono por recolectar en el aire | Niveles 1 y 2 |
| Trampolines | Rebote, con zona perfecta | Nivel 2 |
| Proyectiles | Obstáculo que obliga a esquivar | Nivel 2 |

## 5. Reglas, victoria y derrota

**Reglas de puntaje**

- El puntaje y el combo **empiezan en 0 en cada nivel**.
- Al completar un nivel, sus puntos se suman al **total de la campaña**.
- Si el jugador pierde el nivel, **los puntos de ese intento no cuentan**. Se conserva lo acumulado en los niveles ya superados.
- El **mejor puntaje total** se guarda en el navegador (`localStorage`).

**Se pierde el nivel cuando:**

- el **tiempo llega a cero** antes de pisar la salida, o
- un **proyectil impacta** al jugador (nivel 2).

**Se gana la campaña** al pisar la salida del último nivel (nivel 2 en esta versión).

## 6. Niveles

| # | Nombre | Tiempo | Meta | Peligros | Idea del nivel |
|---|---|---|---|---|---|
| 1 | Arranque | 60 s | 12 puntos | Ninguno | Enseña el movimiento, el wall jump y el combo sin presión. Es el nivel donde se aprende el control. |
| 2 | Rebotes | 50 s | 10 puntos | Proyectiles | Introduce los trampolines y los proyectiles. Hay que subir por rebotes y esquivar al mismo tiempo. |

**Progresión y dificultad:** el nivel 1 no tiene amenazas y da 10 segundos más de reloj; el nivel 2 reduce el tiempo y agrega proyectiles y verticalidad. La dificultad sube por presión de tiempo y por la necesidad de combinar mecánicas.

Todos los mapas ocupan una sola pantalla de 1024×768 y se validan con una herramienta propia que comprueba que cada punto y la salida sean alcanzables con la física del jugador.

## 7. Ayuda al jugador

- **Tutorial:** en el nivel 1 aparecen pistas paso a paso (mover, saltar, wall grab, wall jump, dash) que se completan al usar cada mecánica. Se puede saltear con T.
- **Práctica corta** antes de las mecánicas nuevas, ofrecida una sola vez.
- **Coach al fallar:** tras derrotas seguidas por la misma causa, el juego muestra un consejo.
- **Insignias de aprendizaje** al lograr, por ejemplo, un wall jump, un dash o un rebote perfecto.
- **Feedback:** sonidos generados por código, pausa breve al recolectar o recibir un golpe, cámara lenta al perder y zoom leve con multiplicador alto.

## 8. Arte, interfaz y audio

- **Estilo:** formas geométricas con colores contrastantes, fondo oscuro con parallax y viñeta. El jugador cambia de color según el multiplicador.
- **HUD:** puntaje, tiempo, combo y multiplicador, progreso de la meta, barra de dash e indicador de nivel.
- **Audio:** efectos procedurales (WebAudio) para puntos, combo, rebotes, golpes, salida y victoria. Se silencia con M.
- **Idiomas:** español e inglés.

## 9. Alcance

**Incluido en esta versión:** menú, campaña de 2 niveles, tutorial, victoria y derrota, puntaje y récord persistentes, audio y feedback.

**Fuera de esta entrega (ya construido, desactivado):**

- Nivel 3 "Movimiento": plataformas móviles.
- Nivel 4 "Peligro": pinchos cíclicos, escudo y proyectiles con rebote.
- Nivel 5 "Final": portales que conservan el impulso y proyectiles con estela.

**Ideas a futuro:** estadísticas por nivel (mejor tiempo y combo), modo práctica para rejugar niveles superados y más niveles.
