import type { ConvexHttpClient } from 'convex/browser';
import { anyApi } from '@/lib/convex/http-client';
import type { Principal } from '@/server/domain/auth/principal';
import type { ConvexSession, ConvexUser } from '@/types/convex';

export async function setCurrentSessionPointer(
  principal: Principal,
  sessionId: string,
  convex: ConvexHttpClient
): Promise<ConvexSession | null> {
  const user = (await convex.query(anyApi.users.getByClerkId, {
    clerkId: principal.clerkId,
  })) as ConvexUser | null;

  if (!user?._id) {
    return null;
  }

  // This query enforces ownership in Convex. If it fails, caller maps to 404.
  const session = (await convex.query(anyApi.sessions.get, {
    sessionId,
  })) as ConvexSession | null;

  if (!session) {
    return null;
  }

  await convex.mutation(anyApi.users.setCurrentSession, { sessionId });

  return session;
}
