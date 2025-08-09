import { 
  createTherapyCompletion, 
  generateSessionReport, 
  extractStructuredAnalysis,
  type ReportMessage,
  type GroqMessage 
} from '@/lib/api/groq-client';
import type { Message } from '@/types';

// Mock the groq-sdk
jest.mock('groq-sdk', () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    })),
    mockCreate // Export for use in tests
  };
});

// Get the mock create function
const { mockCreate } = require('groq-sdk') as any;

describe('Groq Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variable
    process.env.GROQ_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  describe('createTherapyCompletion', () => {
    it('should create therapy completion with correct message format', async () => {
      const mockStream = createMockStream();
      mockCreate.mockResolvedValue(mockStream);

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'I feel anxious today', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'I understand you feel anxious', timestamp: new Date() }
      ];
      const systemPrompt = 'You are a therapeutic AI assistant';

      const result = await createTherapyCompletion(messages, systemPrompt);

      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: 'I feel anxious today'
          },
          {
            role: 'assistant',
            content: 'I understand you feel anxious'
          }
        ],
        model: 'qwen/qwen-2.5-72b-instruct',
        temperature: 0.6,
        max_tokens: 4096,
        top_p: 0.95,
        stream: true
      });

      expect(result).toBe(mockStream);
    });

    it('should handle empty message array', async () => {
      const mockStream = createMockStream();
      mockCreate.mockResolvedValue(mockStream);

      const messages: Message[] = [];
      const systemPrompt = 'You are a therapeutic AI assistant';

      await createTherapyCompletion(messages, systemPrompt);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: 'system',
              content: systemPrompt
            }
          ]
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('Groq API Error');
      mockCreate.mockRejectedValue(apiError);

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Test message', timestamp: new Date() }
      ];

      await expect(createTherapyCompletion(messages, 'system prompt'))
        .rejects.toThrow('Groq API Error');
    });

    it('should transform message format correctly', async () => {
      const mockStream = createMockStream();
      mockCreate.mockResolvedValue(mockStream);

      const messages: Message[] = [
        { 
          id: '1', 
          role: 'user', 
          content: 'Complex message with special chars: @#$%', 
          timestamp: new Date(),
          // Additional properties that should be filtered out
          metadata: { some: 'data' } as any
        }
      ];

      await createTherapyCompletion(messages, 'system');

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[1]).toEqual({
        role: 'user',
        content: 'Complex message with special chars: @#$%'
      });
    });
  });

  describe('generateSessionReport', () => {
    it('should generate session report with correct parameters', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated therapeutic session report'
            }
          }
        ]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'I had a difficult day' },
        { role: 'assistant', content: 'Tell me more about what made it difficult' }
      ];
      const systemPrompt = 'Generate a therapeutic report';

      const result = await generateSessionReport(messages, systemPrompt);

      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: expect.stringContaining('Please generate a therapeutic session report')
          }
        ],
        model: 'openai/gpt-oss-120b',
        temperature: 0.3,
        max_tokens: 2048,
        top_p: 0.9,
        stream: false
      });

      expect(result).toBe('Generated therapeutic session report');
    });

    it('should handle custom model parameter', async () => {
      const mockResponse = { choices: [{ message: { content: 'Custom model response' } }] };
      mockCreate.mockResolvedValue(mockResponse);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      await generateSessionReport(messages, 'system', 'custom-model');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'custom-model'
        })
      );
    });

    it('should return null when no content is returned', async () => {
      const mockResponse = { choices: [] };
      mockCreate.mockResolvedValue(mockResponse);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const result = await generateSessionReport(messages, 'system');
      expect(result).toBeNull();
    });

    it('should return null when message content is empty', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: ''
            }
          }
        ]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      const result = await generateSessionReport(messages, 'system');
      expect(result).toBeNull();
    });

    it('should format conversation correctly in user message', async () => {
      const mockResponse = { choices: [{ message: { content: 'Report' } }] };
      mockCreate.mockResolvedValue(mockResponse);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'I feel sad' },
        { role: 'assistant', content: 'What is making you feel sad?' },
        { role: 'user', content: 'Work stress' }
      ];

      await generateSessionReport(messages, 'system');

      const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain('user: I feel sad');
      expect(userMessage).toContain('assistant: What is making you feel sad?');
      expect(userMessage).toContain('user: Work stress');
    });
  });

  describe('extractStructuredAnalysis', () => {
    it('should extract structured analysis with correct parameters', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '{"mood": "anxious", "topics": ["work", "stress"]}'
            }
          }
        ]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const reportContent = 'Patient discussed work-related stress and anxiety';
      const systemPrompt = 'Extract structured data from therapeutic report';

      const result = await extractStructuredAnalysis(reportContent, systemPrompt);

      expect(mockCreate).toHaveBeenCalledWith({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: expect.stringContaining('Please extract structured analysis data')
          }
        ],
        model: 'openai/gpt-oss-120b',
        temperature: 0.1,
        max_tokens: 1024,
        top_p: 0.8,
        stream: false
      });

      expect(result).toBe('{"mood": "anxious", "topics": ["work", "stress"]}');
    });

    it('should use custom model when provided', async () => {
      const mockResponse = { choices: [{ message: { content: 'Analysis' } }] };
      mockCreate.mockResolvedValue(mockResponse);

      await extractStructuredAnalysis('report', 'system', 'custom-analysis-model');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'custom-analysis-model'
        })
      );
    });

    it('should include report content in user message', async () => {
      const mockResponse = { choices: [{ message: { content: 'Analysis' } }] };
      mockCreate.mockResolvedValue(mockResponse);

      const reportContent = 'Detailed therapeutic session with CBT techniques';

      await extractStructuredAnalysis(reportContent, 'system');

      const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userMessage).toContain(reportContent);
    });

    it('should return null for empty response', async () => {
      const mockResponse = { choices: [] };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await extractStructuredAnalysis('report', 'system');
      expect(result).toBeNull();
    });

    it('should handle API errors during analysis', async () => {
      mockCreate.mockRejectedValue(new Error('Analysis API Error'));

      await expect(extractStructuredAnalysis('report', 'system'))
        .rejects.toThrow('Analysis API Error');
    });
  });

  describe('Groq Client Initialization', () => {
    it('should be properly mocked for testing', () => {
      // Verify that the mock is working correctly
      expect(mockCreate).toBeDefined();
      expect(typeof mockCreate).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      networkError.name = 'NetworkError';
      mockCreate.mockRejectedValue(networkError);

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Test', timestamp: new Date() }
      ];

      await expect(createTherapyCompletion(messages, 'system'))
        .rejects.toThrow('Network connection failed');
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      mockCreate.mockRejectedValue(rateLimitError);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      await expect(generateSessionReport(messages, 'system'))
        .rejects.toThrow('Rate limit exceeded');
    });
  });
});

// Helper function to create mock stream
function createMockStream() {
  return {
    async *[Symbol.asyncIterator]() {
      yield { choices: [{ delta: { content: 'Mock' } }] };
      yield { choices: [{ delta: { content: ' streaming' } }] };
      yield { choices: [{ delta: { content: ' response' } }] };
    }
  };
}