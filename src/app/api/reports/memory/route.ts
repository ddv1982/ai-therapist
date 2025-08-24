import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database/db';
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

export const GET = withApiMiddleware<MemoryData>(async (request: NextRequest, context: RequestContext) => {
  const requestContext = createRequestLogger(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const excludeSessionId = searchParams.get('excludeSessionId');
    
    logger.info('Retrieving session reports for memory context', {
      ...requestContext,
      limit,
      excludeSessionId
    });
    
    // Get recent session reports with structured data, excluding current session if specified
    const reports = await prisma.sessionReport.findMany({
      where: excludeSessionId ? {
        sessionId: {
          not: excludeSessionId
        }
      } : undefined,
      select: {
        id: true,
        sessionId: true,
        reportContent: true,
        keyPoints: true,
        therapeuticInsights: true,
        patternsIdentified: true,
        createdAt: true,
        session: {
          select: {
            title: true,
            startedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.min(limit, 10) // Cap at 10 reports max for performance
    });
    
    logger.info('Found session reports for memory processing', {
      ...requestContext,
      reportCount: reports.length,
      reportIds: reports.map(r => r.id.substring(0, 8))
    });
    
    // Process reports with graceful error handling
    const memoryContext: MemoryContextEntry[] = [];
    let successfulReports = 0;
    let failedDecryptions = 0;
    
    for (const report of reports) {
      try {
        // Attempt to decrypt the report content
        const decryptedContent = decryptSessionReportContent(report.reportContent);
        
        // Create intelligent therapeutic summary from structured data
        const summary = createTherapeuticSummary(
          report.keyPoints,
          report.therapeuticInsights,
          report.patternsIdentified,
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
          reportId: report.id.substring(0, 8),
          sessionTitle: report.session.title,
          summaryLength: summary.length,
          hasStructuredData: !!(report.keyPoints || report.therapeuticInsights || report.patternsIdentified)
        });
        
      } catch (decryptionError) {
        // Log the error but continue processing other reports
        failedDecryptions++;
        logger.warn('Failed to decrypt session report, skipping', {
          ...requestContext,
          reportId: report.id.substring(0, 8),
          sessionTitle: report.session.title,
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
        totalReportsFound: reports.length,
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
    
    let deletionCriteria: Record<string, unknown> = {};
    let deletionDescription = '';
    
    if (sessionIds && sessionIds.length > 0) {
      // Delete specific session reports
      deletionCriteria = {
        sessionId: {
          in: sessionIds
        }
      };
      deletionDescription = `specific sessions: ${sessionIds.join(', ')}`;
    } else if (limit) {
      // Delete recent N reports (optionally excluding current session)
      const reportsToDelete = await prisma.sessionReport.findMany({
        where: excludeSessionId ? {
          sessionId: {
            not: excludeSessionId
          }
        } : undefined,
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      
      if (reportsToDelete.length === 0) {
        logger.info('No reports found to delete', { ...requestContext, limit, excludeSessionId });
        return createSuccessResponse<DeleteResponseData>({
          deletedCount: 0,
          message: 'No reports found matching deletion criteria',
          deletionType: limit ? 'recent' : excludeSessionId ? 'all-except-current' : 'all',
        }, { requestId: context.requestId });
      }
      
      deletionCriteria = {
        id: {
          in: reportsToDelete.map(r => r.id)
        }
      };
      deletionDescription = `${reportsToDelete.length} recent reports${excludeSessionId ? ` (excluding current session)` : ''}`;
    } else if (excludeSessionId) {
      // Delete all memory except current session
      deletionCriteria = {
        sessionId: {
          not: excludeSessionId
        }
      };
      deletionDescription = 'all memory (excluding current session)';
    } else {
      // Delete all memory
      deletionCriteria = {};
      deletionDescription = 'all memory';
    }
    
    logger.info('Executing memory deletion', {
      ...requestContext,
      deletionDescription,
      criteria: deletionCriteria
    });
    
    // Execute the deletion
    const deleteResult = await prisma.sessionReport.deleteMany({
      where: deletionCriteria
    });
    
    logger.info('Memory deletion completed successfully', {
      ...requestContext,
      deletionDescription,
      deletedCount: deleteResult.count
    });
    
    return createSuccessResponse<DeleteResponseData>({
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} session reports (${deletionDescription})`,
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