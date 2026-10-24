import { WORLD } from '../assets/levels.js';

// Formas "macro" del nivel 2: cada una arma toda la estructura flotante del
// escenario con parámetros al azar. Son builders puros: reciben el rng del
// generador y devuelven datos, sin conocer el resto de las reglas. El generador
// (LevelGenerator._reshapeMacro) las pone en lugar de las plataformas flotantes
// del base; después los filtros y el BFS deciden si el mapa sirve. Piso y
// paredes (x = 40 y 984, 24 de ancho) no se tocan.
//
// Todas conservan el perfil del N2 que exigen los filtros de reparto (las 4
// franjas de pantalla y las 3 alturas ocupadas, spots en las 3 alturas): una
// escalera de tres escalones del lado del spawn que sube hacia el centro y, del
// otro lado, una estructura distinta (torre, pozo, torres, terrazas) pensada
// para wall jump y trampolines. El generador puede espejarlas.

const FLOOR_TOP = WORLD.floorTop;
const PLATFORM_COLOR = 0x3a3a5c;
const COLUMN_COLOR = 0x4a4270;
const WALL_INNER_RIGHT = WORLD.width - 52;
const STEP_RISE_MIN = 84;
const STEP_RISE_MAX = 92;       // el salto sube ~117 px: se deja margen
const TRAMPOLINE_TOP_OFFSET = 6; // y del trampolín = tope de lo que lo sostiene - 6

// Ancho jugable de un pozo de wall jump (hueco entre dos paredes). Calibrado con el
// validador: el pozo valida (todos los spots y la salida alcanzables, esfuerzo 0,9–1,02
// del base) con canales de 80 a 220 px; se usa 110–170 para dejar margen a quien juega
// (el empuje del salto de pared es de ~66 px y el jugador mide 38 corriendo).
export const CHANNEL_MIN = 110;
export const CHANNEL_MAX = 170;

// Zona alrededor del spawn que ninguna forma puede ocupar (el jugador aparece
// ahí: el spawn base está en x = 360 y, espejado, en x = 664).
const SPAWN_CLEAR_HALF = 60;
const SPAWN_CLEAR_TOP = 560;

const plat = (x, top, w, h = 20) => ({ x: Math.round(x), y: Math.round(top + h / 2), w: Math.round(w), h, color: PLATFORM_COLOR });
const tramp = (x, top, w) => ({ x: Math.round(x), y: Math.round(top - TRAMPOLINE_TOP_OFFSET), w: Math.round(w) });
// Pilar: columna que no llega al piso (deja una puerta de DOOR px por debajo), así no
// parte el piso en dos: las columnas apoyadas obligaban a rodearlas por arriba y el
// recorrido salía 1,5–2 veces más largo que el del base.
const DOOR = 130;
const pillar = (x, h, w = 28) => {
    const top = FLOOR_TOP - h;
    const bottom = FLOOR_TOP - DOOR;
    return { x: Math.round(x), y: Math.round((top + bottom) / 2), w, h: Math.round(bottom - top), color: COLUMN_COLOR };
};
const topOf = (p) => p.y - p.h / 2;
const leftOf = (p) => p.x - p.w / 2;
const rightOf = (p) => p.x + p.w / 2;

// Escalera de `tops.length` escalones que avanza hacia `dir` (+1 derecha, -1
// izquierda) desde el borde x0. Los escalones no se superponen en x (el filtro
// `crowded` del generador no deja plataformas nuevas encimadas): cada uno
// arranca unos px después del anterior y se salta de uno al otro.
function stairs(rng, x0, dir, tops, wMax = 150, gapMax = 40) {
    const out = [];
    let edge = x0;
    for (const top of tops) {
        const w = rng.int(110, wMax);
        out.push(plat(edge + dir * w / 2, top, w));
        edge += dir * (w + rng.int(14, gapMax));
    }
    return out;
}

