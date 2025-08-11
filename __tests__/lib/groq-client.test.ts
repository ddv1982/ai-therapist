import { 
  generateSessionReport, 
  extractStructuredAnalysis,
  type ReportMessage
} from '@/lib/api/groq-client';

// Mock the AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn()
}));

// Mock the AI providers
jest.mock('@/ai/providers', () => ({
  model: {
    languageModel: jest.fn().mockReturnValue('mock-model')
  }
}));

// Get the mocked functions
import { generateText } from 'ai';
import { model } from '@/ai/providers';

const mockGenerateText = jest.mocked(generateText);
const mockModel = jest.mocked(model);

describe('AI Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSessionReport', () => {
    it('should generate session report with correct parameters', async () => {
      const mockResponse = {
        text: 'Generated therapeutic session report'
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'I had a difficult day' },
        { role: 'assistant', content: 'Tell me more about what made it difficult' }
      ];
      const systemPrompt = 'Generate a therapeutic report';

      const result = await generateSessionReport(messages, systemPrompt);

      expect(mockModel.languageModel).toHaveBeenCalledWith('openai/gpt-oss-120b');
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: 'mock-model',
        system: systemPrompt,
        prompt: expect.stringContaining('Please generate a therapeutic session report'),
        temperature: 0.3,
        maxTokens: 16384,
        topP: 0.9
      });

      expect(result).toBe('Generated therapeutic session report');
    });

    it('should handle custom model parameter', async () => {
      const mockResponse = { text: 'Custom model response' };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      await generateSessionReport(messages, 'system', 'custom-model');

      expect(mockModel.languageModel).toHaveBeenCalledWith('custom-model');
    });

    it('should format conversation correctly in prompt', async () => {
      const mockResponse = { text: 'Report' };
      mockGenerateText.mockResolvedValue(mockResponse);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'I feel sad' },
        { role: 'assistant', content: 'What is making you feel sad?' },
        { role: 'user', content: 'Work stress' }
      ];

      await generateSessionReport(messages, 'system');

      const callArgs = mockGenerateText.mock.calls[0][0];
      expect(callArgs.prompt).toContain('user: I feel sad');
      expect(callArgs.prompt).toContain('assistant: What is making you feel sad?');
      expect(callArgs.prompt).toContain('user: Work stress');
    });
  });

  describe('extractStructuredAnalysis', () => {
    it('should extract structured analysis with correct parameters', async () => {
      const mockResponse = {
        text: '{"mood": "anxious", "topics": ["work", "stress"]}'
      };
      mockGenerateText.mockResolvedValue(mockResponse);

      const reportContent = 'Patient discussed work-related stress and anxiety';
      const systemPrompt = 'Extract structured data from therapeutic report';

      const result = await extractStructuredAnalysis(reportContent, systemPrompt);

      expect(mockModel.languageModel).toHaveBeenCalledWith('openai/gpt-oss-120b');
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: 'mock-model',
        system: systemPrompt,
        prompt: expect.stringContaining('Please extract structured analysis data'),
        temperature: 0.1,
        maxTokens: 8192,
        topP: 0.8
      });

      expect(result).toBe('{"mood": "anxious", "topics": ["work", "stress"]}');
    });

    it('should use custom model when provided', async () => {
      const mockResponse = { text: 'Analysis' };
      mockGenerateText.mockResolvedValue(mockResponse);

      await extractStructuredAnalysis('report', 'system', 'custom-analysis-model');

      expect(mockModel.languageModel).toHaveBeenCalledWith('custom-analysis-model');
    });

    it('should include report content in prompt', async () => {
      const mockResponse = { text: 'Analysis' };
      mockGenerateText.mockResolvedValue(mockResponse);

      const reportContent = 'Detailed therapeutic session with CBT techniques';

      await extractStructuredAnalysis(reportContent, 'system');

      const callArgs = mockGenerateText.mock.calls[0][0];
      expect(callArgs.prompt).toContain(reportContent);
    });

    it('should handle API errors during analysis', async () => {
      mockGenerateText.mockRejectedValue(new Error('Analysis API Error'));

      await expect(extractStructuredAnalysis('report', 'system'))
        .rejects.toThrow('Analysis API Error');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      networkError.name = 'NetworkError';
      mockGenerateText.mockRejectedValue(networkError);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      await expect(generateSessionReport(messages, 'system'))
        .rejects.toThrow('Network connection failed');
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      mockGenerateText.mockRejectedValue(rateLimitError);

      const messages: ReportMessage[] = [
        { role: 'user', content: 'Test' }
      ];

      await expect(generateSessionReport(messages, 'system'))
        .rejects.toThrow('Rate limit exceeded');
    });
  });
});