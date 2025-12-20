/**
 * Tests for useChatState hook
 */

import { renderHook } from '@testing-library/react';
import { useChatState, type UseChatStateParams } from '@/features/chat/hooks/use-chat-state';
import { createRef } from 'react';

describe('useChatState', () => {
  const createMockParams = (overrides?: Partial<UseChatStateParams>): UseChatStateParams => ({
    messages: [],
    sessions: [],
    currentSession: null,
    input: '',
    isLoading: false,
    isMobile: false,
    viewportHeight: '100vh',
    isGeneratingReport: false,
    memoryContext: {
      hasMemory: false,
      reportCount: 0,
      lastReportDate: undefined,
    },
    textareaRef: createRef(),
    messagesContainerRef: createRef(),
    inputContainerRef: createRef(),
    isNearBottom: true,
    showSidebar: false,
    ...overrides,
  });

  it('should return consolidated chat state', () => {
    const params = createMockParams({
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
        },
      ],
      currentSession: 'session-1',
      input: 'Test input',
      isLoading: true,
    });

    const { result } = renderHook(() => useChatState(params));

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.currentSession).toBe('session-1');
    expect(result.current.input).toBe('Test input');
    expect(result.current.isLoading).toBe(true);
  });

  it('should maintain referential stability with same inputs', () => {
    const params = createMockParams();
    const { result, rerender } = renderHook(() => useChatState(params));

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });

  it('should update when messages change', () => {
    const params = createMockParams({
      messages: [],
    });

    const { result, rerender } = renderHook(({ p }) => useChatState(p), {
      initialProps: { p: params },
    });

    expect(result.current.messages).toHaveLength(0);

    const updatedParams = createMockParams({
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'New message',
          timestamp: new Date(),
        },
      ],
    });

    rerender({ p: updatedParams });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('New message');
  });

  it('should include all refs', () => {
    const textareaRef = createRef<HTMLTextAreaElement>();
    const messagesContainerRef = createRef<HTMLDivElement>();
    const inputContainerRef = createRef<HTMLDivElement>();

    const params = createMockParams({
      textareaRef,
      messagesContainerRef,
      inputContainerRef,
    });

    const { result } = renderHook(() => useChatState(params));

    expect(result.current.textareaRef).toBe(textareaRef);
    expect(result.current.messagesContainerRef).toBe(messagesContainerRef);
    expect(result.current.inputContainerRef).toBe(inputContainerRef);
  });

  it('should include UI state flags', () => {
    const params = createMockParams({
      isMobile: true,
      showSidebar: true,
      isNearBottom: false,
      isGeneratingReport: true,
    });

    const { result } = renderHook(() => useChatState(params));

    expect(result.current.isMobile).toBe(true);
    expect(result.current.showSidebar).toBe(true);
    expect(result.current.isNearBottom).toBe(false);
    expect(result.current.isGeneratingReport).toBe(true);
  });

  it('should include memory context', () => {
    const memoryContext = {
      hasMemory: true,
      reportCount: 5,
      lastReportDate: new Date().toISOString(),
    };

    const params = createMockParams({
      memoryContext,
    });

    const { result } = renderHook(() => useChatState(params));

    expect(result.current.memoryContext.hasMemory).toBe(true);
    expect(result.current.memoryContext.reportCount).toBe(5);
    expect(result.current.memoryContext.lastReportDate).toBeTruthy();
  });
});
