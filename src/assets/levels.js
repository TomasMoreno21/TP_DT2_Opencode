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
        quota: 12,
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
        gems: [
            // Alcanzable encadenando saltos: piso -> plataforma y=620 -> y=540,
            // y desde ahi el arco del salto (apex ~117 px) pasa por esta altura.
            { x: 512, y: 460 }
        ],
        goal: { x: 920, y: 676 }
    },
    {
        id: 2,
        name: 'Rebotes',
        durationSeconds: 55,
        quota: 12,
        spawn: { x: 360, y: 660 },
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
            // Columna central (doble cara para wall jump); termina al ras del
            // alféizar para no tapar el trampolín superior.
            { x: 512, y: 529, w: 44, h: 366, color: 0x453f6b },
            // Escalera izquierda
            { x: 200, y: 634, w: 150, h: 20, color: 0x3a3a5c },
            { x: 300, y: 546, w: 140, h: 20, color: 0x3a3a5c },
            { x: 400, y: 458, w: 140, h: 20, color: 0x3a3a5c },
            // Escalera derecha
            { x: 824, y: 634, w: 150, h: 20, color: 0x3a3a5c },
            { x: 724, y: 546, w: 140, h: 20, color: 0x3a3a5c },
            { x: 624, y: 458, w: 140, h: 20, color: 0x3a3a5c },
            // Remate de la columna: 346 de superficie (bajado 16px respecto del
            // diseño original: la subida desde la fila 3 pedía 118px y el apex
            // del salto es 117.6px, es decir imposible a salto).
            { x: 512, y: 356, w: 200, h: 20, color: 0x3a3a5c },
            // Filas altas
            { x: 300, y: 250, w: 160, h: 20, color: 0x3a3a5c },
            { x: 724, y: 250, w: 160, h: 20, color: 0x3a3a5c },
            // Corona partida en dos con un hueco de 60px sobre la columna: es
            // la boca de salida del trampolín central.
            { x: 452, y: 160, w: 60, h: 20, color: 0x3a3a5c },
            { x: 572, y: 160, w: 60, h: 20, color: 0x3a3a5c }
        ],
        trampolines: [
            // Esquinas libres del piso: sin plataformas encima, techo libre.
            { x: 96, y: 706, w: 80 },
            { x: 928, y: 706, w: 80 },
            // Sobre la escalera izquierda: saltea la fila 2 hacia arriba.
            { x: 178, y: 618, w: 90 },
            // Bajo el hueco de la corona: sube al punto alto y a la gema.
            { x: 512, y: 340, w: 60 }
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
            { x: 512, y: 326 },
            { x: 300, y: 220 },
            { x: 724, y: 220 },
            { x: 512, y: 130 }
        ],
        gems: [
            { x: 512, y: 76 }
        ],
        goal: { x: 824, y: 588 }
    },
    {
        id: 3,
        name: 'Movimiento',
        durationSeconds: 52,
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
            // Fila 1 (y=630): escalera izquierda y derecha + centro
            { x: 180, y: 630, w: 150, h: 20, color: 0x3a3a5c },
            { x: 512, y: 630, w: 170, h: 20, color: 0x3a3a5c },
            { x: 844, y: 630, w: 150, h: 20, color: 0x3a3a5c },
            // Fila 2 (y=540): gran vacío central cruzado por la ferry
            { x: 200, y: 540, w: 170, h: 20, color: 0x3a3a5c },
            { x: 824, y: 540, w: 170, h: 20, color: 0x3a3a5c },
            // Fila 3 (y=450): la derecha queda libre para el corredor del ascensor
            { x: 180, y: 450, w: 150, h: 20, color: 0x3a3a5c },
            { x: 430, y: 450, w: 150, h: 20, color: 0x3a3a5c },
            // Fila 4 (y=360): la derecha queda libre para el corredor del ascensor
            { x: 180, y: 360, w: 150, h: 20, color: 0x3a3a5c },
            { x: 540, y: 360, w: 170, h: 20, color: 0x3a3a5c },
            // Fila 5 (y=270): la derecha es el aterrizaje del ascensor (salida)
            { x: 180, y: 270, w: 150, h: 20, color: 0x3a3a5c },
            { x: 470, y: 270, w: 170, h: 20, color: 0x3a3a5c },
            { x: 810, y: 270, w: 140, h: 20, color: 0x3a3a5c },
            // Fila 6 (y=180)
            { x: 180, y: 180, w: 150, h: 20, color: 0x3a3a5c },
            { x: 560, y: 180, w: 150, h: 20, color: 0x3a3a5c },
            { x: 830, y: 180, w: 130, h: 20, color: 0x3a3a5c },
            // Corona (y=90) desplazada a la derecha: deja libre el salto de la
            // fila 6 izquierda a la fila 6 central.
            { x: 600, y: 90, w: 170, h: 20, color: 0x3a3a5c }
        ],
        trampolines: [
            // Conducto abierto del piso (entre fila 1 izquierda y central):
            // subida recta segura; con deriva a la izquierda aterriza en la fila 2 izquierda.
            { x: 330, y: 706, w: 80 },
            // Esquina derecha libre: con deriva a la izquierda aterriza en la fila 2 derecha.
            { x: 945, y: 706, w: 54 }
        ],
        movingPlatforms: [
            // Ferry horizontal: cruza el vacío central de la fila 2 (45 px de
            // hueco con cada borde). La gema está sobre su recorrido.
            { x: 512, y: 540, w: 110, h: 20, distance: 254, speed: 80, axis: 'x' },
            // Ascensor vertical: del alféizar de la fila 2 derecha al de la
            // fila 5 derecha, por el corredor libre (filas 3 y 4 sin derecha).
            { x: 700, y: 405, w: 70, h: 20, distance: 270, speed: 90, axis: 'y' }
        ],
        pointSpots: [
            // Piso
            { x: 200, y: 688 },
            { x: 880, y: 688 },
            // Fila 1
            { x: 180, y: 600 },
            { x: 844, y: 600 },
            // Fila 2
            { x: 200, y: 510 },
            { x: 824, y: 510 },
            // Fila 3
            { x: 180, y: 420 },
            { x: 430, y: 420 },
            // Fila 4
            { x: 180, y: 330 },
            // Fila 5
            { x: 470, y: 240 },
            // Fila 6
            { x: 830, y: 150 },
            // Corona
            { x: 600, y: 60 }
        ],
        gems: [
            // Sobre el vacío central, a la altura del salto desde la ferry:
            // la ruta obvia es subirla en ferry y saltar.
            { x: 512, y: 450 }
        ],
        goal: { x: 810, y: 224 }
    },
    {
        id: 4,
        name: 'Peligro',
        durationSeconds: 50,
        quota: 14,
        spawn: { x: 110, y: 660 },
        projectiles: {
            initialInterval: 950,
            minInterval: 550,
            maxSpeedMultiplier: 2.25,
            wallGapX: 52,
            variant: 'ricochet'
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
            { x: 724, y: 530, w: 90, offsetMs: 925 }
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
        gems: [
            { x: 330, y: 300 },
            { x: 694, y: 300 }
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
            wallGapX: 52,
            variant: 'rastra'
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
        trampolines: [
            // Rebote del piso izquierdo a la ruta lateral baja
            { x: 200, y: 706, w: 80 }
        ],
        movingPlatforms: [
            // Horizontal que cruza el hueco central del piso (evita los pinchos)
            { x: 512, y: 640, w: 90, h: 20, distance: 200, speed: 80, axis: 'x' }
        ],
        hazards: [
            // Pinchos de piso desfasados: se cruza en la ventana retraída
            { x: 340, y: 708, w: 100 },
            { x: 774, y: 708, w: 100, offsetMs: 800 }
        ],
        portals: [
            // Par izquierdo: piso -> ruta lateral alta (ahorro de recorrido)
            { x: 200, y: 688 },
            { x: 300, y: 360 },
            // Par derecho: piso -> ruta lateral alta
            { x: 824, y: 688 },
            { x: 724, y: 360 }
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
        gems: [
            { x: 300, y: 160 },
            { x: 724, y: 160 },
            { x: 512, y: 90 }
        ],
        goal: { x: 512, y: 230 }
    }
];
