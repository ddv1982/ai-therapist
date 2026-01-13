import { ToolLoopAgent, stepCountIs, type LanguageModel, type ToolSet } from 'ai';

export interface ChatAgentConfig {
  model: LanguageModel;
  instructions: string;
  tools?: ToolSet;
  maxSteps?: number;
}

/**
 * Create a chat agent using AI SDK's ToolLoopAgent.
 * Provides a unified abstraction for tool-enabled conversations.
 *
 * @param config - Agent configuration
 * @returns Configured ToolLoopAgent instance
 */
export function createChatAgent(config: ChatAgentConfig): ToolLoopAgent {
  return new ToolLoopAgent({
    model: config.model,
    instructions: config.instructions,
    tools: config.tools,
    stopWhen: config.maxSteps ? stepCountIs(config.maxSteps) : undefined,
  });
}

export type { ToolLoopAgent };
