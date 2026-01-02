/**
 * Calendar Component
 * Renders and manages the workout calendar
 */

import { getCompletedDays, getWeeklyRewards, getWorkoutsForDay, completeWorkout } from '../services/workout.service.js';
import { getDaysInMonth, getFirstDayOfMonth, getWeekNumberInMonth } from '../utils/helpers.js';
import { formatLongDate } from '../utils/formatters.js';
import { openModal, closeModal } from './modal.js';
import { createStopwatch, cleanupTimer } from './timer.js';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

let currentYear = 2026;
let currentMonth = 0; // January

/**
 * Render month selector buttons
 */
export function renderMonthSelector() {
    const container = document.getElementById('monthButtons');
    if (!container) return;

    container.innerHTML = '';

    MONTH_NAMES.forEach((monthName, index) => {
        const btn = document.createElement('button');
        btn.className = 'month-btn';
        if (index === currentMonth) {
            btn.classList.add('active');
        }
        btn.textContent = monthName;
        btn.onclick = () => switchMonth(index);
        container.appendChild(btn);
    });
}

/**
 * Switch to a different month
 * @param {number} monthIndex
 */
export function switchMonth(monthIndex) {
    currentMonth = monthIndex;
    renderMonthSelector();
    renderCalendar();
}

/**
 * Render the calendar grid
 */
export function renderCalendar() {
    const titleEl = document.getElementById('currentMonthTitle');
    const gridEl = document.getElementById('calendarGrid');

    if (!titleEl || !gridEl) return;

    // Update title
    titleEl.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

    // Clear grid
    gridEl.innerHTML = '';

    // Add day labels
    DAY_NAMES.forEach(day => {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'day-label';
        labelDiv.textContent = day;
        gridEl.appendChild(labelDiv);
    });

    // Get calendar data
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const completedDays = getCompletedDays();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'day-cell empty';
        gridEl.appendChild(emptyDiv);
    }

    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-cell';

        const dateKey = `${currentYear}-${currentMonth + 1}-${day}`;
        const isCompleted = completedDays[dateKey];

        if (isCompleted) {
            dayDiv.classList.add('completed');

            const checkMark = document.createElement('span');
            checkMark.className = 'check-mark';
            checkMark.textContent = '✓';
            dayDiv.appendChild(checkMark);
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);

        dayDiv.onclick = () => openWorkoutModal(currentMonth, day);

        gridEl.appendChild(dayDiv);
    }

    // Render weekly summary and monthly total
    renderWeeklySummary();
    renderMonthlyTotal();
}

/**
 * Render weekly summary
 */
