/**
 * Metadata Manager Service
 *
 * Handles message metadata operations including updates, queuing for pending
 * messages, retry logic, and merge strategies.
 *
 * This service manages the complexity of metadata updates when messages
 * may not yet be persisted (temporary IDs) and handles retry logic for
 * failed updates.
 */

import type {
  IChatApiClient,
  QueuedMetadataUpdate,
  MetadataUpdateOptions,
  SavedMessageResponse,
  Result,
} from './types';
import { ok, err } from './types';
import { logger } from '@/lib/utils/logger';

/**
 * Maximum number of retry attempts for metadata updates.
 */
const MAX_METADATA_RETRY_ATTEMPTS = 3;

/**
 * Configuration options for the MetadataManager.
 */
export interface MetadataManagerConfig {
  /** API client for making requests. */
  apiClient: IChatApiClient;
  /** Optional logger override for testing. */
  logger?: typeof logger;
  /** Maximum retry attempts (default: 3). */
  maxRetryAttempts?: number;
}

/**
 * Callback type for state update notifications.
 */
export type MetadataUpdateCallback = (messageId: string, metadata: Record<string, unknown>) => void;

/**
 * Service class for managing message metadata operations.
 * Handles queuing, retries, and persistence of metadata updates.
 */
export class MetadataManager {
  private readonly apiClient: IChatApiClient;
  private readonly log: typeof logger;
  private readonly maxRetryAttempts: number;

  /**
   * Queue of pending metadata updates for messages not yet persisted.
   */
  private pendingUpdates = new Map<string, QueuedMetadataUpdate>();

  /**
   * Set of message IDs currently being flushed to prevent duplicate flushes.
   */
  private flushingIds = new Set<string>();

  constructor(config: MetadataManagerConfig) {
    this.apiClient = config.apiClient;
    this.log = config.logger ?? logger;
    this.maxRetryAttempts = config.maxRetryAttempts ?? MAX_METADATA_RETRY_ATTEMPTS;
  }

