# Pull Request Workflow

This document explains the complete PR workflow and what happens at each step.

## Overview

```
PR Created → Tests Run → Preview Deploy → Review → Merge → Production Deploy
```

## Step-by-Step Process

### 1. Contributor Creates PR

When someone opens a Pull Request:

1. **GitHub Actions automatically runs:**
   - ✅ Environment variable checks
   - ✅ Security checks (no hardcoded secrets)
   - ✅ Build script tests
   - ✅ File structure validation
   - ✅ JavaScript syntax checks

2. **Netlify automatically:**
   - ✅ Creates a preview deployment
   - ✅ Builds the site with PR changes
   - ✅ Generates a unique preview URL
   - ✅ Comments on PR with preview link

3. **No manual approval needed** for preview deployments

### 2. Preview Deployment

**What happens:**
- Netlify builds your PR branch
- Creates a unique preview URL (e.g., `deploy-preview-123--your-site.netlify.app`)
- Preview is live and accessible
- Netlify bot comments on PR with the URL

**Features:**
- ✅ Automatic (no approval)
- ✅ Uses same environment variables as production
- ✅ Fully functional preview
- ✅ Shareable URL for testing

### 3. Code Review

**Reviewers check:**
- Code quality
- Functionality
- Tests pass
- Preview deployment works
- No security issues

**Reviewers can:**
- Comment on code
- Request changes
- Approve PR
- Test preview deployment

### 4. PR Merge

When PR is approved and merged:

1. **Code merges to `main` branch**
2. **Netlify detects merge**
3. **Production deployment starts automatically**
4. **Production site is updated**

**Important:**
- ✅ Only merged PRs deploy to production
- ✅ No manual deployment needed
- ✅ Automatic after merge

## Test Cases for PRs

### Automated Tests (GitHub Actions)

These run automatically on every PR:

1. **Environment Setup**
   - ✅ `.env.example` exists
   - ✅ `.env` is in `.gitignore`
   - ✅ No hardcoded secrets

2. **Security Checks**
   - ✅ No Firebase API keys in code
   - ✅ No GitHub tokens in code
   - ✅ Environment variables used properly

3. **Build Tests**
   - ✅ Build script works
   - ✅ Environment variables injected
   - ✅ No build errors

4. **File Structure**
   - ✅ Required files present
   - ✅ No unnecessary files
   - ✅ Proper file organization

5. **Code Quality**
   - ✅ JavaScript syntax valid
   - ✅ No console.log statements
   - ✅ Code follows conventions

### Manual Tests (Contributor)

Before submitting PR, contributor should test:

1. **Local Testing**
   - ✅ `npm run build` works
   - ✅ `npm run dev` works
   - ✅ Site loads correctly

2. **Functionality**
   - ✅ New features work
   - ✅ No breaking changes
   - ✅ Error handling works

3. **Browser Testing**
   - ✅ Chrome
   - ✅ Firefox
   - ✅ Safari
   - ✅ Mobile browsers

4. **Responsive Design**
   - ✅ Mobile view
   - ✅ Tablet view
   - ✅ Desktop view

### Review Tests (Maintainers)

When reviewing PR:

1. **Preview Deployment**
   - ✅ Preview URL works
   - ✅ Site functions correctly
   - ✅ No console errors

2. **Code Review**
   - ✅ Code quality
   - ✅ Security
   - ✅ Performance

3. **Integration**
   - ✅ Works with existing code
   - ✅ No conflicts
   - ✅ Backward compatible

## Test Checklist for Contributors

Before submitting PR, verify:

### Pre-Submission
- [ ] Code follows project style
- [ ] All tests pass locally
- [ ] No hardcoded secrets
- [ ] `.env` not committed
- [ ] Build script works

### Functionality
- [ ] Feature works as expected
- [ ] No breaking changes
- [ ] Error handling implemented
- [ ] Edge cases handled

### Code Quality
- [ ] No console.log statements
- [ ] Code is commented
- [ ] Variables named clearly
- [ ] No unused code

### Security
- [ ] No secrets in code
- [ ] Environment variables used
- [ ] Input validation added
- [ ] Error messages safe

### Documentation
- [ ] README updated (if needed)
- [ ] Code comments added
- [ ] PR description complete

## Preview Deployment Details

### How to Access Preview

1. **Automatic**: Netlify bot comments on PR with URL
2. **Netlify Dashboard**: Go to Deploys → Preview
3. **PR Checks**: Click "Details" on Netlify check

### Preview Features

- ✅ Full functionality
- ✅ Same environment variables
- ✅ Isolated from production
- ✅ Shareable URL
- ✅ Automatic updates on PR changes

### Preview Limitations

- ⚠️ Uses production Firebase (be careful with test data)
- ⚠️ Same GitHub token (rate limits shared)
- ⚠️ Temporary (deleted when PR closes)

## Production Deployment

### When It Happens

- ✅ **Only** when PR is merged to `main`
- ✅ **Automatic** - no manual trigger needed
- ✅ **After** all tests pass
- ✅ **After** code review approval

### What Happens

1. PR merges to `main`
2. Netlify detects merge
3. Production build starts
4. Site deploys to production URL
5. Production site updated

### Protection

- 🔒 Only `main` branch can deploy to production
- 🔒 Requires PR merge (no direct pushes)
- 🔒 All tests must pass
- 🔒 Code review required

## Troubleshooting

### Preview Not Creating

**Check:**
- Netlify integration connected
- Deploy previews enabled
- Build command correct
- Environment variables set

**Fix:**
- Go to Netlify → Site settings → Build & Deploy
- Enable "Deploy previews"
- Enable "Automatic deploy previews"

### Tests Failing

**Common issues:**
- Missing environment variables
- Build script errors
- Syntax errors
- Hardcoded secrets

**Fix:**
- Check GitHub Actions logs
- Fix errors locally
- Push fixes to PR branch

### Production Not Deploying

**Check:**
- PR was merged to `main`
- Build succeeded
- Environment variables set
- No build errors

**Fix:**
- Check Netlify build logs
- Verify merge to `main`
- Check environment variables

## Best Practices

1. **Always test locally** before PR
2. **Check preview deployment** after PR creation
3. **Review automated test results**
4. **Test preview URL** before requesting review
5. **Keep PRs focused** (one feature per PR)
6. **Write clear PR descriptions**
7. **Respond to review feedback**

## Summary

✅ **Preview Deployments**: Automatic, no approval needed
✅ **Production Deployments**: Automatic after PR merge
✅ **Tests**: Run automatically on PR creation
✅ **Security**: Checked automatically
✅ **Workflow**: Fully automated

---

**Questions?** Check [CONTRIBUTING.md](CONTRIBUTING.md) or open an issue!

