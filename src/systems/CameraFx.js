import { Actions } from 'phaser';
import { FEEL } from '../assets/feel';

// Efectos de la cámara principal: sacudidas con nombre, destellos, punch de zoom y
// bloom (filtro de Phaser 4). Un solo lugar para respetar, más adelante, las opciones
// de accesibilidad (reducir movimiento / destellos, ver docs/PLAN_FEEL.md §8.4).
export class CameraFx {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.reduceMotion = false;
        this.reduceFlash = false;
        this.bloom = null;
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
