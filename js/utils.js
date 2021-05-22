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

// Returns the class name for a specific cell
function getClassName(location) {
    var cellClass = 'cell-' + location.i + '-' + location.j;
    return cellClass;
}

function renderCell(i, j, value) {
    var elCell = document.querySelector(`.cell-${i}-${j}`)
    elCell.innerHTML = value;
}

function getCellfromElement(elCell) {
    var location = getLocationOfElement(elCell)
    return gBoard[location.i][location.j];
}

// Returns the location of a specific cell
function getLocationOfElement(elCell) {
    var cellClass = elCell.classList[1]
    var cellClassAsArray = cellClass.split('-')
    var cellI = +cellClassAsArray[1]
    var cellJ = +cellClassAsArray[2]
    return { i: cellI, j: cellJ }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}