/**
 * Tests for API Keys Management Hook
 *
 * Tests the useApiKeys hook functionality including:
 * - Key storage and retrieval from localStorage
 * - Key validation with provider APIs
 * - Remember preference handling
 * - Error handling and loading states
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useApiKeys,
  validateOpenAIKey,
  PROVIDERS,
  ApiKeysProvider,
} from '@/contexts/api-keys-context';

// Create mock for useAuth that we can control per test
const mockUseAuth = jest.fn();

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignIn: () => null,
  SignUp: () => null,
  UserButton: () => null,
  UserProfile: () => null,
}));

// Mock fetch for validation functions
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
let mockLocalStorage: Record<string, string> = {};

// Wrapper component with provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ApiKeysProvider>{children}</ApiKeysProvider>
);

describe('useApiKeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage = {};

    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return mockLocalStorage[key] ?? null;
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete mockLocalStorage[key];
    });

    mockUseAuth.mockReturnValue({
      userId: 'user_test123',
      isLoaded: true,
    });
  });

  describe('initialization', () => {
    it('loads existing keys from localStorage on mount when remember is true', async () => {
      mockLocalStorage['byok_key_openai'] = 'sk-openai-key';
      mockLocalStorage['byok_remember_openai'] = 'true';

      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.keys.openai).toBe('sk-openai-key');
      expect(result.current.isRemembered('openai')).toBe(true);
    });

    it('does not load key if remember is false', async () => {
      mockLocalStorage['byok_key_openai'] = 'sk-openai-key';
      // No remember flag set

      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.keys.openai).toBeUndefined();
    });

    it('shows loading state while auth is loading', () => {
      mockUseAuth.mockReturnValue({
        userId: null,
        isLoaded: false,
      });

      const { result } = renderHook(() => useApiKeys(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('hasKey', () => {
    it('returns false when no key is configured', async () => {
      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasKey('openai')).toBe(false);
    });

    it('returns true when key is configured', async () => {
      mockLocalStorage['byok_key_openai'] = 'sk-test';
      mockLocalStorage['byok_remember_openai'] = 'true';

      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasKey('openai')).toBe(true);
    });
  });

  describe('setKey', () => {
    it('stores the key in state and localStorage when remember is true', async () => {
      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setKey('openai', 'sk-test-key', true);
      });

      expect(result.current.keys.openai).toBe('sk-test-key');
      expect(mockLocalStorage['byok_key_openai']).toBe('sk-test-key');
      expect(mockLocalStorage['byok_remember_openai']).toBe('true');
    });

    it('stores the key only in state when remember is false', async () => {
      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setKey('openai', 'sk-test-key', false);
      });

      expect(result.current.keys.openai).toBe('sk-test-key');
      expect(mockLocalStorage['byok_key_openai']).toBeUndefined();
    });
  });

  describe('removeKey', () => {
    it('removes the key from localStorage and state', async () => {
      mockLocalStorage['byok_key_openai'] = 'sk-test';
      mockLocalStorage['byok_remember_openai'] = 'true';

      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.removeKey('openai');
      });

      expect(mockLocalStorage['byok_key_openai']).toBeUndefined();
      expect(mockLocalStorage['byok_remember_openai']).toBeUndefined();
      expect(result.current.hasKey('openai')).toBe(false);
    });
  });

  describe('isRemembered', () => {
    it('returns true when key is stored with remember flag', async () => {
      mockLocalStorage['byok_key_openai'] = 'sk-test';
      mockLocalStorage['byok_remember_openai'] = 'true';

      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isRemembered('openai')).toBe(true);
    });

    it('returns false when no remember flag', async () => {
      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isRemembered('openai')).toBe(false);
    });
  });

  describe('isActive', () => {
    it('defaults to false', async () => {
      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('can be toggled', async () => {
      mockLocalStorage['byok_key_openai'] = 'sk-test';
      mockLocalStorage['byok_remember_openai'] = 'true';

      const { result } = renderHook(() => useApiKeys(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setActive(true);
      });

      expect(result.current.isActive).toBe(true);
      expect(mockLocalStorage['byok_active']).toBe('true');

      act(() => {
        result.current.setActive(false);
      });

      expect(result.current.isActive).toBe(false);
      expect(mockLocalStorage['byok_active']).toBeUndefined();
    });
  });
});

describe('PROVIDERS', () => {
  it('contains only openai', () => {
    expect(PROVIDERS).toEqual(['openai']);
  });
});

describe('validateOpenAIKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns valid for successful API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const result = await validateOpenAIKey('sk-test-key');

    expect(result.valid).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.objectContaining({
        headers: { Authorization: 'Bearer sk-test-key' },
      })
    );
  });

  it('returns invalid for 401 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    const result = await validateOpenAIKey('sk-invalid');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid');
  });
});


