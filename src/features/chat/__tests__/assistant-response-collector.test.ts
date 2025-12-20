jest.mock('@/features/chat/lib/message-encryption', () => ({
  encryptMessage: ({ role, content, timestamp }: any) => ({ role, content, timestamp }),
}));

const mutationMock = jest.fn(async (_fn: unknown, args: any) => {
  (global as any).__lastMutation = args;
  return { id: 'ok' };
});

jest.mock('@/lib/convex/http-client', () => ({
  anyApi: { messages: { create: 'messages.create' } },
}));

describe('AssistantResponseCollector', () => {
  beforeEach(() => {
    mutationMock.mockClear();
    (global as any).__lastMutation = undefined;
  });

  const concatWithLimit = (current: string, addition: string, max: number) => {
    const avail = Math.max(0, max - current.length);
    const add = addition.slice(0, avail);
    const value = current + add;
    return { value, truncated: add.length < addition.length };
  };

  const mockConvexClient = { mutation: mutationMock } as const;

  it('appends chunks with limit and marks truncation', async () => {
    const { AssistantResponseCollector } = await import('@/features/chat/lib/assistant-response-collector');
    const c = new AssistantResponseCollector(
      's1',
      { valid: true } as any,
      'm1',
      'rid',
      5,
      concatWithLimit,
      mockConvexClient as any
    );
    expect(c.append('Hello')).toBe(false);
    expect(c.append(' World')).toBe(true); // truncated
    expect(c.wasTruncated()).toBe(true);
  });

  it('persists when ownership is valid and updates model id', async () => {
    const { AssistantResponseCollector } = await import('@/features/chat/lib/assistant-response-collector');
    const c = new AssistantResponseCollector(
      's1',
      { valid: true } as any,
      'm1',
      'rid',
      100,
      concatWithLimit,
      mockConvexClient as any
    );
    c.append('Hello');
    await c.persist();

    c.setModelId('m2');
    c.append('!');
    await c.persist();
    expect(c.wasTruncated()).toBe(false);
  });

  it('does not persist when sessionId missing or ownership invalid', async () => {
    const { AssistantResponseCollector } = await import('@/features/chat/lib/assistant-response-collector');
    const c1 = new AssistantResponseCollector(
      undefined as any,
      { valid: true } as any,
      'm',
      'rid',
      50,
      concatWithLimit,
      mockConvexClient as any
    );
    c1.append('x');
    await c1.persist();
    const c2 = new AssistantResponseCollector(
      's2',
      { valid: false } as any,
      'm',
      'rid',
      50,
      concatWithLimit,
      mockConvexClient as any
    );
    c2.append('y');
    await c2.persist();
    expect(c2.wasTruncated()).toBe(false);
  });
});
