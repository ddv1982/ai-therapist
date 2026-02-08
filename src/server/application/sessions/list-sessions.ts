import type { ConvexHttpClient } from 'convex/browser';
import type { ConvexSession } from '@/types/convex';
import type { Principal } from '@/server/domain/auth/principal';
import { sessionRepository } from '@/server/infrastructure/repositories/session-repository';

export interface ListSessionsOptions {
  limit?: number;
  cursor?: string;
}

export async function listSessionsForPrincipal(
  principal: Principal,
  options: ListSessionsOptions,
  convex: ConvexHttpClient
) {
  const result = await sessionRepository.listByUser(principal.clerkId, options, convex);

  const items = (Array.isArray(result.items) ? result.items : []).map((session: ConvexSession) => ({
    id: session._id,
    userId: principal.clerkId,
    title: session.title,
    status: session.status,
    startedAt: new Date(session.startedAt),
    updatedAt: new Date(session.updatedAt),
    endedAt: session.endedAt ? new Date(session.endedAt) : null,
    _count: { messages: session.messageCount ?? 0 },
  }));

  return {
    items,
    pagination: result.pagination,
  };
}
