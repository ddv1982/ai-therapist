import { apiClient } from '@/lib/api/client';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/api-response';
import type { components } from '@/types/api.generated';

export async function listMessages(sessionId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<components['schemas']['Message']>>> {
  return apiClient.listMessages(sessionId, params);
}

export async function postMessage(sessionId: string, body: { role: 'user' | 'assistant'; content: string; modelUsed?: string }): Promise<ApiResponse<components['schemas']['Message']>> {
  return apiClient.postMessage(sessionId, body);
}


