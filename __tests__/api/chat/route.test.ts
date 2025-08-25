import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

// Mock AI SDK and providers
jest.mock('@/ai/providers', () => ({
  model: {
    languageModel: jest.fn().mockReturnValue('mock-model')
  },
  languageModels: {
    'openai/gpt-oss-20b': 'mock-model-20b',
    'openai/gpt-oss-120b': 'mock-model-120b'
  },
  defaultModel: 'openai/gpt-oss-20b'
}));

jest.mock('ai', () => ({
  streamText: jest.fn().mockReturnValue({
    toUIMessageStreamResponse: jest.fn().mockReturnValue({
      status: 200,
      headers: new Headers({
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive'
      })
    })
  }),
  convertToModelMessages: jest.fn().mockImplementation((messages) => messages)
}));

jest.mock('@/lib/therapy/therapy-prompts', () => ({
  THERAPY_SYSTEM_PROMPT: 'Mock therapeutic system prompt'
}));

// Mock imports
import { model, languageModels } from '@/ai/providers';
import { streamText } from 'ai';

// Type the mocked functions
const mockModel = jest.mocked(model);
const mockStreamText = jest.mocked(streamText);
// const _mockConvertToModelMessages = jest.mocked(convertToModelMessages);

// Helper to create mock request
function createMockRequest(body: any, options: { url?: string } = {}): NextRequest {
  const url = options.url || 'http://localhost:4000/api/chat';
  
  return {
    json: jest.fn().mockResolvedValue(body),
    nextUrl: new URL(url),
    headers: new Headers({ 'content-type': 'application/json' })
  } as any as NextRequest;
}

describe('/api/chat Route - Simplified Architecture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default streaming response
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: jest.fn().mockReturnValue({
        status: 200,
        headers: new Headers({
          'content-type': 'text/event-stream'
        })
      })
    } as any);
  });

  describe('Core Functionality', () => {
    it('should handle valid AI SDK request with messages', async () => {
      const request = createMockRequest({
        messages: [
          { id: '1', role: 'user', content: 'Hello' },
          { id: '2', role: 'assistant', content: 'Hi there!' }
        ],
        selectedModel: 'openai/gpt-oss-20b',
        sessionId: 'test-session-123'
      });

      const response = await POST(request);

      // Verify AI SDK streamText was called with correct parameters
      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'mock-model-20b', // Direct model from languageModels
        system: 'Mock therapeutic system prompt',
        messages: [
          { id: '1', role: 'user', content: 'Hello' },
          { id: '2', role: 'assistant', content: 'Hi there!' }
        ],
        toolChoice: 'none',
        experimental_telemetry: {
          isEnabled: false
        }
      });

      // Verify response structure
      expect(response).toBeTruthy();
      expect(response.status).toBe(200);
    });

    it('should use default model when not specified', async () => {
      const request = createMockRequest({
        messages: [{ id: '1', role: 'user', content: 'Hello without model' }],
        sessionId: 'test-session'
      });

      await POST(request);

      // Verify streamText was called with correct model (default 20B model)
      expect(mockStreamText).toHaveBeenCalledWith(expect.objectContaining({
        model: 'mock-model-20b'
      }));
    });

    it('should handle requests without sessionId', async () => {
      const request = createMockRequest({
        messages: [{ id: '1', role: 'user', content: 'Hello without session' }],
        selectedModel: 'openai/gpt-oss-120b'
      });

      await POST(request);

      // Verify streamText was called with correct model and parameters
      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'mock-model-120b',
        system: 'Mock therapeutic system prompt',
        messages: [{ id: '1', role: 'user', content: 'Hello without session' }],
        toolChoice: 'none',
        experimental_telemetry: {
          isEnabled: false
        }
      });
    });
  });

  describe('AI SDK Integration', () => {
    it('should handle messages without convertToModelMessages', async () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' }
      ];

      const request = createMockRequest({ messages });

      await POST(request);

      // Should pass messages directly to streamText without conversion
      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'mock-model-20b', // Uses default 20B model
        system: 'Mock therapeutic system prompt',
        messages: messages,
        toolChoice: 'none',
        experimental_telemetry: {
          isEnabled: false
        }
      });
    });

    it('should return streaming response with error handling', async () => {
      const mockStreamResponse = {
        toUIMessageStreamResponse: jest.fn().mockReturnValue({
          status: 200,
          headers: new Headers({
            'content-type': 'text/event-stream',
            'cache-control': 'no-cache'
          })
        })
      };

      mockStreamText.mockReturnValue(mockStreamResponse as any);

      const request = createMockRequest({
        messages: [{ id: '1', role: 'user', content: 'Hello' }]
      });

      const response = await POST(request);

      expect(mockStreamResponse.toUIMessageStreamResponse).toHaveBeenCalledWith({
        onError: expect.any(Function)
      });
      expect(response.status).toBe(200);
    });

    it('should handle rate limit errors', async () => {
      const mockError = new Error('Rate limit exceeded');
      // const _mockOnError = jest.fn().mockReturnValue('Rate limit exceeded. Please try again later.');

      mockStreamText.mockReturnValue({
        toUIMessageStreamResponse: jest.fn().mockImplementation((options) => {
          if (options && options.onError) {
            const errorMessage = options.onError(mockError);
            expect(errorMessage).toBe('Rate limit exceeded. Please try again later.');
          }
          return {
            status: 429,
            headers: new Headers()
          };
        })
      } as any);

      const request = createMockRequest({
        messages: [{ id: '1', role: 'user', content: 'Hello' }]
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalled();
    });

    it('should handle generic errors', async () => {
      const mockError = new Error('Something went wrong');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockStreamText.mockReturnValue({
        toUIMessageStreamResponse: jest.fn().mockImplementation((options) => {
          if (options && options.onError) {
            const errorMessage = options.onError(mockError);
            expect(errorMessage).toBe('An error occurred.');
          }
          return {
            status: 500,
            headers: new Headers()
          };
        })
      } as any);

      const request = createMockRequest({
        messages: [{ id: '1', role: 'user', content: 'Hello' }]
      });

      await POST(request);

      expect(mockStreamText).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Model Selection', () => {
    const testModels = [
      'openai/gpt-oss-20b', 
      'openai/gpt-oss-120b'
    ];

    testModels.forEach(modelId => {
      it(`should handle ${modelId} model selection`, async () => {
        const request = createMockRequest({
          messages: [{ id: '1', role: 'user', content: 'Test message' }],
          selectedModel: modelId
        });

        await POST(request);

        // Verify streamText was called with the correct model from languageModels
        const expectedModel = modelId === 'openai/gpt-oss-20b' ? 'mock-model-20b' : 'mock-model-120b';
        expect(mockStreamText).toHaveBeenCalledWith(expect.objectContaining({
          model: expectedModel
        }));
      });
    });
  });
});