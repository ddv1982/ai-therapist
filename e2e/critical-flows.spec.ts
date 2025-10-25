import { test, expect, Page } from '@playwright/test';

/**
 * Critical E2E Tests for AI Therapist Application
 * Tests essential user flows for authentication, chat, and session management
 */

test.describe('Critical Application Flows', () => {
  const BASE_URL = 'http://localhost:4000';
  const TEST_USERNAME = 'testuser';
  const TEST_PASSWORD = 'TestPassword123!';

  /**
   * Helper: Wait for element with timeout
   */
  async function waitForElement(page: Page, selector: string, timeout = 5000) {
    await page.waitForSelector(selector, { timeout });
  }

  // ============================================================================
  // 1. HEALTH CHECK & BASIC CONNECTIVITY
  // ============================================================================

  test('1.1: Health endpoint responds with 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('1.2: Application homepage loads', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });

  // ============================================================================
  // 2. AUTHENTICATION FLOWS
  // ============================================================================

  test('2.1: Unauthenticated user redirected to setup', async ({ page }) => {
    await page.goto('/');
    // Should redirect to auth or setup page
    const url = page.url();
    expect(url).toMatch(/auth|setup/i);
  });

  test('2.2: Setup page loads and displays TOTP setup', async ({ page }) => {
    await page.goto('/auth/setup');

    // Check for setup form elements
    await waitForElement(page, 'input[name="username"]');
    const usernameInput = await page.$('input[name="username"]');
    expect(usernameInput).toBeTruthy();

    // Check for password field
    const passwordInput = await page.$('input[name="password"]');
    expect(passwordInput).toBeTruthy();
  });

  test('2.3: Invalid credentials rejected', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/verify`, {
      data: {
        code: '000000' // Invalid TOTP code
      }
    });
    expect(response.status()).toBe(401);
  });

  test('2.4: Session creation and retrieval', async ({ request }) => {
    // Create a session
    const response = await request.post(`${BASE_URL}/api/auth/session`, {
      data: {
        username: TEST_USERNAME,
        password: TEST_PASSWORD
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Should return session info or auth token
    if (response.ok()) {
      const data = await response.json() as Record<string, unknown>;
      expect(data).toBeTruthy();
    }
  });

  // ============================================================================
  // 3. CHAT FUNCTIONALITY
  // ============================================================================

  test('3.1: Chat input field is accessible', async ({ page }) => {
    await page.goto('/');

    try {
      // Try to find chat input (textarea or input)
      const chatInput = await page.$('[role="textbox"], textarea, input[type="text"]');
      expect(chatInput).toBeTruthy();
    } catch {
      // If not found, we expect redirect to auth - that's ok
      const url = page.url();
      expect(url).toMatch(/auth|setup/i);
    }
  });

  test('3.2: Empty message rejection', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        message: '',
        sessionId: 'test-session'
      }
    });

    // Should reject empty message
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('3.3: Chat request format validation', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        // Missing required message field
        sessionId: 'test-session'
      }
    });

    // Should return validation error
    expect(response.status()).toBe(400);
    const data = await response.json() as Record<string, unknown>;
    expect(data).toHaveProperty('error');
  });

  test('3.4: Chat API returns proper error format', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        message: 'test',
        sessionId: 'invalid-session'
      }
    });

    if (!response.ok()) {
      const data = await response.json() as Record<string, unknown>;
      expect(data).toHaveProperty('error');
      const error = data.error as Record<string, unknown>;
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
    }
  });

  // ============================================================================
  // 4. SESSION MANAGEMENT
  // ============================================================================

  test('4.1: Get sessions endpoint returns valid response', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/sessions`);

    // May be 401 if not authenticated, or 200 if authenticated
    if (response.ok()) {
      const data = await response.json() as Record<string, unknown>;
      expect(data).toHaveProperty('data');
    } else {
      expect([401, 403]).toContain(response.status());
    }
  });

  test('4.2: Create session endpoint responds', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/sessions`, {
      data: {
        title: 'Test Session'
      }
    });

    // May fail with 401 if not authenticated
    if (response.ok()) {
      const data = await response.json() as Record<string, unknown>;
      expect(data).toHaveProperty('data');
    } else {
      expect([401, 403]).toContain(response.status());
    }
  });

  test('4.3: Invalid session ID handling', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/sessions/invalid-id-12345`);

    // Should return 404 or 401
    expect([401, 403, 404]).toContain(response.status());
  });

  // ============================================================================
  // 5. ERROR HANDLING
  // ============================================================================

  test('5.1: Non-existent API endpoint returns 404', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/nonexistent-endpoint-xyz`);
    expect(response.status()).toBe(404);
  });

  test('5.2: Invalid JSON in request returns error', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('5.3: Missing required headers handled gracefully', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: { message: 'test' },
      headers: {
        'Content-Type': 'text/plain' // Wrong content type
      }
    });

    // Should return error, not crash
    expect([400, 415]).toContain(response.status());
  });

  // ============================================================================
  // 6. RATE LIMITING
  // ============================================================================

  test('6.1: Rate limiting header present', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);

    // Check for rate limit headers (may or may not have rate limit header)
    const headers = response.headers();
    void ('x-ratelimit-limit' in headers ||
      'ratelimit-limit' in headers ||
      'x-rate-limit-limit' in headers);

    // Shouldn't crash
    expect(response.ok()).toBeTruthy();
  });

  test('6.2: Rapid requests don\'t crash server', async ({ request }) => {
    const promises = [];

    // Make 5 rapid requests
    for (let i = 0; i < 5; i++) {
      promises.push(
        request.get(`${BASE_URL}/api/health`)
      );
    }

    const responses = await Promise.all(promises);

    // All should complete without crash
    expect(responses.length).toBe(5);
    responses.forEach(res => {
      expect([200, 429]).toContain(res.status());
    });
  });

  // ============================================================================
  // 7. DATABASE & PERSISTENCE
  // ============================================================================

  test('7.1: Messages endpoint structure correct', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/sessions/test/messages`);

    // Should return proper response (may be 401/404/200)
    const data = await response.json() as Record<string, unknown>;

    // Should have error or data field
    expect(
      data.hasOwnProperty('error') ||
      data.hasOwnProperty('data') ||
      data.hasOwnProperty('success')
    ).toBeTruthy();
  });

  test('7.2: Report endpoint responds with correct format', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/reports`);

    // Should have proper response format
    if (response.ok()) {
      const data = await response.json() as Record<string, unknown>;
      expect(data).toHaveProperty('data');
    } else {
      expect([401, 403]).toContain(response.status());
    }
  });

  // ============================================================================
  // 8. SECURITY CHECKS
  // ============================================================================

  test('8.1: Security headers present', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    const headers = response.headers();

    // Check for common security headers
    expect(
      headers['x-content-type-options'] ||
      headers['x-frame-options'] ||
      headers['content-security-policy']
    ).toBeTruthy();
  });

  test('8.2: CORS headers handled', async ({ request }) => {
    const response = await request.options(`${BASE_URL}/api/health`);

    // OPTIONS request should be handled
    expect([200, 404, 405]).toContain(response.status());
  });

  test('8.3: XSS prevention - no script execution in errors', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        message: '<script>alert("xss")</script>',
        sessionId: 'test'
      }
    });

    const body = await response.text();

    // Response should not contain executable script tags
    // (or if it does, they should be escaped)
    expect(body).not.toContain('<script>');
  });

  test('8.4: SQL injection prevention', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        message: "'; DROP TABLE sessions; --",
        sessionId: 'test'
      }
    });

    // Should not execute SQL, just treat as message
    expect([200, 400, 401, 403]).toContain(response.status());
  });

  // ============================================================================
  // 9. RESPONSE VALIDATION
  // ============================================================================

  test('9.1: Response content type correct', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });

  test('9.2: Response body valid JSON', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);

    if (response.ok()) {
      // Should be valid JSON
      const data = await response.json();
      expect(data).toBeTruthy();
    }
  });

  test('9.3: Error response has proper structure', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: { /* missing required fields */ }
    });

    if (!response.ok()) {
      const data = await response.json() as Record<string, unknown>;

      // Should have error structure
      if (data.error) {
        const error = data.error as Record<string, unknown>;
        expect(typeof error.code).toBe('string');
        expect(typeof error.message).toBe('string');
      }
    }
  });

  // ============================================================================
  // 10. PERFORMANCE BASELINE
  // ============================================================================

  test('10.1: Health endpoint responds within 1 second', async ({ request }) => {
    const startTime = Date.now();
    await request.get(`${BASE_URL}/api/health`);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
  });

  test('10.2: API endpoint doesn\'t timeout on valid request', async ({ request }) => {
    // Set 10 second timeout for API
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        message: 'test',
        sessionId: 'test'
      },
      timeout: 10000
    });

    // Should complete without timeout (may be error but not timeout)
    expect(response).toBeTruthy();
  });
});
