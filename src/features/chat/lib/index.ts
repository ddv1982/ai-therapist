/**
 * Chat Services
 *
 * Centralized exports for chat-related services.
 */

// Services
export {
  MessagePersistenceService,
  createMessagePersistenceService,
  type MessagePersistenceConfig,
  type LoadMessagesResult,
  type SaveMessageResult,
} from './message-persistence.service';

export {
  MetadataManager,
  createMetadataManager,
  type MetadataManagerConfig,
  type MetadataUpdateCallback,
} from './metadata-manager.service';

// API Client Adapter
export { chatApiClientAdapter } from './api-client-adapter';

// Types
export {
  type Result,
  type Message,
  type NewMessagePayload,
  type SavedMessageResponse,
  type QueuedMetadataUpdate,
  type MetadataUpdateOptions,
  type IChatApiClient,
  ok,
  err,
} from './types';
