/**
 * Tests for API Hooks Index
 *
 * Validates that all hook exports are correctly re-exported from the barrel
 */

import * as apiHooks from '@/lib/api/hooks';

describe('API Hooks Index', () => {
  describe('Hook exports', () => {
    it('exports useApiMutation', () => {
      expect(apiHooks.useApiMutation).toBeDefined();
      expect(typeof apiHooks.useApiMutation).toBe('function');
    });

    it('exports useApiMutationWithProgress', () => {
      expect(apiHooks.useApiMutationWithProgress).toBeDefined();
      expect(typeof apiHooks.useApiMutationWithProgress).toBe('function');
    });
  });

  describe('Utility function exports', () => {
    it('exports extractApiError', () => {
      expect(apiHooks.extractApiError).toBeDefined();
      expect(typeof apiHooks.extractApiError).toBe('function');
    });

    it('exports getUserFriendlyErrorMessage', () => {
      expect(apiHooks.getUserFriendlyErrorMessage).toBeDefined();
      expect(typeof apiHooks.getUserFriendlyErrorMessage).toBe('function');
    });
  });

  describe('extractApiError functionality', () => {
    it('extracts error message from Error object', () => {
      const error = new Error('Test error message');
      const result = apiHooks.extractApiError(error);
      expect(result.message).toBe('Test error message');
    });

    it('handles unknown error types', () => {
      const result = apiHooks.extractApiError('string error');
      expect(result.message).toBeDefined();
    });

    it('handles object with Error properties', () => {
      const error = new Error('Custom message');
      error.name = 'CustomError';
      const result = apiHooks.extractApiError(error);
      expect(result.message).toBeDefined();
    });
  });

  describe('getUserFriendlyErrorMessage functionality', () => {
    it('returns user-friendly message for Error', () => {
      const error = new Error('Internal error');
      const message = apiHooks.getUserFriendlyErrorMessage(error);
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('handles error with code and message', () => {
      const error = new Error('Network failed');
      error.name = 'NetworkError';
      const message = apiHooks.getUserFriendlyErrorMessage(error);
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
  });

  describe('Export completeness', () => {
    const expectedExports = [
      'useApiMutation',
      'useApiMutationWithProgress',
      'extractApiError',
      'getUserFriendlyErrorMessage',
    ];

    it.each(expectedExports)('exports %s', (exportName) => {
      expect((apiHooks as Record<string, unknown>)[exportName]).toBeDefined();
    });

    it('has the expected exports', () => {
      const exportKeys = Object.keys(apiHooks);
      expectedExports.forEach((expected) => {
        expect(exportKeys).toContain(expected);
      });
    });
  });
});
