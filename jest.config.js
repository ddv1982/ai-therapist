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
    // Focus coverage on server logic, libs, and store where tests exist
    'src/lib/**/*.{ts,tsx}',
    'src/store/**/*.{ts,tsx}',
    // Exclude Next.js app routes (integration tested separately)
    '!src/app/**',
    // Exclude low-ROI or unimplemented files from coverage calculation
    '!src/lib/index.ts',
    '!src/lib/design-tokens.ts',
    '!src/lib/model-utils.ts',
    '!src/lib/theme-context.ts',
    '!src/lib/therapy/use-cbt-chat-bridge.ts',
    '!src/lib/therapy/cbt-data-parser.ts',
    '!src/lib/utils/performance-utils.tsx',
    '!src/lib/utils/logger.ts',
    '!src/lib/utils/error-utils.ts',
    '!src/lib/utils/error-reporter.ts',
    '!src/lib/api/with-route.ts',
    '!src/lib/api/groq-client.ts',
    '!src/lib/auth/crypto-utils.ts',
    '!src/lib/reports/fallback-analysis.ts',
    '!src/lib/chat/message-encryption.ts',
    '!src/lib/chat/session-service.ts',
    '!src/lib/chat/title-generator.ts',
    '!src/lib/auth/device-fingerprint.ts',
    '!src/lib/therapy/index.ts',
    '!src/store/index.ts',
    '!src/store/slices/chat-api.ts',
    '!src/lib/utils/cbt-draft-utils.ts',
    '!src/lib/cbt/export-utils.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!src/**/*.test.{ts,tsx}',
    '!__tests__/**/*',
    // Exclusions for infrastructure or browser-only utilities not under test
    '!src/lib/cache/**',
    '!src/lib/database/**',
    '!src/lib/encryption/client-crypto.ts',
    '!src/lib/ui/react-markdown-processor.tsx',
    '!src/lib/utils/graceful-degradation.ts',
    '!src/lib/utils/request-deduplication.ts',
    '!src/lib/utils/storage-management.ts',
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
    // Mock static assets
    '\\.(css|less|sass|scss|png|jpg|jpeg|gif|webp|svg)$': 'identity-obj-proxy',
    '^next-intl$': '<rootDir>/__tests__/__mocks__/next-intl.js',
    '^next-intl/routing$': '<rootDir>/__tests__/__mocks__/next-intl.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jspdf|canvas|@ai-sdk|ai|streamdown|react-markdown|remark-gfm|vfile|unist-util-.*|bail|is-plain-obj|uuid|@clerk))',
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
