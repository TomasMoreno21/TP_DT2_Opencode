import { Lang } from './Texts';
import { LEADERBOARD_SIZE } from './Leaderboard';

const ROW_H = 38;
const WIDTH = 680;
const PLACE_COLORS = ['#ffdd44', '#d8d8e8', '#e0905a'];

function formatDate (timestamp) {
    const d = new Date(timestamp);

    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Tabla del Top 10 (siempre 10 filas; las libres se ven como "---"). Se usa en la
// escena Ranking y en la pantalla de fin de partida. Devuelve un container con
// origen en el centro-arriba de la tabla.
export function createRankingTable (scene, x, y, entries, highlightId = null) {
    const items = [];
    const text = (cx, cy, str, color, opts = {}) => scene.add.text(cx, cy, str, {
        fontFamily: opts.font ?? 'Arial Black', fontSize: opts.size ?? 20, color
    }).setOrigin(opts.originX ?? 0.5, 0.5);

    const bg = scene.add.graphics();
    bg.fillStyle(0x1b1836, 0.92).fillRoundedRect(-WIDTH / 2, -8, WIDTH, ROW_H * (LEADERBOARD_SIZE + 1) + 16, 16);
    bg.lineStyle(2, 0x2a2a5a, 1).strokeRoundedRect(-WIDTH / 2, -8, WIDTH, ROW_H * (LEADERBOARD_SIZE + 1) + 16, 16);
    items.push(bg);

    const cols = { rank: -300, name: -250, score: -10, levels: 90, combo: 185, date: 315 };
    const head = '#8888aa';
    items.push(
        text(cols.rank, ROW_H / 2, '#', head, { size: 14, originX: 0 }),
        text(cols.name, ROW_H / 2, Lang.t('colName'), head, { size: 14, originX: 0 }),
        text(cols.score, ROW_H / 2, Lang.t('colScore'), head, { size: 14, originX: 1 }),
        text(cols.levels, ROW_H / 2, Lang.t('colLevels'), head, { size: 14 }),
        text(cols.combo, ROW_H / 2, Lang.t('colCombo'), head, { size: 14 }),
        text(cols.date, ROW_H / 2, Lang.t('colDate'), head, { size: 14, originX: 1 })
    );

    let highlightRow = null;

    for (let i = 0; i < LEADERBOARD_SIZE; i++) {
        const entry = entries[i];
        const cy = ROW_H * (i + 1) + ROW_H / 2;
        const color = entry ? (PLACE_COLORS[i] ?? '#ffffff') : '#3a3a5c';
        const isMine = entry && entry.id === highlightId;

        if (isMine) {
            highlightRow = scene.add.rectangle(0, cy, WIDTH - 16, ROW_H - 4, 0x00d1b2, 0.28);
            items.push(highlightRow);
        }

        items.push(text(cols.rank, cy, String(i + 1), color, { originX: 0 }));

        if (!entry) {
            items.push(text(cols.name, cy, '---', color, { originX: 0 }));
            continue;
        }

        items.push(
            text(cols.name, cy, entry.name, color, { originX: 0, size: 22 }),
            text(cols.score, cy, String(entry.score), '#ffffff', { originX: 1 }),
            text(cols.levels, cy, `${entry.victory ? '★ ' : ''}${entry.levels}`, entry.victory ? '#ffdd44' : '#cccccc', { size: 18 }),
            text(cols.combo, cy, `x${entry.combo}`, '#ffaa44', { size: 18 }),
            text(cols.date, cy, formatDate(entry.date), '#8888aa', { size: 16, font: 'Arial', originX: 1 })
        );
    }

    if (highlightRow) {
        scene.tweens.add({ targets: highlightRow, alpha: 0.08, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    return scene.add.container(x, y, items);
}
