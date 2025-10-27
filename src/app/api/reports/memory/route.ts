import { NextRequest } from 'next/server';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { validateApiAuth } from '@/lib/api/api-auth';
import { withApiMiddleware, type RequestContext } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse, createAuthenticationErrorResponse, type ApiResponse } from '@/lib/api/api-response';
import { MemoryManagementService } from '@/lib/services/memory-management-service';

type MemoryContextEntry = {
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  content: string;
  summary: string;
};

type MemoryStats = {
  totalReportsFound: number;
  successfullyDecrypted: number;
  failedDecryptions: number;
};

type MemoryData = {
  memoryContext: MemoryContextEntry[];
  reportCount: number;
  stats: MemoryStats;
};

type MemoryReportDetail = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  contentPreview: string;
  keyInsights: string[];
  hasEncryptedContent: boolean;
  reportSize: number;
  fullContent?: string;
  structuredCBTData?: unknown;
};

type MemoryManageData = {
  memoryDetails: MemoryReportDetail[];
  reportCount: number;
  stats: {
    totalReportsFound: number;
    successfullyProcessed: number;
    failedDecryptions: number;
    hasMemory: boolean;
  };
};

type DeleteResponseData = {
  deletedCount: number;
  message: string;
  deletionType: 'specific' | 'recent' | 'all-except-current' | 'all';
};

/**
 * GET /api/reports/memory
 *
 * Retrieves recent session reports for therapeutic memory context.
 * Used by the chat system to provide continuity across sessions.
 *
 * Query Parameters:
 * - limit: Number of reports to retrieve (default: 5, max: 10)
 * - excludeSessionId: Session ID to exclude from results
 * - manage: Set to 'true' for management view with detailed information
 * - includeFullContent: Set to 'true' to include full decrypted content
 */
export const GET = withApiMiddleware<MemoryData | MemoryManageData>(async (request: NextRequest, context: RequestContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const excludeSessionId = searchParams.get('excludeSessionId');
    const manage = searchParams.get('manage') === 'true';
    const includeFullContent = searchParams.get('includeFullContent') === 'true';

    const service = new MemoryManagementService();

    if (manage) {
      // Management mode - return detailed report information
      const data = await service.getMemoryManagement(limit, excludeSessionId, includeFullContent);
      return createSuccessResponse<MemoryManageData>(data, { requestId: context.requestId });
    }

    // Standard memory context mode
    const data = await service.getMemoryContext(limit, excludeSessionId);
    return createSuccessResponse<MemoryData>(data, { requestId: context.requestId });

  } catch (error) {
    logger.error('Error retrieving session reports for memory', {
      ...createRequestLogger(request),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return createErrorResponse(
      'Failed to retrieve memory context',
      500,
      { requestId: context.requestId }
    ) as import('next/server').NextResponse<ApiResponse<MemoryData>>;
  }
});

/**
 * DELETE /api/reports/memory
 *
 * Deletes session reports to clear therapeutic memory context.
 * Requires authentication.
 *
 * Supports various deletion modes:
 * - All memory: no parameters
 * - Specific sessions: ?sessionIds=id1,id2,id3
 * - Recent N reports: ?limit=3
 * - Exclude current: ?excludeSessionId=currentId&limit=N
 */
export const DELETE = withApiMiddleware<DeleteResponseData>(async (request: NextRequest, context: RequestContext) => {
  const requestContext = createRequestLogger(request);

  try {
    // Validate authentication first
    const authResult = await validateApiAuth(request);
    if (!authResult.isValid) {
      logger.warn('Unauthorized memory deletion request', { ...requestContext, error: authResult.error });
      return createAuthenticationErrorResponse(authResult.error || 'Authentication required', context.requestId) as import('next/server').NextResponse<ApiResponse<DeleteResponseData>>;
    }

    const clerkId = (context.userInfo as { clerkId?: string } | undefined)?.clerkId;
    if (!clerkId) {
      return createAuthenticationErrorResponse('Unauthorized', context.requestId) as import('next/server').NextResponse<ApiResponse<DeleteResponseData>>;
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const excludeSessionId = searchParams.get('excludeSessionId');
    const sessionIdsParam = searchParams.get('sessionIds');
    const sessionIds = sessionIdsParam ? sessionIdsParam.split(',') : undefined;

    const service = new MemoryManagementService();
    const result = await service.deleteMemory(clerkId, sessionIds, limit, excludeSessionId);

    return createSuccessResponse<DeleteResponseData>(result, { requestId: context.requestId });

  } catch (error) {
    logger.error('Error deleting memory context', {
      ...createRequestLogger(request),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return createErrorResponse(
      'Failed to delete memory context',
      500,
      { requestId: context.requestId }
    ) as import('next/server').NextResponse<ApiResponse<DeleteResponseData>>;
  }
});
