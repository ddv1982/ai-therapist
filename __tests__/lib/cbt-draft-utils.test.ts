/**
 * CBT Draft Utils Test Suite
 * 
 * Comprehensive tests for CBT draft management utilities including encryption,
 * draft saving, loading, memory management, and the useDraftSaver hook.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import {
  CBT_DRAFT_KEYS,
  saveCBTDraft,
  loadCBTDraft,
  clearCBTDraft,
  clearAllCBTDrafts,
  hasCBTDraft,
  getAvailableDrafts,
  getDraftMetadata,
  cleanupExpiredDrafts,
  batchUpdateDrafts,
  useDraftSaver
} from '@/lib/utils/cbt-draft-utils';

// Mock the crypto-utils module
jest.mock('@/lib/auth/crypto-utils', () => ({
  encryptSensitiveData: jest.fn((data: string) => {
    // Create a realistic base64-encoded string that passes our encryption detection
    const base64 = Buffer.from(`encrypted_${data}`).toString('base64');
    // Pad to ensure it's long enough for encryption detection (>50 chars)
    return base64.padEnd(60, '=');
  }),
  decryptSensitiveData: jest.fn((encrypted: string) => {
    try {
      // Decode the base64 and remove our prefix
      const decoded = Buffer.from(encrypted, 'base64').toString();
      if (decoded.startsWith('encrypted_')) {
        return decoded.replace('encrypted_', '');
      }
      throw new Error('Invalid format');
    } catch {
      throw new Error('Decryption failed');
    }
  })
}));

// Mock localStorage
const localStorageMock = {
  data: {} as Record<string, string>,
  getItem: jest.fn((key: string) => localStorageMock.data[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.data[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageMock.data[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.data = {};
  })
};

// Mock window and localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Test data fixtures
const mockCBTData = {
  situation: 'Test situation',
  emotions: { fear: 5, anger: 3 },
  thoughts: ['Test thought 1', 'Test thought 2']
};

const mockLargeCBTData = {
  situation: 'A'.repeat(60000), // Exceeds 50KB limit
  emotions: { fear: 8 },
  thoughts: ['Large thought']
};

describe('CBT Draft Utils', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Basic Draft Operations', () => {
    describe('saveCBTDraft', () => {
      it('should save draft data with encryption', () => {
        const result = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

        expect(result).toBe(true);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          CBT_DRAFT_KEYS.SITUATION,
          expect.stringMatching(/^[A-Za-z0-9+/=]+$/) // Base64 format
        );
        
        // Verify the stored data length indicates encryption occurred
        const storedValue = localStorageMock.setItem.mock.calls[0][1];
        expect(storedValue.length).toBeGreaterThan(50);
      });

      it('should reject drafts exceeding size limit', () => {
        const result = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockLargeCBTData);

        expect(result).toBe(false);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });

      it('should return false when window is undefined', () => {
        // Mock window as undefined
        Object.defineProperty(global, 'window', {
          value: undefined,
          configurable: true
        });

        const result = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

        expect(result).toBe(false);
        
        // Restore window
        Object.defineProperty(global, 'window', {
          value: { localStorage: localStorageMock },
          configurable: true
        });
      });

      it('should handle encryption errors gracefully', () => {
        const { encryptSensitiveData } = require('@/lib/auth/crypto-utils');
        encryptSensitiveData.mockImplementationOnce(() => {
          throw new Error('Encryption failed');
        });

        const result = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

        expect(result).toBe(false);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });
    });

    describe('loadCBTDraft', () => {
      it('should load and decrypt saved draft data', () => {
        // First save some data
        saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

        // Then load it
        const loaded = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, {});

        expect(loaded).toEqual(mockCBTData);
      });

      it('should return default value when no draft exists', () => {
        const defaultValue = { default: true };
        const result = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, defaultValue);

        expect(result).toEqual(defaultValue);
      });

      it('should handle legacy unencrypted data', () => {
        // Simulate legacy unencrypted data
        localStorageMock.data[CBT_DRAFT_KEYS.SITUATION] = JSON.stringify(mockCBTData);

        const loaded = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, {});

        expect(loaded).toEqual(mockCBTData);
      });

      it('should return default value on decryption error', () => {
        const { decryptSensitiveData } = require('@/lib/auth/crypto-utils');
        decryptSensitiveData.mockImplementationOnce(() => {
          throw new Error('Decryption failed');
        });

        // Set some encrypted-looking data that will fail to decrypt
        localStorageMock.data[CBT_DRAFT_KEYS.SITUATION] = 'encrypted_invalid_data';

        const defaultValue = { error: 'fallback' };
        const result = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, defaultValue);

        expect(result).toEqual(defaultValue);
      });
    });

    describe('clearCBTDraft', () => {
      it('should clear specific draft', () => {
        saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);
        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(true);

        const result = clearCBTDraft(CBT_DRAFT_KEYS.SITUATION);

        expect(result).toBe(true);
        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(false);
      });
    });

    describe('clearAllCBTDrafts', () => {
      it('should clear all CBT drafts', () => {
        saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);
        saveCBTDraft(CBT_DRAFT_KEYS.EMOTIONS, mockCBTData);

        const result = clearAllCBTDrafts();

        expect(result).toBe(true);
        expect(getAvailableDrafts()).toEqual([]);
      });
    });
  });

  describe('Draft Metadata and Management', () => {
    describe('hasCBTDraft', () => {
      it('should return true when draft exists', () => {
        saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(true);
      });

      it('should return false when draft does not exist', () => {
        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(false);
      });
    });

    describe('getAvailableDrafts', () => {
      it('should return array of keys with existing drafts', () => {
        saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);
        saveCBTDraft(CBT_DRAFT_KEYS.EMOTIONS, mockCBTData);

        const available = getAvailableDrafts();

        expect(available).toContain(CBT_DRAFT_KEYS.SITUATION);
        expect(available).toContain(CBT_DRAFT_KEYS.EMOTIONS);
        expect(available).toHaveLength(2);
      });

      it('should return empty array when no drafts exist', () => {
        expect(getAvailableDrafts()).toEqual([]);
      });
    });

    describe('getDraftMetadata', () => {
      it('should return metadata for encrypted drafts', () => {
        saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

        const metadata = getDraftMetadata(CBT_DRAFT_KEYS.SITUATION);

        expect(metadata).toEqual({
          version: 'v1',
          timestamp: expect.any(Number),
          size: expect.any(Number),
          compressed: false
        });
      });

      it('should return null for non-existent drafts', () => {
        const metadata = getDraftMetadata(CBT_DRAFT_KEYS.SITUATION);

        expect(metadata).toBeNull();
      });

      it('should return null for legacy unencrypted drafts', () => {
        localStorageMock.data[CBT_DRAFT_KEYS.SITUATION] = JSON.stringify(mockCBTData);

        const metadata = getDraftMetadata(CBT_DRAFT_KEYS.SITUATION);

        expect(metadata).toBeNull();
      });
    });

    describe('cleanupExpiredDrafts', () => {
      it('should clean up drafts older than retention period', () => {
        // Create a draft with old timestamp
        const oldTimestamp = Date.now() - (40 * 24 * 60 * 60 * 1000); // 40 days ago
        const oldDraftData = {
          metadata: {
            version: 'v1',
            timestamp: oldTimestamp,
            size: 100,
            compressed: false
          },
          data: mockCBTData
        };

        const { encryptSensitiveData } = require('@/lib/auth/crypto-utils');
        localStorageMock.data[CBT_DRAFT_KEYS.SITUATION] = encryptSensitiveData(JSON.stringify(oldDraftData));

        const cleanedCount = cleanupExpiredDrafts(30); // 30 day retention

        expect(cleanedCount).toBe(1);
        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(false);
      });

      it('should not clean up recent drafts', () => {
        saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

        const cleanedCount = cleanupExpiredDrafts(30);

        expect(cleanedCount).toBe(0);
        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(true);
      });
    });

    describe('batchUpdateDrafts', () => {
      it('should update multiple drafts atomically', () => {
        const updates = [
          { key: CBT_DRAFT_KEYS.SITUATION, data: mockCBTData },
          { key: CBT_DRAFT_KEYS.EMOTIONS, data: mockCBTData }
        ];

        const result = batchUpdateDrafts(updates);

        expect(result).toBe(true);
        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(true);
        expect(hasCBTDraft(CBT_DRAFT_KEYS.EMOTIONS)).toBe(true);
      });

      it('should reject batch if any update exceeds size limit', () => {
        const updates = [
          { key: CBT_DRAFT_KEYS.SITUATION, data: mockCBTData },
          { key: CBT_DRAFT_KEYS.EMOTIONS, data: mockLargeCBTData } // Too large
        ];

        const result = batchUpdateDrafts(updates);

        expect(result).toBe(false);
        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(false);
        expect(hasCBTDraft(CBT_DRAFT_KEYS.EMOTIONS)).toBe(false);
      });
    });
  });

  describe('useDraftSaver Hook', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    describe('Basic Functionality', () => {
      it('should save draft after debounce delay', async () => {
        const { result } = renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.SITUATION, mockCBTData, 1000)
        );

        expect(result.current.isDraftSaved).toBe(false);

        // Fast-forward time to trigger debounced save
        act(() => {
          jest.advanceTimersByTime(1000);
        });

        await waitFor(() => {
          expect(result.current.isDraftSaved).toBe(true);
        });
      });

      it('should clear draft when data becomes empty', async () => {
        const emptyData = { situation: '', emotions: {}, thoughts: [] };
        
        renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.SITUATION, emptyData, 1000)
        );

        act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(false);
      });

      it('should debounce multiple rapid changes', async () => {
        const { result, rerender } = renderHook(
          ({ data }) => useDraftSaver(CBT_DRAFT_KEYS.SITUATION, data, 1000),
          { initialProps: { data: mockCBTData } }
        );

        // Multiple rapid changes
        rerender({ data: { ...mockCBTData, situation: 'Change 1' } });
        act(() => jest.advanceTimersByTime(500));

        rerender({ data: { ...mockCBTData, situation: 'Change 2' } });
        act(() => jest.advanceTimersByTime(500));

        rerender({ data: { ...mockCBTData, situation: 'Final change' } });
        
        // Only the final change should be saved after full debounce
        act(() => jest.advanceTimersByTime(1000));

        const saved = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, {});
        expect(saved.situation).toBe('Final change');
      });

      it('should provide saveDraftNow function for immediate saving', async () => {
        const { result } = renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.SITUATION, mockCBTData, 1000)
        );

        act(() => {
          result.current.saveDraftNow();
        });

        await waitFor(() => {
          expect(result.current.isDraftSaved).toBe(true);
        });

        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(true);
      });
    });

    describe('Memory Management', () => {
      it('should clean up timers on unmount', () => {
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        
        const { unmount } = renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.SITUATION, mockCBTData, 1000)
        );

        act(() => {
          unmount();
        });

        expect(clearTimeoutSpy).toHaveBeenCalled();
      });

      it('should cancel previous timeout when data changes', () => {
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        
        const { rerender } = renderHook(
          ({ data }) => useDraftSaver(CBT_DRAFT_KEYS.SITUATION, data, 1000),
          { initialProps: { data: mockCBTData } }
        );

        // Change data to trigger timeout cancellation
        rerender({ data: { ...mockCBTData, situation: 'Updated' } });

        expect(clearTimeoutSpy).toHaveBeenCalled();
      });

      it('should handle rapid indicator state changes', async () => {
        const { result } = renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.SITUATION, mockCBTData, 1000)
        );

        // Trigger multiple saves rapidly
        act(() => {
          result.current.saveDraftNow();
          result.current.saveDraftNow();
          result.current.saveDraftNow();
        });

        await waitFor(() => {
          expect(result.current.isDraftSaved).toBe(true);
        });

        // Indicator should clear after timeout
        act(() => {
          jest.advanceTimersByTime(1000);
        });

        await waitFor(() => {
          expect(result.current.isDraftSaved).toBe(false);
        });
      });
    });

    describe('Content Detection', () => {
      it('should detect meaningful string content', async () => {
        const dataWithContent = { situation: 'Has content' };
        
        renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.SITUATION, dataWithContent, 1000)
        );

        act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(true);
      });

      it('should ignore whitespace-only content', async () => {
        const dataWithWhitespace = { situation: '   \n\t   ' };
        
        renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.SITUATION, dataWithWhitespace, 1000)
        );

        act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(false);
      });

      it('should detect meaningful numeric content', async () => {
        const dataWithNumbers = { emotions: { fear: 5 } };
        
        renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.EMOTIONS, dataWithNumbers, 1000)
        );

        act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(hasCBTDraft(CBT_DRAFT_KEYS.EMOTIONS)).toBe(true);
      });

      it('should ignore zero values', async () => {
        const dataWithZeros = { emotions: { fear: 0, anger: 0 } };
        
        renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.EMOTIONS, dataWithZeros, 1000)
        );

        act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(hasCBTDraft(CBT_DRAFT_KEYS.EMOTIONS)).toBe(false);
      });

      it('should detect meaningful array content', async () => {
        const dataWithArrays = { thoughts: ['First thought', 'Second thought'] };
        
        renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.THOUGHTS, dataWithArrays, 1000)
        );

        act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(hasCBTDraft(CBT_DRAFT_KEYS.THOUGHTS)).toBe(true);
      });

      it('should ignore empty arrays', async () => {
        const dataWithEmptyArray = { thoughts: [] };
        
        renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.THOUGHTS, dataWithEmptyArray, 1000)
        );

        act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(hasCBTDraft(CBT_DRAFT_KEYS.THOUGHTS)).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle save failures gracefully', async () => {
        // Mock localStorage to fail
        const originalSetItem = localStorageMock.setItem;
        localStorageMock.setItem.mockImplementationOnce(() => {
          throw new Error('Storage failed');
        });

        const { result } = renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.SITUATION, mockCBTData, 1000)
        );

        act(() => {
          result.current.saveDraftNow();
        });

        // Should not show as saved when save fails
        expect(result.current.isDraftSaved).toBe(false);

        // Restore original implementation
        localStorageMock.setItem.mockImplementation(originalSetItem);
      });

      it('should handle encryption failures during save', async () => {
        const { encryptSensitiveData } = require('@/lib/auth/crypto-utils');
        encryptSensitiveData.mockImplementationOnce(() => {
          throw new Error('Encryption failed');
        });

        const { result } = renderHook(() =>
          useDraftSaver(CBT_DRAFT_KEYS.SITUATION, mockCBTData, 1000)
        );

        act(() => {
          result.current.saveDraftNow();
        });

        expect(result.current.isDraftSaved).toBe(false);
      });
    });

    describe('Performance Optimization', () => {
      it('should memoize content detection to avoid recalculation', () => {
        const { rerender } = renderHook(
          ({ data }) => useDraftSaver(CBT_DRAFT_KEYS.SITUATION, data, 1000),
          { initialProps: { data: mockCBTData } }
        );

        // Re-render with same data should not trigger new save
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        const timeoutCallCount = clearTimeoutSpy.mock.calls.length;

        rerender({ data: mockCBTData });

        // Should not have cleared timeout since data hasn't changed
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(timeoutCallCount);
      });

      it('should handle different delay values', async () => {
        const { result, rerender } = renderHook(
          ({ delay }) => useDraftSaver(CBT_DRAFT_KEYS.SITUATION, mockCBTData, delay),
          { initialProps: { delay: 1000 } }
        );

        // Change delay
        rerender({ delay: 2000 });

        act(() => {
          jest.advanceTimersByTime(2000);
        });

        await waitFor(() => {
          expect(result.current.isDraftSaved).toBe(true);
        });
      });
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle complex nested data structures', () => {
      const complexData = {
        situation: 'Complex situation',
        emotions: {
          primary: { fear: 8, anger: 5 },
          secondary: { shame: 3, guilt: 7 }
        },
        thoughts: [
          { thought: 'First thought', credibility: 8 },
          { thought: 'Second thought', credibility: 5 }
        ],
        metadata: {
          timestamp: new Date().toISOString(),
          sessionId: 'test-session-123'
        }
      };

      const saveResult = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, complexData);
      expect(saveResult).toBe(true);

      const loadedData = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, {});
      expect(loadedData).toEqual(complexData);
    });

    it('should maintain data integrity through save/load cycles', () => {
      const originalData = {
        specialChars: 'Special chars: éññöß 中文 🎭 \n\t"\'\\',
        numbers: [0, -1, 3.14159, Number.MAX_SAFE_INTEGER],
        booleans: { isActive: true, isComplete: false },
        nullValues: { empty: null, undefined: undefined }
      };

      saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, originalData);
      const retrieved = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, {});

      // Note: undefined values are lost in JSON serialization, which is expected
      expect(retrieved).toEqual({
        ...originalData,
        nullValues: { empty: null } // undefined is lost, null is preserved
      });
    });

    it('should work correctly with all defined CBT draft keys', () => {
      Object.values(CBT_DRAFT_KEYS).forEach(key => {
        const testData = { [key]: `Test data for ${key}` };
        
        const saveResult = saveCBTDraft(key, testData);
        expect(saveResult).toBe(true);

        const loadResult = loadCBTDraft(key, {});
        expect(loadResult).toEqual(testData);

        expect(hasCBTDraft(key)).toBe(true);
      });

      expect(getAvailableDrafts()).toHaveLength(Object.keys(CBT_DRAFT_KEYS).length);
    });
  });
});