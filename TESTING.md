# Testing Guide for Contributors

This document outlines all test cases that should be verified when creating a Pull Request.

## Pre-Submission Checklist

Before submitting a PR, ensure all these tests pass:

### 1. Environment Setup Tests

- [ ] **`.env.example` exists** - Template file for environment variables
- [ ] **`.env` is in `.gitignore`** - Sensitive file should not be committed
- [ ] **No hardcoded secrets** - All API keys/tokens use environment variables
- [ ] **Build script works** - `npm run build` completes without errors
- [ ] **Local dev works** - `npm run dev` serves the site correctly

### 2. Security Tests

- [ ] **No Firebase API keys in code** - Only placeholders (`VITE_FIREBASE_API_KEY`)
- [ ] **No GitHub tokens in code** - Only placeholder (`VITE_GITHUB_TOKEN`)
- [ ] **No credentials in console logs** - Check browser console for leaks
- [ ] **Environment variables properly used** - All secrets come from `.env`
- [ ] **`.env` file not committed** - Verify with `git status`

### 3. File Structure Tests

- [ ] **Required files present**:
  - `index.html`
  - `firebase-config.js`
  - `package.json`
  - `netlify.toml`
  - `.gitignore`
  - `.env.example`
  - `build.js`

- [ ] **No unnecessary files**:
  - No `node_modules/` committed
  - No `.env` file
  - No build artifacts

### 4. Build & Deployment Tests

- [ ] **Build succeeds**: `npm run build` completes
- [ ] **Environment variables injected**: Check built files for placeholders (should be replaced)
- [ ] **Netlify config valid**: `netlify.toml` syntax is correct
- [ ] **No build warnings**: Check build output for warnings

### 5. Functionality Tests

#### Authentication
- [ ] Login works with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Logout works correctly
- [ ] Session persists on page refresh
- [ ] Protected routes redirect to login

#### Dashboard
- [ ] Dashboard loads without errors
- [ ] Statistics display correctly
- [ ] Charts/graphs render properly
- [ ] Data refreshes correctly

#### Member Management
- [ ] Add new member works
- [ ] Edit member works
- [ ] Delete member works (with confirmation)
- [ ] Search/filter members works
- [ ] Member details page loads
- [ ] GitHub integration fetches data

#### Form Builder
- [ ] Create new form works
- [ ] Add fields to form works
- [ ] Edit field properties works
- [ ] Delete fields works
- [ ] Form preview renders correctly
- [ ] Save form works
- [ ] Publish form works
- [ ] Section breaks work correctly
- [ ] Page breaks work correctly
- [ ] Field grouping by section works

#### Form Submissions
- [ ] View submissions works
- [ ] Filter submissions works
- [ ] Export submissions works (if implemented)
- [ ] Delete submissions works

#### Analytics
- [ ] Analytics page loads
- [ ] Charts display correctly
- [ ] Date filters work
- [ ] Data aggregation is correct

### 6. UI/UX Tests

- [ ] **Responsive design**:
  - [ ] Mobile view (< 768px)
  - [ ] Tablet view (768px - 1024px)
  - [ ] Desktop view (> 1024px)

- [ ] **Browser compatibility**:
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Accessibility**:
  - [ ] Keyboard navigation works
  - [ ] Screen reader friendly (if applicable)
  - [ ] Color contrast is sufficient
  - [ ] Focus indicators visible

- [ ] **Performance**:
  - [ ] Page loads in < 3 seconds
  - [ ] No console errors
  - [ ] No memory leaks
  - [ ] Smooth scrolling

### 7. Code Quality Tests

- [ ] **JavaScript**:
  - [ ] No syntax errors
  - [ ] No unused variables
  - [ ] Functions are properly named
  - [ ] Code is properly commented
  - [ ] No `console.log` in production code

- [ ] **CSS**:
  - [ ] No duplicate styles
  - [ ] Styles are organized
  - [ ] No inline styles (unless necessary)
  - [ ] Responsive breakpoints are correct

- [ ] **HTML**:
  - [ ] Valid HTML structure
  - [ ] Semantic HTML used
  - [ ] Alt text for images
  - [ ] Proper heading hierarchy

### 8. Integration Tests

- [ ] **Firebase**:
  - [ ] Firestore reads work
  - [ ] Firestore writes work
  - [ ] Authentication works
  - [ ] Error handling for Firebase failures

- [ ] **GitHub API**:
  - [ ] User data fetches correctly
  - [ ] Rate limiting handled
  - [ ] Error handling for API failures
  - [ ] Works with and without token

### 9. Edge Cases

- [ ] **Empty states**:
  - [ ] No members message displays
  - [ ] No forms message displays
  - [ ] No submissions message displays

- [ ] **Error states**:
  - [ ] Network errors handled
  - [ ] API errors handled
  - [ ] Invalid input validation
  - [ ] Error messages are user-friendly

- [ ] **Data validation**:
  - [ ] Required fields validated
  - [ ] Email format validated
  - [ ] Number ranges validated
  - [ ] Date formats validated

### 10. Form Builder Specific Tests

- [ ] **Field Types**:
  - [ ] All 13 field types can be added
  - [ ] Each field type renders correctly
  - [ ] Field properties save correctly
  - [ ] Field deletion works

- [ ] **Sections**:
  - [ ] Create section works
  - [ ] Assign fields to sections works
  - [ ] Section properties save
  - [ ] Delete section unassigns fields
  - [ ] Section numbering is correct

- [ ] **Page Breaks**:
  - [ ] Add page break works
  - [ ] Multi-page forms render
  - [ ] Page navigation works (in preview)
  - [ ] Progress bar displays

- [ ] **Field Properties**:
  - [ ] Common properties work for all fields
  - [ ] Field-specific properties work
  - [ ] Property changes reflect in preview
  - [ ] Scroll position maintained when editing

### 11. Cross-Browser Tests

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### 12. Performance Tests

- [ ] **Load time**: < 3 seconds on 3G connection
- [ ] **Time to interactive**: < 5 seconds
- [ ] **Bundle size**: Check if new dependencies are necessary
- [ ] **Memory usage**: No memory leaks on long sessions

## Automated Tests (GitHub Actions)

The following tests run automatically on PR creation:

1. ✅ Environment variable check
2. ✅ `.gitignore` validation
3. ✅ Hardcoded secrets detection
4. ✅ Build script test
5. ✅ File structure validation
6. ✅ HTML validation

## Manual Testing Steps

### For New Features:

1. **Test the happy path**: Everything works as expected
2. **Test edge cases**: Empty inputs, invalid data, etc.
3. **Test error handling**: Network failures, API errors
4. **Test with different data**: Various scenarios
5. **Test user flow**: Complete user journey

### For Bug Fixes:

1. **Reproduce the bug**: Confirm it exists
2. **Test the fix**: Verify it's resolved
3. **Test related features**: Ensure nothing broke
4. **Test edge cases**: Similar scenarios

## Testing Checklist for PR Reviewers

When reviewing a PR, verify:

- [ ] All automated tests pass
- [ ] Code follows project conventions
- [ ] No security issues introduced
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or documented)
- [ ] Performance not degraded
- [ ] UI/UX is consistent

## Reporting Issues

If you find issues during testing:

1. **Create an issue** with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Browser/OS information

2. **For security issues**: 
   - Do NOT create a public issue
   - Contact maintainers directly
   - Use private communication

## Test Data

For testing, use:
- Test Firebase project (separate from production)
- Test GitHub accounts
- Sample form data
- Mock API responses (if needed)

---

**Remember**: A well-tested PR is more likely to be merged quickly! 🚀

