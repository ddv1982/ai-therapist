import { renderHook, act, waitFor } from '@testing-library/react';
import { useMetadataQueue } from '@/features/chat/lib/queue/metadata-queue';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

// Mock dependencies
jest.mock('@/lib/api/client');
jest.mock('@/lib/utils/logger');
jest.mock('@/lib/api/api-response', () => ({
  getApiData: jest.fn((response) => response.data),
}));

describe('useMetadataQueue', () => {
  const mockOnMessageUpdated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for apiClient
    (apiClient.patchMessageMetadata as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'msg-1', metadata: { updated: true } },
    });
  });

  it('should queue metadata update and flush it automatically', async () => {
    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate('msg-1', {
        sessionId: 'session-1',
        metadata: { key: 'value' },
        mergeStrategy: 'merge',
      });
    });

    // Wait for the flush (setTimeout default 60ms)
    await waitFor(
      () => {
        expect(apiClient.patchMessageMetadata).toHaveBeenCalledWith('session-1', 'msg-1', {
          metadata: { key: 'value' },
          mergeStrategy: 'merge',
        });
      },
      { timeout: 200 }
    );

    expect(mockOnMessageUpdated).toHaveBeenCalled();
  });

  it('should flush pending metadata manually', async () => {
    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate(
        'msg-2',
        {
          sessionId: 'session-1',
          metadata: { key: 'manual' },
          mergeStrategy: 'replace',
        },
        false // Don't schedule
      );
    });

    expect(apiClient.patchMessageMetadata).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.flushPendingMetadata('msg-2');
    });

    expect(apiClient.patchMessageMetadata).toHaveBeenCalledWith('session-1', 'msg-2', {
      metadata: { key: 'manual' },
      mergeStrategy: 'replace',
    });
    expect(mockOnMessageUpdated).toHaveBeenCalled();
  });

  it('should skip temp messages', async () => {
    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate('temp-123', {
        sessionId: 'session-1',
        metadata: { key: 'temp' },
        mergeStrategy: 'merge',
      });
    });

    await waitFor(
      () => {
        // Should verify it was NOT called, but we need to wait to be sure it didn't happen
        // Since queueMetadataUpdate with default shouldSchedule=true uses setTimeout
      },
      { timeout: 100 }
    );

    expect(apiClient.patchMessageMetadata).not.toHaveBeenCalled();
  });

  it('should retry on failure', async () => {
    // Mock failure first, then success
    const error = new Error('Network error');
    (apiClient.patchMessageMetadata as jest.Mock)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        success: true,
        data: { id: 'msg-fail', metadata: {} },
      });

    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate(
        'msg-fail',
        {
          sessionId: 'session-1',
          metadata: { key: 'retry' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    // First attempt (fail)
    await act(async () => {
      await result.current.flushPendingMetadata('msg-fail');
    });

    expect(apiClient.patchMessageMetadata).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to persist queued metadata update',
      expect.objectContaining({ retries: 1 }),
      expect.any(Error)
    );

    // Second attempt (success)
    await act(async () => {
      await result.current.flushPendingMetadata('msg-fail');
    });

    expect(apiClient.patchMessageMetadata).toHaveBeenCalledTimes(2);
    expect(mockOnMessageUpdated).toHaveBeenCalled();
  });

  it('should stop retrying after max attempts', async () => {
    const error = new Error('Persistent error');
    (apiClient.patchMessageMetadata as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate(
        'msg-max',
        {
          sessionId: 'session-1',
          metadata: { key: 'max' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    // 3 attempts (retries 0->1, 1->2, 2->3 (fail))
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        await result.current.flushPendingMetadata('msg-max');
      });
    }

    // Attempt 3 should trigger "Dropping queued metadata update"
    expect(logger.error).toHaveBeenLastCalledWith(
      'Dropping queued metadata update after repeated failures',
      expect.objectContaining({ retries: 3 }),
      expect.any(Error)
    );

    // Try one more time - should be gone from queue?
    // The implementation deletes it from map when retries >= MAX (which is 3)
    // So next flush should do nothing if we pass the ID, as it's not in map
    (apiClient.patchMessageMetadata as jest.Mock).mockClear();
    await act(async () => {
      await result.current.flushPendingMetadata('msg-max');
    });
    expect(apiClient.patchMessageMetadata).not.toHaveBeenCalled();
  });

  it('should transfer pending metadata from temp to final ID', async () => {
    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      // Queue on temp ID without scheduling
      result.current.queueMetadataUpdate(
        'temp-1',
        {
          sessionId: 'session-1',
          metadata: { key: 'transfer' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    act(() => {
      result.current.transferPendingMetadata('temp-1', 'final-1');
    });

    // transferPendingMetadata schedules flush for final-1
    await waitFor(() => {
      expect(apiClient.patchMessageMetadata).toHaveBeenCalledWith(
        'session-1',
        'final-1',
        expect.objectContaining({ metadata: { key: 'transfer' } })
      );
    });
  });

  it('should process queue for existing messages', async () => {
    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      // Queue without scheduling
      result.current.queueMetadataUpdate(
        'msg-exist',
        {
          sessionId: 'session-1',
          metadata: { key: 'exist' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    act(() => {
      result.current.processQueueForMessages([{ id: 'msg-exist' }]);
    });

    await waitFor(() => {
      expect(apiClient.patchMessageMetadata).toHaveBeenCalledWith(
        'session-1',
        'msg-exist',
        expect.anything()
      );
    });
  });

  it('should clear queue', async () => {
    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate(
        'msg-clear',
        {
          sessionId: 'session-1',
          metadata: { key: 'clear' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    act(() => {
      result.current.clearQueue();
    });

    await act(async () => {
      await result.current.flushPendingMetadata('msg-clear');
    });

    expect(apiClient.patchMessageMetadata).not.toHaveBeenCalled();
  });

  it('should not flush if already flushing', async () => {
    let resolvePromise: (val: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (apiClient.patchMessageMetadata as jest.Mock).mockReturnValue(promise);

    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate(
        'msg-busy',
        {
          sessionId: 'session-1',
          metadata: { key: 'busy' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    // Start first flush
    act(() => {
      void result.current.flushPendingMetadata('msg-busy');
    });

    // Try second flush immediately
    await act(async () => {
      await result.current.flushPendingMetadata('msg-busy');
    });

    // Finish first flush
    resolvePromise!({ success: true, data: {} });

    expect(apiClient.patchMessageMetadata).toHaveBeenCalledTimes(1);
  });

  it('should handle 404 error by keeping in queue without incrementing retries', async () => {
    const error = { status: 404 };
    (apiClient.patchMessageMetadata as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate(
        'msg-404',
        {
          sessionId: 'session-1',
          metadata: { key: '404' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    await act(async () => {
      await result.current.flushPendingMetadata('msg-404');
    });

    expect(apiClient.patchMessageMetadata).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled(); // Should not log error for 404

    // Verify it's still in queue (by trying again and checking it calls API)
    (apiClient.patchMessageMetadata as jest.Mock).mockResolvedValue({ success: true });

    await act(async () => {
      await result.current.flushPendingMetadata('msg-404');
    });

    expect(apiClient.patchMessageMetadata).toHaveBeenCalledTimes(2);
  });

  it('should handle response.success = false by retrying', async () => {
    (apiClient.patchMessageMetadata as jest.Mock)
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce({
        success: true,
        data: { id: 'msg-fail-success', metadata: {} },
      });

    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate(
        'msg-fail-success',
        {
          sessionId: 'session-1',
          metadata: { key: 'retry' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    // First attempt (returns success: false, throws Error, catches, retries)
    await act(async () => {
      await result.current.flushPendingMetadata('msg-fail-success');
    });

    expect(apiClient.patchMessageMetadata).toHaveBeenCalledTimes(1);
    // Should log error because it threw "Failed to persist queued metadata update"
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to persist queued metadata update',
      expect.objectContaining({ retries: 1 }),
      expect.any(Error)
    );

    // Second attempt
    await act(async () => {
      await result.current.flushPendingMetadata('msg-fail-success');
    });

    expect(apiClient.patchMessageMetadata).toHaveBeenCalledTimes(2);
    expect(mockOnMessageUpdated).toHaveBeenCalled();
  });

  it('should log generic error if entry is missing during error handling', async () => {
    let rejectPromise: (err: any) => void;
    const promise = new Promise((_, reject) => {
      rejectPromise = reject;
    });
    (apiClient.patchMessageMetadata as jest.Mock).mockReturnValue(promise);

    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      result.current.queueMetadataUpdate(
        'msg-gone',
        {
          sessionId: 'session-1',
          metadata: { key: 'gone' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    // Start flush
    let flushPromise: Promise<void>;
    act(() => {
      flushPromise = result.current.flushPendingMetadata('msg-gone');
    });

    // Clear queue while request is pending
    act(() => {
      result.current.clearQueue();
    });

    // Fail the request
    await act(async () => {
      rejectPromise!(new Error('Network failed'));
      await flushPromise;
    });

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to persist queued metadata update',
      expect.objectContaining({
        messageId: 'msg-gone',
        // Should NOT have sessionId or retries because entry is gone
      }),
      expect.any(Error)
    );
  });

  it('should do nothing when flushing unknown ID', async () => {
    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    await act(async () => {
      await result.current.flushPendingMetadata('unknown-id');
    });

    expect(apiClient.patchMessageMetadata).not.toHaveBeenCalled();
  });

  it('should handle processQueueForMessages with mixed conditions', async () => {
    const { result } = renderHook(() =>
      useMetadataQueue({ onMessageUpdated: mockOnMessageUpdated })
    );

    act(() => {
      // 1. Valid pending message
      result.current.queueMetadataUpdate(
        'msg-valid',
        {
          sessionId: 'session-1',
          metadata: { key: 'valid' },
          mergeStrategy: 'merge',
        },
        false
      );

      // 2. Temp message (should be skipped by processQueue)
      result.current.queueMetadataUpdate(
        'temp-msg',
        {
          sessionId: 'session-1',
          metadata: { key: 'temp' },
          mergeStrategy: 'merge',
        },
        false
      );
    });

    // 3. Add a message that is NOT in the queue to the list passed to processQueue (should be ignored)

    act(() => {
      result.current.processQueueForMessages([{ id: 'msg-valid' }, { id: 'msg-not-in-queue' }]);
    });

    await waitFor(() => {
      expect(apiClient.patchMessageMetadata).toHaveBeenCalledWith(
        'session-1',
        'msg-valid',
        expect.anything()
      );
    });

    expect(apiClient.patchMessageMetadata).toHaveBeenCalledTimes(1);
  });
});
