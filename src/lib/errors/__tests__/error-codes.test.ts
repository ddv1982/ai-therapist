import {
  ErrorCode,
  createAppError,
  getHttpStatusForErrorCode,
  isErrorCode,
  ErrorCodeToHttpStatus,
  ErrorCodeToMessage,
  type AppError,
} from '../error-codes';

describe('ErrorCode', () => {
  describe('error code values', () => {
    it('should have all required error codes', () => {
      expect(ErrorCode.UNAUTHENTICATED).toBe('UNAUTHENTICATED');
      expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCode.SESSION_EXPIRED).toBe('SESSION_EXPIRED');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCode.CONFLICT).toBe('CONFLICT');
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCode.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
    });

    it('should have exactly 10 error codes', () => {
      const codeValues = Object.values(ErrorCode);
      expect(codeValues).toHaveLength(10);
    });

    it('should have unique values for each error code', () => {
      const codeValues = Object.values(ErrorCode);
      const uniqueValues = new Set(codeValues);
      expect(uniqueValues.size).toBe(codeValues.length);
    });
  });

  describe('ErrorCodeToHttpStatus', () => {
    it('should map UNAUTHENTICATED to 401', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.UNAUTHENTICATED]).toBe(401);
    });

    it('should map SESSION_EXPIRED to 401', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.SESSION_EXPIRED]).toBe(401);
    });

    it('should map FORBIDDEN to 403', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.FORBIDDEN]).toBe(403);
    });

    it('should map VALIDATION_ERROR to 400', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.VALIDATION_ERROR]).toBe(400);
    });

    it('should map INVALID_INPUT to 400', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.INVALID_INPUT]).toBe(400);
    });

    it('should map NOT_FOUND to 404', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.NOT_FOUND]).toBe(404);
    });

    it('should map CONFLICT to 409', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.CONFLICT]).toBe(409);
    });

    it('should map INTERNAL_ERROR to 500', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.INTERNAL_ERROR]).toBe(500);
    });

    it('should map SERVICE_UNAVAILABLE to 503', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.SERVICE_UNAVAILABLE]).toBe(503);
    });

    it('should map RATE_LIMITED to 429', () => {
      expect(ErrorCodeToHttpStatus[ErrorCode.RATE_LIMITED]).toBe(429);
    });

    it('should have mapping for all error codes', () => {
      const errorCodes = Object.values(ErrorCode);
      for (const code of errorCodes) {
        expect(ErrorCodeToHttpStatus[code]).toBeDefined();
        expect(typeof ErrorCodeToHttpStatus[code]).toBe('number');
      }
    });
  });

  describe('ErrorCodeToMessage', () => {
    it('should have default messages for all error codes', () => {
      const errorCodes = Object.values(ErrorCode);
      for (const code of errorCodes) {
        expect(ErrorCodeToMessage[code]).toBeDefined();
        expect(typeof ErrorCodeToMessage[code]).toBe('string');
        expect(ErrorCodeToMessage[code].length).toBeGreaterThan(0);
      }
    });

    it('should have user-friendly messages', () => {
      expect(ErrorCodeToMessage[ErrorCode.UNAUTHENTICATED]).toBe('Authentication required');
      expect(ErrorCodeToMessage[ErrorCode.FORBIDDEN]).toBe('Access denied');
      expect(ErrorCodeToMessage[ErrorCode.NOT_FOUND]).toBe('Resource not found');
      expect(ErrorCodeToMessage[ErrorCode.INTERNAL_ERROR]).toBe('Something went wrong');
    });
  });
});

describe('createAppError', () => {
  it('should create an AppError with default message', () => {
    const error = createAppError(ErrorCode.UNAUTHENTICATED);

    expect(error).toEqual({
      code: ErrorCode.UNAUTHENTICATED,
      message: 'Authentication required',
    });
  });

  it('should create an AppError with custom message', () => {
    const error = createAppError(ErrorCode.NOT_FOUND, 'Session not found');

    expect(error).toEqual({
      code: ErrorCode.NOT_FOUND,
      message: 'Session not found',
    });
  });

  it('should create an AppError with details', () => {
    const error = createAppError(ErrorCode.VALIDATION_ERROR, 'Invalid email', 'Email format is incorrect');

    expect(error).toEqual({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid email',
      details: 'Email format is incorrect',
    });
  });

  it('should not include details when undefined', () => {
    const error = createAppError(ErrorCode.INTERNAL_ERROR, 'Server error', undefined);

    expect(error).toEqual({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Server error',
    });
    expect('details' in error).toBe(false);
  });

  it('should include empty string as details when provided', () => {
    const error = createAppError(ErrorCode.INTERNAL_ERROR, 'Server error', '');

    expect(error).toEqual({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Server error',
      details: '',
    });
  });

  it('should use default message for all error codes', () => {
    const errorCodes = Object.values(ErrorCode);

    for (const code of errorCodes) {
      const error = createAppError(code);
      expect(error.code).toBe(code);
      expect(error.message).toBe(ErrorCodeToMessage[code]);
    }
  });
});

describe('getHttpStatusForErrorCode', () => {
  it('should return correct status for UNAUTHENTICATED', () => {
    expect(getHttpStatusForErrorCode(ErrorCode.UNAUTHENTICATED)).toBe(401);
  });

  it('should return correct status for FORBIDDEN', () => {
    expect(getHttpStatusForErrorCode(ErrorCode.FORBIDDEN)).toBe(403);
  });

  it('should return correct status for NOT_FOUND', () => {
    expect(getHttpStatusForErrorCode(ErrorCode.NOT_FOUND)).toBe(404);
  });

  it('should return correct status for VALIDATION_ERROR', () => {
    expect(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).toBe(400);
  });

  it('should return correct status for INTERNAL_ERROR', () => {
    expect(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).toBe(500);
  });

  it('should return correct status for SERVICE_UNAVAILABLE', () => {
    expect(getHttpStatusForErrorCode(ErrorCode.SERVICE_UNAVAILABLE)).toBe(503);
  });

  it('should return correct status for RATE_LIMITED', () => {
    expect(getHttpStatusForErrorCode(ErrorCode.RATE_LIMITED)).toBe(429);
  });
});

describe('isErrorCode', () => {
  it('should return true for valid error codes', () => {
    const errorCodes = Object.values(ErrorCode);

    for (const code of errorCodes) {
      expect(isErrorCode(code)).toBe(true);
    }
  });

  it('should return false for invalid strings', () => {
    expect(isErrorCode('INVALID_CODE')).toBe(false);
    expect(isErrorCode('not-a-code')).toBe(false);
    expect(isErrorCode('authentication_error')).toBe(false);
  });

  it('should return false for non-string values', () => {
    expect(isErrorCode(null)).toBe(false);
    expect(isErrorCode(undefined)).toBe(false);
    expect(isErrorCode(123)).toBe(false);
    expect(isErrorCode({})).toBe(false);
    expect(isErrorCode([])).toBe(false);
    expect(isErrorCode(true)).toBe(false);
  });
});

describe('AppError type', () => {
  it('should be assignable with code and message', () => {
    const error: AppError = {
      code: ErrorCode.NOT_FOUND,
      message: 'Not found',
    };
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('Not found');
  });

  it('should be assignable with optional details', () => {
    const error: AppError = {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Invalid input',
      details: 'Field X is required',
    };
    expect(error.details).toBe('Field X is required');
  });
});
