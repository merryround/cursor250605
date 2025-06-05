const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('next-piece');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('start-button');

const BLOCK_SIZE = 20;
const ROWS = 20;
const COLS = 12;
let score = 0;
let level = 1;
let gameLoop;
let dropInterval = 1000;
let lastDrop = 0;

// 테트리스 블록 모양 정의
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

const COLORS = [
    '#00f0f0', // cyan
    '#f0f000', // yellow
    '#a000f0', // purple
    '#f0a000', // orange
    '#0000f0', // blue
    '#00f000', // green
    '#f00000'  // red
];

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece = null;
let nextPiece = null;
let gameOver = true;

class Piece {
    constructor(shape = null, color = null) {
        this.shape = shape || SHAPES[Math.floor(Math.random() * SHAPES.length)];
        this.color = color || COLORS[SHAPES.findIndex(s => s === this.shape)];
        this.x = Math.floor((COLS - this.shape[0].length) / 2);
        this.y = 0;
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillStyle = this.color;
                    ctx.fillRect((this.x + x + offsetX) * BLOCK_SIZE, 
                               (this.y + y + offsetY) * BLOCK_SIZE, 
                               BLOCK_SIZE - 1, 
                               BLOCK_SIZE - 1);
                }
            });
        });
    }
}

function createNewPiece() {
    currentPiece = nextPiece || new Piece();
    nextPiece = new Piece();
    if (isCollision()) {
        gameOver = true;
        clearInterval(gameLoop);
        alert('게임 오버! 점수: ' + score);
    }
}

function drawBoard() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = COLORS[value - 1];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, 
                           BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        });
    });
}

function drawNextPiece() {
    nextPieceCtx.fillStyle = '#fff';
    nextPieceCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    if (nextPiece) {
        const offsetX = Math.floor((5 - nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((5 - nextPiece.shape.length) / 2);
        nextPiece.draw(nextPieceCtx, offsetX, offsetY);
    }
}

function isCollision() {
    return currentPiece.shape.some((row, y) => {
        return row.some((value, x) => {
            if (!value) return false;
            const newX = currentPiece.x + x;
            const newY = currentPiece.y + y;
            return newX < 0 || newX >= COLS || 
                   newY >= ROWS || 
                   (newY >= 0 && board[newY][newX]);
        });
    });
}

function rotate() {
    const newShape = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[row.length - 1 - i])
    );
    const originalShape = currentPiece.shape;
    currentPiece.shape = newShape;
    if (isCollision()) {
        currentPiece.shape = originalShape;
    }
}

function merge() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const pieceIndex = COLORS.indexOf(currentPiece.color) + 1;
                board[currentPiece.y + y][currentPiece.x + x] = pieceIndex;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(value => value)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        scoreElement.textContent = score;
        if (score >= level * 1000) {
            level++;
            levelElement.textContent = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }
}

function drop() {
    currentPiece.y++;
    if (isCollision()) {
        currentPiece.y--;
        merge();
        clearLines();
        createNewPiece();
    }
}

function move(dir) {
    currentPiece.x += dir;
    if (isCollision()) {
        currentPiece.x -= dir;
    }
}

function gameUpdate(timestamp) {
    if (!lastDrop) lastDrop = timestamp;
    const delta = timestamp - lastDrop;

    if (delta > dropInterval) {
        drop();
        lastDrop = timestamp;
    }

    drawBoard();
    if (currentPiece) {
        currentPiece.draw(ctx);
    }
    drawNextPiece();

    if (!gameOver) {
        requestAnimationFrame(gameUpdate);
    }
}

function startGame() {
    if (!gameOver) return;
    
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    dropInterval = 1000;
    gameOver = false;
    lastDrop = 0;
    
    createNewPiece();
    requestAnimationFrame(gameUpdate);
}

document.addEventListener('keydown', event => {
    if (gameOver) return;
    
    switch (event.key) {
        case 'ArrowLeft':
            move(-1);
            break;
        case 'ArrowRight':
            move(1);
            break;
        case 'ArrowDown':
            drop();
            break;
        case 'ArrowUp':
            rotate();
            break;
    }
});

startButton.addEventListener('click', startGame); 