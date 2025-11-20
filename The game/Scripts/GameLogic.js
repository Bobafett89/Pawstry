class LevelManager {
    levelInfo = {
        currentLevel: undefined,
        lanes: undefined
    }; //info about level
    waveInfo = {
        waves: undefined, //array of waves
        currentWave: 0,
        randomDelay: 0
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
    chosenTower = "generator";

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
        this.debug();
        this.update();
    }

    update() { //main function where most of the logic takes place and which is called each tick
        console.log(`Status: ${this.status}`);

        if (this.status == "running") {
            this.entitiesHpManager();
            this.waveManager();
            this.entities.enemies.forEach(lane => lane.forEach(enemy => enemy.move()));

            setTimeout(() => this.update(), 1000 / tps);
        } else if (this.status == "win" || this.status == "lose") {
            document.getElementById("endScreen").hidden = false;
            document.getElementById("endMessage").innerHTML = (this.status == "win") ? ("Victory!!!") : ("Defeat...");
            if(this.status == "win" && availableLevels == this.levelInfo.currentLevel) {
                localStorage.setItem("level", this.levelInfo.currentLevel + 1);
                availableLevels = this.levelInfo.currentLevel + 1;
            }

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
        document.getElementById("generatorCatUI").addEventListener("click", () => this.chosenTower = "Generator", { signal: this.buttonControl.signal });
        document.getElementById("basicCatUI").addEventListener("click", () => this.chosenTower = "Basic", { signal: this.buttonControl.signal });
        document.getElementById("buffCatUI").addEventListener("click", () => this.chosenTower = "Buff", { signal: this.buttonControl.signal });
        document.getElementById("spikeCatUI").addEventListener("click", () => this.chosenTower = "Spike", { signal: this.buttonControl.signal });
        document.getElementById("freezingCatUI").addEventListener("click", () => this.chosenTower = "Freezing", { signal: this.buttonControl.signal });
    }

    placeTower(lane, cell) {
        this.entities.towers[lane][cell] = new Tower;
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

    spawnWaveEnemy() {//spawn random enemy of the current wave
        let waveNumber = this.waveInfo.currentWave;
        let wave = this.waveInfo.waves[waveNumber];
        let enemyNumber = Math.floor(Math.random() * wave.toString().length);
        if(enemyNumber == 0 && (wave % 10) == 0) {
            enemyNumber++;
        }
        if(enemyNumber == 1 && (wave % 100) < 10) {
            enemyNumber++;
        }
        let type, idLeft;
        let randomLane = Math.floor(Math.random() * this.levelInfo.lanes);
        switch (enemyNumber) {
            case 0:
                type = "Basic";
                idLeft = wave;
                this.waveInfo.waves[waveNumber]--;
                break;
            case 1:
                type = "Tough";
                idLeft = Math.floor(wave / 10);
                this.waveInfo.waves[waveNumber] -= 10;
                break;
            case 2:
                type = "Fast";
                idLeft = Math.floor(wave / 100);
                this.waveInfo.waves[waveNumber] -= 100;
                break;
        }
        this.spawnEnemy(`${type}_${waveNumber}_${idLeft}`, randomLane, type);
    }

    waveManager() {//spawns and progresses waves and checks lose and win conditions
        if (this.waveInfo.currentWave < this.waveInfo.waves.length) {
            let wave = this.waveInfo.waves[this.waveInfo.currentWave];
            if(wave > 0 && this.waveInfo.randomDelay == 0) {
                this.spawnWaveEnemy();
                this.waveInfo.randomDelay = Math.floor((Math.random() * 2 + 1) * tps);
            } else if(wave == 0) {
                if(this.entities.enemies.every(lane => lane.length == 0)) {
                    this.waveInfo.currentWave++;
                }
            } else {
                this.waveInfo.randomDelay--;
            }
            if(this.entities.enemies.some(lane => lane.some(enemy => enemy.position.x <= this.firstCell.x - cellSize.x / 2))) {
                this.status = "lose";
            }
        } else {
            this.status = "win";
        }
    }

    entitiesHpManager() {//removes entities with no hp
        let enemies = this.entities.enemies;
        let noHp = entity => entity.hp <= 0;
        while (enemies.some(lane => lane.some(noHp))) {
            let laneIndex = enemies.findIndex(lane => lane.some(noHp));
            let enemyIndex = enemies[laneIndex].findIndex(noHp);
            let enemy = this.entities.enemies[laneIndex].splice(enemyIndex, 1)[0];
            document.getElementById(enemy.id).remove();
        }
        let basicSprite = "Assets/Enemies/basic_enemy.png";
        let basicHp = enemy => (enemy.type == "Tough" && enemy.hp <= 50 && document.getElementById(enemy.id).src.includes("tough"));
        while (enemies.some(lane => lane.some(basicHp))) {
            let laneIndex = enemies.findIndex(lane => lane.some(basicHp));
            let enemyIndex = enemies[laneIndex].findIndex(basicHp);
            let sprite = document.getElementById(enemies[laneIndex][enemyIndex].id);
            sprite.src = basicSprite;
            this.entities.enemies[laneIndex][enemyIndex].position.x += this.spriteOffset.toughEnemy.x - this.spriteOffset.basicEnemy.x;
            this.entities.enemies[laneIndex][enemyIndex].position.y += this.spriteOffset.toughEnemy.y - this.spriteOffset.basicEnemy.y;
            sprite.style.left = this.entities.enemies[laneIndex][enemyIndex].position.x.toString() + "px";
            sprite.style.top = this.entities.enemies[laneIndex][enemyIndex].position.y.toString() + "px";
        }
    }

    chooseTower(towerType) {
        this.chosenTower = towerType;
    }

    debug() { //temporary function to debug
        window.addEventListener("keydown", (event) => { // kill enemies with a press of the key "S"
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


        window.addEventListener("keydown", (event) => { //damage enemies with a press of the key "D"
            if (event.code == "KeyD") {
                let enemies = this.entities.enemies;
                for (let i = 0; i < enemies.length; i++) {
                    if (enemies[i].length > 0) {
                        this.entities.enemies[i][0].hp -= 10;
                        break;
                    }
                }
            }
        }, { signal: this.buttonControl.signal });

        window.addEventListener("keydown", (event) => {
            if(event.code == "KeyW") {
                this.status = "win";
            }
            if(event.code == "KeyL") {
                this.status = "lose";
            }
        }, {signal: this.buttonControl.signal});
    }
}

class Tower {
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
        if (!sprite.src.includes("tough")) {
            let deg = Number(sprite.style.rotate.replace("deg", "")) - 212 * this.speed / tps;
            sprite.style.rotate = deg.toString() + "deg";
        }
        if (this.type == "Fast") {
            this.speed = 1.2 - (this.hp - 10) / 40;
        }
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
    defaultVol = 0.5;
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
        if (sfxVol === null || musicVol === null) {
            localStorage.setItem("sfxVol", this.defaultVol);
            localStorage.setItem("musicVol", this.defaultVol);
            return { music: this.defaultVol, sfx: this.defaultVol };
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
        document.getElementById("settingsVolumeReset").addEventListener("click", () => this.resetVolume());
    }

    resetVolume() {
        this.volume.music = this.defaultVol;
        this.volume.sfx = this.defaultVol;
        document.getElementById("settingsCancel").click();
        document.getElementById("settingsApply").click();
    }

    testSound() { //temporary function to test sound
        document.getElementById("settingsTest").addEventListener("click", () => this.UI.click.play());
    }
}