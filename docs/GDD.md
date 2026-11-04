# Fast Move — Game Design Document

**Equipo:** Tomás Moreno, Facundo Ibañez
**Género:** plataformas 2D *time-attack* de pantalla única
**Plataforma:** navegador (PC, teclado) — Phaser 4 + Vite, publicado en Vercel
**Versión del documento:** versión jugable con la campaña completa de 5 niveles

---

## 1. Idea y concepto

Fast Move es un juego de plataformas donde cada nivel es una sola pantalla fija. El jugador tiene poco tiempo para recolectar una **meta de puntos** y llegar a la **salida** antes de que el reloj llegue a cero. La tensión viene de moverse rápido, encadenar recolecciones para subir un multiplicador y esquivar los peligros del nivel.

**Pilares de diseño**

1. **Velocidad con control:** el personaje responde de inmediato (salto variable, wall jump, dash), así que ir rápido es una habilidad y no un azar.
2. **Riesgo y recompensa:** el combo premia no frenar y la cadena aérea premia las rutas arriesgadas.
3. **Una mecánica nueva por nivel:** cada nivel presenta algo y lo explota sin sumar ruido.

**Objetivo del jugador:** completar los niveles de la campaña con el mayor puntaje total posible (se guarda el récord).

## 2. Flujo de juego

1. **Menú principal:** JUGAR, RANKING, LOGROS, CONTROLES, TUTORIAL, OPCIONES, IDIOMA (es/en) y NUEVOS NIVELES (genera otra semilla de mapas), más el interruptor del modo modificadores. Muestra el mejor puntaje y una medalla por nivel.
2. **Nivel:** se recolectan puntos hasta cumplir la meta, y entonces se abre la **salida**.
3. **Pisar la salida** termina el nivel: los segundos sobrantes se convierten en puntos (bono de tiempo), se muestra el rango y el puntaje se suma al total de la campaña.
4. **Victoria:** al completar el último nivel aparece la pantalla final con puntaje total, combo máximo y récord.
5. **Derrota:** ver sección 5. Se ofrece *Reintentar nivel* o *Salir* al menú.

La campaña tiene **5 niveles**; al pisar la salida del quinto se gana.

## 3. Controles

| Acción | Control |
|---|---|
| Mover | A / D o flechas izquierda / derecha |
| Saltar | Espacio, W o flecha arriba (mantener = salto más alto) |
| Agarrarse a la pared | Mantener la dirección contra la pared |
| Salto de pared | Saltar mientras se toca una pared |
| Dash | SHIFT |
| Reiniciar el nivel | R |
| Pausa (continuar, otro nivel o menú) | Esc |
| Silenciar | M |
| Saltear tutorial | T |

## 4. Mecánicas

### 4.1 Movimiento del jugador

- **Correr:** velocidad máxima 340 px/s con aceleración y frenado propios en suelo y aire.
- **Salto variable:** soltar el botón pronto corta el salto.
- **Ayudas de entrada:** *coyote time* (140 ms) y *jump buffer* (170 ms).
- **Wall grab y wall jump:** el jugador se agarra a las paredes y salta hacia el lado opuesto.
- **Dash:** impulso de 700 px/s durante 170 ms, sin salto. Es **invulnerable** durante todo el impulso y 0,2 s más después. Enfriamiento de 0,9 s (barra en el HUD). **Solo se recarga con el tiempo**, no al tocar suelo, pared o trampolín.

### 4.2 Puntos, combo, bono de tiempo y rangos

- Los **puntos** valen 10. Hay 12 spots fijos y **2 puntos activos a la vez**; al recoger uno se activa otro spot al azar.
- Cada recolección suma al **combo**, que se pierde tras **3 s** sin recolectar. El **multiplicador** es `1 + combo / 3` (hacia abajo), con tope en **x5**.
- **Meta del nivel:** cantidad de puntos para abrir la salida (12, 10, 13, 14 y 12 en los niveles 1 a 5). Es por cantidad y no por puntaje a propósito: un umbral de puntaje dejaría salir antes a quien encadena combos y no a quien no lo hace. El puntaje se premia aparte.
- **Bono de tiempo:** al pisar la salida, cada segundo sobrante da **5 puntos**. Da una razón para seguir sumando después de cumplir la meta.
- **Rangos:** con el puntaje del nivel más el bono se otorga **bronce, plata u oro**. Umbrales: meta × 20, × 35 y × 50 (con meta 12: 240, 420 y 600). Son valores iniciales sin probar y se van a ajustar.
- **HUD y menú:** una barra a la derecha avanza hacia el oro con marcas de bronce y plata. El mejor rango de cada nivel se guarda en el navegador y se muestra en el menú como una **medalla dibujada** (las de oro brillan; los niveles sin rango muestran una ranura apagada).

