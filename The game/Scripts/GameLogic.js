class LevelManager {
    levelInfo = {
        currentLevel: undefined,
        lanes: undefined,
        maxLevel: 10
    };
    waveInfo = {
        waves: undefined, //array of waves
        currentWave: 0,
        randomDelay: 0
    };
    entities = {
        towers: [],
        enemies: [],
        projectiles: []
    }; //object of arrays inside which arrays represent lanes containing entities
    status; //variable which indicates the state of a game
    firstCell = { x: 176, y: 413 }; //position of the center of the first (top-left) cell
    spriteOffset = {
        generatorTower: { x: 120, y: 104},
        basicTower: { x: 120, y: 96},
        buffTower: { x: 104, y: 96},
        spikeTower: { x: 136, y: 112},
        freezingTower: { x: 112, y: 80},
        basicEnemy: { x: 53, y: 53 },
        toughEnemy: { x: 95, y: 69 }
    }; //halfed dimensions of sprites which are used to place entities correctly
    buttonControl = new AbortController(); //object which is used to delete all created eventListeners inside LevelManager
    chosenTower = "Generator";
    currency = 2;

    constructor(level, waves) {
        this.levelInfo.currentLevel = level;
        this.levelInfo.lanes = (level < 3) ? (1 + level * 2) : 5;
        this.waveInfo.waves = waves;
        this.status = "running";
        document.getElementById("currencyCounter").innerHTML = this.currency;

        this.initEntitiesArrays();
        this.createCells();
        this.createButtons();
        this.debug();
        this.update();
    }

    update() { //main function where most of the logic takes place and which is called each tick
        if (this.status == "running") {
            this.enemyAction();
            this.entitiesHpManager();
            this.waveManager();
            //this.towerAction();

            setTimeout(() => this.update(), 1000 / tps);
        } else if (this.status == "win" || this.status == "lose") {
            document.getElementById("endScreen").hidden = false;
            document.getElementById("endMessage").innerHTML = (this.status == "win") ? ("Victory!!!") : ("Defeat...");
            if(this.status == "win" && availableLevels == this.levelInfo.currentLevel) {
                localStorage.setItem("level", this.levelInfo.currentLevel + 1);
                availableLevels = this.levelInfo.currentLevel + 1;
                if(availableLevels < this.levelInfo.maxLevel) {
                    document.getElementById(`levelLoad${availableLevels}`).hidden = false;
                }
            }

            this.status = "wait";
            setTimeout(() => this.update(), 100);
        } else if (this.status == "wait") {
            setTimeout(() => this.update(), 100);
        } else if (this.status == "exit") {
            this.exit();
        }
    }

    enemyAction() { //performs enemies' actions
        for(let lane = 0; lane < this.entities.enemies.length; lane++) {
            for(let e = 0; e < this.entities.enemies[lane].length; e++) {
                let enemy = this.entities.enemies[lane][e];
                let relPos =  (enemy.position.x - (this.firstCell.x - cellSize.x / 2)) / cellSize.x;
                let cell = Math.floor(relPos);
                let tower = this.entities.towers[lane][cell];

                if(tower != undefined && (0 <= (relPos - cell) && (relPos - cell) <= 0.75)) {
                   tower = enemy.action(tower);
                } else {
                    enemy.move();
                }
            }
        }
    }

    createCells() { //creates html elements which represent cells
        let cells = "";
        for (let i = 0; i < this.levelInfo.lanes; i++) {
            for (let j = 0; j < 9; j++) {
                cells += `<div id="c_${i}_${j}" class="Cell"></div>`;
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
    }

    createButtons() { //assigns actions to buttons
        document.getElementById("exitUI").addEventListener("click", () => this.status = "exit", { signal: this.buttonControl.signal });
        document.getElementById("endButton").addEventListener("click", () => this.status = "exit", { signal: this.buttonControl.signal });

        for(let i = 0; i < 5; i++) {
            let cat;
            switch(i) {
                case 0:
                    cat = "Generator";
                    break;
                case 1:
                    cat = "Basic";
                    break;
                case 2:
                    cat = "Buff";
                    break;
                case 3:
                    cat = "Spike";
                    break;
                case 4:
                    cat = "Freezing";
                    break;
                }
                let chosen = cat == "Generator" ? true : false;
                document.getElementById(`${cat}CatUI`).addEventListener("click", () => {
                    document.getElementById(`${this.chosenTower}CatUI`).setAttribute("chosen", false);
                    this.chosenTower = cat;
                    document.getElementById(`${cat}CatUI`).setAttribute("chosen", true);
                }, { signal: this.buttonControl.signal });
                document.getElementById(`${cat}CatUI`).setAttribute("chosen", chosen);
            }
        
        document.addEventListener("click", (event) => {
            if(event.target.className == "Cell") {
                let idParts = event.target.id.split("_");
                let lane = idParts[1];
                let cell = idParts[2];

                this.placeTower(lane, cell, this.chosenTower);
            }
        }, { signal: this.buttonControl.signal });
    }

    placeTower(lane, cell, type) { //places tower on a cell
        if(this.entities.towers[lane][cell] == undefined) {
            let offset;
            switch(type) {
                case "Generator":
                    offset = this.spriteOffset.generatorTower;
                    break;
                case "Basic":
                    offset = this.spriteOffset.basicTower;
                    break;
                case "Buff":
                    offset = this.spriteOffset.buffTower;
                    break;
                case "Spike":
                    offset = this.spriteOffset.spikeTower;
                    break;
                case "Freezing":
                    offset = this.spriteOffset.freezingTower;
                    break;
            }
            let position = {
                x: this.firstCell.x + cellSize.x * cell - offset.x,
                y: this.firstCell.y + cellSize.y * lane - offset.y - cellSize.y / 5
            };
            let id = `t_${type}_${lane}_${cell}`;
            let tower = new Tower(id, position, type);

            if(tower.cost <= this.currency) {
                this.entities.towers[lane][cell] = tower;
                document.getElementById("gameScreen").innerHTML += tower.createTower();
                this.currency -= tower.cost;
                document.getElementById("currencyCounter").innerHTML = this.currency;
            }
        }
    } 

    exit() { //removes entities, eventListeners and switches screens
        this.entities.enemies.forEach(lane => lane.forEach(enemy => document.getElementById(enemy.id).remove()));
        this.entities.towers.forEach(lane => lane.forEach(tower => tower != undefined ? document.getElementById(tower.id).remove() : {}));
        this.buttonControl.abort();
        document.getElementById("endScreen").hidden = true;
        document.getElementById("level").hidden = true;
        document.getElementById("mainMenu").hidden = false;
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

    spawnWaveEnemy() { //spawn random enemy of the current wave
        let waveNumber = this.waveInfo.currentWave;
        let wave = this.waveInfo.waves[waveNumber];
        let enemyNumber = Math.floor(Math.random() * wave.toString().length); //takes random index of a digit from wave
        if(enemyNumber == 0 && (wave % 10) == 0) {
            enemyNumber++;
        }
        if(enemyNumber == 1 && (wave % 100) < 10) {
            enemyNumber++;
        } //checks if the index points to an empty slot
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
        this.spawnEnemy(`e_${type}_${waveNumber}_${idLeft}`, randomLane, type);
    }

    waveManager() { //spawns and progresses waves and checks lose and win conditions
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

    entitiesHpManager() { //removes entities with no hp
        let enemies = this.entities.enemies;
        let noEnemyHp = entity => entity.hp <= 0;
        while (enemies.some(lane => lane.some(noEnemyHp))) {
            let laneIndex = enemies.findIndex(lane => lane.some(noEnemyHp));
            let enemyIndex = enemies[laneIndex].findIndex(noEnemyHp);
            let enemy = enemies[laneIndex].splice(enemyIndex, 1)[0];

            document.getElementById(enemy.id).remove();
        }

        let basicHp = enemy => (enemy.type == "Tough" && enemy.hp <= 50 && document.getElementById(enemy.id).src.includes("tough"));
        while (enemies.some(lane => lane.some(basicHp))) {
            let basicSprite = "Assets/Enemies/basic_enemy.png";
            let laneIndex = enemies.findIndex(lane => lane.some(basicHp));
            let enemyIndex = enemies[laneIndex].findIndex(basicHp);
            let enemy = enemies[laneIndex][enemyIndex];
            let sprite = document.getElementById(enemy.id);

            sprite.src = basicSprite;
            enemy.position.x += this.spriteOffset.toughEnemy.x - this.spriteOffset.basicEnemy.x;
            enemy.position.y += this.spriteOffset.toughEnemy.y - this.spriteOffset.basicEnemy.y;
            sprite.style.left = enemy.position.x.toString() + "px";
            sprite.style.top = enemy.position.y.toString() + "px";
        }

        let towers = this.entities.towers;
        let noTowerHp = tower => (tower != undefined ? tower.hp <= 0 : false);
        while(towers.some(lane => lane.some(noTowerHp))) {
            let laneIndex = towers.findIndex(lane => lane.some(noTowerHp));
            let towerIndex = towers[laneIndex].findIndex(noTowerHp);
            let tower = towers[laneIndex][towerIndex];

            document.getElementById(tower.id).remove();
            towers[laneIndex][towerIndex] = undefined;
        }
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

        window.addEventListener("keydown", (event) => {
            if(event.code == "KeyA") {
                this.currency++;
                document.getElementById("currencyCounter").innerHTML = this.currency;
            }
        }, { signal: this.buttonControl.signal});
    }
}

class Tower {
    id;
    position = {x: undefined, y: undefined};
    type;
    hp;
    cost;
    buff;
    attack = {
        reload: tps / 2,
        speed: tps / 2 }

    constructor(id, position, type) {
        this.id = id;
        this.position.x = position.x;
        this.position.y = position.y;
        this.type = type;

        switch (this.type) {
            case "Basic"://обычный
                this.stats(6, 4, 0);
                break;
            case "Buff"://баффающий
                this.stats(2, 10, 5);
                break;
            case "Generator": //генератор
                this.stats(6, 2, 0);
                break;
            case "Freezing": //замедляющий
                this.stats(6, 7, 1000);
                break;
            case "Spike"://шипастый
                this.stats(40, 5, 0);
                break;
        }
    }

    stats(hp, cost, buff) {
            this.hp = hp;
            this.cost = cost;
            this.buff = buff;
    }

    createTower(){
        let src;
        switch(this.type){
            case "Basic":
                src = "Assets/Cats/Basic/basicIdle.png";
                break;
            case "Buff":
                src = "Assets/Cats/Buff/buffIdle.png";
                break;
            case "Generator":
                src = "Assets/Cats/Generator/generatorIdle.png";
                break;
            case "Freezing":
                src = "Assets/Cats/Freezing/freezingIdle.png";
                break;
            case "Spike":
                src = "Assets/Cats/Spike/spikeIdle.png";
                break;
        }
        return `<img id="${this.id}" src="${src}" style="left: ${this.position.x}px; top: ${this.position.y}px;">`;
    }  
    
    action(enemy){
        let newProjectile;
        if (this.attack.reload <= 0) {
            switch(this.type){
                case "Basic":
                    newProjectile = new Projectile('basicProjectile');
                    this.attack.reload = this.attack.speed;
                    break;
                case "Generator":
                    LevelManager.currency += 1;
                    this.attack.reload = this.attack.speed;
                    break;
                case "Buff":
                    //a
                    this.attack.reload = this.attack.speed;
                    break;
                case "Spike":
                    enemy.hp -= 20; //20 - amount of damage
                    this.attack.reload = this.attack.speed;
                    break;
                case "Freezing":
                    newProjectile = new Projectile("FreezingProjectile");
                    this.attack.reload = this.attack.speed;
                    break;
            }
        } else {
            this.attack.reload--
        }
    }

        /*towerAction(){
        let enemy;
        for(let lane = 0; lane < this.entities.enemies.length; lane++) {
            for(let e = 0; e < this.entities.enemies[lane].length; e++) {
                enemy = this.entities.enemies[lane][e]; 
            }
        }

        for(let lane = 0; lane < this.entities.towers.length; lane++) {
            for(let e = 0; e < this.entities.towers[lane].length; e++) {
                let tower = this.entities.towers[lane][e];
                if (tower) {
                    switch(tower.type){
                        case "Generator":
                            console.log(this.currency)
                            this.currency+=1;
                            break;
                        case "Basic":
                            if ((enemy.position.x - tower.position.x) < 900) {
                                tower.action(enemy);
                                //tower.findTarget(enemy)
                                //console.log((enemy.position.x - tower.position.x))
                                //tower.findTarget(enemy, lane);
                            }   
                    } 
                }
            }
        }
    }*/
}

class Projectile {
    id;
    position = {x: undefined, y: undefined}
    type;
    damage;
    constructor(id, position, type){
        this.id = id;
        this.position.x = position.x;
        this.position.y = position.y;
        this.type = type;
        console.log(`Projectile. type: ${this.type} ${this.projectileX}`)

        switch(this.type){
            case "BasicProjectile":
                this.damage = 10;
                break;
            case "FreezingProjectile":
                this.damage = 5;
        }
    }

    createProjectile(){
        switch(this.type){
            case "BasicProjectile":
                src = "Assets/Cats/Basic/basicIdle.png";
                break;
            case "FreezingProjectile":
                src = "Assets/Cats/Basic/basicIdle.png";
                break;
        }

        return `<img id="${this.id}" src="${src}" style="left: ${this.position.x}px; top: ${this.position.y}px;">`;
    }

    move(){
        let sprite = document.getElementById(this.id);
        this.position.x += this.speed * cellSize.x / tps;
        sprite.style.left = this.position.x.toString() + "px";
    }

    action(enemy){
        enemy.hp -= this.damage;
        if (this.type == "FreezingProjectile")
            enemy.freeze = true;
    }
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

    action(tower) { //returns damaged tower if ready to attack
        if(this.attack.reload <= 0) {
            tower.hp -= this.attack.damage
            this.attack.reload = this.attack.speed;
            return tower;
        } else {
            this.attack.reload--;
        }
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
    }

    getVolume() { //gets volume from the localStorage or sets default values with writing it into the localStorage
        let sfxVol = localStorage.getItem("sfxVol");
        let musicVol = localStorage.getItem("musicVol");
        if (sfxVol === null || musicVol === null) {
            let defaultVol = 0.5;
            localStorage.setItem("sfxVol", defaultVol);
            localStorage.setItem("musicVol", defaultVol);
            return { music: defaultVol, sfx: defaultVol };
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
        musicOutput.textContent = Math.round(musicSlider.value * 100);
        sfxSlider.value = this.volume.sfx;
        sfxOutput.textContent = Math.round(sfxSlider.value * 100);

        musicSlider.addEventListener("input", () => musicOutput.textContent = Math.round(musicSlider.value * 100));
        sfxSlider.addEventListener("input", () => sfxOutput.textContent = Math.round(sfxSlider.value * 100));
        document.getElementById("settingsApply").addEventListener("click", () => {
            this.volume.music = Number(musicSlider.value);
            this.volume.sfx = Number(sfxSlider.value);
            localStorage.setItem("musicVol", this.volume.music);
            localStorage.setItem("sfxVol", this.volume.sfx);
            this.setVolume();
        });
        document.getElementById("settingsCancel").addEventListener("click", () => {
            musicSlider.value = this.volume.music;
            musicOutput.textContent = Math.round(musicSlider.value * 100);
            sfxSlider.value = this.volume.sfx;
            sfxOutput.textContent = Math.round(sfxSlider.value * 100);
        });
    }
}
