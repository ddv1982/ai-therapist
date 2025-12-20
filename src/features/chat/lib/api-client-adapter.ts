/**
 * API Client Adapter
 *
 * Adapts the existing apiClient to the IChatApiClient interface
 * used by the chat services.
 */

import { apiClient } from '@/lib/api/client';
import type { IChatApiClient, SavedMessageResponse } from './types';

/**
 * Adapts the main API client to the IChatApiClient interface.
 * This allows the services to use the existing API client while
 * maintaining a clean, testable interface.
 */
export const chatApiClientAdapter: IChatApiClient = {
  async listMessages(sessionId, params) {
    const response = await apiClient.listMessages(sessionId, params);
    return {
      success: response?.success ?? false,
      data: response?.data
        ? {
            items: response.data.items.map((item) => ({
              id: item.id ?? '',
              content: item.content,
              role: item.role,
              timestamp: item.timestamp ?? item.createdAt ?? new Date().toISOString(),
              modelUsed: (item as { modelUsed?: string | null }).modelUsed ?? null,
              metadata: (item as { metadata?: Record<string, unknown> | null }).metadata ?? null,
            })),
            pagination: response.data.pagination,
          }
        : undefined,
      error:
        response && 'error' in response && response.error
          ? { message: String(response.error), code: undefined }
          : undefined,
    };
  },

  async postMessage(sessionId, body) {
    const response = await apiClient.postMessage(sessionId, body);
    return {
      success: response?.success ?? false,
      data: response?.data
        ? ({
            id: response.data.id ?? '',
            content: response.data.content,
            role: response.data.role,
            timestamp:
              response.data.timestamp ?? response.data.createdAt ?? new Date().toISOString(),
            modelUsed: (response.data as { modelUsed?: string | null }).modelUsed ?? null,
            metadata:
              (response.data as { metadata?: Record<string, unknown> | null }).metadata ?? null,
          } as SavedMessageResponse)
        : undefined,
      error:
        response && 'error' in response && response.error
          ? { message: String(response.error), code: undefined }
          : undefined,
    };
  },

  async patchMessageMetadata(sessionId, messageId, body) {
    const response = await apiClient.patchMessageMetadata(sessionId, messageId, body);
    return {
      success: response?.success ?? false,
      data: response?.data
        ? ({
            id: response.data.id ?? '',
            content: response.data.content,
            role: response.data.role,
            timestamp:
              response.data.timestamp ?? response.data.createdAt ?? new Date().toISOString(),
            modelUsed: (response.data as { modelUsed?: string | null }).modelUsed ?? null,
            metadata:
              (response.data as { metadata?: Record<string, unknown> | null }).metadata ?? null,
          } as SavedMessageResponse)
        : undefined,
      error:
        response && 'error' in response && response.error
          ? { message: String(response.error), code: undefined }
          : undefined,
    };
  },
};
