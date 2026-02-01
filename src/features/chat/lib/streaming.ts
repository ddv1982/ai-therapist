import type { LanguageModel, ModelMessage, ToolChoice, ToolSet } from 'ai';
import type { SharedV2ProviderOptions } from '@ai-sdk/provider';
import { streamText, type TelemetrySettings } from 'ai';
import { getTelemetrySettings } from '@/lib/observability/telemetry';

type ChatTools = ToolSet;
type ChatToolChoice = ToolChoice<ChatTools>;

export async function streamChatCompletion(params: {
  model: LanguageModel;
  system?: string;
  messages: ModelMessage[];
  maxOutputTokens?: number;
  tools?: ChatTools;
  toolChoice?: ChatToolChoice;
  telemetry?: boolean | Partial<TelemetrySettings>;
  providerOptions?: SharedV2ProviderOptions;
}) {
  const {
    model,
    system,
    messages,
    maxOutputTokens,
    tools,
    toolChoice,
    telemetry,
    providerOptions,
  } = params;

  const args: Parameters<typeof streamText>[0] = {
    model,
    messages,
  };

  if (typeof system === 'string' && system.length > 0) {
    args.system = system;
  }
  if (typeof maxOutputTokens === 'number') {
    args.maxOutputTokens = maxOutputTokens;
  }
  if (tools) {
    args.tools = tools;
  }
  if (toolChoice) {
    args.toolChoice = toolChoice;
  }
  const telemetrySettings = getTelemetrySettings(telemetry);
  if (telemetrySettings) {
    args.experimental_telemetry = telemetrySettings;
  }
  if (providerOptions) {
    args.providerOptions = providerOptions;
  }

  return streamText(args);
}

export async function teeReadableStream(stream: ReadableStream<Uint8Array>) {
  const [a, b] = stream.tee();
  return { primary: a, secondary: b };
}

export async function collectStreamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(merged);
}
