class LevelManager {
    level; //number of a created level
    waves; //array of different waves
    entities; //see function initEntitiesArray
    status; //variable which indicates the state of a game
    cellSize = {x: 196, y: 132}; //object which stores size of the cells in pixels
    tps = 30; //ticks per seconds - similiar to frames per second

    constructor(level, waves) {
        this.level = level;
        this.waves = waves;
        this.status = "running";

        this.initEntitiesArray();
        this.createButtons();
        this.createCells();
        this.update();
    }

    update() { //main function where most of the logic takes place and which is called each tick
        console.log(`Status: ${this.status}`);
        if(this.status == "running") {
            setTimeout(() => this.update(), 1000/this.tps);
        }
    }

    createCells() { //creates html elements which represent cells
        let cells = "";
        let lanes = (this.level < 3) ? (1 + this.level * 2) : 5;
        for(let i = 0; i < lanes; i++) {
            for(let j = 0; j < 9; j++) {
                cells += `<div id="cell_${i}_${j}" class="Cell"></div>`;
            }
        }
        document.getElementById("cells").innerHTML = cells;
    }

    initEntitiesArray() { //creates arrays of arrays of cells, enemies and projectiles where inner arrays represent one lane
        this.entities = {
            cells: [],
            enemies: [],
            projectiles: []
        }
        let lanes = (this.level < 3) ? (1 + this.level * 2) : 5;
        for(let i = 0; i < lanes; i++) {
            this.entities.cells.push([]);
            this.entities.enemies.push([]);
            this.entities.projectiles.push([]);
        }
    }

    createButtons() { //assigns functions to buttons
        document.getElementById("exitUI").addEventListener("click", () => this.exit());
    }

    exit() { //ends update function and switches screens
        this.status = "lose";
        document.getElementById("levelLoader").hidden = false;
        document.getElementById("level").hidden = true;
    }
}

class AudioManager {
}

class Tower {
}

class Projectile {
}

class Enemy {
}