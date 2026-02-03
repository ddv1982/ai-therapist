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

// Global test configuration message
console.log('🧪 Unified Test Architecture Loaded - 23 optimization patterns active');

// Mock Clerk modules for api-auth.ts
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(() =>
    Promise.resolve({
      userId: 'test-user-id',
      sessionId: 'test-session-id',
      getToken: jest.fn(),
    })
  ),
}));

// Mock Clerk client hooks/components used in client code
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isLoaded: true, userId: 'test-user-id' }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  // Minimal stubs for components that might be imported in tests
  SignIn: () => null,
  SignUp: () => null,
  UserButton: () => null,
  UserProfile: () => null,
}));
