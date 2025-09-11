import { apiClient } from '@/lib/api/client';
import { getApiData, type ApiResponse } from '@/lib/api/api-response';
import type { components } from '@/types/api.generated';

export interface SendToChatParams {
  title: string;
  cbtSummaryCard: string;
  contextualMessages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
  model?: string;
}

export interface SendToChatResult {
  sessionId: string;
}

export async function sendToChat({ title, cbtSummaryCard, contextualMessages, model = 'openai/gpt-oss-120b' }: SendToChatParams): Promise<SendToChatResult> {
  // Create a new session for the CBT send
  const createResp = await apiClient.createSession({ title });
  if (!createResp || !createResp.success || !createResp.data) throw new Error('Failed to create a new session for CBT');
  const newSession = createResp.data as components['schemas']['Session'];
  const sessionId = newSession.id;

  // Generate report
  const reportData = await apiClient.generateReportDetailed({
    sessionId,
    messages: [{ role: 'user', content: cbtSummaryCard, timestamp: new Date().toISOString() }, ...contextualMessages],
    model
  });
  if (!(reportData as { success?: boolean; reportContent?: string }).success || !(reportData as { reportContent?: string }).reportContent) {
    throw new Error('Failed to generate session report');
  }
  const therapeuticAnalysis = (reportData as { reportContent: string }).reportContent;

  // Save summary and analysis
  const summaryResponse: ApiResponse<components['schemas']['Message']> = await apiClient.postMessage(sessionId, { role: 'user', content: cbtSummaryCard });
  getApiData(summaryResponse);

  const prefixedReportContent = `📊 **Session Report**\n\n${therapeuticAnalysis}`;
  const analysisMessageResponse: ApiResponse<components['schemas']['Message']> = await apiClient.postMessage(sessionId, { role: 'assistant', content: prefixedReportContent, modelUsed: model });
  getApiData(analysisMessageResponse);

  return { sessionId };
}

