import { test, expect } from '@playwright/test';

test.describe('Chat dashboard sidebar', () => {
  test('toggles sidebar visibility on mobile breakpoint', async ({ page }) => {
    test.skip(!process.env.E2E_AUTH_EMAIL, 'Requires authenticated session to exercise dashboard');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.getByRole('navigation', { name: /chat sessions/i });
    await expect(sidebar).toBeVisible();

    await page.getByRole('button', { name: /close sidebar/i }).click();
    await expect(sidebar).toBeHidden();
  });
});
