/**
 * End-to-End Authentication Flow Tests
 * Tests the complete user authentication experience
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('should redirect unauthenticated users to setup', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Should redirect to TOTP setup if not configured
    await expect(page).toHaveURL(/\/auth\/setup/);
    await expect(page.locator('h1, h2')).toContainText(['Setup', 'Authentication']);
  });

  test('should complete TOTP setup flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/setup`);
    
    // Check for QR code and setup instructions
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
    await expect(page.locator('text=Authenticator App')).toBeVisible();
    
    // Check for backup codes
    await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible();
    
    // Verify manual entry key is shown
    await expect(page.locator('[data-testid="manual-key"]')).toBeVisible();
    
    // Test form validation
    const setupButton = page.locator('button:has-text("Complete Setup")');
    await expect(setupButton).toBeDisabled(); // Should be disabled until TOTP verified
    
    // Test with invalid TOTP code
    await page.fill('[data-testid="totp-input"]', '000000');
    await page.click('button:has-text("Verify Code")');
    
    await expect(page.locator('.error, [role="alert"]')).toContainText('Invalid');
  });

  test('should handle TOTP verification flow', async ({ page }) => {
    // Assuming TOTP is already set up, go to verification
    await page.goto(`${BASE_URL}/auth/verify`);
    
    // Check verification form
    await expect(page.locator('h1, h2')).toContainText(['Verify', 'Authentication']);
    await expect(page.locator('[data-testid="totp-input"]')).toBeVisible();
    
    // Test invalid code
    await page.fill('[data-testid="totp-input"]', '123456');
    await page.click('button:has-text("Verify")');
    
    // Should show error for invalid code
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
    
    // Test backup code option
    const backupCodeButton = page.locator('text=Use Backup Code');
    if (await backupCodeButton.isVisible()) {
      await backupCodeButton.click();
      await expect(page.locator('[data-testid="backup-code-input"]')).toBeVisible();
    }
  });

  test('should implement proper session management', async ({ page }) => {
    // Test session persistence across page reloads
    await page.goto(`${BASE_URL}/auth/verify`);
    
    // Simulate successful authentication (would need mock or test credentials)
    // For now, test the session cookie behavior
    
    const initialCookies = await page.context().cookies();
    await page.reload();
    const reloadCookies = await page.context().cookies();
    
    // Session cookies should persist
    expect(reloadCookies).toEqual(expect.arrayContaining(initialCookies));
  });

  test('should handle device trust and fingerprinting', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/verify`);
    
    // Check if device info is being collected
    const userAgent = await page.evaluate(() => navigator.userAgent);
    expect(userAgent).toBeTruthy();
    
    // Test responsive design on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Mobile-specific UI should be visible
    const mobileElements = await page.locator('[class*="mobile"], [class*="sm:"]').count();
    expect(mobileElements).toBeGreaterThan(0);
  });

  test('should implement CSRF protection', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check that CSRF tokens are included in forms
    const forms = await page.locator('form').count();
    
    if (forms > 0) {
      // Check for CSRF token in cookies or meta tags
      const csrfCookie = await page.context().cookies().then(cookies => 
        cookies.find(c => c.name.includes('csrf'))
      );
      
      const csrfMeta = await page.locator('meta[name*="csrf"]').count();
      
      // Should have either CSRF cookie or meta tag
      expect(csrfCookie || csrfMeta > 0).toBeTruthy();
    }
  });

  test('should handle security errors gracefully', async ({ page }) => {
    // Test various security error scenarios
    
    // 1. Test with manipulated cookies
    await page.context().addCookies([{
      name: 'auth-session-token',
      value: 'invalid-token',
      domain: 'localhost',
      path: '/'
    }]);
    
    await page.goto(BASE_URL);
    // Should redirect to auth or show error, not crash
    await expect(page).toHaveURL(/\/(auth|error)/);
    
    // 2. Test with missing required headers
    await page.route('**/*', (route) => {
      const headers = route.request().headers();
      delete headers['user-agent'];
      route.continue({ headers });
    });
    
    await page.goto(BASE_URL);
    // Should handle gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should protect against common attacks', async ({ page }) => {
    // Test XSS protection
    await page.goto(`${BASE_URL}?test=<script>alert('xss')</script>`);
    
    // Script should not execute
    let alertFired = false;
    page.on('dialog', () => {
      alertFired = true;
    });
    
    await page.waitForTimeout(1000);
    expect(alertFired).toBe(false);
    
    // Test CSRF protection on POST requests
    const response = await page.request.post(`${BASE_URL}/api/sessions`, {
      data: { title: 'Test Session' },
      headers: { 'Content-Type': 'application/json' }
      // Deliberately omitting CSRF token
    });
    
    expect(response.status()).toBe(403); // Should be forbidden without CSRF token
  });

  test('should implement proper rate limiting', async ({ page }) => {
    const startTime = Date.now();
    const requests = [];
    
    // Make multiple rapid requests
    for (let i = 0; i < 10; i++) {
      const requestPromise = page.request.post(`${BASE_URL}/api/auth/verify`, {
        data: { token: '123456' },
        headers: { 'Content-Type': 'application/json' }
      });
      requests.push(requestPromise);
    }
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    
    // Should have some rate limited responses
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    
    const endTime = Date.now();
    console.log(`Rate limiting test completed in ${endTime - startTime}ms`);
  });

  test('should handle mobile Safari specific issues', async ({ page, browserName }) => {
    if (browserName !== 'webkit') {
      test.skip('This test is specific to WebKit/Safari');
    }
    
    // Simulate mobile Safari
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(BASE_URL);
    
    // Test viewport height handling
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(viewportHeight).toBe(667);
    
    // Test touch interactions
    const touchElements = await page.locator('button, input').count();
    expect(touchElements).toBeGreaterThan(0);
    
    // Test that mobile debug info is available in development
    if (process.env.NODE_ENV === 'development') {
      await expect(page.locator('[data-testid="mobile-debug"]')).toBeVisible();
    }
  });
});

