import {
  ApiErrorCode,
  getErrorDetails,
  isClientError,
  isServerError,
  getHttpStatus,
} from '@/lib/api/error-codes';

describe('error-codes', () => {
  describe('getErrorDetails', () => {
    it('returns error details for valid code', () => {
      const details = getErrorDetails(ApiErrorCode.VALIDATION_ERROR);
      expect(details.description).toBeTruthy();
      expect(details.suggestedAction).toBeTruthy();
      expect(details.httpStatus).toBe(400);
    });

    it('returns default details for invalid code', () => {
      const details = getErrorDetails('INVALID_CODE' as ApiErrorCode);
      expect(details.description).toContain('unknown');
      expect(details.httpStatus).toBe(500);
    });
  });

  describe('isClientError', () => {
    it('returns true for 4xx errors', () => {
      expect(isClientError(ApiErrorCode.VALIDATION_ERROR)).toBe(true);
      expect(isClientError(ApiErrorCode.UNAUTHORIZED)).toBe(true);
      expect(isClientError(ApiErrorCode.NOT_FOUND)).toBe(true);
    });

    it('returns false for 5xx errors', () => {
      expect(isClientError(ApiErrorCode.INTERNAL_SERVER_ERROR)).toBe(false);
      expect(isClientError(ApiErrorCode.DATABASE_ERROR)).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('returns true for 5xx errors', () => {
      expect(isServerError(ApiErrorCode.INTERNAL_SERVER_ERROR)).toBe(true);
      expect(isServerError(ApiErrorCode.DATABASE_ERROR)).toBe(true);
    });

    it('returns false for 4xx errors', () => {
      expect(isServerError(ApiErrorCode.VALIDATION_ERROR)).toBe(false);
      expect(isServerError(ApiErrorCode.NOT_FOUND)).toBe(false);
    });
  });

  describe('getHttpStatus', () => {
    it('returns correct status codes', () => {
      expect(getHttpStatus(ApiErrorCode.VALIDATION_ERROR)).toBe(400);
      expect(getHttpStatus(ApiErrorCode.UNAUTHORIZED)).toBe(401);
      expect(getHttpStatus(ApiErrorCode.FORBIDDEN)).toBe(403);
      expect(getHttpStatus(ApiErrorCode.NOT_FOUND)).toBe(404);
      expect(getHttpStatus(ApiErrorCode.RATE_LIMIT_EXCEEDED)).toBe(429);
      expect(getHttpStatus(ApiErrorCode.INTERNAL_SERVER_ERROR)).toBe(500);
      expect(getHttpStatus(ApiErrorCode.AI_SERVICE_UNAVAILABLE)).toBe(503);
    });
  });
});
