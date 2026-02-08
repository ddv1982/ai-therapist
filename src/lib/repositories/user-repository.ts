/**
 * User Repository
 *
 * Data access layer for user-related Convex operations.
 * Encapsulates all user queries and mutations from the frontend.
 */

import type { ConvexHttpClient } from 'convex/browser';
import { getSingleUserInfo } from '@/lib/auth/user-session';
import { getConvexHttpClient, api } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';

/**
 * Ensure a user exists in the database, creating if necessary
 */
export async function ensureUserExists(
  userInfo: ReturnType<typeof getSingleUserInfo> & { clerkId: string },
  client?: ConvexHttpClient
): Promise<boolean> {
  try {
    const convex = client ?? getConvexHttpClient();
    await convex.mutation(api.users.ensureByClerkId, {
      clerkId: userInfo.clerkId,
      email: userInfo.email,
      name: userInfo.name,
    });
    return true;
  } catch (error) {
    logger.databaseError('ensure user exists', toError(error), {
      userId: userInfo.clerkId,
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
