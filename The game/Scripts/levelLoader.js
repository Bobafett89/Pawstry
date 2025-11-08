class LevelLoader {
    levels; //variable with information from Levels.json
    jsonInput;

    constructor() {
        this.jsonInput = document.getElementById("jsonInput");
        jsonInput.addEventListener("change", () => this.fileLoad());
        document.getElementById("levelLoad1").addEventListener("click", () => this.loadLevel(0));
        document.getElementById("levelLoad2").addEventListener("click", () => this.loadLevel(1));
        document.getElementById("levelLoad3").addEventListener("click", () => this.loadLevel(2));
    }

    async fileLoad() { //function which checks if chosen file is correct, if yes parses it into "levels" and transitions to level choice
        let file = jsonInput.files[0];
        if(file.name == "Levels.json") {
            this.levels = JSON.parse(await file.text());
            document.getElementById("jsonLoader").hidden = true;
            document.getElementById("levelButtons").hidden = false;
        }
    }

    loadLevel(level) { //function which switches to a game screen
        if(this.levels) {
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
            let waves = Object.entries(this.levels)[level][1];
            new LevelManager(level, waves);
        }
    }
}