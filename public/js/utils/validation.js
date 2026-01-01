/**
 * Validation Utilities
 * Input validation and sanitization helpers
 */

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {{valid: boolean, message: string}}
 */
export function isValidPassword(password) {
    if (!password || password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true, message: 'Password is strong' };
}

/**
 * Validate display name
 * @param {string} name
 * @returns {{valid: boolean, message: string}}
 */
export function isValidDisplayName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, message: 'Display name cannot be empty' };
    }

    if (name.trim().length < 2) {
        return { valid: false, message: 'Display name must be at least 2 characters' };
    }

    if (name.trim().length > 50) {
        return { valid: false, message: 'Display name must be less than 50 characters' };
    }

    // Allow letters, numbers, spaces, and basic punctuation
    const validNameRegex = /^[a-zA-Z0-9\s\-_.]+$/;
    if (!validNameRegex.test(name)) {
        return { valid: false, message: 'Display name contains invalid characters' };
    }

    return { valid: true, message: '' };
}

/**
 * Validate number is within range
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {{valid: boolean, message: string}}
 */
export function isValidRange(value, min, max) {
    const num = parseInt(value);

    if (isNaN(num)) {
        return { valid: false, message: 'Value must be a number' };
    }

    if (num < min) {
        return { valid: false, message: `Value must be at least ${min}` };
    }

    if (num > max) {
        return { valid: false, message: `Value must be at most ${max}` };
    }

    return { valid: true, message: '' };
}

/**
 * Validate date
 * @param {string} dateString
 * @returns {{valid: boolean, message: string}}
 */
export function isValidDate(dateString) {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return { valid: false, message: 'Invalid date format' };
    }

    return { valid: true, message: '' };
}

/**
 * Validate date range (end date after start date)
 * @param {string} startDate
 * @param {string} endDate
 * @returns {{valid: boolean, message: string}}
 */
export function isValidDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { valid: false, message: 'Invalid date format' };
    }

    if (end < start) {
        return { valid: false, message: 'End date must be after start date' };
    }

    return { valid: true, message: '' };
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html
 * @returns {string}
 */
export function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Sanitize user input for text fields
 * @param {string} input
 * @param {number} maxLength
 * @returns {string}
 */
export function sanitizeText(input, maxLength = 1000) {
    if (!input) return '';

    // Remove leading/trailing whitespace
    let sanitized = input.trim();

    // Limit length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    // Escape HTML
    sanitized = sanitizeHTML(sanitized);

    return sanitized;
}

/**
 * Validate movement name
 * @param {string} name
 * @returns {{valid: boolean, message: string}}
 */
export function isValidMovementName(name) {
    if (!name || name.trim().length === 0) {
        return { valid: false, message: 'Movement name cannot be empty' };
    }

    if (name.trim().length < 3) {
        return { valid: false, message: 'Movement name must be at least 3 characters' };
    }

    if (name.trim().length > 100) {
        return { valid: false, message: 'Movement name must be less than 100 characters' };
    }

    return { valid: true, message: '' };
}

/**
 * Validate movement description
 * @param {string} description
 * @returns {{valid: boolean, message: string}}
 */
export function isValidMovementDescription(description) {
    if (!description || description.trim().length === 0) {
        return { valid: false, message: 'Description cannot be empty' };
    }

    if (description.trim().length < 10) {
        return { valid: false, message: 'Description must be at least 10 characters' };
    }

    if (description.trim().length > 1000) {
        return { valid: false, message: 'Description must be less than 1000 characters' };
    }

    return { valid: true, message: '' };
}

/**
 * Validate invite code format
 * @param {string} code
 * @returns {{valid: boolean, message: string}}
 */
export function isValidInviteCode(code) {
    if (!code || code.trim().length === 0) {
        return { valid: false, message: 'Invite code cannot be empty' };
    }

    // Invite codes should be WALK followed by 6 alphanumeric characters
    const codeRegex = /^WALK[A-Z0-9]{6}$/;
    if (!codeRegex.test(code.toUpperCase())) {
        return { valid: false, message: 'Invalid invite code format' };
    }

    return { valid: true, message: '' };
}
