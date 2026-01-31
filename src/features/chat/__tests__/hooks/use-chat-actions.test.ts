/**
 * Tests for useChatActions hook
 */

import { renderHook, act } from '@testing-library/react';
import { useChatActions, type UseChatActionsParams } from '@/features/chat/hooks/use-chat-actions';
import { createRef, type MutableRefObject } from 'react';
import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID } from '@/features/chat/config';

describe('useChatActions', () => {
  const createMockParams = (overrides?: Partial<UseChatActionsParams>): UseChatActionsParams => ({
    textareaRef: createRef(),
    setInput: jest.fn(),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    createObsessionsCompulsionsTable: jest.fn().mockResolvedValue({ success: true }),
    scrollToBottom: jest.fn(),
    setShowSidebar: jest.fn(),
    updateSettings: jest.fn(),
    settings: { model: DEFAULT_MODEL_ID, webSearchEnabled: false },
    router: { push: jest.fn() },
    showToast: jest.fn(),
    toastT: jest.fn((key) => key),
    setByokActive: jest.fn(),
    ...overrides,
  });

  it('should handle input change', () => {
    const setInput = jest.fn();
    const params = createMockParams({ setInput });
    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.handleInputChange('new input');
    });

    expect(setInput).toHaveBeenCalledWith('new input');
  });

  it('should handle key down (Enter)', async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const params = createMockParams({ sendMessage });
    const { result } = renderHook(() => useChatActions(params));

    const mockEvent = {
      key: 'Enter',
      shiftKey: false,
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

    await act(async () => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalled();
  });

  it('should not send message on Shift+Enter', async () => {
    const sendMessage = jest.fn();
    const params = createMockParams({ sendMessage });
    const { result } = renderHook(() => useChatActions(params));

    const mockEvent = {
      key: 'Enter',
      shiftKey: true,
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

    await act(async () => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('should handle form submit', async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const params = createMockParams({ sendMessage });
    const { result } = renderHook(() => useChatActions(params));

    const mockEvent = {
      preventDefault: jest.fn(),
    } as unknown as React.FormEvent;

    await act(async () => {
      result.current.handleFormSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalled();
  });

  it('should navigate to CBT diary', () => {
    const push = jest.fn();
    const params = createMockParams({ router: { push } });
    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.openCBTDiary();
    });

    expect(push).toHaveBeenCalledWith('/cbt-diary');
  });

  it('should handle create obsessions table success', async () => {
    const showToast = jest.fn();
    const createObsessionsCompulsionsTable = jest.fn().mockResolvedValue({ success: true });
    const params = createMockParams({ showToast, createObsessionsCompulsionsTable });
    const { result } = renderHook(() => useChatActions(params));

    await act(async () => {
      await result.current.handleCreateObsessionsTable();
    });

    expect(createObsessionsCompulsionsTable).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'trackerCreateSuccessTitle',
      message: 'trackerCreateSuccessBody',
    });
  });

  it('should handle create obsessions table failure', async () => {
    const showToast = jest.fn();
    const createObsessionsCompulsionsTable = jest
      .fn()
      .mockResolvedValue({ success: false, error: 'Failed to create' });
    const params = createMockParams({ showToast, createObsessionsCompulsionsTable });
    const { result } = renderHook(() => useChatActions(params));

    await act(async () => {
      await result.current.handleCreateObsessionsTable();
    });

    expect(showToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'trackerCreateFailedTitle',
      message: 'Failed to create',
    });
  });

  it('should toggle web search on and switch to analytical model and deactivate BYOK', () => {
    const updateSettings = jest.fn();
    const setByokActive = jest.fn();
    const params = createMockParams({
      updateSettings,
      setByokActive,
      settings: { model: DEFAULT_MODEL_ID, webSearchEnabled: false },
    });
    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.handleWebSearchToggle();
    });

    expect(setByokActive).toHaveBeenCalledWith(false);
    expect(updateSettings).toHaveBeenCalledWith({
      webSearchEnabled: true,
      model: ANALYTICAL_MODEL_ID,
    });
  });

  it('should toggle web search off and reset to default model', () => {
    const updateSettings = jest.fn();
    const params = createMockParams({
      updateSettings,
      settings: { model: ANALYTICAL_MODEL_ID, webSearchEnabled: true },
    });
    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.handleWebSearchToggle();
    });

    expect(updateSettings).toHaveBeenCalledWith({
      webSearchEnabled: false,
      model: DEFAULT_MODEL_ID,
    });
  });

  it('should toggle smart model and deactivate BYOK', () => {
    const updateSettings = jest.fn();
    const setByokActive = jest.fn();
    const params = createMockParams({
      updateSettings,
      setByokActive,
      settings: { model: DEFAULT_MODEL_ID, webSearchEnabled: false },
    });
    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.handleSmartModelToggle();
    });

    expect(setByokActive).toHaveBeenCalledWith(false);
    expect(updateSettings).toHaveBeenCalledWith({
      model: ANALYTICAL_MODEL_ID,
      webSearchEnabled: false,
    });
  });

  it('should scroll to bottom and focus textarea', () => {
    jest.useFakeTimers();
    const scrollToBottom = jest.fn();
    const textareaRef = createRef<HTMLTextAreaElement>();
    const mockTextarea = { focus: jest.fn() } as unknown as HTMLTextAreaElement;
    (textareaRef as MutableRefObject<HTMLTextAreaElement | null>).current = mockTextarea;

    const params = createMockParams({ scrollToBottom, textareaRef });
    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.scrollToBottom();
      jest.advanceTimersByTime(50);
    });

    expect(scrollToBottom).toHaveBeenCalled();
    expect(mockTextarea.focus).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should set show sidebar', () => {
    const setShowSidebar = jest.fn();
    const params = createMockParams({ setShowSidebar });
    const { result } = renderHook(() => useChatActions(params));

    act(() => {
      result.current.setShowSidebar(true);
    });

    expect(setShowSidebar).toHaveBeenCalledWith(true);
  });
});
