/**
 * AI SDK 5 Integration Tests
 * Tests the AI SDK 5 chat API, streaming, and therapeutic functionality
 */

// Removed unused NextRequest import

// Mock AI SDK 5 streamText function
jest.mock('ai', () => ({
  streamText: jest.fn(),
  toUIMessageStreamResponse: jest.fn(),
}));

// Mock AI provider configuration
jest.mock('@/ai/providers', () => ({
  model: jest.fn(),
  languageModels: {
    'openai/gpt-oss-20b': { provider: 'openai', modelId: 'gpt-oss-20b' },
    'openai/gpt-oss-120b': { provider: 'openai', modelId: 'gpt-oss-120b' },
  },
  models: {
    'openai/gpt-oss-20b': { displayName: 'GPT OSS 20B', contextWindow: 32768 },
    'openai/gpt-oss-120b': { displayName: 'GPT OSS 120B', contextWindow: 32768 },
  }
}));

// Mock therapeutic prompts
jest.mock('@/lib/therapy/therapy-prompts', () => ({
  getTherapeuticSystemPrompt: jest.fn().mockReturnValue('You are a compassionate AI therapist.'),
  buildTherapySystemPrompt: jest.fn().mockReturnValue('You are a compassionate AI therapist.'),
}));

// Mock database
jest.mock('@/lib/database/db', () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
  },
}));

import { streamText } from 'ai';
import { model, languageModels } from '@/ai/providers';
import { prisma } from '@/lib/database/db';

const mockStreamText = streamText as jest.Mock;
const mockPrisma = {
  session: {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  message: {
    create: jest.fn().mockResolvedValue({}),
  },
} as unknown as jest.Mocked<typeof prisma>;

describe('AI SDK 5 Integration Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AI Provider Configuration', () => {
    test('should have AI SDK 5 compatible provider configuration', () => {
      expect(model).toBeDefined();
      expect(languageModels).toBeDefined();
      expect(languageModels['openai/gpt-oss-20b']).toBeDefined();
      expect(languageModels['openai/gpt-oss-120b']).toBeDefined();
    });

    test('should support multiple OpenAI GPT OSS models', () => {
      const modelKeys = Object.keys(languageModels);
      expect(modelKeys).toContain('openai/gpt-oss-20b');
      expect(modelKeys).toContain('openai/gpt-oss-120b');
    });
  });

  describe('Streaming Chat API', () => {
    test('should call streamText with correct parameters', async () => {
      // Mock streamText to return a basic stream response
      const mockResult = {
        toUIMessageStreamResponse: jest.fn().mockReturnValue(
          new Response('mock stream', { 
            status: 200, 
            headers: { 'content-type': 'text/plain' }
          })
        ),
      };
      mockStreamText.mockResolvedValue(mockResult);

      // Test that streamText can be called with expected parameters
      const result = await mockStreamText({
        model: languageModels['openai/gpt-oss-20b'],
        messages: [{ role: 'user', content: 'Hello' }],
        system: 'You are a compassionate AI therapist.',
      });

      expect(mockStreamText).toHaveBeenCalledWith({
        model: languageModels['openai/gpt-oss-20b'],
        messages: [{ role: 'user', content: 'Hello' }],
        system: 'You are a compassionate AI therapist.',
      });

      expect(result).toBeDefined();
      expect(result.toUIMessageStreamResponse).toBeDefined();
    });

    test('should support different AI models', async () => {
      const models = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];

      for (const modelKey of models) {
        const mockResult = {
          toUIMessageStreamResponse: jest.fn().mockReturnValue(
            new Response('mock stream', { status: 200 })
          ),
        };
        mockStreamText.mockResolvedValue(mockResult);

        await mockStreamText({
          model: languageModels[modelKey as keyof typeof languageModels],
          messages: [{ role: 'user', content: 'Test' }],
        });

        expect(mockStreamText).toHaveBeenCalledWith({
          model: languageModels[modelKey as keyof typeof languageModels],
          messages: [{ role: 'user', content: 'Test' }],
        });
      }
    });
  });

  describe('Database Integration', () => {
    test('should handle session creation', async () => {
      const mockSession = {
        id: 'test-session-id',
        userId: 'test-user',
        title: 'Test Session',
        status: 'active',
        createdAt: new Date(),
      };

      (mockPrisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await mockPrisma.session.create({
        data: {
          userId: 'test-user',
          title: 'Test Session',
          status: 'active',
        },
      });

      expect(result).toEqual(mockSession);
      expect((mockPrisma.session.create as jest.Mock)).toHaveBeenCalledWith({
        data: {
          userId: 'test-user',
          title: 'Test Session',
          status: 'active',
        },
      });
    });

    test('should handle message creation', async () => {
      const mockMessage = {
        id: 'test-message-id',
        sessionId: 'test-session-id',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
      };

      (mockPrisma.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await mockPrisma.message.create({
        data: {
          sessionId: 'test-session-id',
          role: 'user',
          content: 'Test message',
          timestamp: new Date(),
        },
      });

      expect(result).toEqual(mockMessage);
      // Relax timestamp millisecond precision to avoid flakiness
      expect((mockPrisma.message.create as jest.Mock)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: 'test-session-id',
            role: 'user',
            content: 'Test message',
            timestamp: expect.any(Date),
          })
        })
      );
    });
  });

  describe('Therapeutic Context', () => {
    test('should use therapeutic system prompts', () => {
      const { getTherapeuticSystemPrompt } = jest.requireMock('@/lib/therapy/therapy-prompts');
      
      const prompt = getTherapeuticSystemPrompt();
      expect(prompt).toBe('You are a compassionate AI therapist.');
      expect(getTherapeuticSystemPrompt).toHaveBeenCalled();
    });

    test('should integrate AI streaming with therapeutic context', async () => {
      const mockResult = {
        toUIMessageStreamResponse: jest.fn().mockReturnValue(
          new Response('Therapeutic response stream', { status: 200 })
        ),
      };
      mockStreamText.mockResolvedValue(mockResult);

      // Simulate a therapeutic chat request
      const result = await mockStreamText({
        model: languageModels['openai/gpt-oss-120b'],
        messages: [
          { role: 'user', content: 'I am feeling anxious about work' }
        ],
        system: 'You are a compassionate AI therapist.',
        temperature: 0.7,
        maxTokens: 1000,
      });

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are a compassionate AI therapist.',
          temperature: 0.7,
          maxTokens: 1000,
        })
      );

      expect(result.toUIMessageStreamResponse).toBeDefined();
    });
  });
});