// La escalera del lado del spawn: tres escalones que suben hacia el centro (el
// primero y el segundo quedan fuera de la zona del spawn) y uno más que vuelve
// hacia la pared, más alto. Son 4 plataformas del lado izquierdo: el filtro de
// balance del generador no admite más de 2 de diferencia con el lado derecho.
// Las posiciones son casi fijas para que ocupen siempre las mismas celdas de la
// grilla de reparto (franjas de 230 px x 3 alturas) y los escalones no se
// superpongan en x; son anchos (~135 px) para que entren dos spots separados
// SPOT_MIN_NN en cada uno.
function leftStairs(rng, crown = false) {
    const rise = () => rng.int(STEP_RISE_MIN, STEP_RISE_MAX);
    const t1 = FLOOR_TOP - rise();
    const t2 = t1 - rise();
    const t3 = t2 - rise();
    const t4 = t3 - rise();
    const out = [
        plat(rng.int(145, 168), t1, rng.int(130, 145)),
        plat(rng.int(306, 322), t2, rng.int(128, 136)),
        plat(rng.int(456, 478), t3, rng.int(128, 136)),
        plat(rng.int(205, 268), t4, rng.int(130, 145))
    ];
    // Con `crown`, un quinto escalón alto sobre el tercero (a un salto del cuarto):
    // da lugar para spots en la franja superior.
    if (crown) out.push(plat(rng.int(414, 426), t4 - rng.int(STEP_RISE_MIN, STEP_RISE_MAX), 130));
    return out;
}

const SHAPES = {
    // Torre con repisas del lado derecho: el trampolín del piso al pie de la torre
    // lleva a las repisas, y su pared sirve para el wall jump.
    'escalera-torre'(rng) {
        const platforms = leftStairs(rng, true);
        const colX = rng.int(645, 665);
        const h = rng.int(420, 470);
        platforms.push(pillar(colX, h));
        platforms.push(plat(colX, FLOOR_TOP - h - 20, rng.int(130, 150)));       // remate de la torre (dos spots)
        // Dos repisas a la derecha de la torre, una al lado de la otra (la segunda un
        // escalón más arriba y sin superponerse en x) y el trampolín del piso a su
        // izquierda: el rebote sube junto a la pared de la torre.
        const ledgeW = rng.int(130, 140);
        platforms.push(plat(colX + 14 + ledgeW / 2, FLOOR_TOP - rng.int(120, 130), ledgeW));
        platforms.push(plat(colX + 14 + ledgeW + rng.int(14, 24) + 65, FLOOR_TOP - rng.int(222, 232), 130));
        const trampX = colX - 14 - rng.int(85, 100);
        return { platforms, trampolines: [tramp(trampX, FLOOR_TOP, rng.int(60, 90))], channels: [] };
    },

    // Un pilar pegado a la pared del mapa deja entre ambos un canal angosto (el hueco
    // entre las dos paredes sirve para el wall jump). El pilar no llega al piso: por
    // debajo queda una puerta de 130 px para entrar al canal, donde un trampolín al
    // pie ayuda a arrancar. Arriba, un remate hacia afuera (el canal queda abierto) y
    // dos plataformas a la izquierda del pilar.
    pozo(rng) {
        const width = rng.int(CHANNEL_MIN + 10, CHANNEL_MAX - 10);
        const px = WALL_INNER_RIGHT - width - 14;
        const top = FLOOR_TOP - rng.int(420, 440);
        const bottom = FLOOR_TOP - DOOR;
        const platforms = leftStairs(rng);
        platforms.push(pillar(px, FLOOR_TOP - top));
        platforms.push(plat(px + 14 - 140 / 2, top - 20, 140));
        platforms.push(plat(rng.int(640, 655), FLOOR_TOP - rng.int(82, 86), 130));
        platforms.push(plat(rng.int(690, 705), FLOOR_TOP - rng.int(236, 244), 130));
        return {
            platforms,
            trampolines: [tramp(px + 14 + width / 2, FLOOR_TOP, rng.int(60, 80))],
            channels: [{ x: px + 14 + width / 2, width, y1: top + 30, y2: bottom - 5 }]
        };
    },

    // Dos torres (la segunda pegada a la pared del mapa): entre ambas y entre la
    // segunda y la pared quedan dos canales de wall jump. Remates angostos para
    // no tapar las bocas de los canales.
    'torres-gemelas'(rng) {
        const g2 = rng.int(CHANNEL_MIN + 10, CHANNEL_MAX - 10);   // canal torre-pared
        const g1 = rng.int(CHANNEL_MIN + 10, CHANNEL_MAX - 10);   // canal entre torres
        const x2 = WALL_INNER_RIGHT - g2 - 14;
        const x1 = x2 - 28 - g1;
        const h1 = rng.int(440, 470);
        const h2 = rng.int(300, 340);
        const platforms = leftStairs(rng);
        platforms.push(pillar(x1, h1), pillar(x2, h2));
        // El remate de la primera torre es ancho pero sale hacia afuera (no tapa el
        // canal); el de la segunda es angosto porque tiene un canal a cada lado.
        const capW = rng.int(130, 140);
        platforms.push(plat(x1 + 14 - capW / 2, FLOOR_TOP - h1 - 20, capW), plat(x2, FLOOR_TOP - h2 - 20, 80));
        // Repisa baja en la cara externa de la primera torre.
        platforms.push(plat(x1 - 14 - 70, FLOOR_TOP - rng.int(STEP_RISE_MIN, STEP_RISE_MAX), 140));
        const y1 = FLOOR_TOP - Math.min(h1, h2) + 30;
        return {
            platforms,
            trampolines: [                                   // al pie de cada canal
                tramp(x1 + 14 + g1 / 2, FLOOR_TOP, rng.int(60, 80)),
                tramp(x2 + 14 + g2 / 2, FLOOR_TOP, rng.int(60, 80))
            ],
            channels: [
                { x: x1 + 14 + g1 / 2, width: g1, y1, y2: FLOOR_TOP - 20 },
                { x: x2 + 14 + g2 / 2, width: g2, y1, y2: FLOOR_TOP - 20 }
            ]
        };
    },

    // Terrazas escalonadas a la derecha: cada trampolín, parado en el borde de una,
    // lanza a la siguiente (más alta, corrida hacia un costado).
    terrazas(rng) {
        const platforms = leftStairs(rng);
        const trampolines = [];
        const t1 = plat(rng.int(655, 690), FLOOR_TOP - rng.int(STEP_RISE_MIN, STEP_RISE_MAX), rng.int(180, 210));
        const tw1 = rng.int(60, 80);
        const tx1 = rightOf(t1) - tw1 / 2 - rng.int(10, 20);
        trampolines.push(tramp(tx1, topOf(t1), tw1));
        const t2w = rng.int(130, 165);
        const t2 = plat(Math.min(WALL_INNER_RIGHT - 20 - t2w / 2, tx1 + tw1 / 2 + 70 + t2w / 2), topOf(t1) - rng.int(152, 175), t2w);
        const tw2 = rng.int(60, 80);
        const tx2 = leftOf(t2) + tw2 / 2 + rng.int(10, 20);
        trampolines.push(tramp(tx2, topOf(t2), tw2));
        const t3w = rng.int(125, 155);
        const t3 = plat(tx2 - tw2 / 2 - 70 - t3w / 2, topOf(t2) - rng.int(182, 205), t3w);
        platforms.push(t1, t2, t3);
        platforms.push(plat(rng.int(912, 918), FLOOR_TOP - rng.int(STEP_RISE_MIN, STEP_RISE_MAX), 90));
        return { platforms, trampolines, channels: [] };
    }
};

