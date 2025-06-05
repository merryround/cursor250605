// 게임 설정
const DIFFICULTY = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 }
};

// 게임 변수
let currentLevel = 'beginner';
let board = [];
let mineLocations = [];
let gameStarted = false;
let gameOver = false;
let timer = 0;
let timerInterval;
let minesLeft;

// DOM 요소
const boardElement = document.getElementById('board');
const minesElement = document.getElementById('mines');
const timeElement = document.getElementById('time');
const startButton = document.getElementById('start-button');
const difficultyButtons = document.querySelectorAll('.difficulty button');

// 게임 초기화
function initGame() {
    const { rows, cols, mines } = DIFFICULTY[currentLevel];
    board = [];
    mineLocations = [];
    gameStarted = false;
    gameOver = false;
    timer = 0;
    minesLeft = mines;
    clearInterval(timerInterval);
    timeElement.textContent = '0';
    minesElement.textContent = minesLeft;

    // 보드 크기 설정
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    boardElement.innerHTML = '';

    // 보드 초기화
    for (let i = 0; i < rows; i++) {
        board[i] = [];
        for (let j = 0; j < cols; j++) {
            board[i][j] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
            
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleClick);
            cell.addEventListener('contextmenu', handleRightClick);
            boardElement.appendChild(cell);
        }
    }

    // 지뢰 배치
    placeMines();
    calculateNumbers();
}

// 지뢰 배치
function placeMines() {
    const { rows, cols, mines } = DIFFICULTY[currentLevel];
    let minesPlaced = 0;

    while (minesPlaced < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);

        if (!board[row][col].isMine) {
            board[row][col].isMine = true;
            mineLocations.push({ row, col });
            minesPlaced++;
        }
    }
}

// 주변 지뢰 개수 계산
function calculateNumbers() {
    const { rows, cols } = DIFFICULTY[currentLevel];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!board[row][col].isMine) {
                let count = 0;
                // 주변 8칸 확인
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const newRow = row + i;
                        const newCol = col + j;
                        if (newRow >= 0 && newRow < rows && 
                            newCol >= 0 && newCol < cols && 
                            board[newRow][newCol].isMine) {
                            count++;
                        }
                    }
                }
                board[row][col].neighborMines = count;
            }
        }
    }
}

// 셀 클릭 처리
function handleClick(e) {
    if (gameOver) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    if (board[row][col].isFlagged) return;

    revealCell(row, col);
}

// 우클릭 처리 (깃발)
function handleRightClick(e) {
    e.preventDefault();
    if (gameOver) return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    if (!board[row][col].isRevealed) {
        const cell = e.target;
        if (board[row][col].isFlagged) {
            board[row][col].isFlagged = false;
            cell.classList.remove('flagged');
            minesLeft++;
        } else {
            board[row][col].isFlagged = true;
            cell.classList.add('flagged');
            minesLeft--;
        }
        minesElement.textContent = minesLeft;
    }
}

// 셀 공개
function revealCell(row, col) {
    const cell = boardElement.children[row * DIFFICULTY[currentLevel].cols + col];
    
    if (board[row][col].isRevealed || board[row][col].isFlagged) return;

    board[row][col].isRevealed = true;
    cell.classList.add('revealed');

    if (board[row][col].isMine) {
        gameOver = true;
        cell.classList.add('mine');
        revealAllMines();
        clearInterval(timerInterval);
        alert('게임 오버!');
        return;
    }

    if (board[row][col].neighborMines > 0) {
        cell.textContent = board[row][col].neighborMines;
        cell.dataset.number = board[row][col].neighborMines;
    } else {
        // 주변 8칸 자동 공개
        const { rows, cols } = DIFFICULTY[currentLevel];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < rows && 
                    newCol >= 0 && newCol < cols) {
                    revealCell(newRow, newCol);
                }
            }
        }
    }

    checkWin();
}

// 모든 지뢰 공개
function revealAllMines() {
    mineLocations.forEach(({ row, col }) => {
        const cell = boardElement.children[row * DIFFICULTY[currentLevel].cols + col];
        cell.classList.add('revealed', 'mine');
    });
}

// 승리 조건 확인
function checkWin() {
    const { rows, cols, mines } = DIFFICULTY[currentLevel];
    let revealedCount = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (board[row][col].isRevealed && !board[row][col].isMine) {
                revealedCount++;
            }
        }
    }

    if (revealedCount === (rows * cols) - mines) {
        gameOver = true;
        clearInterval(timerInterval);
        alert('축하합니다! 승리하셨습니다!');
    }
}

// 타이머
function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        timeElement.textContent = timer;
    }, 1000);
}

// 난이도 변경
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.dataset.level === currentLevel) return;
        
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentLevel = button.dataset.level;
        initGame();
    });
});

// 새 게임 시작
startButton.addEventListener('click', initGame);

// 초기 게임 시작
initGame(); 