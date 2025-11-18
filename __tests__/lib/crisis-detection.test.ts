/**
 * Tests for the Crisis Detection System
 * Ensures accurate detection of concerning content and appropriate resource provision
 */

import {
  detectCrisisContent,
  requiresImmediateIntervention,
  generateCrisisAlert,
  CrisisDetectionResult,
} from '@/lib/therapy/validators';

describe('Crisis Detection System', () => {
  describe('detectCrisisContent', () => {
    test('should detect no risk for normal content', () => {
      const result = detectCrisisContent('I had a difficult day at work but I feel better now');

      expect(result.isHighRisk).toBe(false);
      expect(result.riskLevel).toBe('low');
      expect(result.triggeredKeywords).toHaveLength(0);
      expect(result.detectedCategories).toHaveLength(0);
    });

    test('should detect high-risk suicide content', () => {
      const result = detectCrisisContent('I want to kill myself and end my life');

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
      expect(result.triggeredKeywords).toContain('kill myself');
      expect(result.triggeredKeywords).toContain('end my life');
      expect(result.detectedCategories).toHaveLength(1);
      expect(result.detectedCategories[0].category).toBe('suicide');
      expect(result.detectedCategories[0].severity).toBe('high');
    });

    test('should detect medium-risk suicide content', () => {
      const result = detectCrisisContent('I have been feeling suicidal lately');

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('high');
      expect(result.triggeredKeywords).toContain('suicidal');
      expect(result.detectedCategories[0].category).toBe('suicide');
      expect(result.detectedCategories[0].severity).toBe('medium');
    });

    test('should detect self-harm content', () => {
      const result = detectCrisisContent('I need to cut myself to feel better');

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
      expect(result.triggeredKeywords).toContain('cut myself');
      expect(result.detectedCategories[0].category).toBe('self_harm');
      expect(result.detectedCategories[0].severity).toBe('high');
    });

    test('should detect severe depression content', () => {
      const result = detectCrisisContent('I feel completely hopeless and nothing matters anymore');

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
      expect(result.triggeredKeywords).toContain('completely hopeless');
      expect(result.triggeredKeywords).toContain('nothing matters');
      expect(result.detectedCategories[0].category).toBe('severe_depression');
    });

    test('should detect substance abuse content', () => {
      const result = detectCrisisContent('I cannot stop drinking and I had an overdose last week');

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
      expect(result.triggeredKeywords).toContain('overdose');
      expect(result.detectedCategories).toHaveLength(1);
      expect(result.detectedCategories[0].category).toBe('substance_abuse');
    });

    test('should detect trauma content', () => {
      const result = detectCrisisContent('I keep having flashbacks and reliving the trauma');

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
      expect(result.triggeredKeywords).toContain('flashbacks');
      expect(result.detectedCategories[0].category).toBe('trauma');
      expect(result.detectedCategories[0].severity).toBe('high');
    });

    test('should detect psychosis content', () => {
      const result = detectCrisisContent('I keep hearing voices telling me what to do');

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
      expect(result.triggeredKeywords).toContain('hearing voices');
      expect(result.detectedCategories[0].category).toBe('psychosis');
    });

    test('should detect multiple categories', () => {
      const result = detectCrisisContent(
        'I want to kill myself and I keep cutting to cope with the flashbacks'
      );

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
      expect(result.detectedCategories).toHaveLength(3);

      const categories = result.detectedCategories.map((cat) => cat.category);
      expect(categories).toContain('suicide');
      expect(categories).toContain('self_harm');
      expect(categories).toContain('trauma');
    });

    test('should handle case insensitive detection', () => {
      const result = detectCrisisContent('I WANT TO KILL MYSELF');

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
      expect(result.triggeredKeywords).toContain('kill myself');
    });

    test('should provide emergency resources', () => {
      const result = detectCrisisContent('I want to end my life');

      expect(result.emergencyResources).toHaveLength(4);
      expect(result.emergencyResources[0].name).toBe('National Suicide Prevention Lifeline');
      expect(result.emergencyResources[0].phone).toBe('988');
      expect(result.emergencyResources[0].available24x7).toBe(true);
    });

    test('should provide appropriate recommended actions for crisis level', () => {
      const result = detectCrisisContent('I have a plan to kill myself tonight');

      expect(result.recommendedActions).toContain(
        'Seek immediate professional help or contact emergency services'
      );
      expect(result.recommendedActions).toContain(
        'Reach out to a trusted friend, family member, or mental health professional'
      );
      expect(result.recommendedActions).toContain(
        'Remove any means of self-harm from your immediate environment'
      );
    });

    test('should provide different actions for medium risk', () => {
      const result = detectCrisisContent('I feel very depressed and hopeless');

      expect(result.recommendedActions).toContain(
        'Schedule an appointment with a mental health professional'
      );
      expect(result.recommendedActions).toContain(
        'Practice self-care and stress management techniques'
      );
    });
  });

  describe('requiresImmediateIntervention', () => {
    test('should return true for crisis level suicide content', () => {
      const result: CrisisDetectionResult = {
        isHighRisk: true,
        riskLevel: 'crisis',
        triggeredKeywords: ['kill myself'],
        detectedCategories: [
          {
            category: 'suicide',
            severity: 'high',
            keywords: ['kill myself'],
          },
        ],
        recommendedActions: [],
        emergencyResources: [],
      };

      expect(requiresImmediateIntervention(result)).toBe(true);
    });

    test('should return true for high-risk suicide content', () => {
      const result: CrisisDetectionResult = {
        isHighRisk: true,
        riskLevel: 'high',
        triggeredKeywords: ['kill myself'],
        detectedCategories: [
          {
            category: 'suicide',
            severity: 'high',
            keywords: ['kill myself'],
          },
        ],
        recommendedActions: [],
        emergencyResources: [],
      };

      expect(requiresImmediateIntervention(result)).toBe(true);
    });

    test('should return false for medium risk non-suicide content', () => {
      const result: CrisisDetectionResult = {
        isHighRisk: true,
        riskLevel: 'medium',
        triggeredKeywords: ['very depressed'],
        detectedCategories: [
          {
            category: 'severe_depression',
            severity: 'medium',
            keywords: ['very depressed'],
          },
        ],
        recommendedActions: [],
        emergencyResources: [],
      };

      expect(requiresImmediateIntervention(result)).toBe(false);
    });

    test('should return false for low risk content', () => {
      const result: CrisisDetectionResult = {
        isHighRisk: false,
        riskLevel: 'low',
        triggeredKeywords: [],
        detectedCategories: [],
        recommendedActions: [],
        emergencyResources: [],
      };

      expect(requiresImmediateIntervention(result)).toBe(false);
    });
  });

  describe('generateCrisisAlert', () => {
    test('should generate crisis alert for high-risk content', () => {
      const result: CrisisDetectionResult = {
        isHighRisk: true,
        riskLevel: 'crisis',
        triggeredKeywords: ['kill myself'],
        detectedCategories: [
          {
            category: 'suicide',
            severity: 'high',
            keywords: ['kill myself'],
          },
        ],
        recommendedActions: [],
        emergencyResources: [],
      };

      const alert = generateCrisisAlert(result);
      expect(alert).toContain('🚨 CRISIS ALERT');
      expect(alert).toContain('suicide');
    });

    test('should generate high risk alert', () => {
      const result: CrisisDetectionResult = {
        isHighRisk: true,
        riskLevel: 'high',
        triggeredKeywords: ['suicidal'],
        detectedCategories: [
          {
            category: 'suicide',
            severity: 'medium',
            keywords: ['suicidal'],
          },
        ],
        recommendedActions: [],
        emergencyResources: [],
      };

      const alert = generateCrisisAlert(result);
      expect(alert).toContain('⚠️ HIGH RISK DETECTED');
      expect(alert).toContain('suicide');
    });

    test('should generate medium risk alert', () => {
      const result: CrisisDetectionResult = {
        isHighRisk: true,
        riskLevel: 'medium',
        triggeredKeywords: ['depressed'],
        detectedCategories: [
          {
            category: 'severe_depression',
            severity: 'low',
            keywords: ['depressed'],
          },
        ],
        recommendedActions: [],
        emergencyResources: [],
      };

      const alert = generateCrisisAlert(result);
      expect(alert).toContain('⚡ MODERATE CONCERN');
      expect(alert).toContain('severe depression');
    });

    test('should return empty string for low risk content', () => {
      const result: CrisisDetectionResult = {
        isHighRisk: false,
        riskLevel: 'low',
        triggeredKeywords: [],
        detectedCategories: [],
        recommendedActions: [],
        emergencyResources: [],
      };

      const alert = generateCrisisAlert(result);
      expect(alert).toBe('');
    });

    test('should handle multiple categories in alert', () => {
      const result: CrisisDetectionResult = {
        isHighRisk: true,
        riskLevel: 'crisis',
        triggeredKeywords: ['kill myself', 'cut myself'],
        detectedCategories: [
          {
            category: 'suicide',
            severity: 'high',
            keywords: ['kill myself'],
          },
          {
            category: 'self_harm',
            severity: 'high',
            keywords: ['cut myself'],
          },
        ],
        recommendedActions: [],
        emergencyResources: [],
      };

      const alert = generateCrisisAlert(result);
      expect(alert).toContain('suicide, self harm');
    });
  });

  describe('Edge Cases and Robustness', () => {
    test('should handle empty string input', () => {
      const result = detectCrisisContent('');

      expect(result.isHighRisk).toBe(false);
      expect(result.riskLevel).toBe('low');
    });

    test('should handle very long text input', () => {
      const longText = 'I am feeling okay today. '.repeat(1000) + 'I want to kill myself';
      const result = detectCrisisContent(longText);

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
      expect(result.triggeredKeywords).toContain('kill myself');
    });

    test('should handle special characters and punctuation', () => {
      const result = detectCrisisContent('I want to kill myself!!! Why do I feel this way???');

      expect(result.isHighRisk).toBe(true);
      expect(result.triggeredKeywords).toContain('kill myself');
    });

    test('should not trigger on partial word matches', () => {
      const result = detectCrisisContent('I killed the mosquito in my room');

      expect(result.isHighRisk).toBe(false);
      expect(result.riskLevel).toBe('low');
    });

    test('should handle text with newlines and tabs', () => {
      const result = detectCrisisContent(
        'I feel really bad\n\nI want to\tkill myself\n\nI cannot cope'
      );

      expect(result.isHighRisk).toBe(true);
      expect(result.riskLevel).toBe('crisis');
    });
  });

  describe('Resource Validation', () => {
    test('should provide valid emergency resources', () => {
      const result = detectCrisisContent('I want to end my life');

      result.emergencyResources.forEach((resource) => {
        expect(resource.name).toBeTruthy();
        expect(resource.phone).toBeTruthy();
        expect(resource.description).toBeTruthy();
        expect(typeof resource.available24x7).toBe('boolean');
      });
    });

    test('should include 988 suicide prevention lifeline', () => {
      const result = detectCrisisContent('I have suicidal thoughts');

      const lifeline = result.emergencyResources.find((r) => r.phone === '988');
      expect(lifeline).toBeDefined();
      expect(lifeline?.name).toContain('Suicide Prevention');
      expect(lifeline?.available24x7).toBe(true);
    });

    test('should include crisis text line', () => {
      const result = detectCrisisContent('I need help with self harm');

      const textLine = result.emergencyResources.find((r) => r.phone.includes('741741'));
      expect(textLine).toBeDefined();
      expect(textLine?.name).toContain('Crisis Text Line');
    });

    test('should include emergency services', () => {
      const result = detectCrisisContent('I am in immediate danger');

      const emergency = result.emergencyResources.find((r) => r.phone === '911');
      expect(emergency).toBeDefined();
      expect(emergency?.name).toContain('Emergency Services');
    });
  });
});

export {};
