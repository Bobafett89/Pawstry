class LevelManager {
    levelInfo = {
        currentLevel: undefined,
        lanes: undefined
    }; //info about level
    waveInfo = {
        waves: undefined, //array of waves
        currentWave: 0
    }; //info about waves
    entities = {
        towers: [],
        enemies: [],
        projectiles: []
    }; //object of arrays inside which arrays represent lanes containing entities
    status; //variable which indicates the state of a game
    firstCell = { x: 176, y: 413 }; //position of the center of the first (top-left) cell
    spriteOffset = {
        basicEnemy: { x: 53, y: 53 },
        toughEnemy: { x: 95, y: 69 }
    }; //halfed dimensions of sprites which are used to place entities correctly
    buttonControl = new AbortController(); //object which is used to delete all created eventListeners inside LevelManager

    constructor(level, waves) {
        this.levelInfo = {
            currentLevel: level,
            lanes: (level < 3) ? (1 + level * 2) : 5
        };
        this.waveInfo.waves = waves;
        this.status = "running";

        this.initEntitiesArrays();
        this.createButtons();
        this.createCells();
        this.killEnemyDebug();
        this.update();
    }

    update() { //main function where most of the logic takes place and which is called each tick
        console.log(`Status: ${this.status}`);

        if (this.status == "running") {
            this.waveManager();
            this.entities.enemies.forEach(lane => lane.forEach(enemy => enemy.move()));

            setTimeout(() => this.update(), 1000 / tps);
        } else if (this.status == "win" || this.status == "lose") {
            document.getElementById("endScreen").hidden = false;
            document.getElementById("endMessage").innerHTML = (this.status == "win") ? ("Victory!!!") : ("Defeat...");
            this.status = "wait";
            setTimeout(() => this.update(), 100);
        } else if (this.status == "wait") {
            setTimeout(() => this.update(), 100);
        } else if (this.status == "exit") {
            this.exit();
        }
    }

    createCells() { //creates html elements which represent cells
        let cells = "";
        for (let i = 0; i < this.levelInfo.lanes; i++) {
            for (let j = 0; j < 9; j++) {
                cells += `<div id="cell_${i}_${j}" class="Cell"></div>`;
            }
        }
        document.getElementById("cells").innerHTML = cells;
    }

    initEntitiesArrays() { //fills entities arrays with array which represent lanes
        for (let i = 0; i < this.levelInfo.lanes; i++) {
            this.entities.towers.push([]);
            this.entities.towers[i].length = 9;
            this.entities.enemies.push([]);
            this.entities.projectiles.push([]);
        }
        console.log(this)
    }

    createButtons() { //assigns actions to buttons
        document.getElementById("exitUI").addEventListener("click", () => this.status = "exit", { signal: this.buttonControl.signal });
        document.getElementById("endButton").addEventListener("click", () => this.status = "exit", { signal: this.buttonControl.signal });
    }

    exit() { //removes entities, eventListeners and switches screens
        this.entities.enemies.forEach(lane => lane.forEach(enemy => document.getElementById(enemy.id).remove()));
        this.buttonControl.abort();
        document.getElementById("endScreen").hidden = true;
        document.getElementById("level").hidden = true;
        document.getElementById("levelLoader").hidden = false;
    }

    spawnEnemy(id, lane, type) { //spawns enemy with set id, lane and type
        let offset;
        switch (type) {
            case "Basic":
                offset = this.spriteOffset.basicEnemy.y;
                break;
            case "Tough":
                offset = this.spriteOffset.toughEnemy.y;
                break;
            case "Fast":
                offset = this.spriteOffset.basicEnemy.y;
                break;
        }
        let position = {
            x: this.firstCell.x + cellSize.x * 8.5,
            y: (this.firstCell.y + cellSize.y * lane) - offset
        };
        let enemy = new Enemy(id, position, type);
        this.entities.enemies[lane].push(enemy);
        document.getElementById("gameScreen").innerHTML += enemy.createSprite();
    }

    spawnWave() {//spawns enemies of the current wave
        let waveNumber = this.waveInfo.currentWave;
        let wave = this.waveInfo.waves[waveNumber];
        while (wave > 0) {
            let type, idLeft;
            let randomLane = Math.floor(Math.random() * this.levelInfo.lanes);
            if (wave > 99) {
                type = "Fast";
                idLeft = Math.floor(wave / 100);
                wave -= 100;
            } else if (wave > 9) {
                type = "Tough";
                idLeft = Math.floor(wave / 10);
                wave -= 10;
            } else {
                type = "Basic";
                idLeft = wave;
                wave--;
            }
            this.spawnEnemy(`${type}_${waveNumber}_${idLeft}`, randomLane, type);
        }
    }

    waveManager() {//spawns and progresses waves and checks lose and win conditions
        if (!this.entities.enemies.some(lane => lane.length > 0)) {
            if (this.waveInfo.currentWave < this.waveInfo.waves.length) {
                this.spawnWave();
                this.waveInfo.currentWave++;
            } else {
                this.status = "win";
            }
        } else if (this.entities.enemies.some(lane => lane.some(enemy => enemy.position.x < (this.firstCell.x - cellSize.x / 2)))) {
            this.status = "lose";
        }
    }

    killEnemyDebug() { //temporary function to kill enemies with a press of the key "S"
        window.addEventListener("keydown", (event) => {
            if (event.code == "KeyS") {
                let enemies = this.entities.enemies;
                for (let i = 0; i < enemies.length; i++) {
                    if (enemies[i].length > 0) {
                        let enemy = this.entities.enemies[i].pop();
                        document.getElementById(enemy.id).remove();
                        break;
                    }
                }
            }
        }, { signal: this.buttonControl.signal });
    }
}

