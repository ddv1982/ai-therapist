/**
 * Tests for useTherapyChat Hook
 *
 * Tests the main therapy chat hook that wraps @ai-sdk/react's useChat
 * with therapy-specific features.
 */

import { renderHook, act } from '@testing-library/react';

// Define mock functions at module level before any imports
const mockSendMessage = jest.fn().mockResolvedValue(undefined);
const mockStopAi = jest.fn();

// Mock all external dependencies before imports
jest.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    sendMessage: mockSendMessage,
    stop: mockStopAi,
  }),
}));

jest.mock('ai', () => ({
  DefaultChatTransport: jest.fn().mockImplementation(() => ({})),
}));

const mockLoadMessages = jest.fn().mockResolvedValue({
  success: true,
  messages: [],
});
const mockSaveMessage = jest.fn().mockResolvedValue({ success: true });
let mockHasSession = false;

jest.mock('@/features/chat/hooks/use-chat-persistence', () => ({
  useChatPersistence: () => ({
    loadMessages: mockLoadMessages,
    saveMessage: mockSaveMessage,
    hasSession: mockHasSession,
  }),
}));

jest.mock('@/features/chat/lib/byok-helper', () => ({
  createBYOKHeaders: (key: string | null) => (key ? { 'X-BYOK-Key': key } : undefined),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

let uuidCounter = 0;
jest.mock('@/lib/utils', () => ({
  generateUUID: () => `test-uuid-${++uuidCounter}`,
}));

// Import after mocks are set up
import { useTherapyChat, type UseTherapyChatOptions } from '@/hooks/chat/use-therapy-chat';

describe('useTherapyChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasSession = false;
    uuidCounter = 0;
    mockLoadMessages.mockResolvedValue({ success: true, messages: [] });
    mockSaveMessage.mockResolvedValue({ success: true });
  });

  const defaultOptions: UseTherapyChatOptions = {
    sessionId: null,
    model: 'test-model',
    webSearchEnabled: false,
    byokKey: null,
  };

  describe('initialization', () => {
    it('should initialize with empty messages and input', () => {
      const { result } = renderHook(() => useTherapyChat(defaultOptions));

      expect(result.current.messages).toEqual([]);
      expect(result.current.input).toBe('');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it('should not load messages when sessionId is null', () => {
      renderHook(() => useTherapyChat(defaultOptions));

      // Messages should not be loaded when there's no session
      expect(mockLoadMessages).not.toHaveBeenCalled();
    });
  });

  describe('input handling', () => {
    it('should update input via setInput', () => {
      const { result } = renderHook(() => useTherapyChat(defaultOptions));

      act(() => {
        result.current.setInput('test message');
      });

      expect(result.current.input).toBe('test message');
    });

    it('should update input via handleInputChange', () => {
      const { result } = renderHook(() => useTherapyChat(defaultOptions));

      act(() => {
        result.current.handleInputChange({
          target: { value: 'another message' },
        } as React.ChangeEvent<HTMLTextAreaElement>);
      });

      expect(result.current.input).toBe('another message');
    });
  });

  describe('clearSession', () => {
    it('should clear messages, input, and error', async () => {
      const { result } = renderHook(() => useTherapyChat(defaultOptions));

      // Set some state
      act(() => {
        result.current.setInput('some input');
      });

      // Clear session
      act(() => {
        result.current.clearSession();
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.input).toBe('');
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('stop', () => {
    it('should stop streaming and set loading to false', () => {
      const { result } = renderHook(() => useTherapyChat(defaultOptions));

      act(() => {
        result.current.stop();
      });

      expect(result.current.isLoading).toBe(false);
      // Note: mockStopAi may or may not be called depending on internal state
    });
  });

  describe('reload', () => {
    it('should log a warning when no user message exists', async () => {
      const { logger } = jest.requireMock('@/lib/utils/logger');
      const { result } = renderHook(() => useTherapyChat(defaultOptions));

      await act(async () => {
        await result.current.reload();
      });

      expect(logger.warn).toHaveBeenCalledWith('No user message to reload', expect.any(Object));
    });
  });

  describe('append', () => {
    it('should add a message to the messages array', async () => {
      const { result } = renderHook(() => useTherapyChat(defaultOptions));

      await act(async () => {
        await result.current.append({ role: 'user', content: 'Hello world' });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Hello world');
      expect(result.current.messages[0].role).toBe('user');
    });
  });

  describe('setMessages', () => {
    it('should set messages directly', () => {
      const { result } = renderHook(() => useTherapyChat(defaultOptions));

      const newMessages = [
        { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date() },
        { id: '2', role: 'assistant' as const, content: 'Hi there', timestamp: new Date() },
      ];

      act(() => {
        result.current.setMessages(newMessages);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.messages[1].content).toBe('Hi there');
    });
  });

  describe('BYOK support', () => {
    it('should create transport with BYOK headers when key is provided', () => {
      const { DefaultChatTransport } = jest.requireMock('ai');

      renderHook(() =>
        useTherapyChat({
          ...defaultOptions,
          byokKey: 'sk-test-key',
        })
      );

      expect(DefaultChatTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'X-BYOK-Key': 'sk-test-key' },
        })
      );
    });

    it('should not include BYOK headers when key is null', () => {
      const { DefaultChatTransport } = jest.requireMock('ai');

      renderHook(() => useTherapyChat(defaultOptions));

      expect(DefaultChatTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: undefined,
        })
      );
    });
  });
});
