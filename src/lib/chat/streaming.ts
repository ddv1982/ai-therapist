import { streamText } from 'ai';

export type ToolChoice = 'none' | 'required' | string;

export async function streamChatCompletion(params: {
  model: string;
  system?: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; id?: string }>;
  maxTokens?: number;
  tools?: Record<string, unknown>;
  toolChoice?: ToolChoice;
  telemetry?: { isEnabled?: boolean };
}) {
  const { model, system, messages, maxTokens, tools, toolChoice, telemetry } = params;
  const args: Record<string, unknown> = {
    model,
    system,
    messages,
    experimental_telemetry: telemetry,
  };
  if (typeof maxTokens === 'number') args.maxTokens = maxTokens;
  if (tools) args.tools = tools;
  if (toolChoice) args.toolChoice = toolChoice as unknown as 'auto' | 'none' | 'required';
  return streamText(args as Parameters<typeof streamText>[0]);
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


