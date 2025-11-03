function createCells() {
    let cells = "";
    for(let i = 0; i < 5; i++) {
        for(let j = 0; j < 9; j++) {
            cells += `<div id="cell_${i}_${j}" class="Cell"></div>`;
        }
    }
    document.getElementById("cells").innerHTML = cells;
}