### 4.3 Cadena aérea

Recolectar en el aire suma **+10 × la racha aérea**, que sigue mientras el jugador no toque el piso. El HUD muestra "VOLANDO xN". Premia encadenar saltos, wall jumps y dashes.

### 4.4 Trampolines (nivel 2)

Rebotan al jugador hacia arriba. Caer en la **zona perfecta** del centro da un rebote más alto (−900 contra −620 px/s) y un destello dorado. El dash los atraviesa sin rebotar.

### 4.5 Proyectiles (nivel 2)

Nacen en las paredes de los bordes, con una marca pulsante de 400 ms de aviso. Viajan en **línea recta** hacia donde estaba el jugador al salir (no lo persiguen) y **aceleran** hasta 360 px/s. Un impacto termina el nivel. Su frecuencia y velocidad aumentan con el tiempo; el dash los atraviesa.

### 4.6 Plataformas frágiles (nivel 3)

Caen poco después de pisarlas: hay que seguir moviéndose.

### 4.7 Pinchos y escudo (nivel 4)

Los pinchos tiemblan antes de salir y se retraen por ciclos; tocarlos cuenta como un impacto. El **escudo** (power-up) absorbe un golpe y se puede volver a conseguir.

### 4.8 El Vacío (nivel 5)

El nivel 5 es una **torre**: el escenario sube solo y el borde inferior del Vacío mata al tocarlo (el escudo no lo frena). Arranca tras una breve demora; si el jugador trepa más rápido que el escenario, la vista lo acompaña y nunca baja. Los orbes que el Vacío se traga se reubican. La **cuota es de 12 orbes**: al cumplirla, la torre se detiene, el Vacío desaparece y la salida aparece sobre una plataforma visible alejada del jugador. Escapar de la torre da la insignia *Escapaste del Vacío*.

### 4.9 Tabla resumen

| Mecánica | Qué hace | Aparece en |
|---|---|---|
| Salto, wall jump, dash | Movimiento base | Todos los niveles |
| Puntos, combo, cadena aérea | Fuente de puntaje | Todos los niveles |
| Bono de tiempo y rangos | Premian terminar rápido y con buen puntaje | Todos los niveles |
| Trampolines | Rebote, con zona perfecta | Nivel 2 |
| Proyectiles | Obstáculo que obliga a esquivar | Niveles 2 a 5 |
| Plataformas frágiles | Caen al pisarlas | Nivel 3 en adelante |
| Pinchos y escudo | Peligro con aviso; el escudo absorbe un golpe | Nivel 4 en adelante |
| Vacío | Escenario que sube solo; la cuota lo detiene | Nivel 5 |

## 5. Reglas, victoria y derrota

**Reglas de puntaje**

- El puntaje y el combo **empiezan en 0 en cada nivel**.
- Al completar un nivel, su puntaje (con el bono de tiempo) se suma al **total de la campaña**.
- Si el jugador pierde, **los puntos de ese intento no cuentan**; se conserva lo de los niveles ya superados.
- El **mejor puntaje total** se guarda en el navegador (`localStorage`).

**Se pierde el nivel cuando:**

- el **tiempo llega a cero** antes de pisar la salida, o
- un **proyectil o un pincho** impacta al jugador sin escudo, o
- el **Vacío** lo alcanza (nivel 5).

**Se gana la campaña** al pisar la salida del último nivel.

## 6. Niveles

| # | Nombre | Tiempo | Meta | Peligros | Idea del nivel |
|---|---|---|---|---|---|
| 1 | Arranque | 60 s | 12 puntos | Ninguno | Enseña movimiento, wall jump y combo sin presión. |
| 2 | Rebotes | 50 s | 10 puntos | Proyectiles | Trampolines y proyectiles: subir por rebotes y esquivar a la vez. |
| 3 | Frágiles | 50 s | 13 puntos | Proyectiles | Plataformas frágiles: no quedarse quieto. |
| 4 | Peligro | 47 s | 14 puntos | Proyectiles y pinchos | Pinchos con aviso y escudo. |
| 5 | Final | 55 s | 12 puntos | Vacío y proyectiles | Torre que sube sola: trepar y juntar 12 orbes; al cumplirlos se detiene y aparece la salida. |

**Progresión:** el nivel 1 no tiene amenazas y da 10 s más de reloj; cada nivel siguiente suma una mecánica (rebotes, frágiles, pinchos y por último el Vacío). La dificultad sube por presión de tiempo y por combinar mecánicas.

