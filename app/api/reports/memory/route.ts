import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger, createRequestLogger } from '@/lib/logger';

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
    
    // Get recent session reports, excluding current session if specified
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
    
    // Format reports for memory context
    const memoryContext = reports.map(report => ({
      sessionTitle: report.session.title,
      sessionDate: report.session.startedAt.toISOString().split('T')[0],
      reportDate: report.createdAt.toISOString().split('T')[0],
      content: report.reportContent,
      summary: report.reportContent.length > 500 
        ? report.reportContent.substring(0, 500) + '...'
        : report.reportContent
    }));
    
    logger.info('Session reports retrieved successfully', {
      ...requestContext,
      reportCount: reports.length,
      totalMemoryLength: memoryContext.reduce((acc, r) => acc + r.content.length, 0)
    });
    
    return NextResponse.json({
      success: true,
      memoryContext,
      reportCount: reports.length
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
        success: false
      },
      { status: 500 }
    );
  }
}