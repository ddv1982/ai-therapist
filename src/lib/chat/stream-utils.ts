// Streaming helpers for chat SSE parsing and header attachment

export type StreamPart = { type?: string; text?: unknown } | null | undefined;

export type StreamPayload = {
  text?: unknown;
  parts?: StreamPart[];
  delta?: { text?: unknown };
} | undefined;

export function extractChunk(payload: StreamPayload): string {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof (payload as { text?: unknown }).text === 'string') return (payload as { text: string }).text;
  const parts = (payload as { parts?: StreamPart[] }).parts;
  if (Array.isArray(parts)) {
    return parts
      .map((part: StreamPart) => (part && part.type === 'text' && typeof part.text === 'string' ? part.text : ''))
      .join('');
  }
  const delta = (payload as { delta?: { text?: unknown } }).delta;
  if (delta && typeof delta.text === 'string') return delta.text as string;
  return '';
}

export function appendWithLimit(current: string, addition: string, maxChars: number): { value: string; truncated: boolean } {
  if (!addition) return { value: current, truncated: false };
  if (current.length >= maxChars) {
    return { value: current, truncated: true };
  }
  const remaining = maxChars - current.length;
  if (addition.length <= remaining) {
    return { value: current + addition, truncated: false };
  }
  return { value: current + addition.slice(0, remaining), truncated: true };
}

export function attachResponseHeadersRaw(headers: Headers, requestId: string, modelId: string, toolChoice: string): void {
  headers.set('X-Request-Id', requestId);
  headers.set('X-Model-Id', modelId);
  headers.set('X-Tool-Choice', toolChoice);
}

export async function teeAndPersistStream(
  response: Response,
  collector: { append: (chunk: string) => boolean; persist: () => Promise<void>; wasTruncated: () => boolean },
  requestId: string,
  modelId: string,
  toolChoice: string,
): Promise<Response | null> {
  try {
    const body = (response as { body?: ReadableStream<Uint8Array> }).body;
    if (!body || typeof (body as { tee?: unknown }).tee !== 'function') return null;
    const [clientStream, serverStream] = (body as unknown as { tee: () => [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>] }).tee();

    const consume = async () => {
      const reader = serverStream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processBuffer = () => {
        let newlineIndex = buffer.indexOf('\n');
        while (newlineIndex !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) {
            newlineIndex = buffer.indexOf('\n');
            continue;
          }
          const payloadRaw = trimmed.slice(5).trim();
          try {
            const payload = JSON.parse(payloadRaw) as StreamPayload;
            const chunk = extractChunk(payload);
            if (collector.append(chunk)) {
              return true;
            }
          } catch {
            // ignore parse errors
          }
          newlineIndex = buffer.indexOf('\n');
        }
        return false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (processBuffer()) break;
      }

      if (!collector.wasTruncated() && buffer.length > 0) {
        processBuffer();
      }

      await collector.persist();
    };

    if (process.env.NODE_ENV === 'test') {
      await consume();
    } else {
      void consume();
    }

    const headers = new Headers(response.headers);
    attachResponseHeadersRaw(headers, requestId, modelId, toolChoice);
    return new Response(clientStream, { status: response.status, headers });
  } catch {
    return null;
  }
}

export async function persistFromClonedStream(
  response: Response,
  collector: { append: (chunk: string) => boolean; persist: () => Promise<void>; wasTruncated: () => boolean }
): Promise<void> {
  try {
    const clone = (response as { clone?: () => Response }).clone?.() ?? response;
    const text = await (clone as { text?: () => Promise<string> }).text?.();
    if (typeof text !== 'string') return;

    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      try {
        const payload = JSON.parse(line.slice(5).trim()) as StreamPayload;
        if (collector.append(extractChunk(payload))) break;
      } catch {
        // ignore parse errors
      }
      if (collector.wasTruncated()) break;
    }

    await collector.persist();
  } catch {
    // ignore
  }
}


