/**
 * Convex Error Helpers
 *
 * Provides typed error handling utilities for Convex functions.
 * Uses relative imports since Convex doesn't support @/ path aliases.
 */

import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';

/**
 * Error codes as const object for Convex functions.
 * Mirrors the shared ErrorCode from src/lib/errors/error-codes.ts
 * We duplicate here to avoid path alias issues in Convex.
 */
export const ErrorCode = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Convex application error class.
 * Extends Error with typed code and optional details.
 */
export class ConvexAppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: string;

  constructor(code: ErrorCode, message: string, details?: string) {
    super(message);
    this.name = 'ConvexAppError';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConvexAppError);
    }
  }

  /**
   * Converts error to a plain object for logging or serialization.
   * Never include sensitive data in details.
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Context type for both query and mutation handlers.
 */
type AnyCtx = QueryCtx | MutationCtx;

/**
 * Requires user to be authenticated.
 * Throws ConvexAppError with UNAUTHENTICATED if not authenticated.
 *
 * @param ctx - Convex context (query or mutation)
 * @returns Authenticated user document
 * @throws ConvexAppError with UNAUTHENTICATED code
 *
 * @example
 * ```ts
 * export const myMutation = mutation({
 *   handler: async (ctx) => {
 *     const user = await requireAuthentication(ctx);
 *     // user is guaranteed to exist here
 *   },
 * });
 * ```
 */
export async function requireAuthentication(ctx: AnyCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexAppError(ErrorCode.UNAUTHENTICATED, 'Authentication required');
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();

  if (!user) {
    throw new ConvexAppError(ErrorCode.UNAUTHENTICATED, 'User record not found');
  }

  return user;
}

/**
 * Requires user to own a session.
 * First validates authentication, then checks session ownership.
 *
 * @param ctx - Convex context (query or mutation)
 * @param sessionId - Session ID to check ownership for
 * @returns Object with user and session documents
 * @throws ConvexAppError with UNAUTHENTICATED if not authenticated
 * @throws ConvexAppError with NOT_FOUND if session doesn't exist or belongs to another user
 *
 * @example
 * ```ts
 * export const getSession = query({
 *   args: { sessionId: v.id('sessions') },
 *   handler: async (ctx, { sessionId }) => {
 *     const { user, session } = await requireOwnership(ctx, sessionId);
 *     return session;
 *   },
 * });
 * ```
 */
export async function requireOwnership(
  ctx: AnyCtx,
  sessionId: Doc<'sessions'>['_id']
): Promise<{ user: Doc<'users'>; session: Doc<'sessions'> }> {
  const user = await requireAuthentication(ctx);

  const session = await ctx.db.get(sessionId);
  if (!session || session.userId !== user._id) {
    throw new ConvexAppError(ErrorCode.NOT_FOUND, 'Session not found or access denied');
  }

  return { user, session };
}

/**
 * Requires user to have access to a specific user's data.
 * Used for queries that take a userId parameter.
 *
 * @param ctx - Convex context (query or mutation)
 * @param requestedUserId - User ID being accessed
 * @returns Authenticated user document
 * @throws ConvexAppError with UNAUTHENTICATED if not authenticated
 * @throws ConvexAppError with FORBIDDEN if accessing another user's data
 *
 * @example
 * ```ts
 * export const listByUser = query({
 *   args: { userId: v.id('users') },
 *   handler: async (ctx, { userId }) => {
 *     const user = await requireUserAccess(ctx, userId);
 *     // Proceed with user's data
 *   },
 * });
 * ```
 */
export async function requireUserAccess(
  ctx: AnyCtx,
  requestedUserId: Doc<'users'>['_id']
): Promise<Doc<'users'>> {
  const user = await requireAuthentication(ctx);

  if (user._id !== requestedUserId) {
    throw new ConvexAppError(ErrorCode.FORBIDDEN, 'Access denied');
  }

  return user;
}

/**
 * Creates a ConvexAppError for not found resources.
 *
 * @param resourceType - Type of resource (e.g., 'Session', 'Message')
 * @returns ConvexAppError with NOT_FOUND code
 */
export function createNotFoundError(resourceType: string): ConvexAppError {
  return new ConvexAppError(ErrorCode.NOT_FOUND, `${resourceType} not found`);
}

/**
 * Creates a ConvexAppError for validation errors.
 *
 * @param message - Validation error message
 * @param details - Optional details about what failed validation
 * @returns ConvexAppError with VALIDATION_ERROR code
 */
export function createValidationError(message: string, details?: string): ConvexAppError {
  return new ConvexAppError(ErrorCode.VALIDATION_ERROR, message, details);
}

/**
 * Type guard to check if an error is a ConvexAppError.
 */
export function isConvexAppError(error: unknown): error is ConvexAppError {
  return error instanceof ConvexAppError;
}
