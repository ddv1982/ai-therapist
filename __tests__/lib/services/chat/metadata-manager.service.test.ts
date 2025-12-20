/**
 * Tests for MetadataManager
 */

import { MetadataManager } from '@/features/chat/lib/metadata-manager.service';
import type { IChatApiClient } from '@/features/chat/lib/types';

describe('MetadataManager', () => {
  let manager: MetadataManager;
  let mockApiClient: jest.Mocked<IChatApiClient>;

  beforeEach(() => {
    mockApiClient = {
      listMessages: jest.fn(),
      postMessage: jest.fn(),
      patchMessageMetadata: jest.fn(),
    };
    manager = new MetadataManager({ apiClient: mockApiClient });
  });

  describe('cloneMetadata', () => {
    it('should deep clone metadata', () => {
      const original = { nested: { value: 1 }, array: [1, 2, 3] };
      const cloned = manager.cloneMetadata(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned?.nested).not.toBe(original.nested);
    });

    it('should return undefined for undefined input', () => {
      expect(manager.cloneMetadata(undefined)).toBeUndefined();
    });

    it('should handle circular references gracefully', () => {
      const circular: Record<string, unknown> = { a: 1 };
      circular.self = circular;

      // Should fall back to shallow copy
      const result = manager.cloneMetadata(circular);
      expect(result).toBeDefined();
      expect(result?.a).toBe(1);
    });
  });

  describe('mergeMetadata', () => {
    it('should merge metadata with merge strategy', () => {
      const current = { a: 1, b: 2 };
      const incoming = { b: 3, c: 4 };

      const result = manager.mergeMetadata(current, incoming, 'merge');

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should replace metadata with replace strategy', () => {
      const current = { a: 1, b: 2 };
      const incoming = { c: 3 };

      const result = manager.mergeMetadata(current, incoming, 'replace');

      expect(result).toEqual({ c: 3 });
    });

    it('should handle undefined current metadata', () => {
      const incoming = { a: 1 };

      const result = manager.mergeMetadata(undefined, incoming, 'merge');

      expect(result).toEqual({ a: 1 });
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata successfully', async () => {
      mockApiClient.patchMessageMetadata.mockResolvedValue({
        success: true,
        data: {
          id: 'msg-1',
          content: 'Hello',
          role: 'user',
          timestamp: '2024-01-01T00:00:00Z',
          modelUsed: null,
          metadata: { updated: true },
        },
      });

      const result = await manager.updateMetadata('session-1', 'msg-1', { updated: true });

      expect(result.success).toBe(true);
      expect(mockApiClient.patchMessageMetadata).toHaveBeenCalledWith('session-1', 'msg-1', {
        metadata: { updated: true },
        mergeStrategy: 'merge',
      });
    });

    it('should queue update on 404 error', async () => {
      const error = new Error('Not found') as Error & { status: number };
      error.status = 404;
      mockApiClient.patchMessageMetadata.mockRejectedValue(error);

      const result = await manager.updateMetadata('session-1', 'msg-1', { key: 'value' });

      expect(result.success).toBe(true);
      expect(manager.hasPending('msg-1')).toBe(true);
    });

    it('should return error on other failures', async () => {
      mockApiClient.patchMessageMetadata.mockRejectedValue(new Error('Server error'));

      const result = await manager.updateMetadata('session-1', 'msg-1', { key: 'value' });

      expect(result.success).toBe(false);
    });
  });

  describe('queueUpdate', () => {
    it('should queue an update', () => {
      manager.queueUpdate('msg-1', {
        sessionId: 'session-1',
        metadata: { key: 'value' },
        mergeStrategy: 'merge',
        retries: 0,
      });

      expect(manager.hasPending('msg-1')).toBe(true);
      expect(manager.getPending('msg-1')).toEqual({
        sessionId: 'session-1',
        metadata: { key: 'value' },
        mergeStrategy: 'merge',
        retries: 0,
      });
    });
  });

  describe('transferPending', () => {
    it('should transfer pending update to new ID', () => {
      manager.queueUpdate('temp-123', {
        sessionId: 'session-1',
        metadata: { key: 'value' },
        mergeStrategy: 'merge',
        retries: 0,
      });

      manager.transferPending('temp-123', 'msg-real', 'session-1');

      expect(manager.hasPending('temp-123')).toBe(false);
      expect(manager.hasPending('msg-real')).toBe(true);
    });

    it('should do nothing if no pending update exists', () => {
      manager.transferPending('nonexistent', 'msg-real', 'session-1');

      expect(manager.hasPending('msg-real')).toBe(false);
    });
  });

  describe('flushPending', () => {
    it('should flush pending update successfully', async () => {
      mockApiClient.patchMessageMetadata.mockResolvedValue({
        success: true,
        data: {
          id: 'msg-1',
          content: 'Hello',
          role: 'user',
          timestamp: '2024-01-01T00:00:00Z',
          modelUsed: null,
          metadata: { flushed: true },
        },
      });

      manager.queueUpdate('msg-1', {
        sessionId: 'session-1',
        metadata: { flushed: true },
        mergeStrategy: 'merge',
        retries: 0,
      });

      const result = await manager.flushPending('msg-1');

      expect(result.success).toBe(true);
      expect(manager.hasPending('msg-1')).toBe(false);
    });

    it('should not flush temp IDs', async () => {
      manager.queueUpdate('temp-123', {
        sessionId: 'session-1',
        metadata: { key: 'value' },
        mergeStrategy: 'merge',
        retries: 0,
      });

      const result = await manager.flushPending('temp-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
      expect(manager.hasPending('temp-123')).toBe(true);
    });

    it('should increment retry count on failure', async () => {
      mockApiClient.patchMessageMetadata.mockRejectedValue(new Error('Failed'));

      manager.queueUpdate('msg-1', {
        sessionId: 'session-1',
        metadata: { key: 'value' },
        mergeStrategy: 'merge',
        retries: 0,
      });

      await manager.flushPending('msg-1');

      expect(manager.getRetryCount('msg-1')).toBe(1);
    });

    it('should drop update after max retries', async () => {
      mockApiClient.patchMessageMetadata.mockRejectedValue(new Error('Failed'));

      manager.queueUpdate('msg-1', {
        sessionId: 'session-1',
        metadata: { key: 'value' },
        mergeStrategy: 'merge',
        retries: 2, // Already at 2, will increment to 3 and drop
      });

      await manager.flushPending('msg-1');

      expect(manager.hasPending('msg-1')).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all pending updates', () => {
      manager.queueUpdate('msg-1', {
        sessionId: 'session-1',
        metadata: { key: 'value' },
        mergeStrategy: 'merge',
        retries: 0,
      });
      manager.queueUpdate('msg-2', {
        sessionId: 'session-1',
        metadata: { key: 'value' },
        mergeStrategy: 'merge',
        retries: 0,
      });

      manager.clearAll();

      expect(manager.getPendingIds()).toHaveLength(0);
    });
  });

  describe('getPendingIds', () => {
    it('should return all pending message IDs', () => {
      manager.queueUpdate('msg-1', {
        sessionId: 'session-1',
        metadata: {},
        mergeStrategy: 'merge',
        retries: 0,
      });
      manager.queueUpdate('msg-2', {
        sessionId: 'session-1',
        metadata: {},
        mergeStrategy: 'merge',
        retries: 0,
      });

      const ids = manager.getPendingIds();

      expect(ids).toContain('msg-1');
      expect(ids).toContain('msg-2');
      expect(ids).toHaveLength(2);
    });
  });
});
