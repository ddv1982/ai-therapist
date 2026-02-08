import type { ConvexHttpClient } from 'convex/browser';
import { anyApi } from '@/lib/convex/http-client';
import { getTrustedClerkProfile } from '@/lib/auth/clerk-profile';
import { deduplicateRequest } from '@/lib/utils/helpers';
import { SessionCache } from '@/lib/cache';
import { ErrorCode } from '@/lib/errors/error-codes';
import type { ConvexSession, ConvexUser } from '@/types/convex';
import type { Principal } from '@/server/domain/auth/principal';

export interface CreateSessionFailure {
  status: 503;
  message: string;
  code: string;
  details: string;
  suggestedAction: string;
}

export interface CreateSessionForPrincipalInput {
  principal: Principal;
  title: string;
  convex: ConvexHttpClient;
}

export interface CreateSessionForPrincipalSuccess {
  session: ConvexSession;
  principal: Principal & { userId: string };
}

async function resolveUserForSession(
  principal: Principal,
  convex: ConvexHttpClient
): Promise<ConvexUser | null> {
  let user = (await convex.query(anyApi.users.getByClerkId, {
    clerkId: principal.clerkId,
  })) as ConvexUser | null;

  if (user) {
    return user;
  }

  const profile = await getTrustedClerkProfile(principal.clerkId);
  if (!profile?.email) {
    return null;
  }

  user = (await convex.mutation(anyApi.users.ensureByClerkId, {
    clerkId: principal.clerkId,
    email: profile.email,
    name: profile.name,
  })) as ConvexUser | null;

  return user;
}

export async function createSessionForPrincipal(
  input: CreateSessionForPrincipalInput
): Promise<CreateSessionForPrincipalSuccess | CreateSessionFailure> {
  const { principal, title, convex } = input;
  const user = await resolveUserForSession(principal, convex);

  if (!user?._id) {
    return {
      status: 503,
      message: 'Unable to create session at this time',
      code: ErrorCode.SERVICE_UNAVAILABLE,
      details: 'Unable to resolve a trusted user profile',
      suggestedAction: 'Please try again in a moment',
    };
  }

  const session = (await deduplicateRequest(
    principal.clerkId,
    'create_session',
    async () =>
      (await convex.mutation(anyApi.sessions.create, {
        userId: user._id,
        title,
      })) as ConvexSession,
    title,
    10000
  )) as ConvexSession;

  await SessionCache.set(session._id, {
    id: session._id,
    userId: principal.clerkId,
    title: session.title,
    status: session.status as 'active' | 'completed',
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
  });

  return {
    session,
    principal: {
      ...principal,
      userId: user._id,
    },
  };
}
