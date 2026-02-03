'use client';

import { useRef, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';
import { apiClient } from '@/lib/api/client';
import { getApiData } from '@/lib/api/api-response';
import type { ChatMessage as DomainChatMessage } from '@/types/domains/chat';

// Extended type to include fields that might be missing from the base API type but present in response
type ApiChatMessage = DomainChatMessage & {
  modelUsed?: string | null;
  metadata?: Record<string, unknown> | null;
};

const MAX_METADATA_RETRY_ATTEMPTS = 3;

interface PendingMetadataEntry {
  sessionId: string;
  metadata: Record<string, unknown>;
  mergeStrategy: 'merge' | 'replace';
  retries: number;
}

interface UseMetadataQueueProps {
  onMessageUpdated: (message: ApiChatMessage) => void;
}

export function useMetadataQueue({ onMessageUpdated }: UseMetadataQueueProps) {
  const pendingMetadataRef = useRef(new Map<string, PendingMetadataEntry>());
  const pendingFlushRef = useRef(new Set<string>());
  const pendingFlushTimeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const flushPendingMetadata = useCallback(
    async (messageId: string) => {
      const pending = pendingMetadataRef.current.get(messageId);
      if (!pending) return;
      if (messageId.startsWith('temp-')) return;
      if (pendingFlushRef.current.has(messageId)) return;

      pendingFlushRef.current.add(messageId);
      const pendingTimeout = pendingFlushTimeoutsRef.current.get(messageId);
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        pendingFlushTimeoutsRef.current.delete(messageId);
      }

      try {
        const response = await apiClient.patchMessageMetadata(pending.sessionId, messageId, {
          metadata: pending.metadata,
          mergeStrategy: pending.mergeStrategy,
        });

        if (!response || !response.success) {
          throw new Error('Failed to persist queued metadata update');
        }

        const data = (getApiData(response) ?? response.data) as ApiChatMessage | undefined;
        if (data) {
          onMessageUpdated(data);
        }

        pendingMetadataRef.current.delete(messageId);
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          // Message not yet persisted; keep pending for retry
          return;
        }

        const entry = pendingMetadataRef.current.get(messageId);
        if (entry) {
          const retries = entry.retries + 1;
          if (retries >= MAX_METADATA_RETRY_ATTEMPTS) {
            pendingMetadataRef.current.delete(messageId);
            logger.error(
              'Dropping queued metadata update after repeated failures',
              {
                component: 'useMetadataQueue',
                operation: 'flushPendingMetadata',
                messageId,
                sessionId: entry.sessionId,
                retries,
              },
              error instanceof Error ? error : new Error(String(error))
            );
          } else {
            pendingMetadataRef.current.set(messageId, {
              ...entry,
              retries,
            });
            logger.error(
              'Failed to persist queued metadata update',
              {
                component: 'useMetadataQueue',
                operation: 'flushPendingMetadata',
                messageId,
                sessionId: entry.sessionId,
                retries,
              },
              error instanceof Error ? error : new Error(String(error))
            );
          }
        } else {
          logger.error(
            'Failed to persist queued metadata update',
            {
              component: 'useMetadataQueue',
              operation: 'flushPendingMetadata',
              messageId,
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
      } finally {
        pendingFlushRef.current.delete(messageId);
      }
    },
    [onMessageUpdated]
  );

  const schedulePendingFlush = useCallback(
    (messageId: string, delayMs = 60) => {
      const existingTimeout = pendingFlushTimeoutsRef.current.get(messageId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      const timeoutId = setTimeout(() => {
        pendingFlushTimeoutsRef.current.delete(messageId);
        void flushPendingMetadata(messageId);
      }, delayMs);
      pendingFlushTimeoutsRef.current.set(messageId, timeoutId);
    },
    [flushPendingMetadata]
  );

  const queueMetadataUpdate = useCallback(
    (
      messageId: string,
      entry: Omit<PendingMetadataEntry, 'retries'>,
      shouldSchedule: boolean = true
    ) => {
      pendingMetadataRef.current.set(messageId, {
        ...entry,
        retries: 0,
      });
      if (shouldSchedule) {
        schedulePendingFlush(messageId);
      }
    },
    [schedulePendingFlush]
  );

  const transferPendingMetadata = useCallback(
    (tempId: string, finalId: string) => {
      const pending = pendingMetadataRef.current.get(tempId);
      const pendingTimeout = pendingFlushTimeoutsRef.current.get(tempId);
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        pendingFlushTimeoutsRef.current.delete(tempId);
      }
      if (pending) {
        pendingMetadataRef.current.delete(tempId);
        pendingMetadataRef.current.set(finalId, {
          ...pending,
        });
        schedulePendingFlush(finalId);
      }
    },
    [schedulePendingFlush]
  );

  const clearQueue = useCallback(() => {
    pendingMetadataRef.current.clear();
    pendingFlushRef.current.clear();
    pendingFlushTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    pendingFlushTimeoutsRef.current.clear();
  }, []);

  // Process queue for existing messages
  const processQueueForMessages = useCallback(
    (messages: Array<{ id: string }>) => {
      pendingMetadataRef.current.forEach((entry, messageId) => {
        if (messageId.startsWith('temp-')) return;
        const exists = messages.some((msg) => msg.id === messageId);
        if (exists && entry.retries < MAX_METADATA_RETRY_ATTEMPTS) {
          schedulePendingFlush(messageId);
        }
      });
    },
    [schedulePendingFlush]
  );

  // Cleanup on unmount
  useEffect(() => {
    const pendingFlushAtEffectTime = pendingFlushRef.current;
    const pendingTimeoutsAtEffectTime = pendingFlushTimeoutsRef.current;
    return () => {
      pendingFlushAtEffectTime.clear();
      pendingTimeoutsAtEffectTime.forEach((timeoutId) => clearTimeout(timeoutId));
      pendingTimeoutsAtEffectTime.clear();
    };
  }, []);

  return {
    queueMetadataUpdate,
    transferPendingMetadata,
    clearQueue,
    processQueueForMessages,
    flushPendingMetadata, // Exposed mostly for testing if needed
  };
}
