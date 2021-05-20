const MINE = '&#x1f4a3;';
const FLAG = '&#9971;';
const EMPTY = ' ';
const NEW_GAME = '&#129299;';
const LOST = '&#129327;';
const WIN = '&#128526;';
const HINT = '&#128261;';
const HINT_SELECTED = '&#128262;';

var gBoard;
var gGame;
// I've changed the suggested solution of gLevel
var gLevel = 'Beginner';
var gModes = {
    'Beginner': { SIZE: 4, MINES: 2 },
    'Medium': { SIZE: 8, MINES: 12 },
    'Expert': { SIZE: 12, MINES: 30 }
}

var gElGameStateBtn = document.querySelector('.game-state');
var gElMinesAmount = document.querySelector('.mines span');
var gElTimer = document.querySelector('.timer span');
var gElLives = document.querySelector('.lives span');

var gStartTime;
var gTimerInterval;
var gElClickedHint;


function initGame() {
    gStartTime = null;
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, lives: 3, hints: 3, isHintOn: false }
    
    gBoard = buildBoard()
    renderBoard(gBoard);
    renderLevelBtns();
    renderHints();
    renderBestScore();
    gElLives.innerText = gGame.lives;
    gElTimer.innerText = gGame.secsPassed;
    gElGameStateBtn.innerHTML = NEW_GAME;
    gElMinesAmount.innerText = gModes[gLevel].MINES - gGame.markedCount;
}

// Builds empty board
function buildBoard() {

    var board = createMat(gModes[gLevel].SIZE, gModes[gLevel].SIZE)

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
    board = addRandomMines(gBoard, gModes[gLevel].MINES, i, j);
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
    if (cell.isShown) return
    if (gGame.isHintOn) {
        handleHint(i, j);
        return
    }
    if (cell.isMine) {
        cell.isShown = true;
        elCell.innerHTML = MINE;
        elCell.classList.add('shown');
        gGame.shownCount++;
        // decrease from mines counter
        gGame.lives--;
        gElLives.innerText = gGame.lives;
        if (gGame.lives < 1) {
            revealAllMines();
            gameOver();
        }
    } else {
        expandShown(gBoard, elCell, i, j)
    }
    if (checkGameOver()) gameOver(WIN); //gElGameStateBtn.innerHTML = WIN;// console.log('you won');
}

function cellMarked(e, elCell) {
    e.preventDefault();
    if (!gStartTime) {
        var location = getLocationOfElement(elCell)
        startGame(location.i, location.j);
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
    gElMinesAmount.innerText = gModes[gLevel].MINES - gGame.markedCount; // should be up?
}

function getCellfromElement(elCell) {
    var location = getLocationOfElement(elCell)
    return gBoard[location.i][location.j];
}

// Returns the location of a specific cell
function getLocationOfElement(elCell) {
    // console.log(elCell.classList)
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
        elCell.classList.add('shown');
        return
    }
    gGame.shownCount++;
    elCell.classList.add('shown');
    //the following line renders '0'
    // renderCell(i, j, cell.minesAroundCount)

    for (var cellI = i - 1; cellI <= i + 1; cellI++) {
        if (cellI < 0 || cellI >= board.length) continue;
        for (var cellJ = j - 1; cellJ <= j + 1; cellJ++) {
            if (cellI === i && cellJ === j) continue;
            if (cellJ < 0 || cellJ >= board[cellI].length) continue;
            cell = gBoard[cellI][cellJ];
            if (cell.isMarked) continue;
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
    if (value === WIN) checkAndUpdateBestScore();
    // console.log('Game over - you: ', value)
}

function checkAndUpdateBestScore() {
    var currLevel = gLevel;
    var storageKeyName = 'bestScore' + currLevel;
    var bestScore = +localStorage.getItem(storageKeyName);
    // console.log('bestScore', bestScore)

    if (!bestScore || gGame.secsPassed < bestScore) {
        // console.log('bestScore', bestScore)
        localStorage.setItem(storageKeyName, gGame.secsPassed);
        elBestScoreSpan = document.querySelector('.best-score span');
        elBestScoreSpan.innerText = +localStorage.getItem(storageKeyName);
    }
}

function restartGame() {
    clearInterval(gTimerInterval);
    initGame();
}

function renderLevelBtns() {
    strHTML = '';
    for (var mode in gModes) {
        var activeClass = (mode === gLevel) ? 'active' : '';
        strHTML += `<button class="level-btn ${activeClass}" onclick = "changeLevel(this, '${mode}')" >${mode}</button >`
    }
    var elLevelContainer = document.querySelector('.level-btns');
    elLevelContainer.innerHTML = strHTML;
}

function changeLevel(elClickedBtn, level) {
    elLevelBtns = document.querySelectorAll('.level-btn');
    for (var i = 0; i < elLevelBtns.length; i++) {
        var elBtn = elLevelBtns[i];
        elBtn.classList.remove('active');
    }
    elClickedBtn.classList.add('active');

    gLevel = level;
    clearInterval(gTimerInterval);
    initGame();
}

function renderHints() {
    strHTML = '';
    for (var i = 0; i < gGame.hints; i++) {
        strHTML += `<button class="hint" onclick="useHint(this)">${HINT}</button>`;
    }
    // console.log(strHTML);
    var elHints = document.querySelector('.hints-container span');
    elHints.innerHTML = strHTML;
}

function useHint(elHint) {
    elHint.innerHTML = HINT_SELECTED;
    gElClickedHint = elHint;
    gGame.isHintOn = true;
    // console.log('hint was clicked', gElClickedHint)
}

function handleHint(i, j) {
    // find locations of cells need to be revealed. Ignore already shown
    var revealLocations = [];
    for (var cellI = i - 1; cellI <= i + 1; cellI++) {
        if (cellI < 0 || cellI >= board.length) continue;
        for (var cellJ = j - 1; cellJ <= j + 1; cellJ++) {
            if (cellJ < 0 || cellJ >= board[cellI].length) continue;
            if (gBoard[cellI][cellJ].isShown) continue;
            revealLocations.push({ i: cellI, j: cellJ });
        }
    }

    // reveal relevant cells
    for (var idx = 0; idx < revealLocations.length; idx++) {
        var location = revealLocations[idx]
        var cell = gBoard[location.i][location.j];
        var elRevealedCell = document.querySelector(`.cell-${location.i}-${location.j}`);
        elRevealedCell.innerHTML = (cell.isMine) ? MINE : cell.minesAroundCount;
    }

    // after a sec, hide relevant cells, hide hint button and exit hint mode
    setTimeout(function () {
        for (var idx = 0; idx < revealLocations.length; idx++) {
            var location = revealLocations[idx]
            var cell = gBoard[location.i][location.j];
            var elRevealedCell = document.querySelector(`.cell-${location.i}-${location.j}`);
            elRevealedCell.innerHTML = (cell.isMarked) ? FLAG : EMPTY;
        }
        gElClickedHint.style.display = 'none';
        gGame.isHintOn = false;
    }, 1000)
}

function renderBestScore() {
    var currLevel = gLevel;
    var bestScore;
    var storageKeyName = 'bestScore' + currLevel;
    if (!(+localStorage[storageKeyName])) {
        bestScore = null;
        localStorage.setItem(storageKeyName, bestScore);
    } else {
        bestScore = localStorage.getItem(storageKeyName);
    }

    elBestScoreSpan = document.querySelector('.best-score span');
    elBestScoreSpan.innerText = (bestScore) ? bestScore : '(None)';
}