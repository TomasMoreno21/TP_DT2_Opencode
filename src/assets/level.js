export const LEVEL = {
    width: 1024,
    height: 768,
    platforms: [
        // Piso abierto (todo el ancho)
        { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },

        // Paredes de la pantalla: pilares de wall grab / wall jump
        { x: 30, y: 430, w: 24, h: 620, color: 0x4a4270 },
        { x: 994, y: 430, w: 24, h: 620, color: 0x4a4270 },

        // Topes de las paredes: recompensa vertical (solo wall jumping)
        { x: 140, y: 200, w: 180, h: 20, color: 0x5a5a8c },
        { x: 884, y: 200, w: 180, h: 20, color: 0x5a5a8c },

        // Plataformas bajas grandes, elevadas para pasar por abajo
        { x: 170, y: 645, w: 220, h: 20, color: 0x3a3a5c },
        { x: 854, y: 645, w: 220, h: 20, color: 0x3a3a5c },

        // Fila central a la misma altura: dos a los costados, una al centro
        { x: 300, y: 590, w: 160, h: 20, color: 0x3a3a5c },
        { x: 512, y: 590, w: 160, h: 20, color: 0x3a3a5c },
        { x: 724, y: 590, w: 160, h: 20, color: 0x3a3a5c },

        // Corona central (encima de la fila, un salto desde el centro)
        { x: 512, y: 490, w: 200, h: 20, color: 0x5a5a8c }
    ],
    pointSpots: [
        // Piso (pasables por abajo)
        { x: 300, y: 688 },
        { x: 512, y: 688 },
        { x: 724, y: 688 },
        // Plataformas bajas
        { x: 170, y: 621 },
        { x: 854, y: 621 },
        // Fila central
        { x: 300, y: 566 },
        { x: 512, y: 566 },
        { x: 724, y: 566 },
        // Corona central
        { x: 512, y: 466 },
        // Topes de las paredes (recompensa de wall jump)
        { x: 140, y: 176 },
        { x: 884, y: 176 }
    ]
};