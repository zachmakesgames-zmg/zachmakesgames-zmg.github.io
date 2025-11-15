// Main entry point for the game

let game = null;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const startButton = document.getElementById('start-button');
    const introScreen = document.getElementById('intro-screen');

    // Create game instance
    game = new Game(canvas);

    // Start button handler
    startButton.addEventListener('click', () => {
        introScreen.classList.remove('active');
        game.start();
    });

    // Enable debug mode with 'd' key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'D') {
            window.DEBUG = !window.DEBUG;
            console.log('Debug mode:', window.DEBUG);
        }

        // Pause with 'P' key
        if (e.key === 'p' || e.key === 'P') {
            if (game && game.isRunning) {
                game.pause();
            }
        }
    });

    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    console.log('Boulder game initialized. Click "Begin Journey" to start.');
});

// Handle page visibility changes (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (game && game.isRunning) {
        if (document.hidden) {
            game.isPaused = true;
        } else {
            // Reset time to prevent large delta jumps
            game.lastTime = Date.now();
            game.isPaused = false;
        }
    }
});
