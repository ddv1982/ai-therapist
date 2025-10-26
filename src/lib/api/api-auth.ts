import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export interface AuthValidationResult {
  isValid: boolean;
  userId?: string;
  clerkId?: string;
  error?: string;
}

/**
 * Validate authentication for API routes using Clerk
 * Clerk middleware already protects the routes, this is a fallback check
 */
export async function validateApiAuth(request: NextRequest): Promise<AuthValidationResult> {
  try {
    // Clerk injects auth context via middleware
    // This function is a fallback for explicit auth validation in API routes
    const auth = await getAuth(request);

    if (!auth.userId) {
      return {
        isValid: false,
        error: 'Unauthorized: No valid authentication token',
      };
    }

    return {
      isValid: true,
      clerkId: auth.userId,
      userId: auth.userId, // For backward compatibility
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
