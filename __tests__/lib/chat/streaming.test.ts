import type { LanguageModel, ToolSet } from 'ai';
import { tool } from '@ai-sdk/provider-utils';
import { z } from 'zod';

const {
  streamChatCompletion,
  teeReadableStream,
  collectStreamToString,
} = require('@/lib/chat/streaming');

// Mock ai.streamText from jest.setup.js already returns a Response-like object
const { streamText } = jest.requireMock('ai');

class TestReadableStream {
  private chunks: Uint8Array[];
  constructor(chunks: Uint8Array[]) {
    this.chunks = chunks.slice();
  }
  getReader() {
    let index = 0;
    const data = this.chunks;
    return {
      read: async () => {
        if (index < data.length) {
          const value = data[index++];
          return { done: false, value };
        }
        return { done: true, value: undefined };
      }
    };
  }
  tee(): [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>] {
    const left = new TestReadableStream(this.chunks);
    const right = new TestReadableStream(this.chunks);
    return [left as unknown as ReadableStream<Uint8Array>, right as unknown as ReadableStream<Uint8Array>];
  }
}

function makeReadableStreamFromStrings(parts: string[]): ReadableStream<Uint8Array> {
  const encoded = parts.map(p => new TextEncoder().encode(p));
  return new TestReadableStream(encoded) as unknown as ReadableStream<Uint8Array>;
}

describe('chat streaming utils', () => {
  it('passes through args to streamText and supports toolChoice', async () => {
    const tools: ToolSet = {
      a: tool({
        description: 'test tool',
        inputSchema: z.object({}),
        execute: jest.fn(),
      }),
    };

    await streamChatCompletion({
      model: {} as unknown as LanguageModel,
      messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
      maxOutputTokens: 256,
      tools,
      toolChoice: 'required',
      telemetry: { isEnabled: true },
    });
    expect(streamText).toHaveBeenCalled();
  });

  it('tees a readable stream into two branches', async () => {
    const input = makeReadableStreamFromStrings(['a', 'b']);
    const { primary, secondary } = await teeReadableStream(input);
    const a = await collectStreamToString(primary);
    const b = await collectStreamToString(secondary);
    expect(a).toBe('ab');
    expect(b).toBe('ab');
  });

  it('collects readable stream to string', async () => {
    const input = makeReadableStreamFromStrings(['hello', ' ', 'world']);
    const out = await collectStreamToString(input);
    expect(out).toBe('hello world');
  });
});