export const MACRO_SHAPE_NAMES = Object.keys(SHAPES);

// ¿La forma cabe en el mundo, sin superposiciones y sin tapar el spawn?
export function shapeIsSane(shape, spawnX) {
    const boxes = shape.platforms.map((p) => ({ x1: leftOf(p), x2: rightOf(p), y1: p.y - p.h / 2, y2: p.y + p.h / 2 }));
    for (const b of boxes) {
        if (b.x1 < 60 || b.x2 > WORLD.width - 60 || b.y1 < 110) return false;
        if (spawnX !== undefined && b.x2 > spawnX - SPAWN_CLEAR_HALF && b.x1 < spawnX + SPAWN_CLEAR_HALF && b.y2 > SPAWN_CLEAR_TOP) return false;
    }
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i];
            const b = boxes[j];
            if (a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1) return false;
        }
    }
    return true;
}

// Arma la forma `name`; reintenta con otros parámetros hasta 12 veces si no es
// "sana". Devuelve null si ninguno sirve.
export function buildShape(name, rng, spawnX) {
    const build = SHAPES[name];
    if (!build) return null;
    for (let i = 0; i < 12; i++) {
        const shape = build(rng, spawnX);
        if (shapeIsSane(shape, spawnX)) return shape;
    }
    return null;
}
