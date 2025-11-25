/**
 * Result Type Utility
 *
 * A type-safe Result type for operations that can fail.
 * Provides a functional approach to error handling without exceptions.
 *
 * @module Result
 * @fileoverview Type-safe error handling with Result monads
 *
 * @example
 * ```typescript
 * // Creating success results
 * const success = ok({ userId: '123', name: 'John' });
 *
 * // Creating error results
 * const failure = err(new ApiError('USER_NOT_FOUND', 'User not found'));
 *
 * // Using type guards
 * if (isOk(result)) {
 *   console.log(result.data.name);
 * } else {
 *   console.error(result.error.message);
 * }
 *
 * // Pattern matching with match
 * const message = match(result, {
 *   ok: (data) => `Hello, ${data.name}!`,
 *   err: (error) => `Error: ${error.message}`,
 * });
 *
 * // Chaining operations with map
 * const nameResult = map(userResult, (user) => user.name);
 *
 * // Chaining fallible operations with flatMap
 * const profileResult = flatMap(userResult, (user) => fetchProfile(user.id));
 * ```
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Represents a successful result containing data of type T
 */
export interface Ok<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Represents a failed result containing an error of type E
 */
export interface Err<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * A Result type that represents either success (Ok) or failure (Err)
 *
 * @template T - The type of the success value
 * @template E - The type of the error value (defaults to Error)
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

// ============================================================================
// Result Constructors
// ============================================================================

/**
 * Creates a successful Result containing the provided data
 *
 * @template T - The type of the success value
 * @param data - The success value to wrap
 * @returns A successful Result
 *
 * @example
 * ```typescript
 * const result = ok({ id: 1, name: 'Test' });
 * // result: { success: true, data: { id: 1, name: 'Test' } }
 * ```
 */
export function ok<T>(data: T): Ok<T> {
  return { success: true, data };
}

/**
 * Creates a failed Result containing the provided error
 *
 * @template E - The type of the error value
 * @param error - The error value to wrap
 * @returns A failed Result
 *
 * @example
 * ```typescript
 * const result = err(new Error('Something went wrong'));
 * // result: { success: false, error: Error('Something went wrong') }
 * ```
 */
export function err<E>(error: E): Err<E> {
  return { success: false, error };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a Result is successful (Ok)
 *
 * @template T - The type of the success value
 * @template E - The type of the error value
 * @param result - The Result to check
 * @returns true if the Result is Ok, false otherwise
 *
 * @example
 * ```typescript
 * const result = await fetchUser();
 * if (isOk(result)) {
 *   // TypeScript knows result.data is available
 *   console.log(result.data.name);
 * }
 * ```
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success === true;
}

/**
 * Type guard to check if a Result is a failure (Err)
 *
 * @template T - The type of the success value
 * @template E - The type of the error value
 * @param result - The Result to check
 * @returns true if the Result is Err, false otherwise
 *
 * @example
 * ```typescript
 * const result = await fetchUser();
 * if (isErr(result)) {
 *   // TypeScript knows result.error is available
 *   console.error(result.error.message);
 * }
 * ```
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.success === false;
}

// ============================================================================
// Pattern Matching
// ============================================================================

/**
 * Match handlers for Result pattern matching
 */
export interface MatchHandlers<T, E, R> {
  ok: (data: T) => R;
  err: (error: E) => R;
}

/**
 * Pattern match on a Result, handling both success and failure cases
 *
 * @template T - The type of the success value
 * @template E - The type of the error value
 * @template R - The return type of the handlers
 * @param result - The Result to match on
 * @param handlers - Object containing ok and err handler functions
 * @returns The result of the matched handler
 *
 * @example
 * ```typescript
 * const message = match(result, {
 *   ok: (user) => `Welcome, ${user.name}!`,
 *   err: (error) => `Error: ${error.message}`,
 * });
 * ```
 */
export function match<T, E, R>(result: Result<T, E>, handlers: MatchHandlers<T, E, R>): R {
  if (isOk(result)) {
    return handlers.ok(result.data);
  }
  return handlers.err(result.error);
}

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transform the success value of a Result, leaving errors unchanged
 *
 * @template T - The original success type
 * @template E - The error type
 * @template U - The new success type
 * @param result - The Result to transform
 * @param fn - Function to apply to success value
 * @returns A new Result with transformed success value
 *
 * @example
 * ```typescript
 * const userResult = ok({ name: 'John', age: 30 });
 * const nameResult = map(userResult, (user) => user.name);
 * // nameResult: { success: true, data: 'John' }
 * ```
 */
export function map<T, E, U>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Transform the error value of a Result, leaving success unchanged
 *
 * @template T - The success type
 * @template E - The original error type
 * @template F - The new error type
 * @param result - The Result to transform
 * @param fn - Function to apply to error value
 * @returns A new Result with transformed error value
 *
 * @example
 * ```typescript
 * const result = err('Not found');
 * const mappedResult = mapErr(result, (msg) => new Error(msg));
 * // mappedResult: { success: false, error: Error('Not found') }
 * ```
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Chain Result-returning operations (flatMap / bind)
 *
 * @template T - The original success type
 * @template E - The error type
 * @template U - The new success type
 * @param result - The Result to chain from
 * @param fn - Function that returns a new Result
 * @returns The Result from the chained operation
 *
 * @example
 * ```typescript
 * const userResult = await fetchUser(id);
 * const profileResult = flatMap(userResult, (user) => fetchProfile(user.profileId));
 * ```
 */
