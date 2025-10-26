/**
 * Global Jest Setup File
 * Automatically integrates unified test utilities across all test files
 * 
 * This setup file:
 * - Imports unified test configuration
 * - Sets up global mocks and utilities
 * - Configures performance monitoring
 * - Provides consistent test environment
 */

// Import unified test configuration (auto-initializes)
import './utils/test-config';

// Export utilities for convenient imports in test files
export {
  MockFactory,
  TherapeuticDataFactory,
  ComponentTestUtils,
  SecurityTestUtils,
  PerformanceTestUtils,
  TestSetupUtils,
} from './utils/test-utilities';

export {
  ComponentTestTemplate,
  APITestTemplate,
} from './utils/test-templates';

export {
  TestPerformanceMonitor,
  TestDataValidator,
  TestCleanup,
} from './utils/test-config';

// Global test configuration message
console.log('🧪 Unified Test Architecture Loaded - 23 optimization patterns active');

// Mock uuid for tests
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

// Mock Clerk modules for api-auth.ts
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(() => Promise.resolve({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    getToken: jest.fn(),
  })),
}));

// Ensure X-Request-Id exists in tests for API middleware
if (typeof global.Headers !== 'undefined') {
  const OriginalHeaders = global.Headers;
  global.Headers = class TestHeaders extends OriginalHeaders {
    constructor(init?: HeadersInit) {
      super(init);
      if (!this.get('x-request-id')) {
        this.set('x-request-id', 'test-request');
      }
    }
  };
}
