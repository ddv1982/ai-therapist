import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/__tests__/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/e2e/'],
  collectCoverageFrom: [
    // ============================================
    // INCLUDED PATHS
    // ============================================

    // Core business logic (server-side libraries)
    'src/lib/**/*.{ts,tsx}',

    // ============================================
    // INFRASTRUCTURE EXCLUSIONS (low ROI or tested separately)
    // ============================================

    // Caching infrastructure - browser-only utilities, tested via integration tests
    '!src/lib/cache/**',

    // Client-side encryption - browser-only Web Crypto API, requires browser environment
    '!src/lib/encryption/client-crypto.ts',

    // External API client - thin wrapper around Groq API, tested via E2E
    '!src/lib/api/groq-client.ts',

    // Logger utility - environment-dependent logging with side effects
    '!src/lib/utils/logger.ts',

    // Encryption utilities - requires ENCRYPTION_KEY environment variable; tested indirectly via crypto-secure.test.ts
    '!src/lib/auth/crypto-utils.ts',

    // ============================================
    // STANDARD EXCLUSIONS (boilerplate / test files)
    // ============================================

    // Next.js app routes (integration/E2E tested separately)
    '!src/app/**',

    // Type definitions
    '!**/*.d.ts',

    // Dependencies
    '!**/node_modules/**',

    // Test files
    '!src/**/*.test.{ts,tsx}',
    '!__tests__/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Emit JSON summary so QA can print a concise final line after E2E
  coverageReporters: ['text', 'lcov', 'json-summary'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@convex/(.*)$': '<rootDir>/convex/$1',
    '^@tests/(.*)$': '<rootDir>/__tests__/$1',
    // Mock static assets
    '\\.(css|less|sass|scss|png|jpg|jpeg|gif|webp|svg)$': 'identity-obj-proxy',
    '^next-intl$': '<rootDir>/__tests__/__mocks__/next-intl.js',
    '^next-intl/routing$': '<rootDir>/__tests__/__mocks__/next-intl.js',
    '^@ai-sdk/rsc$': '<rootDir>/__tests__/__mocks__/@ai-sdk/rsc.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jspdf|canvas|@ai-sdk|ai|streamdown|react-markdown|remark-gfm|vfile|unist-util-.*|bail|is-plain-obj|@clerk))',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  // Performance optimizations
  maxWorkers: '50%', // Use 50% of CPU cores for parallel testing
  testTimeout: 10000, // 10 second timeout for individual tests
  detectOpenHandles: false, // Disabled by default for CI/QA; enable locally for memory leak debugging

  // Test organization and filtering
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
  ],

  // Optimized test execution
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
