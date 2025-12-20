import { normalizeChatRequest, buildForwardedMessages } from '@/features/chat/lib/chat-request';

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

  it('handles parts with non-text types', () => {
    const result = buildForwardedMessages(
      [
        {
          role: 'user',
          parts: [
            { type: 'image', text: 'ignored' },
            { type: 'text', text: 'visible' },
          ],
        },
      ] as any,
      'fallback'
    );
    expect(result[0].content).toBe('visible');
  });

  it('handles parts with null entries', () => {
    const result = buildForwardedMessages(
      [{ role: 'user', parts: [null, { type: 'text', text: 'kept' }, undefined] }] as any,
      'fallback'
    );
    expect(result[0].content).toBe('kept');
  });

  it('coerces non-string content to empty', () => {
    const result = buildForwardedMessages([{ role: 'user', content: 123 }] as any, 'fallback');
    expect(result[0].content).toBe('');
  });

  it('handles messages with both content and parts', () => {
    const result = buildForwardedMessages(
      [{ role: 'user', content: 'direct', parts: [{ type: 'text', text: 'parts' }] }] as any,
      'fallback'
    );
    // Content string takes precedence
    expect(result[0].content).toBe('direct');
  });

  it('handles non-string id values', () => {
    const result = buildForwardedMessages(
      [{ role: 'user', content: 'test', id: 123 }] as any,
      'fallback'
    );
    expect(result[0].id).toBeUndefined();
  });

  it('handles messages with string id', () => {
    const result = buildForwardedMessages(
      [{ role: 'user', content: 'test', id: 'msg-123' }] as any,
      'fallback'
    );
    expect(result[0].id).toBe('msg-123');
  });

  it('handles empty parts array', () => {
    const result = buildForwardedMessages([{ role: 'user', parts: [] }] as any, 'fallback');
    expect(result[0].content).toBe('');
  });

  it('filters out non-user and non-assistant roles', () => {
    const result = buildForwardedMessages(
      [
        { role: 'user', content: 'user message' },
        { role: 'system', content: 'system message' },
        { role: 'assistant', content: 'assistant message' },
        { role: 'function', content: 'function message' },
      ] as any,
      'fallback'
    );
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('user');
    expect(result[1].role).toBe('assistant');
  });
});
