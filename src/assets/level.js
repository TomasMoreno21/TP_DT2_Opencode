export const LEVEL = {
    width: 1024,
    height: 768,
    platforms: [
        // Piso
        { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },

        // Paredes de borde (wall grab en los extremos)
        { x: 30, y: 430, w: 24, h: 620, color: 0x4a4270 },
        { x: 994, y: 430, w: 24, h: 620, color: 0x4a4270 },

        // TORRE IZQUIERDA: shaft vertical para wall jump (y 300..740)
        { x: 96, y: 520, w: 24, h: 440, color: 0x4a4270 },
        { x: 210, y: 520, w: 24, h: 440, color: 0x4a4270 },
        { x: 153, y: 270, w: 130, h: 20, color: 0x3a3a5c },

        // ESCALERA CENTRAL: zigzag ascendente (izq -> der -> izq ...)
        { x: 350, y: 630, w: 120, h: 20, color: 0x3a3a5c },
        { x: 560, y: 560, w: 120, h: 20, color: 0x3a3a5c },
        { x: 350, y: 490, w: 120, h: 20, color: 0x3a3a5c },
        { x: 560, y: 420, w: 120, h: 20, color: 0x3a3a5c },
        { x: 350, y: 340, w: 120, h: 20, color: 0x3a3a5c },
        { x: 512, y: 250, w: 120, h: 20, color: 0x3a3a5c },
        // Corona central (tope)
        { x: 512, y: 160, w: 120, h: 20, color: 0x5a5a8c },

        // TORRE DERECHA: shaft vertical para wall jump (y 340..740)
        { x: 800, y: 540, w: 24, h: 400, color: 0x4a4270 },
        { x: 914, y: 540, w: 24, h: 400, color: 0x4a4270 },
        { x: 857, y: 320, w: 130, h: 20, color: 0x3a3a5c }
    ],
    pointSpots: [
        // Piso
        { x: 350, y: 688 },
        { x: 700, y: 688 },
        // Shaft izquierdo (se requiere wall grab/wall jump para tomarlo)
        { x: 120, y: 560 },
        // Tope de la torre izquierda
        { x: 153, y: 246 },
        // Escalera central
        { x: 350, y: 606 },
        { x: 560, y: 536 },
        { x: 350, y: 466 },
        { x: 560, y: 396 },
        { x: 350, y: 316 },
        { x: 512, y: 226 },
        // Corona central
        { x: 512, y: 136 },
        // Shaft derecho
        { x: 860, y: 560 },
        // Tope de la torre derecha
        { x: 857, y: 296 }
    ]
};