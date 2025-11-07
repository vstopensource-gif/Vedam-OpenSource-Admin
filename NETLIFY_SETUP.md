# Netlify Configuration Guide

This guide helps you configure Netlify for automatic preview deployments and production-only deployments.

## Netlify Dashboard Settings

After connecting your GitHub repo to Netlify, configure these settings:

### 1. Site Settings → Build & Deploy

**Build settings:**
- **Build command**: `npm install && npm run build`
- **Publish directory**: `.`
- **Base directory**: (leave empty)

### 2. Site Settings → Build & Deploy → Continuous Deployment

**Branch deploys:**
- ✅ **Enable branch deploys**: ON
- **Production branch**: `main`
- **Branch deploy settings**: 
  - ✅ Deploy only the production branch
  - ✅ Stop automatic deploys (for production - previews are automatic)

**Deploy previews:**
- ✅ **Enable deploy previews**: ON
- ✅ **Automatic deploy previews**: ON (no approval needed)
- ✅ **Deploy previews for draft PRs**: ON (optional)

### 3. Site Settings → Build & Deploy → Deploy Contexts

Configure these contexts:

**Production:**
- Branch: `main`
- Deploy: Automatic
- Build command: `npm install && npm run build`

**Deploy Previews:**
- Branch: All branches
- Deploy: Automatic (no approval)
- Build command: `npm install && npm run build`

**Branch Deploys:**
- Branch: All branches (except main)
- Deploy: Automatic
- Build command: `npm install && npm run build`

### 4. Site Settings → Environment Variables

Add all required environment variables:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_GITHUB_TOKEN (optional)
```

**Important**: These variables are available to:
- ✅ Production deployments
- ✅ Deploy previews (PRs)
- ✅ Branch deploys

### 5. Site Settings → Build & Deploy → Deploy Hooks

**Production deploy hook:**
- Only triggers on `main` branch
- Automatic after PR merge

**Preview deploy hook:**
- Triggers on all PRs
- Automatic (no approval)

### 6. Site Settings → Build & Deploy → Post Processing

**Build notifications:**
- ✅ Notify on build failure
- ✅ Notify on build success (optional)

### 7. Site Settings → Domain Management

**Production domain:**
- Your main domain (e.g., `your-site.netlify.app`)

**Preview domains:**
- Automatic for each PR (e.g., `deploy-preview-123--your-site.netlify.app`)

## How It Works

### When a PR is Created:

1. **GitHub Actions** runs automated tests
2. **Netlify** automatically creates a preview deployment
3. **Preview URL** is available in PR comments
4. **No approval needed** - preview deploys automatically

### When a PR is Merged:

1. Code is merged to `main` branch
2. **Netlify** automatically detects the merge
3. **Production deployment** is triggered
4. **Production site** is updated

### Branch Protection:

- ✅ Only `main` branch can deploy to production
- ✅ All other branches get preview deployments
- ✅ PRs get preview deployments automatically
- ✅ No manual approval for previews

## Verification

### Test Preview Deployments:

1. Create a test branch:
   ```bash
   git checkout -b test/preview-deploy
   git commit --allow-empty -m "Test preview deployment"
   git push origin test/preview-deploy
   ```

2. Create a PR from this branch
3. Check Netlify dashboard - preview should appear automatically
4. Check PR comments - Netlify bot should comment with preview URL

### Test Production Deployment:

1. Merge a PR to `main`
2. Check Netlify dashboard - production deploy should start
3. Verify production site is updated

## Troubleshooting

### Preview Deployments Not Working

**Check:**
- ✅ Deploy previews are enabled in Netlify
- ✅ GitHub integration is connected
- ✅ Build command is correct
- ✅ Environment variables are set

**Fix:**
- Go to Site settings → Build & Deploy
- Enable "Deploy previews"
- Enable "Automatic deploy previews"

### Production Not Deploying

**Check:**
- ✅ Production branch is set to `main`
- ✅ Build command is correct
- ✅ Environment variables are set
- ✅ Build is successful

**Fix:**
- Verify production branch in settings
- Check build logs for errors
- Ensure all environment variables are set

### Build Failures

**Common issues:**
- Missing environment variables
- Build script errors
- Dependency issues

**Fix:**
- Check build logs in Netlify
- Verify all environment variables
- Test build locally: `npm run build`

## Netlify Status Badge

Add this to your README to show deployment status:

```markdown
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_SITE_ID/deploy-status)](https://app.netlify.com/sites/YOUR_SITE_NAME/deploys)
```

Replace:
- `YOUR_SITE_ID` - Found in Site settings → General → Site details
- `YOUR_SITE_NAME` - Your Netlify site name

## Best Practices

1. **Always test preview deployments** before merging
2. **Review preview URLs** in PR comments
3. **Check build logs** if deployment fails
4. **Keep environment variables updated**
5. **Monitor production deployments** after merge

## Security Notes

- ✅ Environment variables are secure in Netlify
- ✅ Preview deployments use same env vars (be careful with sensitive data)
- ✅ Production deployments are protected
- ✅ Only `main` branch can deploy to production

---

**Need help?** Check Netlify docs or open an issue!

