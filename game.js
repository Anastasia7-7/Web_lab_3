// Логика игры 2048 — без фреймворков
(function () {
  'use strict';

  var SIZE = 4;
  var GRID_GAP = 8;
  var GRID_PADDING = 8;

  var grid = [];
  var score = 0;
  var gameOver = false;

  var scoreEl = document.getElementById('score');
  var tilesContainer = document.getElementById('tiles-container');
  var gameContainer = document.getElementById('game-container');

  function createEmptyGrid() {
    var g = [];
    for (var r = 0; r < SIZE; r++) {
      g[r] = [];
      for (var c = 0; c < SIZE; c++) {
        g[r][c] = 0;
      }
    }
    return g;
  }

  // Слияние строки влево: [4,4,4,4] -> [16,0,0,0], возвращает { row, addedScore }
  function mergeRowLeft(line) {
    var filtered = [];
    for (var i = 0; i < line.length; i++) {
      if (line[i] !== 0) filtered.push(line[i]);
    }
    var addedScore = 0;
    var merged = [];
    var i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        var sum = filtered[i] * 2;
        merged.push(sum);
        addedScore += sum;
        i += 2;
      } else {
        merged.push(filtered[i]);
        i += 1;
      }
    }
    while (merged.length < SIZE) {
      merged.push(0);
    }
    return { row: merged, addedScore: addedScore };
  }

  function getRow(grid, r) {
    return grid[r].slice();
  }

  function setRow(grid, r, row) {
    for (var c = 0; c < SIZE; c++) {
      grid[r][c] = row[c];
    }
  }

  function getColumn(grid, c) {
    var col = [];
    for (var r = 0; r < SIZE; r++) {
      col.push(grid[r][c]);
    }
    return col;
  }

  function setColumn(grid, c, col) {
    for (var r = 0; r < SIZE; r++) {
      grid[r][c] = col[r];
    }
  }

  function reverseArray(arr) {
    return arr.slice().reverse();
  }

  function copyGrid(g) {
    var next = [];
    for (var r = 0; r < SIZE; r++) {
      next[r] = g[r].slice();
    }
    return next;
  }

  function gridsEqual(a, b) {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (a[r][c] !== b[r][c]) return false;
      }
    }
    return true;
  }

  function moveLeft() {
    var prev = copyGrid(grid);
    var added = 0;
    for (var r = 0; r < SIZE; r++) {
      var result = mergeRowLeft(getRow(grid, r));
      setRow(grid, r, result.row);
      added += result.addedScore;
    }
    if (!gridsEqual(prev, grid)) {
      score += added;
      return true;
    }
    return false;
  }

  function moveRight() {
    var prev = copyGrid(grid);
    var added = 0;
    for (var r = 0; r < SIZE; r++) {
      var row = getRow(grid, r);
      var result = mergeRowLeft(reverseArray(row));
      setRow(grid, r, reverseArray(result.row));
      added += result.addedScore;
    }
    if (!gridsEqual(prev, grid)) {
      score += added;
      return true;
    }
    return false;
  }

  function moveUp() {
    var prev = copyGrid(grid);
    var added = 0;
    for (var c = 0; c < SIZE; c++) {
      var col = getColumn(grid, c);
      var result = mergeRowLeft(col);
      setColumn(grid, c, result.row);
      added += result.addedScore;
    }
    if (!gridsEqual(prev, grid)) {
      score += added;
      return true;
    }
    return false;
  }

  function moveDown() {
    var prev = copyGrid(grid);
    var added = 0;
    for (var c = 0; c < SIZE; c++) {
      var col = getColumn(grid, c);
      var result = mergeRowLeft(reverseArray(col));
      setColumn(grid, c, reverseArray(result.row));
      added += result.addedScore;
    }
    if (!gridsEqual(prev, grid)) {
      score += added;
      return true;
    }
    return false;
  }

  function getEmptyCells() {
    var cells = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) cells.push({ r: r, c: c });
      }
    }
    return cells;
  }

  function spawnTile() {
    var empty = getEmptyCells();
    if (empty.length === 0) return;
    var idx = Math.floor(Math.random() * empty.length);
    var cell = empty[idx];
    var value = Math.random() < 0.9 ? 2 : 4;
    grid[cell.r][cell.c] = value;
  }

  /** Появление 1 или 2 новых плиток на случайных пустых клетках */
  function spawnTilesAfterMove() {
    var count = Math.random() < 0.5 ? 1 : 2;
    for (var i = 0; i < count; i++) {
      spawnTile();
    }
  }

  /** Есть ли хотя бы один возможный ход (пустая клетка или соседние равные) */
  function canMove() {
    var empty = getEmptyCells();
    if (empty.length > 0) return true;
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var v = grid[r][c];
        if (v === 0) continue;
        if (c + 1 < SIZE && grid[r][c + 1] === v) return true;
        if (r + 1 < SIZE && grid[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  function showGameOverModal() {
    var overlay = document.getElementById('modal-game-over');
    var form = document.getElementById('game-over-form');
    var message = document.getElementById('game-over-message');
    var success = document.getElementById('game-over-success');
    if (overlay) overlay.hidden = false;
    if (form) form.style.display = '';
    if (message) message.hidden = false;
    if (success) success.hidden = true;
  }

  function hideGameOverModal() {
    var overlay = document.getElementById('modal-game-over');
    if (overlay) overlay.hidden = true;
  }

  function setGameOverModalSaved() {
    var form = document.getElementById('game-over-form');
    var message = document.getElementById('game-over-message');
    var success = document.getElementById('game-over-success');
    if (form) form.style.display = 'none';
    if (message) message.hidden = true;
    if (success) success.hidden = false;
  }

  function resetGameOverModalState() {
    var form = document.getElementById('game-over-form');
    var message = document.getElementById('game-over-message');
    var success = document.getElementById('game-over-success');
    var input = document.getElementById('input-player-name');
    if (form) form.style.display = '';
    if (message) message.hidden = false;
    if (success) success.hidden = true;
    if (input) input.value = '';
  }

  function getTileClass(value) {
    if (value <= 2048) return 'tile tile-' + value;
    return 'tile tile-super';
  }

  function renderTiles() {
    if (!tilesContainer || !gameContainer) return;
    var w = gameContainer.offsetWidth;
    var inner = w - GRID_PADDING * 2 - GRID_GAP * 3;
    var cellSize = inner / SIZE;

    tilesContainer.innerHTML = '';
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var value = grid[r][c];
        if (value === 0) continue;
        var tile = document.createElement('div');
        tile.className = getTileClass(value);
        tile.textContent = value;
        tile.style.left = (GRID_PADDING + c * (cellSize + GRID_GAP)) + 'px';
        tile.style.top = (GRID_PADDING + r * (cellSize + GRID_GAP)) + 'px';
        tile.style.width = cellSize + 'px';
        tile.style.height = cellSize + 'px';
        tilesContainer.appendChild(tile);
      }
    }
  }

  function updateScoreDisplay() {
    if (scoreEl) scoreEl.textContent = score;
  }

  function startNewGame() {
    grid = createEmptyGrid();
    score = 0;
    gameOver = false;
    hideGameOverModal();
    resetGameOverModalState();
    spawnTile();
    spawnTile();
    updateScoreDisplay();
    renderTiles();
  }

  function afterMove() {
    spawnTilesAfterMove();
    updateScoreDisplay();
    renderTiles();
    if (!canMove()) {
      gameOver = true;
      showGameOverModal();
    }
  }

  function onKeyDown(e) {
    if (gameOver) return;
    var key = e.key;
    var moved = false;
    if (key === 'ArrowLeft') moved = moveLeft();
    else if (key === 'ArrowRight') moved = moveRight();
    else if (key === 'ArrowUp') moved = moveUp();
    else if (key === 'ArrowDown') moved = moveDown();
    if (moved) afterMove();
  }

  document.addEventListener('DOMContentLoaded', function () {
    startNewGame();
    document.addEventListener('keydown', onKeyDown);
    var btnNewGame = document.getElementById('btn-new-game');
    if (btnNewGame) btnNewGame.addEventListener('click', startNewGame);

    var btnSaveResult = document.getElementById('btn-save-result');
    if (btnSaveResult) {
      btnSaveResult.addEventListener('click', function () {
        setGameOverModalSaved();
      });
    }
    var btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', function () {
        startNewGame();
      });
    }
  });
})();
