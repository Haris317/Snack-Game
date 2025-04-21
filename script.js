// Game variables
let canvas;
let ctx;
let snake = [];
let food = {};
let direction = 'right';
let gameSpeed = 100;
let gameInterval;
let score = 0;
let gameRunning = false;
let currentDifficulty = 'normal';
let obstacles = [];
let highScores = { normal: 0, medium: 0, hard: 0 };

// Grid settings
const gridSize = 20;
const gridWidth = 400 / gridSize;
const gridHeight = 400 / gridSize;

// Difficulty settings
const difficultySettings = {
    normal: { speed: 100, obstacleCount: 0 },
    medium: { speed: 80, obstacleCount: 3 },
    hard: { speed: 60, obstacleCount: 6 }
};

// Initialize the game
window.onload = function() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    // Load high scores from localStorage
    loadHighScores();
    updateHighScoreDisplay();
    
    // Set up event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('start-btn').addEventListener('click', startGame);
    
    // Difficulty buttons
    document.getElementById('normal-btn').addEventListener('click', () => setDifficulty('normal'));
    document.getElementById('medium-btn').addEventListener('click', () => setDifficulty('medium'));
    document.getElementById('hard-btn').addEventListener('click', () => setDifficulty('hard'));
    
    // Mobile controls
    document.getElementById('up-btn').addEventListener('click', () => changeDirection('up'));
    document.getElementById('down-btn').addEventListener('click', () => changeDirection('down'));
    document.getElementById('left-btn').addEventListener('click', () => changeDirection('left'));
    document.getElementById('right-btn').addEventListener('click', () => changeDirection('right'));
    
    // Draw initial screen
    drawGrid();
    drawMessage('Press Start to Play');
};

