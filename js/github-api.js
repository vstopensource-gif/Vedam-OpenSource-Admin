// GitHub API Configuration and Functions
// Token is injected from environment variables at build time
// For local development, create a .env file with VITE_GITHUB_TOKEN
// Build script will replace this placeholder with actual value
const GITHUB_TOKEN = 'VITE_GITHUB_TOKEN';

// Cache for GitHub user data
export let githubUserCache = {};

// Rate limit tracking
let rateLimitReset = null;
let rateLimitRemaining = null;

/**
 * Clears the GitHub user cache
 */
export function clearGitHubCache() {
    githubUserCache = {};
}

/**
 * Check rate limit headers and wait if needed
 * @param {Response} response - Fetch response object
 * @returns {Promise<void>}
 */
async function handleRateLimit(response) {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (remaining !== null) {
        rateLimitRemaining = parseInt(remaining, 10);
    }
    if (reset !== null) {
        rateLimitReset = parseInt(reset, 10) * 1000; // Convert to milliseconds
    }
    
    // If we hit rate limit (429 or remaining is 0), wait until reset
    if (response.status === 429 || (rateLimitRemaining !== null && rateLimitRemaining === 0)) {
        const waitTime = rateLimitReset ? Math.max(0, rateLimitReset - Date.now() + 1000) : 60000;
        console.warn(`Rate limit hit. Waiting ${Math.round(waitTime / 1000)}s before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
}

/**
 * Make a GitHub API request with rate limit handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Response>}
 */
async function githubApiRequest(url, options = {}, maxRetries = 3) {
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers
    };
    
    // Add token if available and not placeholder
    if (GITHUB_TOKEN && GITHUB_TOKEN !== 'VITE_GITHUB_TOKEN' && GITHUB_TOKEN.trim() !== '') {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const response = await fetch(url, { ...options, headers });
        
        // Handle rate limiting
        if (response.status === 429 || response.status === 403) {
            await handleRateLimit(response);
            
            // If still rate limited after waiting, skip this request
            if (response.status === 429 && attempt < maxRetries - 1) {
                continue; // Retry after waiting
            }
            
            // If 403 and no token, skip silently (unauthenticated request)
            if (response.status === 403 && (!GITHUB_TOKEN || GITHUB_TOKEN === 'VITE_GITHUB_TOKEN' || GITHUB_TOKEN.trim() === '')) {
                console.warn(`GitHub API 403 Forbidden - token may be missing or invalid. Skipping request to ${url}`);
                return response; // Return the response but don't throw
            }
        }
        
        return response;
    }
    
    // If all retries failed, return the last response
    return fetch(url, { ...options, headers });
}

/**
 * Fetches GitHub user information from the GitHub API
 * @param {string} githubUsername - The GitHub username to fetch
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<Object|null>} - GitHub user info or null if not found
 */
export async function fetchGitHubUserInfo(githubUsername, useCache = true) {
    // Check cache first
    if (useCache && githubUserCache[githubUsername] !== undefined) {
        return githubUserCache[githubUsername];
    }

    try {
        const response = await githubApiRequest(`https://api.github.com/users/${githubUsername}`);

        if (response.ok) {
            const userData = await response.json();
            const userInfo = {
                username: userData.login,
                name: userData.name,
                avatar_url: userData.avatar_url,
                html_url: userData.html_url,
                public_repos: userData.public_repos,
                followers: userData.followers,
                following: userData.following,
                bio: userData.bio || '',
                location: userData.location || '',
                blog: userData.blog || '',
                company: userData.company || ''
            };
            
            // Cache the result
            githubUserCache[githubUsername] = userInfo;
            return userInfo;
        } else if (response.status === 404) {
            console.warn(`GitHub user '${githubUsername}' not found (404)`);
            githubUserCache[githubUsername] = null;
            return null;
        } else if (response.status === 403 || response.status === 429) {
            // Rate limited or forbidden - return null but don't cache
            console.warn(`GitHub API ${response.status} for user '${githubUsername}' - skipping`);
            return null;
        } else {
            console.error(`GitHub API error: ${response.status} - ${response.statusText}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching GitHub user info:', error);
        return null;
    }
}

/**
 * Get user activity snapshot
 * @param {string} githubUsername - GitHub username
 * @param {Object} opts - Options (from, to, prsFirst, lifetime)
 * @returns {Promise<Object>} - Activity snapshot
 */
export async function getUserActivitySnapshot(githubUsername, opts = {}) {
    try {
        const githubInfo = await fetchGitHubUserInfo(githubUsername);
        return {
            publicRepos: githubInfo?.public_repos || 0,
            followers: githubInfo?.followers || 0,
            following: githubInfo?.following || 0,
            contributions: 0,
            commits: 0,
            pullRequests: 0,
            mergedPRs: 0,
            openPRs: 0,
            closedPRs: 0,
            issues: 0,
            recentPRs: [],
            totalStars: 0,
            totalForks: 0
        };
    } catch (error) {
        console.error(`Error in getUserActivitySnapshot for ${githubUsername}:`, error);
        return {
            publicRepos: 0,
            followers: 0,
            following: 0,
            contributions: 0,
            commits: 0,
            pullRequests: 0,
            mergedPRs: 0,
            openPRs: 0,
            closedPRs: 0,
            issues: 0,
            recentPRs: [],
            totalStars: 0,
            totalForks: 0
        };
    }
}

/**
 * Fetch user languages
 * @param {string} githubUsername - GitHub username
 * @param {number} limit - Maximum repos to check
 * @returns {Promise<Object>} - Language breakdown
 */
export async function fetchUserLanguages(githubUsername, limit = 100) {
    try {
        // Return empty object if no token or token is placeholder
        if (!GITHUB_TOKEN || GITHUB_TOKEN === 'VITE_GITHUB_TOKEN' || GITHUB_TOKEN.trim() === '') {
            return {};
        }
        
        const reposResponse = await githubApiRequest(
            `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=${limit}`
        );

        if (!reposResponse.ok) {
            return {};
        }

        const repos = await reposResponse.json();
        const languageBreakdown = {};
        
        // Limit to first 20 repos to avoid too many API calls
        const reposToCheck = repos.slice(0, Math.min(20, repos.length));
        
        for (const repo of reposToCheck) {
            try {
                const langResponse = await githubApiRequest(
                    `https://api.github.com/repos/${repo.full_name}/languages`
                );
                
                if (langResponse.ok) {
                    const repoLanguages = await langResponse.json();
                    Object.entries(repoLanguages).forEach(([lang, bytes]) => {
                        if (lang && lang.trim()) {
                            languageBreakdown[lang] = (languageBreakdown[lang] || 0) + bytes;
                        }
                    });
                } else if (langResponse.status === 403 || langResponse.status === 429) {
                    // Rate limited, stop fetching languages
                    break;
                }
                
                // Delay between requests to avoid rate limits
                await new Promise(r => setTimeout(r, 300));
            } catch (error) {
                console.error(`Error fetching languages for ${repo.full_name}:`, error);
            }
        }
        
        return languageBreakdown;
    } catch (error) {
        console.error('Error fetching user languages:', error);
        return {};
    }
}

