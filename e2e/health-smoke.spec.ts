import { test, expect } from '@playwright/test';

test.describe('Health smoke checks (unauthenticated)', () => {
  const BASE = 'http://localhost:4000';

  test('GET /api/health returns 200 JSON', async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    expect(res.ok()).toBeTruthy();
    const contentType = res.headers()['content-type'] || '';
    expect(contentType.toLowerCase()).toContain('application/json');
  });

  test('Root route responds (HTML)', async ({ page }) => {
    const res = await page.goto(`${BASE}`);
    expect(res?.ok()).toBeTruthy();
  });
});


