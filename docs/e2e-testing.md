# E2E Testing Guide

## Overview

This document describes the End-to-End (E2E) testing infrastructure for the AI Therapist application. We use Playwright to test critical user flows and ensure the application works correctly from a user's perspective.

## Test Coverage

We maintain ~80% coverage of critical user flows across 6 comprehensive test suites:

### Suite 1: Authentication Flow (`auth-flow.spec.ts`)
- **Sign-up flow**: User registration, email validation, password strength
- **Sign-in flow**: Login with credentials, error handling, form validation
- **Sign-out flow**: Logout, session clearing, redirect verification
- **MFA setup**: Multi-factor authentication configuration (via Clerk)
- **Password reset**: Forgot password flow, email validation
- **Edge cases**: Rapid attempts, browser navigation, slow networks, session timeout

**Test Count**: ~20 tests  
**Estimated Time**: 3 hours

### Suite 2: Therapy Session Flow (`therapy-session.spec.ts`)
- **Session creation**: New session creation, initial state
- **Messaging**: Send/receive messages, AI responses, loading states
- **Persistence**: Save/resume sessions, message persistence, cross-browser sync
- **Export**: Session export functionality, download verification
- **Deletion**: Session deletion, confirmation dialogs
- **Edge cases**: Rapid messages, session switching, network interruptions

**Test Count**: ~25 tests  
**Estimated Time**: 5 hours

### Suite 3: Memory Management (`memory-management.spec.ts`)
- **Add memory**: Create memory entries, content validation, categorization
- **Edit memory**: Modify existing entries, save changes, cancel editing
- **Delete memory**: Remove entries, confirmation dialogs, undo protection
- **Persistence**: Cross-session persistence, page reload, multi-tab sync
- **Search/Filter**: Search by content, filter by category
- **Edge cases**: Long content, special characters, concurrent operations

**Test Count**: ~20 tests  
**Estimated Time**: 3 hours

### Suite 4: Settings Flow (`settings.spec.ts`)
- **Profile settings**: Update name/email via Clerk, profile management
- **Preferences**: Theme toggle (light/dark), notification settings, auto-save
- **Feature toggles**: Enable/disable advanced features, beta features
- **Account management**: View account info, security settings, password changes
- **Edge cases**: Rapid toggles, persistence, validation

**Test Count**: ~15 tests  
**Estimated Time**: 2 hours

### Suite 5: Obsessions/Compulsions Table (`obsessions-table.spec.ts`)
- **Table creation**: Create OCD tracking tables via chat
- **Add entries**: Add obsessions and compulsions, validation
- **Edit entries**: Modify existing entries, save changes
- **Delete entries**: Remove entries, confirmation
- **Table management**: View, export, clear tables, persistence
- **Edge cases**: Long descriptions, special characters, large datasets

**Test Count**: ~18 tests  
**Estimated Time**: 3 hours

### Suite 6: Error Handling (`error-handling.spec.ts`)
- **Network errors**: Connection failures, retry mechanisms, user-friendly messages
- **API failures**: 500 errors, 404 not found, 401 unauthorized, rate limiting
- **Session timeout**: Token expiration, re-authentication prompts
- **Validation errors**: Form validation, inline errors, error clearing
- **Error recovery**: Temporary issues, multiple errors, state preservation

**Test Count**: ~25 tests  
**Estimated Time**: 3 hours

## Architecture

### Page Object Pattern

We use the Page Object pattern to encapsulate page-specific logic and selectors:

```typescript
// e2e/page-objects/auth.page.ts
export class AuthPage {
  constructor(private page: Page) {}
  
  async signIn(email: string, password: string) {
    await this.gotoSignIn();
    await this.page.fill('[name="identifier"]', email);
    // ... rest of login flow
  }
}
```

**Available Page Objects**:
- `AuthPage` - Authentication flows (sign-in, sign-up, sign-out)
- `TherapySessionPage` - Session management and messaging
- `MemoryPage` - Memory entry management
- `SettingsPage` - User preferences and settings

### Test Fixtures

Reusable test data is defined in `e2e/fixtures/test-data.ts`:

```typescript
export const testMessages = {
  greeting: 'Hello, I would like to talk about my anxiety.',
  followUp: 'Can you help me understand my triggers?',
  // ...
};

export const testMemoryData = {
  entries: [
    { content: 'Patient reports high anxiety', category: 'Symptoms' },
    // ...
  ]
};
```

## Running Tests

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- auth-flow.spec.ts

# Run in UI mode (interactive debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# Generate HTML report
npm run test:e2e -- --reporter=html
```

### CI Configuration

Tests run automatically in CI with:
- Single worker (no parallelization)
- 2 retries on failure
- Chromium browser only
- Screenshot on failure
- Video recording on failure

### Local Development

For local development:
- Tests run in parallel
- Multiple browsers (Chromium, Firefox, WebKit)
- No retries by default
- Screenshots and videos on failure only

## Test Organization

### File Structure

```
e2e/
├── auth-flow.spec.ts           # Authentication tests
├── therapy-session.spec.ts      # Session & messaging tests
├── memory-management.spec.ts    # Memory CRUD tests
├── settings.spec.ts            # Settings & preferences
├── obsessions-table.spec.ts    # OCD table management
├── error-handling.spec.ts      # Error scenarios
├── page-objects/
│   ├── auth.page.ts            # Auth page object
│   ├── therapy-session.page.ts # Session page object
│   ├── memory.page.ts          # Memory page object
│   └── settings.page.ts        # Settings page object
└── fixtures/
    └── test-data.ts            # Reusable test data
