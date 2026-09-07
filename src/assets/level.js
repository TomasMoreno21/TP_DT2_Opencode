export const LEVEL = {
    width: 1024,
    height: 768,
    platforms: [
        // Piso abierto (todo el ancho)
        { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },

        // Pilares libres para wall crawl / wall jump (izq y der)
        { x: 170, y: 470, w: 24, h: 540, color: 0x4a4270 },
        { x: 854, y: 470, w: 24, h: 540, color: 0x4a4270 },

        // Topes de pilares (solo accesibles escalando con wall jump)
        { x: 170, y: 180, w: 130, h: 20, color: 0x5a5a8c },
        { x: 854, y: 180, w: 130, h: 20, color: 0x5a5a8c },

        // Plataformas centrales: escalera saltable y abierta
        { x: 330, y: 630, w: 150, h: 20, color: 0x3a3a5c },
        { x: 694, y: 630, w: 150, h: 20, color: 0x3a3a5c },
        { x: 512, y: 540, w: 180, h: 20, color: 0x3a3a5c },
        { x: 330, y: 440, w: 140, h: 20, color: 0x3a3a5c },
        { x: 694, y: 440, w: 140, h: 20, color: 0x3a3a5c },
        { x: 512, y: 340, w: 160, h: 20, color: 0x3a3a5c },
        // Corona central
        { x: 512, y: 250, w: 160, h: 20, color: 0x5a5a8c }
    ],
    pointSpots: [
        // Piso
        { x: 330, y: 688 },
        { x: 512, y: 688 },
        { x: 694, y: 688 },
        // Escalera central
        { x: 330, y: 606 },
        { x: 694, y: 606 },
        { x: 512, y: 516 },
        { x: 330, y: 416 },
        { x: 694, y: 416 },
        { x: 512, y: 316 },
        // Corona central
        { x: 512, y: 226 },
        // Topes de pilares (wall jump)
        { x: 170, y: 156 },
        { x: 854, y: 156 }
    ]
};