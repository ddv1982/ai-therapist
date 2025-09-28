import { apiClient } from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/api-response';
import type { components } from '@/types/api.generated';

export async function listMessages(sessionId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<components['schemas']['Message']>>> {
  return apiClient.listMessages(sessionId, params);
}

export async function postMessage(sessionId: string, body: { role: 'user' | 'assistant'; content: string; modelUsed?: string; metadata?: Record<string, unknown> }): Promise<ApiResponse<components['schemas']['Message']>> {
  return apiClient.postMessage(sessionId, body);
}

export async function patchMessageMetadata(
  sessionId: string,
  messageId: string,
  body: { metadata: Record<string, unknown>; mergeStrategy?: 'merge' | 'replace' }
): Promise<ApiResponse<components['schemas']['Message']>> {
  return apiClient.patchMessageMetadata(sessionId, messageId, body);
}


