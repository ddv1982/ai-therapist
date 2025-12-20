import { normalizeChatRequest } from '@/features/chat/lib/chat-request';

describe('chat-request edges', () => {
  it('defaults model to DEFAULT_MODEL_ID when missing', () => {
    const result = normalizeChatRequest({ message: 'hi' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBeTruthy();
      expect(typeof result.data.model).toBe('string');
    }
  });

  it('returns zod error messages for invalid input', () => {
    const result = normalizeChatRequest({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('message');
    }
  });
});
