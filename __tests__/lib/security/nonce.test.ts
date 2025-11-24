import { getNonce, getNonceAttr } from '@/lib/security/nonce';
import { headers } from 'next/headers';

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

interface MockHeaders {
  get(name: string): string | null;
}

describe('nonce', () => {
  const mockHeaders = headers as jest.MockedFunction<typeof headers>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNonce', () => {
    it('should return nonce when x-csp-nonce header exists', async () => {
      const mockNonce = 'test-nonce-12345';
      const mockHeadersObj: MockHeaders = {
        get: (name: string) => (name === 'x-csp-nonce' ? mockNonce : null),
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getNonce();

      expect(result).toBe(mockNonce);
    });

    it('should return undefined when x-csp-nonce header is missing', async () => {
      const mockHeadersObj: MockHeaders = {
        get: () => null,
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getNonce();

      expect(result).toBeUndefined();
    });

    it('should return undefined when headers return null for nonce', async () => {
      const mockHeadersObj: MockHeaders = {
        get: (name: string) => (name === 'x-csp-nonce' ? null : null),
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getNonce();

      expect(result).toBeUndefined();
    });

    it('should return empty string when nonce is empty string', async () => {
      const mockHeadersObj: MockHeaders = {
        get: (name: string) => (name === 'x-csp-nonce' ? '' : null),
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getNonce();

      expect(result).toBe('');
    });
  });

  describe('getNonceAttr', () => {
    it('should return object with nonce when header exists', async () => {
      const mockNonce = 'test-nonce-67890';
      const mockHeadersObj: MockHeaders = {
        get: (name: string) => (name === 'x-csp-nonce' ? mockNonce : null),
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getNonceAttr();

      expect(result).toEqual({ nonce: mockNonce });
    });

    it('should return empty object when header is missing', async () => {
      const mockHeadersObj: MockHeaders = {
        get: () => null,
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getNonceAttr();

      expect(result).toEqual({});
    });

    it('should return empty object when nonce is undefined', async () => {
      const mockHeadersObj: MockHeaders = {
        get: () => null,
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getNonceAttr();

      expect(result).toEqual({});
    });

    it('should be spreadable into JSX attributes', async () => {
      const mockNonce = 'jsx-nonce-abc';
      const mockHeadersObj: MockHeaders = {
        get: (name: string) => (name === 'x-csp-nonce' ? mockNonce : null),
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getNonceAttr();
      const jsxProps = { id: 'test', ...result };

      expect(jsxProps).toEqual({ id: 'test', nonce: mockNonce });
    });

    it('should not add nonce property when missing', async () => {
      const mockHeadersObj: MockHeaders = {
        get: () => null,
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getNonceAttr();
      const jsxProps = { id: 'test', ...result };

      expect(jsxProps).toEqual({ id: 'test' });
      expect('nonce' in jsxProps).toBe(false);
    });
  });

  describe('integration', () => {
    it('should work correctly in server component pattern', async () => {
      const mockNonce = 'server-component-nonce';
      const mockHeadersObj: MockHeaders = {
        get: (name: string) => (name === 'x-csp-nonce' ? mockNonce : null),
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const nonce = await getNonce();
      const attr = await getNonceAttr();

      expect(nonce).toBe(mockNonce);
      expect(attr).toEqual({ nonce: mockNonce });
    });

    it('should handle concurrent calls correctly', async () => {
      const mockNonce = 'concurrent-nonce';
      const mockHeadersObj: MockHeaders = {
        get: (name: string) => (name === 'x-csp-nonce' ? mockNonce : null),
      };
      mockHeaders.mockResolvedValue(mockHeadersObj as unknown as Awaited<ReturnType<typeof headers>>);

      const [nonce1, nonce2, attr1, attr2] = await Promise.all([
        getNonce(),
        getNonce(),
        getNonceAttr(),
        getNonceAttr(),
      ]);

      expect(nonce1).toBe(mockNonce);
      expect(nonce2).toBe(mockNonce);
      expect(attr1).toEqual({ nonce: mockNonce });
      expect(attr2).toEqual({ nonce: mockNonce });
    });
  });
});
