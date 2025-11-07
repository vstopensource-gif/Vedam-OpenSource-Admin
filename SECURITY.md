# Security Guide

## 🔒 Secret Management

### Current Status

✅ **All secrets are protected:**
- Firebase API keys use environment variables
- GitHub tokens use environment variables
- No hardcoded secrets in code
- `.env` file is in `.gitignore`

### What's Protected

1. **Firebase Configuration:**
   - API Key
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
   - Measurement ID

2. **GitHub Token:**
   - Personal Access Token

### Files That Handle Secrets

- `firebase-config.js` - Uses `VITE_FIREBASE_API_KEY` placeholder
- `js/github-api.js` - Uses `VITE_GITHUB_TOKEN` placeholder
- `app.js` - Uses `VITE_GITHUB_TOKEN` placeholder
- `build.js` - Injects environment variables at build time

## 🛡️ Security Measures

### 1. Git Protection

- ✅ `.env` is in `.gitignore`
- ✅ `.env.local`, `.env.production` are ignored
- ✅ Pre-commit hook prevents committing secrets
- ✅ GitHub Actions scan for secrets

### 2. Build-Time Injection

Secrets are injected at build time, not in source code:

```javascript
// Source code (safe to commit)
const firebaseConfig = {
  apiKey: "VITE_FIREBASE_API_KEY"
};

// After build (with real values, not committed)
const firebaseConfig = {
  apiKey: "AIzaSy..." // Real key from environment
};
```

### 3. Automated Security Checks

**GitHub Actions run on every PR:**
- ✅ Scan for hardcoded secrets
- ✅ Verify `.env` not in git
- ✅ Check `.gitignore` configuration
- ✅ Validate environment variable placeholders
- ✅ Verify `.env.example` is safe

## 📋 Security Checklist

Before pushing code, verify:

- [ ] No `.env` file in git (`git status` should not show `.env`)
- [ ] No hardcoded API keys in code
- [ ] No hardcoded tokens in code
- [ ] All secrets use environment variables
- [ ] `.env.example` exists (without real values)
- [ ] `.gitignore` includes `.env`

## 🚨 If Secrets Are Exposed

### Immediate Actions:

1. **Rotate all exposed secrets:**
   - Generate new Firebase API keys
   - Generate new GitHub token
   - Revoke old tokens/keys

2. **Update environment variables:**
   - Update `.env` file locally
   - Update Netlify environment variables
   - Update any CI/CD systems

3. **Clean git history (if needed):**
   ```bash
   # Use BFG Repo-Cleaner or git-filter-repo
   # to remove secrets from git history
   ```

4. **Notify team:**
   - Inform all team members
   - Update documentation
   - Review access logs

## 🔍 How to Verify Secrets Are Hidden

### Check Before Committing:

```bash
# Check if .env is tracked
git ls-files | grep .env

# Search for hardcoded secrets
grep -r "AIzaSy" --include="*.js" --exclude-dir=node_modules .
grep -r "ghp_" --include="*.js" --exclude-dir=node_modules .

# Should only find placeholders like "VITE_FIREBASE_API_KEY"
```

### Check After Downloading from GitHub:

```bash
# Clone the repo
git clone <repo-url>
cd <repo-name>

# Check source files (should only have placeholders)
grep "VITE_FIREBASE_API_KEY" firebase-config.js
grep "VITE_GITHUB_TOKEN" js/github-api.js

# Should find placeholders, NOT real values
```

## 📝 For Contributors

### What You'll See:

When you download the project from GitHub:

1. **Source files contain placeholders:**
   ```javascript
   // firebase-config.js
   apiKey: "VITE_FIREBASE_API_KEY"  // Placeholder, not real key
   ```

2. **No `.env` file:**
   - You need to create your own
   - Copy from `.env.example`
   - Add your own credentials

3. **Build requires environment variables:**
   - Run `npm run build` with `.env` file
   - Build script replaces placeholders
   - Built files contain real values (not committed)

### What You Won't See:

- ❌ Real Firebase API keys
- ❌ Real GitHub tokens
- ❌ Any production secrets
- ❌ `.env` file with real values

## 🔐 Environment Variables

### Required Variables:

```env
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_GITHUB_TOKEN=your_token_here  # Optional
```

### Where to Get Values:

- **Firebase**: [Firebase Console](https://console.firebase.google.com/)
- **GitHub**: [GitHub Settings → Tokens](https://github.com/settings/tokens)

## ✅ Security Best Practices

1. **Never commit `.env` file**
2. **Never hardcode secrets**
3. **Always use environment variables**
4. **Rotate secrets regularly**
5. **Use different secrets for dev/prod**
6. **Review PRs for secret exposure**
7. **Use pre-commit hooks**
8. **Enable automated security scans**

## 🧪 Testing Security

### Automated Tests:

- ✅ Pre-commit hook checks
- ✅ GitHub Actions security scan
- ✅ Secret detection in PRs
- ✅ Environment variable validation

### Manual Verification:

```bash
# 1. Check .env is ignored
git check-ignore .env

# 2. Search for secrets
grep -r "AIzaSy\|ghp_" --include="*.js" .

# 3. Verify placeholders
grep "VITE_" firebase-config.js js/github-api.js
```

## 📚 Additional Resources

- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_cryptographic_key)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

**Remember**: Security is everyone's responsibility! 🔒