  /**
   * Deep clones a metadata object to prevent mutation issues.
   *
   * @param value - The metadata object to clone
   * @returns A deep clone of the metadata, or undefined if input is undefined
   */
  cloneMetadata(value?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!value) return undefined;
    try {
      return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    } catch {
      return { ...value };
    }
  }

  /**
   * Merges metadata according to the specified strategy.
   *
   * @param current - The current metadata
   * @param incoming - The new metadata to merge
   * @param strategy - The merge strategy ('merge' or 'replace')
   * @returns The merged metadata
   */
  mergeMetadata(
    current: Record<string, unknown> | undefined,
    incoming: Record<string, unknown>,
    strategy: 'merge' | 'replace'
  ): Record<string, unknown> {
    const base = strategy === 'replace' ? {} : (this.cloneMetadata(current) ?? {});
    try {
      const sanitized = JSON.parse(JSON.stringify(incoming ?? {})) as Record<string, unknown>;
      return { ...base, ...sanitized };
    } catch {
      return { ...base, ...incoming };
    }
  }

  /**
   * Updates metadata for a persisted message.
   *
   * @param sessionId - The session ID
   * @param messageId - The message ID
   * @param metadata - The new metadata
   * @param options - Update options including merge strategy
   * @returns Result containing the updated message or an error
   */
  async updateMetadata(
    sessionId: string,
    messageId: string,
    metadata: Record<string, unknown>,
    options?: MetadataUpdateOptions
  ): Promise<Result<SavedMessageResponse, Error>> {
    const mergeStrategy = options?.mergeStrategy ?? 'merge';

    try {
      const response = await this.apiClient.patchMessageMetadata(sessionId, messageId, {
        metadata: this.cloneMetadata(metadata) ?? {},
        mergeStrategy,
      });

      if (!response || !response.success) {
        throw new Error('Failed to update message metadata');
      }

      const data = response.data;
      if (!data) {
        throw new Error('Empty response when updating metadata');
      }

      // Clear any pending update for this message since it succeeded
      this.pendingUpdates.delete(messageId);

      return ok(data as SavedMessageResponse);
    } catch (error) {
      const status = (error as { status?: number }).status;

      // 404 means the message isn't persisted yet - queue the update
      if (status === 404) {
        this.queueUpdate(messageId, {
          sessionId,
          metadata: this.cloneMetadata(metadata) ?? {},
          mergeStrategy,
          retries: 0,
        });
        this.log.info('Queued metadata update for message awaiting persistence', {
          component: 'MetadataManager',
          operation: 'updateMetadata',
          sessionId,
          messageId,
        });
        // Return success since we'll retry later
        return ok({ id: messageId } as SavedMessageResponse);
      }

      this.log.error(
        'Failed to update message metadata',
        {
          component: 'MetadataManager',
          operation: 'updateMetadata',
          sessionId,
          messageId,
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return err(error instanceof Error ? error : new Error('Failed to update message metadata'));
    }
  }

  /**
   * Queues a metadata update for later processing.
   * Used when the message hasn't been persisted yet (temp ID).
   *
   * @param messageId - The message ID (may be temporary)
   * @param update - The queued update data
   */
  queueUpdate(messageId: string, update: QueuedMetadataUpdate): void {
    this.pendingUpdates.set(messageId, update);
  }

  /**
   * Checks if there's a pending update for a message.
   *
   * @param messageId - The message ID to check
   * @returns True if there's a pending update
   */
  hasPending(messageId: string): boolean {
    return this.pendingUpdates.has(messageId);
  }

  /**
   * Gets the pending update for a message.
   *
   * @param messageId - The message ID
   * @returns The pending update or undefined
   */
  getPending(messageId: string): QueuedMetadataUpdate | undefined {
    return this.pendingUpdates.get(messageId);
  }

  /**
   * Transfers a pending update from one ID to another.
   * Used when a temporary ID is replaced with a persisted ID.
   *
   * @param fromId - The original (temporary) message ID
   * @param toId - The new (persisted) message ID
   * @param sessionId - The session ID for the update
   */
  transferPending(fromId: string, toId: string, sessionId: string): void {
    const pending = this.pendingUpdates.get(fromId);
    if (pending) {
      this.pendingUpdates.delete(fromId);
      this.pendingUpdates.set(toId, {
        ...pending,
        sessionId,
      });
    }
  }

  /**
   * Flushes a pending metadata update to the API.
   *
   * @param messageId - The message ID to flush
   * @returns Result containing the updated message or void if no pending update
   */
  async flushPending(messageId: string): Promise<Result<SavedMessageResponse | null, Error>> {
    const pending = this.pendingUpdates.get(messageId);
    if (!pending) {
      return ok(null);
    }

    // Don't flush temporary IDs - wait for real ID
    if (messageId.startsWith('temp-')) {
      return ok(null);
    }

    // Prevent duplicate flushes
    if (this.flushingIds.has(messageId)) {
      return ok(null);
    }

    this.flushingIds.add(messageId);

    try {
      const response = await this.apiClient.patchMessageMetadata(pending.sessionId, messageId, {
        metadata: pending.metadata,
        mergeStrategy: pending.mergeStrategy,
      });

      if (!response || !response.success) {
        throw new Error('Failed to persist queued metadata update');
      }

      this.pendingUpdates.delete(messageId);
      return ok(response.data as SavedMessageResponse);
    } catch (error) {
      const status = (error as { status?: number }).status;

      // 404 means message still not persisted - keep pending for retry
      if (status === 404) {
        return ok(null);
      }

      // Increment retry count and potentially drop the update
      const retries = pending.retries + 1;
      if (retries >= this.maxRetryAttempts) {
        this.pendingUpdates.delete(messageId);
        this.log.error(
          'Dropping queued metadata update after repeated failures',
          {
            component: 'MetadataManager',
            operation: 'flushPending',
            messageId,
            sessionId: pending.sessionId,
            retries,
          },
          error instanceof Error ? error : new Error(String(error))
        );
        return err(new Error('Max retry attempts exceeded'));
      }

      // Update retry count
      this.pendingUpdates.set(messageId, { ...pending, retries });
      this.log.error(
        'Failed to persist queued metadata update',
        {
          component: 'MetadataManager',
          operation: 'flushPending',
          messageId,
          sessionId: pending.sessionId,
          retries,
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return err(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.flushingIds.delete(messageId);
    }
  }

  /**
   * Gets all pending message IDs.
   *
   * @returns Array of message IDs with pending updates
   */
  getPendingIds(): string[] {
    return Array.from(this.pendingUpdates.keys());
  }

  /**
   * Clears all pending updates.
   * Used when clearing messages or switching sessions.
   */
  clearAll(): void {
    this.pendingUpdates.clear();
    this.flushingIds.clear();
  }

  /**
   * Clears pending flush tracking.
   * Used during cleanup.
   */
  clearFlushTracking(): void {
    this.flushingIds.clear();
  }

  /**
   * Gets the retry count for a pending update.
   *
   * @param messageId - The message ID
   * @returns The retry count, or 0 if no pending update
   */
  getRetryCount(messageId: string): number {
    return this.pendingUpdates.get(messageId)?.retries ?? 0;
  }
}

/**
 * Factory function to create a MetadataManager with the default API client.
 *
 * @param apiClient - The API client to use
 * @returns A configured MetadataManager instance
 */
export function createMetadataManager(apiClient: IChatApiClient): MetadataManager {
  return new MetadataManager({ apiClient });
}
