## AGENTS.md

## Proyecto

**Fast Move** - Videojuego de plataformas *time-attack* desarrollado para el Trabajo Práctico del Módulo 7 de Desarrollo Tecnológico.

## Stack

- JavaScript
- Node.js
- Vite
- Phaser 4

## Objetivo

Desarrollar un videojuego pequeño aplicando:
- Buenas prácticas de organización de código.
- Desarrollo asistido por agentes de programación.

## Diseño del juego

- **Género**: plataformas 2D, time-attack.
- **Objetivo**: conseguir la máxima cantidad de puntos en 60 segundos.
- **Mapa**: escenario fijo a pantalla única, con plataformas y paredes.
- **Jugador**: movimiento, salto (variable, con coyote time y buffer) y wall grab / wall jump.
- **Puntos**: aparecen en spots fijos; al recolectar uno se activa otro spot al azar, con combo y multiplicador hasta x5.
- **Obstáculos**: proyectiles que nacen en las paredes de los bordes (homing ~0,5s y luego línea recta acelerada), con dificultad progresiva.
- **Derrota**: recibir el impacto de un proyectil -> pantalla con opciones Reiniciar/Salir.
- **Fin de partida**: al cumplirse el minuto se muestra el resumen con el puntaje final y el mejor puntaje (localStorage).
- **Flujo**: iniciar -> jugar -> victoria/derrota -> reiniciar.

## Arquitectura

El proyecto está organizado de la siguiente manera:

```
src/
├── main.js
├── scenes/
├── entities/
├── systems/
├── patterns/
└── assets/
```

## Reglas para el agente

- Utilizar JavaScript únicamente.
- No agregar TypeScript.
- Utilizar Phaser.
- Mantener las clases pequeñas y con responsabilidades claras.
- Evitar concentrar toda la lógica en GameScene.
- Evitar lógica duplicada y variables globales innecesarias.
- No agregar dependencias externas sin justificar su necesidad.
- Priorizar soluciones comprensibles y respetar la arquitectura existente.
- No modificar los controles ni las mecánicas centrales sin avisar al equipo.
- Cada fase cierra con commit y push; antes de avanzar con una fase se revisa el resultado.

## Flujo de trabajo

Antes de realizar cambios importantes:
1. Analizar el código existente.
2. Explicar brevemente el cambio propuesto (modo Plan).
3. Identificar las clases afectadas.
4. Implementar el cambio, verificar y refactorizar si es necesario (modo Build).

## Comandos

- Instalar dependencias: `npm install`
- Ejecutar: `npm run dev`
- Build: `npm run build`
- Build y dev sin telemetría: `npm run dev-nolog` / `npm run build-nolog`