/**
 * Fetch user repositories
 * @param {string} githubUsername - GitHub username
 * @param {number} limit - Maximum repos to fetch
 * @returns {Promise<Array>} - Array of repository objects
 */
export async function fetchUserRepositories(githubUsername, limit = 100) {
    try {
        const allRepos = [];
        let page = 1;
        const perPage = 100;
        let hasMore = true;

        while (hasMore && allRepos.length < limit) {
            const response = await githubApiRequest(
                `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=${perPage}&page=${page}`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    break;
                }
                // If rate limited or forbidden, return what we have so far
                if (response.status === 403 || response.status === 429) {
                    console.warn(`GitHub API ${response.status} for repos of '${githubUsername}' - returning partial results`);
                    break;
                }
                // For other errors, throw but catch below
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const repos = await response.json();
            
            if (repos.length === 0) {
                hasMore = false;
            } else {
                repos.forEach(repo => {
                    if (allRepos.length < limit) {
                        allRepos.push({
                            id: repo.id,
                            name: repo.name,
                            full_name: repo.full_name,
                            description: repo.description || '',
                            url: repo.html_url,
                            language: repo.language || null,
                            stars: repo.stargazers_count || 0,
                            forks: repo.forks_count || 0,
                            open_issues: repo.open_issues_count || 0,
                            is_private: repo.private,
                            created_at: repo.created_at,
                            updated_at: repo.updated_at,
                            pushed_at: repo.pushed_at,
                            default_branch: repo.default_branch
                        });
                    }
                });
                
                const linkHeader = response.headers.get('Link');
                hasMore = repos.length === perPage && (!linkHeader || linkHeader.includes('rel="next"'));
                page++;
                
                // Small delay between pages to avoid hitting rate limits
                if (hasMore) {
                    await new Promise(r => setTimeout(r, 100));
                }
            }
        }
        
        return allRepos;
    } catch (error) {
        console.error('Error fetching repositories:', error);
        return [];
    }
}

