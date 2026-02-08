import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import type { ReportMessage } from '@/lib/api/groq-client';
import { logger } from '@/lib/utils/logger';
import { reportGenerationWithContextSchema, validateRequest } from '@/lib/utils/validation';
import { deduplicateRequest } from '@/lib/utils/helpers';
import { withAuth, type AuthenticatedRequestContext } from '@/lib/api/api-middleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/api/api-response';
import { ReportGenerationService } from '@/features/therapy/lib/report-generation-service';
import { verifySessionOwnership } from '@/lib/repositories/session-repository';
import { getAuthenticatedConvexClient } from '@/lib/convex/http-client';
import { extractBYOKKey, BYOK_OPENAI_MODEL } from '@/features/chat/lib/byok-helper';
import { MODEL_IDS } from '@/ai/model-metadata';
import { languageModels } from '@/ai/providers';

// Allow report generation up to 5 minutes (reasoning models can be slow)
export const maxDuration = 300;

export const POST = withAuth(async (request: NextRequest, context: AuthenticatedRequestContext) => {
  try {
    const convex = getAuthenticatedConvexClient(context.jwtToken);
    const { ANALYTICAL_MODEL_ID } = await import('@/features/chat/config');

    const body = await request.json();
    const validation = validateRequest(reportGenerationWithContextSchema, body);
    if (!validation.success) {
      logger.validationError('/api/reports/generate-context', validation.error, context);
      return createErrorResponse('Validation failed', 400, {
        code: 'VALIDATION_ERROR',
        details: validation.error,
        requestId: context.requestId,
      });
    }

    const { sessionId, contextualMessages, model: requestedModel } = validation.data;
    const byokApiKey = extractBYOKKey(request.headers);

    let modelToUse;
    let effectiveModelId: string;
    let selectionReason: string;

    if (byokApiKey) {
      const userOpenAI = createOpenAI({ apiKey: byokApiKey });
      modelToUse = userOpenAI(BYOK_OPENAI_MODEL);
      effectiveModelId = MODEL_IDS.byok;
      selectionReason = requestedModel
        ? 'BYOK key provided, model override ignored in favor of user OpenAI model'
        : 'BYOK key provided, using user OpenAI model';
    } else {
      const selectedModelId = requestedModel ?? ANALYTICAL_MODEL_ID;
      const selectedModel = languageModels[selectedModelId];

      if (!selectedModel) {
        return createErrorResponse('Invalid model selection', 400, {
          code: 'INVALID_MODEL',
          details: `Model "${selectedModelId}" is not supported for report generation`,
          suggestedAction: `Use one of: ${Object.keys(languageModels).join(', ')}`,
          requestId: context.requestId,
        });
      }

      modelToUse = selectedModel;
      effectiveModelId = selectedModelId;
      selectionReason = requestedModel
        ? 'Client model override accepted'
        : 'No model override provided, using default analytical model';
    }

    logger.info('Contextual report generation request received', {
      ...context,
      requestedModel: requestedModel ?? null,
      modelUsed: effectiveModelId,
      selectionReason,
    });

    const clerkId = context.principal.clerkId;
    const { valid } = await verifySessionOwnership(sessionId, clerkId, {}, convex);

    if (!valid) {
      logger.warn('Unauthorized contextual report generation attempt', {
        ...context,
        sessionId,
        clerkId,
      });
      return createErrorResponse('Session not found or access denied', 404, {
        requestId: context.requestId,
      });
    }

    const normalizedMessages = contextualMessages
      .filter(
        (msg): msg is { role: 'user' | 'assistant'; content: string; timestamp?: string } =>
          (msg.role === 'user' || msg.role === 'assistant') && msg.content.trim().length > 0
      )
      .map((msg) => ({ role: msg.role, content: msg.content }));

    if (normalizedMessages.length === 0) {
      return createErrorResponse('No reportable messages found for this session', 422, {
        code: 'NO_REPORTABLE_MESSAGES',
        requestId: context.requestId,
      });
    }

    return await deduplicateRequest(
      clerkId,
      'generate_report_with_context',
      async () => {
        const { getApiRequestLocale } = await import('@/i18n/request');
        const locale = getApiRequestLocale(request);
        const service = new ReportGenerationService(modelToUse, effectiveModelId, convex);
        const result = await service.generateReport(
          sessionId,
          normalizedMessages as ReportMessage[],
          locale
        );

        return createSuccessResponse(result, { requestId: context.requestId });
      },
      sessionId,
      300000
    );
  } catch (error) {
    logger.apiError('/api/reports/generate-context', error as Error, context);
    return createErrorResponse('Failed to generate report', 500, { requestId: context.requestId });
  }
});
