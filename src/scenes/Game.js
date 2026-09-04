import { Scene } from 'phaser';
import { Level } from '../systems/Level';
import { Player } from '../entities/Player';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x1a1a2e);

        this.level = new Level(this);
        this.player = new Player(this, 200, 650);

        this.physics.add.collider(this.player.rect, this.level.platforms);
    }

    update ()
    {
        this.player.update();
    }
}