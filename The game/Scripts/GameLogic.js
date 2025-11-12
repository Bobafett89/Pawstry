class LevelManager {
    level; //number of a created level
    waves; //array of different waves
    entities; //see function initEntitiesArray
    status; //variable which indicates the state of a game

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
            setTimeout(() => this.update(), 1000/tps);
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

class Tower {
}

class Projectile {
}

class Enemy {
}

class AudioManager {
    volume = {
        music: undefined,
        sfx: undefined
    }
    UI = {
        click: new Audio("Assets/Audio/testSound.ogg"),
        towerPlace: new Audio("Assets/Audio/testSound.ogg")
    };
    tower = {
        shoot: new Audio("Assets/Audio/testSound.ogg"),
        generate: new Audio("Assets/Audio/testSound.ogg"),
        buff: new Audio("Assets/Audio/testSound.ogg")
    };
    hit = {
        enemy: new Audio("Assets/Audio/testSound.ogg"),
        tower: new Audio("Assets/Audio/testSound.ogg")
    };
    end = {
        win: new Audio("Assets/Audio/testSound.ogg"),
        lose: new Audio("Assets/Audio/testSound.ogg")
    };
    music = {
       menu: new Audio(),
       level: new Audio()
    };

    constructor() {
        this.volume = this.getVolume();
        this.setVolume();
        this.initVolumeSettings();
        this.testSound();
    }

    getVolume() {
        let sfxVol = localStorage.getItem("sfxVol");
        let musicVol = localStorage.getItem("musicVol");
        if(sfxVol == null || musicVol == null) {
            let defaultVol = 0.5;
            localStorage.setItem("sfxVol", defaultVol);
            localStorage.setItem("musicVol", defaultVol);
            return {music: 0.5, sfx: 0.5};
        } else {
            return {music: Number(musicVol), sfx: Number(sfxVol)};
        }
    }

    setVolume() {
        this.UI.click.volume = this.volume.sfx;
        this.UI.towerPlace.volume = this.volume.sfx;

        this.tower.shoot.volume = this.volume.sfx;
        this.tower.generate.volume = this.volume.sfx;
        this.tower.buff.volume = this.volume.sfx;
        
        this.hit.enemy.volume = this.volume.sfx;
        this.hit.tower.volume = this.volume.sfx;

        this.end.win.volume = this.volume.sfx;
        this.end.lose.volume = this.volume.sfx;

        this.music.menu.volume = this.volume.music;
        this.music.level.volume = this.volume.music;
    }

    initVolumeSettings() {
        let musicSlider = document.getElementById("musicVolInput");
        let musicOutput = document.querySelector("output[for='musicVolInput']");
        let sfxSlider = document.getElementById("sfxVolInput");
        let sfxOutput = document.querySelector("output[for='sfxVolInput']");

        musicSlider.value = this.volume.music;
        musicOutput.textContent = musicSlider.value;
        sfxSlider.value = this.volume.sfx;
        sfxOutput.textContent = sfxSlider.value;

        musicSlider.addEventListener("input", () => musicOutput.textContent = musicSlider.value);
        sfxSlider.addEventListener("input", () => sfxOutput.textContent = sfxSlider.value);
        document.getElementById("settingsApply").addEventListener("click", () => {
            this.volume.music = Number(musicSlider.value);
            this.volume.sfx = Number(sfxSlider.value);
            localStorage.setItem("musicVol", this.volume.music);
            localStorage.setItem("sfxVol", this.volume.sfx);
            this.setVolume();
        });
        document.getElementById("settingsCancel").addEventListener("click", () => {
            musicSlider.value = this.volume.music;
            musicOutput.textContent = musicSlider.value;
            sfxSlider.value = this.volume.sfx;
            sfxOutput.textContent = sfxSlider.value;
        });
    }

    testSound() {
        document.getElementById("settingsTest").addEventListener("click", () => this.UI.click.play());
    }
}