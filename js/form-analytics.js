// Form Analytics Module
import { db, collection, getDocs, query, orderBy, where, Timestamp } from '../firebase-config.js';
import { formatNumber } from './utils.js';

/**
 * Load form analytics
 */
export async function loadFormAnalytics(formId, formData) {
    const analyticsContainer = document.getElementById('formAnalytics');
    if (!analyticsContainer) return;

    try {
        // Load submissions for analytics
        const submissionsRef = collection(db, 'form_submissions', formId, 'submissions');
        const submissionsSnapshot = await getDocs(query(submissionsRef, orderBy('submittedAt', 'desc')));
        
        const submissions = [];
        submissionsSnapshot.forEach(doc => {
            submissions.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Calculate analytics
        const analytics = calculateAnalytics(formData, submissions);

        // Render analytics
        analyticsContainer.innerHTML = `
            <div class="detail-card-header">
                <h3>Analytics</h3>
            </div>
            <div class="detail-card-body">
                ${renderAnalytics(analytics, formData, submissions)}
            </div>
        `;
    } catch (error) {
        console.error('Error loading analytics:', error);
        analyticsContainer.innerHTML = '<p>Error loading analytics</p>';
    }
}

/**
 * Calculate analytics
 */
function calculateAnalytics(formData, submissions) {
    const analytics = {
        submissionTrends: getSubmissionTrends(submissions),
        fieldCompletionRates: getFieldCompletionRates(formData, submissions),
        fieldDistributions: getFieldDistributions(formData, submissions),
        averageCompletionTime: getAverageCompletionTime(submissions),
        peakSubmissionTimes: getPeakSubmissionTimes(submissions)
    };

    return analytics;
}

/**
 * Get submission trends
 */
function getSubmissionTrends(submissions) {
    const trends = {};
    submissions.forEach(sub => {
        const date = sub.submittedAt?.toDate ? sub.submittedAt.toDate() : new Date(sub.submittedAt);
        const dateStr = date.toISOString().split('T')[0];
        trends[dateStr] = (trends[dateStr] || 0) + 1;
    });
    return trends;
}

/**
 * Get field completion rates
 */
function getFieldCompletionRates(formData, submissions) {
    const rates = {};
    
    formData.fields?.forEach(field => {
        if (field.type === 'section') return;
        
        const completed = submissions.filter(sub => {
            const value = sub.data?.[field.id];
            return value !== undefined && value !== null && value !== '';
        }).length;
        
        rates[field.id] = {
            label: field.label,
            completed,
            total: submissions.length,
            rate: submissions.length > 0 ? (completed / submissions.length) * 100 : 0
        };
    });

    return rates;
}

/**
 * Get field distributions
 */
function getFieldDistributions(formData, submissions) {
    const distributions = {};
    
    formData.fields?.forEach(field => {
        if (!['dropdown', 'multiselect', 'radio', 'checkbox'].includes(field.type)) return;

        const dist = {};
        submissions.forEach(sub => {
            const value = sub.data?.[field.id];
            if (value !== undefined && value !== null) {
                const values = Array.isArray(value) ? value : [value];
                values.forEach(v => {
                    dist[v] = (dist[v] || 0) + 1;
                });
            }
        });

        distributions[field.id] = {
            label: field.label,
            distribution: dist
        };
    });

    return distributions;
}

/**
 * Get average completion time
 */
function getAverageCompletionTime(submissions) {
    const times = submissions.filter(s => s.completionTime).map(s => s.completionTime);
    if (times.length === 0) return 0;
    return times.reduce((sum, t) => sum + t, 0) / times.length;
}

/**
 * Get peak submission times
 */
function getPeakSubmissionTimes(submissions) {
    const hours = {};
    submissions.forEach(sub => {
        const date = sub.submittedAt?.toDate ? sub.submittedAt.toDate() : new Date(sub.submittedAt);
        const hour = date.getHours();
        hours[hour] = (hours[hour] || 0) + 1;
    });
    return hours;
}

/**
 * Render analytics
 */
function renderAnalytics(analytics, formData, submissions) {
    return `
        <div class="analytics-grid">
            <div class="analytics-section">
                <h4>Submission Trends (Last 30 Days)</h4>
                <div class="trends-chart">
                    ${renderTrendsChart(analytics.submissionTrends)}
                </div>
            </div>

            <div class="analytics-section">
                <h4>Field Completion Rates</h4>
                <div class="completion-rates">
                    ${renderCompletionRates(analytics.fieldCompletionRates)}
                </div>
            </div>

            ${Object.keys(analytics.fieldDistributions).length > 0 ? `
                <div class="analytics-section">
                    <h4>Field Distributions</h4>
                    ${renderFieldDistributions(analytics.fieldDistributions)}
                </div>
            ` : ''}

            <div class="analytics-section">
                <h4>Performance Metrics</h4>
                <div class="performance-metrics">
                    <div class="metric-item">
                        <span class="metric-label">Average Completion Time</span>
                        <span class="metric-value">${Math.round(analytics.averageCompletionTime)}s</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Peak Submission Hour</span>
                        <span class="metric-value">${getPeakHour(analytics.peakSubmissionTimes)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render trends chart
 */
function renderTrendsChart(trends) {
    const dates = Object.keys(trends).sort();
    if (dates.length === 0) {
        return '<p class="empty-text">No submission data</p>';
    }

    const maxValue = Math.max(...Object.values(trends));
    
    return `
        <div class="trends-bars">
            ${dates.slice(-30).map(date => {
                const count = trends[date];
                const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
                const dateObj = new Date(date);
                return `
                    <div class="trend-bar-item">
                        <div class="trend-bar" style="height: ${percentage}%">
                            <span class="trend-bar-value">${count}</span>
                        </div>
                        <span class="trend-bar-label">${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Render completion rates
 */
function renderCompletionRates(rates) {
    const ratesArray = Object.values(rates).sort((a, b) => b.rate - a.rate);
    
    if (ratesArray.length === 0) {
        return '<p class="empty-text">No completion data</p>';
    }

    return `
        <div class="completion-rates-list">
            ${ratesArray.map(rate => `
                <div class="completion-rate-item">
                    <div class="completion-rate-header">
                        <span class="completion-rate-label">${escapeHtml(rate.label)}</span>
                        <span class="completion-rate-value">${rate.completed}/${rate.total} (${rate.rate.toFixed(1)}%)</span>
                    </div>
                    <div class="completion-rate-bar">
                        <div class="completion-rate-fill" style="width: ${rate.rate}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Render field distributions
 */
function renderFieldDistributions(distributions) {
    return Object.values(distributions).map(dist => `
        <div class="distribution-item">
            <h5>${escapeHtml(dist.label)}</h5>
            <div class="distribution-bars">
                ${Object.entries(dist.distribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([value, count]) => {
                        const total = Object.values(dist.distribution).reduce((sum, c) => sum + c, 0);
                        const percentage = (count / total) * 100;
                        return `
                            <div class="distribution-bar-item">
                                <span class="distribution-label">${escapeHtml(value)}</span>
                                <div class="distribution-bar">
                                    <div class="distribution-bar-fill" style="width: ${percentage}%"></div>
                                </div>
                                <span class="distribution-value">${count} (${percentage.toFixed(1)}%)</span>
                            </div>
                        `;
                    }).join('')}
            </div>
        </div>
    `).join('');
}

/**
 * Get peak hour
 */
function getPeakHour(hours) {
    const entries = Object.entries(hours);
    if (entries.length === 0) return 'N/A';
    const peak = entries.reduce((max, entry) => entry[1] > max[1] ? entry : max);
    return `${peak[0]}:00`;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

