/**
 * Unit Tests for CBT Data Parser
 *
 * Focused tests for individual functions instead of complex integration flows.
 */

import { parseAllCBTData, hasCBTData, generateCBTSummary } from '../cbt-data-parser';

describe('CBT Data Parser - Unit Tests', () => {
  describe('hasCBTData', () => {
    it('should return true for messages with CBT summary cards', () => {
      const messages = [{
        role: 'assistant',
        content: '<!-- CBT_SUMMARY_CARD:{"situation":"test"} --> Some content'
      }];

      expect(hasCBTData(messages)).toBe(true);
    });

    it('should return false for messages without CBT data', () => {
      const messages = [{
        role: 'user',
        content: 'Hello, how are you?'
      }];

      expect(hasCBTData(messages)).toBe(false);
    });

    it('should return false for empty message array', () => {
      expect(hasCBTData([])).toBe(false);
    });
  });

  describe('parseAllCBTData', () => {
    it('should parse situation data from CBT summary card', () => {
      const messages = [{
        role: 'assistant',
        content: '<!-- CBT_SUMMARY_CARD:{"situation":"Feeling overwhelmed at work","date":"2024-01-15"} -->'
      }];

      const result = parseAllCBTData(messages);

      expect(result.situation).toEqual({
        date: "2024-01-15",
        description: "Feeling overwhelmed at work"
      });
    });

    it('should parse emotions data from CBT summary card', () => {
      const messages = [{
        role: 'assistant',
        content: '<!-- CBT_SUMMARY_CARD:{"initialEmotions":[{"emotion":"anxiety","rating":8}]} -->'
      }];

      const result = parseAllCBTData(messages);

      expect(result.emotions?.initial).toEqual({
        anxiety: 8
      });
    });

    it('should parse thoughts data from CBT summary card', () => {
      const messages = [{
        role: 'assistant',
        content: '<!-- CBT_SUMMARY_CARD:{"automaticThoughts":[{"thought":"I can\'t handle this"}]} -->'
      }];

      const result = parseAllCBTData(messages);

      expect(result.thoughts?.automaticThoughts).toEqual([
        "I can't handle this"
      ]);
    });

    it('should handle invalid JSON gracefully', () => {
      const messages = [{
        role: 'assistant',
        content: '<!-- CBT_SUMMARY_CARD:{invalid json} -->'
      }];

      const result = parseAllCBTData(messages);

      expect(result.situation).toBeUndefined();
    });
  });

  describe('generateCBTSummary', () => {
    it('should generate summary from situation data', () => {
      const data = {
        situation: {
          date: "2024-01-15",
          description: "Feeling overwhelmed at work"
        }
      };

      const summary = generateCBTSummary(data);

      expect(summary).toContain("Feeling overwhelmed at work");
      expect(summary).toContain("2024-01-15");
    });

    it('should generate summary from emotions data', () => {
      const data = {
        emotions: {
          initial: { anxiety: 8, stress: 7 },
          final: { anxiety: 4, stress: 3 }
        }
      };

      const summary = generateCBTSummary(data);

      expect(summary).toContain("**Initial Emotions**: anxiety: 8/10, stress: 7/10");
      // Note: final emotions are not currently included in the summary
    });

    it('should generate summary from thoughts data', () => {
      const data = {
        thoughts: {
          automaticThoughts: ["I can't handle this", "I'm going to fail"]
        }
      };

      const summary = generateCBTSummary(data);

      expect(summary).toContain("**Automatic Thoughts**: 2 identified");
      // Note: individual thoughts are not listed in the summary, just the count
    });

    it('should handle empty data', () => {
      const data = {};
      const summary = generateCBTSummary(data);

      expect(summary).toBe("");
    });
  });
});
