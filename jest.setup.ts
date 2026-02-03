import '@testing-library/jest-dom';

if (typeof global.Headers === 'undefined') {
  class BasicHeaders {
    private map = new Map<string, string>();

    constructor(init?: HeadersInit) {
      if (!init) return;
      if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.set(String(key), String(value));
        }
      } else if (init instanceof BasicHeaders) {
        for (const [key, value] of init.entries()) {
          this.set(key, value);
        }
      } else if (typeof init === 'object') {
        for (const [key, value] of Object.entries(init)) {
          this.set(key, String(value));
        }
      }
    }

    get(name: string) {
      return this.map.get(name.toLowerCase()) ?? null;
    }

    set(name: string, value: string) {
      this.map.set(name.toLowerCase(), String(value));
    }

    append(name: string, value: string) {
      const key = name.toLowerCase();
      const existing = this.map.get(key);
      this.map.set(key, existing ? `${existing}, ${value}` : String(value));
    }

    has(name: string) {
      return this.map.has(name.toLowerCase());
    }

    forEach(callback: (value: string, key: string) => void) {
      for (const [key, value] of this.map.entries()) {
        callback(value, key);
      }
    }

    entries() {
      return this.map.entries();
    }

    [Symbol.iterator]() {
      return this.entries();
    }
  }

  global.Headers = BasicHeaders as unknown as typeof global.Headers;
}

if (typeof global.Request === 'undefined') {
  class BasicRequest {
    url: string;
    method: string;
    headers: Headers;
    body?: BodyInit | null;

    constructor(input: string, init?: RequestInit) {
      this.url = input;
      this.method = init?.method ?? 'GET';
      this.headers = new global.Headers(init?.headers as HeadersInit);
      this.body = init?.body ?? null;
    }
  }
  global.Request = BasicRequest as unknown as typeof global.Request;
}

if (typeof global.Response === 'undefined') {
  class BasicResponse {
    headers: Headers;
    status: number;
    ok: boolean;
    body?: BodyInit | null;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.body = body ?? null;
      this.status = init?.status ?? 200;
      this.headers = new global.Headers(init?.headers as HeadersInit);
      this.ok = this.status >= 200 && this.status < 300;
    }

    static json(data: unknown, init?: ResponseInit) {
      const headers = new global.Headers(init?.headers as HeadersInit);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      return new BasicResponse(JSON.stringify(data), { ...init, headers });
    }

    async json() {
      if (!this.body) return null;
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }

    async text() {
      if (this.body === null || this.body === undefined) return '';
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
  }
  global.Response = BasicResponse as unknown as typeof global.Response;
}

// Provide a consistent Next.js server mock for tests expecting NextResponse.json
jest.mock('next/server', () => {
  const BaseRequest = global.Request as typeof Request;
  const BaseResponse = global.Response as typeof Response;

  class MockNextRequest extends BaseRequest {}

  class MockNextResponse extends BaseResponse {
    static json(data: unknown, init?: ResponseInit) {
      const headers = new global.Headers(init?.headers as HeadersInit);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      return new MockNextResponse(JSON.stringify(data), { ...init, headers });
    }
  }

  return {
    __esModule: true,
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long-for-tests!';
}

// Polyfill getComputedStyle to avoid jsdom "Not implemented" when a pseudo-element argument is provided
if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
  const __originalGetComputedStyle = window.getComputedStyle.bind(window);
  Object.defineProperty(window, 'getComputedStyle', {
    value: (elt: Element) => {
      try {
        // Ignore the second pseudoElt argument to prevent jsdom from throwing
        return __originalGetComputedStyle(elt);
      } catch {
        return {
          getPropertyValue: () => '',
          display: 'block',
          visibility: 'visible',
          opacity: '1',
          content: 'none',
        };
      }
    },
    writable: true,
    configurable: true,
  });
}

// Ensure Zod v4 compatibility with @hookform/resolvers by mocking the resolver
jest.mock(
  '@hookform/resolvers/zod',
  () => {
    return {
      zodResolver: (schema: any, _schemaOptions: any, resolverOptions: any) => {
        return async (
          values: unknown,
          _ctx: unknown,
          options: { shouldUseNativeValidation?: boolean }
        ) => {
          try {
            const parsed = await (schema.parseAsync
              ? schema.parseAsync(values)
              : schema.parse(values));
            if (options && options.shouldUseNativeValidation) {
              // no-op in tests
            }
            return { values: resolverOptions && resolverOptions.raw ? values : parsed, errors: {} };
          } catch (e: any) {
            const issues = (e && (e.issues || e.errors)) || [];
            const errors: Record<string, { message: string; type: string }> = {};
            for (const issue of issues) {
              const path = Array.isArray(issue.path)
                ? issue.path.join('.')
                : String(issue.path || '');
              if (!errors[path]) errors[path] = { message: issue.message, type: issue.code };
            }
            return { values: {}, errors };
          }
        };
      },
    };
  },
  { virtual: true }
);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Mock AI SDK
jest.mock('ai', () => ({
  streamText: jest.fn(() => ({
    toTextStreamResponse: jest.fn(() => new Response('test response')),
  })),
  convertToModelMessages: jest.fn((messages: unknown) => messages),
}));

// Polyfill web streams for Node test environment
const { TransformStream, ReadableStream, WritableStream } = require('web-streams-polyfill');
if (!global.TransformStream) {
  global.TransformStream = TransformStream;
}
if (!global.ReadableStream) {
  global.ReadableStream = ReadableStream;
}
if (!global.WritableStream) {
  global.WritableStream = WritableStream;
}

// Mock AI SDK Groq Provider
jest.mock('@ai-sdk/groq', () => ({
  groq: jest.fn((modelId: string) => ({ modelId })),
  createGroq: jest.fn(() => (modelId: string) => ({ modelId })),
}));

// Mock AI SDK React
jest.mock('@ai-sdk/react', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
  })),
}));

