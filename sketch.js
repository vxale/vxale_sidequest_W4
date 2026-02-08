// Mini Mines
// - safe tile click => green
// - mine click => red + end screen
// - all safe clicked => reveal all mines red + "you won!"

let levelData;

let grid = [];

let state = "INTRO"; // "INTRO" | "PLAYING" | "WON" | "LOST"
let safeTotal = 0;
let safeClicked = 0;

let startBtn;
let playAgainBtn;

let inputLocked = false;

function preload() {
  levelData = loadJSON("level.json");
}

function setup() {
  // If JSON fails, still run with defaults
  if (levelData) applyLevel(levelData);

  const w = cols * tileSize + padding * 2;
  const h = rows * tileSize + padding * 2;

  createCanvas(w, h);
  textAlign(CENTER, CENTER);

  // Build an empty grid so INTRO can draw a preview safely
  buildGrid();
  safeTotal = cols * rows - mineCount;
  safeClicked = 0;

  startBtn = createButton("Start");
  startBtn.mousePressed(startGame);

  playAgainBtn = createButton("Play Again");
  playAgainBtn.mousePressed(resetGame);
  playAgainBtn.hide();
}

function draw() {
  if (state === "INTRO") {
    drawIntroScreen();
    return;
  }

  background(18);
  drawGrid();

  if (state === "WON" || state === "LOST") {
    drawEndScreen();
  }
}

function mousePressed() {
  if (state !== "PLAYING") return;
  if (inputLocked) return;

  const tile = getTileAtMouse(mouseX, mouseY);
  if (!tile) return;

  if (tile.revealed) return;

  tile.reveal();

  if (tile.isMine) {
    state = "LOST";
    showEndUI();
    return;
  }

  // Safe tile
  safeClicked++;

  // Win condition
  if (safeClicked >= safeTotal) {
    state = "WON";
    revealAllMines();
    showEndUI();
  }
}

/* -----------------------------
   Level + Grid Generation
-------------------------------- */

function startGame() {
  state = "PLAYING";
  startBtn.hide();
  resetGame(); // place mines + reset safeClicked
}

function applyLevel(data) {
  cols = data.cols ?? cols;
  rows = data.rows ?? rows;
  tileSize = data.tileSize ?? tileSize;
  padding = data.padding ?? padding;
  mineCount = data.mineCount ?? mineCount;
}

function resetGame() {
  inputLocked = true; // prevent “button click” from also clicking a tile

  state = "PLAYING";

  safeClicked = 0;

  buildGrid();
  placeMinesRandomly(mineCount);
  safeTotal = cols * rows - mineCount;

  playAgainBtn.hide();

  setTimeout(() => {
    inputLocked = false;
  }, 0);
}

function buildGrid() {
  grid = [];

  for (let y = 0; y < rows; y++) {
    const rowArr = [];
    for (let x = 0; x < cols; x++) {
      const px = padding + x * tileSize;
      const py = padding + y * tileSize;
      rowArr.push(new Tile(x, y, px, py, tileSize));
    }
    grid.push(rowArr);
  }
}

function placeMinesRandomly(count) {
  const positions = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      positions.push({ x, y });
    }
  }

  shuffleArray(positions);

  for (let i = 0; i < count; i++) {
    const p = positions[i];
    grid[p.y][p.x].isMine = true;
  }
}

function revealAllMines() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const t = grid[y][x];
      if (t.isMine) t.reveal(true);
    }
  }
}

/* -----------------------------
   Drawing
-------------------------------- */

function drawGrid() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid[y][x].draw();
    }
  }

  // Minimal HUD
  noStroke();
  fill(235);
  textSize(14);
  text(`Safe clicked: ${safeClicked} / ${safeTotal}`, width / 2, padding / 2);
}

function drawIntroScreen() {
  background(18);

  if (grid.length > 0) drawGrid();

  noStroke();
  fill(0, 160);
  rect(0, 0, width, height);

  const boxW = min(520, width * 0.9);
  const boxH = 260;
  const bx = width / 2 - boxW / 2;
  const by = height / 2 - boxH / 2;

  fill(25, 25, 30, 220);
  rect(bx, by, boxW, boxH, 18);

  fill(245);
  textAlign(CENTER, TOP);

  textSize(26);
  text("Mini Mines", width / 2, by + 18);

  textSize(15);
  fill(220);
  const instructions =
    "How to Play\n\n" +
    "• Click tiles one-by-one.\n" +
    "• Safe tile = turns green.\n" +
    "• Mine tile = turns red and the game ends.\n" +
    "• Click all safe tiles to win.\n\n" +
    "No numbers. No hints. Just memory and luck.";
  text(instructions, width / 2, by + 64);

  startBtn.show();
  startBtn.position(
    window.screenX + (window.innerWidth - startBtn.width) / 2,
    window.screenY + (window.innerHeight / 2 + 140),
  );
}

function drawEndScreen() {
  // Semi-transparent overlay
  noStroke();
  fill(0, 140);
  rect(0, 0, width, height);

  const boxW = min(420, width * 0.86);
  const boxH = 190;
  const bx = width / 2 - boxW / 2;
  const by = height / 2 - boxH / 2;

  fill(25, 25, 30, 220);
  rect(bx, by, boxW, boxH, 18);

  fill(245);
  textAlign(CENTER, CENTER);

  textSize(26);
  text(
    state === "WON" ? "You won!" : "Boom. You hit a mine.",
    width / 2,
    by + 48,
  );

  textSize(16);
  fill(220);
  text(`Green tiles: ${safeClicked}`, width / 2, by + 92);

  textSize(13);
  fill(180);
  text("Play again to reset the board", width / 2, by + 126);

  playAgainBtn.position(
    window.screenX + (window.innerWidth - playAgainBtn.width) / 2,
    window.screenY + (window.innerHeight / 2 + 110),
  );
}

function showEndUI() {
  playAgainBtn.show();
}

/* -----------------------------
   Helpers
-------------------------------- */

function getTileAtMouse(mx, my) {
  if (mx < padding || my < padding) return null;

  const gx = floor((mx - padding) / tileSize);
  const gy = floor((my - padding) / tileSize);

  if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) return null;

  return grid[gy][gx];
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/* -----------------------------
   Tile class
-------------------------------- */

class Tile {
  constructor(gridX, gridY, px, py, size) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = px;
    this.y = py;
    this.size = size;

    this.isMine = false;
    this.revealed = false;
    this.colorState = "HIDDEN"; // "HIDDEN" | "SAFE" | "MINE"
  }

  reveal(forceMine = false) {
    this.revealed = true;

    if (this.isMine || forceMine) {
      this.colorState = "MINE";
    } else {
      this.colorState = "SAFE";
    }
  }

  draw() {
    stroke(60);
    strokeWeight(2);

    if (!this.revealed) {
      fill(40);
    } else if (this.colorState === "SAFE") {
      fill(40, 180, 90);
    } else if (this.colorState === "MINE") {
      fill(220, 70, 70);
    }

    rect(this.x, this.y, this.size, this.size, 10);
  }
}
