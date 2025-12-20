/**
 * BYOK (Bring Your Own Key) Helper
 *
 * Centralized utilities for BYOK functionality.
 * Keys are sent over HTTPS via header only (not body) for security.
 */

import { MODEL_IDS } from '@/ai/model-metadata';

/** Header name for BYOK API key */
export const BYOK_HEADER_NAME = 'X-BYOK-Key';

/** OpenAI model name used for BYOK (without provider prefix) */
export const BYOK_OPENAI_MODEL = 'gpt-5-mini';

/**
 * Extract BYOK key from request header
 */
export function extractBYOKKey(headers: Headers): string | null {
  const headerKey = headers.get(BYOK_HEADER_NAME);
  return headerKey && headerKey.length > 0 ? headerKey : null;
}

/**
 * Create BYOK headers object for fetch requests
 */
export function createBYOKHeaders(byokKey: string | null | undefined): Record<string, string> | undefined {
  return byokKey ? { [BYOK_HEADER_NAME]: byokKey } : undefined;
}

/**
 * Get effective model ID based on BYOK status
 */
export function getEffectiveModelId(byokKey: string | null | undefined, defaultModelId: string): string {
  return byokKey ? MODEL_IDS.byok : defaultModelId;
}
