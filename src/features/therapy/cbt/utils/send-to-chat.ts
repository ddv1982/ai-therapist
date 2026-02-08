import { apiClient } from '@/lib/api/client';
import { ANALYTICAL_MODEL_ID } from '@/features/chat/config';
import { getApiData, type ApiResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';
import type { SessionData } from '@/lib/queries/sessions';
import { buildSessionSummaryCard, type CBTFlowState } from '@/features/therapy/cbt/flow';
import { createBYOKHeaders, getEffectiveModelId } from '@/features/chat/lib/byok-helper';
import type { Locale } from '@/i18n/routing';

export interface SendToChatParams {
  title: string;
  flowState: CBTFlowState;
  contextualMessages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
  model?: string;
  byokKey?: string | null;
  locale?: Locale;
}

export interface SendToChatResult {
  sessionId: string;
}

function mapApiResponse<T>(response: ApiResponse<T>): T {
  const data = getApiData(response);
  if (!data) {
    throw new Error('Missing data in API response');
  }
  return data;
}

function extractReportContentFlexible(resp: unknown): string {
  if (!resp || typeof resp !== 'object') {
    throw new Error('Failed to generate session report');
  }
  const r = resp as { success?: boolean; data?: unknown; reportContent?: unknown };
  if (
    r.success &&
    r.data &&
    typeof (r.data as { reportContent?: unknown }).reportContent === 'string'
  ) {
    return (r.data as { reportContent: string }).reportContent;
  }
  if (typeof r.reportContent === 'string') {
    return r.reportContent;
  }
  throw new Error('Failed to generate session report');
}

export async function sendToChat({
  title,
  flowState,
  contextualMessages,
  model = ANALYTICAL_MODEL_ID,
  byokKey,
  locale = 'en',
}: SendToChatParams): Promise<SendToChatResult> {
  const summaryCard = buildSessionSummaryCard(flowState, locale);
  const now = Date.now();
  let sessionId: string | null = null;

  // Determine effective model: BYOK overrides default model
  const effectiveModelId = getEffectiveModelId(byokKey, model);
  const headers = createBYOKHeaders(byokKey);

  const reportMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }> =
    [
      { role: 'user', content: summaryCard, timestamp: new Date(now).toISOString() },
      ...contextualMessages,
    ];

  try {
    const createdSession = mapApiResponse<any>(
      await apiClient.createSession({ title })
    ) as SessionData;
    sessionId = createdSession.id;

    const reportResponse = await apiClient.generateReportFromContext(
      {
        sessionId,
        contextualMessages: reportMessages,
        model: effectiveModelId,
      },
      { headers }
    );

    const reportContent = extractReportContentFlexible(reportResponse);

    await apiClient.postMessage(sessionId, { role: 'user', content: summaryCard });

    const prefixedReportContent = `📊 **Session Report**\n\n${reportContent}`;
    await apiClient.postMessage(sessionId, {
      role: 'assistant',
      content: prefixedReportContent,
      modelUsed: effectiveModelId,
    });

    logger.info('CBT session exported to chat', { sessionId, title });

    return { sessionId };
  } catch (error) {
    if (sessionId) {
      try {
        await apiClient.deleteSession(sessionId);
        logger.warn('Rolled back incomplete CBT session after failure', {
          sessionId,
          title,
        });
      } catch (cleanupError) {
        logger.error(
          'Failed to clean up CBT session after error',
          { sessionId, title },
          cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError))
        );
      }
    }
    throw error;
  }
}
