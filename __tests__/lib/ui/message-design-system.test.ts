import { buildMessageClasses, getMessageTokens } from '@/lib/ui/design-system/message';

describe('ui/design-system/message', () => {
  it('builds classes for user and assistant roles', () => {
    const userBubble = buildMessageClasses('user', 'bubble');
    expect(userBubble).toContain('bg-primary');
    const assistantContainer = buildMessageClasses('assistant', 'container');
    expect(assistantContainer).toContain('flex-row');
  });

  it('returns empty string for unknown element (fallback branch)', () => {
    const cls = buildMessageClasses('assistant', 'nonexistent' as any);
    expect(cls).toBe('');
  });

  it('getMessageTokens exposes base, variant and typography', () => {
    const t = getMessageTokens('user');
    expect(t.base).toBeDefined();
    expect(t.variant).toBeDefined();
    expect(t.typography).toBeDefined();
  });
});
