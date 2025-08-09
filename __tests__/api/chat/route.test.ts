import { POST } from '@/app/api/chat/route';

// Mock all the dependencies
jest.mock('groq-sdk');
jest.mock('@/lib/therapy-prompts');
jest.mock('@/lib/logger');
jest.mock('@/lib/api-auth');
jest.mock('@/lib/error-utils');

// Mock NextResponse to return a simple response for testing
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: any, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
      headers: { get: jest.fn() }
    }))
  }
}));

// Mock imports
import { Groq } from 'groq-sdk';
import { buildMemoryEnhancedPrompt } from '@/lib/therapy-prompts';
import { logger, createRequestLogger } from '@/lib/logger';
import { validateApiAuth, createAuthErrorResponse } from '@/lib/api-auth';
import { handleAIError } from '@/lib/error-utils';
import { NextResponse } from 'next/server';

// Type the mocked functions
const MockedGroq = jest.mocked(Groq);
const mockBuildMemoryEnhancedPrompt = jest.mocked(buildMemoryEnhancedPrompt);
const mockLogger = jest.mocked(logger);
const mockCreateRequestLogger = jest.mocked(createRequestLogger);
const mockValidateApiAuth = jest.mocked(validateApiAuth);
const mockCreateAuthErrorResponse = jest.mocked(createAuthErrorResponse);
const mockHandleAIError = jest.mocked(handleAIError);
const mockNextResponseJson = jest.mocked(NextResponse.json);

// Mock globals
global.Response = class MockResponse {
  constructor(public body?: any, public init?: ResponseInit) {}
  get status() { return this.init?.status || 200; }
  headers = {
    get: jest.fn((name: string) => {
      if (name === 'content-type') return 'text/event-stream';
      if (name === 'cache-control') return 'no-cache';
      if (name === 'connection') return 'keep-alive';
      return null;
    })
  };
  json() { return Promise.resolve(JSON.parse(this.body || '{}')); }
} as any;

global.ReadableStream = class MockReadableStream {
  constructor(public source: any) {}
} as any;

global.TextEncoder = class MockTextEncoder {
  encode(str: string) { return new Uint8Array(Buffer.from(str)); }
} as any;

// Helper to create mock request
function createMockRequest(body: any, options: { url?: string } = {}): any {
  return {
    json: jest.fn().mockResolvedValue(body),
    nextUrl: new URL(options.url || 'http://localhost:3000/api/chat'),
    headers: new Map([['content-type', 'application/json']])
  };
}

// Mock Groq completion
function createMockCompletion() {
  return {
    async *[Symbol.asyncIterator]() {
      yield { choices: [{ delta: { content: 'Test response' } }] };
    }
  };
}

