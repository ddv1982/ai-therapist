/**
 * Message Persistence Service
 *
 * Handles all message persistence operations including saving, loading,
 * and transforming messages between UI and API formats.
 *
 * This service is designed to be injectable and testable, with all dependencies
 * passed through the constructor or factory methods.
 */

import type {
  IChatApiClient,
  Message,
  NewMessagePayload,
  SavedMessageResponse,
  Result,
} from './types';
import { ok, err } from './types';
import { logger } from '@/lib/utils/logger';

/**
 * Configuration options for the MessagePersistenceService.
 */
export interface MessagePersistenceConfig {
  /** API client for making requests. */
  apiClient: IChatApiClient;
  /** Optional logger override for testing. */
  logger?: typeof logger;
}

/**
 * Result of loading messages from the API.
 */
export interface LoadMessagesResult {
  messages: Message[];
}

/**
 * Result of saving a message to the API.
 */
export interface SaveMessageResult {
  savedMessage: SavedMessageResponse;
}

/**
 * Service class for message persistence operations.
 * Extracts persistence logic from useChatMessages hook for better testability
 * and separation of concerns.
 */
export class MessagePersistenceService {
  private readonly apiClient: IChatApiClient;
  private readonly log: typeof logger;

  constructor(config: MessagePersistenceConfig) {
    this.apiClient = config.apiClient;
    this.log = config.logger ?? logger;
  }

  /**
   * Loads messages for a session from the API.
   * Transforms API responses into the UI Message format.
   *
   * @param sessionId - The session ID to load messages for
   * @returns Result containing the loaded messages or an error
   */
  async loadMessages(sessionId: string): Promise<Result<LoadMessagesResult, Error>> {
    try {
      const response = await this.apiClient.listMessages(sessionId);

      if (!response || !response.success || !response.data) {
        this.log.error('Failed to load messages from API', {
          component: 'MessagePersistenceService',
          operation: 'loadMessages',
          sessionId,
        });
        return err(new Error('Failed to load messages from API'));
      }

      const items = response.data.items;
      const messages = items.map((msg) => this.transformApiMessage(msg));

      return ok({ messages });
    } catch (error) {
      this.log.error(
        'Error loading messages',
        {
          component: 'MessagePersistenceService',
          operation: 'loadMessages',
          sessionId,
        },
        error instanceof Error ? error : new Error(String(error))
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Saves a new message to the API.
   *
   * @param sessionId - The session ID to save the message to
   * @param payload - The message data to save
   * @returns Result containing the saved message data or an error
   */
  async saveMessage(
    sessionId: string,
    payload: NewMessagePayload
  ): Promise<Result<SaveMessageResult, Error>> {
    try {
      const response = await this.apiClient.postMessage(sessionId, {
        role: payload.role,
        content: payload.content,
        modelUsed: payload.modelUsed,
        metadata: payload.metadata,
      });

      if (!response.success || !response.data) {
        this.log.error('Failed to save message', {
          component: 'MessagePersistenceService',
          operation: 'saveMessage',
          sessionId,
        });
        return err(new Error('Failed to save message'));
      }

      return ok({ savedMessage: response.data as SavedMessageResponse });
    } catch (error) {
      this.log.error(
        'Error saving message',
        {
          component: 'MessagePersistenceService',
          operation: 'saveMessage',
          sessionId,
        },
        error instanceof Error ? error : new Error(String(error))
      );
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Transforms an API message response into the UI Message format.
   *
   * @param apiMessage - The API response message
   * @returns The transformed Message object
   */
  transformApiMessage(apiMessage: SavedMessageResponse): Message {
    return {
      id: apiMessage.id || `temp-${Date.now()}`,
      content: apiMessage.content,
      role: apiMessage.role,
      timestamp: apiMessage.timestamp ? new Date(apiMessage.timestamp) : new Date(),
      modelUsed:
        typeof apiMessage.modelUsed === 'string' && apiMessage.modelUsed.length > 0
          ? apiMessage.modelUsed
          : undefined,
      metadata: apiMessage.metadata ?? undefined,
    };
  }

  /**
   * Generates a temporary ID for optimistic UI updates.
   *
   * @returns A unique temporary ID string
   */
  generateTempId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Checks if an ID is a temporary ID.
   *
   * @param id - The ID to check
   * @returns True if the ID is temporary
   */
  isTempId(id: string): boolean {
    return id.startsWith('temp-');
  }
}

/**
 * Factory function to create a MessagePersistenceService with the default API client.
 *
 * @param apiClient - The API client to use
 * @returns A configured MessagePersistenceService instance
 */
export function createMessagePersistenceService(
  apiClient: IChatApiClient
): MessagePersistenceService {
  return new MessagePersistenceService({ apiClient });
}
