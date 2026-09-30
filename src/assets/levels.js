export const WORLD = {
    width: 1024,
    height: 768,
    floorTop: 712
};

export const LEVELS = [
    {
        id: 1,
        name: 'Arranque',
        durationSeconds: 60,
        quota: 8,
        spawn: { x: 200, y: 650 },
        projectiles: {
            initialInterval: 1700,
            minInterval: 1000,
            maxSpeedMultiplier: 1.5,
            wallGapX: 52
        },
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
        durationSeconds: 55,
        quota: 10,
        spawn: { x: 120, y: 660 },
        projectiles: {
            initialInterval: 1500,
            minInterval: 800,
            maxSpeedMultiplier: 1.8,
            wallGapX: 52
        },
        platforms: [
            // Piso
            { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },
            // Paredes de los bordes
            { x: 40, y: 400, w: 24, h: 720, color: 0x4a4270 },
            { x: 984, y: 400, w: 24, h: 720, color: 0x4a4270 },
            // Columna central (doble cara para wall jump)
            { x: 512, y: 496, w: 44, h: 432, color: 0x453f6b },
            // Escalera izquierda
            { x: 200, y: 634, w: 150, h: 20, color: 0x3a3a5c },
            { x: 300, y: 546, w: 140, h: 20, color: 0x3a3a5c },
            { x: 400, y: 458, w: 140, h: 20, color: 0x3a3a5c },
            // Escalera derecha
            { x: 824, y: 634, w: 150, h: 20, color: 0x3a3a5c },
            { x: 724, y: 546, w: 140, h: 20, color: 0x3a3a5c },
            { x: 624, y: 458, w: 140, h: 20, color: 0x3a3a5c },
            // Remate de la columna
            { x: 512, y: 340, w: 200, h: 20, color: 0x3a3a5c },
            // Filas altas
            { x: 300, y: 250, w: 160, h: 20, color: 0x3a3a5c },
            { x: 724, y: 250, w: 160, h: 20, color: 0x3a3a5c },
            { x: 512, y: 160, w: 170, h: 20, color: 0x3a3a5c }
        ],
        trampolines: [
            { x: 260, y: 706, w: 90 },
            { x: 512, y: 706, w: 110 },
            { x: 764, y: 706, w: 90 },
            { x: 512, y: 324, w: 130 }
        ],
        pointSpots: [
            { x: 300, y: 688 },
            { x: 700, y: 688 },
            { x: 200, y: 604 },
            { x: 824, y: 604 },
            { x: 300, y: 516 },
            { x: 724, y: 516 },
            { x: 400, y: 428 },
            { x: 624, y: 428 },
            { x: 512, y: 310 },
            { x: 300, y: 220 },
            { x: 724, y: 220 },
            { x: 512, y: 130 }
        ],
        goal: { x: 824, y: 588 }
    },
    {
        id: 3,
        name: 'Movimiento',
        durationSeconds: 55,
        quota: 12,
        spawn: { x: 120, y: 660 },
        projectiles: {
            initialInterval: 1200,
            minInterval: 700,
            maxSpeedMultiplier: 2,
            wallGapX: 52
        },
        platforms: [
            // Piso
            { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },
            // Paredes de los bordes
            { x: 40, y: 400, w: 24, h: 720, color: 0x4a4270 },
            { x: 984, y: 400, w: 24, h: 720, color: 0x4a4270 },
            // Fila 1
            { x: 180, y: 630, w: 150, h: 20, color: 0x3a3a5c },
            { x: 512, y: 630, w: 170, h: 20, color: 0x3a3a5c },
            { x: 844, y: 630, w: 150, h: 20, color: 0x3a3a5c },
            // Fila 2
            { x: 300, y: 538, w: 140, h: 20, color: 0x3a3a5c },
            { x: 512, y: 538, w: 140, h: 20, color: 0x3a3a5c },
            { x: 724, y: 538, w: 140, h: 20, color: 0x3a3a5c },
            // Fila 3
            { x: 180, y: 446, w: 130, h: 20, color: 0x3a3a5c },
            { x: 512, y: 446, w: 150, h: 20, color: 0x3a3a5c },
            { x: 844, y: 446, w: 130, h: 20, color: 0x3a3a5c },
            // Fila 4
            { x: 350, y: 354, w: 130, h: 20, color: 0x3a3a5c },
            { x: 674, y: 354, w: 130, h: 20, color: 0x3a3a5c },
            // Corona
            { x: 512, y: 262, w: 170, h: 20, color: 0x3a3a5c }
        ],
        movingPlatforms: [
            // Horizontal: cruza el hueco entre fila 2 central y derecha
            { x: 618, y: 538, w: 110, h: 20, distance: 170, speed: 80, axis: 'x' },
            // Vertical: lleva del piso a la fila 3 derecha
            { x: 790, y: 510, w: 50, h: 20, distance: 180, speed: 65, axis: 'y' }
        ],
        pointSpots: [
            { x: 250, y: 688 },
            { x: 760, y: 688 },
            { x: 180, y: 600 },
            { x: 512, y: 600 },
            { x: 844, y: 600 },
            { x: 300, y: 508 },
            { x: 724, y: 508 },
            { x: 180, y: 416 },
            { x: 512, y: 416 },
            { x: 844, y: 416 },
            { x: 350, y: 324 },
            { x: 674, y: 324 }
        ],
        goal: { x: 844, y: 584 }
    },
    {
        id: 4,
        name: 'Peligro',
        durationSeconds: 50,
        quota: 14,
        spawn: { x: 110, y: 660 },
        projectiles: {
            initialInterval: 1000,
            minInterval: 600,
            maxSpeedMultiplier: 2.2,
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
            { x: 512, y: 708, w: 110, offsetMs: 700 },
            { x: 760, y: 708, w: 110, offsetMs: 1400 },
            // Paso por la fila 1 central
            { x: 512, y: 622, w: 110, offsetMs: 350 },
            // Fila 2 derecha (obliga a cronometrar el cruce al remate)
            { x: 724, y: 530, w: 90, offsetMs: 1050 }
        ],
        powerUps: [
            // Escudo accesible: sobre la plataforma izquierda de la fila 1
            { x: 160, y: 610, respawnMs: 12000 },
            // Escudo de riesgo: flotando sobre la fila 3 central
            { x: 512, y: 420, respawnMs: 14000 },
            // Escudo alto: sobre la fila 4 derecha (reward por subir)
            { x: 694, y: 334, respawnMs: 14000 }
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
        durationSeconds: 60,
        quota: 16,
        spawn: { x: 110, y: 660 },
        projectiles: {
            initialInterval: 800,
            minInterval: 450,
            maxSpeedMultiplier: 2.5,
            wallGapX: 52
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
            // Rutas laterales
            { x: 300, y: 590, w: 150, h: 20, color: 0x3a3a5c },
            { x: 724, y: 590, w: 150, h: 20, color: 0x3a3a5c },
            { x: 300, y: 480, w: 150, h: 20, color: 0x3a3a5c },
            { x: 724, y: 480, w: 150, h: 20, color: 0x3a3a5c },
            { x: 300, y: 370, w: 150, h: 20, color: 0x3a3a5c },
            { x: 724, y: 370, w: 150, h: 20, color: 0x3a3a5c }
        ],
        pointSpots: [
            { x: 200, y: 688 },
            { x: 820, y: 688 },
            { x: 300, y: 560 },
            { x: 724, y: 560 },
            { x: 300, y: 450 },
            { x: 724, y: 450 },
            { x: 300, y: 340 },
            { x: 724, y: 340 },
            { x: 80, y: 500 },
            { x: 944, y: 500 },
            { x: 512, y: 246 },
            { x: 512, y: 146 }
        ],
        goal: { x: 512, y: 230 }
    }
];