/**
 * Fetch contribution calendar
 * @param {string} login - GitHub username
 * @returns {Promise<Object|null>} - Contribution calendar data
 */
export async function fetchContributionCalendar(login) {
    try {
        // Return null if no token or token is placeholder
        if (!GITHUB_TOKEN || GITHUB_TOKEN === 'VITE_GITHUB_TOKEN') {
            return null;
        }
        
        // This would require GraphQL API - simplified version
        return null;
    } catch (error) {
        console.error(`Error in fetchContributionCalendar for ${login}:`, error);
        return null;
    }
}

/**
 * Fetch user pull requests
 * @param {string} githubUsername - GitHub username
 * @param {string} state - PR state: 'all', 'open', 'closed', 'merged'
 * @param {number} limit - Maximum PRs to fetch
 * @returns {Promise<Array>} - Array of PR objects
 */
export async function fetchUserPullRequests(githubUsername, state = 'all', limit = 30) {
    try {
        // Return empty array if no token or token is placeholder
        if (!GITHUB_TOKEN || GITHUB_TOKEN === 'VITE_GITHUB_TOKEN') {
            return [];
        }
        
        // This would require GraphQL API - simplified version
        return [];
    } catch (error) {
        console.error('Error fetching pull requests:', error);
        return [];
    }
}

/**
 * Fetch recent commits
 * @param {string} githubUsername - GitHub username
 * @param {number} limit - Maximum commits to fetch
 * @returns {Promise<Array>} - Array of commit objects
 */
export async function fetchRecentCommits(githubUsername, limit = 30) {
    try {
        // Return empty array if no token or token is placeholder
        if (!GITHUB_TOKEN || GITHUB_TOKEN === 'VITE_GITHUB_TOKEN') {
            return [];
        }
        
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${GITHUB_TOKEN}`
        };
        
        const reposResponse = await fetch(
            `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=10`,
            { headers }
        );

        if (!reposResponse.ok) {
            return [];
        }

        const repos = await reposResponse.json();
        const allCommits = [];
        
        for (const repo of repos.slice(0, 10)) {
            if (allCommits.length >= limit) break;
            
            try {
                const commitsResponse = await fetch(
                    `https://api.github.com/repos/${repo.full_name}/commits?author=${githubUsername}&per_page=10&sort=author-date&order=desc`,
                    { headers }
                );
                
                if (commitsResponse.ok) {
                    const commits = await commitsResponse.json();
                    commits.forEach(commit => {
                        if (allCommits.length < limit) {
                            allCommits.push({
                                sha: commit.sha,
                                message: commit.commit.message.split('\n')[0],
                                author: commit.commit.author.name,
                                date: commit.commit.author.date,
                                url: commit.html_url,
                                repository: repo.full_name,
                                repositoryUrl: repo.html_url
                            });
                        }
                    });
                }
                
                    await new Promise(r => setTimeout(r, 200));
            } catch (error) {
                console.error(`Error fetching commits from ${repo.full_name}:`, error);
            }
        }
        
        return allCommits
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    } catch (error) {
        console.error('Error fetching recent commits:', error);
        return [];
    }
}

