import { DEFAULT_MODEL_ID } from '@/features/chat/config';
import {
  selectCurrentSession,
  selectChatMessages,
  selectCurrentCBTDraft,
  selectCBTValidationErrors,
  selectIsStreaming,
  selectChatSettings,
  selectChatSettingsSafe,
} from '@/store/hooks';

describe('store/hooks selector branches', () => {
  it('selectCurrentSession returns null when no id and object when present', () => {
    expect(selectCurrentSession({ sessions: {} } as any)).toBeNull();
    expect(selectCurrentSession({ sessions: { currentSessionId: 's1' } } as any)).toEqual({
      id: 's1',
    });
  });

  it('selectChatMessages returns [] when none and values when present', () => {
    expect(selectChatMessages({ chat: {} } as any)).toEqual([]);
    const state = { chat: { messages: { a: { id: '1' }, b: { id: '2' } } } } as any;
    const vals = selectChatMessages(state);
    expect(Array.isArray(vals)).toBe(true);
    expect((vals as any[]).length).toBe(2);
  });

  it('selectCurrentCBTDraft and selectCBTValidationErrors fallbacks', () => {
    expect(selectCurrentCBTDraft({ cbt: {} } as any)).toBeUndefined();
    expect(selectCBTValidationErrors({ cbt: {} } as any)).toEqual({});
    expect(selectCBTValidationErrors({ cbt: { validationErrors: { x: 'y' } } } as any)).toEqual({
      x: 'y',
    });
  });

  it('selectIsStreaming defaults false and true when set', () => {
    expect(selectIsStreaming({ chat: {} } as any)).toBe(false);
    expect(selectIsStreaming({ chat: { isStreaming: true } } as any)).toBe(true);
  });

  it('selectChatSettings returns fallback and actual when present', () => {
    const fallback = selectChatSettings({ chat: {} } as any) as any;
    expect(fallback).toMatchObject({ webSearchEnabled: false });
    const actual = selectChatSettings({
      chat: { settings: { webSearchEnabled: true, model: 'm' } },
    } as any) as any;
    expect(actual).toMatchObject({ webSearchEnabled: true, model: 'm' });
  });

  it('selectChatSettingsSafe uses DEFAULT_MODEL_ID in fallback', () => {
    const safe = selectChatSettingsSafe({ chat: {} } as any) as any;
    expect(safe.model).toBe(DEFAULT_MODEL_ID);
  });
});
