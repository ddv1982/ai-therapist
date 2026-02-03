/**
 * API Key Management Hook
 *
 * Re-exports from api-keys-context for backwards compatibility.
 * All state is now managed through the ApiKeysProvider context.
 *
 * @module use-api-keys
 */

'use client';

export { useApiKeys, BYOK_MODEL, PROVIDERS, type Provider } from '@/contexts/api-keys-context';
