export const LEVEL = {
    width: 1024,
    height: 768,
    platforms: [
        // Piso
        { x: 512, y: 740, w: 1024, h: 56, color: 0x3a3a5c },
        // Columnas/paredes a los bordes (para wall grab en Fase 3)
        { x: 40, y: 400, w: 24, h: 720, color: 0x4a4270 },
        { x: 984, y: 400, w: 24, h: 720, color: 0x4a4270 },
        // Columna central para wall grab
        { x: 512, y: 460, w: 24, h: 180, color: 0x4a4270 },
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
    ]
};