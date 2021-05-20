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
// I've changed the suggested example of gLevel
var gLevel = 'Beginner';
var gModes = {
    'Beginner': { SIZE: 4, MINES: 2 },
    'Medium': { SIZE: 8, MINES: 12 },
    'Expert': { SIZE: 12, MINES: 30 }
}
var gStartTime;
var gTimerInterval;
var gMovesHistory;
var gSelfClicks;

var gElGameStateBtn = document.querySelector('.game-state');
var gElMarked = document.querySelector('.marked span');
var gElTimer = document.querySelector('.timer span');
var gElLives = document.querySelector('.lives span');
var gElUndoBtn = document.querySelector(".undo button");
var gElSafeClickSpan = document.querySelector(".safe-click span");
var gElSafeClickBtn = document.querySelector(".safe-click button");
var gElClickedHint;


function initGame() {
    gStartTime = null;
    gSelfClicks = 3;
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, lives: 3, hints: 3, isHintOn: false }
    gMovesHistory = [];
    gBoard = buildBoard()
    renderBoard(gBoard);
    renderLevelBtns();
    renderHints();
    renderBestScore();
    gElLives.innerText = gGame.lives;
    gElTimer.innerText = gGame.secsPassed;
    gElGameStateBtn.innerHTML = NEW_GAME;
    gElMarked.innerText = gGame.markedCount;
    gElSafeClickSpan.innerText = gSelfClicks;
    gElUndoBtn.disabled = true;
    gElSafeClickBtn.disabled = false;
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

function renderLevelBtns() {
    strHTML = '';
    for (var mode in gModes) {
        var activeClass = (mode === gLevel) ? 'active' : '';
        strHTML += `<button class="level-btn ${activeClass}" onclick = "changeLevel(this, '${mode}')" >${mode}</button >`
    }
    var elLevelContainer = document.querySelector('.level-btns');
    elLevelContainer.innerHTML = strHTML;
}

function renderHints() {
    strHTML = '';
    for (var i = 0; i < gGame.hints; i++) {
        strHTML += `<button class="hint" onclick="hintClicked(this)">${HINT}</button>`;
    }
    var elHints = document.querySelector('.hints-container span');
    elHints.innerHTML = strHTML;
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

function startGame(i, j) {
    board = addRandomMines(gBoard, gModes[gLevel].MINES, i, j);
    board = setMinesNegsCount(gBoard)
    gStartTime = Date.now();
    renderTime();
    gGame.isOn = true;
    gTimerInterval = setInterval(renderTime, 1000)
    gElUndoBtn.disabled = false;
}

//Change implementation to make it more efficient
function addRandomMines(board, amount, i, j) {
    var allLocations = buildPossibleLocations(board, i, j);
    for (var i = 0; i < amount; i++) {
        var idx = getRandomInt(0, allLocations.length);
        var emptyCell = allLocations[idx];
        board[emptyCell.i][emptyCell.j].isMine = true;
        allLocations.splice(idx, 1);
    }
    return board
}

function buildPossibleLocations(board, cellI, cellJ) {
    var locations = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            // The following line prevent mine only from clicked cell
            // if (i === cellI && j === cellJ) continue;
            // The following line prevent mines from clicked cell and its neighbours
            if ((i >= cellI - 1 && i <= cellI + 1) && (j >= cellJ - 1 && j <= cellJ + 1)) continue;
            locations.push({ i, j });
        }
    }
    return locations;
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
        gGame.lives--;
        gElLives.innerText = gGame.lives;
        gMovesHistory.push({ location: { i, j }, isShown: true });
        if (gGame.lives < 1) {
            revealAllMines();
            gameOver();
        }
    } else {
        expandShown(gBoard, elCell, i, j)
    }
    if (checkGameOver()) gameOver(WIN);
}

function cellMarked(e, elCell) {
    e.preventDefault();
    var location = getLocationOfElement(elCell)
    if (!gStartTime) {
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
        if (checkGameOver()) gameOver(WIN);
    }
    gMovesHistory.push({ location: { i: location.i, j: location.j }, isShown: false });
    gElMarked.innerText = gGame.markedCount;
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

function expandShown(board, elCell, i, j) {

    var cell = getCellfromElement(elCell);
    cell.isShown = true;
    if (cell.minesAroundCount > 0) {
        elCell.innerHTML = cell.minesAroundCount;
        gGame.shownCount++;
        elCell.classList.add('shown');
        gMovesHistory.push({ location: { i, j }, isShown: true });
        return
    }
    gGame.shownCount++;
    elCell.classList.add('shown');
    gMovesHistory.push({ location: { i, j }, isShown: true });
 
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
    gElUndoBtn.disabled = true;
    gElSafeClickBtn.disabled = true;
    gElGameStateBtn.innerHTML = value;
    if (value === WIN) checkAndUpdateBestScore();
}

function checkAndUpdateBestScore() {
    var currLevel = gLevel;
    var storageKeyName = 'bestScore' + currLevel;
    var bestScore = +localStorage.getItem(storageKeyName);

    if (!bestScore || gGame.secsPassed < bestScore) {
        localStorage.setItem(storageKeyName, gGame.secsPassed);
        elBestScoreSpan = document.querySelector('.best-score span');
        elBestScoreSpan.innerText = +localStorage.getItem(storageKeyName);
    }
}

function restartGame() {
    clearInterval(gTimerInterval);
    initGame();
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

function hintClicked(elHint) {
    elHint.innerHTML = HINT_SELECTED;
    gElClickedHint = elHint;
    gGame.isHintOn = true;
}

function handleHint(i, j) {
    gGame.isHintOn = false;
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
    }, 1000)
}

// Undo all moves one by one.
function undo() {
    if (!gGame.isOn) return
    if (gMovesHistory.length === 0) return  //possible to disable/enable during game
    var prevMove = gMovesHistory.pop();
    var cellClass = getClassName(prevMove.location)
    var elCell = document.querySelector(`.${cellClass}`);
    var cell = gBoard[prevMove.location.i][prevMove.location.j];
    if (!prevMove.isShown) {  //isMarked = flag
        cell.isMarked = !cell.isMarked;
        if (cell.isMarked) {
            elCell.innerHTML = FLAG;
            gGame.markedCount++;
        } else {
            elCell.innerHTML = EMPTY;
            gGame.markedCount--;
        }
        gElMarked.innerText = gGame.markedCount;
    } else {  //isShown = mine or num
        cell.isShown = false;
        elCell.classList.remove('shown');
        gGame.shownCount--;
        elCell.innerHTML = EMPTY;
        if (cell.isMine) {
            gGame.lives++;
            gElLives.innerText = gGame.lives;
        }
    }
}

function safeClick() {
    var elCell = getRandCoveredElCell(gBoard);
    if (!elCell) return;
    elCell.classList.add('safe-mark');
    setTimeout(function(){
        elCell.classList.remove('safe-mark');
    }, 2000)
    gSelfClicks--;
    gElSafeClickSpan.innerHTML = gSelfClicks;
    if (gSelfClicks === 0) gElSafeClickBtn.disabled = true;
}

function getRandCoveredElCell(board) {
    var coveredLocations = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var currCell = board[i][j];
            if (!currCell.isShown && !currCell.isMine) {  //not sure if required not marked
                coveredLocations.push({i,j});
            }
        }
    }
    if (coveredLocations.length === 0) return null;
    var idx = getRandomInt(0, coveredLocations.length);
    var location = coveredLocations[idx]
    var elCell = document.querySelector(`.${getClassName({ i: location.i, j: location.j })}`);
    return elCell;   
}