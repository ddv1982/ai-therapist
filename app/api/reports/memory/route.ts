import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger, createRequestLogger } from '@/lib/logger';
import { decryptSessionReportContent } from '@/lib/message-encryption';

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
export async function GET(request: NextRequest) {
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
    const memoryContext = [];
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
    
    return NextResponse.json({
      success: true,
      memoryContext,
      reportCount: memoryContext.length,
      stats: {
        totalReportsFound: reports.length,
        successfullyDecrypted: successfulReports,
        failedDecryptions: failedDecryptions
      }
    });
    
  } catch (error) {
    logger.error('Error retrieving session reports for memory', {
      ...requestContext,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve memory context',
        success: false,
        memoryContext: [] // Return empty context instead of undefined
      },
      { status: 500 }
    );
  }
}