import { NextRequest } from 'next/server';
import { getConvexHttpClient, anyApi } from '@/lib/convex/httpClient';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { decryptSessionReportContent } from '@/lib/chat/message-encryption';
import { validateApiAuth } from '@/lib/api/api-auth';
import { withApiMiddleware, type RequestContext } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse, createAuthenticationErrorResponse, type ApiResponse } from '@/lib/api/api-response';

/**
 * Create therapeutic summary from structured session report data
 */
function createTherapeuticSummary(
  keyPoints: unknown,
  therapeuticInsights: unknown,
  patternsIdentified: unknown,
  decryptedContent: string
): string {
  const summaryParts: string[] = [];
  
  // Extract key points if available
  if (Array.isArray(keyPoints) && keyPoints.length > 0) {
    const pointsText = keyPoints
      .filter(point => typeof point === 'string')
      .slice(0, 3) // Limit to top 3 points
      .join('; ');
    if (pointsText) summaryParts.push(`Key insights: ${pointsText}`);
  }
  
  // Extract therapeutic insights
  if (therapeuticInsights && typeof therapeuticInsights === 'object') {
    const insights = therapeuticInsights as Record<string, unknown>;
    if (insights.primaryInsights && Array.isArray(insights.primaryInsights)) {
      const insightsText = insights.primaryInsights
        .filter(insight => typeof insight === 'string')
        .slice(0, 2)
        .join('; ');
      if (insightsText) summaryParts.push(`Therapeutic focus: ${insightsText}`);
    }
    
    if (insights.growthAreas && Array.isArray(insights.growthAreas)) {
      const growthText = insights.growthAreas
        .filter(area => typeof area === 'string')
        .slice(0, 2)
        .join('; ');
      if (growthText) summaryParts.push(`Growth areas: ${growthText}`);
    }
  }
  
  // Extract patterns if available
  if (Array.isArray(patternsIdentified) && patternsIdentified.length > 0) {
    const patternsText = patternsIdentified
      .filter(pattern => typeof pattern === 'string')
      .slice(0, 2)
      .join('; ');
    if (patternsText) summaryParts.push(`Patterns identified: ${patternsText}`);
  }
  
  // If we have structured summary, return it
  if (summaryParts.length > 0) {
    return summaryParts.join('. ');
  }
  
  // Fallback to content truncation if no structured data
  return decryptedContent.length > 500 
    ? decryptedContent.substring(0, 500) + '...'
    : decryptedContent;
}

/**
 * GET /api/reports/memory
 * 
 * Retrieves recent session reports for therapeutic memory context.
 * Used by the chat system to provide continuity across sessions.
 */
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

// Management view types (consolidated from memory/manage)
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

/**
 * Handle memory management mode - consolidated from /memory/manage
 */
