/**
 * AI SDK v6 configuration
 *
 * This config is prepared for future AI SDK DevTools integration.
 * DevTools provide real-time debugging for AI streams in development.
 *
 * Future usage (when DevTools are enabled):
 * ```ts
 * import { aiConfig } from '@/config/ai-config';
 * import { streamText, experimental_devtools } from 'ai';
 *
 * const result = await streamText({
 *   model,
 *   messages,
 *   experimental_devtools: aiConfig.devTools ? experimental_devtools() : undefined,
 * });
 * ```
 *
 * @see https://sdk.vercel.ai/docs/ai-sdk-core/telemetry
 */
export const aiConfig = {
  /** Enable AI SDK DevTools in development mode only */
  devTools: process.env.NODE_ENV === 'development',
  /** Control AI SDK warning logs */
  warnings: process.env.AI_SDK_LOG_WARNINGS !== 'false',
} as const;

export type AIConfig = typeof aiConfig;
