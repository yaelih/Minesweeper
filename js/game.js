const MINE = '&#x1f4a3;';
const FLAG = '&#9971;'; 
const EMPTY = ' ';

var gBoard;
var gGame;
var gLevel = { SIZE: 4, MINES: 2 };
var gModes = [{ SIZE: 4, MINES: 2 }, { SIZE: 8, MINES: 12 }, { SIZE: 12, MINES: 30 }]
// var gModes = {
//     'Beginner': { SIZE: 4, MINES: 2 },
//     'Medium': { SIZE: 8, MINES: 12 },
//     'Expert': { SIZE: 12, MINES: 30 }
// }

function initGame() {
    gBoard = buildBoard()
    renderBoard(gBoard);
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 }
    gGame.isOn = true;
}

// Builds the board, Set mines at random locations , Call setMinesNegsCount() 
function buildBoard() {

    var board = createMat(gLevel.SIZE, gLevel.SIZE)

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
            board[i][j] = cell;
        }
    }

    board = addRandomMines(board, gLevel.MINES);
    board = setMinesNegsCount(board)
    // console.log(board);
    return board;
}


function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j];
            //TODO: Do I need cellClass?
            var cellClass = getClassName({ i, j })
            // var content = (cell.isMine) ? MINE : cell.minesAroundCount;
            var content = (!cell.isShown) ? EMPTY : (cell.isMine) ? MINE : cell.minesAroundCount;
            strHTML += `<td class="cell ${cellClass}" 
            onclick="cellClicked(this, ${i},${j})"
            oncontextmenu="cellMarked(event, this)">${content}</td>`;
        }
        strHTML += '</tr>';
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;
}

//Count mines around each cell and set the cell's minesAroundCount.
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j].minesAroundCount = countNegs(i, j, board);
        }
    }
    return board;
}

function countNegs(cellI, cellJ, mat) {
    var negsCount = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= mat.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= mat[i].length) continue;
            if (mat[i][j].isMine) negsCount++;
        }
    }
    return negsCount;
}

//Change implementation to make it efficient
function addRandomMines(board, amount) {
    var allLocations = buildAllLocations(board);
    var randomSelectedLocations = [];
    for (var i = 0; i < amount; i++) {
        var idx = getRandomInt(0, allLocations.length);
        var emptyCell = allLocations[idx];
        board[emptyCell.i][emptyCell.j].isMine = true;
        allLocations.splice(idx, 1);
    }
    return board
}


// Returns the class name for a specific cell
function getClassName(location) {
    var cellClass = 'cell-' + location.i + '-' + location.j;
    return cellClass;
}

//Called when a cell (td) is clicked
function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return
    var cell = gBoard[i][j]
    if (cell.isMarked) return
    cell.isShown = true;
    if (cell.isMine) {
        elCell.innerHTML = MINE;
        gGame.shownCount++;
        revealAllMines();
        gameOver();
    } else {
        // TODO: replace '0' with EMPTY after adding background to cells
        // elCell.innerHTML = (cell.minesAroundCount === 0) ? EMPTY : cell.minesAroundCount;
        elCell.innerHTML = cell.minesAroundCount;
        // TODO: Fix and Replace the above with this function
        // expandShown(gBoard, elCell, i, j)
        if (checkGameOver()) console.log('you won');
    }
}

function cellMarked(e, elCell) {
    e.preventDefault();
    if (!gGame.isOn) return
    var cell = getCellfromElement(elCell);
    if (cell.isShown) return;
    if (cell.isMarked) {
        cell.isMarked = false;
        elCell.innerHTML = EMPTY;
        gGame.markedCount--;
    } else {
        cell.isMarked = true;
        elCell.innerHTML = FLAG;
        gGame.markedCount++;
        if (checkGameOver()) console.log('you won');
    }
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


// Game ends when all mines are marked, and all the other cells are shown
function checkGameOver() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var cell = gBoard[i][j]
            if (!cell.isShown) {
                if (cell.isMarked) {
                    if (!cell.isMine) return false;
                } else {
                    return false
                }
            }
        }
    }
    return true
}

function revealAllMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var cell = gBoard[i][j]
            if (cell.isMine) {
                gBoard[i][j].isShown = true;
                renderCell(i, j, MINE);
            }
        }
    }
}


//=====IN PROGRESS =====
// BONUS: if you have the time later, try to work more like the real algorithm (see description at the Bonuses 
// section below)
function expandShown(board, elCell, i, j) {
    // console.log(i, j, elCell)
    var cell = getCellfromElement(elCell);
    if (cell.minesAroundCount > 0) {
        elCell.innerHTML = cell.minesAroundCount;
        gGame.shownCount++;
        console.log(gGame.shownCount)
        return
    }
    renderCell(i, j, cell.minesAroundCount)
    for (var cellI = i - 1; cellI <= i + 1; cellI++) {
        if (cellI < 0 || cellI >= board.length) continue;
        for (var cellJ = j - 1; cellJ <= j + 1; cellJ++) {
            if (cellI === i && cellJ === j) continue;
            if (cellJ < 0 || cellJ >= board[cellI].length) continue;
            cell = gBoard[cellI][cellJ];

            renderCell(cellI, cellJ, cell.minesAroundCount)
            // TODO: work on recursion solution
            // console.log('i-j', cellI, cellJ, 'elCell', elCell)
            // var elCell = document.querySelector(`.cell-${cellI}-${cellJ}`);
            // expandShown(board, elCell, i, j);
        }
    }
    return
}

function gameOver() {
    gGame.isOn = false;
    console.log('Game over - you lost')
}

function restartGame() {
    initGame();
}

function changeLevel(elClickedBtn, level) {
    elLevelBtns = document.querySelectorAll('.level-btn');
    for (var i = 0; i < elLevelBtns.length; i++) {
        var elBtn = elLevelBtns[i];
        elBtn.classList.remove('active');
    }
    elClickedBtn.classList.add('active');

    gLevel = gModes[level];
    initGame();
}