async function handleMemoryManagement(
  context: RequestContext, 
  requestContext: Record<string, unknown>,
  limit: number,
  excludeSessionId: string | null,
  includeFullContent: boolean
) {
  logger.info('Memory management request received', requestContext);
  const client = getConvexHttpClient();
  const limited = await client.query(anyApi.reports.listRecent, {
    limit: Math.min(limit, 20),
    excludeSessionId: excludeSessionId ? (excludeSessionId as any) : undefined,
  });
  const limitedReports = Array.isArray(limited) ? (limited as any[]) : [];
  
  logger.info('Found session reports for memory management', {
    ...requestContext,
    reportCount: limitedReports.length
  });
  
  // Process reports with detailed information for management
  const memoryDetails: MemoryReportDetail[] = [];
  let successfulReports = 0;
  let failedDecryptions = 0;
  
  for (const report of limitedReports) {
    try {
      // Attempt to decrypt content for preview and optionally full content
      let contentPreview = '';
      let fullContent: string | undefined = undefined;
      let hasEncryptedContent = false;
      
      try {
        const decryptedContent = decryptSessionReportContent(report.reportContent);
        contentPreview = decryptedContent.length > 200 
          ? decryptedContent.substring(0, 200) + '...'
          : decryptedContent;
        
        // Include full content if requested
        if (includeFullContent) {
          fullContent = decryptedContent;
        }
        
        hasEncryptedContent = true;
        successfulReports++;
      } catch {
        // Use structured data as fallback
        contentPreview = 'Encrypted content (unable to decrypt for preview)';
        hasEncryptedContent = false;
        failedDecryptions++;
      }
      
      // Extract key insights from structured data
      const keyInsights: string[] = [];
      
      if (Array.isArray(report.keyPoints)) {
        const points = (report.keyPoints as unknown[]).filter((point): point is string => typeof point === 'string');
        keyInsights.push(...points.slice(0, 3));
      }
      
      if (report.therapeuticInsights && typeof report.therapeuticInsights === 'object') {
        const insights = report.therapeuticInsights as Record<string, unknown>;
        if (Array.isArray(insights.primaryInsights)) {
          keyInsights.push(...insights.primaryInsights.filter(i => typeof i === 'string').slice(0, 2));
        }
      }
      
      const session = await client.query(anyApi.sessions.get, { sessionId: (report as any).sessionId });
      const reportDetail: MemoryReportDetail = {
        id: String((report as any)._id),
        sessionId: String((report as any).sessionId),
        sessionTitle: (session as any)?.title ?? 'Session',
        sessionDate: session ? new Date((session as any).startedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        reportDate: new Date((report as any).createdAt).toISOString().split('T')[0],
        contentPreview,
        keyInsights: keyInsights.slice(0, 5), // Limit to top 5 insights
        hasEncryptedContent,
        reportSize: report.reportContent.length
      };
      
      // Include full content and structured data if requested
      if (includeFullContent) {
        if (fullContent !== undefined) {
          reportDetail.fullContent = fullContent;
        }
        
        // Include structured CBT data if available
        if (report.therapeuticInsights && typeof report.therapeuticInsights === 'object') {
          const insights = report.therapeuticInsights as Record<string, unknown>;
          if (insights.structuredAssessment) {
            reportDetail.structuredCBTData = insights.structuredAssessment;
          }
        }
      }
      
      memoryDetails.push(reportDetail);
      
    } catch (error) {
      logger.warn('Failed to process session report for management', {
        ...requestContext,
        reportId: report.id.substring(0, 8),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      continue;
    }
  }
  
  logger.info('Memory management processing completed', {
    ...requestContext,
    totalReports: limitedReports.length,
    successfulReports,
    failedDecryptions,
    memoryDetailsCount: memoryDetails.length
  });
  
  return createSuccessResponse<MemoryManageData>({
    memoryDetails,
    reportCount: memoryDetails.length,
    stats: {
      totalReportsFound: limitedReports.length,
      successfullyProcessed: successfulReports,
      failedDecryptions: failedDecryptions,
      hasMemory: memoryDetails.length > 0,
    }
  }, { requestId: context.requestId });
}

export const GET = withApiMiddleware<MemoryData | MemoryManageData>(async (request: NextRequest, context: RequestContext) => {
  const requestContext = createRequestLogger(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const excludeSessionId = searchParams.get('excludeSessionId');
    const manage = searchParams.get('manage') === 'true'; // New parameter for management view
    const includeFullContent = searchParams.get('includeFullContent') === 'true';
    
    if (manage) {
      // Management mode - return detailed report information
      return await handleMemoryManagement(context, requestContext, limit, excludeSessionId, includeFullContent);
    }

    // Standard memory context mode
    logger.info('Retrieving session reports for memory context', {
      ...requestContext,
      limit,
      excludeSessionId
    });
    
    const client = getConvexHttpClient();
    const reports = await client.query(anyApi.reports.listRecent, {
      limit: Math.min(limit, 10),
      excludeSessionId: excludeSessionId ? (excludeSessionId as any) : undefined,
    });
    
    logger.info('Found session reports for memory processing', {
      ...requestContext,
      reportCount: (reports as any[]).length,
      reportIds: (reports as any[]).map((r: any) => String(r._id).substring(0, 8))
    });
    
    // Process reports with graceful error handling
    const memoryContext: MemoryContextEntry[] = [];
    let successfulReports = 0;
    let failedDecryptions = 0;
    
    for (const report of (reports as any[])) {
      try {
        // Attempt to decrypt the report content
        const decryptedContent = decryptSessionReportContent((report as any).reportContent);
        
        // Create intelligent therapeutic summary from structured data
        const summary = createTherapeuticSummary(
          (report as any).keyPoints,
          (report as any).therapeuticInsights,
          (report as any).patternsIdentified,
          decryptedContent
        );
        
        memoryContext.push({
          sessionTitle: report.session.title,
          sessionDate: report.session.startedAt.toISOString().split('T')[0],
          reportDate: report.createdAt.toISOString().split('T')[0],
          content: decryptedContent,
          summary: summary
        });
        
        successfulReports++;
        
        logger.info('Successfully processed session report for memory', {
          ...requestContext,
          reportId: String((report as any)._id).substring(0, 8),
          sessionTitle: 'Session',
          summaryLength: summary.length,
          hasStructuredData: !!((report as any).keyPoints || (report as any).therapeuticInsights || (report as any).patternsIdentified)
        });
        
      } catch (decryptionError) {
        // Log the error but continue processing other reports
        failedDecryptions++;
        logger.warn('Failed to decrypt session report, skipping', {
          ...requestContext,
          reportId: String((report as any)._id).substring(0, 8),
          sessionTitle: 'Session',
          error: decryptionError instanceof Error ? decryptionError.message : 'Unknown decryption error'
        });
        
        // Continue with next report instead of breaking entire memory context
        continue;
      }
    }
    
    logger.info('Memory context processing completed', {
      ...requestContext,
      totalReports: reports.length,
      successfulReports,
      failedDecryptions,
      memoryContextSize: memoryContext.length,
      totalMemoryLength: memoryContext.reduce((acc, r) => acc + r.content.length, 0),
      totalSummaryLength: memoryContext.reduce((acc, r) => acc + r.summary.length, 0)
    });
    
    return createSuccessResponse<MemoryData>({
      memoryContext,
      reportCount: memoryContext.length,
      stats: {
        totalReportsFound: (reports as any[]).length,
        successfullyDecrypted: successfulReports,
        failedDecryptions: failedDecryptions,
      },
    }, { requestId: context.requestId });
    
  } catch (error) {
    logger.error('Error retrieving session reports for memory', {
      ...requestContext,
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
 * Supports various deletion modes:
 * - All memory: no parameters
 * - Specific sessions: ?sessionIds=id1,id2,id3
 * - Recent N reports: ?limit=3
 * - Exclude current: ?excludeSessionId=currentId&limit=N
 */
type DeleteResponseData = {
  deletedCount: number;
  message: string;
  deletionType: 'specific' | 'recent' | 'all-except-current' | 'all';
};

export const DELETE = withApiMiddleware<DeleteResponseData>(async (request: NextRequest, context: RequestContext) => {
  const requestContext = createRequestLogger(request);
  
  try {
    // Validate authentication first
    const authResult = await validateApiAuth(request);
    if (!authResult.isValid) {
      logger.warn('Unauthorized memory deletion request', { ...requestContext, error: authResult.error });
      return createAuthenticationErrorResponse(authResult.error || 'Authentication required', context.requestId) as import('next/server').NextResponse<ApiResponse<DeleteResponseData>>;
    }
    
    logger.info('Memory deletion request received', requestContext);
    
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const excludeSessionId = searchParams.get('excludeSessionId');
    const sessionIdsParam = searchParams.get('sessionIds');
    const sessionIds = sessionIdsParam ? sessionIdsParam.split(',') : undefined;
    
    let deletionDescription = '';
    
    const client = getConvexHttpClient();
    const userId = context.userInfo?.userId;
    if (!userId) {
      return createAuthenticationErrorResponse('Unauthorized', context.requestId) as import('next/server').NextResponse<ApiResponse<DeleteResponseData>>;
    }

    const user = await client.query(anyApi.users.getByLegacyId, { legacyId: userId });
    if (!user) return createAuthenticationErrorResponse('Unauthorized', context.requestId) as import('next/server').NextResponse<ApiResponse<DeleteResponseData>>;
    const sessions = await client.query(anyApi.sessions.listByUser, { userId: (user as any)._id });
    const allReports: any[] = [];
    for (const s of (Array.isArray(sessions) ? sessions : [])) {
      const rs = await client.query(anyApi.reports.listBySession, { sessionId: (s as any)._id });
      for (const r of (rs as any[])) allReports.push(r);
    }
    let toDelete: string[] = [];
    if (sessionIds && sessionIds.length > 0) {
      toDelete = allReports.filter(r => sessionIds.includes(String(r.sessionId))).map(r => String(r._id));
      deletionDescription = `specific sessions: ${sessionIds.join(', ')}`;
    } else if (limit) {
      const filtered = excludeSessionId ? allReports.filter(r => String(r.sessionId) !== excludeSessionId) : allReports;
      const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
      toDelete = sorted.slice(0, limit).map(r => String(r._id));
      deletionDescription = `${toDelete.length} recent reports${excludeSessionId ? ` (excluding current session)` : ''}`;
    } else if (excludeSessionId) {
      toDelete = allReports.filter(r => String(r.sessionId) !== excludeSessionId).map(r => String(r._id));
      deletionDescription = 'all memory (excluding current session)';
    } else {
      toDelete = allReports.map(r => String(r._id));
      deletionDescription = 'all memory';
    }
    
    logger.info('Executing memory deletion', {
      ...requestContext,
      deletionDescription,
      candidateCount: toDelete.length,
    });

    // Execute the deletion
    let deletedCount = 0;
    if (toDelete.length > 0) {
      const deletionResult = await client.mutation(anyApi.reports.removeMany, { ids: toDelete as any });
      deletedCount = (deletionResult as { count?: number })?.count ?? toDelete.length;
    }

    logger.info('Memory deletion completed successfully', {
      ...requestContext,
      deletionDescription,
      deletedCount,
    });

    return createSuccessResponse<DeleteResponseData>({
      deletedCount,
      message: `Successfully deleted ${deletedCount} session reports (${deletionDescription})`,
      deletionType: sessionIds ? 'specific' : limit ? 'recent' : excludeSessionId ? 'all-except-current' : 'all',
    }, { requestId: context.requestId });
    
  } catch (error) {
    logger.error('Error deleting memory context', {
      ...requestContext,
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
