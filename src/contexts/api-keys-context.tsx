/**
 * API Keys Context
 *
 * Provides shared state for BYOK (Bring Your Own Key) functionality.
 * This context ensures all components share the same API keys state.
 *
 * @module api-keys-context
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useAuth } from '@clerk/nextjs';
import { BYOK_OPENAI_MODEL } from '@/features/chat/lib/byok-helper';

export type Provider = 'openai';
export const PROVIDERS: Provider[] = ['openai'];
export const BYOK_MODEL = BYOK_OPENAI_MODEL;

const STORAGE_PREFIX = 'byok_session_';
const REMEMBER_PREFIX = 'byok_remember_';
const LEGACY_STORAGE_PREFIX = 'byok_key_';
const LEGACY_REMEMBER_PREFIX = 'byok_remember_';
const ACTIVE_KEY = 'byok_active';

export interface ApiKeyState {
  openai?: string;
}

export interface RememberState {
  openai?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ApiKeyError {
  provider?: Provider;
  operation: 'load' | 'save' | 'validate' | 'remove';
  message: string;
  cause?: Error;
}

interface ApiKeysContextValue {
  keys: ApiKeyState;
  rememberKeys: RememberState;
  isActive: boolean;
  isLoading: boolean;
  error: ApiKeyError | null;
  setKey: (provider: Provider, key: string, remember: boolean) => Promise<boolean>;
  removeKey: (provider: Provider) => void;
  validateKey: (provider: Provider, key: string) => Promise<ValidationResult>;
  hasKey: (provider: Provider) => boolean;
  isRemembered: (provider: Provider) => boolean;
  setActive: (active: boolean) => void;
  clearError: () => void;
  anyKeyConfigured: boolean;
}

const ApiKeysContext = createContext<ApiKeysContextValue | null>(null);

export async function validateOpenAIKey(key: string): Promise<ValidationResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
    });

    if (response.ok) {
      return { valid: true };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData?.error?.message ||
      (response.status === 401 ? 'Invalid API key' : `API error: ${response.status}`);

    return { valid: false, error: errorMessage };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { valid: false, error: `Failed to validate key: ${message}` };
  }
}

async function validateProviderKey(provider: Provider, key: string): Promise<ValidationResult> {
  switch (provider) {
    case 'openai':
      return validateOpenAIKey(key);
    default:
      return { valid: false, error: `Unknown provider: ${provider}` };
  }
}

function getStorageKey(provider: Provider): string {
  return `${STORAGE_PREFIX}${provider}`;
}

function getRememberKey(provider: Provider): string {
  return `${REMEMBER_PREFIX}${provider}`;
}

function getLegacyStorageKey(provider: Provider): string {
  return `${LEGACY_STORAGE_PREFIX}${provider}`;
}

function getLegacyRememberKey(provider: Provider): string {
  return `${LEGACY_REMEMBER_PREFIX}${provider}`;
}

function loadFromStorage(): { keys: ApiKeyState; remember: RememberState; isActive: boolean } {
  if (typeof sessionStorage === 'undefined') {
    return { keys: {}, remember: {}, isActive: false };
  }

  const keys: ApiKeyState = {};
  const remember: RememberState = {};

  for (const provider of PROVIDERS) {
    let key = sessionStorage.getItem(getStorageKey(provider));
    let shouldRemember = sessionStorage.getItem(getRememberKey(provider)) === 'true';

    if (!key && typeof localStorage !== 'undefined') {
      const legacyKey = localStorage.getItem(getLegacyStorageKey(provider));
      const legacyRemember = localStorage.getItem(getLegacyRememberKey(provider)) === 'true';

      if (legacyKey && legacyRemember) {
        sessionStorage.setItem(getStorageKey(provider), legacyKey);
        sessionStorage.setItem(getRememberKey(provider), 'true');
        localStorage.removeItem(getLegacyStorageKey(provider));
        localStorage.removeItem(getLegacyRememberKey(provider));
        key = legacyKey;
        shouldRemember = true;
      }
    }

    if (key && shouldRemember) {
      keys[provider] = key;
      remember[provider] = true;
    }
  }

  let isActive = sessionStorage.getItem(ACTIVE_KEY) === 'true';
  if (!isActive && typeof localStorage !== 'undefined') {
    const legacyActive = localStorage.getItem(ACTIVE_KEY) === 'true';
    if (legacyActive) {
      sessionStorage.setItem(ACTIVE_KEY, 'true');
      localStorage.removeItem(ACTIVE_KEY);
      isActive = true;
    }
  }

  return { keys, remember, isActive };
}

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const { userId, isLoaded: isAuthLoaded } = useAuth();

  const [keys, setKeys] = useState<ApiKeyState>({});
  const [rememberKeys, setRememberKeys] = useState<RememberState>({});
  const [isActive, setIsActiveState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiKeyError | null>(null);

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!userId) {
      setKeys({});
      setRememberKeys({});
      setIsActiveState(false);
      try {
        for (const provider of PROVIDERS) {
          sessionStorage.removeItem(getStorageKey(provider));
          sessionStorage.removeItem(getRememberKey(provider));
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(getLegacyStorageKey(provider));
            localStorage.removeItem(getLegacyRememberKey(provider));
          }
        }
        sessionStorage.removeItem(ACTIVE_KEY);
      } catch {
        // Ignore storage errors
      }
      setIsLoading(false);
      return;
    }

    try {
      const data = loadFromStorage();
      setKeys(data.keys);
      setRememberKeys(data.remember);
      setIsActiveState(data.isActive && Boolean(data.keys.openai));
    } catch (err) {
      setError({
        operation: 'load',
        message: 'Failed to load API keys from storage',
        cause: err instanceof Error ? err : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthLoaded]);

  const clearError = useCallback(() => setError(null), []);

  const hasKey = useCallback((provider: Provider): boolean => Boolean(keys[provider]), [keys]);

  const isRemembered = useCallback(
    (provider: Provider): boolean => Boolean(rememberKeys[provider]),
    [rememberKeys]
  );

  const setActive = useCallback((active: boolean) => {
    setIsActiveState(active);
    try {
      if (active) {
        sessionStorage.setItem(ACTIVE_KEY, 'true');
      } else {
        sessionStorage.removeItem(ACTIVE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setKey = useCallback(
    async (provider: Provider, key: string, remember: boolean): Promise<boolean> => {
      clearError();

      if (!userId) {
        setError({ provider, operation: 'save', message: 'User not authenticated' });
        return false;
      }

      try {
        setKeys((prev) => ({ ...prev, [provider]: key }));
        setRememberKeys((prev) => ({ ...prev, [provider]: remember }));

        if (remember) {
          sessionStorage.setItem(getStorageKey(provider), key);
          sessionStorage.setItem(getRememberKey(provider), 'true');
        } else {
          sessionStorage.removeItem(getStorageKey(provider));
          sessionStorage.removeItem(getRememberKey(provider));
        }

        return true;
      } catch (err) {
        setError({
          provider,
          operation: 'save',
          message: 'Failed to save API key',
          cause: err instanceof Error ? err : undefined,
        });
        return false;
      }
    },
    [userId, clearError]
  );

  const removeKey = useCallback(
    (provider: Provider): void => {
      clearError();

      try {
        sessionStorage.removeItem(getStorageKey(provider));
        sessionStorage.removeItem(getRememberKey(provider));
        sessionStorage.removeItem(ACTIVE_KEY);
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(getLegacyStorageKey(provider));
          localStorage.removeItem(getLegacyRememberKey(provider));
          localStorage.removeItem(ACTIVE_KEY);
        }

        setKeys((prev) => {
          const newKeys = { ...prev };
          delete newKeys[provider];
          return newKeys;
        });
        setRememberKeys((prev) => {
          const newRemember = { ...prev };
          delete newRemember[provider];
          return newRemember;
        });
        setIsActiveState(false);
      } catch (err) {
        setError({
          provider,
          operation: 'remove',
          message: 'Failed to remove API key',
          cause: err instanceof Error ? err : undefined,
        });
      }
    },
    [clearError]
  );

  const validateKey = useCallback(
    async (provider: Provider, key: string): Promise<ValidationResult> => {
      clearError();

      try {
        return await validateProviderKey(provider, key);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Validation failed';
        setError({
          provider,
          operation: 'validate',
          message: errorMessage,
          cause: err instanceof Error ? err : undefined,
        });
        return { valid: false, error: errorMessage };
      }
    },
    [clearError]
  );

  const anyKeyConfigured = useMemo(
    () => PROVIDERS.some((provider) => Boolean(keys[provider])),
    [keys]
  );

  const value = useMemo<ApiKeysContextValue>(
    () => ({
      keys,
      rememberKeys,
      isActive,
      isLoading,
      error,
      setKey,
      removeKey,
      validateKey,
      hasKey,
      isRemembered,
      setActive,
      clearError,
      anyKeyConfigured,
    }),
    [
      keys,
      rememberKeys,
      isActive,
      isLoading,
      error,
      setKey,
      removeKey,
      validateKey,
      hasKey,
      isRemembered,
      setActive,
      clearError,
      anyKeyConfigured,
    ]
  );

  return <ApiKeysContext.Provider value={value}>{children}</ApiKeysContext.Provider>;
}

export function useApiKeys() {
  const context = useContext(ApiKeysContext);
  if (!context) {
    throw new Error('useApiKeys must be used within an ApiKeysProvider');
  }
  return context;
}
