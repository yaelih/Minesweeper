const MINE = '&#x1f4a3;';
const FLAG = '&#9971;';
const EMPTY = ' ';
const NEW_GAME = '&#129299;';
const LOST = '&#129327;';
const WIN = '&#128526;';

var gBoard;
var gGame;
var gLevel = { SIZE: 4, MINES: 2 };
var gModes = [{ SIZE: 4, MINES: 2 }, { SIZE: 8, MINES: 12 }, { SIZE: 12, MINES: 30 }]
var gElGameStateBtn = document.querySelector('.game-state');
var gElMinesAmount = document.querySelector('.mines span');
var gElTimer = document.querySelector('.timer span');
var gElLives = document.querySelector('.lives span');
var gStartTime;
var gTimerInterval;
var gLives;
// var gModes = {
//     'Beginner': { SIZE: 4, MINES: 2 },
//     'Medium': { SIZE: 8, MINES: 12 },
//     'Expert': { SIZE: 12, MINES: 30 }
// }

function initGame() {
    gStartTime = undefined;
    gBoard = buildBoard()
    renderBoard(gBoard);
    gLives = 3;
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 }
    gElLives.innerText = gLives;
    gElTimer.innerText = gGame.secsPassed;
    gElGameStateBtn.innerHTML = NEW_GAME;
    gElMinesAmount.innerText = gLevel.MINES - gGame.markedCount;
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
    // console.log(board);
    return board;
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j];
            var cellClass = getClassName({ i, j })
            var content = EMPTY;
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
function addRandomMines(board, amount, i, j) {
    var allLocations = buildAllLocations(board);
    allLocations.splice(allLocations.indexOf({ i, j }), 1);
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

function startGame(i, j) {
    board = addRandomMines(gBoard, gLevel.MINES, i, j);
    board = setMinesNegsCount(gBoard)
    gStartTime = Date.now();
    renderTime();
    gGame.isOn = true;
    gTimerInterval = setInterval(renderTime, 1000)
}

function renderTime() {
    gGame.secsPassed = Math.floor((Date.now() - gStartTime) / 1000 + 1);
    gElTimer.innerHTML = gGame.secsPassed;
}

//Called when a cell (td) is clicked
function cellClicked(elCell, i, j) {
    if (!gStartTime) {
        startGame(i, j);
    }
    if (!gGame.isOn) return
    var cell = gBoard[i][j]
    if (cell.isMarked) return
    if (cell.isMine) {
        cell.isShown = true;
        elCell.innerHTML = MINE;
        // elCell.classList.add('shown');
        gGame.shownCount++;
        gLives--;
        gElLives.innerText = gLives;
        if (gLives < 1) {
            revealAllMines();
            gameOver();
        }
    } else {
        expandShown(gBoard, elCell, i, j)
        if (checkGameOver()) gameOver(WIN); //gElGameStateBtn.innerHTML = WIN;// console.log('you won');
    }
}

function cellMarked(e, elCell) {
    e.preventDefault();
    if (!gStartTime) {
        startGame(i, j);
    }
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
        if (checkGameOver()) gameOver(WIN); //gElGameStateBtn.innerHTML = WIN; //console.log('you won');
    }
    gElMinesAmount.innerText = gLevel.MINES - gGame.markedCount;
}

function getCellfromElement(elCell) {
    var location = getLocationOfElement(elCell)
    return gBoard[location.i][location.j];
}

// Returns the location of a specific cell
function getLocationOfElement(elCell) {
    console.log(elCell.classList)
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
                // elCell.classList.add('shown');
            }
        }
    }
}

function expandShown(board, elCell, i, j) {

    var cell = getCellfromElement(elCell);
    cell.isShown = true;
    // elCell.classList.add('shown');
    if (cell.minesAroundCount > 0) {
        elCell.innerHTML = cell.minesAroundCount;
        gGame.shownCount++;
        return
    }
    gGame.shownCount++;
    //the following line renders '0'
    renderCell(i, j, cell.minesAroundCount)

    for (var cellI = i - 1; cellI <= i + 1; cellI++) {
        if (cellI < 0 || cellI >= board.length) continue;
        for (var cellJ = j - 1; cellJ <= j + 1; cellJ++) {
            if (cellI === i && cellJ === j) continue;
            if (cellJ < 0 || cellJ >= board[cellI].length) continue;
            cell = gBoard[cellI][cellJ];
            if (cell.isShown) continue;
            var elCell = document.querySelector(`.cell-${cellI}-${cellJ}`);
            expandShown(board, elCell, cellI, cellJ);
        }
    }
    return
}

function gameOver(value = LOST) {
    clearInterval(gTimerInterval)
    gGame.isOn = false;
    gElGameStateBtn.innerHTML = value;
    console.log('Game over - you: ', value)
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
    clearInterval(gTimerInterval);
    initGame();
}