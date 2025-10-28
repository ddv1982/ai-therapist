import { extractChunk, appendWithLimit, persistFromClonedStream, attachResponseHeadersRaw, teeAndPersistStream } from '@/lib/chat/stream-utils';

describe('stream-utils', () => {
  it('extractChunk parses text, parts and delta', () => {
    expect(extractChunk({ text: 'a' } as any)).toBe('a');
    expect(extractChunk({ parts: [{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }] } as any)).toBe('ab');
    expect(extractChunk({ delta: { text: 'd' } } as any)).toBe('d');
    expect(extractChunk(undefined as any)).toBe('');
  });

  it('appendWithLimit truncates correctly', () => {
    const r1 = appendWithLimit('abc', 'de', 5);
    expect(r1.value).toBe('abcde');
    expect(r1.truncated).toBe(false);
    const r2 = appendWithLimit('abc', 'def', 5);
    expect(r2.value).toBe('abcde');
    expect(r2.truncated).toBe(true);
  });

  it('attachResponseHeadersRaw sets headers', () => {
    const headers = new Headers();
    attachResponseHeadersRaw(headers as any, 'rid', 'm1', 'none');
    expect(headers.get('X-Request-Id')).toBe('rid');
    expect(headers.get('X-Model-Id')).toBe('m1');
    expect(headers.get('X-Tool-Choice')).toBe('none');
  });

  it('persistFromClonedStream parses SSE lines', async () => {
    const lines = [
      'data: {"text":"Hello"}',
      'data: {"delta":{"text":"!"}}',
    ].join('\n');
    const fakeResponse = {
      clone: () => ({ text: async () => lines }),
      text: async () => lines,
    } as unknown as Response;
    const appended: string[] = [];
    await persistFromClonedStream(fakeResponse, {
      append: (chunk: string) => { appended.push(chunk); return false; },
      persist: async () => {},
      wasTruncated: () => false,
    });
    expect(appended.join('')).toBe('Hello!');
  });

  it('teeAndPersistStream tees body and returns client stream with headers', async () => {
    const enc = new TextEncoder();
    const chunks: Uint8Array[] = [
      enc.encode('data: {"text":"A"}'),
      enc.encode('\n'),
      enc.encode('data: {"parts":[{"type":"text","text":"B"}]}\n'),
      enc.encode('data: {"delta":{"text":"C"}}\n'),
    ];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const c of chunks) controller.enqueue(c);
        controller.close();
      },
    });
    const response = new Response(body, { status: 200 });

    const appended: string[] = [];
    const collector = {
      append: (chunk: string) => {
        appended.push(chunk);
        return appended.length >= 3;
      },
      wasTruncated: () => false,
      persist: async () => {},
    };

    const res = await teeAndPersistStream(response, collector, 'rid', 'mid', 'tool');
    expect(res).not.toBeNull();
    expect(appended.join('')).toBe('ABC');
  });

  it('persistFromClonedStream reads from clone().body when available and respects truncation', async () => {
    const enc = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode('data: {"text":"X"}\n'));
        controller.enqueue(enc.encode('data: {"delta":{"text":"Y"}}\n'));
        controller.close();
      },
    });
    const base = new Response('ignored');
    const clone = new Response(body);
    (base as any).clone = () => clone;

    const out: string[] = [];
    await persistFromClonedStream(base, {
      append: (c: string) => { out.push(c); return out.length >= 2; },
      wasTruncated: () => false,
      persist: async () => {},
    });
    expect(out).toEqual(['X', 'Y']);
  });

  it('persistFromClonedStream honors wasTruncated early stop within processBuffer', async () => {
    const enc = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode('data: {"text":"A"}\n'));
        controller.enqueue(enc.encode('data: {"text":"B"}\n'));
        controller.close();
      },
    });
    const base = new Response('ignored');
    const clone = new Response(body);
    (base as any).clone = () => clone;

    const captured: string[] = [];
    await persistFromClonedStream(base, {
      append: (c: string) => { captured.push(c); return false; },
      wasTruncated: () => true,
      persist: async () => undefined,
    });
    expect(captured).toEqual(['A']);
  });

  it('appendWithLimit handles edge cases', () => {
    // Empty addition
    const r1 = appendWithLimit('test', '', 10);
    expect(r1.value).toBe('test');
    expect(r1.truncated).toBe(false);

    // Already at max
    const r2 = appendWithLimit('12345', 'more', 5);
    expect(r2.value).toBe('12345');
    expect(r2.truncated).toBe(true);

    // Exact fit
    const r3 = appendWithLimit('123', '45', 5);
    expect(r3.value).toBe('12345');
    expect(r3.truncated).toBe(false);
  });

  it('extractChunk handles various payload types', () => {
    // Non-object payload
    expect(extractChunk(null as any)).toBe('');
    expect(extractChunk('string' as any)).toBe('');

    // Non-string text
    expect(extractChunk({ text: 123 } as any)).toBe('');

    // Parts with non-text types
    expect(extractChunk({ parts: [{ type: 'other', text: 'ignored' }] } as any)).toBe('');

    // Parts with null entries
    expect(extractChunk({ parts: [null, { type: 'text', text: 'kept' }, undefined] } as any)).toBe('kept');

    // Non-string delta text
    expect(extractChunk({ delta: { text: 123 } } as any)).toBe('');
  });

  it('teeAndPersistStream handles null body', async () => {
    const response = new Response(null);
    const collector = {
      append: jest.fn(() => false),
      persist: jest.fn(),
      wasTruncated: jest.fn(() => false),
    };

    const res = await teeAndPersistStream(response, collector, 'rid', 'mid', 'tool');
    expect(res).toBeNull();
    expect(collector.append).not.toHaveBeenCalled();
  });

  it('teeAndPersistStream handles reader errors gracefully', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('Stream error'));
      },
    });
    const response = new Response(body);

    const collector = {
      append: jest.fn(() => false),
      persist: jest.fn(),
      wasTruncated: jest.fn(() => false),
    };

    const res = await teeAndPersistStream(response, collector, 'rid', 'mid', 'tool');
    // Stream errors cause tee() to fail, returning null
    expect(res).toBeNull();
  });

  it('persistFromClonedStream handles invalid JSON gracefully', async () => {
    const lines = [
      'data: {invalid json}',
      'data: {"text":"valid"}',
    ].join('\n');
    const fakeResponse = {
      clone: () => ({ text: async () => lines }),
      text: async () => lines,
    } as unknown as Response;

    const appended: string[] = [];
    await persistFromClonedStream(fakeResponse, {
      append: (chunk: string) => { appended.push(chunk); return false; },
      persist: async () => {},
      wasTruncated: () => false,
    });

    // Should only capture valid JSON
    expect(appended.join('')).toBe('valid');
  });

  it('persistFromClonedStream ignores non-data lines', async () => {
    const lines = [
      'event: ping',
      'data: {"text":"A"}',
      ': comment',
      'data: {"text":"B"}',
    ].join('\n');
    const fakeResponse = {
      clone: () => ({ text: async () => lines }),
      text: async () => lines,
    } as unknown as Response;

    const appended: string[] = [];
    await persistFromClonedStream(fakeResponse, {
      append: (chunk: string) => { appended.push(chunk); return false; },
      persist: async () => {},
      wasTruncated: () => false,
    });

    expect(appended.join('')).toBe('AB');
  });
});
