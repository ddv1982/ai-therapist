import { normalizeChatRequest, buildForwardedMessages } from '@/lib/chat/chat-request';

describe('chat-request', () => {
  it('normalizes valid input', () => {
    const res = normalizeChatRequest({ message: 'hi', sessionId: 's1' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.message).toBe('hi');
      expect(res.data.sessionId).toBe('s1');
    }
  });

  it('returns error for invalid input', () => {
    const res = normalizeChatRequest({});
    expect(res.success).toBe(false);
  });

  it('builds forwarded messages from array parts and ids', () => {
    const raw = [
      { role: 'user', parts: [{ type: 'text', text: 'hello' }], id: 'm1' },
      { role: 'assistant', content: 'world' },
      { role: 'system', content: 'ignore me' },
    ];
    const msgs = buildForwardedMessages(raw, 'fallback');
    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toEqual({ role: 'user', content: 'hello', id: 'm1' });
    expect(msgs[1]).toEqual({ role: 'assistant', content: 'world' });
  });

  it('falls back when raw messages not an array', () => {
    const msgs = buildForwardedMessages(null, 'fallback');
    expect(msgs).toEqual([{ role: 'user', content: 'fallback' }]);
  });
});
