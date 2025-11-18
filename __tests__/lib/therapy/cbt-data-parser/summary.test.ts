import { generateCBTSummary } from '@/lib/therapy/parsers';
import type { CBTStructuredAssessment } from '@/types/domains/therapy';

describe('cbt-data-parser summary', () => {
  describe('generateCBTSummary', () => {
    it('generates summary with all sections', () => {
      const cbtData: CBTStructuredAssessment = {
        situation: {
          description: 'Meeting with boss',
          date: '2024-01-15',
        },
        emotions: {
          initial: {
            anxiety: 8,
            fear: 6,
            sadness: 0,
          },
        },
        thoughts: {
          automaticThoughts: ['I will fail', 'Everyone will judge me'],
        },
        coreBeliefs: {
          belief: 'I am not good enough',
          credibility: 7,
        },
        schemaModes: [
          { name: 'Vulnerable Child', intensity: 8, description: 'Feels overwhelmed' },
          { name: 'Punitive Parent', intensity: 6, description: 'Critical inner voice' },
        ],
        emotionComparison: {
          changes: [
            { emotion: 'anxiety', initial: 8, final: 4, direction: 'decreased', change: -4 },
            { emotion: 'confidence', initial: 2, final: 6, direction: 'increased', change: 4 },
          ],
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).toContain('**Situation**: Meeting with boss (2024-01-15)');
      expect(result).toContain('**Initial Emotions**: anxiety: 8/10, fear: 6/10');
      expect(result).toContain('**Automatic Thoughts**: 2 identified');
      expect(result).toContain('**Core Belief**: "I am not good enough" (7/10 credibility)');
      expect(result).toContain('**Active Schema Modes**: 2 modes identified');
      expect(result).toContain('**Emotional Progress**: 2 emotions showed significant changes');
    });

    it('handles missing situation', () => {
      const cbtData: CBTStructuredAssessment = {
        emotions: {
          initial: { anxiety: 5 },
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).not.toContain('**Situation**');
    });

    it('handles missing emotions', () => {
      const cbtData: CBTStructuredAssessment = {
        situation: {
          description: 'Test situation',
          date: '2024-01-15',
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).not.toContain('**Initial Emotions**');
    });

    it('filters out zero-value emotions', () => {
      const cbtData: CBTStructuredAssessment = {
        emotions: {
          initial: {
            anxiety: 8,
            fear: 0,
            sadness: 0,
            anger: 5,
          },
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).toContain('anxiety: 8/10');
      expect(result).toContain('anger: 5/10');
      expect(result).not.toContain('fear');
      expect(result).not.toContain('sadness');
    });

    it('handles missing thoughts', () => {
      const cbtData: CBTStructuredAssessment = {
        situation: {
          description: 'Test',
          date: '2024-01-15',
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).not.toContain('**Automatic Thoughts**');
    });

    it('handles empty automatic thoughts array', () => {
      const cbtData: CBTStructuredAssessment = {
        thoughts: {
          automaticThoughts: [],
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).not.toContain('**Automatic Thoughts**');
    });

    it('handles missing core beliefs', () => {
      const cbtData: CBTStructuredAssessment = {
        thoughts: {
          automaticThoughts: ['Test thought'],
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).not.toContain('**Core Belief**');
    });

    it('handles missing schema modes', () => {
      const cbtData: CBTStructuredAssessment = {
        situation: {
          description: 'Test',
          date: '2024-01-15',
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).not.toContain('**Active Schema Modes**');
    });

    it('handles empty schema modes array', () => {
      const cbtData: CBTStructuredAssessment = {
        schemaModes: [],
      };

      const result = generateCBTSummary(cbtData);

      expect(result).not.toContain('**Active Schema Modes**');
    });

    it('handles missing emotion comparison', () => {
      const cbtData: CBTStructuredAssessment = {
        emotions: {
          initial: { anxiety: 5 },
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).not.toContain('**Emotional Progress**');
    });

    it('handles empty emotion comparison changes', () => {
      const cbtData: CBTStructuredAssessment = {
        emotionComparison: {
          changes: [],
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).not.toContain('**Emotional Progress**');
    });

    it('returns empty string for completely empty data', () => {
      const cbtData: CBTStructuredAssessment = {};

      const result = generateCBTSummary(cbtData);

      expect(result).toBe('');
    });

    it('joins sections with double newlines', () => {
      const cbtData: CBTStructuredAssessment = {
        situation: {
          description: 'Test',
          date: '2024-01-15',
        },
        emotions: {
          initial: { anxiety: 5 },
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).toContain('\n\n');
    });

    it('handles single emotion', () => {
      const cbtData: CBTStructuredAssessment = {
        emotions: {
          initial: { anxiety: 7 },
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).toContain('**Initial Emotions**: anxiety: 7/10');
    });

    it('handles single automatic thought', () => {
      const cbtData: CBTStructuredAssessment = {
        thoughts: {
          automaticThoughts: ['I will fail'],
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).toContain('**Automatic Thoughts**: 1 identified');
    });

    it('handles single schema mode', () => {
      const cbtData: CBTStructuredAssessment = {
        schemaModes: [{ name: 'Vulnerable Child', intensity: 8, description: 'Inner child' }],
      };

      const result = generateCBTSummary(cbtData);

      expect(result).toContain('**Active Schema Modes**: 1 modes identified');
    });

    it('handles single emotion change', () => {
      const cbtData: CBTStructuredAssessment = {
        emotionComparison: {
          changes: [
            { emotion: 'anxiety', initial: 8, final: 4, direction: 'decreased', change: -4 },
          ],
        },
      };

      const result = generateCBTSummary(cbtData);

      expect(result).toContain('**Emotional Progress**: 1 emotions showed significant changes');
    });
  });
});
