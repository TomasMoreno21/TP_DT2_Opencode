export const LEVEL = {
    width: 1024,
    height: 768,
    platforms: [
        // Piso abierto (todo el ancho)
        { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },

        // Paredes de la pantalla (asistencia de wall grab, opcional)
        { x: 30, y: 430, w: 24, h: 620, color: 0x4a4270 },
        { x: 994, y: 430, w: 24, h: 620, color: 0x4a4270 },

        // Plataformas bajas grandes (escalones suaves desde el piso)
        { x: 170, y: 660, w: 240, h: 20, color: 0x3a3a5c },
        { x: 854, y: 660, w: 240, h: 20, color: 0x3a3a5c },

        // Escalera central amplia y suave (saltos cortos)
        { x: 512, y: 600, w: 240, h: 20, color: 0x3a3a5c },
        { x: 512, y: 520, w: 220, h: 20, color: 0x3a3a5c },
        // Corona central
        { x: 512, y: 430, w: 200, h: 20, color: 0x5a5a8c }
    ],
    pointSpots: [
        // Piso
        { x: 170, y: 688 },
        { x: 512, y: 688 },
        { x: 854, y: 688 },
        // Plataformas bajas
        { x: 170, y: 636 },
        { x: 854, y: 636 },
        // Escalera central
        { x: 512, y: 576 },
        { x: 512, y: 496 },
        // Corona central
        { x: 512, y: 406 }
    ]
};