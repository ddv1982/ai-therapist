import { auth } from '@clerk/nextjs/server';
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
export async function validateApiAuth(_request?: NextRequest): Promise<AuthValidationResult> {
  try {
    // Get the current user from Clerk
    // This works in route handlers via the clerkMiddleware
    const { userId } = await auth();

    if (!userId) {
      return {
        isValid: false,
        error: 'Unauthorized: No valid authentication token',
      };
    }

    return {
      isValid: true,
      clerkId: userId,
      userId: userId, // For backward compatibility
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