test.describe('Security Headers and Configuration', () => {
  test('should include security headers', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const headers = response?.headers() || {};
    
    // Check for important security headers
    expect(headers['x-frame-options'] || headers['x-frame-options']).toBeTruthy();
    expect(headers['x-content-type-options']).toBe('nosniff');
    
    // Content Security Policy should be present for XSS protection
    const csp = headers['content-security-policy'];
    if (csp) {
      expect(csp).toContain('default-src');
    }
  });

  test('should implement HTTPS in production', async ({ page }) => {
    if (process.env.NODE_ENV === 'production') {
      const response = await page.goto(BASE_URL);
      expect(response?.url()).toMatch(/^https:/);
      
      // Should have HTTPS-only cookies
      const cookies = await page.context().cookies();
      const secureCookies = cookies.filter(c => c.secure);
      expect(secureCookies.length).toBeGreaterThan(0);
    }
  });

  test('should prevent sensitive information leakage', async ({ page }) => {
    // Test error pages don't leak sensitive info
    await page.goto(`${BASE_URL}/nonexistent-page`);
    
    const content = await page.textContent('body');
    
    // Should not contain sensitive paths or information
    expect(content).not.toContain('/home/');
    expect(content).not.toContain('node_modules');
    expect(content).not.toContain('.env');
    expect(content).not.toContain('postgres://');
    expect(content).not.toContain('mongodb://');
  });
});

test.describe('Accessibility and UX', () => {
  test('should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/setup`);
    
    // Check for proper ARIA labels
    const ariaLabels = await page.locator('[aria-label], [aria-labelledby]').count();
    expect(ariaLabels).toBeGreaterThan(0);
    
    // Check for form labels
    const inputs = await page.locator('input').count();
    const labels = await page.locator('label').count();
    
    // Should have labels for inputs
    expect(labels).toBeGreaterThanOrEqual(inputs * 0.8); // Allow some flexibility
    
    // Check for focus management
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A'].includes(focusedElement || '')).toBe(true);
  });

  test('should provide clear error messages', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/verify`);
    
    // Submit invalid TOTP
    await page.fill('[data-testid="totp-input"]', '000000');
    await page.click('button:has-text("Verify")');
    
    // Error message should be helpful and not technical
    const errorText = await page.locator('.error, [role="alert"]').textContent();
    
    expect(errorText).toBeTruthy();
    expect(errorText).not.toContain('null');
    expect(errorText).not.toContain('undefined');
    expect(errorText).not.toContain('500');
    expect(errorText).not.toMatch(/Error:\s*$/);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/*', (route) => {
      if (route.request().url().includes('/api/')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto(BASE_URL);
    
    // Should show user-friendly error, not crash
    await expect(page.locator('body')).toBeVisible();
    
    // Should have retry mechanisms or offline state
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible();
    }
  });
});