import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database/db';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { decryptSessionReportContent } from '@/lib/chat/message-encryption';
import { withAuth, type AuthenticatedRequestContext } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse, type ApiResponse } from '@/lib/api/api-response';

/**
 * GET /api/reports/memory/manage
 * 
 * Retrieves detailed session report information for memory management.
 * Shows titles, dates, content summaries for user to make informed deletion decisions.
 */

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

export const GET = withAuth<MemoryManageData>(async (request: NextRequest, context: AuthenticatedRequestContext) => {
  const requestContext = createRequestLogger(request);
  
  try {
    logger.info('Memory management request received', requestContext);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const excludeSessionId = searchParams.get('excludeSessionId');
    const includeFullContent = searchParams.get('includeFullContent') === 'true';
    
    // Get detailed session reports for management
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
      take: Math.min(limit, 20) // Cap at 20 reports for performance
    });
    
    logger.info('Found session reports for memory management', {
      ...requestContext,
      reportCount: reports.length
    });
    
    // Process reports with detailed information for management
    const memoryDetails: MemoryReportDetail[] = [];
    let successfulReports = 0;
    let failedDecryptions = 0;
    
    for (const report of reports) {
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
          
          logger.warn('Failed to decrypt report content for preview', {
            ...requestContext,
            reportId: report.id.substring(0, 8)
          });
        }
        
        // Extract key insights from structured data
        const keyInsights: string[] = [];
        
        if (Array.isArray(report.keyPoints)) {
          keyInsights.push(...report.keyPoints.filter(p => typeof p === 'string').slice(0, 3));
        }
        
        if (report.therapeuticInsights && typeof report.therapeuticInsights === 'object') {
          const insights = report.therapeuticInsights as Record<string, unknown>;
          if (Array.isArray(insights.primaryInsights)) {
            keyInsights.push(...insights.primaryInsights.filter(i => typeof i === 'string').slice(0, 2));
          }
        }
        
        const reportDetail: MemoryReportDetail = {
          id: report.id,
          sessionId: report.sessionId,
          sessionTitle: report.session.title,
          sessionDate: report.session.startedAt.toISOString().split('T')[0],
          reportDate: report.createdAt.toISOString().split('T')[0],
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
              logger.info('Including structured CBT data in report detail', {
                ...requestContext,
                reportId: report.id.substring(0, 8),
                hasCBTData: true,
                cbtDataKeys: Object.keys(insights.structuredAssessment as Record<string, unknown>),
                cbtDataSize: JSON.stringify(insights.structuredAssessment).length
              });
            } else {
              logger.info('No structured CBT data found in therapeutic insights', {
                ...requestContext,
                reportId: report.id.substring(0, 8),
                hasTherapeuticInsights: true,
                insightKeys: Object.keys(insights)
              });
            }
          } else {
            logger.info('No therapeutic insights found for report', {
              ...requestContext,
              reportId: report.id.substring(0, 8),
              hasTherapeuticInsights: false
            });
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
      totalReports: reports.length,
      successfulReports,
      failedDecryptions,
      memoryDetailsCount: memoryDetails.length
    });
    
    return createSuccessResponse<MemoryManageData>({
      memoryDetails,
      reportCount: memoryDetails.length,
      stats: {
        totalReportsFound: reports.length,
        successfullyProcessed: successfulReports,
        failedDecryptions: failedDecryptions,
        hasMemory: memoryDetails.length > 0,
      }
    }, { requestId: context.requestId });
    
  } catch (error) {
    logger.error('Error retrieving memory management data', {
      ...requestContext,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return createErrorResponse(
      'Failed to retrieve memory management data',
      500,
      { requestId: context.requestId }
    ) as import('next/server').NextResponse<ApiResponse<MemoryManageData>>;
  }
})