export function flatMap<T, E, U>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.data);
  }
  return result;
}

// ============================================================================
// Unwrapping Functions
// ============================================================================

/**
 * Extract the success value or return a default
 *
 * @template T - The success type
 * @template E - The error type
 * @param result - The Result to unwrap
 * @param defaultValue - Value to return if Result is Err
 * @returns The success value or default
 *
 * @example
 * ```typescript
 * const name = unwrapOr(userResult, { name: 'Anonymous' }).name;
 * ```
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Extract the success value or compute a default from the error
 *
 * @template T - The success type
 * @template E - The error type
 * @param result - The Result to unwrap
 * @param fn - Function to compute default from error
 * @returns The success value or computed default
 *
 * @example
 * ```typescript
 * const value = unwrapOrElse(result, (error) => {
 *   logger.warn('Using default due to error', { error });
 *   return defaultValue;
 * });
 * ```
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  if (isOk(result)) {
    return result.data;
  }
  return fn(result.error);
}

/**
 * Extract the success value or throw the error
 * Use with caution - prefer pattern matching for explicit error handling
 *
 * @template T - The success type
 * @param result - The Result to unwrap
 * @returns The success value
 * @throws The error if Result is Err
 *
 * @example
 * ```typescript
 * try {
 *   const user = unwrap(userResult);
 * } catch (error) {
 *   // Handle error
 * }
 * ```
 */
export function unwrap<T>(result: Result<T, unknown>): T {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
}

// ============================================================================
// Async Helpers
// ============================================================================

/**
 * Wrap an async operation that might throw into a Result
 *
 * @template T - The success type
 * @param fn - Async function to execute
 * @returns A Promise resolving to a Result
 *
 * @example
 * ```typescript
 * const result = await tryCatch(async () => {
 *   const response = await fetch('/api/users');
 *   return response.json();
 * });
 * ```
 */
export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Wrap a sync operation that might throw into a Result
 *
 * @template T - The success type
 * @param fn - Sync function to execute
 * @returns A Result
 *
 * @example
 * ```typescript
 * const result = tryCatchSync(() => JSON.parse(jsonString));
 * ```
 */
export function tryCatchSync<T>(fn: () => T): Result<T, Error> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// ============================================================================
// Combining Results
// ============================================================================

/**
 * Combine multiple Results into a single Result containing an array
 * If any Result is Err, returns the first error
 *
 * @template T - The success type
 * @template E - The error type
 * @param results - Array of Results to combine
 * @returns A single Result with array of success values
 *
 * @example
 * ```typescript
 * const results = await Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)]);
 * const combined = all(results);
 * if (isOk(combined)) {
 *   console.log('All users:', combined.data);
 * }
 * ```
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.data);
  }
  return ok(values);
}

/**
 * Apply multiple Result-returning operations and combine their results
 * Similar to Promise.all but for Result types
 *
 * @template T - Tuple of success types
 * @template E - The error type
 * @param results - Tuple of Results to combine
 * @returns A single Result with tuple of success values
 *
 * @example
 * ```typescript
 * const [userResult, settingsResult] = await Promise.all([
 *   fetchUser(id),
 *   fetchSettings(id),
 * ]);
 * const combined = combine([userResult, settingsResult]);
 * if (isOk(combined)) {
 *   const [user, settings] = combined.data;
 * }
 * ```
 */
export function combine<T extends readonly unknown[], E>(results: {
  readonly [K in keyof T]: Result<T[K], E>;
}): Result<T, E> {
  const values: unknown[] = [];
  for (const result of results) {
    if (isErr(result as Result<unknown, E>)) {
      return result as Result<never, E>;
    }
    values.push((result as Ok<unknown>).data);
  }
  return ok(values as unknown as T);
}

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * Convert a nullable value to a Result
 *
 * @template T - The value type
 * @template E - The error type
 * @param value - The nullable value
 * @param error - Error to use if value is null/undefined
 * @returns A Result containing the value or error
 *
 * @example
 * ```typescript
 * const result = fromNullable(user, new Error('User not found'));
 * ```
 */
export function fromNullable<T, E>(value: T | null | undefined, error: E): Result<T, E> {
  if (value === null || value === undefined) {
    return err(error);
  }
  return ok(value);
}

/**
 * Convert a Result to a nullable value (discards error info)
 *
 * @template T - The success type
 * @param result - The Result to convert
 * @returns The success value or null
 *
 * @example
 * ```typescript
 * const user = toNullable(userResult); // User | null
 * ```
 */
export function toNullable<T>(result: Result<T, unknown>): T | null {
  if (isOk(result)) {
    return result.data;
  }
  return null;
}

/**
 * Convert a Result to a Promise
 * Ok becomes resolved, Err becomes rejected
 *
 * @template T - The success type
 * @template E - The error type
 * @param result - The Result to convert
 * @returns A Promise
 *
 * @example
 * ```typescript
 * const user = await toPromise(userResult);
 * ```
 */
export function toPromise<T, E>(result: Result<T, E>): Promise<T> {
  if (isOk(result)) {
    return Promise.resolve(result.data);
  }
  return Promise.reject(result.error);
}
