#!/bin/bash
#
# Security Verification Script
# Run this before committing to ensure all secrets are protected
#

echo "🔒 Security Verification Script"
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: .env file not in git
echo "1. Checking if .env is tracked in git..."
if git ls-files 2>/dev/null | grep -q "^\.env$"; then
    echo "   ❌ ERROR: .env file is tracked in git!"
    echo "   Fix: git rm --cached .env"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ .env file is not tracked"
fi

# Check 2: .env in .gitignore
echo ""
echo "2. Checking .gitignore..."
if grep -qE "^\.env$|^\.env\." .gitignore; then
    echo "   ✅ .env is in .gitignore"
else
    echo "   ❌ ERROR: .env is not in .gitignore"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: Hardcoded Firebase API keys
echo ""
echo "3. Scanning for hardcoded Firebase API keys..."
FIREBASE_MATCHES=$(grep -rE "AIzaSy[A-Za-z0-9_-]{20,}" --include="*.js" --include="*.html" --exclude-dir=node_modules . 2>/dev/null | \
    grep -v "VITE_FIREBASE_API_KEY" | \
    grep -v ".env.example" | \
    grep -v "SETUP.md" | \
    grep -v "CONTRIBUTING.md" | \
    grep -v "TESTING.md" | \
    grep -v "SECURITY.md" | \
    grep -v "README.md" || true)

if [ -n "$FIREBASE_MATCHES" ]; then
    echo "   ❌ ERROR: Hardcoded Firebase API keys found!"
    echo "$FIREBASE_MATCHES" | sed 's/^/   /'
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ No hardcoded Firebase API keys"
fi

# Check 4: Hardcoded GitHub tokens
echo ""
echo "4. Scanning for hardcoded GitHub tokens..."
GITHUB_MATCHES=$(grep -rE "ghp_[A-Za-z0-9]{20,}" --include="*.js" --include="*.html" --exclude-dir=node_modules . 2>/dev/null | \
    grep -v "VITE_GITHUB_TOKEN" | \
    grep -v ".env.example" | \
    grep -v "SETUP.md" | \
    grep -v "CONTRIBUTING.md" | \
    grep -v "TESTING.md" | \
    grep -v "SECURITY.md" | \
    grep -v "README.md" || true)

if [ -n "$GITHUB_MATCHES" ]; then
    echo "   ❌ ERROR: Hardcoded GitHub tokens found!"
    echo "$GITHUB_MATCHES" | sed 's/^/   /'
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ No hardcoded GitHub tokens"
fi

# Check 5: Placeholders in source files
echo ""
echo "5. Verifying environment variable placeholders..."
if ! grep -q "VITE_FIREBASE_API_KEY" firebase-config.js 2>/dev/null; then
    echo "   ❌ ERROR: firebase-config.js missing VITE_FIREBASE_API_KEY placeholder"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ firebase-config.js has placeholder"
fi

if [ -f js/github-api.js ]; then
    if ! grep -q "VITE_GITHUB_TOKEN" js/github-api.js 2>/dev/null; then
        echo "   ❌ ERROR: js/github-api.js missing VITE_GITHUB_TOKEN placeholder"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ js/github-api.js has placeholder"
    fi
fi

if [ -f app.js ]; then
    if ! grep -q "VITE_GITHUB_TOKEN" app.js 2>/dev/null; then
        echo "   ❌ ERROR: app.js missing VITE_GITHUB_TOKEN placeholder"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ app.js has placeholder"
    fi
fi

# Check 6: .env.example exists
echo ""
echo "6. Checking .env.example..."
if [ ! -f .env.example ]; then
    echo "   ❌ ERROR: .env.example is missing"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ .env.example exists"
    
    # Check .env.example doesn't have real secrets
    if grep -qE "AIzaSy[A-Za-z0-9_-]{20,}" .env.example 2>/dev/null; then
        echo "   ⚠️  WARNING: .env.example may contain real Firebase API key"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if grep -qE "ghp_[A-Za-z0-9]{20,}" .env.example 2>/dev/null; then
        echo "   ⚠️  WARNING: .env.example may contain real GitHub token"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Check 7: Build script exists
echo ""
echo "7. Checking build script..."
if [ ! -f build.js ]; then
    echo "   ❌ ERROR: build.js is missing"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ build.js exists"
fi

# Summary
echo ""
echo "================================"
echo "Verification Summary"
echo "================================"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ Security verification PASSED"
    echo ""
    echo "Your code is safe to commit!"
    exit 0
else
    echo "❌ Security verification FAILED"
    echo ""
    echo "Please fix the errors above before committing."
    exit 1
fi

