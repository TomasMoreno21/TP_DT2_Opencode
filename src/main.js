import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Pause } from './scenes/Pause';
import { Ranking } from './scenes/Ranking';
import { Preloader } from './scenes/Preloader';
import { AUTO, Game as PhaserGame, Scale } from 'phaser';

const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GameOver,
        Ranking,
        Pause
    ]
};

const StartGame = (parent) => {

    const game = new PhaserGame({ ...config, parent });

    // Solo en desarrollo: acceso desde la consola y el overlay de debug (Vite lo quita del build).
    if (import.meta.env.DEV) {
        window.__game = game;
        import('./systems/DebugOverlay').then(({ installDebugOverlay }) => installDebugOverlay(game));
    }

    return game;

};

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('startup-message')?.remove();
    StartGame('game-container');

});