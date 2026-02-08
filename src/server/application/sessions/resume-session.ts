import type { ConvexHttpClient } from 'convex/browser';
import { anyApi } from '@/lib/convex/http-client';
import type { Principal } from '@/server/domain/auth/principal';
import type { ConvexSession } from '@/types/convex';
import { assertSessionTransition } from '@/server/domain/sessions/session-lifecycle';
import { sessionRepository } from '@/server/infrastructure/repositories/session-repository';

export async function resumeSessionForPrincipal(
  principal: Principal,
  sessionId: string,
  convex: ConvexHttpClient
): Promise<ConvexSession | null> {
  const { valid, session } = await sessionRepository.verifyOwnership(
    sessionId,
    principal.clerkId,
    { includeMessages: false },
    convex
  );

  if (!valid || !session) {
    return null;
  }

  const currentStatus = session.status as 'active' | 'completed';
  assertSessionTransition(currentStatus, 'active');

  const updated = (await convex.mutation(anyApi.sessions.update, {
    sessionId,
    status: 'active',
    endedAt: null,
  })) as ConvexSession;

  await convex.mutation(anyApi.users.setCurrentSession, { sessionId });

  return updated;
}
