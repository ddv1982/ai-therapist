# E2E Testing Quick Reference

## Quick Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth-flow.spec.ts

# Run tests matching pattern
npm run test:e2e -- --grep "sign-in"

# Interactive UI mode (best for development)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Debug mode with pause
npm run test:e2e:debug

# Generate HTML report
npm run test:e2e -- --reporter=html
```

## Test Suites

| Suite | File | Tests | Focus |
|-------|------|-------|-------|
| Auth | `auth-flow.spec.ts` | 19 | Sign-up/in/out, MFA, password reset |
| Sessions | `therapy-session.spec.ts` | 21 | Create, message, save, export, delete |
| Memory | `memory-management.spec.ts` | 19 | Add, edit, delete, search memories |
| Settings | `settings.spec.ts` | 19 | Profile, preferences, features |
| OCD Tables | `obsessions-table.spec.ts` | 21 | Create/manage tracking tables |
| Errors | `error-handling.spec.ts` | 21 | Network, API, timeout, validation |

## Page Objects

```typescript
import { AuthPage } from './page-objects/auth.page';
import { TherapySessionPage } from './page-objects/therapy-session.page';
import { MemoryPage } from './page-objects/memory.page';
import { SettingsPage } from './page-objects/settings.page';

// Usage in tests
test('my test', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.signIn(email, password);
});
```

## Common Patterns

### Basic Test Structure

```typescript
test('feature description', async ({ page }) => {
  // Arrange: Set up test state
  await page.goto('/');
  
  // Act: Perform action
  await page.click('[data-testid="button"]');
  
  // Assert: Verify outcome
  await expect(page.locator('[data-testid="result"]')).toBeVisible();
});
```

### Using Page Objects

```typescript
test('sign in and create session', async ({ page }) => {
  const authPage = new AuthPage(page);
  const sessionPage = new TherapySessionPage(page);
  
  await authPage.signIn('test@example.com', 'password');
  await sessionPage.createNewSession();
  await sessionPage.sendMessage('Hello');
});
```

### Handling Optional Elements

```typescript
const button = await page.locator('[data-testid="button"]')
  .isVisible()
  .catch(() => false);

if (button) {
  await page.click('[data-testid="button"]');
}
```

### Waiting for Elements

```typescript
// Auto-wait (preferred)
await page.click('[data-testid="button"]');

// Explicit wait
await page.waitForSelector('[data-testid="result"]', { 
  state: 'visible',
  timeout: 5000 
});

// Wait for network idle
await page.waitForLoadState('networkidle');
```

### Network Simulation

```typescript
// Abort requests (network failure)
await page.route('**/api/chat', route => route.abort('failed'));

// Delay requests (slow network)
await page.route('**/api/**', async (route) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  await route.continue();
});

// Mock response
await page.route('**/api/chat', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Mocked' })
  });
});

// Clean up
await page.unroute('**/api/chat');
```

### Error Handling

```typescript
// Capture console errors
const errors: string[] = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(msg.text());
  }
});

// Check for errors at end
expect(errors.length).toBe(0);
```

### Authentication States

```typescript
// Check if authenticated
const isAuth = await page.locator('.cl-userButton')
  .isVisible()
  .catch(() => false);

if (!isAuth) {
  // Handle unauthenticated state
  return;
}

// Continue with authenticated test
```

## Debugging Tips

### Add Breakpoint

```typescript
test('debug this', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // Debugger stops here
  await page.click('[data-testid="button"]');
});
```

### Slow Down Execution

```typescript
test.use({ 
  launchOptions: { 
    slowMo: 1000 // 1 second delay between actions
  } 
});
```

### Take Screenshot

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### View Page Content

```typescript
console.log(await page.content());
```

### Check Element Visibility

```typescript
const isVisible = await page.locator('[data-testid="element"]')
  .isVisible()
  .catch(() => false);
console.log('Element visible:', isVisible);
```

## Selectors Priority

1. **Best**: `[data-testid="element-name"]`
2. **Good**: `[aria-label="Button Name"]`, `[role="button"]`
3. **OK**: `text="Button Label"`, `button:has-text("Click")`
4. **Avoid**: `.class-name`, `#id`, complex CSS selectors

## Test Data Fixtures

```typescript
import { 
  testUsers, 
  testMessages, 
  testMemoryData,
  generateTestEmail,
  generateSessionTitle 
} from './fixtures/test-data';

// Usage
await authPage.signIn(testUsers.validUser.email, testUsers.validUser.password);
await sessionPage.sendMessage(testMessages.greeting);
```

## Common Issues & Solutions

### Issue: Test times out
**Solution**: Increase timeout or add proper waits
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  await page.waitForSelector('[data-testid="element"]', { timeout: 30000 });
});
```

### Issue: Element not found
**Solution**: Check visibility state
```typescript
await page.waitForSelector('[data-testid="element"]', { 
  state: 'visible',
  timeout: 10000 
});
```

### Issue: Flaky test
**Solution**: Use proper waits instead of `waitForTimeout`
```typescript
// Bad
await page.waitForTimeout(2000);

// Good
await page.waitForSelector('[data-testid="result"]');
await page.waitForLoadState('networkidle');
```

### Issue: Clerk auth not working
**Solution**: Handle Clerk UI gracefully
```typescript
// Check if on sign-in page
if (page.url().includes('/sign-in')) {
  // Handle sign-in
} else {
  // Already authenticated
}
```

### Issue: Test passes locally but fails in CI
**Solution**: Ensure tests are isolated and don't depend on timing
```typescript
test.beforeEach(async ({ page }) => {
  // Clean state before each test
  await page.context().clearCookies();
  await page.goto('/');
});
```

## CI/CD Notes

- Tests run automatically on PR
- Only Chromium browser in CI
- 2 retries on failure
- Screenshots saved on failure
- Check "playwright-report" artifact for results

## Test Writing Checklist

- [ ] Test is independent and isolated
- [ ] Uses `data-testid` for stable selectors
- [ ] Proper waits (no arbitrary `waitForTimeout`)
- [ ] Handles both authenticated and unauthenticated states
- [ ] Includes meaningful assertions
- [ ] Has descriptive test name
- [ ] Cleans up after itself
- [ ] Documented if complex

## Resources

- Full guide: `docs/e2e-testing.md`
- Playwright docs: https://playwright.dev/
- Test results: Check `playwright-report/` after run
- CI artifacts: GitHub Actions → Playwright Report

## Getting Help

1. Read full documentation: `docs/e2e-testing.md`
2. Check existing test examples
3. Use UI mode to debug: `npm run test:e2e:ui`
4. Ask team in #testing channel