describe('/api/chat Route - Core Functionality', () => {
  let mockGroqInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGroqInstance = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(createMockCompletion())
        }
      }
    };
    MockedGroq.mockImplementation(() => mockGroqInstance);
    
    mockCreateRequestLogger.mockReturnValue({
      requestId: 'test-id',
      ip: '127.0.0.1',
      userAgent: 'test'
    });
    
    mockValidateApiAuth.mockResolvedValue({ isValid: true });
    mockBuildMemoryEnhancedPrompt.mockReturnValue('System prompt');
    
    global.fetch = jest.fn();
  });

  describe('Authentication', () => {
    it('should return 401 for invalid authentication', async () => {
      mockValidateApiAuth.mockResolvedValue({ 
        isValid: false, 
        error: 'Invalid auth' 
      });
      
      mockCreateAuthErrorResponse.mockReturnValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid auth' })
      } as any);

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request);
      
      expect(mockValidateApiAuth).toHaveBeenCalledWith(request);
      expect(response.status).toBe(401);
    });

    it('should proceed with valid authentication', async () => {
      process.env.GROQ_API_KEY = 'test-key';
      
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        apiKey: 'test-key'
      });

      const response = await POST(request);

      expect(mockValidateApiAuth).toHaveBeenCalledWith(request);
      // Response should be truthy and have streaming headers
      expect(response).toBeTruthy();
      expect(response.headers).toBeTruthy();
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when messages are missing', async () => {
      const mockErrorResponse = {
        status: 400,
        json: () => Promise.resolve({ error: 'Messages are required' })
      };
      
      mockNextResponseJson.mockReturnValue(mockErrorResponse as any);

      const request = createMockRequest({
        apiKey: 'test-key'
      });

      const response = await POST(request);

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        { error: 'Messages are required' },
        { status: 400 }
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 when API key is missing', async () => {
      delete process.env.GROQ_API_KEY;
      
      mockNextResponseJson.mockReturnValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Groq API key is required' })
      } as any);

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request);

      expect(mockNextResponseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Groq API key is required')
        }),
        { status: 400 }
      );
    });

    it('should use environment API key when available', async () => {
      process.env.GROQ_API_KEY = 'env-key';
      
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      await POST(request);

      expect(MockedGroq).toHaveBeenCalledWith({ apiKey: 'env-key' });
    });
  });

  describe('Model Selection', () => {
    beforeEach(() => {
      process.env.GROQ_API_KEY = 'test-key';
    });

    it('should use gpt-oss-20b for regular chat', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      await POST(request);

      expect(mockGroqInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openai/gpt-oss-20b'
        })
      );
    });

    it('should use gpt-oss-120b for CBT content', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'CBT Thought Record analysis' }]
      });

      await POST(request);

      expect(mockGroqInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openai/gpt-oss-120b'
        })
      );
    });

    it('should detect various CBT patterns', async () => {
      const cbtPatterns = [
        '**Situation:** Test',
        '**Thoughts:** Test', 
        '**Emotions:** Test',
        '**Physical Sensations:** Test',
        '**Behaviors:** Test'
      ];

      for (const pattern of cbtPatterns) {
        jest.clearAllMocks();
        mockGroqInstance.chat.completions.create.mockResolvedValue(createMockCompletion());
        
        const request = createMockRequest({
          messages: [{ role: 'user', content: pattern }]
        });

        await POST(request);

        expect(mockGroqInstance.chat.completions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'openai/gpt-oss-120b'
          })
        );
      }
    });
  });

  describe('Memory Context', () => {
    beforeEach(() => {
      process.env.GROQ_API_KEY = 'test-key';
    });

    it('should skip memory loading without sessionId', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      await POST(request);

      expect(fetch).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'No sessionId provided, skipping memory context loading',
        expect.any(Object)
      );
    });

    it('should load memory context with sessionId', async () => {
      const mockMemory = {
        success: true,
        memoryContext: [{
          sessionTitle: 'Previous',
          sessionDate: '2024-01-01',
          reportDate: '2024-01-01',
          summary: 'Summary',
          content: 'Content'
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMemory)
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        sessionId: 'test-session'
      });

      await POST(request);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/reports/memory?excludeSessionId=test-session&limit=3',
        expect.objectContaining({ method: 'GET' })
      );
      
      expect(mockBuildMemoryEnhancedPrompt).toHaveBeenCalledWith(mockMemory.memoryContext);
    });

    it('should handle memory fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error')
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        sessionId: 'test-session'
      });

      const response = await POST(request);

      // Should still return a valid response despite memory error
      expect(response).toBeTruthy(); 
      expect(response.headers).toBeTruthy();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Memory endpoint returned error response',
        expect.any(Object)
      );
    });
  });

  describe('Chat Parameters', () => {
    beforeEach(() => {
      process.env.GROQ_API_KEY = 'test-key';
    });

    it('should use default parameters', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      await POST(request);

      expect(mockGroqInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.6,
          max_tokens: 30000,
          top_p: 1,
          stream: true
        })
      );
    });

    it('should use custom parameters', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.8,
        maxTokens: 2000,
        topP: 0.9
      });

      await POST(request);

      expect(mockGroqInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
          max_tokens: 2000,
          top_p: 0.9
        })
      );
    });

    it('should add reasoning effort when valid', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        reasoningEffort: 'high'
      });

      await POST(request);

      expect(mockGroqInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reasoning_effort: 'high'
        })
      );
    });

    it('should not add invalid reasoning effort', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        reasoningEffort: 'invalid'
      });

      await POST(request);

      const callArgs = mockGroqInstance.chat.completions.create.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('reasoning_effort');
    });

    it('should add browser search tools for OpenAI models', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        browserSearchEnabled: true
      });

      await POST(request);

      expect(mockGroqInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: [{ type: "browser_search" }]
        })
      );
    });
  });

  describe('System Prompt Integration', () => {
    beforeEach(() => {
      process.env.GROQ_API_KEY = 'test-key';
    });

    it('should include system prompt in messages', async () => {
      const userMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ];

      const request = createMockRequest({
        messages: userMessages
      });

      await POST(request);

      expect(mockGroqInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'System prompt' },
            ...userMessages
          ]
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.GROQ_API_KEY = 'test-key';
    });

    it('should handle Groq API errors gracefully', async () => {
      const apiError = new Error('Groq API error');
      mockGroqInstance.chat.completions.create.mockRejectedValue(apiError);
      
      mockHandleAIError.mockReturnValue({
        status: 500,
        json: () => Promise.resolve({ error: 'API Error' })
      } as any);

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request);

      expect(mockHandleAIError).toHaveBeenCalledWith(apiError, expect.any(Object));
      expect(response.status).toBe(500);
    });

    it('should handle final errors with handleAIError', async () => {
      const error = new Error('Final error');
      mockGroqInstance.chat.completions.create.mockRejectedValue(error);
      
      mockHandleAIError.mockReturnValue({
        status: 500,
        json: () => Promise.resolve({ error: 'AI Error' })
      } as any);

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      const response = await POST(request);

      expect(mockHandleAIError).toHaveBeenCalledWith(error, expect.any(Object));
      expect(response.status).toBe(500);
    });
  });

  describe('Logging', () => {
    beforeEach(() => {
      process.env.GROQ_API_KEY = 'test-key';
    });

    it('should log chat request received', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }]
      });

      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Chat request received',
        expect.any(Object)
      );
    });

    it('should log chat settings', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.8,
        browserSearchEnabled: true
      });

      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Using chat settings',
        expect.objectContaining({
          model: 'openai/gpt-oss-20b',
          temperature: 0.8,
          browserSearchEnabled: true
        })
      );
    });

    it('should log reasoning effort when enabled', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        reasoningEffort: 'medium'
      });

      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Reasoning effort enabled',
        expect.objectContaining({
          reasoningEffort: 'medium'
        })
      );
    });

    it('should log browser search enabled', async () => {
      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        browserSearchEnabled: true
      });

      await POST(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Browser search enabled for OpenAI model',
        expect.objectContaining({
          browserSearchEnabled: true
        })
      );
    });
  });
});