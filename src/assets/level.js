export const LEVEL = {
    width: 1024,
    height: 768,
    platforms: [
        // Piso abierto (todo el ancho)
        { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },

        // Paredes de la pantalla: pilares para wall grab / wall jump
        { x: 30, y: 430, w: 24, h: 620, color: 0x4a4270 },
        { x: 994, y: 430, w: 24, h: 620, color: 0x4a4270 },

        // Topes de las paredes (solo accesibles escalando por el borde)
        { x: 85, y: 150, w: 100, h: 20, color: 0x5a5a8c },
        { x: 939, y: 150, w: 100, h: 20, color: 0x5a5a8c },

        // Plataformas centrales: escalera saltable, separadas y abiertas
        { x: 300, y: 650, w: 140, h: 20, color: 0x3a3a5c },
        { x: 724, y: 650, w: 140, h: 20, color: 0x3a3a5c },
        { x: 512, y: 670, w: 140, h: 20, color: 0x3a3a5c },
        { x: 512, y: 560, w: 150, h: 20, color: 0x3a3a5c },
        { x: 300, y: 470, w: 140, h: 20, color: 0x3a3a5c },
        { x: 724, y: 470, w: 140, h: 20, color: 0x3a3a5c },
        { x: 512, y: 380, w: 150, h: 20, color: 0x3a3a5c },
        { x: 512, y: 300, w: 150, h: 20, color: 0x3a3a5c },
        // Corona central
        { x: 512, y: 220, w: 150, h: 20, color: 0x5a5a8c }
    ],
    pointSpots: [
        // Piso
        { x: 300, y: 688 },
        { x: 724, y: 688 },
        // Escalera central
        { x: 300, y: 626 },
        { x: 724, y: 626 },
        { x: 512, y: 646 },
        { x: 512, y: 536 },
        { x: 300, y: 446 },
        { x: 724, y: 446 },
        { x: 512, y: 356 },
        { x: 512, y: 276 },
        // Corona central
        { x: 512, y: 196 },
        // Topes de las paredes (wall jump)
        { x: 85, y: 126 },
        { x: 939, y: 126 }
    ]
};