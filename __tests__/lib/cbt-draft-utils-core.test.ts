/**
 * CBT Draft Utils Core Test Suite
 * 
 * Focused tests for core CBT draft management functionality including encryption,
 * basic operations, and essential features.
 */

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
  batchUpdateDrafts
} from '@/lib/utils/cbt-draft-utils';

// Mock the crypto-utils module
jest.mock('@/lib/auth/crypto-utils', () => ({
  encryptSensitiveData: jest.fn((data: string) => {
    const base64 = Buffer.from(`encrypted_${data}`).toString('base64');
    return base64.padEnd(60, '=');
  }),
  decryptSensitiveData: jest.fn((encrypted: string) => {
    try {
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

const mockCBTData = {
  situation: 'Test situation',
  emotions: { fear: 5, anger: 3 },
  thoughts: ['Test thought 1', 'Test thought 2']
};

const mockLargeCBTData = {
  situation: 'A'.repeat(60000), // Exceeds 50KB limit
  emotions: { fear: 8 }
};

describe('CBT Draft Utils - Core Operations', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Encryption and Basic Operations', () => {
    it('should save draft data with encryption', () => {
      const result = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        CBT_DRAFT_KEYS.SITUATION,
        expect.stringMatching(/^[A-Za-z0-9+/=]+$/)
      );

      const storedValue = localStorageMock.setItem.mock.calls[0][1];
      expect(storedValue.length).toBeGreaterThan(50);
    });

    it('should load and decrypt saved draft data', () => {
      saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);
      const loaded = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, {});

      expect(loaded).toEqual(mockCBTData);
    });

    it('should handle legacy unencrypted data', () => {
      localStorageMock.data[CBT_DRAFT_KEYS.SITUATION] = JSON.stringify(mockCBTData);
      const loaded = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, {});

      expect(loaded).toEqual(mockCBTData);
    });

    it('should return default value when no draft exists', () => {
      const defaultValue = { default: true };
      const result = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, defaultValue);

      expect(result).toEqual(defaultValue);
    });
  });

  describe('Size Limits and Validation', () => {
    it('should reject drafts exceeding size limit', () => {
      const result = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockLargeCBTData);

      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should enforce size limits in batch operations', () => {
      const updates = [
        { key: CBT_DRAFT_KEYS.SITUATION, data: mockCBTData },
        { key: CBT_DRAFT_KEYS.EMOTIONS, data: mockLargeCBTData }
      ];

      const result = batchUpdateDrafts(updates);

      expect(result).toBe(false);
      expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(false);
      expect(hasCBTDraft(CBT_DRAFT_KEYS.EMOTIONS)).toBe(false);
    });
  });

  describe('Draft Management', () => {
    it('should correctly identify existing drafts', () => {
      expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(false);

      saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

      expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(true);
    });

    it('should clear specific drafts', () => {
      saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);
      saveCBTDraft(CBT_DRAFT_KEYS.EMOTIONS, mockCBTData);

      expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(true);

      const result = clearCBTDraft(CBT_DRAFT_KEYS.SITUATION);

      expect(result).toBe(true);
      expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(false);
      expect(hasCBTDraft(CBT_DRAFT_KEYS.EMOTIONS)).toBe(true);
    });

    it('should clear all drafts', () => {
      saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);
      saveCBTDraft(CBT_DRAFT_KEYS.EMOTIONS, mockCBTData);

      const result = clearAllCBTDrafts();

      expect(result).toBe(true);
      expect(getAvailableDrafts()).toEqual([]);
    });

    it('should return available draft keys', () => {
      saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);
      saveCBTDraft(CBT_DRAFT_KEYS.EMOTIONS, mockCBTData);

      const available = getAvailableDrafts();

      expect(available).toContain(CBT_DRAFT_KEYS.SITUATION);
      expect(available).toContain(CBT_DRAFT_KEYS.EMOTIONS);
      expect(available).toHaveLength(2);
    });
  });

  describe('Metadata and Advanced Features', () => {
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

    it('should return null metadata for non-existent drafts', () => {
      const metadata = getDraftMetadata(CBT_DRAFT_KEYS.SITUATION);
      expect(metadata).toBeNull();
    });

    it('should handle batch updates atomically', () => {
      const updates = [
        { key: CBT_DRAFT_KEYS.SITUATION, data: mockCBTData },
        { key: CBT_DRAFT_KEYS.EMOTIONS, data: mockCBTData }
      ];

      const result = batchUpdateDrafts(updates);

      expect(result).toBe(true);
      expect(hasCBTDraft(CBT_DRAFT_KEYS.SITUATION)).toBe(true);
      expect(hasCBTDraft(CBT_DRAFT_KEYS.EMOTIONS)).toBe(true);
    });

    it('should clean up expired drafts', () => {
      // Create a draft with old timestamp
      const oldTimestamp = Date.now() - (40 * 24 * 60 * 60 * 1000);
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

      const cleanedCount = cleanupExpiredDrafts(30);

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

  describe('Error Handling', () => {
    it('should handle encryption errors gracefully', () => {
      const { encryptSensitiveData } = require('@/lib/auth/crypto-utils');
      encryptSensitiveData.mockImplementationOnce(() => {
        throw new Error('Encryption failed');
      });

      const result = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle decryption errors gracefully', () => {
      const { decryptSensitiveData } = require('@/lib/auth/crypto-utils');
      decryptSensitiveData.mockImplementationOnce(() => {
        throw new Error('Decryption failed');
      });

      localStorageMock.data[CBT_DRAFT_KEYS.SITUATION] = 'invalid_encrypted_data';

      const defaultValue = { error: 'fallback' };
      const result = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it('should handle localStorage failures', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage failed');
      });

      const result = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

      expect(result).toBe(false);
      localStorageMock.setItem.mockImplementation(originalSetItem);
    });

    it('should return false when window is undefined', () => {
      // Mock window as undefined by deleting it temporarily
      const originalWindow = global.window;
      delete (global as NodeJS.Global & { window?: Window }).window;

      const result = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, mockCBTData);

      expect(result).toBe(false);

      // Restore window
      (global as NodeJS.Global & { window?: Window }).window = originalWindow;
    });
  });

  describe('Data Integrity', () => {
    it('should handle basic data types correctly', () => {
      const simpleData = {
        text: 'Hello',
        number: 42,
        boolean: true
      };

      const saveResult = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, simpleData);
      expect(saveResult).toBe(true);

      const retrieved = loadCBTDraft(CBT_DRAFT_KEYS.SITUATION, {});
      expect(retrieved).toEqual(simpleData);
    });

    it('should work with individual CBT draft keys', () => {
      // Test a few key operations individually
      const keys = [CBT_DRAFT_KEYS.SITUATION, CBT_DRAFT_KEYS.EMOTIONS, CBT_DRAFT_KEYS.THOUGHTS];
      
      keys.forEach((key, index) => {
        const testData = { id: index, text: `Test ${index}` };
        
        expect(saveCBTDraft(key, testData)).toBe(true);
        expect(loadCBTDraft(key, {})).toEqual(testData);
        expect(hasCBTDraft(key)).toBe(true);
      });

      expect(getAvailableDrafts().length).toBeGreaterThanOrEqual(3);
    });
  });
});