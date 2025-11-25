import {
  asEmotionData,
  asThoughtDataArray,
  asCoreBeliefData,
  asChallengeQuestionsArray,
  asRationalThoughtsArray,
  asActionPlanData,
} from '@/lib/therapy/transformers/cbt-transformers';

describe('cbt-transformers', () => {
  describe('asEmotionData', () => {
    it('should return default values for undefined input', () => {
      const result = asEmotionData(undefined);
      expect(result).toEqual({
        fear: 0,
        anger: 0,
        sadness: 0,
        joy: 0,
        anxiety: 0,
        shame: 0,
        guilt: 0,
        other: '',
        otherIntensity: 0,
      });
    });

    it('should return default values for empty object', () => {
      const result = asEmotionData({});
      expect(result).toEqual({
        fear: 0,
        anger: 0,
        sadness: 0,
        joy: 0,
        anxiety: 0,
        shame: 0,
        guilt: 0,
        other: '',
        otherIntensity: 0,
      });
    });

    it('should correctly map provided values', () => {
      const input = {
        fear: 5,
        anger: 2,
        sadness: 8,
        joy: 1,
        anxiety: 6,
        shame: 3,
        guilt: 4,
        other: 'Confusion',
        otherIntensity: 7,
      };
      const result = asEmotionData(input);
      expect(result).toEqual(input);
    });

    it('should convert string numbers to numbers', () => {
      const input = {
        fear: '5',
        anger: '2',
      };
      const result = asEmotionData(input);
      expect(result.fear).toBe(5);
      expect(result.anger).toBe(2);
    });

    it('should handle partial inputs', () => {
      const input = {
        fear: 10,
      };
      const result = asEmotionData(input);
      expect(result.fear).toBe(10);
      expect(result.anger).toBe(0);
    });
  });

  describe('asThoughtDataArray', () => {
    it('should return empty array for non-array input', () => {
      expect(asThoughtDataArray(undefined)).toEqual([]);
      expect(asThoughtDataArray(null)).toEqual([]);
      expect(asThoughtDataArray({})).toEqual([]);
    });

    it('should map array of objects correctly', () => {
      const input = [
        { thought: 'Thinking 1', credibility: 8 },
        { thought: 'Thinking 2', credibility: 3 },
      ];
      const result = asThoughtDataArray(input);
      expect(result).toEqual(input);
    });

    it('should map array of strings', () => {
      const input = ['Thinking 1', 'Thinking 2'];
      const result = asThoughtDataArray(input);
      expect(result).toEqual([
        { thought: 'Thinking 1', credibility: 5 },
        { thought: 'Thinking 2', credibility: 5 },
      ]);
    });

    it('should map objects with alternate keys (text, content)', () => {
      const input = [
        { text: 'Thinking 1', credibility: 8 },
        { content: 'Thinking 2', credibility: 3 },
      ];
      const result = asThoughtDataArray(input);
      expect(result).toEqual([
        { thought: 'Thinking 1', credibility: 8 },
        { thought: 'Thinking 2', credibility: 3 },
      ]);
    });

    it('should filter out empty thoughts', () => {
      const input = [
        { thought: '', credibility: 5 },
        { thought: 'Valid', credibility: 5 },
        null,
        undefined,
        { unrelated: 'data' }, // Object without thought keys
      ];
      const result = asThoughtDataArray(input);
      expect(result).toEqual([{ thought: 'Valid', credibility: 5 }]);
    });
  });

  describe('asCoreBeliefData', () => {
    it('should return default values for undefined input', () => {
      expect(asCoreBeliefData(undefined)).toEqual({
        coreBeliefText: '',
        coreBeliefCredibility: 5,
      });
    });

    it('should map valid input', () => {
      const input = {
        coreBeliefText: 'I am bad',
        coreBeliefCredibility: 9,
      };
      expect(asCoreBeliefData(input)).toEqual(input);
    });

    it('should handle numeric casting', () => {
      const input = {
        coreBeliefText: 'I am bad',
        coreBeliefCredibility: '9',
      };
      expect(asCoreBeliefData(input).coreBeliefCredibility).toBe(9);
    });
  });

  describe('asChallengeQuestionsArray', () => {
    it('should return empty array for non-array input', () => {
      expect(asChallengeQuestionsArray(undefined)).toEqual([]);
    });

    it('should map array of objects correctly', () => {
      const input = [
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ];
      expect(asChallengeQuestionsArray(input)).toEqual(input);
    });

    it('should handle alternate keys (q, a, prompt, response)', () => {
      const input = [
        { q: 'Q1', a: 'A1' },
        { prompt: 'Q2', response: 'A2' },
      ];
      expect(asChallengeQuestionsArray(input)).toEqual([
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ]);
    });

    it('should map simple strings', () => {
      const input = ['Q1', 'Q2'];
      expect(asChallengeQuestionsArray(input)).toEqual([
        { question: 'Q1', answer: '' },
        { question: 'Q2', answer: '' },
      ]);
    });

    it('should filter empty questions', () => {
      const input = [
        { question: '' },
        { question: 'Q1' },
        { unrelated: 'data' }, // Object without question keys
      ];
      expect(asChallengeQuestionsArray(input)).toEqual([{ question: 'Q1', answer: '' }]);
    });

    it('should handle missing answer in object', () => {
      const input = [{ question: 'Q1' }];
      expect(asChallengeQuestionsArray(input)).toEqual([{ question: 'Q1', answer: '' }]);
    });
  });

  describe('asRationalThoughtsArray', () => {
    it('should return empty array for non-array input', () => {
      expect(asRationalThoughtsArray(undefined)).toEqual([]);
    });

    it('should map array of objects correctly', () => {
      const input = [{ thought: 'RT1', confidence: 7 }];
      expect(asRationalThoughtsArray(input)).toEqual(input);
    });

    it('should handle alternate keys (text, content)', () => {
      const input = [{ text: 'RT1', confidence: 7 }];
      expect(asRationalThoughtsArray(input)).toEqual([{ thought: 'RT1', confidence: 7 }]);
    });

    it('should map simple strings', () => {
      const input = ['RT1'];
      expect(asRationalThoughtsArray(input)).toEqual([{ thought: 'RT1', confidence: 5 }]);
    });

    it('should filter empty thoughts from objects', () => {
      const input = [{ unrelated: 'data', confidence: 1 }];
      expect(asRationalThoughtsArray(input)).toEqual([]);
    });
  });

  describe('asActionPlanData', () => {
    it('should return default values for undefined input', () => {
      const result = asActionPlanData(undefined);
      expect(result).toEqual({
        finalEmotions: expect.any(Object), // Checking structure implicitly
        originalThoughtCredibility: 5,
        newBehaviors: '',
      });
      expect(result.finalEmotions.fear).toBe(0);
    });

    it('should map valid input including nested emotions', () => {
      const input = {
        finalEmotions: { fear: 2, joy: 8 },
        originalThoughtCredibility: 2,
        newBehaviors: 'Practice mindfulness',
      };
      const result = asActionPlanData(input);
      expect(result.finalEmotions.fear).toBe(2);
      expect(result.finalEmotions.joy).toBe(8);
      expect(result.originalThoughtCredibility).toBe(2);
      expect(result.newBehaviors).toBe('Practice mindfulness');
    });

    it('should handle missing nested emotions', () => {
      const input = {
        originalThoughtCredibility: 2,
        newBehaviors: 'Do things',
      };
      const result = asActionPlanData(input);
      expect(result.finalEmotions.fear).toBe(0);
    });
  });
});
