/**
 * @fileoverview Dashboard Page Module
 * Handles dashboard display, statistics, and charts
 * @module dashboard
 */

// Dashboard Page Module
import { getMembers } from "./data-store.js";
import {
  getLastNDays,
  formatNumber,
  showLoading,
  hideLoading,
  handleError,
} from "./utils.js";
import { calculateDashboardStats, getTopCommitters } from "./services/stats-service.js";


const dashboardDateRange = 30; // Fixed to 30 days

/**
 * Load dashboard data and render charts
 * Fetches members data and displays statistics and visualizations
 * @returns {Promise<void>}
 */
export async function loadDashboard() {
  try {
    showLoading();

    const members = getMembers();
    updateDashboardStats(members);
    loadDashboardCharts(members);
    loadTopCommitters(members);
  } catch (error) {
    handleError(error, { module: 'dashboard', action: 'loadDashboard' });
  } finally {
    hideLoading();
  }
}

/**
 * Update dashboard statistics
 * Uses centralized stats service for consistent calculations
 * @param {Array} members - Array of member objects
 */
function updateDashboardStats(members) {
  try {
    // Use centralized stats calculation
    const stats = calculateDashboardStats(members);

    // Update stat elements
    const totalMembersEl = document.getElementById("totalMembers");
    const dashboardTotalReposEl = document.getElementById("dashboardTotalRepos");
    const dashboardTotalStarsEl = document.getElementById("dashboardTotalStars");
    const dashboardTotalPRsEl = document.getElementById("dashboardTotalPRs");
    const dashboardTotalCommitsEl = document.getElementById(
      "dashboardTotalCommits"
    );

    if (totalMembersEl) totalMembersEl.textContent = formatNumber(stats.totalMembers);
    if (dashboardTotalReposEl)
      dashboardTotalReposEl.textContent = formatNumber(stats.totalRepos);
    if (dashboardTotalStarsEl)
      dashboardTotalStarsEl.textContent = formatNumber(stats.totalStars);
    if (dashboardTotalPRsEl)
      dashboardTotalPRsEl.textContent = formatNumber(stats.totalPRs);
    if (dashboardTotalCommitsEl)
      dashboardTotalCommitsEl.textContent = formatNumber(stats.totalCommits);
  } catch (error) {
    handleError(error, { module: 'dashboard', action: 'updateDashboardStats' });
  }
}

/**
 * Load and render dashboard charts
 * Creates PR trends chart using Chart.js
 * @param {Array<Object>} members - Array of member objects
 * @returns {void}
 */
// Store chart instance to prevent multiple instances
let prTrendsChartInstance = null;

function loadDashboardCharts(members) {
  // PR Trends Chart
  const prTrendsCtx = document.getElementById("prTrendsChart");
  if (prTrendsCtx) {
    // Destroy existing chart instance if it exists
    if (prTrendsChartInstance) {
      prTrendsChartInstance.destroy();
      prTrendsChartInstance = null;
    }

    const prTrendsData = getPRTrendsData(members, dashboardDateRange);
    const labels = getLastNDays(dashboardDateRange);
    
    // Debug logging
    console.log('PR Trends Data:', prTrendsData);
    console.log('Total PRs in data:', prTrendsData.reduce((a, b) => a + b, 0));
    
    prTrendsChartInstance = new Chart(prTrendsCtx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Pull Requests",
            data: prTrendsData,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

}

/**
 * Get PR trends data for the last N days
 * Uses recentPRs timestamps if available, otherwise distributes evenly
 * @param {Array<Object>} members - Array of member objects
 * @param {number} days - Number of days (default: 30)
 * @returns {Array<number>} - Array of PR counts per day
 */
function getPRTrendsData(members, days = 30) {
  // Prefer recentPRs timestamps if available; else even distribution fallback
  const labels = getLastNDays(days);
  
  // Create day boundaries (start of each day in local timezone)
  const now = new Date();
  const dayStarts = [];
  const dayEnds = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    dayStarts.push(dayStart);
    dayEnds.push(dayEnd);
  }
  
  const buckets = new Array(days).fill(0);
  let hasTimestamps = false;
  let totalPRsWithTimestamps = 0;
  
  // Get the range start and end for filtering
  const rangeStart = dayStarts[0];
  const rangeEnd = dayEnds[dayEnds.length - 1];
  
  members.forEach((m) => {
    const recent = m.githubActivity?.recentPRs || [];
    if (recent.length) {
      hasTimestamps = true;
      recent.forEach((pr) => {
        // Support both createdAt and created_at property names
        const createdDateStr = pr.createdAt || pr.created_at;
        if (!createdDateStr) {
          return; // Skip PRs without dates
        }
        
        const created = new Date(createdDateStr);
        if (isNaN(created.getTime())) {
          return; // Skip invalid dates
        }
        
        // Only count PRs within the date range
        if (created < rangeStart || created > rangeEnd) {
          return; // PR is outside our date range
        }
        
        // Find which bucket this PR belongs to
        for (let i = 0; i < dayStarts.length; i++) {
          const start = dayStarts[i];
          const end = dayEnds[i];
          if (created >= start && created <= end) {
            buckets[i]++;
            totalPRsWithTimestamps++;
            break;
          }
        }
      });
    }
  });
  
  console.log(`PR Trends: ${totalPRsWithTimestamps} PRs with timestamps in last ${days} days, hasTimestamps: ${hasTimestamps}`);
  
  if (hasTimestamps && totalPRsWithTimestamps > 0) {
    return buckets;
  }
  
  // Fallback: distribute total PRs evenly across days (only if we have no timestamp data)
  const totalPRs = members.reduce(
    (sum, m) => sum + (m.githubActivity?.pullRequests || 0),
    0
  );
  
  console.log(`PR Trends: Using fallback distribution for ${totalPRs} total PRs`);
  
  if (totalPRs === 0) {
    return buckets; // All zeros
  }
  
  // Distribute evenly but with some variation to make it look more realistic
  const base = Math.floor(totalPRs / days);
  let rem = totalPRs - base * days;
  for (let i = 0; i < days; i++) {
    buckets[i] = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem--;
  }
  
  return buckets;
}

// getTopCommitters is now imported from stats-service.js

/**
 * Load top committers list
 * @param {Array} members - Array of member objects
 */
function loadTopCommitters(members) {
  const committers = getTopCommitters(members, 10);
  const committersList = document.getElementById("dashboardTopCommitters");

  if (!committersList) return;

  committersList.innerHTML = "";

  if (committers.length === 0) {
    committersList.innerHTML =
      '<p style="text-align: center; color: #64748b; padding: 20px;">No committer data available</p>';
    return;
  }

  committers.forEach((committer, index) => {
    const committerEl = document.createElement("div");
    committerEl.className = "contributor-item";
    committerEl.innerHTML = `
            <div class="contributor-rank">#${index + 1}</div>
            <div class="contributor-avatar" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                ${committer.name.charAt(0).toUpperCase()}
            </div>
            <div class="contributor-info">
                <div class="contributor-name">${committer.name}</div>
                <div class="contributor-stats">
                    <span><i class="fas fa-code-commit"></i> ${formatNumber(
                      committer.commits
                    )} commits</span>
                </div>
            </div>
        `;
    committersList.appendChild(committerEl);
  });
}
