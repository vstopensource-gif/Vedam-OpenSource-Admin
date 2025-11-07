# Contributing Guide

Thank you for your interest in contributing to Vedam Open Source Admin Dashboard! 🎉

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/vedam-open-admin.git
cd vedam-open-admin
```

### 2. Setup Development Environment

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your test credentials
# (Use a separate Firebase project for testing)
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/your-bug-fix
```

## Development Workflow

### Making Changes

1. **Make your changes** in the codebase
2. **Test locally**:
   ```bash
   npm run build
   npm run dev
   ```
3. **Follow the testing checklist** in `TESTING.md`
4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

### Commit Message Guidelines

Use clear, descriptive commit messages:

- ✅ Good: `feat: Add dark mode toggle to settings`
- ✅ Good: `fix: Resolve scroll issue in form builder`
- ❌ Bad: `update`
- ❌ Bad: `fix bug`

### Before Submitting PR

Run these checks:

```bash
# Build the project
npm run build

# Test locally
npm run dev

# Check for hardcoded secrets
grep -r "AIzaSy\|ghp_" --include="*.js" --exclude-dir=node_modules

# Verify .env is not committed
git status | grep .env
```

## Pull Request Process

### 1. Create Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to GitHub and create a Pull Request
3. Fill out the PR template completely
4. Link any related issues

### 2. Automatic Checks

When you create a PR, these happen automatically:

- ✅ **GitHub Actions** run tests
- ✅ **Netlify** creates a preview deployment
- ✅ **Code quality** checks run

### 3. Preview Deployment

- **Automatic**: Preview deployment is created automatically
- **No approval needed**: Preview deployments don't require approval
- **URL provided**: Netlify comment will appear on your PR with preview URL
- **Live demo**: You can share the preview URL for testing

### 4. Review Process

1. **Automated checks must pass** (GitHub Actions)
2. **Code review** by maintainers
3. **Address feedback** if any
4. **Update PR** as needed

### 5. Merge and Deploy

- **After merge**: PR is merged to `main` branch
- **Automatic production deploy**: Netlify automatically deploys to production
- **No manual steps**: Everything is automatic

## Testing Requirements

Before submitting a PR, ensure:

- [ ] All tests in `TESTING.md` pass
- [ ] Code works in multiple browsers
- [ ] No console errors
- [ ] No hardcoded secrets
- [ ] Build script works
- [ ] Preview deployment works

See `TESTING.md` for complete testing checklist.

## Code Style

### JavaScript

- Use ES6+ features
- Use meaningful variable names
- Add comments for complex logic
- Remove `console.log` statements
- Handle errors properly

### CSS

- Use consistent naming (BEM or similar)
- Organize styles logically
- Use CSS variables for colors
- Make it responsive

### HTML

- Use semantic HTML
- Add alt text to images
- Proper heading hierarchy
- Accessible forms

## Project Structure

```
.
├── index.html          # Main dashboard
├── forms.html          # Forms management
├── firebase-config.js  # Firebase setup
├── js/                 # JavaScript modules
├── styles.css          # Global styles
├── build.js            # Build script
├── package.json        # Dependencies
└── netlify.toml        # Netlify config
```

## Environment Variables

Never commit `.env` file! Always use `.env.example` as template.

Required variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_GITHUB_TOKEN` (optional)

## Security Guidelines

- ❌ **Never** commit secrets or API keys
- ❌ **Never** hardcode credentials
- ✅ **Always** use environment variables
- ✅ **Always** check `.gitignore` includes `.env`
- ✅ **Always** test with test credentials

## Getting Help

- **Questions?** Open a discussion
- **Found a bug?** Open an issue
- **Security issue?** Contact maintainers privately
- **Need clarification?** Comment on the PR

## Recognition

Contributors will be:
- Listed in README.md
- Credited in release notes
- Appreciated by the community! 🙏

## Code of Conduct

- Be respectful
- Be constructive
- Help others learn
- Follow project guidelines

Thank you for contributing! 🚀

