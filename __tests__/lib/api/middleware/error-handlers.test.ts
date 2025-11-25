/**
 * Tests for Error Handlers
 *
 * Validates database error handling middleware
 */

import { errorHandlers } from '@/lib/api/middleware/error-handlers';
import { createValidationErrorResponse, createServerErrorResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';
import type { RequestContext } from '@/lib/api/api-middleware';

// Mock dependencies
jest.mock('@/lib/api/api-response', () => ({
  createValidationErrorResponse: jest.fn(() => ({
    status: 400,
    body: { success: false, error: { type: 'validation' } },
  })),
  createServerErrorResponse: jest.fn(() => ({
    status: 500,
    body: { success: false, error: { type: 'server' } },
  })),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    databaseError: jest.fn(),
  },
}));

const mockLogger = logger as jest.Mocked<typeof logger>;
const mockCreateValidationError = createValidationErrorResponse as jest.MockedFunction<
  typeof createValidationErrorResponse
>;
const mockCreateServerError = createServerErrorResponse as jest.MockedFunction<
  typeof createServerErrorResponse
>;

describe('Error Handlers', () => {
  const mockContext: RequestContext = {
    requestId: 'req-12345',
    userId: 'user-123',
    startTime: Date.now(),
    metadata: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleDatabaseError', () => {
    it('returns validation error for UNIQUE constraint', () => {
      const error = new Error('UNIQUE constraint violation: email already exists');

      errorHandlers.handleDatabaseError(error, 'createUser', mockContext);

      expect(mockCreateValidationError).toHaveBeenCalledWith(
        'Resource already exists with this identifier',
        'req-12345'
      );
      expect(mockCreateServerError).not.toHaveBeenCalled();
    });

    it('returns validation error for FOREIGN KEY constraint', () => {
      const error = new Error('FOREIGN KEY constraint failed: session_id does not exist');

      errorHandlers.handleDatabaseError(error, 'createMessage', mockContext);

      expect(mockCreateValidationError).toHaveBeenCalledWith(
        'Referenced resource does not exist',
        'req-12345'
      );
      expect(mockCreateServerError).not.toHaveBeenCalled();
    });

    it('returns server error for unknown database errors', () => {
      const error = new Error('Connection timeout');

      errorHandlers.handleDatabaseError(error, 'queryData', mockContext);

      expect(mockCreateServerError).toHaveBeenCalledWith(error, 'req-12345', mockContext);
      expect(mockCreateValidationError).not.toHaveBeenCalled();
    });

    it('logs database error for all error types', () => {
      const error = new Error('Database error');

      errorHandlers.handleDatabaseError(error, 'testOperation', mockContext);

      expect(mockLogger.databaseError).toHaveBeenCalledWith('testOperation', error, mockContext);
    });

    it('handles UNIQUE constraint with different case', () => {
      const error = new Error('unique constraint violation on column');

      errorHandlers.handleDatabaseError(error, 'update', mockContext);

      // Should still return validation error since 'UNIQUE constraint' is not in the message
      // Check the actual behavior - lowercase won't match
      expect(mockCreateServerError).toHaveBeenCalled();
    });

    it('handles FOREIGN KEY constraint with partial message', () => {
      const error = new Error('Error: FOREIGN KEY constraint failed');

      errorHandlers.handleDatabaseError(error, 'delete', mockContext);

      expect(mockCreateValidationError).toHaveBeenCalledWith(
        'Referenced resource does not exist',
        'req-12345'
      );
    });

    it('passes correct requestId from context', () => {
      const customContext: RequestContext = {
        ...mockContext,
        requestId: 'custom-request-id-abc',
      };
      const error = new Error('UNIQUE constraint error');

      errorHandlers.handleDatabaseError(error, 'operation', customContext);

      expect(mockCreateValidationError).toHaveBeenCalledWith(
        expect.any(String),
        'custom-request-id-abc'
      );
    });

    it('handles empty error message', () => {
      const error = new Error('');

      errorHandlers.handleDatabaseError(error, 'operation', mockContext);

      expect(mockCreateServerError).toHaveBeenCalled();
    });

    it('handles error with special characters', () => {
      const error = new Error('Error at line 1: FOREIGN KEY constraint violation <script>');

      errorHandlers.handleDatabaseError(error, 'operation', mockContext);

      expect(mockCreateValidationError).toHaveBeenCalledWith(
        'Referenced resource does not exist',
        'req-12345'
      );
    });

    it('handles multiple constraint types in message - UNIQUE first', () => {
      const error = new Error('UNIQUE constraint violation and FOREIGN KEY constraint failed');

      errorHandlers.handleDatabaseError(error, 'operation', mockContext);

      // Should match UNIQUE first since it's checked first in the function
      expect(mockCreateValidationError).toHaveBeenCalledWith(
        'Resource already exists with this identifier',
        'req-12345'
      );
    });

    it('logs operation name correctly', () => {
      const error = new Error('Some error');
      const operationName = 'getUserProfile';

      errorHandlers.handleDatabaseError(error, operationName, mockContext);

      expect(mockLogger.databaseError).toHaveBeenCalledWith(
        'getUserProfile',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('passes full context to server error response', () => {
      const fullContext: RequestContext = {
        requestId: 'req-full',
        userId: 'user-full',
        startTime: 1705312800000,
        metadata: { extra: 'data' },
      };
      const error = new Error('Generic error');

      errorHandlers.handleDatabaseError(error, 'operation', fullContext);

      expect(mockCreateServerError).toHaveBeenCalledWith(error, 'req-full', fullContext);
    });
  });

  describe('errorHandlers object', () => {
    it('exports handleDatabaseError function', () => {
      expect(errorHandlers.handleDatabaseError).toBeDefined();
      expect(typeof errorHandlers.handleDatabaseError).toBe('function');
    });

    it('is an object with expected methods', () => {
      expect(typeof errorHandlers).toBe('object');
      expect(Object.keys(errorHandlers)).toContain('handleDatabaseError');
    });
  });
});
