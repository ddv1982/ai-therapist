/**
 * Tests for useChatPersistence Hook
 *
 * Tests the chat persistence hook that handles loading and saving
 * messages to the database.
 */

import { renderHook, act } from '@testing-library/react';
import { useChatPersistence } from '../use-chat-persistence';
import { MessagePersistenceService } from '@/features/chat/lib/message-persistence.service';

// Mock dependencies
jest.mock('@/features/chat/lib/message-persistence.service');
jest.mock('@/features/chat/lib/api-client-adapter', () => ({
  chatApiClientAdapter: {},
}));
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('useChatPersistence', () => {
  const mockLoadMessages = jest.fn();
  const mockSaveMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (MessagePersistenceService as jest.Mock).mockImplementation(() => ({
      loadMessages: mockLoadMessages,
      saveMessage: mockSaveMessage,
    }));
  });

  describe('initialization', () => {
    it('should initialize with hasSession false when sessionId is null', () => {
      const { result } = renderHook(() => useChatPersistence(null));

      expect(result.current.hasSession).toBe(false);
    });

    it('should initialize with hasSession true when sessionId is provided', () => {
      const { result } = renderHook(() => useChatPersistence('session-123'));

      expect(result.current.hasSession).toBe(true);
    });

    it('should initialize with hasSession false when sessionId is empty string', () => {
      const { result } = renderHook(() => useChatPersistence(''));

      expect(result.current.hasSession).toBe(false);
    });
  });

  describe('loadMessages', () => {
    it('should return empty messages array when sessionId is null', async () => {
      const { result } = renderHook(() => useChatPersistence(null));

      let loadResult: Awaited<ReturnType<typeof result.current.loadMessages>>;
      await act(async () => {
        loadResult = await result.current.loadMessages();
      });

      expect(loadResult!.success).toBe(true);
      expect(loadResult!.messages).toEqual([]);
      expect(mockLoadMessages).not.toHaveBeenCalled();
    });

    it('should load messages successfully when sessionId is valid', async () => {
      const mockMessages = [
        { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Hi', timestamp: new Date() },
      ];

      mockLoadMessages.mockResolvedValueOnce({
        success: true,
        data: { messages: mockMessages },
      });

      const { result } = renderHook(() => useChatPersistence('session-123'));

      let loadResult: Awaited<ReturnType<typeof result.current.loadMessages>>;
      await act(async () => {
        loadResult = await result.current.loadMessages();
      });

      expect(loadResult!.success).toBe(true);
      expect(loadResult!.messages).toHaveLength(2);
      expect(mockLoadMessages).toHaveBeenCalledWith('session-123');
    });

    it('should handle load error gracefully', async () => {
      mockLoadMessages.mockResolvedValueOnce({
        success: false,
        error: { message: 'Failed to load' },
      });

      const { result } = renderHook(() => useChatPersistence('session-123'));

      let loadResult: Awaited<ReturnType<typeof result.current.loadMessages>>;
      await act(async () => {
        loadResult = await result.current.loadMessages();
      });

      expect(loadResult!.success).toBe(false);
      expect(loadResult!.error).toBe('Failed to load');
      expect(loadResult!.messages).toEqual([]);
    });

    it('should handle exception during load', async () => {
      mockLoadMessages.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChatPersistence('session-123'));

      let loadResult: Awaited<ReturnType<typeof result.current.loadMessages>>;
      await act(async () => {
        loadResult = await result.current.loadMessages();
      });

      expect(loadResult!.success).toBe(false);
      expect(loadResult!.error).toBe('Network error');
    });
  });

  describe('saveMessage', () => {
    it('should return error when sessionId is null', async () => {
      const { result } = renderHook(() => useChatPersistence(null));

      let saveResult: Awaited<ReturnType<typeof result.current.saveMessage>>;
      await act(async () => {
        saveResult = await result.current.saveMessage({
          role: 'user',
          content: 'Hello',
        });
      });

      expect(saveResult!.success).toBe(false);
      expect(saveResult!.error).toContain('No session ID');
      expect(mockSaveMessage).not.toHaveBeenCalled();
    });

    it('should save message successfully when sessionId is valid', async () => {
      const savedMessage = {
        id: 'msg-123',
        role: 'user',
        content: 'Hello',
        timestamp: new Date().toISOString(),
      };

      mockSaveMessage.mockResolvedValueOnce({
        success: true,
        data: { savedMessage },
      });

      const { result } = renderHook(() => useChatPersistence('session-123'));

      let saveResult: Awaited<ReturnType<typeof result.current.saveMessage>>;
      await act(async () => {
        saveResult = await result.current.saveMessage({
          role: 'user',
          content: 'Hello',
        });
      });

      expect(saveResult!.success).toBe(true);
      expect(saveResult!.savedMessage).toBeDefined();
      expect(saveResult!.savedMessage!.content).toBe('Hello');
    });

    it('should save message with metadata', async () => {
      const savedMessage = {
        id: 'msg-123',
        role: 'user',
        content: 'Hello',
        timestamp: new Date().toISOString(),
        metadata: { type: 'cbt-entry' },
      };

      mockSaveMessage.mockResolvedValueOnce({
        success: true,
        data: { savedMessage },
      });

      const { result } = renderHook(() => useChatPersistence('session-123'));

      let saveResult: Awaited<ReturnType<typeof result.current.saveMessage>>;
      await act(async () => {
        saveResult = await result.current.saveMessage({
          role: 'user',
          content: 'Hello',
          metadata: { type: 'cbt-entry' },
        });
      });

      expect(saveResult!.success).toBe(true);
      expect(mockSaveMessage).toHaveBeenCalledWith('session-123', {
        role: 'user',
        content: 'Hello',
        modelUsed: undefined,
        metadata: { type: 'cbt-entry' },
      });
    });

    it('should handle save error gracefully', async () => {
      mockSaveMessage.mockResolvedValueOnce({
        success: false,
        error: { message: 'Save failed' },
      });

      const { result } = renderHook(() => useChatPersistence('session-123'));

      let saveResult: Awaited<ReturnType<typeof result.current.saveMessage>>;
      await act(async () => {
        saveResult = await result.current.saveMessage({
          role: 'assistant',
          content: 'Response',
          modelUsed: 'gpt-4',
        });
      });

      expect(saveResult!.success).toBe(false);
      expect(saveResult!.error).toBe('Save failed');
    });

    it('should handle exception during save', async () => {
      mockSaveMessage.mockRejectedValueOnce(new Error('Database error'));

      const { result } = renderHook(() => useChatPersistence('session-123'));

      let saveResult: Awaited<ReturnType<typeof result.current.saveMessage>>;
      await act(async () => {
        saveResult = await result.current.saveMessage({
          role: 'user',
          content: 'Hello',
        });
      });

      expect(saveResult!.success).toBe(false);
      expect(saveResult!.error).toBe('Database error');
    });
  });

  describe('sessionId changes', () => {
    it('should update hasSession when sessionId changes', () => {
      const { result, rerender } = renderHook(
        (sessionId: string | null) => useChatPersistence(sessionId),
        { initialProps: null as string | null }
      );

      expect(result.current.hasSession).toBe(false);

      rerender('session-123');

      expect(result.current.hasSession).toBe(true);

      rerender(null);

      expect(result.current.hasSession).toBe(false);
    });
  });
});