Todos los mapas ocupan una pantalla de 1024×768 y se validan con una herramienta propia que comprueba que cada punto y la salida sean alcanzables con la física del jugador.

**Generación de niveles**

- Cada campaña sale de una **semilla** (visible en el menú; NUEVOS NIVELES la cambia). El mapa parte del diseño base y se modifica: espejo, plataformas quitadas, agregadas o movidas, y puntos y salida reubicados.
- Solo se acepta un mapa si pasa la validación y su dificultad queda en una banda cercana a la del diseño base. El tiempo y la frecuencia de proyectiles se ajustan al mapa, con límites para que un nivel posterior nunca sea más generoso que uno anterior. Si ningún candidato sirve, se usa el diseño base.
- La validación tiene en cuenta que el jugador puede hacer wall jump y dash.
- **Asistencia al perder:** al reintentar se genera otro mapa y, tras cada derrota seguida (hasta 3), sale más fácil, con más espacio y 2 s extra. El juego avisa "Mapa nuevo: más espacio y más tiempo".

## 7. Ayuda al jugador

- **Tutorial:** en el nivel 1, pistas paso a paso (mover, saltar, wall grab, wall jump, dash) que se completan al usar cada mecánica. Panel sobre la franja del piso con teclas dibujadas y puntos de progreso. Se saltea con T.
- **Coach al fallar:** tras derrotas seguidas por la misma causa, muestra un consejo.
- **Insignias de aprendizaje** (5): wall jump, dash, rebote perfecto, escudo salvador y Vacío (escapar de la torre del nivel 5).
- **Feedback:** sonidos generados por código, pausa breve al recolectar o recibir un golpe, cámara lenta al perder y zoom leve con multiplicador alto.

## 8. Arte, interfaz y audio

- **Estilo:** formas geométricas de colores contrastantes, fondo oscuro con parallax y viñeta. El jugador cambia de color según el multiplicador.
- **HUD:** puntaje, tiempo, combo y multiplicador, progreso de la meta, barra de dash, nivel y barra de rango.
- **Menú:** medalla por nivel y mejor puntaje.
- **Audio:** efectos procedurales (WebAudio), silenciables con M.
- **Idiomas:** español e inglés.

## 9. Alcance

**Implementado en la versión final:**

- Menú con JUGAR, RANKING, LOGROS, CONTROLES, TUTORIAL, OPCIONES, IDIOMA y NUEVOS NIVELES, y el interruptor del **modo modificadores**.
- Campaña de **5 niveles** (sección 6), con generación de mapas por semilla y validación de alcanzabilidad.
- Tutorial, coach al fallar y **5 insignias** de aprendizaje (sección 7).
- Puntaje, combo, cadena aérea, bono de tiempo y **rangos** con medallas (umbrales a ajustar, sección 4.2).
- **Ranking local** de los 10 mejores puntajes de la campaña (iniciales, niveles, combo y fecha), guardado en el navegador, con tabla aparte para el modo modificadores.
- **Logros** (8): Sin caídas, Al máximo, Campeón, Medalla de oro, Oro total, Volando, Velocista y Coleccionista (suma 1000 puntos).
- **Opciones de accesibilidad:** reducir destellos y reducir movimiento (se aplican desde la próxima partida).
- Pausa (Esc), audio procedural, español e inglés.

**Modo modificadores**

Un interruptor del menú. Apagado, el juego es el de siempre. Encendido, al empezar **cada** nivel toca un modificador al azar que lo hace más difícil y suma un bonus al puntaje del nivel (con 5 % de probabilidad tocan dos).

- **Aviso:** se muestra al comienzo del nivel con su nombre y bonus, y queda como etiqueta en el HUD.
- **Reintentos y filtro:** al reintentar se vuelve a sortear, y solo salen modificadores que aplican al mapa (Ráfaga no sale sin proyectiles). Reloj corto y Meta alta no salen juntos.
- **Ranking:** los puntajes de este modo van a una tabla separada.
- **Modificadores:** Reloj corto, Ráfaga, Dash lento, Combo frágil, Un solo punto y Meta alta, con un bonus de +10 a +20 % al puntaje del nivel.

**No implementado (previsto en el diseño original):** retos fijos con medalla, salto doble desbloqueable y skins del personaje.

**Ideas a futuro**

- Estadísticas por nivel (mejor tiempo y mejor combo).
- Modo práctica para rejugar niveles superados.
- Modo diario: mapa con semilla fija por día y ranking propio.
- Contrarreloj de nivel único con "fantasma" de la mejor partida.
- Mecánicas nuevas: gravedad invertida, imanes de puntos, interruptores.
- Soporte de gamepad.