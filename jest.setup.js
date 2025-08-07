import '@testing-library/jest-dom'

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

// Mock Groq SDK
jest.mock('groq-sdk', () => ({
  Groq: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}))

// Mock react-markdown with better simulation
jest.mock('react-markdown', () => {
  const React = require('react');
  return function ReactMarkdown({ children }) {
    // Simple markdown processing for testing
    if (typeof children === 'string') {
      // Process bold text **text** -> <strong>text</strong>
      let processed = children.replace(/\*\*(.*?)\*\*/g, '$1');
      
      // Process list items - * item -> • item  
      processed = processed.replace(/^- (.+)$/gm, '• $1');
      
      // Split by lines and process each
      const lines = processed.split('\n');
      return lines.map((line, index) => {
        const key = `line-${index}`;
        if (line.startsWith('• ')) {
          return React.createElement('div', { key }, line.substring(2));
        }
        if (line.startsWith('| ')) {
          // Simple table simulation
          const cells = line.split('|').filter(cell => cell.trim());
          return React.createElement('div', { key }, cells.join(' '));
        }
        return React.createElement('div', { key }, line);
      });
    }
    return children;
  }
})

// Mock remark-gfm
jest.mock('remark-gfm', () => () => {})

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

// Mock Next.js specific classes
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    cookies: new Map(),
    nextUrl: { pathname: new URL(url).pathname },
    json: jest.fn(),
    text: jest.fn(),
    clone: jest.fn(),
  })),
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
      body: JSON.stringify(data),
    })),
    next: jest.fn(),
    redirect: jest.fn(),
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

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}