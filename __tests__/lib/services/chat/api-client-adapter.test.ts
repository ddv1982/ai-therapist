/**
 * Tests for Chat API Client Adapter
 *
 * Validates the adapter that wraps apiClient for chat services
 */

import { chatApiClientAdapter } from '@/lib/services/chat/api-client-adapter';
import { apiClient } from '@/lib/api/client';

// Mock the apiClient
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    listMessages: jest.fn(),
    postMessage: jest.fn(),
    patchMessageMetadata: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('chatApiClientAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listMessages', () => {
    it('transforms successful response correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'msg-1',
              content: 'Hello',
              role: 'user' as const,
              timestamp: '2024-01-15T10:00:00Z',
              modelUsed: 'gpt-4',
              metadata: { sentiment: 'positive' },
            },
            {
              id: 'msg-2',
              content: 'Hi there!',
              role: 'assistant' as const,
              timestamp: '2024-01-15T10:00:01Z',
              modelUsed: 'gpt-4',
              metadata: null,
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      mockApiClient.listMessages.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.listMessages('session-1', { page: 1 });

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(2);
      expect(result.data?.items[0].id).toBe('msg-1');
      expect(result.data?.items[0].content).toBe('Hello');
      expect(result.data?.items[0].role).toBe('user');
      expect(result.data?.items[0].modelUsed).toBe('gpt-4');
      expect(result.data?.items[0].metadata).toEqual({ sentiment: 'positive' });
      expect(result.data?.items[1].metadata).toBeNull();
      expect(result.data?.pagination).toEqual(mockResponse.data.pagination);
      expect(result.error).toBeUndefined();
    });

    it('handles null response gracefully', async () => {
      mockApiClient.listMessages.mockResolvedValue(null as any);

      const result = await chatApiClientAdapter.listMessages('session-1', { page: 1 });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
    });

    it('handles missing data fields with defaults', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              // Missing id
              content: 'Hello',
              role: 'user' as const,
              // Missing timestamp
            },
          ],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 1,
            totalPages: 1,
          },
        },
      };

      mockApiClient.listMessages.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.listMessages('session-1', { page: 1 });

      expect(result.success).toBe(true);
      expect(result.data?.items[0].id).toBe('');
      expect(result.data?.items[0].modelUsed).toBeNull();
      expect(result.data?.items[0].metadata).toBeNull();
      // Timestamp should fall back to current time
      expect(result.data?.items[0].timestamp).toBeDefined();
    });

    it('maps timestamp from createdAt when timestamp missing', async () => {
      const createdAt = '2024-01-15T12:00:00Z';
      const mockResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'msg-1',
              content: 'Hello',
              role: 'user' as const,
              createdAt,
              // No timestamp field
            },
          ],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 1,
            totalPages: 1,
          },
        },
      };

      mockApiClient.listMessages.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.listMessages('session-1', { page: 1 });

      expect(result.data?.items[0].timestamp).toBe(createdAt);
    });

    it('handles error responses', async () => {
      const mockResponse = {
        success: false,
        error: 'Session not found',
      };

      mockApiClient.listMessages.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.listMessages('session-1', { page: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Session not found');
      expect(result.error?.code).toBeUndefined();
    });

    it('handles error object variations', async () => {
      const mockResponse = {
        success: false,
        error: { code: 404, message: 'Not found' },
      };

      mockApiClient.listMessages.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.listMessages('session-1', { page: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBeDefined();
    });

    it('passes params to apiClient correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      mockApiClient.listMessages.mockResolvedValue(mockResponse as any);

      await chatApiClientAdapter.listMessages('session-123', { page: 2, limit: 20 });

      expect(mockApiClient.listMessages).toHaveBeenCalledWith('session-123', {
        page: 2,
        limit: 20,
      });
    });
  });

  describe('postMessage', () => {
    it('transforms successful message creation', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'msg-new',
          content: 'Hello world',
          role: 'user' as const,
          timestamp: '2024-01-15T10:00:00Z',
          modelUsed: 'gpt-4',
          metadata: { created: true },
        },
      };

      mockApiClient.postMessage.mockResolvedValue(mockResponse);

      const result = await chatApiClientAdapter.postMessage('session-1', {
        content: 'Hello world',
        role: 'user',
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('msg-new');
      expect(result.data?.content).toBe('Hello world');
      expect(result.data?.role).toBe('user');
      expect(result.data?.timestamp).toBe('2024-01-15T10:00:00Z');
      expect(result.data?.modelUsed).toBe('gpt-4');
      expect(result.data?.metadata).toEqual({ created: true });
    });

    it('handles null response', async () => {
      mockApiClient.postMessage.mockResolvedValue(null as any);

      const result = await chatApiClientAdapter.postMessage('session-1', {
        content: 'Test',
        role: 'user',
      });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
    });

    it('maps response fields correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'msg-1',
          content: 'Response content',
          role: 'assistant' as const,
          createdAt: '2024-01-15T10:00:00Z', // Using createdAt instead of timestamp
        },
      };

      mockApiClient.postMessage.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.postMessage('session-1', {
        content: 'Query',
        role: 'user',
      });

      expect(result.data?.timestamp).toBe('2024-01-15T10:00:00Z');
      expect(result.data?.modelUsed).toBeNull();
      expect(result.data?.metadata).toBeNull();
    });

    it('handles error in response', async () => {
      const mockResponse = {
        success: false,
        error: 'Failed to create message',
      };

      mockApiClient.postMessage.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.postMessage('session-1', {
        content: 'Test',
        role: 'user',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to create message');
    });

    it('handles missing id with empty string default', async () => {
      const mockResponse = {
        success: true,
        data: {
          content: 'Test',
          role: 'user' as const,
          // Missing id
        },
      };

      mockApiClient.postMessage.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.postMessage('session-1', {
        content: 'Test',
        role: 'user',
      });

      expect(result.data?.id).toBe('');
    });
  });

  describe('patchMessageMetadata', () => {
    it('transforms successful metadata update', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'msg-1',
          content: 'Original content',
          role: 'assistant' as const,
          timestamp: '2024-01-15T10:00:00Z',
          modelUsed: 'gpt-4',
          metadata: { updated: true, sentiment: 'neutral' },
        },
      };

      mockApiClient.patchMessageMetadata.mockResolvedValue(mockResponse);

      const result = await chatApiClientAdapter.patchMessageMetadata('session-1', 'msg-1', {
        metadata: { updated: true, sentiment: 'neutral' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('msg-1');
      expect(result.data?.metadata).toEqual({ updated: true, sentiment: 'neutral' });
    });

    it('handles partial responses', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'msg-1',
          content: 'Content',
          role: 'user' as const,
          // Missing timestamp, modelUsed, metadata
        },
      };

      mockApiClient.patchMessageMetadata.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.patchMessageMetadata('session-1', 'msg-1', {
        metadata: { test: true },
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('msg-1');
      expect(result.data?.modelUsed).toBeNull();
      expect(result.data?.metadata).toBeNull();
      expect(result.data?.timestamp).toBeDefined();
    });

    it('handles error responses', async () => {
      const mockResponse = {
        success: false,
        error: 'Message not found',
      };

      mockApiClient.patchMessageMetadata.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.patchMessageMetadata('session-1', 'msg-1', {
        metadata: { test: true },
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Message not found');
    });

    it('handles null response', async () => {
      mockApiClient.patchMessageMetadata.mockResolvedValue(null as any);

      const result = await chatApiClientAdapter.patchMessageMetadata('session-1', 'msg-1', {
        metadata: { test: true },
      });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
    });

    it('passes all parameters to apiClient correctly', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'msg-1',
          content: 'Test',
          role: 'user' as const,
          timestamp: '2024-01-15T10:00:00Z',
        },
      };

      mockApiClient.patchMessageMetadata.mockResolvedValue(mockResponse as any);

      const body = { metadata: { custom: 'data', nested: { value: 123 } } };
      await chatApiClientAdapter.patchMessageMetadata('session-xyz', 'msg-abc', body);

      expect(mockApiClient.patchMessageMetadata).toHaveBeenCalledWith(
        'session-xyz',
        'msg-abc',
        body
      );
    });

    it('uses createdAt when timestamp is missing', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'msg-1',
          content: 'Test',
          role: 'user' as const,
          createdAt: '2024-06-15T12:00:00Z',
        },
      };

      mockApiClient.patchMessageMetadata.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.patchMessageMetadata('session-1', 'msg-1', {
        metadata: {},
      });

      expect(result.data?.timestamp).toBe('2024-06-15T12:00:00Z');
    });
  });

  describe('Edge cases', () => {
    it('handles response with success: false but has data', async () => {
      const mockResponse = {
        success: false,
        data: {
          items: [],
          pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        },
        error: 'Partial failure',
      };

      mockApiClient.listMessages.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.listMessages('session-1', { page: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Partial failure');
    });

    it('handles numeric error codes converted to string', async () => {
      const mockResponse = {
        success: false,
        error: 404,
      };

      mockApiClient.listMessages.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.listMessages('session-1', { page: 1 });

      expect(result.error?.message).toBe('404');
    });

    it('handles empty items array', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      mockApiClient.listMessages.mockResolvedValue(mockResponse as any);

      const result = await chatApiClientAdapter.listMessages('session-1', { page: 1 });

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(0);
    });
  });
});
