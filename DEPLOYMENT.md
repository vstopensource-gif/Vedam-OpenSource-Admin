# Deployment Guide

## Quick Start

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# (See README.md for where to get these values)
```

### 2. Test Locally

```bash
# Build with environment variables
npm run build

# Serve locally
npm run dev

# Open http://localhost:8000
```

### 3. Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files (except those in .gitignore)
git add .

# Commit
git commit -m "Initial commit"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/your-repo.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 4. Deploy to Netlify

#### Option A: Via Netlify UI

1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `.`
6. Click "Show advanced" → "New variable"
7. Add all environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_GITHUB_TOKEN` (optional)
8. Click "Deploy site"

#### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize (follow prompts)
netlify init

# Set environment variables
netlify env:set VITE_FIREBASE_API_KEY "your-key"
netlify env:set VITE_FIREBASE_AUTH_DOMAIN "your-domain"
netlify env:set VITE_FIREBASE_PROJECT_ID "your-project-id"
netlify env:set VITE_FIREBASE_STORAGE_BUCKET "your-bucket"
netlify env:set VITE_FIREBASE_MESSAGING_SENDER_ID "your-sender-id"
netlify env:set VITE_FIREBASE_APP_ID "your-app-id"
netlify env:set VITE_FIREBASE_MEASUREMENT_ID "your-measurement-id"
netlify env:set VITE_GITHUB_TOKEN "your-token"  # Optional

# Deploy
netlify deploy --prod
```

## Environment Variables

### Required Variables

All Firebase variables are required:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Optional Variables

- `VITE_GITHUB_TOKEN` - GitHub Personal Access Token (increases API rate limit from 60 to 5,000/hour)

## Troubleshooting

### Build Fails

1. Check that all environment variables are set in Netlify
2. Verify `.env` file exists locally (not committed to git)
3. Check Netlify build logs for errors

### Environment Variables Not Working

1. Make sure variables are prefixed with `VITE_`
2. Rebuild after adding new variables: `npm run build`
3. Clear Netlify cache and redeploy

### Firebase Errors

1. Verify Firebase project is active
2. Check Firebase console for API restrictions
3. Ensure Firestore rules allow your operations

### GitHub API Rate Limits

1. Add `VITE_GITHUB_TOKEN` to increase limits
2. Check rate limit status in browser console
3. Wait for rate limit reset if exceeded

## Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `.env` is not committed to git
- [ ] Environment variables are set in Netlify
- [ ] Firebase security rules are configured
- [ ] GitHub token has minimal required scopes
- [ ] No hardcoded secrets in code

## Updating After Deployment

```bash
# Make changes locally
# Test with: npm run build && npm run dev

# Commit changes
git add .
git commit -m "Description of changes"
git push

# Netlify will automatically redeploy
# Or manually trigger: netlify deploy --prod
```

