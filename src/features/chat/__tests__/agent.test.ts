import type { LanguageModel, ToolSet } from 'ai';
import type { ChatAgentConfig } from '@/features/chat/lib/agent';

describe('createChatAgent', () => {
  const mockModel = { modelId: 'test-model' } as unknown as LanguageModel;

  // Need to access the mocks after jest.resetModules
  let createChatAgent: typeof import('@/features/chat/lib/agent').createChatAgent;
  let MockToolLoopAgent: jest.Mock;
  let mockStepCountIs: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    // Define mocks inside beforeEach after resetModules
    MockToolLoopAgent = jest.fn((config: unknown) => ({ _config: config, run: jest.fn() }));
    mockStepCountIs = jest.fn((count: number) => ({ type: 'stepCount', count }));

    jest.doMock('ai', () => ({
      ToolLoopAgent: MockToolLoopAgent,
      stepCountIs: mockStepCountIs,
    }));

    // Re-import after mocking
    const agentModule = require('@/features/chat/lib/agent');
    createChatAgent = agentModule.createChatAgent;
  });

  it('creates a ToolLoopAgent with required config', () => {
    const config: ChatAgentConfig = {
      model: mockModel,
      instructions: 'You are a helpful assistant',
    };

    createChatAgent(config);

    expect(MockToolLoopAgent).toHaveBeenCalledWith({
      model: mockModel,
      instructions: 'You are a helpful assistant',
      tools: undefined,
      stopWhen: undefined,
    });
  });

  it('passes tools to ToolLoopAgent when provided', () => {
    const mockTools: ToolSet = {
      search: { description: 'Search tool' },
    } as unknown as ToolSet;

    const config: ChatAgentConfig = {
      model: mockModel,
      instructions: 'Assistant with tools',
      tools: mockTools,
    };

    createChatAgent(config);

    expect(MockToolLoopAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: mockTools,
      })
    );
  });

  it('sets stopWhen with stepCountIs when maxSteps is provided', () => {
    const config: ChatAgentConfig = {
      model: mockModel,
      instructions: 'Limited steps assistant',
      maxSteps: 5,
    };

    createChatAgent(config);

    expect(mockStepCountIs).toHaveBeenCalledWith(5);
    expect(MockToolLoopAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        stopWhen: { type: 'stepCount', count: 5 },
      })
    );
  });

  it('does not set stopWhen when maxSteps is not provided', () => {
    const config: ChatAgentConfig = {
      model: mockModel,
      instructions: 'Unlimited steps assistant',
    };

    createChatAgent(config);

    expect(mockStepCountIs).not.toHaveBeenCalled();
    expect(MockToolLoopAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        stopWhen: undefined,
      })
    );
  });

  it('returns the ToolLoopAgent instance', () => {
    const config: ChatAgentConfig = {
      model: mockModel,
      instructions: 'Test assistant',
    };

    const agent = createChatAgent(config);

    expect(agent).toBeDefined();
    // Access mock's internal config via type assertion
    expect((agent as unknown as { _config: unknown })._config).toEqual({
      model: mockModel,
      instructions: 'Test assistant',
      tools: undefined,
      stopWhen: undefined,
    });
  });
});
