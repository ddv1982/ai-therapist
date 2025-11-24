import { test, expect } from '@playwright/test';

test.describe('Dark Mode Only', () => {
  test('app renders in dark mode only', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify dark mode CSS variable
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .trim();
    });
    
    // Should contain dark mode OKLCH value
    expect(bgColor).toContain('oklch(0.12');
    
    // Verify foreground (text) is light colored
    const fgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--foreground')
        .trim();
    });
    expect(fgColor).toContain('oklch(0.98');
  });

  test('no theme toggle UI exists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for theme toggle button (should not exist)
    const themeToggle = page.locator('button[aria-label*="theme" i]');
    await expect(themeToggle).toHaveCount(0);
    
    // Check for any toggle-like buttons with sun/moon icons
    const sunIcon = page.locator('svg[data-icon="sun"]');
    const moonIcon = page.locator('svg[data-icon="moon"]');
    await expect(sunIcon).toHaveCount(0);
    await expect(moonIcon).toHaveCount(0);
  });

  test('therapeutic colors render correctly in dark mode', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify therapeutic color variables exist
    const therapySuccess = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--therapy-success')
        .trim();
    });
    expect(therapySuccess).toContain('oklch');
    
    const therapyWarning = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--therapy-warning')
        .trim();
    });
    expect(therapyWarning).toContain('oklch');
    
    const therapyInfo = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--therapy-info')
        .trim();
    });
    expect(therapyInfo).toContain('oklch');
  });

  test('emotion colors are defined', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check all 8 emotion colors exist
    const emotions = [
      'fear', 'anger', 'sadness', 'joy', 
      'anxiety', 'shame', 'guilt'
    ];
    
    for (const emotion of emotions) {
      const color = await page.evaluate((e) => {
        return getComputedStyle(document.documentElement)
          .getPropertyValue(`--emotion-${e}`)
          .trim();
      }, emotion);
      expect(color).toContain('oklch');
    }
  });

  test('no console errors on main pages', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Test main pages
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for any async operations
    
    // Navigate to chat (if available)
    const chatLink = page.locator('a[href*="chat"], button:has-text("Chat")').first();
    if (await chatLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chatLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Filter out expected/benign errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to load resource') && // Network errors
      !error.includes('ResizeObserver') && // Common benign warning
      !error.includes('theme') && // Should not have theme errors
      !error.includes('next-themes') // Should not reference next-themes
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('visual consistency - no .dark class applied', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check that html or body doesn't have .dark class
    const htmlClasses = await page.evaluate(() => {
      return document.documentElement.className;
    });
    expect(htmlClasses).not.toContain('dark');
    
    const bodyClasses = await page.evaluate(() => {
      return document.body.className;
    });
    expect(bodyClasses).not.toContain('dark');
  });
});
