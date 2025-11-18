/**
 * Test suite for contextual validation system to prevent false positives
 * in cognitive distortion detection
 */

import {
  analyzeTherapeuticContext,
  validateTherapeuticContext,
  calculateContextualConfidence,
  getContextValidationExplanation,
} from '@/lib/therapy/validators';
import type { ValidationResult } from '@/lib/therapy/validators';

describe('Contextual Validation System', () => {
  describe('analyzeTherapeuticContext', () => {
    // Test cases for FALSE POSITIVES (should be flagged as neutral/organizational)
    describe('False Positive Detection', () => {
      test('should detect organizational context with "everything"', () => {
        const content =
          "I need to organize everything for tonight's event. Everyone will be there and we should make sure all the details are covered.";
        const result = analyzeTherapeuticContext(content);

        expect(result.contextType).toBe('organizational');
        expect(result.emotionalIntensity).toBeLessThan(4);
        expect(result.neutralContextFlags).toContain('organizational');
        expect(result.therapeuticRelevance).toBeLessThan(5);
      });

      test('should detect routine context with "always"', () => {
        const content =
          "I always take the 8am train to work. It's my daily routine and everyone knows I'm punctual.";
        const result = analyzeTherapeuticContext(content);

        expect(result.contextType).toBe('neutral');
        expect(result.emotionalIntensity).toBeLessThan(4);
        expect(result.neutralContextFlags).toContain('routine_factual');
      });

      test('should detect factual observation context', () => {
        const content =
          'Everyone at the conference was networking. This approach never works for technical presentations.';
        const result = analyzeTherapeuticContext(content);

        expect(result.contextType).toBe('neutral');
        expect(result.emotionalIntensity).toBeLessThan(4);
        expect(result.neutralContextFlags).toContain('routine_factual');
      });

      test('should detect professional planning context', () => {
        const content =
          'We should coordinate all the project details. Everyone on the team needs to review the requirements.';
        const result = analyzeTherapeuticContext(content);

        expect(result.contextType).toBe('organizational');
        expect(result.neutralContextFlags).toContain('organizational');
        expect(result.therapeuticRelevance).toBeLessThan(5);
      });
    });

    // Test cases for TRUE POSITIVES (genuine therapeutic content)
    describe('Therapeutic Context Detection', () => {
      test('should detect therapeutic distress with "everything"', () => {
        const content =
          "I'm so worried that everything will fall apart. I feel like I'm ruining everything and everyone thinks I'm incompetent.";
        const result = analyzeTherapeuticContext(content);

        expect(result.contextType).toBe('therapeutic');
        expect(result.emotionalIntensity).toBeGreaterThanOrEqual(6);
        expect(result.therapeuticRelevance).toBeGreaterThanOrEqual(6);
        expect(result.stressIndicators.length).toBeGreaterThan(0);
      });

      test('should detect emotional distress with "always"', () => {
        const content =
          "I always mess up relationships. I'm scared that I'll never find someone who truly cares about me.";
        const result = analyzeTherapeuticContext(content);

        expect(result.contextType).toBe('therapeutic');
        expect(result.emotionalIntensity).toBeGreaterThanOrEqual(6);
        expect(result.stressIndicators.length).toBeGreaterThan(0);
      });

      test('should detect high emotional intensity with amplifiers', () => {
        const content =
          "I'm panicking because everyone will see how incompetent I am. This is devastating and I feel like I'm falling apart.";
        const result = analyzeTherapeuticContext(content);

        expect(result.contextType).toBe('therapeutic');
        expect(result.emotionalIntensity).toBeGreaterThanOrEqual(8);
        expect(result.therapeuticRelevance).toBeGreaterThanOrEqual(8);
      });
    });

    // Test cases for AMBIGUOUS contexts
    describe('Ambiguous Context Handling', () => {
      test('should correctly identify mixed context as therapeutic when emotional distress present', () => {
        const content =
          "I need to organize everything for the presentation, but I'm worried everyone will think it's terrible.";
        const result = analyzeTherapeuticContext(content);

        // Improved algorithm correctly identifies this as therapeutic due to clear emotional distress
        expect(result.contextType).toBe('therapeutic');
        expect(result.emotionalIntensity).toBeGreaterThan(0); // Emotional content detected
        expect(result.stressIndicators.length).toBeGreaterThan(0); // Anxiety indicators found
      });
    });
  });

  describe('validateTherapeuticContext', () => {
    test('should reject organizational context for distortion analysis', () => {
      const content =
        'I always organize everything for team events. Everyone participates and we coordinate all the logistics.';
      const result = validateTherapeuticContext(content);

      expect(result.isValidTherapeuticContext).toBe(false);
      expect(result.exclusionReason).toContain('organizational');
      expect(result.confidenceAdjustment).toBeLessThan(0.5);
    });

    test('should accept therapeutic context for analysis', () => {
      const content =
        "I'm terrified that everyone will judge me. I always feel like I'm not good enough and everything I do is wrong.";
      const result = validateTherapeuticContext(content);

      expect(result.isValidTherapeuticContext).toBe(true);
      expect(result.exclusionReason).toBeUndefined();
      expect(result.confidenceAdjustment).toBeGreaterThanOrEqual(1.0);
    });

    test('should handle mixed context with high confidence when clear therapeutic content', () => {
      const content =
        "I usually organize everything, but I'm starting to worry that people think I'm controlling.";
      const result = validateTherapeuticContext(content);

      // Should be accepted with high confidence due to clear emotional distress
      expect(result.isValidTherapeuticContext).toBe(true);
      expect(result.confidenceAdjustment).toBeGreaterThanOrEqual(0.8); // Algorithm is more confident now
    });
  });

  describe('calculateContextualConfidence', () => {
    test('should reduce confidence for neutral context', () => {
      const neutralValidation: ValidationResult = {
        isValidTherapeuticContext: false,
        confidenceAdjustment: 0.3,
        contextualAnalysis: {
          emotionalIntensity: 2,
          therapeuticRelevance: 2,
          neutralContextFlags: ['organizational'],
          stressIndicators: [],
          contextType: 'organizational',
          confidence: 85,
        },
      };

      const adjustedConfidence = calculateContextualConfidence(80, neutralValidation);
      expect(adjustedConfidence).toBeLessThan(30); // Should be significantly reduced
    });

    test('should boost confidence for strong therapeutic context', () => {
      const therapeuticValidation: ValidationResult = {
        isValidTherapeuticContext: true,
        confidenceAdjustment: 1.2,
        contextualAnalysis: {
          emotionalIntensity: 8,
          therapeuticRelevance: 9,
          neutralContextFlags: [],
          stressIndicators: ["I'm terrified", 'I feel worthless'],
          contextType: 'therapeutic',
          confidence: 90,
        },
      };

      const adjustedConfidence = calculateContextualConfidence(75, therapeuticValidation, true);
      expect(adjustedConfidence).toBeGreaterThan(85); // Should be boosted
    });

    test('should cap confidence at reasonable maximum', () => {
      const highValidation: ValidationResult = {
        isValidTherapeuticContext: true,
        confidenceAdjustment: 1.5,
        contextualAnalysis: {
          emotionalIntensity: 10,
          therapeuticRelevance: 10,
          neutralContextFlags: [],
          stressIndicators: ['panicking', 'falling apart', 'devastated'],
          contextType: 'therapeutic',
          confidence: 95,
        },
      };

      const adjustedConfidence = calculateContextualConfidence(90, highValidation, true);
      expect(adjustedConfidence).toBeLessThanOrEqual(95); // Should be capped
    });
  });

  describe('getContextValidationExplanation', () => {
    test('should explain exclusion for organizational context', () => {
      const result: ValidationResult = {
        isValidTherapeuticContext: false,
        exclusionReason:
          'Content appears in organizational/planning context without emotional distress',
        confidenceAdjustment: 0.3,
        contextualAnalysis: {
          emotionalIntensity: 2,
          therapeuticRelevance: 2,
          neutralContextFlags: ['organizational'],
          stressIndicators: [],
          contextType: 'organizational',
          confidence: 80,
        },
      };

      const explanation = getContextValidationExplanation(result);
      expect(explanation).toContain('organizational/planning context');
    });

    test('should explain therapeutic validation', () => {
      const result: ValidationResult = {
        isValidTherapeuticContext: true,
        confidenceAdjustment: 1.1,
        contextualAnalysis: {
          emotionalIntensity: 7,
          therapeuticRelevance: 8,
          neutralContextFlags: [],
          stressIndicators: ['worried', 'scared'],
          contextType: 'therapeutic',
          confidence: 85,
        },
      };

      const explanation = getContextValidationExplanation(result);
      expect(explanation).toContain('therapeutic context');
      expect(explanation).toContain('emotional distress indicator');
    });
  });

  describe('Real-world Scenarios', () => {
    test('Party planning should not trigger distortion analysis', () => {
      const content = `
        I'm organizing everything for Sarah's birthday party this weekend. 
        Everyone is invited and I need to coordinate all the details. 
        I always plan these events and everyone expects me to handle everything.
        We should make sure all the food and decorations are ready.
      `;

      const validation = validateTherapeuticContext(content);
      expect(validation.isValidTherapeuticContext).toBe(false);
      expect(validation.exclusionReason).toContain('organizational');
    });

    test('Work anxiety should trigger distortion analysis', () => {
      const content = `
        I'm terrified about the presentation tomorrow. I always mess these up 
        and everyone will see how incompetent I am. I feel like everything 
        I've prepared is worthless and my boss will think I'm a complete failure.
      `;

      const validation = validateTherapeuticContext(content);
      expect(validation.isValidTherapeuticContext).toBe(true);
      expect(validation.contextualAnalysis.emotionalIntensity).toBeGreaterThan(6);
    });

    test('Mixed context with emotional component should be handled carefully', () => {
      const content = `
        I always organize the team meetings, but lately I'm worried that 
        everyone thinks I'm too controlling. Maybe I should let others 
        take charge, but I'm scared everything will fall apart.
      `;

      const validation = validateTherapeuticContext(content);
      expect(validation.isValidTherapeuticContext).toBe(true);
      expect(validation.confidenceAdjustment).toBeGreaterThan(0.8); // Strong therapeutic content gets confident scoring
    });
  });
});

// Helper function for range assertions
expect.extend({
  toBeBetween(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be between ${floor} and ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be between ${floor} and ${ceiling}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeBetween(floor: number, ceiling: number): R;
    }
  }
}
