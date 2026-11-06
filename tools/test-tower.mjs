import { buildTower, STYLES } from '../src/systems/TowerLevel.js';
import { ALL_LEVELS as LEVELS, WORLD } from '../src/assets/levels.js';

// Prueba masiva de la torre del nivel 5: reglas de justicia y variedad por semilla.
// Uso: node tools/test-tower.mjs [cantidadSemillas=500] [semillaInicial=1]
const COUNT = Number(process.argv[2] ?? 500);
const FIRST = Number(process.argv[3] ?? 1);
const JUMP_APEX = 139;
const BOUNCE_APEX = 213;
const MAX_GAP = 345;

const counts = {};
const samples = {};
const fail = (rule, seed, detail) => {
    counts[rule] = (counts[rule] ?? 0) + 1;
    (samples[rule] ??= []).length < 3 && samples[rule].push(`semilla ${seed}: ${detail}`);
};
const overlapX = (a, b, m) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + m;
const styleSeen = new Set();
const signatures = new Set();
const sizes = [];

for (let seed = FIRST; seed < FIRST + COUNT; seed++) {
    for (const assist of [0, 2]) {
        const cfg = buildTower(seed, LEVELS[4], assist);
        const { main, extras, sections, need } = cfg.tower;
        const all = main.concat(extras);
        const tag = `${seed}/a${assist}`;

        // Límites del mundo y altura suficiente para toda la partida.
        for (const p of all) if (p.x - p.w / 2 < 0 || p.x + p.w / 2 > WORLD.width) fail('límites', tag, `x=${p.x} w=${p.w}`);
        if (main[main.length - 1].rel < need) fail('altura', tag, 'no alcanza para la partida');

        main.forEach((m, i) => {
            const prev = main[i - 1];
            const next = main[i + 1];

            if (prev) {
                // Alcance vertical: salto normal, o rebote si sale de un trampolín.
                const apex = prev.tramp ? BOUNCE_APEX : JUMP_APEX;

                if (m.rise > apex - 20) fail('alcance vertical', tag, `fila ${i}: sube ${m.rise} (apex ${apex})`);
                if (m.gap > MAX_GAP || m.gap < 40) fail('alcance horizontal', tag, `fila ${i}: hueco ${Math.round(m.gap)}`);
            }

            // Saltos largos: aterrizan en plataformas anchas y sólidas.
            if (m.long && (m.kind !== 'solid' || m.w < 110)) fail('aterrizaje largo', tag, `fila ${i}: ${m.kind} w=${m.w}`);

            // Pinchos: anchos, entre sólidas, salida corta y no tras un rebote.
            if (m.kind === 'spike') {
                if (m.w < 110) fail('pinchos estrechos', tag, `fila ${i}: w=${m.w}`);
                if (prev?.kind !== 'solid' || (next && next.kind !== 'solid')) fail('pinchos seguidos', tag, `fila ${i}`);
                if (next && next.gap > 195) fail('salida de pinchos', tag, `fila ${i}: hueco ${Math.round(next.gap)}`);
                if (prev?.tramp || m.long) fail('pinchos tras rebote/salto largo', tag, `fila ${i}`);
            }

            // Frágiles: solos, o tanda de a lo sumo 3 entre sólidas en `crumble`.
            if (m.kind === 'fragile') {
                let a = i;
                let b = i;

                while (main[a - 1]?.kind === 'fragile') a--;
                while (main[b + 1]?.kind === 'fragile') b++;

                if (b - a + 1 > 3) fail('tanda de frágiles', tag, `filas ${a}-${b}`);
                if (b > a && !main.slice(a, b + 1).every((p) => p.style === 'crumble')) fail('tanda fuera de crumble', tag, `filas ${a}-${b}`);
                if (main[a - 1]?.kind === 'spike' || main[b + 1]?.kind === 'spike') fail('frágil junto a pinchos', tag, `filas ${a}-${b}`);
            }

            // Trampolines solo sobre sólidas anchas.
            if (m.tramp && (m.kind !== 'solid' || m.w < 100)) fail('trampolín mal puesto', tag, `fila ${i}`);
        });

        // Nada tapa la cabeza ni un rebote.
        for (let i = 0; i < all.length; i++) {
            for (let j = i + 1; j < all.length; j++) {
                const a = all[i];
                const b = all[j];
                const dy = a.top - b.top;

                if (overlapX(a, b, 24) && Math.abs(dy) < 130) fail('cabeza', tag, `x=${a.x}/${b.x} dy=${Math.round(dy)}`);

                for (const [pad, over] of [[a, b], [b, a]]) {
                    if (pad.tramp && overlapX(pad, over, 40) && pad.top - over.top > 0 && pad.top - over.top <= 240) fail('techo de rebote', tag, `x=${pad.x}/${over.x}`);
                }
            }
        }

        // Orbes: nunca sobre pinchos y siempre arriba (3 spots por cada ventana de 700 px).
        const spiked = new Set(cfg.hazards.map((h) => `${h.x}|${h.y + 4}`));
        const solidSpots = cfg.pointSpots.filter((s) => !spiked.has(`${s.x}|${s.y + 24}`));

        if (solidSpots.length !== cfg.pointSpots.length) fail('orbe sobre pinchos', tag, '');
        if (cfg.pointSpots.length < 30) fail('pocos orbes', tag, String(cfg.pointSpots.length));

        // Solo mientras queda torre por encima: en la cima no hay nada más que mostrar.
        for (let y = cfg.tower.floorTop; y > 1000; y -= 100) {
            if (cfg.pointSpots.filter((s) => s.y <= y && s.y > y - 700).length < 3) {
                fail('ventana sin orbes', tag, `y=${y}`);
                break;
            }
        }

        // Variedad.
        if (assist === 0) {
            sections.forEach((s) => styleSeen.add(s));
            if (new Set(sections).size < 4) fail('poca variedad de secciones', tag, [...new Set(sections)].join(','));
            signatures.add(main.map((m) => `${m.x}:${m.w}:${m.kind}`).join(','));
            sizes.push(cfg.platforms.length + cfg.fragilePlatforms.length);
        }
    }
}

if (styleSeen.size < Object.keys(STYLES).length) fail('estilos sin usar', '-', `faltan ${Object.keys(STYLES).filter((s) => !styleSeen.has(s)).join(',')}`);
if (signatures.size < COUNT) fail('torres repetidas', '-', `${signatures.size} únicas de ${COUNT}`);

const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;

console.log(`torres: ${COUNT} semillas x 2 asistencias | plataformas por torre: ${Math.min(...sizes)}-${Math.max(...sizes)} (media ${avg.toFixed(0)}) | estilos: ${[...styleSeen].join(', ')}`);

const rules = Object.keys(counts);

if (rules.length === 0) {
    console.log('test-tower: OK');
} else {
    for (const rule of rules) console.log(` - ${rule}: ${counts[rule]} casos (${(samples[rule] ?? []).join(' | ')})`);

    console.log('test-tower: FALLÓ');
    process.exit(1);
}
