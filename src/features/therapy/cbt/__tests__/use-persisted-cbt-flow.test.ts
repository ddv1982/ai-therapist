import {
  hasPersistedDraft,
  getPersistedDraftTimestamp,
  clearPersistedDraft,
} from '@/features/therapy/cbt/hooks/use-persisted-cbt-flow';

const STORAGE_KEY = 'cbt-flow-draft';

describe('use-persisted-cbt-flow utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('hasPersistedDraft', () => {
    test('returns false when no data in localStorage', () => {
      expect(hasPersistedDraft()).toBe(false);
    });

    test('returns false when localStorage has empty object', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
      expect(hasPersistedDraft()).toBe(false);
    });

    test('returns false when localStorage has only null values', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          situation: null,
          emotions: null,
          thoughts: [],
        })
      );
      expect(hasPersistedDraft()).toBe(false);
    });

    test('returns true when localStorage has situation data', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          situation: { situation: 'test', date: '2026-01-21' },
        })
      );
      expect(hasPersistedDraft()).toBe(true);
    });

    test('returns true when localStorage has emotions data', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          emotions: { primaryEmotion: 'anxiety', intensity: 5 },
        })
      );
      expect(hasPersistedDraft()).toBe(true);
    });

    test('returns true when localStorage has thoughts array with items', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          thoughts: [{ thought: 'test thought', credibility: 5 }],
        })
      );
      expect(hasPersistedDraft()).toBe(true);
    });

    test('returns false when thoughts array is empty', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          thoughts: [],
        })
      );
      expect(hasPersistedDraft()).toBe(false);
    });

    test('returns false when localStorage has invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');
      expect(hasPersistedDraft()).toBe(false);
    });
  });

  describe('getPersistedDraftTimestamp', () => {
    test('returns null when no data in localStorage', () => {
      expect(getPersistedDraftTimestamp()).toBe(null);
    });

    test('returns null when localStorage has no lastModified', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
      expect(getPersistedDraftTimestamp()).toBe(null);
    });

    test('returns null when lastModified is epoch (empty)', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lastModified: new Date(0).toISOString(),
        })
      );
      expect(getPersistedDraftTimestamp()).toBe(null);
    });

    test('returns timestamp when lastModified has valid value', () => {
      const timestamp = '2026-01-21T12:00:00.000Z';
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lastModified: timestamp,
        })
      );
      expect(getPersistedDraftTimestamp()).toBe(timestamp);
    });

    test('returns null when localStorage has invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');
      expect(getPersistedDraftTimestamp()).toBe(null);
    });
  });

  describe('clearPersistedDraft', () => {
    test('removes data from localStorage', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          situation: { situation: 'test', date: '2026-01-21' },
        })
      );
      expect(localStorage.getItem(STORAGE_KEY)).not.toBe(null);

      clearPersistedDraft();

      expect(localStorage.getItem(STORAGE_KEY)).toBe(null);
    });

    test('does not throw when localStorage is empty', () => {
      expect(() => clearPersistedDraft()).not.toThrow();
    });
  });
});
