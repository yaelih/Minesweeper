function createMat(ROWS, COLS) {
    var mat = []
    for (var i = 0; i < ROWS; i++) {
        var row = []
        for (var j = 0; j < COLS; j++) {
            row.push('')
        }
        mat.push(row)
    }
    return mat
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function buildAllLocations(board) {
    var locations = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            locations.push({ i, j });
        }
    }
    return locations;
}

function renderCell(i, j, value) {
    var elCell = document.querySelector(`.cell-${i}-${j}`)
    elCell.innerHTML = value;
}
