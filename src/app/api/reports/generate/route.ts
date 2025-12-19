import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { type ReportMessage } from '@/lib/api/groq-client';
import { logger } from '@/lib/utils/logger';
import { reportGenerationSchema, validateRequest } from '@/lib/utils/validation';
import { deduplicateRequest } from '@/lib/utils/helpers';
import { withAuth, type AuthenticatedRequestContext } from '@/lib/api/api-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/api-response';
import { ReportGenerationService } from '@/lib/services/report-generation-service';
import { verifySessionOwnership } from '@/lib/repositories/session-repository';
import { getAuthenticatedConvexClient } from '@/lib/convex/http-client';
import { extractBYOKKey, BYOK_OPENAI_MODEL } from '@/lib/chat/byok-helper';
import { MODEL_IDS } from '@/ai/model-metadata';
import { languageModels } from '@/ai/providers';

// Allow report generation up to 2 minutes (reasoning models can be slow)
export const maxDuration = 120;

export const POST = withAuth(async (request: NextRequest, context: AuthenticatedRequestContext) => {
  try {
    const convex = getAuthenticatedConvexClient(context.jwtToken);
    const { REPORT_MODEL_ID } = await import('@/features/chat/config');

    // Check for BYOK key - user's own OpenAI API key
    const byokApiKey = extractBYOKKey(request.headers);

    // Determine model to use: BYOK overrides default
    let modelToUse;
    let effectiveModelId: string;

    if (byokApiKey) {
      const userOpenAI = createOpenAI({ apiKey: byokApiKey });
      modelToUse = userOpenAI(BYOK_OPENAI_MODEL);
      effectiveModelId = MODEL_IDS.byok;
      logger.info('BYOK key detected for report generation, using user OpenAI model', {
        ...context,
        modelUsed: effectiveModelId,
      });
    } else {
      modelToUse = languageModels[REPORT_MODEL_ID as keyof typeof languageModels];
      effectiveModelId = REPORT_MODEL_ID;
    }

    logger.info('Report generation request received', {
      ...context,
      modelUsed: effectiveModelId,
      selectionReason: byokApiKey
        ? 'BYOK key provided, using user OpenAI model'
        : 'Report generation requires analytical model',
      reportGenerationFlow: true,
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

    // Verify session ownership before generating report
    const userInfo = context.userInfo as { userId: string; clerkId?: string };
    const clerkId = userInfo.clerkId || userInfo.userId;
    const hasAccess = await verifySessionOwnership(sessionId, clerkId, {}, convex);

    if (!hasAccess) {
      logger.warn('Unauthorized report generation attempt', {
        ...context,
        sessionId,
        clerkId,
      });
      return createErrorResponse('Session not found or access denied', 404, {
        requestId: context.requestId,
      });
    }

    // Deduplicate report generation to prevent multiple concurrent generations
    return await deduplicateRequest(
      sessionId,
      'generate_report',
      async () => {
        // Get locale for report prompt
        const { getApiRequestLocale } = await import('@/i18n/request');
        const locale = getApiRequestLocale(request);

        // Use service layer to generate report with model instance and ID
        const service = new ReportGenerationService(modelToUse, effectiveModelId, convex);
        const result = await service.generateReport(sessionId, messages as ReportMessage[], locale);

        return createSuccessResponse(result, { requestId: context.requestId });
      },
      undefined,
      120000 // 2 minute TTL for report generation deduplication (reasoning models can be slow)
    );
  } catch (error) {
    logger.apiError('/api/reports/generate', error as Error, context);
    return createErrorResponse('Failed to generate report', 500, { requestId: context.requestId });
  }
});
