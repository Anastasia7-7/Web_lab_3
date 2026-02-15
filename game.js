// Логика игры 2048 — без фреймворков
(function () {
  'use strict';

  var SIZE = 4;
  var GRID_GAP = 8;
  var GRID_PADDING = 8;
  var STORAGE_KEY = 'game2048_state';
  var LEADERS_STORAGE_KEY = 'game2048_leaders';

  var grid = [];
  var score = 0;
  var gameOver = false;
  var undoHistory = [];

  var scoreEl = document.getElementById('score');
  var tilesContainer = document.getElementById('tiles-container');
  var gameContainer = document.getElementById('game-container');
  var btnUndo = document.getElementById('btn-undo');
  var controlsMobile = document.getElementById('controls-mobile');
  var modalGameOver = document.getElementById('modal-game-over');
  var modalLeaders = document.getElementById('modal-leaders');

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
    updateMobileControlsVisibility();
  }

  function hideGameOverModal() {
    var overlay = document.getElementById('modal-game-over');
    if (overlay) overlay.hidden = true;
    updateMobileControlsVisibility();
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

  function getLeaders() {
    try {
      var raw = localStorage.getItem(LEADERS_STORAGE_KEY);
      if (!raw) return [];
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveLeaders(list) {
    try {
      localStorage.setItem(LEADERS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function addLeader(name, playerScore) {
    var leaders = getLeaders();
    var trimmed = (name || '').trim() || 'Игрок';
    var date = new Date();
    var dateStr = date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    leaders.push({ name: trimmed, score: playerScore, date: dateStr });
    leaders.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    if (leaders.length > 100) leaders = leaders.slice(0, 100);
    saveLeaders(leaders);
  }

  function renderLeadersTable() {
    var tbody = document.getElementById('leaders-body');
    if (!tbody) return;
    var leaders = getLeaders();
    tbody.innerHTML = '';
    leaders.forEach(function (entry) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + escapeHtml(entry.name) + '</td><td>' + (entry.score || 0) + '</td><td>' + escapeHtml(entry.date || '') + '</td>';
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showLeadersModal() {
    renderLeadersTable();
    if (modalLeaders) modalLeaders.hidden = false;
    updateMobileControlsVisibility();
  }

  function hideLeadersModal() {
    if (modalLeaders) modalLeaders.hidden = true;
    updateMobileControlsVisibility();
  }

  function updateMobileControlsVisibility() {
    if (!controlsMobile) return;
    var gameOverOpen = modalGameOver && !modalGameOver.hidden;
    var leadersOpen = modalLeaders && !modalLeaders.hidden;
    var anyModalOpen = gameOverOpen || leadersOpen;
    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (anyModalOpen) {
      controlsMobile.classList.add('controls-mobile--hidden');
      controlsMobile.classList.remove('controls-mobile--visible');
    } else if (isMobile) {
      controlsMobile.classList.remove('controls-mobile--hidden');
      controlsMobile.classList.add('controls-mobile--visible');
    } else {
      controlsMobile.classList.remove('controls-mobile--visible', 'controls-mobile--hidden');
    }
  }

  function getTileClass(value) {
    if (value <= 2048) return 'tile tile-' + value;
    return 'tile tile-super';
  }

  function renderTiles() {
    if (!tilesContainer || !gameContainer) return;
    var w = gameContainer.offsetWidth;
    var inner = w - GRID_PADDING * 2 - GRID_GAP * 3;
    var cellSize = Math.floor(inner / SIZE);

    var baseFontSize = Math.max(10, Math.min(Math.floor(cellSize * 0.5), 56));
    var midFontSize = Math.max(9, Math.min(Math.floor(cellSize * 0.4), 42));
    var smallFontSize = Math.max(8, Math.min(Math.floor(cellSize * 0.3), 32));

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
        if (value >= 1024) {
          tile.style.fontSize = smallFontSize + 'px';
        } else if (value >= 128) {
          tile.style.fontSize = midFontSize + 'px';
        } else {
          tile.style.fontSize = baseFontSize + 'px';
        }
        tilesContainer.appendChild(tile);
      }
    }
  }

  function updateScoreDisplay() {
    if (scoreEl) scoreEl.textContent = score;
  }

  function pushState() {
    undoHistory.push({ grid: copyGrid(grid), score: score });
  }

  function undo() {
    if (gameOver || undoHistory.length === 0) return;
    var state = undoHistory.pop();
    grid = state.grid;
    score = state.score;
    renderTiles();
    updateScoreDisplay();
    updateUndoButton();
    saveState();
  }

  function updateUndoButton() {
    if (btnUndo) {
      btnUndo.disabled = gameOver || undoHistory.length === 0;
    }
  }

  function saveState() {
    try {
      var state = {
        grid: copyGrid(grid),
        score: score,
        gameOver: gameOver,
        undoHistory: undoHistory.map(function (s) { return { grid: copyGrid(s.grid), score: s.score }; })
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var state = JSON.parse(raw);
      if (!state || !state.grid || state.grid.length !== SIZE) return null;
      for (var r = 0; r < SIZE; r++) {
        if (!state.grid[r] || state.grid[r].length !== SIZE) return null;
      }
      if (typeof state.score !== 'number' || state.score < 0) return null;
      if (!Array.isArray(state.undoHistory)) state.undoHistory = [];
      return state;
    } catch (e) {
      return null;
    }
  }

  function restoreState(state) {
    grid = state.grid;
    score = state.score;
    gameOver = state.gameOver === true;
    undoHistory = state.undoHistory || [];
    hideGameOverModal();
    resetGameOverModalState();
    renderTiles();
    updateScoreDisplay();
    updateUndoButton();
    if (gameOver) showGameOverModal();
    updateMobileControlsVisibility();
  }

  function startNewGame() {
    grid = createEmptyGrid();
    score = 0;
    gameOver = false;
    undoHistory = [];
    hideGameOverModal();
    resetGameOverModalState();
    spawnTile();
    spawnTile();
    updateScoreDisplay();
    renderTiles();
    updateUndoButton();
    saveState();
    updateMobileControlsVisibility();
  }

  function afterMove() {
    spawnTilesAfterMove();
    updateScoreDisplay();
    renderTiles();
    updateUndoButton();
    if (!canMove()) {
      gameOver = true;
      showGameOverModal();
    }
    saveState();
  }

  function doMove(direction) {
    if (gameOver) return;
    var moved = false;
    if (direction === 'left') {
      pushState();
      moved = moveLeft();
      if (!moved) undoHistory.pop();
    } else if (direction === 'right') {
      pushState();
      moved = moveRight();
      if (!moved) undoHistory.pop();
    } else if (direction === 'up') {
      pushState();
      moved = moveUp();
      if (!moved) undoHistory.pop();
    } else if (direction === 'down') {
      pushState();
      moved = moveDown();
      if (!moved) undoHistory.pop();
    }
    if (moved) afterMove();
    updateUndoButton();
  }

  function onKeyDown(e) {
    var key = e.key;
    if (key === 'ArrowLeft') doMove('left');
    else if (key === 'ArrowRight') doMove('right');
    else if (key === 'ArrowUp') doMove('up');
    else if (key === 'ArrowDown') doMove('down');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var saved = loadState();
    if (saved) {
      restoreState(saved);
    } else {
      startNewGame();
    }
    document.addEventListener('keydown', onKeyDown);
    var btnNewGame = document.getElementById('btn-new-game');
    if (btnNewGame) btnNewGame.addEventListener('click', startNewGame);
    if (btnUndo) btnUndo.addEventListener('click', undo);

    var btnSaveResult = document.getElementById('btn-save-result');
    if (btnSaveResult) {
      btnSaveResult.addEventListener('click', function () {
        var input = document.getElementById('input-player-name');
        var name = input ? input.value : '';
        addLeader(name, score);
        setGameOverModalSaved();
      });
    }
    var btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.addEventListener('click', startNewGame);

    var btnLeaders = document.getElementById('btn-leaders');
    if (btnLeaders) btnLeaders.addEventListener('click', showLeadersModal);
    var btnCloseLeaders = document.getElementById('btn-close-leaders');
    if (btnCloseLeaders) btnCloseLeaders.addEventListener('click', hideLeadersModal);

    var btnUp = document.getElementById('btn-up');
    var btnLeft = document.getElementById('btn-left');
    var btnDown = document.getElementById('btn-down');
    var btnRight = document.getElementById('btn-right');
    if (btnUp) btnUp.addEventListener('click', function () { doMove('up'); });
    if (btnLeft) btnLeft.addEventListener('click', function () { doMove('left'); });
    if (btnDown) btnDown.addEventListener('click', function () { doMove('down'); });
    if (btnRight) btnRight.addEventListener('click', function () { doMove('right'); });

    updateMobileControlsVisibility();

    var resizeTimeout;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        renderTiles();
      }, 100);
    });
  });
})();
