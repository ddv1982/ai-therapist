# E2E Tests

End-to-end tests for the AI Therapist application using Playwright.

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run in interactive UI mode (recommended for development)
npm run test:e2e:ui

# Run specific test suite
npm run test:e2e -- therapy-session.spec.ts

# Debug mode
npm run test:e2e:debug
```

## Test Philosophy

**We test critical application flows with meaningful assertions.**

- ✅ Test health checks and connectivity
- ✅ Test critical user flows (authentication required, navigation)
- ✅ Test API responses and error handling
- ✅ Use real assertions that verify behavior
- ❌ Don't test third-party services (Clerk, AI APIs)
- ❌ Don't write smoke tests with trivial assertions
- ❌ Don't test non-deterministic AI responses

## Test Suites

### Active Test Suites

1. **`health-smoke.spec.ts`**
   - API health endpoint checks
   - Basic connectivity verification
   - Fast, reliable health checks

2. **`critical-flows.spec.ts`**
   - Essential user flows
   - Authentication requirements
   - Navigation and routing
   - Real assertions on behavior

3. **`chat-flows.spec.ts`**
   - Chat interface availability
   - Basic chat functionality
   - UI component checks

## Directory Structure

```
e2e/
├── health-smoke.spec.ts        # Health & connectivity checks
├── critical-flows.spec.ts      # Essential user flows
├── chat-flows.spec.ts          # Chat functionality
├── fixtures/                   # Test data & helpers
│   └── test-data.ts           # Reusable test data
└── screenshots/                # Test artifacts
```

## Test Data

Reusable test data and fixtures:

```typescript
import { AuthPage } from './page-objects/auth.page';
import { TherapySessionPage } from './page-objects/therapy-session.page';
import { MemoryPage } from './page-objects/memory.page';
import { SettingsPage } from './page-objects/settings.page';

test('example', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.signIn('test@example.com', 'password');
});
```

## Test Data Fixtures

Reusable test data in `fixtures/test-data.ts`:

```typescript
import { 
  testUsers, 
  testMessages, 
  testMemoryData,
  generateTestEmail 
} from './fixtures/test-data';
```

## Writing New Tests

1. Determine which suite your test belongs to
2. Use page objects for reusable logic
3. Follow existing test patterns
4. Use `data-testid` attributes for stable selectors
5. Add proper waits (avoid `waitForTimeout`)
6. Ensure tests are isolated and independent

Example:

```typescript
test('feature description', async ({ page }) => {
  const sessionPage = new TherapySessionPage(page);
  
  await sessionPage.gotoHome();
  await sessionPage.sendMessage('Test message');
  await sessionPage.verifyMessageVisible('Test message');
});
```

## Debugging

### Interactive UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

Features:
- Watch tests run in real-time
- Time travel through test steps
- Inspect DOM at each step
- View network requests
- Pause and debug

### Debug Mode

```bash
npm run test:e2e:debug
```

Add breakpoint in test:

```typescript
test('debug this', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Execution stops here
  await page.click('[data-testid="button"]');
});
```

### Screenshots & Videos

Failed tests automatically capture:
- Screenshot at failure point
- Video recording (in CI)

Find in: `test-results/` directory

## Best Practices

### ✅ Do

- Use `data-testid` attributes for selectors
- Use page objects for reusable logic
- Wait for elements properly (auto-wait or explicit)
- Write isolated, independent tests
- Handle both authenticated and unauthenticated states
- Use descriptive test names
- Clean up after tests

### ❌ Don't

- Use fragile CSS selectors
- Use arbitrary `waitForTimeout`
- Make tests dependent on each other
- Hardcode test data (use fixtures)
- Leave tests in `.only` mode
- Skip error handling

## Common Patterns

### Authentication

```typescript
const authPage = new AuthPage(page);

// Check if authenticated
if (await authPage.isAuthenticated()) {
  // Already signed in
} else {
  await authPage.signIn(email, password);
}
```

### Network Simulation

```typescript
// Simulate network error
await page.route('**/api/chat', route => route.abort('failed'));

// Slow network
await page.route('**/api/**', async (route) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  await route.continue();
});

// Clean up
await page.unroute('**/api/**');
```

### Waiting for Elements

```typescript
// Auto-wait (preferred)
await page.click('[data-testid="button"]');

// Explicit wait when needed
await page.waitForSelector('[data-testid="result"]', { 
  state: 'visible',
  timeout: 5000 
});
```

## Troubleshooting

### Test times out

```typescript
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

### Element not found

Check if element is conditionally rendered:

```typescript
const isVisible = await page.locator('[data-testid="element"]')
  .isVisible()
  .catch(() => false);

if (isVisible) {
  // Interact with element
}
```

### Flaky tests

- Replace `waitForTimeout` with proper waits
- Ensure tests are isolated
- Use stable selectors
- Handle loading states

### Clerk authentication issues

Tests handle Clerk UI gracefully with fallbacks for unauthenticated states.

## CI/CD

Tests run automatically on:
- Pull requests
- Main branch commits

CI configuration:
- Single worker (no parallelization)
- 2 retries on failure
- Chromium browser only
- Screenshots on failure

## Documentation

- **Full Guide**: `../docs/e2e-testing.md`
- **Quick Reference**: `../docs/e2e-quick-reference.md`
- **Test Summary**: `../docs/e2e-test-summary.md`
- **Playwright Docs**: https://playwright.dev/

## Test Statistics

- **Total Tests**: 120+ (360+ with browser variations)
- **Test Suites**: 6 comprehensive suites
- **Coverage**: ~80% of critical user flows
- **Lines of Code**: ~4,500 lines
- **Execution Time**: ~7-8 minutes (parallel)

## Contributing

1. Add tests for new features
2. Update page objects when UI changes
3. Keep documentation up to date
4. Run tests before submitting PR
5. Fix flaky tests immediately

## Support

Questions? Check:
1. This README
2. Full documentation in `../docs/`
3. Existing test examples
4. Playwright documentation
5. Team #testing channel
