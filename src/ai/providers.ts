import { groq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';
import type {
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Prompt,
  LanguageModelV2StreamPart,
  LanguageModelV2ToolResultPart,
} from '@ai-sdk/provider';
import { logger } from '@/lib/utils/logger';
import { env } from '@/config/env';
import { MODEL_IDS } from '@/ai/model-metadata';
import type { SystemModelIdentifier } from '@/ai/model-metadata';

const ollamaBaseUrl = trimTrailingSlash(env.OLLAMA_BASE_URL);
const ollamaApiBaseUrl = ensureApiBase(ollamaBaseUrl);
const ollamaChatUrl = `${ollamaApiBaseUrl}/chat`;
const ollamaTagsUrl = `${ollamaApiBaseUrl}/tags`;
const localModelName = env.OLLAMA_MODEL_ID;

let localOllamaModel: LanguageModel | undefined;

if (typeof window === 'undefined') {
  try {
    localOllamaModel = createLocalOllamaLanguageModel({
      chatUrl: ollamaChatUrl,
      modelId: localModelName,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    logger.warn('Failed to configure local Ollama model', {
      baseURL: ollamaBaseUrl,
      model: localModelName,
      cause: reason,
    });
  }
}

const baseLanguageModels: Record<SystemModelIdentifier, LanguageModel> = {
  [MODEL_IDS.default]: groq(MODEL_IDS.default),
  [MODEL_IDS.analytical]: groq(MODEL_IDS.analytical),
  [MODEL_IDS.local]: localOllamaModel ?? groq(MODEL_IDS.default),
};

export const languageModels: Record<string, LanguageModel> = {
  [MODEL_IDS.default]: baseLanguageModels[MODEL_IDS.default],
  [MODEL_IDS.analytical]: baseLanguageModels[MODEL_IDS.analytical],
  ...(localOllamaModel ? { [MODEL_IDS.local]: baseLanguageModels[MODEL_IDS.local] } : {}),
};

// TypeScript types for model IDs
export type ModelID = keyof typeof languageModels;

// Available model keys for iteration
export const MODELS = Object.keys(languageModels) as ModelID[];

// Default model for new sessions
export const defaultModel: ModelID = MODEL_IDS.default as ModelID;

// Helper function to check Ollama availability
type OllamaHealthStatus =
  | 'ok'
  | 'not_configured'
  | 'http_error'
  | 'timeout'
  | 'network_error'
  | 'model_missing';

interface OllamaHealthResult {
  ok: boolean;
  status: OllamaHealthStatus;
  message: string;
  details?: {
    httpStatus?: number;
    model?: string;
  };
}

export async function checkOllamaAvailability(): Promise<OllamaHealthResult> {
  if (typeof window !== 'undefined') {
    return {
      ok: false,
      status: 'not_configured',
      message: 'Ollama health checks can only run on the server environment.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(ollamaTagsUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        status: 'http_error',
        message: `Ollama responded with status ${response.status}.`,
        details: { httpStatus: response.status, model: localModelName },
      };
    }

    const data = await response.json();
    const models = Array.isArray(data?.models) ? data.models : [];
    const hasModel = models.some((model: { name?: string }) => {
      const name = typeof model?.name === 'string' ? model.name : '';
      return name === localModelName || name.endsWith(`/${localModelName}`);
    });

    if (!hasModel) {
      return {
        ok: false,
        status: 'model_missing',
        message: `Model "${localModelName}" is not installed in Ollama.`,
        details: { model: localModelName },
      };
    }

    return {
      ok: true,
      status: 'ok',
      message: 'Ollama is reachable and the configured model is available.',
      details: { model: localModelName },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 'timeout',
        message: 'Timed out while contacting Ollama. Ensure the daemon is running.',
        details: { model: localModelName },
      };
    }

    return {
      ok: false,
      status: 'network_error',
      message: `Failed to connect to Ollama: ${error instanceof Error ? error.message : 'Unknown error'}.`,
      details: { model: localModelName },
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Legacy compatibility

function createLocalOllamaLanguageModel(params: {
  chatUrl: string;
  modelId: string;
}): LanguageModel {
  const { chatUrl, modelId } = params;

  const toHeadersRecord = (headers: Headers): Record<string, string> =>
    Object.fromEntries(headers.entries());

  const mapFinishReason = (
    value: unknown
  ): 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown' => {
    if (typeof value !== 'string' || value.length === 0) return 'stop';
    const normalized = value.toLowerCase();
    if (normalized === 'stop') return 'stop';
    if (normalized === 'length') return 'length';
    if (normalized.includes('tool')) return 'tool-calls';
    if (normalized === 'content_filter') return 'content-filter';
    return 'other';
  };

  const serializeToolResult = (part: LanguageModelV2ToolResultPart): string => {
    const { output } = part;
    switch (output.type) {
      case 'text':
      case 'error-text':
        return output.value;
      case 'json':
      case 'error-json':
      case 'content':
        try {
          return JSON.stringify(output.value);
        } catch {
          return String(output.value);
        }
      default:
        return '';
    }
  };

  const convertPrompt = (prompt: LanguageModelV2Prompt) => {
    const messages: Array<{
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string;
      tool_call_id?: string;
    }> = [];
    for (const entry of prompt) {
      switch (entry.role) {
        case 'system': {
          if (entry.content.trim().length > 0) {
            messages.push({ role: 'system', content: entry.content });
          }
          break;
        }
        case 'user': {
          const text = entry.content
            .filter((part) => part.type === 'text')
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join('');
          messages.push({ role: 'user', content: text });
          break;
        }
        case 'assistant': {
          const text = entry.content
            .filter((part) => part.type === 'text' || part.type === 'reasoning')
            .map((part) => ('text' in part ? part.text : ''))
            .join('');
          if (text.length > 0) {
            messages.push({ role: 'assistant', content: text });
          }
          break;
        }
        case 'tool': {
          for (const result of entry.content) {
            const serialized = serializeToolResult(result);
            messages.push({
              role: 'tool',
              content: serialized,
              tool_call_id: result.toolCallId,
            });
          }
          break;
        }
        default:
          break;
      }
    }
    return messages;
  };

  const buildPayload = (options: LanguageModelV2CallOptions) => {
    const warnings: LanguageModelV2CallWarning[] = [];

    if (options.tools && options.tools.length > 0) {
      for (const tool of options.tools) {
        warnings.push({ type: 'unsupported-tool', tool });
      }
    }

    if (options.toolChoice && options.toolChoice.type !== 'none') {
      warnings.push({ type: 'unsupported-setting', setting: 'toolChoice' });
    }

    if (options.responseFormat) {
      warnings.push({ type: 'unsupported-setting', setting: 'responseFormat' });
    }

    const payload = {
      model: modelId,
      messages: convertPrompt(options.prompt),
      options: removeUndefined({
        num_predict: options.maxOutputTokens,
        temperature: options.temperature,
        top_p: options.topP,
        top_k: options.topK,
        stop: options.stopSequences,
        seed: options.seed,
      }),
    };

    return { payload, warnings };
  };

  const performRequest = async (body: unknown, options: LanguageModelV2CallOptions) => {
    const response = await fetch(chatUrl, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const text = await safeReadBody(response);
      throw new Error(`Ollama request failed with status ${response.status}: ${text}`);
    }

    return response;
  };

  return {
    specificationVersion: 'v2',
    supportedUrls: {},
    modelId,
    get provider() {
      return 'ollama.local';
    },
    async doGenerate(options) {
      const { payload, warnings } = buildPayload(options);
      const body = { ...payload, stream: false };
      const response = await performRequest(body, options);
      const json = (await response.json()) as {
        message?: { content?: string };
        done_reason?: string | null;
        eval_count?: number | null;
        prompt_eval_count?: number | null;
        created_at?: string;
      };

      const text = typeof json.message?.content === 'string' ? json.message.content : '';
      const content = text.length > 0 ? [{ type: 'text' as const, text }] : [];
      const finishReason = mapFinishReason(json.done_reason ?? 'stop');

      return {
        content,
        finishReason,
        usage: {
          inputTokens: json.prompt_eval_count ?? undefined,
          outputTokens: json.eval_count ?? undefined,
          totalTokens:
            json.prompt_eval_count != null && json.eval_count != null
              ? json.prompt_eval_count + json.eval_count
              : undefined,
        },
        response: {
          id: `${modelId}-${Date.now()}`,
          modelId,
          timestamp: json.created_at ? new Date(json.created_at) : new Date(),
          headers: toHeadersRecord(response.headers),
          body: json,
        },
        warnings,
        request: { body: JSON.stringify(body) },
      };
    },
    async doStream(options) {
      const { payload, warnings } = buildPayload(options);
      const body = { ...payload, stream: true };
      const response = await performRequest(body, options);
      const responseHeaders = toHeadersRecord(response.headers);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Ollama response did not include a readable stream.');
      }

      let finishReason: ReturnType<typeof mapFinishReason> = 'unknown';
      let usage = {
        inputTokens: undefined as number | undefined,
        outputTokens: undefined as number | undefined,
        totalTokens: undefined as number | undefined,
      };

      const stream = new ReadableStream<LanguageModelV2StreamPart>({
        async start(controller) {
          controller.enqueue({ type: 'stream-start', warnings });
          controller.enqueue({
            type: 'response-metadata',
            id: `${modelId}-${Date.now()}`,
            modelId,
            timestamp: new Date(),
          });

          const decoder = new TextDecoder();
          let buffer = '';
          let textStarted = false;

          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              buffer = await processBuffer({ buffer, controller });
            }
            buffer += decoder.decode();
            if (buffer.trim().length > 0) {
              buffer = await processBuffer({ buffer, controller, flush: true });
            }
          } catch (error) {
            finishReason = 'error';
            controller.enqueue({ type: 'error', error });
          } finally {
            if (textStarted) {
              controller.enqueue({ type: 'text-end', id: 'text-0' });
            }
            controller.enqueue({ type: 'finish', finishReason, usage });
            controller.close();
          }

          async function processBuffer(params: {
            buffer: string;
            controller: ReadableStreamDefaultController<LanguageModelV2StreamPart>;
            flush?: boolean;
          }) {
            const { controller, flush } = params;
            let remaining = params.buffer;
            let newlineIndex = remaining.indexOf('\n');

            while (newlineIndex !== -1) {
              const rawLine = remaining.slice(0, newlineIndex).trim();
              remaining = remaining.slice(newlineIndex + 1);
              if (rawLine.length > 0) {
                if (options.includeRawChunks) {
                  controller.enqueue({ type: 'raw', rawValue: rawLine });
                }
                try {
                  const parsed = JSON.parse(rawLine) as Record<string, unknown>;
                  if (parsed.done === true) {
                    finishReason = mapFinishReason(parsed.done_reason ?? 'stop');
                    const promptEval =
                      typeof parsed.prompt_eval_count === 'number'
                        ? parsed.prompt_eval_count
                        : undefined;
                    const evalCount =
                      typeof parsed.eval_count === 'number' ? parsed.eval_count : undefined;
                    usage = {
                      inputTokens: promptEval,
                      outputTokens: evalCount,
                      totalTokens:
                        promptEval != null && evalCount != null
                          ? promptEval + evalCount
                          : undefined,
                    };
                  } else if (typeof parsed.message === 'object' && parsed.message !== null) {
                    const text =
                      typeof (parsed.message as { content?: unknown }).content === 'string'
                        ? (parsed.message as { content?: string }).content!
                        : '';
                    if (text.length > 0) {
                      if (!textStarted) {
                        textStarted = true;
                        controller.enqueue({ type: 'text-start', id: 'text-0' });
                      }
                      controller.enqueue({ type: 'text-delta', id: 'text-0', delta: text });
                    }
                  } else if (parsed.error) {
                    finishReason = 'error';
                    controller.enqueue({ type: 'error', error: parsed.error });
                  }
                } catch (error) {
                  controller.enqueue({ type: 'error', error });
                  finishReason = 'error';
                }
              }
              newlineIndex = remaining.indexOf('\n');
            }

            if (flush && remaining.trim().length > 0) {
              try {
                const parsed = JSON.parse(remaining.trim()) as Record<string, unknown>;
                if (parsed.done === true) {
                  finishReason = mapFinishReason(parsed.done_reason ?? 'stop');
                  const promptEval =
                    typeof parsed.prompt_eval_count === 'number'
                      ? parsed.prompt_eval_count
                      : undefined;
                  const evalCount =
                    typeof parsed.eval_count === 'number' ? parsed.eval_count : undefined;
                  usage = {
                    inputTokens: promptEval,
                    outputTokens: evalCount,
                    totalTokens:
                      promptEval != null && evalCount != null ? promptEval + evalCount : undefined,
                  };
                }
              } catch (error) {
                controller.enqueue({ type: 'error', error });
                finishReason = 'error';
              }
              return '';
            }

            return remaining;
          }
        },
        cancel(reason) {
          try {
            void reader.cancel(reason);
          } catch {
            // ignore cancellation errors
          }
        },
      });

      return {
        stream,
        response: {
          headers: responseHeaders,
        },
        warnings,
        request: { body: JSON.stringify(body) },
      };
    },
  };
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)
    )
  ) as T;
}

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

function ensureApiBase(url: string) {
  const normalized = trimTrailingSlash(url);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

async function safeReadBody(response: Response) {
  try {
    return await response.text();
  } catch {
    return '<unreadable>';
  }
}
