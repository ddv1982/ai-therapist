/**
 * User Repository
 *
 * Data access layer for user-related Convex operations.
 * Encapsulates all user queries and mutations from the frontend.
 */

import { getSingleUserInfo } from '@/lib/auth/user-session';
import { getConvexHttpClient, api } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';

/**
 * Ensure a user exists in the database, creating if necessary
 */
export async function ensureUserExists(userInfo: ReturnType<typeof getSingleUserInfo>): Promise<boolean> {
  try {
    const client = getConvexHttpClient();
    await client.mutation(api.users.getOrCreate, {
      legacyId: userInfo.userId,
      email: userInfo.email,
      name: userInfo.name,
    });
    return true;
  } catch (error) {
    logger.databaseError('ensure user exists', toError(error), {
      userId: userInfo.userId,
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
