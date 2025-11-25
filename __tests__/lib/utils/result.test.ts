/**
 * Result Type Utility Tests
 *
 * Comprehensive tests for the Result type utility including
 * constructors, type guards, pattern matching, transformations,
 * unwrapping, async helpers, and combination functions.
 */

import {
  ok,
  err,
  isOk,
  isErr,
  match,
  map,
  mapErr,
  flatMap,
  unwrapOr,
  unwrapOrElse,
  unwrap,
  tryCatch,
  tryCatchSync,
  all,
  combine,
  fromNullable,
  toNullable,
  toPromise,
  type Result,
  // Ok and Err type aliases are used in type annotations via Result type
} from '@/lib/utils/result';

describe('Result Type Utility', () => {
  // ============================================================================
  // Result Constructors
  // ============================================================================

  describe('ok()', () => {
    it('creates a successful Result with data', () => {
      const result = ok({ id: 1, name: 'Test' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'Test' });
    });

    it('creates ok Result with primitive value', () => {
      const stringResult = ok('hello');
      const numberResult = ok(42);
      const boolResult = ok(true);

      expect(stringResult.data).toBe('hello');
      expect(numberResult.data).toBe(42);
      expect(boolResult.data).toBe(true);
    });

    it('creates ok Result with null value', () => {
      const result = ok(null);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('creates ok Result with undefined value', () => {
      const result = ok(undefined);

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('creates ok Result with array value', () => {
      const result = ok([1, 2, 3]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });
  });

  describe('err()', () => {
    it('creates a failed Result with error', () => {
      const error = new Error('Something went wrong');
      const result = err(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('creates err Result with string error', () => {
      const result = err('Error message');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error message');
    });

    it('creates err Result with custom error object', () => {
      const customError = { code: 'VALIDATION_ERROR', message: 'Invalid input' };
      const result = err(customError);

      expect(result.success).toBe(false);
      expect(result.error).toEqual({ code: 'VALIDATION_ERROR', message: 'Invalid input' });
    });
  });

  // ============================================================================
  // Type Guards
  // ============================================================================

  describe('isOk()', () => {
    it('returns true for ok Results', () => {
      const result = ok('data');
      expect(isOk(result)).toBe(true);
    });

    it('returns false for err Results', () => {
      const result = err(new Error('error'));
      expect(isOk(result)).toBe(false);
    });

    it('narrows type correctly', () => {
      const result: Result<number, Error> = ok(42);

      if (isOk(result)) {
        // TypeScript should know result.data is available
        const data: number = result.data;
        expect(data).toBe(42);
      }
    });
  });

  describe('isErr()', () => {
    it('returns true for err Results', () => {
      const result = err(new Error('error'));
      expect(isErr(result)).toBe(true);
    });

    it('returns false for ok Results', () => {
      const result = ok('data');
      expect(isErr(result)).toBe(false);
    });

    it('narrows type correctly', () => {
      const result: Result<number, string> = err('error');

      if (isErr(result)) {
        // TypeScript should know result.error is available
        const error: string = result.error;
        expect(error).toBe('error');
      }
    });
  });

  // ============================================================================
  // Pattern Matching
  // ============================================================================

  describe('match()', () => {
    it('calls ok handler for successful Result', () => {
      const result = ok({ name: 'John' });

      const message = match(result, {
        ok: (data) => `Hello, ${data.name}!`,
        err: (error) => `Error: ${error}`,
      });

      expect(message).toBe('Hello, John!');
    });

    it('calls err handler for failed Result', () => {
      const result = err('User not found');

      const message = match(result, {
        ok: (data) => `Hello, ${data}!`,
        err: (error) => `Error: ${error}`,
      });

      expect(message).toBe('Error: User not found');
    });

    it('handles complex transformations', () => {
      const userResult: Result<{ age: number }, Error> = ok({ age: 25 });

      const isAdult = match(userResult, {
        ok: (user) => user.age >= 18,
        err: () => false,
      });

      expect(isAdult).toBe(true);
    });
  });

  // ============================================================================
  // Transformation Functions
  // ============================================================================

  describe('map()', () => {
    it('transforms success value', () => {
      const result = ok({ name: 'John', age: 30 });
      const nameResult = map(result, (user) => user.name);

      expect(isOk(nameResult)).toBe(true);
      if (isOk(nameResult)) {
        expect(nameResult.data).toBe('John');
      }
    });

    it('preserves error on err Result', () => {
      const result: Result<{ name: string }, string> = err('Not found');
      const nameResult = map(result, (user: { name: string }) => user.name);

      expect(isErr(nameResult)).toBe(true);
      if (isErr(nameResult)) {
        expect(nameResult.error).toBe('Not found');
      }
    });

    it('chains multiple maps', () => {
      const result = ok(5);
      const doubled = map(result, (n) => n * 2);
      const tripled = map(doubled, (n) => n * 3);

      expect(isOk(tripled)).toBe(true);
      if (isOk(tripled)) {
        expect(tripled.data).toBe(30);
      }
    });
  });

  describe('mapErr()', () => {
    it('transforms error value', () => {
      const result: Result<number, string> = err('Not found');
      const mappedResult = mapErr(result, (msg) => new Error(msg));

      expect(isErr(mappedResult)).toBe(true);
      if (isErr(mappedResult)) {
        expect(mappedResult.error).toBeInstanceOf(Error);
        expect(mappedResult.error.message).toBe('Not found');
      }
    });

    it('preserves success on ok Result', () => {
      const result: Result<number, string> = ok(42);
      const mappedResult = mapErr(result, (msg: string) => new Error(msg));

      expect(isOk(mappedResult)).toBe(true);
      if (isOk(mappedResult)) {
        expect(mappedResult.data).toBe(42);
      }
    });
  });

  describe('flatMap()', () => {
    it('chains Result-returning operations', () => {
      const divide = (a: number, b: number): Result<number, string> =>
        b === 0 ? err('Division by zero') : ok(a / b);

      const result = ok(10);
      const divided = flatMap(result, (n) => divide(n, 2));

      expect(isOk(divided)).toBe(true);
      if (isOk(divided)) {
        expect(divided.data).toBe(5);
      }
    });

    it('short-circuits on error', () => {
      const divide = (a: number, b: number): Result<number, string> =>
        b === 0 ? err('Division by zero') : ok(a / b);

      const result = ok(10);
      const divided = flatMap(result, (n) => divide(n, 0));

      expect(isErr(divided)).toBe(true);
      if (isErr(divided)) {
        expect(divided.error).toBe('Division by zero');
      }
    });

    it('propagates original error', () => {
      const divide = (a: number, b: number): Result<number, string> =>
        b === 0 ? err('Division by zero') : ok(a / b);

      const result: Result<number, string> = err('Initial error');
      const divided = flatMap(result, (n: number) => divide(n, 2));

      expect(isErr(divided)).toBe(true);
      if (isErr(divided)) {
        expect(divided.error).toBe('Initial error');
      }
    });
  });

  // ============================================================================
  // Unwrapping Functions
  // ============================================================================

  describe('unwrapOr()', () => {
    it('returns data for ok Result', () => {
      const result = ok({ name: 'John' });
      const data = unwrapOr(result, { name: 'Anonymous' });

      expect(data.name).toBe('John');
    });

    it('returns default for err Result', () => {
      const result: Result<{ name: string }, Error> = err(new Error('Not found'));
      const data = unwrapOr(result, { name: 'Anonymous' });

      expect(data.name).toBe('Anonymous');
    });
  });

  describe('unwrapOrElse()', () => {
    it('returns data for ok Result', () => {
      const result = ok(42);
      const value = unwrapOrElse(result, () => 0);

      expect(value).toBe(42);
    });

    it('computes default from error for err Result', () => {
      const result: Result<number, { fallback: number }> = err({ fallback: 99 });
      const value = unwrapOrElse(result, (error) => error.fallback);

      expect(value).toBe(99);
    });
  });

  describe('unwrap()', () => {
    it('returns data for ok Result', () => {
      const result = ok('hello');
      const data = unwrap(result);

      expect(data).toBe('hello');
    });

    it('throws error for err Result', () => {
      const error = new Error('Something went wrong');
      const result = err(error);

      expect(() => unwrap(result)).toThrow(error);
    });

    it('throws string error', () => {
      const result = err('String error');

      expect(() => unwrap(result)).toThrow('String error');
    });
  });

  // ============================================================================
  // Async Helpers
  // ============================================================================

  describe('tryCatch()', () => {
    it('returns ok Result for successful async operation', async () => {
      const result = await tryCatch(async () => {
        return { id: 1, name: 'Test' };
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toEqual({ id: 1, name: 'Test' });
      }
    });

    it('returns err Result for failed async operation', async () => {
      const result = await tryCatch(async () => {
        throw new Error('Async error');
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('Async error');
      }
    });

    it('wraps non-Error throws in Error', async () => {
      const result = await tryCatch(async () => {
        throw 'String throw';
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('String throw');
      }
    });

    it('handles async Promise.reject', async () => {
      const result = await tryCatch(() => Promise.reject(new Error('Rejected')));

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('Rejected');
      }
    });
  });

  describe('tryCatchSync()', () => {
    it('returns ok Result for successful sync operation', () => {
      const result = tryCatchSync(() => JSON.parse('{"name":"test"}'));

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toEqual({ name: 'test' });
      }
    });

    it('returns err Result for failed sync operation', () => {
      const result = tryCatchSync(() => JSON.parse('invalid json'));

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    it('wraps non-Error throws in Error', () => {
      const result = tryCatchSync(() => {
        throw 'Sync string throw';
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('Sync string throw');
      }
    });
  });

  // ============================================================================
  // Combining Results
  // ============================================================================

  describe('all()', () => {
    it('combines all ok Results into array', () => {
      const results = [ok(1), ok(2), ok(3)];
      const combined = all(results);

      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.data).toEqual([1, 2, 3]);
      }
    });

    it('returns first error when any Result is err', () => {
      const results: Result<number, string>[] = [ok(1), err('Second error'), err('Third error')];
      const combined = all(results);

      expect(isErr(combined)).toBe(true);
      if (isErr(combined)) {
        expect(combined.error).toBe('Second error');
      }
    });

    it('handles empty array', () => {
      const results: Result<number, string>[] = [];
      const combined = all(results);

      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.data).toEqual([]);
      }
    });

    it('handles single element array', () => {
      const results = [ok('single')];
      const combined = all(results);

      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.data).toEqual(['single']);
      }
    });
  });

  describe('combine()', () => {
    it('combines tuple of ok Results', () => {
      const userResult = ok({ id: 1, name: 'John' });
      const settingsResult = ok({ theme: 'dark' });

      const combined = combine([userResult, settingsResult] as const);

      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        const [user, settings] = combined.data;
        expect(user.name).toBe('John');
        expect(settings.theme).toBe('dark');
      }
    });

    it('returns first error from tuple', () => {
      const userResult: Result<{ name: string }, string> = ok({ name: 'John' });
      const settingsResult: Result<{ theme: string }, string> = err('Settings error');

      const combined = combine([userResult, settingsResult]);

      expect(isErr(combined)).toBe(true);
      if (isErr(combined)) {
        expect(combined.error).toBe('Settings error');
      }
    });
  });

  // ============================================================================
  // Conversion Utilities
  // ============================================================================

  describe('fromNullable()', () => {
    it('returns ok for non-null value', () => {
      const result = fromNullable({ id: 1 }, new Error('Not found'));

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data).toEqual({ id: 1 });
      }
    });

    it('returns err for null value', () => {
      const result = fromNullable(null, new Error('Not found'));

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('Not found');
      }
    });

    it('returns err for undefined value', () => {
      const result = fromNullable(undefined, 'Value is undefined');

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('Value is undefined');
      }
    });

    it('handles falsy but defined values', () => {
      const zeroResult = fromNullable(0, 'Error');
      const emptyStringResult = fromNullable('', 'Error');
      const falseResult = fromNullable(false, 'Error');

      expect(isOk(zeroResult)).toBe(true);
      expect(isOk(emptyStringResult)).toBe(true);
      expect(isOk(falseResult)).toBe(true);
    });
  });

  describe('toNullable()', () => {
    it('returns data for ok Result', () => {
      const result = ok({ id: 1 });
      const nullable = toNullable(result);

      expect(nullable).toEqual({ id: 1 });
    });

    it('returns null for err Result', () => {
      const result = err(new Error('Not found'));
      const nullable = toNullable(result);

      expect(nullable).toBeNull();
    });
  });

  describe('toPromise()', () => {
    it('resolves with data for ok Result', async () => {
      const result = ok('success');
      const value = await toPromise(result);

      expect(value).toBe('success');
    });

    it('rejects with error for err Result', async () => {
      const error = new Error('Failure');
      const result = err(error);

      await expect(toPromise(result)).rejects.toBe(error);
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe('Type Safety', () => {
    it('maintains type inference through transformations', () => {
      const result: Result<{ user: { name: string } }, string> = ok({
        user: { name: 'John' },
      });

      const nameResult = map(result, (data) => data.user.name);

      if (isOk(nameResult)) {
        // TypeScript should infer nameResult.data as string
        const name: string = nameResult.data;
        expect(name).toBe('John');
      }
    });

    it('enforces error type constraints', () => {
      type ApiError = { code: string; message: string };
      const result: Result<number, ApiError> = err({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });

      if (isErr(result)) {
        // TypeScript should know result.error is ApiError
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toBe('Resource not found');
      }
    });
  });
});
