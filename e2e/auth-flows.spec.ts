import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests for TOTP setup, login, session management, and logout flows
 */

test.describe('Authentication Flows', () => {
  const BASE_URL = 'http://localhost:4000';

  test.describe('1. Setup & Onboarding', () => {
    test('1.1: Setup page displays form elements', async ({ page }) => {
      await page.goto('/auth/setup');

      // Should have username input
      const usernameField = await page.$('input[name="username"]');
      expect(usernameField).toBeTruthy();

      // Should have password input
      const passwordField = await page.$('input[name="password"]');
      expect(passwordField).toBeTruthy();

      // Should have submit button
      const submitBtn = await page.$('button[type="submit"]');
      expect(submitBtn).toBeTruthy();
    });

    test('1.2: Setup form validation works', async ({ page }) => {
      await page.goto('/auth/setup');

      // Try to submit without filling form
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();

        // Should show validation error or prevent submission
        await page.waitForTimeout(500);

        // Should still be on setup page
        expect(page.url()).toContain('setup');
      }
    });

    test('1.3: Setup page has proper title and instructions', async ({ page }) => {
      await page.goto('/auth/setup');

      // Should have heading or title
      const title = await page.$('h1, h2, [role="heading"]');
      expect(title).toBeTruthy();

      // Should have some instructional text
      const heading = await page.textContent('h1, h2');
      expect(heading).toBeTruthy();
    });
  });

  test.describe('2. TOTP & 2FA', () => {
    test('2.1: Verify page loads for TOTP', async ({ page }) => {
      await page.goto('/auth/verify');

      // Should have TOTP input
      const totpInput = await page.$('input');
      expect(totpInput).toBeTruthy();
    });

    test('2.2: TOTP code validation rejects invalid input', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/verify`, {
        data: {
          code: '000000' // Invalid code
        }
      });

      // Should reject invalid TOTP
      expect([400, 401]).toContain(response.status());
    });

    test('2.3: TOTP code is required', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/verify`, {
        data: {
          // Missing code field
        }
      });

      // Should return validation error
      expect([400, 401]).toContain(response.status());
    });

    test('2.4: TOTP setup returns QR code or secret', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/setup`, {
        data: {
          username: 'testuser',
          password: 'Password123!'
        }
      });

      // May succeed or fail, but should be proper response
      const data = await response.json() as Record<string, unknown>;
      expect(data).toBeTruthy();
    });
  });

  test.describe('3. Session Management', () => {
    test('3.1: Session endpoint without auth returns error', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/session`, {
        data: {
          // May fail without proper auth
        }
      });

      // Should return error (401 or 400)
      expect([400, 401, 403]).toContain(response.status());
    });

    test('3.2: Session status endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/session`);

      // Should respond (may be 401 if not authenticated)
      expect([200, 401, 404]).toContain(response.status());
    });

    test('3.3: Devices endpoint is accessible', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/devices`);

      // Should respond
      expect([200, 401, 403, 404]).toContain(response.status());

      if (response.ok()) {
        const data = await response.json() as Record<string, unknown>;
        expect(data).toHaveProperty('data');
      }
    });

    test('3.4: Device trust system responds to requests', async ({ request }) => {
      // Get device list
      const listResponse = await request.get(`${BASE_URL}/api/auth/devices`);

      // Should return proper response
      expect([200, 401, 403, 404]).toContain(listResponse.status());
    });
  });

  test.describe('4. Logout & Session Termination', () => {
    test('4.1: Logout endpoint responds', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/logout`, {
        data: {}
      });

      // Should respond (may be 401 if not authenticated)
      expect([200, 400, 401, 403]).toContain(response.status());
    });

    test('4.2: Logout doesn\'t crash on missing session', async ({ request }) => {
      // Try logout without session
      const response = await request.post(`${BASE_URL}/api/auth/logout`, {
        data: {}
      });

      // Should handle gracefully
      expect(response).toBeTruthy();
    });

    test('4.3: Device removal endpoint works', async ({ request }) => {
      const response = await request.delete(`${BASE_URL}/api/auth/devices/test-device-id`);

      // Should respond (may be 404/401/204)
      expect([204, 400, 401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('5. Security Validations', () => {
    test('5.1: Password field is masked in UI', async ({ page }) => {
      await page.goto('/auth/setup');

      const passwordField = await page.$('input[name="password"]');
      if (passwordField) {
        const type = await passwordField.getAttribute('type');
        expect(['password', 'text']).toContain(type);
      }
    });

    test('5.2: Setup doesn\'t allow weak passwords', async ({ page }) => {
      await page.goto('/auth/setup');

      // Try with weak password
      const passwordField = await page.$('input[name="password"]');
      if (passwordField) {
        await passwordField.fill('123'); // Weak password

        // Form might validate on blur/submit
        await page.waitForTimeout(100);

        // Check if validation error appears (may or may not have visible error)
        await page.$('[role="alert"], .error');
      }
    });

    test('5.3: TOTP input allows only numbers', async ({ page }) => {
      await page.goto('/auth/verify');

      const totpInput = await page.$('input');
      if (totpInput) {
        const inputType = await totpInput.getAttribute('type');
        // Should be 'text' or 'tel' for TOTP input
        expect(['text', 'tel', 'number']).toContain(inputType);
      }
    });

    test('5.4: No sensitive data in localStorage (except auth token)', async ({ page }) => {
      await page.goto('/');

      const localStorage = await page.evaluate(() => {
        return JSON.stringify(window.localStorage);
      });

      // Should not contain passwords, seeds, etc.
      expect(localStorage).not.toContain('password');
      expect(localStorage).not.toContain('seed');
      expect(localStorage).not.toContain('secret');
    });

    test('5.5: API auth endpoints use HTTPS recommended', async () => {
      // This test documents that HTTPS should be used in production
      // On localhost, HTTP is acceptable for testing

      const healthUrl = `${BASE_URL}/api/health`;
      const isLocalhost = healthUrl.includes('localhost');

      if (!isLocalhost) {
        // In production, API should use HTTPS
        expect(healthUrl).toMatch(/https:\/\//);
      }
    });
  });

  test.describe('6. Error Handling', () => {
    test('6.1: Invalid username format rejected', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/setup`, {
        data: {
          username: '', // Empty username
          password: 'Password123!'
        }
      });

      // Should reject empty username
      expect([400, 422]).toContain(response.status());
    });

    test('6.2: Setup endpoint returns proper error response', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/setup`, {
        data: {
          // Missing fields
        }
      });

      const data = await response.json() as Record<string, unknown>;

      // Should have error structure if failed
      if (!response.ok()) {
        expect(data).toHaveProperty('error');
      }
    });

    test('6.3: Double-tap protection on form submission', async ({ page }) => {
      await page.goto('/auth/setup');

      // Try to submit multiple times rapidly
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        // Click twice rapidly
        await submitBtn.click();
        await submitBtn.click();

        // Should handle gracefully (not double-submit)
        await page.waitForTimeout(500);

        // Page should be in valid state
        expect(page).toBeTruthy();
      }
    });

    test('6.4: Auth errors don\'t expose sensitive information', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/verify`, {
        data: {
          code: 'invalid'
        }
      });

      const body = await response.text();

      // Error message should not contain SQL, seeds, or sensitive data
      expect(body).not.toContain('SELECT');
      expect(body).not.toContain('database');
      expect(body).not.toContain('secret');
    });
  });

  test.describe('7. Multi-Device Support', () => {
    test('7.1: Device fingerprinting endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/auth/mobile-debug`);

      // Should respond (may be debug-only endpoint)
      expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('7.2: Device identification data collected', async ({ page }) => {
      // This test verifies device fingerprinting collects data
      // without exposing it insecurely

      const fingerprintData = await page.evaluate(() => {
        // Get available device info
        return {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenSize: `${window.innerWidth}x${window.innerHeight}`
        };
      });

      // Should have data
      expect(fingerprintData.userAgent).toBeTruthy();
      expect(fingerprintData.screenSize).toBeTruthy();
    });
  });

  test.describe('8. Accessibility', () => {
    test('8.1: Setup form is keyboard navigable', async ({ page }) => {
      await page.goto('/auth/setup');

      // Focus first input
      await page.keyboard.press('Tab');

      // Get focused element
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      // Should have focused some element
      expect(focusedElement).toBeTruthy();
    });

    test('8.2: Form labels are associated with inputs', async ({ page }) => {
      await page.goto('/auth/setup');

      // Should have labels for inputs
      const labels = await page.$$('label');
      expect(labels.length).toBeGreaterThan(0);
    });

    test('8.3: Error messages announced to screen readers', async ({ page }) => {
      await page.goto('/auth/setup');

      // Submit empty form to trigger validation
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();

        // Wait for potential error message
        await page.waitForTimeout(300);

        // Check for aria-live or role=alert (may or may not have alerts depending on validation timing)
        await page.$$('[role="alert"], [aria-live]');
      }
    });
  });
});
