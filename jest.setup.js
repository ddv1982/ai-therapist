import '@testing-library/jest-dom'

// Polyfill getComputedStyle to avoid jsdom "Not implemented" when a pseudo-element argument is provided
if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
  const __originalGetComputedStyle = window.getComputedStyle.bind(window);
  Object.defineProperty(window, 'getComputedStyle', {
    value: (elt) => {
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
jest.mock('@hookform/resolvers/zod', () => {
  return {
    zodResolver: (schema, _schemaOptions, resolverOptions) => {
      return async (values, _ctx, options) => {
        try {
          const parsed = await (schema.parseAsync ? schema.parseAsync(values) : schema.parse(values));
          if (options && options.shouldUseNativeValidation) {
            // no-op in tests
          }
          return { values: resolverOptions && resolverOptions.raw ? values : parsed, errors: {} };
        } catch (e) {
          const issues = (e && (e.issues || e.errors)) || [];
          const errors = {};
          for (const issue of issues) {
            const path = Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || '');
            if (!errors[path]) errors[path] = { message: issue.message, type: issue.code };
          }
          return { values: {}, errors };
        }
      };
    },
  };
});

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
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock AI SDK
jest.mock('ai', () => ({
  streamText: jest.fn(() => ({
    toTextStreamResponse: jest.fn(() => new Response('test response')),
  })),
  convertToModelMessages: jest.fn((messages) => messages),
}))

// Mock AI SDK Groq Provider
jest.mock('@ai-sdk/groq', () => ({
  groq: jest.fn((modelId) => ({ modelId })),
  createGroq: jest.fn(() => (modelId) => ({ modelId })),
}))

// Mock AI SDK React
jest.mock('@ai-sdk/react', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
  })),
}))

// ReactMarkdown and remark-gfm no longer used - removed from dependencies
// Mock Streamdown to avoid ESM transform issues and keep tests fast
jest.mock('streamdown', () => {
  const React = require('react');
  function SimpleMarkdown({ children, className }) {
    if (!children) return null;
    const text = String(children);
    // Very lightweight markdown handling for tests:
    // - Strip **bold** markers
    // - Convert simple lists starting with '- '
    // - Split paragraphs by double newlines
    const stripped = text.replace(/\*\*(.*?)\*\*/g, '$1');
    const blocks = stripped.split(/\n\n+/);
    const elements = [];
    for (const block of blocks) {
      const lines = block.split(/\n/);
      if (lines.every(l => l.trim().startsWith('- '))) {
        elements.push(
          React.createElement(
            'ul',
            { key: `ul-${elements.length}` },
            lines.map((l, i) => React.createElement('li', { key: `li-${i}` }, l.trim().slice(2)))
          )
        );
      } else {
        elements.push(React.createElement('p', { key: `p-${elements.length}` }, block.replace(/\n/g, ' ')));
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
    getRandomValues: (array) => {
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
    }
  },
  writable: true,
  configurable: true,
})

// Allow crypto to be temporarily overridden in tests
global.mockCrypto = (mockImplementation) => {
  Object.defineProperty(global, 'crypto', {
    value: mockImplementation,
    writable: true,
    configurable: true,
  })
}

global.restoreCrypto = () => {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => {
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
      getRandomValues: (array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
      subtle: {
        importKey: jest.fn(),
        encrypt: jest.fn(),
        decrypt: jest.fn(),
      }
    },
    writable: true,
    configurable: true,
  })
}

// Mock environment variables
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long-for-testing';
process.env.CSRF_SECRET = 'test-csrf-secret-for-testing';
process.env.NODE_ENV = 'test';
// Ensure rate limiting is enabled by default in tests (individual suites may override)
process.env.RATE_LIMIT_DISABLED = 'false';

// Mock Next.js specific classes
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Headers(init?.headers || {}),
    cookies: {
      get: (key) => {
        const cookieHeader = (init?.headers && (init.headers['cookie'] || init.headers['Cookie'])) || '';
        if (!cookieHeader) return undefined;
        const map = new Map(String(cookieHeader).split(/;\s*/).filter(Boolean).map((p) => p.split('=')));
        const value = map.get(key);
        return value ? { name: key, value } : undefined;
      },
      set: jest.fn(),
      delete: jest.fn(),
    },
    nextUrl: { pathname: new URL(url).pathname, host: new URL(url).host },
    json: jest.fn(),
    text: jest.fn(),
    clone: jest.fn(),
  })),
  NextResponse: {
    json: (data, init) => {
      const initial = init || {};
      const headerMap = new Map(Object.entries(initial.headers || {}));
      // Provide a DOM-like Headers API subset used by our code/tests
      const headers = {
        _map: headerMap,
        get: (key) => headerMap.get(key),
        set: (key, value) => headerMap.set(key, String(value)),
        has: (key) => headerMap.has(key),
        delete: (key) => headerMap.delete(key),
        entries: () => headerMap.entries(),
      };
      const body = JSON.stringify(data);
      return {
        status: initial.status || 200,
        headers,
        body,
        json: async () => data,
        text: async () => body,
        cookies: { set: jest.fn(), delete: jest.fn() },
      };
    },
    next: () => ({ type: 'next', cookies: { set: jest.fn(), delete: jest.fn() } }),
    redirect: (_url, _status) => ({ type: 'redirect', cookies: { set: jest.fn(), delete: jest.fn() } }),
  },
}))

// Mock standard Request/Response for compatibility
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this._url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
  }
  
  get url() {
    return this._url;
  }
  
  get(name) {
    return this.headers.get(name);
  }
};

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  
  static json(data, init) {
    return new MockResponse(JSON.stringify(data), init);
  }
};

// Mock Buffer if not available
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Mock Canvas and jsPDF dependencies
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

global.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,test');
global.HTMLCanvasElement.prototype.getImageData = jest.fn(() => ({ data: new Array(4) }));

// Removed jsPDF mocks (PDF export removed)

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// Polyfill ResizeObserver for components that rely on it (e.g., Radix UI)
if (typeof global.ResizeObserver === 'undefined') {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-ignore
  global.ResizeObserver = ResizeObserver;
}