function renderWeeklySummary() {
    const container = document.getElementById('weeklySummary');
    if (!container) return;

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const numWeeks = Math.ceil((daysInMonth + firstDay) / 7);
    const weeklyRewards = getWeeklyRewards();

    let html = '<h3>📊 Weekly Progress & Rewards</h3>';

    for (let week = 1; week <= numWeeks; week++) {
        const weekKey = `${currentYear}-${currentMonth + 1}-week${week}`;
        const reward = weeklyRewards[weekKey];
        const isComplete = !!reward;

        html += `
            <div class="week-item">
                <span><strong>Week ${week}:</strong> ${isComplete ? '✓ Complete!' : 'In Progress...'}</span>
                ${reward ? `<span class="reward-badge">$${reward}</span>` : ''}
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * Render monthly total
 */
function renderMonthlyTotal() {
    const container = document.getElementById('monthlyTotal');
    if (!container) return;

    const weeklyRewards = getWeeklyRewards();
    let total = 0;

    Object.keys(weeklyRewards).forEach(key => {
        if (key.startsWith(`${currentYear}-${currentMonth + 1}-`)) {
            total += weeklyRewards[key];
        }
    });

    if (total > 0) {
        container.style.display = 'block';
        container.innerHTML = `
            <h2>$${total}</h2>
            <p>You've earned this amount in ${MONTH_NAMES[currentMonth]}!</p>
            <div class="charity-selector">
                <label>💝 Choose Your Charity</label>
                <select id="charitySelect">
                    <option value="">Select a charity...</option>
                    <option value="red-cross">American Red Cross</option>
                    <option value="feeding-america">Feeding America</option>
                    <option value="habitat">Habitat for Humanity</option>
                    <option value="wwf">World Wildlife Fund</option>
                    <option value="unicef">UNICEF</option>
                    <option value="doctors">Doctors Without Borders</option>
                    <option value="water">charity: water</option>
                    <option value="other">Other charity of my choice</option>
                </select>
                <button class="donate-btn" onclick="window.processDonation(${currentMonth}, ${total})">
                    Give $${total} to Charity
                </button>
            </div>
        `;
    } else {
        container.style.display = 'none';
    }
}

/**
 * Open workout modal for a specific day
 * @param {number} monthIndex
 * @param {number} day
 */
function openWorkoutModal(monthIndex, day) {
    const date = new Date(currentYear, monthIndex, day);
    const dayOfWeek = date.getDay();
    const workouts = getWorkoutsForDay(dayOfWeek);
    const dateKey = `${currentYear}-${monthIndex + 1}-${day}`;
    const completedDays = getCompletedDays();
    const isCompleted = completedDays[dateKey];

    // Create stopwatch at the top
    const stopwatchHTML = createStopwatch();

    // Build workout HTML with images
    let workoutHTML = '';
    workouts.forEach((workout) => {
        workoutHTML += `
            <div class="workout-item">
                <img
                    src="/images/workouts/${workout.image}"
                    alt="${workout.name}"
                    class="workout-image"
                    loading="lazy"
                    decoding="async"
                    onerror="this.src='/images/workouts/placeholder.jpg'"
                />
                <h4>
                    ${workout.name}
                    <span class="workout-duration-badge">${workout.duration} min</span>
                </h4>
                <p>${workout.desc}</p>
            </div>
        `;
    });

    // Build complete button
    const buttonHTML = `
        <button
            class="complete-btn ${isCompleted ? 'completed' : ''}"
            onclick="window.handleCompleteWorkout('${dateKey}')"
            ${isCompleted ? 'disabled' : ''}
        >
            ${isCompleted ? '✓ Workout Completed!' : 'Complete This Workout'}
        </button>
    `;

    openModal({
        title: formatLongDate(date),
        content: stopwatchHTML + workoutHTML + buttonHTML,
        onClose: cleanupTimer
    });
}

/**
 * Handle completing a workout
 * @param {string} dateKey
 */
window.handleCompleteWorkout = function(dateKey) {
    const result = completeWorkout(dateKey);

    if (result.success) {
        closeModal();
        renderCalendar();

        // Update stats
        if (window.updateStats) {
            window.updateStats();
        }

        // Check for badges
        if (window.checkAndUnlockBadges) {
            window.checkAndUnlockBadges();
        }
    }
};

/**
 * Process donation
 * @param {number} monthIndex
 * @param {number} amount
 */
window.processDonation = function(monthIndex, amount) {
    const select = document.getElementById('charitySelect');
    if (!select || !select.value) {
        alert('Please select a charity first!');
        return;
    }

    const charity = select.options[select.selectedIndex].text;

    if (confirm(`🎉 Ready to make a difference?\n\nYou're about to donate $${amount} to ${charity}!`)) {
        alert(`🌟 AMAZING WORK! 🌟\n\nThrough ${MONTH_NAMES[monthIndex]}, you:\n✓ Stayed consistent with your fitness\n✓ Earned $${amount} through dedication\n✓ Are about to help others through ${charity}\n\nYou're making the world better, one workout at a time! 💪❤️`);
    }
};

/**
 * Initialize calendar
 */
export function initCalendar() {
    // Set to current month
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();

    renderMonthSelector();
    renderCalendar();
}
