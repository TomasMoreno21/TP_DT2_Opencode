export const WORLD = {
    width: 1024,
    height: 768,
    floorTop: 712
};

export const ALL_LEVELS = [
    {
        id: 1,
        name: 'Arranque',
        durationSeconds: 60,
        quota: 12,
        spawn: { x: 200, y: 684 },
        // N1 sin proyectiles: nivel de arranque tranqui (reversible).
        projectiles: null,
        platforms: [
            // Piso
            { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },
            // Columnas/paredes a los bordes (para wall grab)
            { x: 40, y: 400, w: 24, h: 720, color: 0x4a4270 },
            { x: 984, y: 400, w: 24, h: 720, color: 0x4a4270 },
            // Plataformas flotantes - fila baja
            { x: 200, y: 620, w: 140, h: 20, color: 0x3a3a5c },
            { x: 512, y: 540, w: 200, h: 20, color: 0x3a3a5c },
            { x: 824, y: 620, w: 140, h: 20, color: 0x3a3a5c },
            // Plataformas flotantes - fila media
            { x: 150, y: 420, w: 120, h: 20, color: 0x3a3a5c },
            { x: 400, y: 320, w: 120, h: 20, color: 0x3a3a5c },
            { x: 640, y: 320, w: 120, h: 20, color: 0x3a3a5c },
            { x: 880, y: 420, w: 120, h: 20, color: 0x3a3a5c },
            // Plataformas flotantes - fila alta
            { x: 300, y: 180, w: 160, h: 20, color: 0x3a3a5c },
            { x: 720, y: 180, w: 160, h: 20, color: 0x3a3a5c }
        ],
        pointSpots: [
            // Sobre el piso
            { x: 250, y: 688 },
            { x: 512, y: 688 },
            { x: 800, y: 688 },
            // Sobre plataformas - fila baja
            { x: 200, y: 596 },
            { x: 512, y: 516 },
            { x: 824, y: 596 },
            // Sobre plataformas - fila media
            { x: 150, y: 396 },
            { x: 400, y: 296 },
            { x: 640, y: 296 },
            { x: 880, y: 396 },
            // Sobre plataformas - fila alta
            { x: 300, y: 156 },
            { x: 720, y: 156 }
        ],
        goal: { x: 920, y: 676 }
    },
    {
        id: 2,
        name: 'Rebotes',
        durationSeconds: 50,
        quota: 10,
        spawn: { x: 360, y: 660 },
        projectiles: {
            initialInterval: 2000,
            minInterval: 1200,
            maxSpeedMultiplier: 1.3,
            wallGapX: 52
        },
        platforms: [
            // Piso
            { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },
            // Paredes de los bordes
            { x: 40, y: 400, w: 24, h: 720, color: 0x4a4270 },
            { x: 984, y: 400, w: 24, h: 720, color: 0x4a4270 },
            // Escalera izquierda (el primer escalón, angosto y corrido: deja libre la
            // zona del trampolín de la esquina)
            { x: 236, y: 634, w: 110, h: 20, color: 0x3a3a5c },
            { x: 300, y: 546, w: 140, h: 20, color: 0x3a3a5c },
            { x: 400, y: 458, w: 140, h: 20, color: 0x3a3a5c },
            // Escalera derecha
            { x: 788, y: 634, w: 110, h: 20, color: 0x3a3a5c },
            { x: 724, y: 546, w: 140, h: 20, color: 0x3a3a5c },
            { x: 624, y: 458, w: 140, h: 20, color: 0x3a3a5c },
            // Remate central (sin columna debajo: el medio queda libre): 346 de
            // superficie; se sube desde las escaleras (la subida desde la fila 3
            // pide 102 px, el apex del salto es 117,6 px).
            { x: 512, y: 356, w: 200, h: 20, color: 0x3a3a5c },
            // Filas altas
            { x: 300, y: 250, w: 160, h: 20, color: 0x3a3a5c },
            { x: 724, y: 250, w: 160, h: 20, color: 0x3a3a5c },
            // Corona partida en dos con un hueco de 98 px sobre el trampolín central:
            // su rebote sube recto sin chocar.
            { x: 433, y: 160, w: 60, h: 20, color: 0x3a3a5c },
            { x: 591, y: 160, w: 60, h: 20, color: 0x3a3a5c }
        ],
        trampolines: [
            // Esquinas libres del piso: sin plataformas encima, techo libre.
            { x: 96, y: 706, w: 80 },
            { x: 928, y: 706, w: 80 },
            // Bajo el hueco de la corona: sube al punto alto y a la gema.
            { x: 512, y: 340, w: 60 }
        ],
        pointSpots: [
            { x: 300, y: 688 },
            { x: 700, y: 688 },
            { x: 236, y: 604 },
            { x: 788, y: 604 },
            { x: 300, y: 516 },
            { x: 724, y: 516 },
            { x: 400, y: 428 },
            { x: 624, y: 428 },
            { x: 440, y: 326 },
            { x: 300, y: 220 },
            { x: 724, y: 220 },
            { x: 512, y: 130 }
        ],
        goal: { x: 788, y: 588 }
    },
    {
        id: 3,
        name: 'Frágiles',
        durationSeconds: 50,
        quota: 13,
        spawn: { x: 120, y: 684 },
        // Proyectiles apenas mas rapidos que los del N2, con progresion muy lenta.
        projectiles: {
            initialInterval: 1850,
            minInterval: 1100,
            maxSpeedMultiplier: 1.35,
            wallGapX: 52
        },
        platforms: [
            // Piso
            { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },
            // Paredes de los bordes
            { x: 40, y: 400, w: 24, h: 720, color: 0x4a4270 },
            { x: 984, y: 400, w: 24, h: 720, color: 0x4a4270 },
            // Ruta segura (lenta): zigzag por la izquierda y el centro hasta la salida.
            { x: 170, y: 630, w: 190, h: 20, color: 0x3a3a5c },
            { x: 340, y: 540, w: 150, h: 20, color: 0x3a3a5c },
            { x: 170, y: 450, w: 170, h: 20, color: 0x3a3a5c },
            { x: 340, y: 360, w: 150, h: 20, color: 0x3a3a5c },
            { x: 520, y: 270, w: 170, h: 20, color: 0x3a3a5c },
            { x: 880, y: 270, w: 190, h: 20, color: 0x3a3a5c }
        ],
        // Ruta rapida (a la derecha): cada una cae 0,7 s despues de pisarla y vuelve a los 3 s.
        fragilePlatforms: [
            { x: 560, y: 630, w: 150 },
            { x: 740, y: 540, w: 140 },
            { x: 880, y: 450, w: 140 },
            { x: 520, y: 450, w: 130 },
            { x: 720, y: 360, w: 130 }
        ],
        gems: [
            { x: 880, y: 362 }
        ],
        pointSpots: [
            { x: 200, y: 688 },
            { x: 880, y: 688 },
            { x: 170, y: 600 },
            { x: 560, y: 600 },
            { x: 340, y: 510 },
            { x: 740, y: 510 },
            { x: 170, y: 420 },
            { x: 880, y: 420 },
            { x: 520, y: 420 },
            { x: 340, y: 330 },
            { x: 720, y: 330 },
            { x: 520, y: 240 }
        ],
        goal: { x: 880, y: 224 }
    },
    {
        id: 4,
        name: 'Peligro',
        durationSeconds: 47,
        quota: 14,
        spawn: { x: 110, y: 684 },
        // Proyectil estandar con ritmo mas rapido que el N3 (el ricochet queda para el N5).
        projectiles: {
            initialInterval: 1350,
            minInterval: 820,
            maxSpeedMultiplier: 1.7,
            wallGapX: 52
        },
        platforms: [
            // Piso
            { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },
            // Paredes de los bordes
            { x: 40, y: 400, w: 24, h: 720, color: 0x4a4270 },
            { x: 984, y: 400, w: 24, h: 720, color: 0x4a4270 },
            // Fila 1 (plataformas angostas)
            { x: 160, y: 636, w: 130, h: 20, color: 0x3a3a5c },
            { x: 512, y: 636, w: 150, h: 20, color: 0x3a3a5c },
            { x: 864, y: 636, w: 130, h: 20, color: 0x3a3a5c },
            // Fila 2
            { x: 300, y: 544, w: 120, h: 20, color: 0x3a3a5c },
            { x: 724, y: 544, w: 120, h: 20, color: 0x3a3a5c },
            // Fila 3
            { x: 150, y: 452, w: 110, h: 20, color: 0x3a3a5c },
            { x: 512, y: 452, w: 130, h: 20, color: 0x3a3a5c },
            { x: 874, y: 452, w: 110, h: 20, color: 0x3a3a5c },
            // Fila 4
            { x: 330, y: 360, w: 120, h: 20, color: 0x3a3a5c },
            { x: 694, y: 360, w: 120, h: 20, color: 0x3a3a5c },
            // Remate central
            { x: 512, y: 268, w: 150, h: 20, color: 0x3a3a5c }
        ],
        hazards: [
            // Sobre el piso (desfasados entre sí)
            { x: 260, y: 708, w: 110 },
            { x: 512, y: 708, w: 110, offsetMs: 600 },
            { x: 760, y: 708, w: 110, offsetMs: 1250 },
            // Paso por la fila 1 central
            { x: 512, y: 622, w: 110, offsetMs: 275 },
            // Fila 2 derecha (obliga a cronometrar el cruce al remate)
            { x: 724, y: 530, w: 76, offsetMs: 925 }
        ],
        powerUps: [
            // Escudo accesible: sobre la plataforma izquierda de la fila 1
            { x: 160, y: 610, respawnMs: 14000 },
            // Escudo de riesgo: flotando sobre la fila 3 central
            { x: 512, y: 420, respawnMs: 16000 },
            // Escudo alto: sobre la plataforma de la fila 4 derecha
            { x: 694, y: 334, respawnMs: 16000 }
        ],
        pointSpots: [
            { x: 280, y: 688 },
            { x: 740, y: 688 },
            { x: 160, y: 606 },
            { x: 512, y: 606 },
            { x: 864, y: 606 },
            { x: 300, y: 514 },
            { x: 724, y: 514 },
            { x: 150, y: 422 },
            { x: 512, y: 422 },
            { x: 874, y: 422 },
            { x: 330, y: 330 },
            { x: 694, y: 330 }
        ],
        goal: { x: 512, y: 222 }
    },
    {
        id: 5,
        name: 'Final',
        durationSeconds: 55,
        quota: 18,
        spawn: { x: 110, y: 660 },
        projectiles: {
            initialInterval: 1100,
            minInterval: 680,
            maxSpeedMultiplier: 1.9,
            wallGapX: 52,
            variant: 'ricochet'
        },
        platforms: [
            // Piso
            { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },
            // Paredes de los bordes
            { x: 40, y: 400, w: 24, h: 720, color: 0x4a4270 },
            { x: 984, y: 400, w: 24, h: 720, color: 0x4a4270 },
            // Torre central (wall jump en ambas caras)
            { x: 512, y: 500, w: 60, h: 424, color: 0x453f6b },
            { x: 512, y: 276, w: 200, h: 20, color: 0x3a3a5c },
            { x: 512, y: 176, w: 170, h: 20, color: 0x3a3a5c },
            // Rutas laterales (40 px hacia la torre: el pasillo del trampolín queda libre)
            { x: 340, y: 590, w: 150, h: 20, color: 0x3a3a5c },
            { x: 684, y: 590, w: 150, h: 20, color: 0x3a3a5c },
            { x: 340, y: 370, w: 150, h: 20, color: 0x3a3a5c },
            { x: 684, y: 370, w: 150, h: 20, color: 0x3a3a5c }
        ],
        trampolines: [
            // Rebote del piso izquierdo a la ruta lateral baja
            { x: 200, y: 706, w: 80 }
        ],
        fragilePlatforms: [
            // Pisos intermedios de las rutas laterales: se desmoronan al pisarlos.
            { x: 340, y: 480, w: 150 },
            { x: 684, y: 480, w: 150 },
            // Atajos fragiles hacia el costado de la torre.
            { x: 150, y: 520, w: 110 },
            { x: 874, y: 520, w: 110 }
        ],
        powerUps: [
            // Respiro en el piso, entre la torre y los pinchos de la derecha.
            { x: 610, y: 688, respawnMs: 16000 }
        ],
        hazards: [
            // Pinchos de piso desfasados: se cruza en la ventana retraída
            { x: 340, y: 708, w: 100 },
            { x: 774, y: 708, w: 100, offsetMs: 800 }
        ],
        portals: [
            // Par izquierdo: piso -> ruta lateral alta (ahorro de recorrido)
            { x: 200, y: 688 },
            { x: 340, y: 360 },
            // Par derecho: piso -> ruta lateral alta
            { x: 824, y: 688 },
            { x: 684, y: 360 }
        ],
        pointSpots: [
            { x: 200, y: 688 },
            { x: 820, y: 688 },
            { x: 340, y: 560 },
            { x: 684, y: 560 },
            { x: 340, y: 450 },
            { x: 684, y: 450 },
            { x: 340, y: 340 },
            { x: 684, y: 340 },
            { x: 80, y: 500 },
            { x: 944, y: 500 },
            { x: 512, y: 246 },
            { x: 512, y: 146 }
        ],
        goal: { x: 512, y: 230 }
    }
];

// Campaña completa de 5 niveles (N3 frágiles, N4 pinchos y escudo, N5 portales y combinación).
export const ACTIVE_LEVELS = 5;
export const LEVELS = ALL_LEVELS.slice(0, ACTIVE_LEVELS);
