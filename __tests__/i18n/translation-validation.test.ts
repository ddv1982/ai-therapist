/**
 * Translation Validation Tests
 *
 * Ensures all locale files have the same keys as the base locale (en.json)
 * Catches missing translations before they reach production
 */

import enMessages from '@/i18n/messages/en.json';
import nlMessages from '@/i18n/messages/nl.json';

/**
 * Recursively flattens nested translation object to dot notation paths
 * Example: { auth: { title: "Sign in" } } -> ["auth.title"]
 */
function flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Nested object - recurse
      keys.push(...flattenKeys(value, path));
    } else {
      // Leaf node - add the key
      keys.push(path);
    }
  }

  return keys.sort();
}

/**
 * Finds keys that exist in source but not in target
 */
function findMissingKeys(sourceKeys: string[], targetKeys: string[]): string[] {
  const targetSet = new Set(targetKeys);
  return sourceKeys.filter((key) => !targetSet.has(key));
}

/**
 * Finds keys that exist in target but not in source (extra keys)
 */
function findExtraKeys(sourceKeys: string[], targetKeys: string[]): string[] {
  const sourceSet = new Set(sourceKeys);
  return targetKeys.filter((key) => !sourceSet.has(key));
}

describe('Translation Validation', () => {
  describe('Key Completeness', () => {
    let enKeys: string[];
    let nlKeys: string[];

    beforeAll(() => {
      enKeys = flattenKeys(enMessages);
      nlKeys = flattenKeys(nlMessages);
    });

    it('has baseline English translations', () => {
      expect(enKeys.length).toBeGreaterThan(0);
      expect(enKeys).toContain('auth.title');
      expect(enKeys).toContain('chat.input.placeholder');
      expect(enKeys).toContain('cbt.welcome.title');
    });

    it('has Dutch translations', () => {
      expect(nlKeys.length).toBeGreaterThan(0);
      expect(nlKeys).toContain('auth.title');
      expect(nlKeys).toContain('chat.input.placeholder');
    });

    it('Dutch locale has all English keys (no missing translations)', () => {
      const missingKeys = findMissingKeys(enKeys, nlKeys);

      if (missingKeys.length > 0) {
        console.error('\n❌ Missing Dutch translations for:');
        missingKeys.forEach((key) => console.error(`   - ${key}`));
        console.error(`\nTotal missing: ${missingKeys.length} keys\n`);
      }

      expect(missingKeys).toEqual([]);
    });

    it('Dutch locale has no extra keys (orphaned translations)', () => {
      const extraKeys = findExtraKeys(enKeys, nlKeys);

      if (extraKeys.length > 0) {
        console.warn('\n⚠️  Extra Dutch translations (not in English):');
        extraKeys.forEach((key) => console.warn(`   - ${key}`));
        console.warn(`\nTotal extra: ${extraKeys.length} keys\n`);
      }

      expect(extraKeys).toEqual([]);
    });

    it('both locales have the same number of keys', () => {
      expect(nlKeys.length).toBe(enKeys.length);
    });
  });

  describe('Structure Validation', () => {
    it('English messages have proper nested structure', () => {
      expect(enMessages).toHaveProperty('auth');
      expect(enMessages).toHaveProperty('chat');
      expect(enMessages).toHaveProperty('cbt');
      expect(enMessages).toHaveProperty('ui');
      expect(enMessages).toHaveProperty('toast');
    });

    it('Dutch messages have same top-level structure', () => {
      expect(nlMessages).toHaveProperty('auth');
      expect(nlMessages).toHaveProperty('chat');
      expect(nlMessages).toHaveProperty('cbt');
      expect(nlMessages).toHaveProperty('ui');
      expect(nlMessages).toHaveProperty('toast');
    });

    it('messages are non-empty strings', () => {
      const enKeys = flattenKeys(enMessages);
      flattenKeys(nlMessages); // Validate nl structure

      // Sample check on first 10 keys
      const sampleKeys = enKeys.slice(0, 10);

      for (const key of sampleKeys) {
        const enValue = getNestedValue(enMessages, key);
        const nlValue = getNestedValue(nlMessages, key);

        expect(typeof enValue).toBe('string');
        expect(typeof nlValue).toBe('string');
        expect(enValue.length).toBeGreaterThan(0);
        expect(nlValue.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Translation Coverage Report', () => {
    it('generates coverage summary', () => {
      const enKeys = flattenKeys(enMessages);
      const nlKeys = flattenKeys(nlMessages);

      const coverage = {
        en: {
          total: enKeys.length,
          coverage: 100,
        },
        nl: {
          total: nlKeys.length,
          coverage: Math.round((nlKeys.length / enKeys.length) * 100),
          missing: findMissingKeys(enKeys, nlKeys).length,
          extra: findExtraKeys(enKeys, nlKeys).length,
        },
      };

      // Log summary for visibility
      console.log('\n📊 Translation Coverage Report:');
      console.log(`   English (baseline): ${coverage.en.total} keys`);
      console.log(`   Dutch: ${coverage.nl.total} keys (${coverage.nl.coverage}% complete)`);

      if (coverage.nl.missing > 0) {
        console.log(`   ⚠️  Missing: ${coverage.nl.missing} keys`);
      }
      if (coverage.nl.extra > 0) {
        console.log(`   ⚠️  Extra: ${coverage.nl.extra} keys`);
      }
      console.log('');

      // Test always passes - this is just for reporting
      expect(coverage).toBeDefined();
    });
  });
});

/**
 * Helper to get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
