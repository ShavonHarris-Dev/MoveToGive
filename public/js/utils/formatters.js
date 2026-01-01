/**
 * Formatting Utilities
 * Helpers for formatting dates, currency, numbers, etc.
 */

/**
 * Format date as "Month Day, Year" (e.g., "January 15, 2026")
 * @param {Date|string} date
 * @returns {string}
 */
export function formatLongDate(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', options);
}

/**
 * Format date as "MM/DD/YYYY"
 * @param {Date|string} date
 * @returns {string}
 */
export function formatShortDate(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
}

/**
 * Format date for input[type="date"] (YYYY-MM-DD)
 * @param {Date|string} date
 * @returns {string}
 */
export function formatInputDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format currency (e.g., "$50.00")
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Format number with commas (e.g., "1,234")
 * @param {number} number
 * @returns {string}
 */
export function formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param {Date|string} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    if (diffWeek < 4) return `${diffWeek} week${diffWeek !== 1 ? 's' : ''} ago`;
    if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
    return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
}

/**
 * Format time of day (e.g., "2:30 PM")
 * @param {Date|string} date
 * @returns {string}
 */
export function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format date range (e.g., "Jan 1 - Feb 15, 2026")
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {string}
 */
export function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const startDay = start.getDate();
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const endDay = end.getDate();
    const year = end.getFullYear();

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else if (start.getFullYear() === end.getFullYear()) {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    } else {
        return `${startMonth} ${startDay}, ${start.getFullYear()} - ${endMonth} ${endDay}, ${year}`;
    }
}

/**
 * Pluralize a word based on count
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
export function pluralize(count, singular, plural = null) {
    if (count === 1) return singular;
    return plural || `${singular}s`;
}

/**
 * Format large numbers with abbreviations (e.g., "1.2K", "5.3M")
 * @param {number} number
 * @returns {string}
 */
export function formatCompactNumber(number) {
    if (number < 1000) return number.toString();
    if (number < 1000000) return (number / 1000).toFixed(1) + 'K';
    if (number < 1000000000) return (number / 1000000).toFixed(1) + 'M';
    return (number / 1000000000).toFixed(1) + 'B';
}

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get initials from name
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
    if (!name) return '?';

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format percentage
 * @param {number} value
 * @param {number} total
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercentage(value, total, decimals = 0) {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return percentage.toFixed(decimals) + '%';
}
