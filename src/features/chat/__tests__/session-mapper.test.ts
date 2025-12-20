import { mapApiSessionToUiSession } from '@/features/chat/lib/session-mapper';

describe('session-mapper', () => {
  it('maps API session to UI session with proper types', () => {
    const apiSession: any = {
      id: 123,
      title: 'Test Session',
      lastMessage: 'Hello',
      startedAt: '2024-01-01T00:00:00.000Z',
      _count: { messages: 5 },
    };
    const ui = mapApiSessionToUiSession(apiSession);
    expect(ui.id).toBe('123');
    expect(ui.title).toBe('Test Session');
    expect(ui.lastMessage).toBe('Hello');
    expect(ui.startedAt).toBeInstanceOf(Date);
    expect(ui._count).toEqual({ messages: 5 });
  });

  it('handles missing lastMessage/startedAt gracefully', () => {
    const ui = mapApiSessionToUiSession({ id: 's1', title: 'T' } as any);
    expect(ui.id).toBe('s1');
    expect(ui.title).toBe('T');
    expect(ui.lastMessage).toBeUndefined();
    expect(ui.startedAt).toBeUndefined();
  });
});
