import { auth, getAuth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';

const TOKEN_RETRY_MAX_ATTEMPTS = 3;
const TOKEN_RETRY_BASE_DELAY_MS = 100;
const TOKEN_RETRY_JITTER_MAX_MS = 50;

export interface AuthValidationResult {
  isValid: boolean;
  userId?: string;
  clerkId?: string;
  jwtToken?: string;
  error?: string;
}

export interface AuthObjectWithGetToken {
  getToken: (options: { template: string }) => Promise<string | null>;
}

/**
 * Checks if an error is transient and should be retried.
 */
export function isTransientError(error: Error): boolean {
  return (
    error.message.includes('Bad Gateway') ||
    error.message.includes('Service Unavailable') ||
    error.message.includes('ECONNRESET') ||
    error.message.includes('fetch failed')
  );
}

/**
 * Retry helper for getToken with exponential backoff.
 * Handles transient Clerk service failures (502, 503, network errors).
 */
export async function getTokenWithRetry(
  authObj: AuthObjectWithGetToken,
  template: string,
  maxRetries = TOKEN_RETRY_MAX_ATTEMPTS
): Promise<string | null> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const token = await authObj.getToken({ template });
      return token;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isTransientError(lastError) || attempt === maxRetries - 1) {
        throw lastError;
      }

      const jitter = Math.floor(Math.random() * TOKEN_RETRY_JITTER_MAX_MS);
      const delayMs = TOKEN_RETRY_BASE_DELAY_MS * Math.pow(2, attempt) + jitter;
      logger.warn('Clerk getToken transient failure, retrying', {
        attempt: attempt + 1,
        maxRetries,
        delayMs,
        error: lastError.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError ?? new Error('Failed to get token after retries');
}

/**
 * Validate authentication for API routes using Clerk
 * Can be called with or without a request parameter (request param is ignored for Clerk)
 * Clerk's auth() function works in route handlers
 * Also retrieves the JWT token for passing to Convex
 */
export async function validateApiAuth(request?: NextRequest): Promise<AuthValidationResult> {
  // Use Clerk authentication
  try {
    // Prefer request-bound auth (more reliable in route handlers),
    // fall back to global auth() when request is unavailable
    const authObj = request ? getAuth(request) : await auth();
    const userId = authObj.userId;

    if (!userId) {
      return {
        isValid: false,
        error: 'Unauthorized: No valid authentication token',
      };
    }

    // Get JWT token for Convex with retry logic for transient failures
    const token = await getTokenWithRetry(authObj, 'convex');

    return {
      isValid: true,
      clerkId: userId,
      userId: userId, // Backwards-compat field name
      jwtToken: token || undefined,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
