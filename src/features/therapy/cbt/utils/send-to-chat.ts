import { apiClient } from '@/lib/api/client';
import { ANALYTICAL_MODEL_ID } from '@/features/chat/config';
import { getApiData, type ApiResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';
import type { components } from '@/types/api.generated';
import { buildSessionSummaryCard, type CBTFlowState } from '@/features/therapy/cbt/flow';

export interface SendToChatParams {
  title: string;
  flowState: CBTFlowState;
  contextualMessages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
  model?: string;
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
  if (r.success && r.data && typeof (r.data as { reportContent?: unknown }).reportContent === 'string') {
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
}: SendToChatParams): Promise<SendToChatResult> {
  const summaryCard = buildSessionSummaryCard(flowState);
  const now = Date.now();

  const reportMessages = [
    { role: 'user' as const, content: summaryCard, timestamp: new Date(now).toISOString() },
    ...contextualMessages,
  ];

  const createdSession = mapApiResponse<components['schemas']['Session']>(
    await apiClient.createSession({ title }),
  );
  const sessionId = createdSession.id;

  const reportResponse = await apiClient.generateReportDetailed({
    sessionId,
    messages: reportMessages,
    model,
  });

  const reportContent = extractReportContentFlexible(reportResponse);

  await apiClient.postMessage(sessionId, { role: 'user', content: summaryCard });

  const prefixedReportContent = `📊 **Session Report**\n\n${reportContent}`;
  await apiClient.postMessage(sessionId, {
    role: 'assistant',
    content: prefixedReportContent,
    modelUsed: model,
  });

  logger.info('CBT session exported to chat', { sessionId, title });

  return { sessionId };
}
