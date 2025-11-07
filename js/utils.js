// Utility Functions

/**
 * Shows loading overlay
 */
export function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

/**
 * Hides loading overlay
 */
export function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

/**
 * Toast Notification System
 */
let toastContainer = null;

function initToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.id = 'toastContainer';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
    initToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${icons[type] || icons.info}"></i>
            <span class="toast-message">${escapeHtml(message)}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto dismiss
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    return toast;
}

/**
 * Helper to escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formats a date to a readable string
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Formats a date with time
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string with time
 */
export function formatDateTime(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Gets the last N days as an array
 * @param {number} days - Number of days to get (default: 7)
 * @returns {Array<string>} - Array of formatted date strings
 */
export function getLastNDays(days = 7) {
    const dayArray = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dayArray.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dayArray;
}

/**
 * Gets member display name
 * @param {Object} member - Member object
 * @returns {string} - Display name
 */
export function getMemberDisplayName(member) {
    if (member.displayName) return member.displayName;
    const firstName = member.firstName || '';
    const lastName = member.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'N/A';
}

/**
 * Gets member email
 * @param {Object} member - Member object
 * @returns {string} - Email address
 */
export function getMemberEmail(member) {
    return member.email || member.personalEmail || 'N/A';
}

/**
 * Gets member phone number
 * @param {Object} member - Member object
 * @returns {string} - Phone number
 */
export function getMemberPhone(member) {
    return member.phoneNumber || member.whatsappNumber || 'N/A';
}

/**
 * Downloads content as CSV file
 * @param {string} content - CSV content
 * @param {string} filename - Filename for download
 */
export function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Formats number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toLocaleString();
}