// ReactMarkdown and remark-gfm no longer used - removed from dependencies
// Mock Streamdown to avoid ESM transform issues and keep tests fast
jest.mock('streamdown', () => {
  const React = require('react');
  function SimpleMarkdown({ children, className }: { children: any; className?: string }) {
    if (!children) return null;
    const text = String(children);
    // Very lightweight markdown handling for tests:
    // - Strip **bold** markers
    // - Convert simple lists starting with '- '
    // - Split paragraphs by double newlines
    const stripped = text.replace(/\*\*(.*?)\*\*/g, '$1');
    const blocks = stripped.split(/\n\n+/);
    const elements: React.ReactElement[] = [];
    for (const block of blocks) {
      const lines = block.split(/\n/);
      if (lines.every((line) => line.trim().startsWith('- '))) {
        elements.push(
          React.createElement(
            'ul',
            { key: `ul-${elements.length}` },
            lines.map((line, index) =>
              React.createElement('li', { key: `li-${index}` }, line.trim().slice(2))
            )
          )
        );
      } else {
        elements.push(
          React.createElement('p', { key: `p-${elements.length}` }, block.replace(/\n/g, ' '))
        );
      }
    }
    return React.createElement('div', { className }, elements);
  }
  return { Streamdown: SimpleMarkdown };
});

// Mock crypto for testing with realistic behavior
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => {
      // Generate a proper UUID v4 for testing
      const hex = '0123456789abcdef';
      let uuid = '';
      for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
          uuid += '-';
        } else if (i === 14) {
          uuid += '4'; // Version 4
        } else if (i === 19) {
          uuid += hex[Math.floor(Math.random() * 4) + 8]; // Variant bits
        } else {
          uuid += hex[Math.floor(Math.random() * 16)];
        }
      }
      return uuid;
    },
    getRandomValues: (array: Uint8Array) => {
      // Use Math.random for testing (crypto would use secure random in real environment)
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    subtle: {
      importKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
  },
  writable: true,
  configurable: true,
});

// Allow crypto to be temporarily overridden in tests
(global as any).mockCrypto = (mockImplementation: any) => {
  Object.defineProperty(global, 'crypto', {
    value: mockImplementation,
    writable: true,
    configurable: true,
  });
};

(global as any).restoreCrypto = () => {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => {
        // Generate a proper UUID v4 for testing
        const hex = '0123456789abcdef';
        let uuid = '';
        for (let i = 0; i < 36; i++) {
          if (i === 8 || i === 13 || i === 18 || i === 23) {
            uuid += '-';
          } else if (i === 14) {
            uuid += '4'; // Version 4
          } else if (i === 19) {
            uuid += hex[Math.floor(Math.random() * 4) + 8]; // Variant bits
          } else {
            uuid += hex[Math.floor(Math.random() * 16)];
          }
        }
        return uuid;
      },
      getRandomValues: (array: Uint8Array) => {
        // Use Math.random for testing (crypto would use secure random in real environment)
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
      subtle: {
        importKey: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(),
      },
    },
    writable: true,
    configurable: true,
  });
};
