import { selectCurrentSession, selectChatMessages, selectChatSettingsSafe } from '@/store/hooks';

describe('store hooks/selectors (export coverage)', () => {
  it('selectCurrentSession returns null when no current id', () => {
    expect(selectCurrentSession({ sessions: {} } as any)).toBeNull();
  });

  it('selectChatMessages returns [] when no messages', () => {
    expect(selectChatMessages({ chat: {} } as any)).toEqual([]);
  });

  it('selectChatSettingsSafe returns default when missing', () => {
    const res = selectChatSettingsSafe({ chat: {} } as any);
    expect(res).toHaveProperty('model');
  });
});
