# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Environment File

```bash
cp .env.example .env
```

## Step 3: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vedamopensource007**
3. Go to Project Settings (gear icon) → General tab
4. Scroll to "Your apps" section
5. Copy the config values to your `.env` file

**Get values from Firebase Console:**
- Go to Project Settings → General
- Scroll to "Your apps" section
- Copy the configuration values
- **Note**: These are example values - use your own Firebase project credentials

## Step 4: Get GitHub Token (Optional but Recommended)

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Name: "Vedam Admin Dashboard"
4. Select scope: `public_repo`
5. Generate and copy to `.env`

**Generate a new token:**
- Go to GitHub Settings → Developer settings → Personal access tokens
- Generate new token (classic)
- Select scope: `public_repo`
- Copy the token to your `.env` file

⚠️ **IMPORTANT**: Never commit your token to git!

## Step 5: Build and Test

```bash
# Build (injects environment variables)
npm run build

# Test locally
npm run dev
```

Open `http://localhost:8000` in your browser.

## Step 6: Push to GitHub

```bash
# Initialize git (if not done)
git init

# Add files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/your-repo.git

# Push
git branch -M main
git push -u origin main
```

## Step 7: Deploy to Netlify

### Via Netlify UI:

1. Go to [Netlify](https://app.netlify.com/)
2. "Add new site" → "Import an existing project"
3. Connect GitHub → Select your repo
4. Build settings:
   - Build command: `npm install && npm run build`
   - Publish directory: `.`
5. Add environment variables (Site settings → Environment variables):
   - Add all `VITE_*` variables from your `.env` file
6. Deploy!

### Via CLI:

```bash
npm install -g netlify-cli
netlify login
netlify init
# Follow prompts, then:
netlify env:set VITE_FIREBASE_API_KEY "your-key"
# ... (add all other variables)
netlify deploy --prod
```

## Security Checklist

Before pushing to GitHub:

- [ ] `.env` file is NOT committed (check `.gitignore`)
- [ ] All secrets are in `.env` (not hardcoded)
- [ ] `.env.example` exists (without real values)
- [ ] Old tokens/keys are revoked if exposed

## Troubleshooting

**Build fails?**
- Check all environment variables are set
- Verify `.env` file exists
- Run `npm install` first

**Environment variables not working?**
- Make sure they're prefixed with `VITE_`
- Run `npm run build` after changing `.env`
- Check Netlify environment variables are set

**Firebase errors?**
- Verify project is active in Firebase Console
- Check Firestore security rules
- Ensure API keys are correct

