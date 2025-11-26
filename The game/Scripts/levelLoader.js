class LevelLoader {
    jsonText; //text from Levels.json
    jsonInput; //html input element

    constructor() {
        this.jsonInput = document.getElementById("jsonInput");
        jsonInput.addEventListener("change", () => this.fileLoad());

        this.setTps();
        this.initTpsSetting();
        this.initScreenSetting();
        this.loadProgress();
        this.initMenuButtons();
    }

    async fileLoad() { //function which checks if chosen file is correct, if yes copies text into "jsonText" and transitions to level choice
        let file = jsonInput.files[0];
        if(file.name == "Levels.json") {
            this.jsonText = await file.text();
            document.getElementById("jsonLoader").hidden = true;
            document.getElementById("mainMenu").hidden = false;
        }
    }

    loadLevel(level) { //function which loads the level and switches to a game screen
        let levels = JSON.parse(this.jsonText);
        let waves = Object.values(levels)[level];

        this.switchScreens("levelSelect", "titleScreen");
        this.switchScreens("mainMenu", "level")
        this.levelUnlocks(level);
        new LevelManager(level, waves);
    }
    
    setTps() {
        let savedTps = localStorage.getItem("tps");
        if(savedTps === null) {
            savedTps = 30;
            localStorage.setItem("tps", savedTps);
        }
        tps = Number(savedTps);
    }

    initTpsSetting() { //manages tps setting
        let tpsSlider = document.getElementById("tickInput");
        let tpsOutput = document.querySelector("output[for='tickInput']");

        tpsSlider.value = tps;
        tpsOutput.textContent = tpsSlider.value;

        tpsSlider.addEventListener("input", () => tpsOutput.textContent = tpsSlider.value);
        document.getElementById("settingsApply").addEventListener("click", () => {
            tps = Number(tpsSlider.value);
            localStorage.setItem("tps", tps);
        });
        document.getElementById("settingsCancel").addEventListener("click", () => {
            tpsSlider.value = tps;
            tpsOutput.textContent = tpsSlider.value;
        });
    }

    initScreenSetting() {
        let checkbox = document.getElementById("fullscreenSetting");
        checkbox.addEventListener("click", () => {
            if(checkbox.checked) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
        document.documentElement.addEventListener("fullscreenchange", () => {
            if(document.fullscreenElement == null && checkbox.checked) {
                checkbox.checked = false;
            }
        });
    }

    loadProgress() {
        let progress = localStorage.getItem("level");
        if(progress === null) {
            progress = 0;
            localStorage.setItem("level", progress);
        }
        availableLevels = Number(progress);
    }

    resetProgress() {
        availableLevels = 0;
        localStorage.setItem("level", availableLevels);
        for(let i = 0; i < 10; i++) {
            let progress = availableLevels >= i ? false : true;
            document.getElementById(`levelLoad${i}`).hidden = progress;
        }
    }

    initMenuButtons() {
        for(let i = 0; i < 10; i++) {
            let button = document.getElementById(`levelLoad${i}`);
            let progress = availableLevels >= i ? false : true;

            button.addEventListener("click", () => this.loadLevel(i));
            button.hidden = progress;
        }

        document.getElementById("playButton").addEventListener("click", () => this.switchScreens("titleScreen", "levelSelect"));
        document.getElementById("levelBack").addEventListener("click", () => this.switchScreens("levelSelect", "titleScreen"));

        document.getElementById("settingsButton").addEventListener("click", () => this.switchScreens("titleScreen", "settingsScreen"));
        document.getElementById("settingsBack").addEventListener("click", () => this.switchScreens("settingsScreen", "titleScreen"));

        document.getElementById("settingsProgressReset").addEventListener("click", () => this.resetProgress());
    }

    switchScreens(oldScreen, newScreen) {
        document.getElementById(oldScreen).hidden = true;
        document.getElementById(newScreen).hidden = false;
    }

    levelUnlocks(level) {
        switch(level) {
            case 0:
                document.getElementById("fieldImg").src = "Assets/FieldVariants/OneLane.png";
                document.getElementById("fieldDetails").src = "Assets/UI/detailsTwoLevels.png";
                break;
            case 1:
                document.getElementById("fieldImg").src = "Assets/FieldVariants/ThreeLanes.png";
                document.getElementById("fieldDetails").src = "Assets/UI/detailsTwoLevels.png";
                break;
            default:
                document.getElementById("fieldImg").src = "Assets/FieldVariants/FiveLanes.png";
                document.getElementById("fieldDetails").src = "Assets/UI/details.png";
                break;
        }
        document.getElementById("BuffCatUI").hidden = level < 2;
        document.getElementById("SpikeCatUI").hidden = level < 4;
        document.getElementById("FreezingCatUI").hidden = level < 7;
    }
}