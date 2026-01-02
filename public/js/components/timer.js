/**
 * Stopwatch Timer Component
 * Simple timer that counts up from 0 for workout sessions
 */

// Timer state
let timerState = {
    seconds: 0,
    intervalId: null,
    isRunning: false
};

/**
 * Create HTML for a stopwatch timer
 * @returns {string} HTML string for timer UI
 */
export function createStopwatch() {
    return `
        <div class="stopwatch-section">
            <div class="stopwatch-label">⏱️ Workout Timer</div>
            <div class="stopwatch-display" id="stopwatch-display">
                00:00
            </div>
            <div class="stopwatch-controls">
                <button class="timer-btn timer-start" id="stopwatch-start" onclick="window.startStopwatch()">
                    ▶ Start
                </button>
                <button class="timer-btn timer-pause" id="stopwatch-pause" onclick="window.pauseStopwatch()" disabled>
                    ⏸ Pause
                </button>
                <button class="timer-btn timer-reset" id="stopwatch-reset" onclick="window.resetStopwatch()">
                    ↻ Reset
                </button>
            </div>
        </div>
    `;
}

/**
 * Format seconds into MM:SS display
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Update stopwatch display
 */
function updateDisplay() {
    const displayEl = document.getElementById('stopwatch-display');
    if (displayEl) {
        displayEl.textContent = formatTime(timerState.seconds);
    }
}

/**
 * Start stopwatch
 */
window.startStopwatch = function() {
    if (timerState.isRunning) return;

    const startBtn = document.getElementById('stopwatch-start');
    const pauseBtn = document.getElementById('stopwatch-pause');

    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;

    timerState.isRunning = true;
    timerState.intervalId = setInterval(() => {
        timerState.seconds++;
        updateDisplay();
    }, 1000);
};

/**
 * Pause stopwatch
 */
window.pauseStopwatch = function() {
    if (!timerState.isRunning) return;

    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
    timerState.isRunning = false;

    const startBtn = document.getElementById('stopwatch-start');
    const pauseBtn = document.getElementById('stopwatch-pause');

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
};

/**
 * Reset stopwatch
 */
window.resetStopwatch = function() {
    // Stop if running
    if (timerState.isRunning) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
        timerState.isRunning = false;
    }

    // Reset state
    timerState.seconds = 0;
    updateDisplay();

    // Reset buttons
    const startBtn = document.getElementById('stopwatch-start');
    const pauseBtn = document.getElementById('stopwatch-pause');

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
};

/**
 * Clean up timer (call when modal closes)
 */
export function cleanupTimer() {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
    }
    timerState = {
        seconds: 0,
        intervalId: null,
        isRunning: false
    };
}
