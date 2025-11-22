import { auth, getAuth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export interface AuthValidationResult {
  isValid: boolean;
  userId?: string;
  clerkId?: string;
  jwtToken?: string;
  error?: string;
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

    // Get JWT token for Convex - must specify template name
    const token = await authObj.getToken({ template: 'convex' });

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