class Tower {
    id;
    position = {x: undefined, y: undefined};
    type;
    hp;
    cost;
    buff;

    constructor(id, position, type) {
        this.id = id;
        this.position.x = position.x;
        this.position.y = position.y;
        this.type = type;

        switch (this.type) {
            case "angry"://обычный
                this.stats(6, 4, 0);
                break;
            case "buff"://баффающий
                this.stats(2, 10, 5);
                break;
            case "heart": //генератор
                this.stats(6, 2, 0);
                break;
            case "lazy": //замедляющий
                this.stats(6, 7, 1000);
                break;
            case "shield"://шипастый
                this.stats(40, 5, 0);
                break;
        }
    }

    createTower(){
        let src;
        switch(this.type){
            case "angry":
                src = "Assets/Cats/angry_cat.png";
                break;
            case "buff":
                src = "Assets/Cats/buff_cat.png";
                break;
            case "heart":
                src = "Assets/Cats/heart_cat.png";
                break;
            case "lazy":
                src = "Assets/Cats/lazy_cat.png";
                break;
            case "shield":
                src = "Assets/Cats/shield_cat.png";
                break;
        }
        return `<img id="${this.id}" src="${src}" style="left: ${this.position.x}px; top: ${this.position.y}px;">`;
    }

    stats(hp, cost, buff) {
            this.hp = hp;
            this.cost = cost;
            this.buff = buff;
    }
}

class Projectile {
}

class Enemy {
    id;
    type;
    speed; //speed of an enemy in cells per second
    hp;
    position = { x: undefined, y: undefined };
    attack = {
        damage: 1,
        speed: tps / 2,
        reload: tps / 2
    };
    freeze = false;

    constructor(id, position, type) {
        this.id = id;
        this.position.x = position.x;
        this.position.y = position.y;
        this.type = type;

        switch (this.type) {
            case "Basic":
                this.setStats(0.375, 50);
                break;
            case "Tough":
                this.setStats(0.375, 150);
                break;
            case "Fast":
                this.setStats(0.2, 50);
                break;
        }
    }

    createSprite() { //returns html element which represents an enemy
        let src;
        switch (this.type) {
            case "Basic":
                src = "Assets/Enemies/basic_enemy.png";
                break;
            case "Tough":
                src = "Assets/Enemies/tough_enemy.png";
                break;
            case "Fast":
                src = "Assets/Enemies/basic_enemy.png";
                break;
        }
        return `<img id="${this.id}" src="${src}" style="left: ${this.position.x}px; top: ${this.position.y}px;">`;
    }

    move() { //moves an enemy
        let sprite = document.getElementById(this.id);
        this.position.x -= this.speed * cellSize.x / tps;
        sprite.style.left = this.position.x.toString() + "px";
    }

    setStats(speed, hp) { //sets speed and hp of an enemy
        this.speed = speed;
        this.hp = hp;
    }
}

class AudioManager {
    volume = {
        music: undefined,
        sfx: undefined
    };
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

    getVolume() { //gets volume from the localStorage or sets default values with writing it into the localStorage
        let sfxVol = localStorage.getItem("sfxVol");
        let musicVol = localStorage.getItem("musicVol");
        if (sfxVol == null || musicVol == null) {
            let defaultVol = 0.5;
            localStorage.setItem("sfxVol", defaultVol);
            localStorage.setItem("musicVol", defaultVol);
            return { music: 0.5, sfx: 0.5 };
        } else {
            return { music: Number(musicVol), sfx: Number(sfxVol) };
        }
    }

    setVolume() { //sets volume of all sounds
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

    initVolumeSettings() { //manages volume settings
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

    testSound() { //temporary function to test sound
        document.getElementById("settingsTest").addEventListener("click", () => this.UI.click.play());
    }
}