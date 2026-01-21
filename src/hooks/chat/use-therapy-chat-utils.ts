/**
 * Therapy Chat Utilities
 *
 * Helper functions for message transformation and creation
 * used by the useTherapyChat hook.
 *
 * @module hooks/chat/use-therapy-chat-utils
 */

import type { UIMessage } from 'ai';
import type { MessageData } from '@/features/chat/messages/message';
import { generateUUID } from '@/lib/utils';

/**
 * Extracts text content from a UIMessage's parts array.
 *
 * @param message - The UIMessage from AI SDK
 * @returns Combined text content from all text parts
 */
export function extractTextContent(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/**
 * Creates a user message object for the chat.
 *
 * @param content - The message content
 * @returns MessageData object with user role
 */
export function createUserMessage(content: string): MessageData {
  return {
    id: generateUUID(),
    role: 'user',
    content,
    timestamp: new Date(),
  };
}

/**
 * Creates an assistant placeholder message for streaming.
 *
 * @returns MessageData object with empty content for streaming
 */
export function createAssistantPlaceholder(): MessageData {
  return {
    id: generateUUID(),
    role: 'assistant',
    content: '',
    timestamp: new Date(),
  };
}

/**
 * Extracts the model ID from a UIMessage's metadata.
 *
 * @param message - The UIMessage from AI SDK
 * @param fallback - Optional fallback model ID
 * @returns The model ID or fallback if not found
 */
export function getModelIdFromMetadata(
  message: UIMessage,
  fallback?: string
): string | undefined {
  const meta = message.metadata as { modelId?: unknown } | undefined;
  if (meta && typeof meta.modelId === 'string' && meta.modelId.length > 0) {
    return meta.modelId;
  }
  return fallback;
}
