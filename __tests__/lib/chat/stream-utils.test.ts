import { extractChunk, appendWithLimit, persistFromClonedStream, attachResponseHeadersRaw } from '@/lib/chat/stream-utils';

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
});
