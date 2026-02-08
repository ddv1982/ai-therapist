/**
 * User Repository
 *
 * Data access layer for user-related Convex operations.
 * Encapsulates all user queries and mutations from the frontend.
 */

import type { ConvexHttpClient } from 'convex/browser';
import { getConvexHttpClient, api } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';

export interface TrustedUserProfileInput {
  clerkId: string;
  email: string;
  name?: string;
}

/**
 * Ensure a user exists in the database, creating if necessary
 */
export async function ensureUserExists(
  profile: TrustedUserProfileInput,
  client?: ConvexHttpClient
): Promise<boolean> {
  try {
    const convex = client ?? getConvexHttpClient();
    await convex.mutation(api.users.ensureByClerkId, {
      clerkId: profile.clerkId,
      email: profile.email,
      name: profile.name,
    });
    return true;
  } catch (error) {
    logger.databaseError('ensure user exists', toError(error), {
      userId: profile.clerkId,
    });
    return false;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
