class LevelLoader {
    jsonText; //text from Levels.json
    jsonInput; //html input element

    constructor() {
        this.jsonInput = document.getElementById("jsonInput");
        jsonInput.addEventListener("change", () => this.fileLoad());
        let images = document.getElementsByTagName("img");
        Object.values(images).forEach(image => image.setAttribute("draggable", false));

        this.setTps();
        this.initTpsSetting();
        this.initScreenSetting();
        this.loadProgress();
        this.initMenuButtons();
        this.setButtonSound();
        this.startMusic();
    }

    async fileLoad() { //checks if chosen file is correct, if yes copies text into "jsonText" and transitions to main menu
        let file = jsonInput.files[0];
        if (file.name == "Levels.json") {
            this.jsonText = await file.text();
            document.getElementById("jsonLoader").hidden = true;
            document.getElementById("mainMenu").hidden = false;
        }
    }

    loadLevel(level) { //loads the level and switches to a game screen
        let levels = JSON.parse(this.jsonText);
        let waves = Object.values(levels)[level];

        this.switchScreens("levelSelect", "titleScreen");
        this.switchScreens("mainMenu", "level")
        this.levelUnlocks(level);
        audioManager.music.menu.pause();
        audioManager.music.menu.load();
        audioManager.music.level.play();
        new LevelManager(level, waves);
    }

    setTps() { //loads tps from localStorage
        let savedTps = localStorage.getItem("tps");
        if (savedTps === null) {
            savedTps = 60;
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

    initScreenSetting() { //manages screen setting
        let checkbox = document.getElementById("fullscreenSetting");
        
        checkbox.addEventListener("click", () => {
            if (checkbox.checked) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
        document.documentElement.addEventListener("fullscreenchange", () => {
            if (document.fullscreenElement == null && checkbox.checked) {
                checkbox.checked = false;
            }
        });
    }

    loadProgress() { //load progress form localStorage
        let progress = localStorage.getItem("level");

        if (progress === null) {
            progress = 0;
            localStorage.setItem("level", progress);
        }
        availableLevels = Number(progress);
    }

    resetProgress() { //resets progress
        availableLevels = 0;
        localStorage.setItem("level", availableLevels);
        for (let i = 0; i < 10; i++) {
            let progress = availableLevels < i;
            document.getElementById(`levelLoad${i}`).hidden = progress;
        }
    }

    initMenuButtons() { //adds functionality to buttons
        for (let i = 0; i < 10; i++) {
            let button = document.getElementById(`levelLoad${i}`);
            let progress = availableLevels < i;

            button.addEventListener("click", () => this.loadLevel(i));
            button.hidden = progress;
        }

        document.getElementById("playButton").addEventListener("click", () => this.switchScreens("titleScreen", "levelSelect"));
        document.getElementById("levelBack").addEventListener("click", () => this.switchScreens("levelSelect", "titleScreen"));

        document.getElementById("settingsButton").addEventListener("click", () => this.switchScreens("titleScreen", "settingsScreen"));
        document.getElementById("settingsBack").addEventListener("click", () => this.switchScreens("settingsScreen", "titleScreen"));

        document.getElementById("settingsProgressReset").addEventListener("click", () => this.resetProgress());
    }

    switchScreens(oldScreen, newScreen) { //switches screens (divs with certain theme, e.g. settings)
        document.getElementById(oldScreen).hidden = true;
        document.getElementById(newScreen).hidden = false;
    }

    levelUnlocks(level) { //sets elements visuals depending on a level
        let fieldImg = document.getElementById("fieldImg");
        let fieldDetails = document.getElementById("fieldDetails");

        switch (level) {
            case 0:
                fieldImg.src = "Assets/FieldVariants/OneLane.png";
                fieldDetails.src = "Assets/UI/detailsTwoLevels.png";
                break;
            case 1:
                fieldImg.src = "Assets/FieldVariants/ThreeLanes.png";
                fieldDetails.src = "Assets/UI/detailsTwoLevels.png";
                break;
            default:
                fieldImg.src = "Assets/FieldVariants/FiveLanes.png";
                fieldDetails.src = "Assets/UI/details.png";
                break;
        }
        document.getElementById("BuffCatUI").hidden = level < 2;
        document.getElementById("SpikeCatUI").hidden = level < 4;
        document.getElementById("FreezingCatUI").hidden = level < 7;
    }

    startMusic() { //starts music
        audioManager.music.menu.loop = true;
        audioManager.music.level.loop = true;
        window.addEventListener("click", () => audioManager.music.menu.play(), { once: true });
    }

    setButtonSound() { //adds click sound to buttons
        let buttons = document.getElementsByTagName("button");
        let selectors = document.getElementsByClassName("Selector");

        Object.values(buttons).forEach(button => button.addEventListener("click", () => audioManager.UI.click.play()));
        Object.values(selectors).forEach(selector => selector.addEventListener("click", () => audioManager.UI.click.play()));
        document.getElementById("pauseUI").addEventListener("click", () => audioManager.UI.click.play());
    }
}