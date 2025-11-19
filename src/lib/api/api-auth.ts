import { auth, getAuth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export interface AuthValidationResult {
  isValid: boolean;
  userId?: string;
  clerkId?: string;
  error?: string;
}

/**
 * Validate authentication for API routes using Clerk
 * Can be called with or without a request parameter (request param is ignored for Clerk)
 * Clerk's auth() function works in route handlers
 */
export async function validateApiAuth(request?: NextRequest): Promise<AuthValidationResult> {
  // Use Clerk authentication
  try {
    // Prefer request-bound auth (more reliable in route handlers),
    // fall back to global auth() when request is unavailable
    const userId = request ? getAuth(request).userId : (await auth()).userId;

    if (!userId) {
      return {
        isValid: false,
        error: 'Unauthorized: No valid authentication token',
      };
    }

    return {
      isValid: true,
      clerkId: userId,
      userId: userId, // Backwards-compat field name
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