// Set game difficulty
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    // Update UI
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${difficulty}-btn`).classList.add('active');
    
    // Update high score display
    updateHighScoreDisplay();
}

// Load high scores from localStorage
function loadHighScores() {
    const savedScores = localStorage.getItem('snakeHighScores');
    if (savedScores) {
        highScores = JSON.parse(savedScores);
    }
}

// Save high scores to localStorage
function saveHighScores() {
    localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
}

// Update high score display
function updateHighScoreDisplay() {
    document.getElementById('high-score').textContent = highScores[currentDifficulty];
}

// Start the game
function startGame() {
    if (gameRunning) return;
    
    // Reset game state
    snake = [
        {x: 5, y: 10},
        {x: 4, y: 10},
        {x: 3, y: 10}
    ];
    direction = 'right';
    score = 0;
    document.getElementById('score').textContent = score;
    
    // Apply difficulty settings
    gameSpeed = difficultySettings[currentDifficulty].speed;
    
    // Create obstacles based on difficulty
    createObstacles();
    
    // Create initial food
    createFood();
    
    // Start game loop
    gameRunning = true;
    gameInterval = setInterval(gameLoop, gameSpeed);
}

// Create obstacles based on current difficulty
function createObstacles() {
    obstacles = [];
    const obstacleCount = difficultySettings[currentDifficulty].obstacleCount;
    
    if (obstacleCount === 0) return;
    
    for (let i = 0; i < obstacleCount; i++) {
        let position;
        let validPosition = false;
        
        // Try to find a valid position that doesn't overlap with snake
        while (!validPosition) {
            position = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
            
            // Check if position overlaps with snake
            validPosition = true;
            for (let segment of snake) {
                if (segment.x === position.x && segment.y === position.y) {
                    validPosition = false;
                    break;
                }
            }
            
            // Check if position overlaps with other obstacles
            for (let obstacle of obstacles) {
                if (obstacle.x === position.x && obstacle.y === position.y) {
                    validPosition = false;
                    break;
                }
            }
            
            // Ensure obstacles aren't too close to snake's starting position
            if (Math.abs(position.x - 5) < 3 && Math.abs(position.y - 10) < 3) {
                validPosition = false;
            }
        }
        
        obstacles.push(position);
    }
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Move snake
    moveSnake();
    
    // Check collisions
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    // Check if food eaten
    if (snake[0].x === food.x && snake[0].y === food.y) {
        eatFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
    
    // Draw obstacles
    drawObstacles();
    
    // Draw food
    drawFood();
    
    // Draw snake
    drawSnake();
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        // Create gradient for obstacle
        const gradient = ctx.createRadialGradient(
            obstacle.x * gridSize + gridSize/2,
            obstacle.y * gridSize + gridSize/2,
            gridSize/6,
            obstacle.x * gridSize + gridSize/2,
            obstacle.y * gridSize + gridSize/2,
            gridSize/2
        );
        gradient.addColorStop(0, '#555555');
        gradient.addColorStop(1, '#333333');
        
        ctx.fillStyle = gradient;
        
        // Draw obstacle
        ctx.beginPath();
        ctx.rect(
            obstacle.x * gridSize + 2,
            obstacle.y * gridSize + 2,
            gridSize - 4,
            gridSize - 4
        );
        ctx.fill();
        
        // Add cross pattern
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obstacle.x * gridSize + 5, obstacle.y * gridSize + 5);
        ctx.lineTo(obstacle.x * gridSize + gridSize - 5, obstacle.y * gridSize + gridSize - 5);
        ctx.moveTo(obstacle.x * gridSize + gridSize - 5, obstacle.y * gridSize + 5);
        ctx.lineTo(obstacle.x * gridSize + 5, obstacle.y * gridSize + gridSize - 5);
        ctx.stroke();
    });
}

// Move the snake based on current direction
function moveSnake() {
    const head = {x: snake[0].x, y: snake[0].y};
    
    switch(direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }
    
    // Add new head to the beginning of snake array
    snake.unshift(head);
}

// Handle keyboard controls
function handleKeyPress(e) {
    switch(e.key) {
        case 'ArrowUp':
            changeDirection('up');
            break;
        case 'ArrowDown':
            changeDirection('down');
            break;
        case 'ArrowLeft':
            changeDirection('left');
            break;
        case 'ArrowRight':
            changeDirection('right');
            break;
    }
}

// Change snake direction
function changeDirection(newDirection) {
    // Prevent 180-degree turns
    if (
        (direction === 'up' && newDirection === 'down') ||
        (direction === 'down' && newDirection === 'up') ||
        (direction === 'left' && newDirection === 'right') ||
        (direction === 'right' && newDirection === 'left')
    ) {
        return;
    }
    
    direction = newDirection;
}

// Check for collisions with walls or self
function checkCollision() {
    const head = snake[0];
    
    // Check wall collision
    if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
        return true;
    }
    
    // Check self collision (skip the head)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    // Check obstacle collision
    for (let obstacle of obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            return true;
        }
    }
    
    return false;
}

// Handle food consumption
function eatFood() {
    // Increase score
    score += 10;
    
    // Update score with animation
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = score;
    scoreElement.style.animation = 'none';
    // Trigger reflow to restart animation
    void scoreElement.offsetWidth;
    scoreElement.style.animation = 'pulse 0.5s ease-out';
    
    // Create new food
    createFood();
    
    // Increase speed slightly every 5 food items
    if (score % 50 === 0 && gameSpeed > 50) {
        clearInterval(gameInterval);
        gameSpeed -= 5;
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

// Create food at random position
function createFood() {
    // Generate random position
    let position;
    let validPosition;
    
    do {
        position = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // Check if position is valid (not on snake or obstacles)
        validPosition = true;
        
        // Check if on snake
        for (let segment of snake) {
            if (segment.x === position.x && segment.y === position.y) {
                validPosition = false;
                break;
            }
        }
        
        // Check if on obstacle
        if (validPosition) {
            for (let obstacle of obstacles) {
                if (obstacle.x === position.x && obstacle.y === position.y) {
                    validPosition = false;
                    break;
                }
            }
        }
    } while (!validPosition);
    
    food = position;
}

// Game over
function gameOver() {
    clearInterval(gameInterval);
    gameRunning = false;
    
    // Check if high score was achieved
    if (score > highScores[currentDifficulty]) {
        highScores[currentDifficulty] = score;
        saveHighScores();
        updateHighScoreDisplay();
        drawMessage(`New High Score: ${score}! Press Start to Play Again`);
    } else {
        drawMessage(`Game Over! Score: ${score}. Press Start to Play Again`);
    }
}

// Draw the snake
function drawSnake() {
    snake.forEach((segment, index) => {
        // Calculate gradient colors based on position in snake
        const gradientPos = index / Math.max(1, snake.length - 1);
        
        // Create gradient for snake segments
        if (index === 0) {
            // Head with special gradient
            const gradient = ctx.createLinearGradient(
                segment.x * gridSize,
                segment.y * gridSize,
                segment.x * gridSize + gridSize,
                segment.y * gridSize + gridSize
            );
            gradient.addColorStop(0, '#4776E6');
            gradient.addColorStop(1, '#8E54E9');
            ctx.fillStyle = gradient;
        } else {
            // Body with gradient based on position
            const gradient = ctx.createLinearGradient(
                segment.x * gridSize,
                segment.y * gridSize,
                segment.x * gridSize + gridSize,
                segment.y * gridSize + gridSize
            );
            gradient.addColorStop(0, '#4776E6');
            gradient.addColorStop(1, `rgba(71, 118, 230, ${0.7 - gradientPos * 0.5})`);
            ctx.fillStyle = gradient;
        }
        
        // Draw rounded rectangle for segments
        const radius = index === 0 ? 8 : 6;
        const segSize = index === 0 ? gridSize : gridSize - 2;
        const xPos = segment.x * gridSize + (index === 0 ? 0 : 1);
        const yPos = segment.y * gridSize + (index === 0 ? 0 : 1);
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(xPos + radius, yPos);
        ctx.lineTo(xPos + segSize - radius, yPos);
        ctx.quadraticCurveTo(xPos + segSize, yPos, xPos + segSize, yPos + radius);
        ctx.lineTo(xPos + segSize, yPos + segSize - radius);
        ctx.quadraticCurveTo(xPos + segSize, yPos + segSize, xPos + segSize - radius, yPos + segSize);
        ctx.lineTo(xPos + radius, yPos + segSize);
        ctx.quadraticCurveTo(xPos, yPos + segSize, xPos, yPos + segSize - radius);
        ctx.lineTo(xPos, yPos + radius);
        ctx.quadraticCurveTo(xPos, yPos, xPos + radius, yPos);
        ctx.closePath();
        ctx.fill();
        
        // Add shine effect to head
        if (index === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(
                xPos + segSize/4,
                yPos + segSize/4,
                segSize/6,
                segSize/8,
                Math.PI/4,
                0,
                2 * Math.PI
            );
            ctx.fill();
        }
    });
}

// Draw the food
function drawFood() {
    // Create radial gradient for food
    const gradient = ctx.createRadialGradient(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/6,
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2
    );
    gradient.addColorStop(0, '#FF4D4D');
    gradient.addColorStop(1, '#FF8080');
    
    ctx.fillStyle = gradient;
    
    // Calculate pulse animation
    const time = Date.now() / 1000;
    const pulseFactor = 0.1 * Math.sin(time * 5) + 0.9;
    
    // Draw food with pulse animation
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        (gridSize/2 - 1) * pulseFactor,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Add shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(
        food.x * gridSize + gridSize/3,
        food.y * gridSize + gridSize/3,
        gridSize/6 * pulseFactor,
        gridSize/8 * pulseFactor,
        Math.PI/4,
        0,
        2 * Math.PI
    );
    ctx.fill();
}

// Draw grid background
function drawGrid() {
    // Calculate grid opacity based on time for subtle animation
    const time = Date.now() / 1000;
    const opacity = 0.1 + 0.05 * Math.sin(time);
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Add subtle glow to grid
    ctx.fillStyle = 'rgba(71, 118, 230, 0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw message on canvas
function drawMessage(message) {
    const time = Date.now() / 1000;
    const isGameOver = message.includes('Game Over') || message.includes('New High Score');
    
    // Create a semi-transparent overlay for the entire canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add animated particles for game over
    if (isGameOver) {
        drawGameOverParticles(time);
    }
    
    // Draw modal card with glass morphism effect
    const rectHeight = isGameOver ? 160 : 80;
    const rectWidth = canvas.width * 0.85;
    const rectX = (canvas.width - rectWidth) / 2;
    const rectY = canvas.height/2 - rectHeight/2;
    const radius = 15;
    
    // Card background with glass morphism effect
    ctx.save();
    ctx.fillStyle = 'rgba(40, 40, 60, 0.85)';
    
    // Draw rounded rectangle
    ctx.beginPath();
    ctx.moveTo(rectX + radius, rectY);
    ctx.lineTo(rectX + rectWidth - radius, rectY);
    ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
    ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
    ctx.lineTo(rectX + radius, rectY + rectHeight);
    ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
    ctx.lineTo(rectX, rectY + radius);
    ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
    ctx.closePath();
    ctx.fill();
    
    // Add subtle inner border
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add subtle gradient overlay
    const gradient = ctx.createLinearGradient(rectX, rectY, rectX + rectWidth, rectY + rectHeight);
    gradient.addColorStop(0, 'rgba(255, 70, 70, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 150, 70, 0.15)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add shine effect
    ctx.beginPath();
    ctx.moveTo(rectX, rectY + radius);
    ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
    ctx.lineTo(rectX + rectWidth - radius, rectY);
    ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
    ctx.lineTo(rectX + rectWidth, rectY + radius + 20);
    ctx.lineTo(rectX, rectY + radius + 40);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    
    // Draw title with glow effect
    if (isGameOver) {
        // Game Over title
        const pulseValue = Math.sin(time * 3) * 0.1 + 0.9;
        ctx.shadowColor = 'rgba(255, 70, 70, 0.8)';
        ctx.shadowBlur = 15 * pulseValue;
        ctx.fillStyle = '#FF5555';
        ctx.font = 'bold 28px Poppins, sans-serif';
        ctx.textAlign = 'center';
        
        // Use consistent title for both game over and high score
        ctx.fillText('GAME OVER', canvas.width/2, rectY + 45);
        
        // Score display
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px Poppins, sans-serif';
        ctx.fillText(`Your Score: ${score}`, canvas.width/2, rectY + 80);
        
        // Instruction text with high score indication if applicable
        ctx.shadowBlur = 2;
        ctx.font = '16px Poppins, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        if (message.includes('New High Score')) {
            ctx.fillText('New High Score! Press Start to Play Again', canvas.width/2, rectY + 115);
        } else {
            ctx.fillText('Press Start to Play Again', canvas.width/2, rectY + 115);
        }
        
        // Add decorative elements
        drawDecorativeElements(rectX, rectY, rectWidth, rectHeight, time);
    } else {
        // Normal message
        ctx.shadowColor = 'rgba(100, 150, 255, 0.7)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'white';
        ctx.font = '20px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width/2, rectY + rectHeight/2 + 7);
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.restore();
}

// Draw particles for game over effect
function drawGameOverParticles(time) {
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        // Create pseudo-random but deterministic positions based on index and time
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.2;
        const distance = 100 + Math.sin(i * 8.347 + time) * 50;
        const x = canvas.width/2 + Math.cos(angle) * distance;
        const y = canvas.height/2 + Math.sin(angle) * distance * 0.6;
        const size = 3 + Math.sin(i * 0.747 + time * 2) * 2;
        
        // Alternate colors
        const hue = (i * 12) % 60 + 350; // Reds to oranges
        const opacity = 0.3 + Math.sin(time * 2 + i) * 0.2;
        
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw decorative elements for game over screen
function drawDecorativeElements(rectX, rectY, rectWidth, rectHeight, time) {
    // Draw snake icon
    const iconX = rectX + rectWidth - 50;
    const iconY = rectY + 35;
    
    // Snake head
    ctx.fillStyle = '#4776E6';
    ctx.beginPath();
    ctx.arc(iconX, iconY, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Snake body
    for (let i = 1; i < 3; i++) {
        const offset = i * 15;
        ctx.fillStyle = `rgba(71, 118, 230, ${0.7 - i * 0.2})`;
        ctx.beginPath();
        ctx.arc(iconX - offset, iconY, 8 - i, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw food icon
    const foodX = rectX + 50;
    const foodY = rectY + 35;
    const pulseFactor = 0.1 * Math.sin(time * 5) + 0.9;
    
    ctx.fillStyle = '#FF4D4D';
    ctx.beginPath();
    ctx.arc(foodX, foodY, 8 * pulseFactor, 0, Math.PI * 2);
    ctx.fill();
}