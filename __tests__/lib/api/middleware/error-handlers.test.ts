import { errorHandlers } from '@/lib/api/middleware/error-handlers';

const mockLogger = {
  databaseError: jest.fn(),
};

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    databaseError: jest.fn(),
    apiError: jest.fn(),
  },
}));

const { logger } = jest.requireMock('@/lib/utils/logger');

describe('error-handlers', () => {
  const mockContext = {
    requestId: 'test-req-id',
    method: 'POST',
    url: 'http://localhost/api/test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleDatabaseError', () => {
    it('returns validation error for UNIQUE constraint violation', async () => {
      const error = new Error('UNIQUE constraint failed: users.email');
      
      const result = errorHandlers.handleDatabaseError(error, 'create user', mockContext);
      
      expect(result.status).toBe(400);
      const body = await result.json();
      expect(body.success).toBe(false);
      expect(body.error?.message).toBe('Validation failed');
      expect(body.error?.details).toBe('Resource already exists with this identifier');
      expect(logger.databaseError).toHaveBeenCalledWith('create user', error, mockContext);
    });

    it('returns validation error for FOREIGN KEY constraint violation', async () => {
      const error = new Error('FOREIGN KEY constraint failed on sessions.userId');
      
      const result = errorHandlers.handleDatabaseError(error, 'create session', mockContext);
      
      expect(result.status).toBe(400);
      const body = await result.json();
      expect(body.success).toBe(false);
      expect(body.error?.message).toBe('Validation failed');
      expect(body.error?.details).toBe('Referenced resource does not exist');
      expect(logger.databaseError).toHaveBeenCalledWith('create session', error, mockContext);
    });

    it('returns server error for generic database error', async () => {
      const error = new Error('Connection timeout');
      
      const result = errorHandlers.handleDatabaseError(error, 'fetch data', mockContext);
      
      expect(result.status).toBe(500);
      const body = await result.json();
      expect(body.success).toBe(false);
      expect(body.error?.message).toBeDefined();
      expect(logger.databaseError).toHaveBeenCalledWith('fetch data', error, mockContext);
    });

    it('logs error with correct context', async () => {
      const error = new Error('Test error');
      const operation = 'test operation';
      
      errorHandlers.handleDatabaseError(error, operation, mockContext);
      
      expect(logger.databaseError).toHaveBeenCalledTimes(1);
      expect(logger.databaseError).toHaveBeenCalledWith(operation, error, mockContext);
    });

    it('includes request ID in all error responses', async () => {
      const testCases = [
        new Error('UNIQUE constraint failed'),
        new Error('FOREIGN KEY constraint failed'),
        new Error('Generic error'),
      ];

      for (const error of testCases) {
        const result = errorHandlers.handleDatabaseError(error, 'test', mockContext);
        const body = await result.json();
        expect(body.meta?.requestId).toBe('test-req-id');
      }
    });
  });
});
