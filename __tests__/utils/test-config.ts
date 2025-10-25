/**
 * Unified Test Configuration and Setup
 * Provides consistent Jest configuration and global test utilities
 * 
 * Features:
 * - Global mock configurations
 * - Performance monitoring setup
 * - Test environment standardization
 * - Custom matchers for therapeutic testing
 * - Automated test cleanup
 */

import '@testing-library/jest-dom';
import { configure, type Config } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';
import { MockFactory, TestSetupUtils } from './test-utilities';

// =============================================================================
// GLOBAL TEST ENVIRONMENT SETUP
// =============================================================================

/**
 * Configure Testing Library for optimal performance
 */
type ExtendedTestingLibraryConfig = Config & {
  asyncUtilTimeout?: number;
  computedStyleSupportsPseudoElements?: boolean;
};

const testingLibraryConfig: Partial<ExtendedTestingLibraryConfig> = {
  // Increase timeout for complex therapeutic components
  asyncUtilTimeout: 5000,
  // Configure for better debugging
  computedStyleSupportsPseudoElements: true,
};

configure(testingLibraryConfig as unknown as Partial<Config>);

/**
 * Polyfill required APIs for Node.js test environment
 */
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// Mock performance API for Node.js
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    },
  } as any;
}

// Mock crypto API for secure random generation tests
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: jest.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  } as any;
}

// =============================================================================
// GLOBAL MOCK CONFIGURATIONS
// =============================================================================

/**
 * Global mock setup for commonly used modules
 * Applied automatically across all test files
 */
export function setupGlobalMocks() {
  
  // Mock Next.js router
  jest.mock('next/router', () => ({
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      pathname: '/test-path',
      query: {},
      asPath: '/test-path',
    })),
  }));

  // Mock Next.js navigation (App Router)
  jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    })),
    usePathname: jest.fn(() => '/test-path'),
    useSearchParams: jest.fn(() => new URLSearchParams()),
  }));

  // Mock Lucide React icons globally
  jest.mock('lucide-react', () => MockFactory.createLucideIconMocks());

  // Note: react-markdown mock removed as package is not installed

  // Mock Inter font
  jest.mock('next/font/google', () => ({
    Inter: jest.fn(() => ({
      className: 'mock-inter-font',
    })),
  }));

  // Mock environment variables
  Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
  process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-32-characters-long!!!!';
}

// =============================================================================
// CUSTOM JEST MATCHERS
// =============================================================================

/**
 * Custom matchers for therapeutic AI testing
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidCBTData(): R;
      toHaveTherapeuticStructure(): R;
      toContainSecureToken(): R;
      toBeWithinEmotionRange(): R;
      toHaveProperTableStructure(): R;
    }
  }
}

expect.extend({
  /**
   * Validates CBT diary data structure
   */
  toBeValidCBTData(received: any) {
    const requiredFields = [
      'situation', 
      'initialEmotions', 
      'automaticThoughts',
      'coreBeliefText',
      'finalEmotions'
    ];

    const missingFields = requiredFields.filter(field => !received[field]);
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected valid CBT data but missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    // Validate emotion structure
    const emotionFields = ['fear', 'anger', 'sadness', 'joy', 'anxiety', 'shame', 'guilt'];
    const hasValidEmotions = emotionFields.every(emotion => 
      typeof received.initialEmotions[emotion] === 'number' &&
      received.initialEmotions[emotion] >= 0 &&
      received.initialEmotions[emotion] <= 10
    );

    if (!hasValidEmotions) {
      return {
        message: () => 'Expected emotions to be numbers between 0-10',
        pass: false,
      };
    }

    return {
      message: () => 'CBT data structure is valid',
      pass: true,
    };
  },

  /**
   * Validates therapeutic response structure
   */
  toHaveTherapeuticStructure(received: string) {
    const therapeuticPatterns = [
      /\*\*.*\*\*/, // Bold therapeutic headings
      /\|.*\|.*\|/, // Tables for structured data
      /^[-*]\s/, // Lists for recommendations
      /\d+\/10/, // Emotion ratings
    ];

    const hasTherapeuticElements = therapeuticPatterns.some(pattern => 
      pattern.test(received)
    );

    return {
      message: () => hasTherapeuticElements 
        ? 'Content has therapeutic structure'
        : 'Expected content to have therapeutic structure (tables, lists, ratings)',
      pass: hasTherapeuticElements,
    };
  },

  /**
   * Validates secure token format
   */
  toContainSecureToken(received: string) {
    const secureTokenPattern = /^[A-Za-z0-9+/]{32,}={0,2}$/; // Base64-like pattern, min 32 chars
    const isSecure = secureTokenPattern.test(received) && received.length >= 32;

    return {
      message: () => isSecure
        ? 'Token format is secure'
        : `Expected secure token format (32+ chars, alphanumeric), got: ${received}`,
      pass: isSecure,
    };
  },

  /**
   * Validates emotion rating ranges
   */
  toBeWithinEmotionRange(received: number) {
    const isValid = typeof received === 'number' && received >= 0 && received <= 10;

    return {
      message: () => isValid
        ? 'Emotion rating is within valid range'
        : `Expected emotion rating between 0-10, got: ${received}`,
      pass: isValid,
    };
  },

  /**
   * Validates therapeutic table structure
   */
  toHaveProperTableStructure(received: string) {
    const hasTable = received.includes('<table');
    const hasTherapeuticClass = received.includes('therapeutic-table');
    const hasResponsiveWrapper = received.includes('table-container');
    const hasMobileLabels = received.includes('data-label=');

    const isProperStructure = hasTable && hasTherapeuticClass && 
                             hasResponsiveWrapper && hasMobileLabels;

    return {
      message: () => isProperStructure
        ? 'Table has proper therapeutic structure'
        : 'Expected table with therapeutic classes, responsive wrapper, and mobile labels',
      pass: isProperStructure,
    };
  },
});

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Global performance monitoring for test suites
 */
