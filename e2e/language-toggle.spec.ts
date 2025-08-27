// Add Playwright test for language toggle behavior
import { test, expect } from '@playwright/test';

const languageCookieName = 'NEXT_LOCALE';

async function getCookie(page: any, name: string) {
  const cookies = await page.context().cookies();
  return cookies.find((c: any) => c.name === name);
}

test.describe('Language toggle', () => {
  test('switches from English to Dutch and persists via cookie', async ({ page }) => {
    await page.goto('/');

    // Expect English label present initially
    await expect(page.getByText('AI Settings')).toBeVisible();

    // Open sidebar if hidden (mobile). Toggle button exists in header to close; ensure sidebar visible by reloading root
    // Click NL on the compact language toggle
    const nlButton = page.getByRole('button', { name: /Nederlands|Switch language to Nederlands/ });
    await expect(nlButton).toBeVisible();
    await nlButton.click();

    // The page should refresh and labels should be in Dutch
    await expect(page.getByText('AI-instellingen')).toBeVisible({ timeout: 5000 });

    // Cookie should be set
    const cookie = await getCookie(page, languageCookieName);
    expect(cookie?.value).toBe('nl');

    // Reload and verify it sticks
    await page.reload();
    await expect(page.getByText('AI-instellingen')).toBeVisible();
  });
});
