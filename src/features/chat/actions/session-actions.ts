'use server';

import { validateApiAuth } from '@/lib/api/api-auth';
import { getAuthenticatedConvexClient, anyApi } from '@/lib/convex/http-client';
import { revalidatePath } from 'next/cache';
import { createSessionSchema } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { SessionCache } from '@/lib/cache';

export interface CreateSessionOptions {
  title: string;
}

/**
 * Server Action: Create a new chat session.
 */
export async function createSessionAction(options: CreateSessionOptions) {
  // 1. Validate Input
  const result = createSessionSchema.safeParse(options);
  if (!result.success) {
    return { success: false, error: 'Invalid input: ' + result.error.message };
  }
  const { title } = result.data;

  // 2. Validate Authentication
  const auth = await validateApiAuth();
  if (!auth.isValid || !auth.clerkId || !auth.jwtToken) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const convex = getAuthenticatedConvexClient(auth.jwtToken);

    // 3. Ensure User Exists
    const user = await convex.mutation(anyApi.users.ensureByClerkId, {
      clerkId: auth.clerkId,
      email: '', // Webhook handles this, action uses minimal lookup
      name: undefined,
    });

    // 4. Create Session
    const session = await convex.mutation(anyApi.sessions.create, {
      userId: user._id,
      title,
    });

    // 5. Cache & Revalidate
    await SessionCache.set(session._id, {
      id: session._id,
      userId: auth.clerkId,
      title: session.title,
      status: session.status,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    });

    revalidatePath('/');
    
    return { 
      success: true, 
      data: {
        id: session._id,
        title: session.title,
        createdAt: new Date(session.createdAt).toISOString(),
        updatedAt: new Date(session.updatedAt).toISOString(),
        messageCount: session.messageCount ?? 0,
      }
    };
  } catch (error) {
    logger.error('Failed to create session via Server Action', { error });
    return { success: false, error: 'Failed to create session' };
  }
}

/**
 * Server Action: Delete a chat session.
 */
export async function deleteSessionAction(sessionId: string) {
  // 1. Validate Authentication
  const auth = await validateApiAuth();
  if (!auth.isValid || !auth.clerkId || !auth.jwtToken) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const convex = getAuthenticatedConvexClient(auth.jwtToken);

    // 2. Perform Deletion
    await convex.mutation(anyApi.sessions.remove, { sessionId: sessionId as any });

    // 3. Clear Cache & Revalidate
    await SessionCache.invalidate(sessionId);
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete session via Server Action', { error, sessionId });
    return { success: false, error: 'Failed to delete session' };
  }
}
