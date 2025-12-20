/**
 * Tests for MessagePersistenceService
 */

import { MessagePersistenceService } from '@/features/chat/lib/message-persistence.service';
import type { IChatApiClient } from '@/features/chat/lib/types';

describe('MessagePersistenceService', () => {
  let service: MessagePersistenceService;
  let mockApiClient: jest.Mocked<IChatApiClient>;

  beforeEach(() => {
    mockApiClient = {
      listMessages: jest.fn(),
      postMessage: jest.fn(),
      patchMessageMetadata: jest.fn(),
    };
    service = new MessagePersistenceService({ apiClient: mockApiClient });
  });

  describe('loadMessages', () => {
    it('should return messages on successful load', async () => {
      mockApiClient.listMessages.mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 'msg-1',
              content: 'Hello',
              role: 'user',
              timestamp: '2024-01-01T00:00:00Z',
              modelUsed: null,
              metadata: null,
            },
          ],
        },
      });

      const result = await service.loadMessages('session-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.messages).toHaveLength(1);
        expect(result.data.messages[0].id).toBe('msg-1');
        expect(result.data.messages[0].content).toBe('Hello');
      }
    });

    it('should return error on failed load', async () => {
      mockApiClient.listMessages.mockResolvedValue({
        success: false,
        error: { message: 'Failed to load' },
      });

      const result = await service.loadMessages('session-1');

      expect(result.success).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.listMessages.mockRejectedValue(new Error('Network error'));

      const result = await service.loadMessages('session-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Network error');
      }
    });
  });

  describe('saveMessage', () => {
    it('should save a message successfully', async () => {
      mockApiClient.postMessage.mockResolvedValue({
        success: true,
        data: {
          id: 'msg-new',
          content: 'Test message',
          role: 'user',
          timestamp: '2024-01-01T00:00:00Z',
          modelUsed: null,
          metadata: null,
        },
      });

      const result = await service.saveMessage('session-1', {
        role: 'user',
        content: 'Test message',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.savedMessage.id).toBe('msg-new');
      }
    });

    it('should return error on save failure', async () => {
      mockApiClient.postMessage.mockResolvedValue({
        success: false,
        error: { message: 'Save failed' },
      });

      const result = await service.saveMessage('session-1', {
        role: 'user',
        content: 'Test message',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('transformApiMessage', () => {
    it('should transform API message to UI format', () => {
      const apiMessage = {
        id: 'msg-1',
        content: 'Hello',
        role: 'user' as const,
        timestamp: '2024-01-01T12:00:00Z',
        modelUsed: 'gpt-4',
        metadata: { key: 'value' },
      };

      const result = service.transformApiMessage(apiMessage);

      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Hello');
      expect(result.role).toBe('user');
      expect(result.modelUsed).toBe('gpt-4');
      expect(result.metadata).toEqual({ key: 'value' });
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle missing modelUsed', () => {
      const apiMessage = {
        id: 'msg-1',
        content: 'Hello',
        role: 'assistant' as const,
        timestamp: '2024-01-01T12:00:00Z',
        modelUsed: null,
        metadata: null,
      };

      const result = service.transformApiMessage(apiMessage);

      expect(result.modelUsed).toBeUndefined();
      expect(result.metadata).toBeUndefined();
    });
  });

  describe('generateTempId', () => {
    it('should generate unique temp IDs', () => {
      const id1 = service.generateTempId();
      const id2 = service.generateTempId();

      expect(id1).toMatch(/^temp-/);
      expect(id2).toMatch(/^temp-/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('isTempId', () => {
    it('should identify temp IDs correctly', () => {
      expect(service.isTempId('temp-123-abc')).toBe(true);
      expect(service.isTempId('msg-123')).toBe(false);
      expect(service.isTempId('uuid-temp-suffix')).toBe(false);
    });
  });
});
