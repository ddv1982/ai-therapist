const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!lib/**/*.test.{ts,tsx}',
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
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock static assets
    '\\.(css|less|sass|scss|png|jpg|jpeg|gif|webp|svg)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-gfm|micromark|decode-named-character-reference|character-entities|unist-util-stringify-position|unified|bail|is-plain-obj|trough|vfile|unist-util-is|zwitch|longest-streak|mdast-util-to-markdown|mdast-util-phrasing|mdast-util-list-item-indent|mdast-util-to-string|micromark-util-sanitize-uri|micromark-util-encode|micromark-util-decode-string|micromark-extension-gfm|micromark-util-combine-extensions|micromark-extension-gfm-table|micromark-extension-gfm-strikethrough|micromark-extension-gfm-task-list-item|micromark-extension-gfm-autolink-literal|micromark-util-classify-character|micromark-util-resolve-all|micromark-util-subtokenize|micromark-util-chunked|micromark-util-decode-numeric-character-reference|mdast-util-from-markdown|mdast-util-gfm|mdast-util-gfm-table|mdast-util-gfm-strikethrough|mdast-util-gfm-task-list-item|mdast-util-gfm-autolink-literal)/)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)