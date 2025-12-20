'use server';

import { validateApiAuth } from '@/lib/api/api-auth';
import { MemoryManagementService } from '@/features/chat/lib/memory-management-service';
import { getAuthenticatedConvexClient } from '@/lib/convex/http-client';
import { revalidatePath } from 'next/cache';

export type DeletionMode = 'specific' | 'recent' | 'all-except-current' | 'all';

export interface DeleteMemoryOptions {
  limit?: number;
  excludeSessionId?: string;
  sessionIds?: string[];
}

/**
 * Server Action: Delete session reports from therapeutic memory.
 * 
 * Provides a type-safe way to clear memory context with progressive enhancement.
 */
export async function deleteMemoryAction(options: DeleteMemoryOptions = {}) {
  const { limit, excludeSessionId, sessionIds } = options;
  
  // 1. Validate Authentication
  const auth = await validateApiAuth();
  if (!auth.isValid || !auth.clerkId || !auth.jwtToken) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // 2. Initialize Convex Client and Service
    const convex = getAuthenticatedConvexClient(auth.jwtToken);
    const service = new MemoryManagementService(convex);

    // 3. Perform Deletion
    const result = await service.deleteMemory(
      auth.clerkId,
      sessionIds,
      limit,
      excludeSessionId
    );

    // 4. Revalidate cache
    revalidatePath('/reports');
    
    return { 
      success: true, 
      data: {
        deletedCount: result.deletedCount,
        message: result.message,
        deletionType: result.deletionType as DeletionMode
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete memory' 
    };
  }
}
