const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player settings
const playerWidth = 30;
const playerHeight = 30;
let playerX = (canvas.width - playerWidth) / 2;
const playerSpeed = 7;


let moveLeft = false;
let moveRight = false;


// Bullet settings
const bulletWidth = 5;
const bulletHeight = 8;
const bullets = [];
const bulletSpeed = 7;
const bulletFireRate = 75; // Frames between automatic bullet firing
let bulletMultiplier = 1;


// Invader settings
const invaders = [];
const invaderSpeed = 1;
const maxInvaderWidth = 60;
const minInvaderWidth = 20;

// PowerUp settings
const powerUps = [];
const powerUpWidth = 20;
const powerUpHeight = 20;
const powerUpDropRate = 0.0005;  // .5% chance every frame
const powerUpSpeed = 2;  // Adjust this value to set the desired speed
const powerUpTypes = ['doubleBullet'];
let activePowerUp = null;
const fastFireRate = 15;  // Reduced fire rate for the fastFire power-up


let score = 0;  // Score variable
const spawnRate = 150;  // Frames between new invader spawns
let frameCount = 0;  // Frame counter

function createInvader() {
    const width = Math.random() * (maxInvaderWidth - minInvaderWidth) + minInvaderWidth;
    const height = (width / maxInvaderWidth) * maxInvaderWidth; // Keeping aspect ratio
    const x = Math.random() * (canvas.width - width);
    const maxHealth = Math.floor(score / 50) + 3; // Increase max health every 100 points
    const health = Math.floor(Math.random() * maxHealth) + 1; // Random health between 1 and maxHealth
    invaders.push({ x: x, y: -height, width: width, height: height, health: health });
}

function drawPlayer() {
    ctx.fillStyle = 'white';
    ctx.fillRect(playerX, canvas.height - playerHeight, playerWidth, playerHeight);
}

function movePlayer(direction) {
    playerX += direction * playerSpeed;
}

function drawBullet(bullet) {
    ctx.fillStyle = 'red';
    ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
}

function drawInvader(invader) {
    ctx.fillStyle = 'green';
    ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
}

function drawScore() {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 10, 30);
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function spawnPowerUp() {
    const x = Math.random() * (canvas.width - powerUpWidth);
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUps.push({ x: x, y: 0, width: powerUpWidth, height: powerUpHeight, type: type });
}

function drawPowerUp(powerUp) {
    ctx.fillStyle = powerUp.type === 'doubleBullet' ? 'blue' : 'purple';
    ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
}


document.addEventListener('keydown', function(event) {
    if (event.code === 'ArrowLeft') {
        moveLeft = true;
    } else if (event.code === 'ArrowRight') {
        moveRight = true;
    }
});

document.addEventListener('keyup', function(event) {
    if (event.code === 'ArrowLeft') {
        moveLeft = false;
    } else if (event.code === 'ArrowRight') {
        moveRight = false;
    }
});

document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);
document.addEventListener('touchend', handleTouchEnd, false);

let touchX = null;

function handleTouchStart(evt) {
    touchX = evt.touches[0].clientX;
}

function handleTouchMove(evt) {
    evt.preventDefault();  // Prevent the default scroll behavior

    let newTouchX = evt.touches[0].clientX;
    if (newTouchX < touchX && playerX > 0) {
        movePlayer(-1);
    } else if (newTouchX > touchX && playerX < canvas.width - playerWidth) {
        movePlayer(1);
    }
    touchX = newTouchX;
}

function handleTouchEnd(evt) {
    touchX = null;
}


function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    drawScore();

    let gameOver = false;
    invaders.forEach((invader, index) => {
        invader.y += invaderSpeed;
        drawInvader(invader);

        // Check for collision with player
        if (isColliding({ x: playerX, y: canvas.height - playerHeight, width: playerWidth, height: playerHeight }, invader)) {
            gameOver = true;
        }

        // Check if invader has passed the player
        if (invader.y + invader.height > canvas.height - playerHeight) {
            gameOver = true;
        }

        // Remove invaders that go below the canvas
        if (invader.y > canvas.height) {
            invaders.splice(index, 1);
        }
    });

    if (gameOver) {
        ctx.font = '48px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        return; // Stop updating the game
    }

    bullets.forEach((bullet, index) => {
        bullet.y -= bulletSpeed;
        drawBullet(bullet);
    
        invaders.forEach((invader, invaderIndex) => {
            if (bullet.x < invader.x + invader.width &&
                bullet.x + bulletWidth > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bulletHeight > invader.y) {
                bullets.splice(index, 1);
                invader.health--;
                if (invader.health <= 0) {
                    invaders.splice(invaderIndex, 1);
                    score += 10;  // Increase score
                }
            }
        });
    
        if (bullet.y < 0) { // Remove bullets that go above the canvas
            bullets.splice(index, 1);
        }
    });
    
    

    invaders.forEach((invader, index) => {
        const adjustedSpeed = invaderSpeed / (1 + 0.5 * invader.health);
        invader.y += adjustedSpeed;

        drawInvader(invader);

        // Remove invaders that go below the canvas
        if (invader.y > canvas.height) {
            invaders.splice(index, 1);
        }
    });

    frameCount++;
    if (frameCount % spawnRate === 0) {
        createInvader();  // Spawn a new invader
    }

    if (frameCount % bulletFireRate === 0) {
        const spacing = playerWidth / (bulletMultiplier + 1); // Calculate the spacing between bullets
        for (let i = 1; i <= bulletMultiplier; i++) {
            bullets.push({ x: playerX + spacing * i - bulletWidth / 2, y: canvas.height - playerHeight - bulletHeight });
        }
    }
    
    

    if (moveLeft && playerX > 0) {
        movePlayer(-1);
    }
    
    if (moveRight && playerX < canvas.width - playerWidth) {
        movePlayer(1);
    }
    
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUpSpeed;

        drawPowerUp(powerUp);
    
        // Check for collision with player
        if (isColliding({ x: playerX, y: canvas.height - playerHeight, width: playerWidth, height: playerHeight }, powerUp)) {
            bulletMultiplier++;
            powerUps.splice(index, 1);  // Remove the power-up after collecting
        }
    
        // Remove power-ups that go below the canvas
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
    
    if (Math.random() < powerUpDropRate) {
        spawnPowerUp();
    }    

    requestAnimationFrame(updateGame);
}

updateGame();
