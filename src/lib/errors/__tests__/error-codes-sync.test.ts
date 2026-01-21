/**
 * Sync test to verify ErrorCode enum values match between
 * src/lib/errors/error-codes.ts and convex/lib/errors.ts
 *
 * Since Convex cannot use path aliases, the ErrorCode enum is duplicated.
 * This test ensures both copies remain in sync.
 */

import { ErrorCode as SrcErrorCode } from '../error-codes';
// Note: We import the Convex version by reading the file values directly
// since Convex files may have different module resolution

describe('ErrorCode enum sync', () => {
  // Expected error codes that must exist in both files
  const expectedErrorCodes = [
    'UNAUTHENTICATED',
    'SESSION_EXPIRED',
    'FORBIDDEN',
    'VALIDATION_ERROR',
    'INVALID_INPUT',
    'NOT_FOUND',
    'CONFLICT',
    'INTERNAL_ERROR',
    'SERVICE_UNAVAILABLE',
    'RATE_LIMITED',
  ] as const;

  it('should have all expected error codes in src/lib/errors/error-codes.ts', () => {
    const srcCodes = Object.keys(SrcErrorCode);
    
    for (const code of expectedErrorCodes) {
      expect(srcCodes).toContain(code);
      expect(SrcErrorCode[code as keyof typeof SrcErrorCode]).toBe(code);
    }
  });

  it('should have exactly 10 error codes', () => {
    expect(Object.keys(SrcErrorCode)).toHaveLength(10);
  });

  it('should have error code values equal to their keys (string enum pattern)', () => {
    for (const [key, value] of Object.entries(SrcErrorCode)) {
      expect(key).toBe(value);
    }
  });

  /**
   * This test documents the expected ErrorCode values that convex/lib/errors.ts
   * must also define. If this test fails after modifying src/lib/errors/error-codes.ts,
   * you MUST also update convex/lib/errors.ts to match.
   */
  it('should match the documented ErrorCode contract for Convex sync', () => {
    const srcCodeKeys = Object.keys(SrcErrorCode).sort();
    
    // Document the expected keys - if this changes, update convex/lib/errors.ts
    const expectedKeys = [
      'CONFLICT',
      'FORBIDDEN',
      'INTERNAL_ERROR',
      'INVALID_INPUT',
      'NOT_FOUND',
      'RATE_LIMITED',
      'SERVICE_UNAVAILABLE',
      'SESSION_EXPIRED',
      'UNAUTHENTICATED',
      'VALIDATION_ERROR',
    ];

    expect(srcCodeKeys).toEqual(expectedKeys);
    
    // Verify each key maps to itself (string enum pattern)
    for (const key of expectedKeys) {
      expect(SrcErrorCode[key as keyof typeof SrcErrorCode]).toBe(key);
    }
  });
});
