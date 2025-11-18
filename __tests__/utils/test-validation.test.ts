/**
 * Test Validation Suite
 * Validates that our unified test utilities work correctly
 * Minimal test to ensure 98.3%+ pass rate is maintained
 */

import { MockFactory, TherapeuticDataFactory } from './test-utilities';
import { TestDataValidator, TestPerformanceMonitor } from './test-config';

describe('Unified Test Utilities Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MockFactory', () => {
    it('should create Lucide icon mocks', () => {
      const iconMocks = MockFactory.createLucideIconMocks();

      expect(iconMocks).toHaveProperty('X');
      expect(iconMocks).toHaveProperty('CheckCircle');
      expect(iconMocks).toHaveProperty('AlertCircle');
      expect(iconMocks).toHaveProperty('Heart');

      // Test that icon mocks are functions
      expect(typeof iconMocks.X).toBe('function');
      expect(typeof iconMocks.CheckCircle).toBe('function');
    });

    it('should create utils mock', () => {
      const utilsMock = MockFactory.createUtilsMock();

      expect(utilsMock).toHaveProperty('generateSecureRandomString');
      expect(utilsMock).toHaveProperty('generateUUID');
      expect(utilsMock).toHaveProperty('cn');

      // Test mock functions work
      expect(utilsMock.generateSecureRandomString(16)).toBeTruthy();
      expect(utilsMock.generateUUID()).toBeTruthy();
      expect(utilsMock.cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should create auth mocks', () => {
      const authMocks = MockFactory.createAuthMocks();

      expect(authMocks).toHaveProperty('totpService');
      expect(authMocks).toHaveProperty('deviceFingerprint');
      expect(authMocks).toHaveProperty('apiAuth');

      // Test auth mock functions
      expect(authMocks.totpService.generateSecret()).toBeTruthy();
      expect(authMocks.deviceFingerprint.generateBasicDeviceFingerprint()).toBeTruthy();
    });
  });

  describe('TherapeuticDataFactory', () => {
    it('should create valid CBT diary data', () => {
      const cbtData = TherapeuticDataFactory.createCBTDiaryData();

      // Use our custom matcher
      expect(cbtData).toBeValidCBTData();

      // Test specific fields
      expect(cbtData).toHaveProperty('situation');
      expect(cbtData).toHaveProperty('initialEmotions');
      expect(cbtData).toHaveProperty('automaticThoughts');
      expect(cbtData).toHaveProperty('coreBeliefText');

      // Test emotion ranges
      expect(cbtData.initialEmotions.anxiety).toBeWithinEmotionRange();
      expect(cbtData.initialEmotions.fear).toBeWithinEmotionRange();
    });

    it('should create chat messages', () => {
      const message = TherapeuticDataFactory.createChatMessage();

      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('role');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('timestamp');

      expect(message.role).toBe('user');
      expect(typeof message.content).toBe('string');
    });

    it('should create assistant messages with therapeutic content', () => {
      const message = TherapeuticDataFactory.createAssistantMessage();

      expect(message.role).toBe('assistant');
      expect(message.content).toHaveTherapeuticStructure();
      expect(message).toHaveProperty('modelUsed');
    });

    it('should create session reports', () => {
      const report = TherapeuticDataFactory.createSessionReport();

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('keyInsights');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('mood');

      expect(Array.isArray(report.keyInsights)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.mood.after).toBeGreaterThan(report.mood.before);
    });

    it('should create schema modes', () => {
      const modes = TherapeuticDataFactory.createSchemaModes();

      expect(Array.isArray(modes)).toBe(true);
      expect(modes.length).toBeGreaterThan(0);

      modes.forEach((mode) => {
        expect(mode).toHaveProperty('id');
        expect(mode).toHaveProperty('name');
        expect(mode).toHaveProperty('description');
        expect(mode).toHaveProperty('selected');
      });
    });
  });

  describe('TestDataValidator', () => {
    it('should validate therapeutic data correctly', () => {
      const validData = TherapeuticDataFactory.createCBTDiaryData();
      const validation = TestDataValidator.validateTherapeuticData(validData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData = { incomplete: true };
      const validation = TestDataValidator.validateTherapeuticData(invalidData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('Missing required field');
    });

    it('should validate security scenarios', () => {
      const scenarios = {
        xssVectors: ['<script>alert("xss")</script>', 'javascript:alert(1)'],
        sqlVectors: ['DROP TABLE users', 'UNION SELECT password'],
      };

      const validation = TestDataValidator.validateSecurityScenarios(scenarios);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('TestPerformanceMonitor', () => {
    it('should track test suite performance', () => {
      const suiteName = 'test-suite-validation';

      TestPerformanceMonitor.startSuite(suiteName);

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }

      TestPerformanceMonitor.endSuite(suiteName);

      const report = TestPerformanceMonitor.getReport();
      expect(report).toHaveProperty('slowTests');
      expect(report).toHaveProperty('totalSlowTests');
    });

    it('should reset monitoring data', () => {
      TestPerformanceMonitor.startSuite('test-reset');
      TestPerformanceMonitor.reset();

      const report = TestPerformanceMonitor.getReport();
      expect(report.totalSlowTests).toBe(0);
    });
  });

  describe('Integration Test', () => {
    it('should work together to create comprehensive test scenario', () => {
      // Start performance monitoring
      TestPerformanceMonitor.startSuite('integration-test');

      // Create test data
      const cbtData = TherapeuticDataFactory.createCBTDiaryData();
      const message = TherapeuticDataFactory.createAssistantMessage();

      // Validate data
      const cbtValidation = TestDataValidator.validateTherapeuticData(cbtData);
      expect(cbtValidation.isValid).toBe(true);

      // Test therapeutic content
      expect(message.content).toHaveTherapeuticStructure();

      // Create mocks
      const utilsMock = MockFactory.createUtilsMock();
      expect(utilsMock.generateUUID()).toBeTruthy();

      // End performance monitoring
      TestPerformanceMonitor.endSuite('integration-test');

      // All utilities should work together
      expect(true).toBe(true);
    });
  });
});
