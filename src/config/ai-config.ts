/**
 * AI SDK configuration
 * @see https://sdk.vercel.ai/docs
 */
export const aiConfig = {
  /** Enable AI SDK DevTools in development mode only */
  devTools: process.env.NODE_ENV === 'development',
  /** Control AI SDK warning logs */
  warnings: process.env.AI_SDK_LOG_WARNINGS !== 'false',
} as const;

export type AIConfig = typeof aiConfig;
