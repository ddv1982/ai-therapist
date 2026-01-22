# E2E Tests

End-to-end tests for the AI Therapist application using Playwright.

## Quick Start

```bash
# Run all E2E tests
bun run test:e2e

# Run in interactive UI mode (recommended for development)
bun run test:e2e:ui

# Run specific test suite
bun run test:e2e -- critical-flows.spec.ts

# Debug mode
bun run test:e2e:debug
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

## Authentication Behavior

Tests run **without authentication**. The app uses Next.js 16 proxy with Clerk's `auth.protect()`, which redirects unauthenticated API requests to the sign-in page.

**Expected behavior for unauthenticated requests:**
- API requests → 307 redirect to `/sign-in` → 200 (HTML page)
- Playwright follows redirects by default
- Tests accept either auth redirect (200 HTML) OR error status (400/401/403/404)

Use the helper functions in `fixtures/test-data.ts`:

```typescript
import { isAuthRedirect, isValidUnauthResponse } from './fixtures/test-data';

// Check if response is an auth redirect
if (isAuthRedirect(response)) {
  // Response is 200 HTML (Clerk sign-in page)
}

// Valid response for unauthenticated requests
expect(isValidUnauthResponse(response)).toBeTruthy();
```

## Test Suites

### Active Test Suites (96 tests total)

1. **`health-smoke.spec.ts`** (2 tests)
   - API health endpoint checks
   - Basic connectivity verification

2. **`critical-flows.spec.ts`** (28 tests)
   - Essential user flows
   - Authentication requirements
   - Navigation and routing
   - Security headers validation

3. **`chat-flows.spec.ts`** (32 tests)
   - Chat interface availability
   - Message validation
   - Streaming responses
   - Session management

4. **`edge-cases.spec.ts`** (27 tests)
   - Network interruption handling
   - Session expiration recovery
   - Rapid session switching
   - Concurrent operations
   - Browser events

5. **`byok-api-keys.spec.ts`** (7 tests)
   - BYOK API key handling
   - Settings page behavior
   - Key security validation

## Directory Structure

```
e2e/
├── health-smoke.spec.ts        # Health & connectivity checks
├── critical-flows.spec.ts      # Essential user flows
├── chat-flows.spec.ts          # Chat functionality
├── edge-cases.spec.ts          # Edge case scenarios
├── byok-api-keys.spec.ts       # BYOK feature tests
├── fixtures/                   # Test data & helpers
│   └── test-data.ts           # Reusable test data & auth helpers
└── screenshots/                # Test artifacts
```

## Test Data Fixtures

Reusable test data in `fixtures/test-data.ts`:

```typescript
import {
  testUsers,
  testMessages,
  testMemoryData,
  generateTestEmail,
  isAuthRedirect,
  isValidUnauthResponse,
} from './fixtures/test-data';
```

### Auth Helper Functions

```typescript
// Check if response is an auth redirect (200 HTML from Clerk sign-in)
isAuthRedirect(response): boolean

// Check if response is valid for unauthenticated request
// Returns true for: auth redirect (200 HTML) OR 400/401/403/404
isValidUnauthResponse(response): boolean
```

## Writing New Tests

1. Determine which suite your test belongs to
2. Follow existing test patterns
3. Use `data-testid` attributes for stable selectors
4. Add proper waits (avoid `waitForTimeout`)
5. Ensure tests are isolated and independent
6. Use `isValidUnauthResponse()` for unauthenticated API tests

Example:

```typescript
import { isValidUnauthResponse } from './fixtures/test-data';

test('feature description', async ({ request }) => {
  const response = await request.post('/api/endpoint', {
    data: { message: 'test' },
  });

  // Accept either auth redirect or error response
  expect(isValidUnauthResponse(response)).toBeTruthy();
});
```

## Debugging

### Interactive UI Mode (Recommended)

```bash
bun run test:e2e:ui
```

Features:

- Watch tests run in real-time
- Time travel through test steps
- Inspect DOM at each step
- View network requests
- Pause and debug

### Debug Mode

```bash
bun run test:e2e:debug
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
- Use `isValidUnauthResponse()` for API tests without auth
- Wait for elements properly (auto-wait or explicit)
- Write isolated, independent tests
- Handle auth redirects gracefully
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

### Unauthenticated API Tests

```typescript
import { isValidUnauthResponse, isAuthRedirect } from './fixtures/test-data';

// Check if unauthenticated request handled correctly
const response = await request.get('/api/sessions');
expect(isValidUnauthResponse(response)).toBeTruthy();

// Or check specifically for auth redirect
if (isAuthRedirect(response)) {
  // Clerk redirected to sign-in page
}
```

### Network Simulation

```typescript
// Simulate network error
await page.route('**/api/chat', (route) => route.abort('failed'));

// Slow network
await page.route('**/api/**', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
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
  timeout: 5000,
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
const isVisible = await page
  .locator('[data-testid="element"]')
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

- **Playwright Docs**: https://playwright.dev/

## Test Statistics

- **Total Tests**: 96 (288 with browser variations across Chromium, Firefox, WebKit)
- **Test Suites**: 5 comprehensive suites
- **Coverage**: ~80% of critical user flows
- **Execution Time**: ~5-7 minutes (parallel)

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
