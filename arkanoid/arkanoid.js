const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startButton = document.getElementById('start-button');

// 게임 상수
const PADDLE_WIDTH = 75;
const PADDLE_HEIGHT = 10;
const PADDLE_SPEED = 7;
const BALL_RADIUS = 5;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 45;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 8;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = (canvas.width - (BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING) - BRICK_PADDING)) / 2;

// 게임 변수
let score = 0;
let lives = 3;
let gameStarted = false;
let animationId = null;

// 패들 객체
const paddle = {
    x: canvas.width / 2 - PADDLE_WIDTH / 2,
    y: canvas.height - PADDLE_HEIGHT - 10,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dx: 0
};

// 공 객체
const ball = {
    x: canvas.width / 2,
    y: paddle.y - BALL_RADIUS,
    radius: BALL_RADIUS,
    speed: 4,
    dx: 4,
    dy: -4
};

// 벽돌 배열 초기화
let bricks = [];
function initBricks() {
    for (let row = 0; row < BRICK_ROWS; row++) {
        bricks[row] = [];
        for (let col = 0; col < BRICK_COLS; col++) {
            const brickX = col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            const brickY = row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
            bricks[row][col] = {
                x: brickX,
                y: brickY,
                status: 1,
                color: getRowColor(row)
            };
        }
    }
}

// 행별 벽돌 색상
function getRowColor(row) {
    const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF'];
    return colors[row];
}

// 충돌 감지
function collisionDetection() {
    // 벽돌과 공의 충돌
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            const brick = bricks[row][col];
            if (brick.status === 1) {
                if (ball.x > brick.x && 
                    ball.x < brick.x + BRICK_WIDTH &&
                    ball.y > brick.y && 
                    ball.y < brick.y + BRICK_HEIGHT) {
                    ball.dy = -ball.dy;
                    brick.status = 0;
                    score += 10;
                    scoreElement.textContent = score;
                    
                    // 모든 벽돌이 깨졌는지 확인
                    if (score === BRICK_ROWS * BRICK_COLS * 10) {
                        alert('축하합니다! 게임 클리어!');
                        resetGame();
                        return;
                    }
                }
            }
        }
    }

    // 패들과 공의 충돌
    if (ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        // 패들의 어느 부분에 맞았는지에 따라 반사 각도 조절
        const hitPoint = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
        ball.dx = hitPoint * 5; // 최대 ±5의 속도로 x방향 변경
        ball.dy = -Math.abs(ball.dy); // 항상 위로 튀게 함
    }
}

// 게임 상태 업데이트
function update() {
    if (!gameStarted) return;

    // 패들 이동
    paddle.x += paddle.dx;
    
    // 패들이 캔버스를 벗어나지 않도록
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }

    // 공 이동
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 벽과 공의 충돌
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    // 공이 바닥에 떨어졌을 때
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        livesElement.textContent = lives;
        
        if (lives === 0) {
            alert('게임 오버!');
            resetGame();
            return;
        } else {
            resetBall();
        }
    }

    collisionDetection();
}

// 게임 화면 그리기
function draw() {
    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 벽돌 그리기
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            const brick = bricks[row][col];
            if (brick.status === 1) {
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
                ctx.fillStyle = brick.color;
                ctx.fill();
                ctx.strokeStyle = '#FFF';
                ctx.stroke();
                ctx.closePath();
            }
        }
    }

    // 패들 그리기
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();

    // 공 그리기
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.closePath();
}

// 게임 루프
function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// 공 위치 초기화
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = paddle.y - ball.radius;
    ball.dx = 4;
    ball.dy = -4;
    gameStarted = false;
}

// 게임 초기화
function resetGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    score = 0;
    lives = 3;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    initBricks();
    resetBall();
    paddle.x = canvas.width / 2 - paddle.width / 2;
    gameStarted = false;
    gameLoop();
}

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        paddle.dx = -PADDLE_SPEED;
    }
    else if (e.key === 'ArrowRight') {
        paddle.dx = PADDLE_SPEED;
    }
    else if (e.key === ' ' && !gameStarted) {
        gameStarted = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' && paddle.dx < 0) {
        paddle.dx = 0;
    }
    else if (e.key === 'ArrowRight' && paddle.dx > 0) {
        paddle.dx = 0;
    }
});

// 마우스/터치 이벤트
canvas.addEventListener('mousemove', (e) => {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
});

canvas.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
    }
});

// 시작 버튼
startButton.addEventListener('click', () => {
    resetGame();
});

// 초기 게임 설정
resetGame(); 