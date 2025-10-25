import { NextRequest } from 'next/server';
import { type ReportMessage } from '@/lib/api/groq-client';
import { logger } from '@/lib/utils/logger';
import { reportGenerationSchema, validateRequest } from '@/lib/utils/validation';
import { deduplicateRequest } from '@/lib/utils/request-deduplication';
import { withApiMiddleware } from '@/lib/api/api-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/api-response';
import { ReportGenerationService } from '@/lib/services/report-generation-service';

export const POST = withApiMiddleware(async (request: NextRequest, context) => {
  try {
    // Always use analytical model for detailed session reports
    const { REPORT_MODEL_ID } = await import('@/features/chat/config');

    logger.info('Report generation request received', {
      ...context,
      modelUsed: REPORT_MODEL_ID,
      selectionReason: 'Report generation requires analytical model',
      reportGenerationFlow: true
    });

    const body = await request.json();

    // Validate request body using proper schema
    const validation = validateRequest(reportGenerationSchema, body);
    if (!validation.success) {
      logger.validationError('/api/reports/generate', validation.error, context);
      return createErrorResponse('Validation failed', 400, {
        code: 'VALIDATION_ERROR',
        details: validation.error,
        requestId: context.requestId,
      });
    }

    const { sessionId, messages } = validation.data;

    // Deduplicate report generation to prevent multiple concurrent generations
    return await deduplicateRequest(
      sessionId,
      'generate_report',
      async () => {
        // Get locale for report prompt
        const { getApiRequestLocale } = await import('@/i18n/request');
        const locale = getApiRequestLocale(request);

        // Use service layer to generate report
        const service = new ReportGenerationService(REPORT_MODEL_ID);
        const result = await service.generateReport(sessionId, messages as ReportMessage[], locale);

        return createSuccessResponse(result, { requestId: context.requestId });
      },
      undefined,
      30000 // 30 second TTL for report generation deduplication
    );

  } catch (error) {
    logger.apiError('/api/reports/generate', error as Error, context);
    return createErrorResponse('Failed to generate report', 500, { requestId: context.requestId });
  }
});