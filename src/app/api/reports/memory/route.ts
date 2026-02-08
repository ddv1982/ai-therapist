import { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { withAuth, type AuthenticatedRequestContext } from '@/lib/api/api-middleware';
import {
  createSuccessResponse,
  createErrorResponse,
  type ApiResponse,
} from '@/lib/api/api-response';
import { MemoryManagementService } from '@/features/chat/lib/memory-management-service';
import { getAuthenticatedConvexClient } from '@/lib/convex/http-client';
import { ErrorCode } from '@/lib/errors/error-codes';
import type { MemoryData, MemoryManageData, DeleteResponseData } from '@/types';

function parseIntParam<T>(
  raw: string | null,
  name: string,
  requestId: string,
  min: number,
  max: number
) {
  if (raw === null) return { ok: true as const, value: undefined as number | undefined };
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return {
      ok: false as const,
      response: createErrorResponse(`Invalid ${name} query parameter`, 400, {
        code: ErrorCode.INVALID_INPUT,
        details: `${name} must be an integer between ${min} and ${max}`,
        suggestedAction: `Provide a valid \`${name}\` value in the query string`,
        requestId,
      }) as import('next/server').NextResponse<ApiResponse<T>>,
    };
  }
  return { ok: true as const, value: parsed };
}

/**
 * GET /api/reports/memory
 *
 * Retrieves recent session reports for therapeutic memory context.
 * Used by the chat system to provide continuity across sessions.
 * Requires authentication.
 *
 * Query Parameters:
 * - limit: Number of reports to retrieve (default: 5, max: 10)
 * - excludeSessionId: Session ID to exclude from results
 * - manage: Set to 'true' for management view with detailed information
 * - includeFullContent: Set to 'true' to include full decrypted content
 */
export const GET = withAuth<MemoryData | MemoryManageData>(
  async (request: NextRequest, context: AuthenticatedRequestContext) => {
    try {
      const clerkId = context.principal.clerkId;

      const { searchParams } = new URL(request.url);
      const limitParsed = parseIntParam<MemoryData | MemoryManageData>(
        searchParams.get('limit'),
        'limit',
        context.requestId,
        1,
        20
      );
      if (!limitParsed.ok) {
        return limitParsed.response;
      }
      const limit = limitParsed.value ?? 5;
      const excludeSessionId = searchParams.get('excludeSessionId');
      const manage = searchParams.get('manage') === 'true';
      const includeFullContent = searchParams.get('includeFullContent') === 'true';

      const convex = getAuthenticatedConvexClient(context.jwtToken);
      const service = new MemoryManagementService(convex);

      if (manage) {
        // Management mode - return detailed report information
        const data = await service.getMemoryManagement(
          clerkId,
          limit,
          excludeSessionId,
          includeFullContent
        );
        return createSuccessResponse<MemoryManageData>(data, { requestId: context.requestId });
      }

      // Standard memory context mode
      const data = await service.getMemoryContext(clerkId, limit, excludeSessionId);
      return createSuccessResponse<MemoryData>(data, { requestId: context.requestId });
    } catch (error) {
      logger.error('Error retrieving session reports for memory', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return createErrorResponse('Failed to retrieve memory context', 500, {
        requestId: context.requestId,
      }) as import('next/server').NextResponse<ApiResponse<MemoryData | MemoryManageData>>;
    }
  }
);

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
export const DELETE = withAuth<DeleteResponseData>(
  async (request: NextRequest, context: AuthenticatedRequestContext) => {
    try {
      const clerkId = context.principal.clerkId;

      const { searchParams } = new URL(request.url);
      const limitParsed = parseIntParam<DeleteResponseData>(
        searchParams.get('limit'),
        'limit',
        context.requestId,
        1,
        1000
      );
      if (!limitParsed.ok) {
        return limitParsed.response;
      }
      const limit = limitParsed.value;
      const excludeSessionId = searchParams.get('excludeSessionId');
      const sessionIdsParam = searchParams.get('sessionIds');
      const sessionIds = sessionIdsParam ? sessionIdsParam.split(',') : undefined;

      const convex = getAuthenticatedConvexClient(context.jwtToken);
      const service = new MemoryManagementService(convex);
      const result = await service.deleteMemory(clerkId, sessionIds, limit, excludeSessionId);

      return createSuccessResponse<DeleteResponseData>(result, { requestId: context.requestId });
    } catch (error) {
      logger.error('Error deleting memory context', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return createErrorResponse('Failed to delete memory context', 500, {
        requestId: context.requestId,
      }) as import('next/server').NextResponse<ApiResponse<DeleteResponseData>>;
    }
  }
);
