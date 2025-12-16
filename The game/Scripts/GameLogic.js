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
    buttonControl = new AbortController(); //object which is used to delete all created eventListeners inside LevelManager
    chosenTower = "Generator";
    currency = 4;
    startDelay = 20 * tps;
    reload = {
        current: {
            generator: 0,
            basic: 0,
            freezing: 0,
            spike: 0,
            buff: 0
        },
        max: {
            generator: 3.5 * tps,
            basic: 3.5 * tps,
            freezing: 5 * tps,
            spike: 15 * tps,
            buff: 20 * tps
        }
    };

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
            this.reloadSystem();
            this.waveManager();
            this.enemyAction();
            this.towerAction();
            this.projectileAction();
            this.entitiesHpManager();

            setTimeout(() => this.update(), 1000 / tps);
        } else if (this.status == "win" || this.status == "lose") {
            document.getElementById("endScreen").hidden = false;
            document.getElementById("endMessage").innerHTML = (this.status == "win") ? ("Victory!!!") : ("Defeat...");
            if(this.status == "win") {
                audioManager.end.win.play();

                if(availableLevels == this.levelInfo.currentLevel) {
                    let newLevel = this.levelInfo.currentLevel + 1;

                    localStorage.setItem("level", newLevel);
                    availableLevels = newLevel;
                    document.getElementById(`levelLoad${availableLevels}`).hidden = availableLevels >= this.levelInfo.maxLevel;
                }
            } else {
                audioManager.end.lose.play();
            }

            this.status = "wait";
            setTimeout(() => this.update(), 100);
        } else if (this.status == "wait") {
            setTimeout(() => this.update(), 100);
        } else if (this.status == "exit") {
            this.exit();
        }
    }

    reloadSystem() {
        if(this.reload.current.generator > 0) {
            let timer = document.getElementById("generatorTimer");
            timer.innerHTML = Math.round(this.reload.current.generator * 10 / tps) / 10;
            timer.setAttribute("cooldown", true);
            document.getElementById("GeneratorCatUI").setAttribute("cooldown", true);
            this.reload.current.generator--;
        } else {
            document.getElementById("generatorTimer").setAttribute("cooldown", false);
            document.getElementById("GeneratorCatUI").setAttribute("cooldown", false);
        }
        if(this.reload.current.basic > 0) {
            let timer = document.getElementById("basicTimer");
            timer.innerHTML = Math.round(this.reload.current.basic * 10 / tps) / 10;
            timer.setAttribute("cooldown", true);
            document.getElementById("BasicCatUI").setAttribute("cooldown", true);
            this.reload.current.basic--;
        } else {
            document.getElementById("basicTimer").setAttribute("cooldown", false);
            document.getElementById("BasicCatUI").setAttribute("cooldown", false);
        }
        if(this.reload.current.freezing > 0) {
            let timer = document.getElementById("freezingTimer");
            timer.innerHTML = Math.round(this.reload.current.freezing * 10 / tps) / 10;
            timer.setAttribute("cooldown", true);
            document.getElementById("FreezingCatUI").setAttribute("cooldown", true);
            this.reload.current.freezing--;
        } else {
            document.getElementById("freezingTimer").setAttribute("cooldown", false);
            document.getElementById("FreezingCatUI").setAttribute("cooldown", false);
        }
        if(this.reload.current.spike > 0) {
            let timer = document.getElementById("spikeTimer");
            timer.innerHTML = Math.round(this.reload.current.spike * 10 / tps) / 10;
            timer.setAttribute("cooldown", true);
            document.getElementById("SpikeCatUI").setAttribute("cooldown", true);
            this.reload.current.spike--;
        } else {
            document.getElementById("spikeTimer").setAttribute("cooldown", false);
            document.getElementById("SpikeCatUI").setAttribute("cooldown", false);
        }
        if(this.reload.current.buff > 0) {
            let timer = document.getElementById("buffTimer");
            timer.innerHTML = Math.round(this.reload.current.buff * 10 / tps) / 10;
            timer.setAttribute("cooldown", true);
            document.getElementById("BuffCatUI").setAttribute("cooldown", true);
            this.reload.current.buff--;
        } else {
            document.getElementById("buffTimer").setAttribute("cooldown", false);
            document.getElementById("BuffCatUI").setAttribute("cooldown", false);
        }
    }

    enemyAction() { //performs enemies' actions
        for (let lane = 0; lane < this.entities.enemies.length; lane++) {
            for (let e = 0; e < this.entities.enemies[lane].length; e++) {
                let enemy = this.entities.enemies[lane][e];
                let relPos =  (enemy.position.x - (this.firstCell.x - cellSize.x / 2)) / cellSize.x;
                let cell = Math.floor(relPos);
                let tower = this.entities.towers[lane][cell];

                if(tower != undefined && (0 <= (relPos - cell) && (relPos - cell) <= 0.75)) {
                   enemy.action(tower);
                   if(document.getElementById(enemy.id).src.includes("tough") && enemy.position.y != enemy.jump.ground) {
                    enemy.position.y = enemy.jump.ground;
                    document.getElementById(enemy.id).style.top = enemy.position.y.toString() + "px";
                   }
                } else {
                    enemy.move();
                }
                enemy.stateChange();
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
        document.getElementById("endButton").addEventListener("click", () => this.status = "exit", { signal: this.buttonControl.signal });
        document.getElementById("backButton").addEventListener("click", () => this.status = "exit", { signal: this.buttonControl.signal });

        for (let i = 0; i < 5; i++) {
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
                let chosen = cat == "Generator";
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

        document.getElementById("pauseUI").addEventListener("click", () => {
            this.status = "wait";
            document.getElementById("pauseScreen").hidden = false;
        });
        document.getElementById("continueButton").addEventListener("click", () => {
            this.status = "running";
            document.getElementById("pauseScreen").hidden = true;
        })
    }

    placeTower(lane, cell, type) { //places tower on a cell
        if(this.entities.towers[lane][cell] == undefined) {
            let offset;
            let canPlace = false;
            switch(type) {
                case "Generator":
                    offset = spriteOffset.generatorTower;
                    canPlace = this.reload.current.generator <= 0;
                    break;
                case "Basic":
                    offset = spriteOffset.basicTower;
                    canPlace = this.reload.current.basic <= 0;
                    break;
                case "Buff":
                    offset = spriteOffset.buffTower;
                    canPlace = this.reload.current.buff <= 0;
                    break;
                case "Spike":
                    offset = spriteOffset.spikeTower;
                    canPlace = this.reload.current.spike <= 0;
                    break;
                case "Freezing":
                    offset = spriteOffset.freezingTower;
                    canPlace = this.reload.current.freezing <= 0;
                    break;
            }
            let position = {
                x: this.firstCell.x + cellSize.x * cell - offset.x,
                y: this.firstCell.y + cellSize.y * lane - offset.y - cellSize.y / 5
            };
            let id = `t_${type}_${lane}_${cell}`;
            let tower = new Tower(id, position, type);

            if(tower.cost <= this.currency && canPlace) {
                this.entities.towers[lane][cell] = tower;
                document.getElementById("gameScreen").innerHTML += tower.createTower();
                this.currency -= tower.cost;
                document.getElementById("currencyCounter").innerHTML = this.currency;
                audioManager.UI.towerPlace.play();
                switch(type) {
                    case "Generator":
                        this.reload.current.generator = this.reload.max.generator;
                        break;
                    case "Basic":
                        this.reload.current.basic = this.reload.max.basic;
                        break;
                    case "Buff":
                        this.reload.current.buff = this.reload.max.buff;
                        break;
                    case "Spike":
                        this.reload.current.spike = this.reload.max.spike;
                        break;
                    case "Freezing":
                        this.reload.current.freezing = this.reload.max.freezing;
                        break;
                }
            }
        }
    } 

    projectileAction() {
        for(let lane = 0; lane < this.levelInfo.lanes; lane++) {
            for(let p = 0; p < this.entities.projectiles[lane].length; p++) {
                let projectile = this.entities.projectiles[lane][p];
                projectile.move();
                if(projectile.position.x <= 1920 - spriteOffset.basicProjectile.x){
                    for(let e = 0; e < this.entities.enemies[lane].length; e++) {
                        let enemy = this.entities.enemies[lane][e];
                        let dist = projectile.position.x + spriteOffset.basicProjectile.x - enemy.position.x;
                        if(dist >= 0 && dist <= spriteOffset.toughEnemy.x * 2) {
                            projectile.action(enemy);
                            this.entities.projectiles[lane].splice(p, 1);
                            document.getElementById(projectile.id).remove();
                            p--;
                            break;
                        }
                    }
                } else {
                    this.entities.projectiles[lane].splice(p, 1);
                    document.getElementById(projectile.id).remove();
                    p--;
                }
            }
        }
    }

    exit() { //removes entities, eventListeners and switches screens
        this.entities.enemies.forEach(lane => lane.forEach(enemy => document.getElementById(enemy.id).remove()));
        this.entities.towers.forEach(lane => lane.forEach(tower => tower != undefined ? document.getElementById(tower.id).remove() : {}));
        this.entities.projectiles.forEach(lane => lane.forEach(projectile => document.getElementById(projectile.id).remove()));
        this.buttonControl.abort();
        audioManager.music.menu.play();
        audioManager.music.level.pause();
        audioManager.music.level.load();
        document.getElementById("endScreen").hidden = true;
        document.getElementById("pauseScreen").hidden = true;
        document.getElementById("level").hidden = true;
        document.getElementById("mainMenu").hidden = false;
    }

    spawnEnemy(id, lane, type) { //spawns enemy with set id, lane and type
        let offset;
        switch (type) {
            case "Basic":
                offset = spriteOffset.basicEnemy.y;
                break;
            case "Tough":
                offset = spriteOffset.toughEnemy.y;
                break;
            case "Fast":
                offset = spriteOffset.fastEnemy.y;
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

    towerAction(){
        for(let lane = 0; lane < this.entities.towers.length; lane++) {
            for(let t = 0; t < this.entities.towers[lane].length; t++) {
                let tower = this.entities.towers[lane][t];
                if (tower) {
                    switch(tower.type){
                        case "Generator":
                            tower.action(this);
                            break;
                        case "Basic":
                            tower.action(this.entities);
                            break;
                        case "Buff":
                            let buffedTowers = [];
                            for (let i = -1; i < 2; i++){
                                if ( !(lane == 0 && i == -1) && !(lane == this.levelInfo.lanes-1 && i == 1)){
                                    for (let j = -1; j<2; j ++){
                                        if ( !(t == 0 && j == -1) && !(t == 8 && j == 1)){
                                            let checkedTower = this.entities.towers[lane+i][t+j];
                                            if (checkedTower != undefined && checkedTower.type != "Buff")
                                                buffedTowers.push(this.entities.towers[lane+i][t+j]);
                                        }
                                    }
                                }
                            }
                            tower.action(buffedTowers);
                            break;
                        case "Spike":
                            let attackedEnemies = [];
                            for (let i = 0; i < this.entities.enemies[lane].length; i++) {
                                let startOfCell = this.firstCell.x + t * cellSize.x - cellSize.x / 2;
                                let dist =  this.entities.enemies[lane][i].position.x - startOfCell;
                                if (dist >=0 && dist <= 0.75*cellSize.x) {attackedEnemies.push(this.entities.enemies[lane][i])}
                            }
                            tower.action(attackedEnemies);
                            break;
                        case "Freezing":
                            tower.action(this.entities);
                            break;
                    }
                }
            }
        }
    }

    waveManager() { //spawns and progresses waves and checks lose and win conditions
        if(this.startDelay <= 0) {
            if (this.waveInfo.currentWave < this.waveInfo.waves.length) {
                let wave = this.waveInfo.waves[this.waveInfo.currentWave];
                if(wave > 0 && this.waveInfo.randomDelay == 0) {
                    this.spawnWaveEnemy();
                    this.waveInfo.randomDelay = Math.floor((Math.random() * 4 + 1) * tps);
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
        } else {
            this.startDelay--;
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
            enemy.deathSound.play();
        }

        let basicHp = enemy => (enemy.type == "Tough" && enemy.hp <= 50 && document.getElementById(enemy.id).src.includes("tough"));
        while (enemies.some(lane => lane.some(basicHp))) {
            let basicSprite = "Assets/Enemies/basic.png";
            let laneIndex = enemies.findIndex(lane => lane.some(basicHp));
            let enemyIndex = enemies[laneIndex].findIndex(basicHp);
            let enemy = enemies[laneIndex][enemyIndex];
            let sprite = document.getElementById(enemy.id);

            sprite.src = basicSprite;
            enemy.position.x += spriteOffset.toughEnemy.x - spriteOffset.basicEnemy.x;
            enemy.position.y = enemy.jump.ground;
            enemy.position.y += spriteOffset.toughEnemy.y - spriteOffset.basicEnemy.y;
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
            tower.sounds.death.play();
        }
    }

    debug() { //temporary function to debug
        window.addEventListener("keydown", (event) => { //win by pressing "W" and lose by pressing "L"
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
    id;
    position = {x: undefined, y: undefined};
    type;
    hp;
    cost;
    buff = 5;
    curBuff = 0;
    attack = {
        reload: undefined,
        speed: undefined};
    lane;
    cell;
    projectileCounter = 0;
    sounds = {
        action: undefined,
        hit: new Audio("Assets/Audio/tower_was_attacked.ogg"),
        death: new Audio("Assets/Audio/tower_defeat.ogg")
    };
    animation = {
        actionFlag: false,
        state: "Idle",
        frame: {
            tick: 0,
            played: 0
        },
        info: {
            action: {
                frames: undefined,
                frameTicks: undefined
            },
            idle: {
                frames: undefined,
                frameTicks: undefined
            }
        }
    };


    constructor(id, position, type) {
        this.id = id;
        this.position.x = position.x;
        this.position.y = position.y;
        this.type = type;
        this.lane = this.id.split("_")[2];
        this.cell = this.id.split("_")[3];

        switch (this.type) {
            case "Basic"://обычный
                this.stats(6, 4, 2, 4, 0.2, 2, 0.75);
                this.sounds.action = new Audio("Assets/Audio/tower_attack.ogg");
                break;
            case "Buff"://баффающий
                this.stats(2, 10, 15, 2, 0.75, 2, 0.75);
                this.sounds.action = new Audio("Assets/Audio/buff_sound.ogg");
                break;
            case "Generator": //генератор
                this.stats(6, 2, 6, 3, 0.4, 2, 0.75);
                this.sounds.action = new Audio("Assets/Audio/currency_generation.ogg");
                break;
            case "Freezing": //замедляющий
                this.stats(6, 7, 2, 3, 0.3, 2, 1);
                this.sounds.action = new Audio("Assets/Audio/tower_attack.ogg");
                break;
            case "Spike"://шипастый
                this.stats(40, 5, 4, 4, 0.2, 2, 0.75);
                this.sounds.action = new Audio("Assets/Audio/tower_attack.ogg");
                break;
        }
        this.sounds.action.volume = audioManager.volume.sfx;
        this.sounds.hit.volume = audioManager.volume.sfx;
        this.sounds.death.volume = audioManager.volume.sfx;
    }

    stats(hp, cost, reload, actFrames, actFramesTime, idleFrames, idleFramesTime) {
        this.hp = hp;
        this.cost = cost;
        this.attack.reload = reload * tps;
        this.attack.speed = this.attack.reload;
        this.animation.info.action.frames = actFrames;
        this.animation.info.action.frameTicks = Math.ceil(actFramesTime * tps);
        this.animation.info.idle.frames = idleFrames;
        this.animation.info.idle.frameTicks = Math.ceil(idleFramesTime * tps);
    }

    createTower(){
        let src = `Assets/Cats/${this.type}/Normal/Idle/1.png`;
        return `<img id="${this.id}" src="${src}" style="left: ${this.position.x}px; top: ${this.position.y}px;">`;
    }  
    
    action(object){ //actions of different towers
        this.animateTower();
        if (this.attack.reload <= 0) {
            switch(this.type){
                case "Basic": //creating projectile of basic cat
                    if(object.enemies[this.lane].length > 0) {
                        if(this.animation.actionFlag) {
                            this.shootProjectile(object.projectiles[this.lane]);
                            this.attack.reload = this.attack.speed;
                        } else if (this.animation.state == "Idle") {
                            this.changeState();
                        }
                    }
                    break;
                case "Generator": //generating currency
                    if(this.animation.actionFlag) {
                        object.currency++;
                        document.getElementById("currencyCounter").innerHTML = object.currency;
                        this.attack.reload = this.attack.speed;
                        this.sounds.action.play();
                    } else if (this.animation.state == "Idle") {
                        this.changeState();
                    }
                    break;
                case "Buff":
                    if(object.length > 0) {
                        if(this.animation.actionFlag) {
                            for (let i = 0; i < object.length; i++){
                                object[i].curBuff = this.buff * tps;
                            }
                            this.attack.reload = this.attack.speed;
                            this.sounds.action.play();
                        } else if (this.animation.state == "Idle") {
                            this.changeState();
                        }
                    }
                    break;
                case "Spike":
                    if(object.length > 0) {
                        if(this.animation.actionFlag) {
                            for (let i = 0; i < object.length; i++)
                                object[i].hp -= 20; //20 - amount of damage
                            this.attack.reload = this.attack.speed;
                            this.sounds.action.play();
                        } else if (this.animation.state == "Idle") {
                            this.changeState();
                        }
                    }
                    break;
                case "Freezing": //creating projectile of freezing cat
                    if(object.enemies[this.lane].length > 0) {
                        if(this.animation.actionFlag) {
                            this.shootProjectile(object.projectiles[this.lane]);
                            this.attack.reload = this.attack.speed;
                        } else if (this.animation.state == "Idle") {
                            this.changeState();
                        }
                    }
                    break;
            }
        } else {
            this.attack.reload -= this.curBuff > 0 ? 2 : 1;
        }
        if (this.curBuff > 0){
            this.curBuff--;
        }
    }

    shootProjectile(object) {
        let type;
        switch(this.type) {
            case "Basic":
                type = "BasicProjectile";
                break;
            case "Freezing":
                type = "FreezingProjectile";
                break;
        } 

        let projectile = this.createProjectile(type);
        object.push(projectile);
        document.getElementById("gameScreen").innerHTML += object[object.length-1].createProjectile();
        this.sounds.action.play();
    }

    createProjectile(type) {
        let towerOffset, projectileOffset;
        switch(this.type) {
            case "Basic":
                towerOffset = spriteOffset.basicTower;
                projectileOffset = spriteOffset.basicProjectile;
                break;
            case "Freezing":
                towerOffset = spriteOffset.freezingTower;
                projectileOffset = spriteOffset.freezingProjectile;
                break;
        }
        let position = {
            x: this.position.x + towerOffset.x - projectileOffset.x,
            y: this.position.y + towerOffset.y - projectileOffset.y
        }
        let id = `p_${type}_${this.lane}_${this.cell}_${this.projectileCounter}`;
        this.projectileCounter++;
        let projectile = new Projectile(id, position, type, this.curBuff > 0);
        return projectile;
    }

    animateTower() {
        let sprite = document.getElementById(this.id);
        let animInfo = this.animation.state == "Idle" ? this.animation.info.idle : this.animation.info.action
        let playedFrames = Math.floor(this.animation.frame.tick / animInfo.frameTicks);

        if(playedFrames >= animInfo.frames) {
            if(this.animation.state == "Action") {
                this.animation.state = "Idle";
                this.animation.actionFlag = false;
            }
            this.resetAnimation(sprite);
        } else {
            if(playedFrames > this.animation.frame.played) {
                sprite.src = this.setFrame(playedFrames+1);
                this.animation.frame.played++;
            }

            if(this.animation.state == "Action") {
                let middle = Math.floor(animInfo.frames * animInfo.frameTicks / 2);
                if(this.animation.frame.tick >= middle && !this.animation.actionFlag) {
                    this.animation.actionFlag = true;
                }
            }
            this.animation.frame.tick += this.curBuff > 0 ? 2 : 1;
        }
    }

    setFrame(frame) {
        let buffed = this.curBuff > 0 ? "Buff" : "Normal";
        return `Assets/Cats/${this.type}/${buffed}/${this.animation.state}/${frame}.png`;
    }

    resetAnimation(sprite) {
        this.animation.frame.tick = 0;
        this.animation.frame.played = 0;
        sprite.src = this.setFrame(1);
    }

    changeState() {
        this.animation.state = "Action";
        this.resetAnimation(document.getElementById(this.id));
    }
}

class Projectile {
    id;
    position = {x: undefined, y: undefined}
    type;
    damage;
    speed;
    buffed;
    hitSound = new Audio("Assets/Audio/enemy_was_attacked.ogg");
    constructor(id, position, type, buffed) {
        this.id = id;
        this.position.x = position.x;
        this.position.y = position.y;
        this.type = type;
        this.buffed = buffed;
        this.speed = 3;
        this.hitSound.volume = audioManager.volume.sfx;

        switch(this.type){
            case "BasicProjectile":
                this.damage = 10;
                break;
            case "FreezingProjectile":
                this.damage = 5;
                break;
        }
    }

    createProjectile(){
        let src;
        switch(this.type){
            case "BasicProjectile":
                if(this.buffed)
                    src = "Assets/Cats/Basic/basicProjectileBuff.png";
                else
                    src = "Assets/Cats/Basic/basicProjectile.png"
                break;
            case "FreezingProjectile":
                if(this.buffed)
                    src = "Assets/Cats/Freezing/freezingProjectileBuff.png";
                else
                    src = "Assets/Cats/Freezing/freezingProjectile.png"
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
        this.hitSound.play();
    }
}

class Enemy {
    jump = {
        gravity: cellSize.y * 9 / 8,
        initialSpeed: cellSize.y * 3 / 4,
        speed: cellSize.y * 3 / 4,
        ground: undefined
    }
    id;
    type;
    speed; //speed of an enemy in cells per second
    rotationSpeed;
    hp;
    position = { x: undefined, y: undefined };
    attack = {
        damage: 1,
        speed: tps / 2,
        reload: tps / 2
    };
    deathSound = new Audio("Assets/Audio/enemy_defeat.ogg");
    freeze = false;

    constructor(id, position, type) {
        this.id = id;
        this.position.x = position.x;
        this.position.y = position.y;
        this.type = type;
        this.jump.ground = this.position.y;
        this.rotationSpeed = 360 * cellSize.x / (Math.PI * 108);
        this.deathSound.volume = audioManager.volume.sfx;

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
                src = "Assets/Enemies/basic.png";
                break;
            case "Tough":
                src = "Assets/Enemies/tough.png";
                break;
            case "Fast":
                src = "Assets/Enemies/fast.png";
                break;
        }
        return `<img id="${this.id}" src="${src}" style="left: ${this.position.x}px; top: ${this.position.y}px;" draggable="false">`;
    }

    move() { //moves an enemy
        let sprite = document.getElementById(this.id);
        let freezing = this.freeze ? 0.5 : 1;

        this.position.x -= this.speed * cellSize.x * freezing / tps;
        sprite.style.left = this.position.x.toString() + "px";

        if (!sprite.src.includes("tough")) {
            let deg = Number(sprite.style.rotate.replace("deg", "")) - this.rotationSpeed * this.speed * freezing / tps;
            sprite.style.rotate = deg.toString() + "deg";
        } else {
            this.position.y -= this.jump.speed / tps;
            this.jump.speed -= this.jump.gravity / tps;
            if(this.position.y >= this.jump.ground) {
                this.jump.speed = this.jump.initialSpeed;
                this.position.y = this.jump.ground;
            }
            sprite.style.top = this.position.y.toString() + "px";
        }

        if (this.type == "Fast") {
            this.speed = 1.2 - (this.hp - 10) / 40;
        }
    }

    setStats(speed, hp) { //sets speed and hp of an enemy
        this.speed = speed;
        this.hp = hp;
    }

    action(tower) { //damages tower if ready to attack
        if(this.attack.reload <= 0) {
            tower.sounds.hit.play();
            tower.hp -= this.attack.damage;
            this.attack.reload = this.attack.speed;
        } else {
            this.attack.reload--;
        }
    }

    stateChange() {
        let sprite = document.getElementById(this.id);
        if(this.freeze && !sprite.src.includes("Freeze")) {
            sprite.src = sprite.src.replace(".png", "Freeze.png");
        } 
    }
}

class AudioManager {
    volume = {
        music: undefined,
        sfx: undefined
    };
    UI = {
        click: new Audio("Assets/Audio/botton_sound.ogg"),
        towerPlace: new Audio("Assets/Audio/tower_was_placed.ogg")
    };
    end = {
        win: new Audio("Assets/Audio/victory.ogg"),
        lose: new Audio("Assets/Audio/gameover.ogg")
    };
    music = {
        menu: new Audio("Assets/Audio/menu_sound.ogg"),
        level: new Audio("Assets/Audio/game_sound.ogg")
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
