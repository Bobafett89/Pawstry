class LevelLoader {
    jsonText; //text from Levels.json
    jsonInput; //html input element

    constructor() {
        this.jsonInput = document.getElementById("jsonInput");
        jsonInput.addEventListener("change", () => this.fileLoad());
        document.getElementById("levelLoad1").addEventListener("click", () => this.loadLevel(0));
        document.getElementById("levelLoad2").addEventListener("click", () => this.loadLevel(1));
        document.getElementById("levelLoad3").addEventListener("click", () => this.loadLevel(2));

        this.setTps();
        this.initTpsSetting();
        this.loadProgress();
        this.initProgressButtons();
        this.updateProgress();
    }

    async fileLoad() { //function which checks if chosen file is correct, if yes copies text into "jsonText" and transitions to level choice
        let file = jsonInput.files[0];
        if(file.name == "Levels.json") {
            this.jsonText = await file.text();
            document.getElementById("jsonLoader").hidden = true;
            document.getElementById("testMenu").hidden = false;
        }
    }

    loadLevel(level) { //function which loads the level and switches to a game screen
        let levels = JSON.parse(this.jsonText);
        document.getElementById("levelLoader").hidden = true;
        document.getElementById("level").hidden = false;
        switch(level) {
            case 0:
                document.getElementById("fieldImg").src = "Assets/FieldVariants/OneLane.png";
                break;
            case 1:
                document.getElementById("fieldImg").src = "Assets/FieldVariants/ThreeLanes.png";
                break;
            default:
                document.getElementById("fieldImg").src = "Assets/FieldVariants/FiveLanes.png";
                break;
        }
        let waves = Object.values(levels)[level];
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

    loadProgress() {
        let progress = localStorage.getItem("level");
        if(progress === null) {
            progress = 0;
            localStorage.setItem("level", progress);
        }
        availableLevels = Number(progress);
    }

    updateProgress() {
        document.getElementById("debugProgress").innerHTML = `Levels passed: ${availableLevels}`;
    }

    initProgressButtons() {
        document.getElementById("settingsProgressReset").addEventListener("click", () => this.resetProgress());
        document.getElementById("endButton").addEventListener("click", () => this.updateProgress());
    }

    resetProgress() {
        availableLevels = 0;
        localStorage.setItem("level", availableLevels);
        this.updateProgress();
    }
}