import { ApiErrorCode, getErrorDetails, getHttpStatus, isClientError, isServerError } from '@/lib/api/error-codes';

describe('api/error-codes', () => {
  it('classifies client and server errors correctly', () => {
    expect(isClientError(ApiErrorCode.VALIDATION_ERROR)).toBe(true);
    expect(isServerError(ApiErrorCode.INTERNAL_SERVER_ERROR)).toBe(true);
  });

  it('returns http status for codes and default for unknown', () => {
    expect(getHttpStatus(ApiErrorCode.NOT_FOUND)).toBe(404);
    // @ts-expect-error: testing fallback branch
    const details = getErrorDetails('UNKNOWN_CODE');
    expect(details.httpStatus).toBe(500);
  });
});