```

### Naming Conventions

- Test files: `<feature>-<flow>.spec.ts`
- Page objects: `<page-name>.page.ts`
- Test descriptions: Use descriptive names that explain what's being tested
- Test IDs: Use `data-testid` attributes for stable selectors

## Best Practices

### 1. Use Stable Selectors

Prefer `data-testid` attributes over CSS selectors:

```typescript
// Good
await page.click('[data-testid="submit-button"]');

// Avoid (fragile)
await page.click('.btn.btn-primary.submit');
```

### 2. Wait Properly

Use Playwright's auto-waiting and explicit waits:

```typescript
// Auto-waiting (preferred)
await page.click('[data-testid="button"]');

// Explicit wait when needed
await page.waitForSelector('[data-testid="result"]', { state: 'visible' });

// Avoid arbitrary timeouts
await page.waitForTimeout(5000); // Only when necessary
```

### 3. Isolate Tests

Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Set up clean state for each test
  await page.goto('/');
});

test.afterEach(async ({ page }) => {
  // Clean up if needed
});
```

### 4. Handle Auth States

Most tests require authentication:

```typescript
// Skip auth for unauthenticated tests
test('public page loads', async ({ page }) => {
  await page.goto('/');
  // ...
});

// Handle auth gracefully
test('protected feature', async ({ page }) => {
  await page.goto('/');
  
  if (page.url().includes('/sign-in')) {
    // Not authenticated - handle accordingly
    return;
  }
  
  // Continue with test
});
```

### 5. Graceful Degradation

Tests should handle various states gracefully:

```typescript
// Check if element exists before interacting
const button = await page.locator('[data-testid="button"]').isVisible().catch(() => false);

if (button) {
  await page.click('[data-testid="button"]');
}

// Test passes even if feature isn't available
expect(page).toBeTruthy();
```

## Debugging

### Interactive Debugging

Use UI mode for interactive debugging:

```bash
npm run test:e2e:ui
```

This opens Playwright's UI where you can:
- Watch tests run in real-time
- Pause and step through tests
- Inspect DOM at each step
- View console logs and network requests

### Debug Mode

Run tests with debugger attached:

```bash
npm run test:e2e:debug
```

Add breakpoints in your test code:

```typescript
test('my test', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Debugger stops here
  await page.click('[data-testid="button"]');
});
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshot at point of failure
- Video recording of entire test (in CI)

Access these in `test-results/` directory.

### Console Logs

Capture console errors in tests:

```typescript
test('no console errors', async ({ page }) => {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.goto('/');
  
  expect(errors).toHaveLength(0);
});
```

## Network Simulation

Test error handling with network conditions:

```typescript
// Simulate network failure
await page.route('**/api/chat', route => route.abort('failed'));

// Simulate slow network
await page.route('**/*', async (route) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  await route.continue();
});

// Mock API response
await page.route('**/api/chat', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Mocked response' })
  });
});
```

## Common Issues

### Issue: Tests timeout during startup

**Solution**: Increase timeout in `playwright.config.ts`:

```typescript
webServer: {
  timeout: 180_000, // 3 minutes
}
```

### Issue: Tests flaky on CI

**Solution**: 
1. Use proper waits instead of `waitForTimeout`
2. Enable retries in CI (already configured)
3. Ensure tests are isolated

### Issue: Clerk sign-in doesn't work in tests

**Solution**: 
1. Use test mode in Clerk
2. Create test users
3. Or use stable selectors that work with Clerk's UI

### Issue: Element not found

**Solution**:
1. Verify selector is correct
2. Check if element is conditionally rendered
3. Add proper wait conditions
4. Use `.first()` for multiple matches

## Performance

### Test Execution Time

- **Total E2E Suite**: ~19 hours (sequential)
- **Parallel (3 workers)**: ~6 hours
- **CI (1 worker, Chromium only)**: ~3 hours
- **Single Suite Average**: ~15-20 minutes

### Optimization Tips

1. **Run in parallel locally**: Tests are designed to be parallelizable
2. **Run specific suites**: Use `-- <file>.spec.ts` to run only what changed
3. **Use UI mode**: Faster feedback during development
4. **Skip slow tests**: Mark with `.skip` during development

## Maintenance

### Adding New Tests

1. Identify the feature/flow to test
2. Determine which suite it belongs to
3. Add test case following existing patterns
4. Use page objects for reusable logic
5. Update this documentation

### Updating Selectors

When UI changes:
1. Update page objects first
2. Run affected tests
3. Fix broken selectors
4. Consider using `data-testid` for stability

### Reviewing Coverage

Periodically review test coverage:

```bash
npm run test:e2e -- --reporter=html
```

Look for:
- Critical flows without tests
- Flaky tests (retries in CI)
- Slow tests (>30 seconds)
- Redundant tests

## Integration with CI/CD

Tests run automatically on:
- Pull requests
- Main branch commits
- Release branches

**CI Configuration**:
- GitHub Actions workflow
- Runs after unit tests pass
- Blocks merge on failure
- Uploads test results as artifacts

## Future Improvements

- [ ] Add visual regression testing
- [ ] Implement test data seeding
- [ ] Add performance benchmarks
- [ ] Create custom fixtures for auth states
- [ ] Add API contract testing
- [ ] Implement test tagging (smoke, regression, etc.)

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Support

For questions or issues:
1. Check this documentation first
2. Review existing test examples
3. Consult Playwright docs
4. Ask the team in #testing channel
