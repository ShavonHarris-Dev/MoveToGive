/**
 * Friends Page Controller
 * Manages the friends page UI and interactions
 */

import { addFriend, getFriends, cheerFriend, hasCheered, removeFriend } from '../services/friend.service.js';
import { copyToClipboard, storage } from '../utils/helpers.js';
import { getInitials } from '../utils/formatters.js';

/**
 * Get or generate invite code
 * @returns {string}
 */
function getInviteCode() {
    const data = storage.get('walktogive_data') || {};
    if (!data.inviteCode) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'WALK';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        data.inviteCode = code;
        storage.set('walktogive_data', data);
    }
    return data.inviteCode;
}

/**
 * Render friends list
 */
export function renderFriendsList() {
    const container = document.getElementById('friendsList');
    if (!container) return;

    const friends = getFriends();

    if (friends.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h4>No friends yet</h4>
                <p>Add friends to cheer them on and track their progress!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    friends.forEach(friend => {
        const card = document.createElement('div');
        card.className = 'friend-card';

        const initials = getInitials(friend.name);
        const cheered = hasCheered(friend.id);

        card.innerHTML = `
            <div class="friend-header">
                <div class="friend-avatar">${initials}</div>
                <div class="friend-info">
                    <h4>${friend.name}</h4>
                    <div class="friend-streak">🔥 ${friend.streak} week streak</div>
                </div>
            </div>
            <div class="friend-stats">
                <div class="friend-stat">
                    <div class="friend-stat-value">${friend.days}</div>
                    <div class="friend-stat-label">Days</div>
                </div>
                <div class="friend-stat">
                    <div class="friend-stat-value">$${friend.earned}</div>
                    <div class="friend-stat-label">Earned</div>
                </div>
            </div>
            <button class="cheer-btn ${cheered ? 'cheered' : ''}" onclick="window.handleCheerFriend(${friend.id})">
                ${cheered ? '✓ Cheered!' : '👏 Cheer Them On!'}
            </button>
        `;

        container.appendChild(card);
    });
}

/**
 * Handle add friend
 */
export function handleAddFriend() {
    const input = document.getElementById('friendName');
    if (!input) return;

    const name = input.value.trim();
    if (!name) {
        return;
    }

    const result = addFriend(name);

    if (result.success) {
        input.value = '';
        renderFriendsList();
    }
}

/**
 * Handle cheer friend
 * @param {string|number} friendId
 */
window.handleCheerFriend = function(friendId) {
    cheerFriend(friendId);
    renderFriendsList();
};

/**
 * Copy invite code to clipboard
 */
export function copyInviteCode() {
    const code = getInviteCode();

    copyToClipboard(code).then(success => {
        const btn = document.getElementById('copyCodeBtn');
        if (btn) {
            btn.textContent = '✓ Copied!';
            btn.classList.add('copied');

            setTimeout(() => {
                btn.textContent = '📋 Copy';
                btn.classList.remove('copied');
            }, 2000);
        }
    });
}

/**
 * Share via WhatsApp
 */
export function shareViaWhatsApp() {
    const code = getInviteCode();
    const message = `🏃‍♀️ Join me on WalkToGive! 💪❤️

I'm using this amazing app to stay fit while raising money for charity. Every week I complete my workouts, I earn money to donate to causes I care about.

Use my invite code: ${code}

Let's make a difference together - one workout at a time! 🌟`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

/**
 * Share via Email
 */
export function shareViaEmail() {
    const code = getInviteCode();
    const subject = encodeURIComponent('Join Me on WalkToGive! 🏃‍♀️💪');
    const body = encodeURIComponent(`Hey there!

I've been using WalkToGive and I think you'd love it! It's an app that helps me stay consistent with my fitness goals while raising money for charity.

Here's how it works:
✓ Complete daily workouts (detailed and varied!)
✓ Finish all 7 days in a week to earn money
✓ Donate your earnings to your favorite charity

The best part? We can connect as friends, cheer each other on, and even create "Movements" together to raise money for causes we care about as a group!

MY INVITE CODE: ${code}

Use this code when you sign up and we'll be connected!

Let's make fitness fun and meaningful together 💪❤️

See you there!`);

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Update invite code display
 */
function updateInviteCodeDisplay() {
    const codeEl = document.getElementById('inviteCode');
    if (codeEl) {
        codeEl.textContent = getInviteCode();
    }
}

/**
 * Initialize friends page
 */
export function initFriendsPage() {
    updateInviteCodeDisplay();
    renderFriendsList();

    // Set up add friend button
    const addBtn = document.querySelector('.add-friend-btn');
    if (addBtn) {
        addBtn.addEventListener('click', handleAddFriend);
    }

    // Allow Enter key to add friend
    const input = document.getElementById('friendName');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAddFriend();
            }
        });
    }
}

// Make functions globally available
window.copyInviteCode = copyInviteCode;
window.shareViaWhatsApp = shareViaWhatsApp;
window.shareViaEmail = shareViaEmail;
