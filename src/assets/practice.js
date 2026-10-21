// Micro-prácticas: mapas mínimos (datos puros) para probar una mecánica nueva
// antes del nivel que la introduce. Se juegan en la escena Game con `practice`.
const COLOR = 0x3a3a5c;
const WALL = 0x4a4270;

const frame = [
    { x: 512, y: 740, w: 1024, h: 56, color: COLOR },
    { x: 40, y: 400, w: 24, h: 720, color: WALL },
    { x: 984, y: 400, w: 24, h: 720, color: WALL }
];

const base = { durationSeconds: 600, quota: 1, projectiles: null, spawn: { x: 200, y: 650 }, goal: { x: 920, y: 676 } };

export const PRACTICE = {
    trampoline: {
        ...base,
        id: 'practice-trampoline',
        spawn: { x: 400, y: 650 },
        platforms: [...frame, { x: 540, y: 330, w: 320, h: 20, color: COLOR }],
        trampolines: [{ x: 512, y: 706, w: 80 }],
        pointSpots: [{ x: 540, y: 306 }]
    },
    hazard: {
        ...base,
        id: 'practice-hazard',
        platforms: frame,
        hazards: [{ x: 512, y: 708, w: 110 }],
        powerUps: [{ x: 160, y: 688, respawnMs: 14000 }],
        pointSpots: [{ x: 800, y: 688 }]
    },
    portal: {
        ...base,
        id: 'practice-portal',
        platforms: [...frame, { x: 760, y: 392, w: 260, h: 20, color: COLOR }],
        portals: [{ x: 200, y: 688 }, { x: 690, y: 360 }],
        pointSpots: [{ x: 860, y: 358 }]
    }
};

// Nivel (índice) que estrena cada mecánica.
export const PRACTICE_BY_LEVEL = { 1: 'trampoline', 3: 'hazard', 4: 'portal' };
