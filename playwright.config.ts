import { defineConfig, devices } from '@playwright/test';

const convexCommand = process.env.PLAYWRIGHT_CONVEX_COMMAND ?? 'npx convex dev';
const rawClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const usesTestClerkKey = rawClerkKey.startsWith('pk_test_');
const resolvedWebCommand =
  process.env.PLAYWRIGHT_WEB_COMMAND ??
  (usesTestClerkKey ? 'npm run dev:local' : 'npm run start:local');
const shouldStartConvex = process.env.PLAYWRIGHT_SKIP_CONVEX !== 'true';

const convexServer = {
  // Start Convex backend first - required for API routes that use ConvexHttpClient
  command: convexCommand,
  url: 'http://127.0.0.1:3210',
  reuseExistingServer: true,
  stdout: 'pipe',
  stderr: 'pipe',
  timeout: 30_000,
} as const;

const nextServer = {
  // Start Next.js server after optional Convex boot completes
  command: resolvedWebCommand,
  // Wait for health endpoint to be ready instead of the home page
  url: 'http://localhost:4000/api/health',
  reuseExistingServer: true,
  stdout: 'pipe',
  // Pipe stderr for diagnostics if server fails to start
  stderr: 'pipe',
  // Allow a bit more time for Next dev server cold start under CI
  timeout: 180_000,
  // Suppress noisy Node deprecation warnings in QA E2E by default; allow opt-in tracing
  env: {
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + ' ' : ''}${process.env.DEPRECATIONS === 'trace' ? '--trace-deprecation' : '--no-deprecation'}`,
  },
} as const;

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* In CI without Convex, only run health-smoke tests */
  testMatch: process.env.CI ? 'health-smoke.spec.ts' : '**/*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
      ],

  /* Run your local dev server before starting the tests */
  webServer: shouldStartConvex ? [convexServer, nextServer] : [nextServer],
});
