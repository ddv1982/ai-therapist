import { NextRequest } from 'next/server';
import { MODEL_IDS } from '@/ai/model-metadata';
import { parseAndValidateChatRequest } from '@/server/application/chat/parse-and-validate-chat-request';
import { resolveChatModel } from '@/server/application/chat/resolve-chat-model';

function createMockRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return {
    method: 'POST',
    url: 'http://localhost/api/chat',
    headers: new Headers(headers),
    json: async () => body,
  } as unknown as NextRequest;
}

describe('chat request parsing and model resolution', () => {
  it('returns 415 envelope for missing JSON content-type', async () => {
    const request = createMockRequest({ message: 'hello' });

    const result = await parseAndValidateChatRequest(request, { requestId: 'req-test-1' });
    expect('response' in result).toBe(true);

    if ('response' in result) {
      expect(result.response.status).toBe(415);
      const body = await result.response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(body.meta.requestId).toBe('req-test-1');
    }
  });

  it('parses valid payload and normalizes message from messages array', async () => {
    const request = createMockRequest(
      {
        sessionId: 'sess_123',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'hi from parts' }] }],
        selectedModel: MODEL_IDS.default,
        webSearchEnabled: true,
      },
      { 'content-type': 'application/json' }
    );

    const result = await parseAndValidateChatRequest(request, { requestId: 'req-test-2' });
    expect('parsed' in result).toBe(true);

    if ('parsed' in result) {
      expect(result.parsed.normalized.message).toBe('hi from parts');
      expect(result.parsed.providedSessionId).toBe('sess_123');
      expect(result.parsed.webSearchRequested).toBe(true);
      expect(result.parsed.payloadMessages).toHaveLength(1);
    }
  });

  it('uses non-BYOK model path when BYOK header is absent', () => {
    const resolved = resolveChatModel({
      request: createMockRequest({}, { 'content-type': 'application/json' }),
      requestId: 'req-test-3',
      message: 'hello',
      preferredModel: MODEL_IDS.default,
      webSearchRequested: true,
    });

    expect(resolved.effectiveModelId).not.toBe(MODEL_IDS.byok);
    expect(['auto', 'none']).toContain(resolved.toolChoiceHeader);
  });

  it('uses BYOK model when BYOK key is present', () => {
    const resolved = resolveChatModel({
      request: createMockRequest({}, { 'x-byok-key': 'sk-test-byok' }),
      requestId: 'req-test-4',
      message: 'hello',
      preferredModel: MODEL_IDS.default,
      webSearchRequested: true,
    });

    expect(resolved.effectiveModelId).toBe(MODEL_IDS.byok);
    expect(resolved.hasWebSearch).toBe(false);
    expect(resolved.toolChoiceHeader).toBe('none');
  });
});
