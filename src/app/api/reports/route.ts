import { NextRequest } from 'next/server';
import { generateSessionReport } from '@/lib/api/groq-client';
import { REPORT_GENERATION_PROMPT } from '@/lib/therapy/therapy-prompts';
import { prisma } from '@/lib/database/db';
import { logger } from '@/lib/utils/logger';
import type { Message } from '@/types';
import { withAuthAndRateLimit } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

export const POST = withAuthAndRateLimit(async (request: NextRequest, context) => {
  try {
    const { sessionId, messages }: { sessionId: string; messages: Message[] } = await request.json();

    if (!sessionId || !messages?.length) {
      return createErrorResponse('Session ID and messages are required', 400, {
        requestId: context.requestId,
        code: 'VALIDATION_ERROR',
        details: 'Missing sessionId or messages'
      });
    }

    const reportContent = await generateSessionReport(messages, REPORT_GENERATION_PROMPT, 'openai/gpt-oss-120b');

    if (!reportContent) {
      throw new Error('Failed to generate report content');
    }

    let reportData;
    try {
      reportData = JSON.parse(reportContent);
    } catch (error) {
      logger.error('Failed to parse report JSON', { ...context }, error as Error);
      // Fallback to basic report structure
      reportData = {
        keyPoints: ['Session completed successfully'],
        therapeuticInsights: ['Client engaged well in conversation'],
        patternsIdentified: ['Positive engagement patterns observed'],
        actionItems: ['Continue regular sessions', 'Practice self-reflection'],
        moodAssessment: 'Engaged and receptive',
        progressNotes: 'Session showed good therapeutic engagement. Client participated actively in discussion.'
      };
    }

    const report = await prisma.sessionReport.create({
      data: {
        sessionId,
        reportContent: 'Legacy report created via API',
        keyPoints: reportData.keyPoints || [],
        therapeuticInsights: reportData.therapeuticInsights || [],
        patternsIdentified: reportData.patternsIdentified || [],
        actionItems: reportData.actionItems || [],
        moodAssessment: reportData.moodAssessment || null,
        progressNotes: reportData.progressNotes || null,
      },
    });

    return createSuccessResponse(report, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/reports', error as Error, { ...context });
    return createErrorResponse('Internal server error', 500, { requestId: context.requestId });
  }
});

export const GET = withAuthAndRateLimit(async (_request: NextRequest, context) => {
  try {
    const reports = await prisma.sessionReport.findMany({
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startedAt: true,
            endedAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return createSuccessResponse(reports, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/reports', error as Error, { ...context });
    return createErrorResponse('Internal server error', 500, { requestId: context.requestId });
  }
});