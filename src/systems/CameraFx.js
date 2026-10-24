import { Actions } from 'phaser';
import { FEEL } from '../assets/feel';
import { Settings } from './Settings';

// Efectos de la cámara principal: sacudidas con nombre, destellos, punch de zoom y
// bloom (filtro de Phaser 4). Un solo lugar para respetar, más adelante, las opciones
// de accesibilidad (reducir movimiento / destellos, ver docs/PLAN_FEEL.md §8.4).
export class CameraFx {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        // Opciones de accesibilidad (menú OPCIONES): se leen al crear la escena.
        this.reduceMotion = Settings.reduceMotion;
        this.reduceFlash = Settings.reduceFlash;
        this.bloom = null;
        this.gray = null;
    }

    // Sacudida por nombre: ver FEEL.shake.
    shake(name) {
        if (this.reduceMotion) {
            return;
        }

        this.camera.shake(...FEEL.shake[name]);
    }

    flash(ms, r, g, b) {
        if (this.reduceFlash) {
            return;
        }

        this.camera.flash(ms, r, g, b);
    }

    // Golpe de zoom breve: sube y vuelve. No pisa al zoom por combo (usa zoomTo).
    punch(scale = FEEL.zoom.punch, ms = FEEL.zoom.punchMs) {
        if (this.reduceMotion) {
            return;
        }

        const base = this.camera.zoom;

        this.scene.tweens.add({
            targets: this.camera,
            zoom: base * scale,
            duration: ms,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }

    // Quita el color de la pantalla poco a poco (la muerte "apaga" el mundo).
    desaturate(ms = 600) {
        if (this.reduceFlash) {
            return;
        }

        this.gray ??= this.camera.filters.external.addColorMatrix();

        const t = { v: 0 };

        this.scene.tweens.add({
            targets: t, v: 1, duration: ms,
            onUpdate: () => this.gray.colorMatrix.saturate(-t.v)
        });
    }

    // Bloom de pantalla completa. Se arma una sola vez y después solo se activa o
    // desactiva (parallelFilters.active), así que alternarlo es barato.
    setBloom(on, config = FEEL.bloom) {
        if (on && !this.bloom) {
            this.bloom = Actions.AddEffectBloom(this.camera, config)[0];
        }

        if (this.bloom) {
            this.bloom.parallelFilters.active = on;
        }
    }

    get bloomActive() {
        return Boolean(this.bloom && this.bloom.parallelFilters.active);
    }
}