export class TestPerformanceMonitor {
  private static testTimes = new Map<string, number>();
  private static slowTests: Array<{ name: string; duration: number }> = [];

  /**
   * Start monitoring a test suite
   */
  static startSuite(suiteName: string) {
    this.testTimes.set(suiteName, performance.now());
  }

  /**
   * End monitoring and log performance
   */
  static endSuite(suiteName: string) {
    const startTime = this.testTimes.get(suiteName);
    if (startTime) {
      const duration = performance.now() - startTime;
      
      if (duration > 5000) { // Log slow tests (>5 seconds)
        this.slowTests.push({ name: suiteName, duration });
        console.warn(`⚠️ Slow test suite: ${suiteName} took ${duration.toFixed(2)}ms`);
      }
      
      this.testTimes.delete(suiteName);
    }
  }

  /**
   * Get performance report
   */
  static getReport() {
    return {
      slowTests: this.slowTests.sort((a, b) => b.duration - a.duration),
      totalSlowTests: this.slowTests.length,
    };
  }

  /**
   * Reset monitoring data
   */
  static reset() {
    this.testTimes.clear();
    this.slowTests = [];
  }
}

// =============================================================================
// TEST DATA VALIDATION
// =============================================================================

/**
 * Validates test data integrity across test files
 */
export class TestDataValidator {
  
  /**
   * Validate therapeutic test data consistency
   */
  static validateTherapeuticData(data: any) {
    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // Check required therapeutic fields
    const requiredFields = ['situation', 'initialEmotions', 'automaticThoughts'];
    requiredFields.forEach(field => {
      if (!data[field]) {
        validationResults.errors.push(`Missing required field: ${field}`);
        validationResults.isValid = false;
      }
    });

    // Validate emotion progression (therapeutic improvement)
    if (data.initialEmotions && data.finalEmotions) {
      const negativeEmotions = ['fear', 'anger', 'sadness', 'anxiety', 'shame', 'guilt'];
      const hasImprovement = negativeEmotions.some(emotion => 
        data.finalEmotions[emotion] < data.initialEmotions[emotion]
      );

      if (!hasImprovement) {
        validationResults.warnings.push('No emotional improvement detected');
      }
    }

    // Validate automatic thoughts credibility
    if (data.automaticThoughts) {
      data.automaticThoughts.forEach((thought: any, index: number) => {
        if (!thought.credibility || thought.credibility < 0 || thought.credibility > 10) {
          validationResults.errors.push(`Invalid credibility for thought ${index + 1}`);
          validationResults.isValid = false;
        }
      });
    }

    return validationResults;
  }

  /**
   * Validate security test scenarios
   */
  static validateSecurityScenarios(scenarios: any) {
    const validationResults = {
      isValid: true,
      errors: [] as string[],
    };

    // Validate XSS vectors
    if (scenarios.xssVectors) {
      scenarios.xssVectors.forEach((vector: string, index: number) => {
        if (!vector.includes('<script') && !vector.includes('javascript:')) {
          validationResults.errors.push(`XSS vector ${index + 1} may not be effective`);
        }
      });
    }

    // Validate SQL injection vectors
    if (scenarios.sqlVectors) {
      scenarios.sqlVectors.forEach((vector: string, index: number) => {
        if (!vector.includes('DROP') && !vector.includes('UNION') && !vector.includes('OR ')) {
          validationResults.errors.push(`SQL injection vector ${index + 1} may not be effective`);
        }
      });
    }

    validationResults.isValid = validationResults.errors.length === 0;
    return validationResults;
  }
}

// =============================================================================
// AUTOMATED CLEANUP
// =============================================================================

/**
 * Global cleanup utilities
 */
export class TestCleanup {
  
  /**
   * Clean up after all tests
   */
  static globalCleanup() {
    // Clear all timers
    jest.clearAllTimers();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset performance monitoring
    TestPerformanceMonitor.reset();
    
    // Clear DOM
    document.body.innerHTML = '';
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset console methods
    jest.restoreAllMocks();
  }

  /**
   * Setup cleanup for specific test file
   */
  static setupFileCleanup(filename: string) {
    beforeEach(() => {
      TestPerformanceMonitor.startSuite(filename);
    });

    afterEach(() => {
      TestPerformanceMonitor.endSuite(filename);
    });

    afterAll(() => {
      this.globalCleanup();
    });
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize global test configuration
 */
export function initializeTestConfig() {
  setupGlobalMocks();
  TestSetupUtils.setupTestEnvironment();
  
  // Setup global cleanup
  afterAll(() => {
    TestCleanup.globalCleanup();
    
    // Log performance report
    const report = TestPerformanceMonitor.getReport();
    if (report.totalSlowTests > 0) {
      console.log('\n📊 Test Performance Report:');
      report.slowTests.forEach(test => {
        console.log(`   ${test.name}: ${test.duration.toFixed(2)}ms`);
      });
    }
  });
}

// Auto-initialize when imported
initializeTestConfig();

// =============================================================================
// EXPORTS - Functions are already exported above
// =============================================================================
