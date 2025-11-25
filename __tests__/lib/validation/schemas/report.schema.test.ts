/**
 * Tests for Report Validation Schemas
 *
 * Validates all report-related Zod schemas
 */

import {
  severityLevelSchema,
  severityLevels,
  relevanceLevelSchema,
  relevanceLevels,
  keyPointSchema,
  keyPointsSchema,
  therapeuticInsightSchema,
  patternIdentifiedSchema,
  actionItemSchema,
  cognitiveDistortionSchema,
  schemaAnalysisSchema,
  therapeuticFrameworkApplicationSchema,
  recommendationSchema,
  reportMessageSchema,
  reportGenerationSchema,
  sessionReportSchema,
} from '@/lib/validation/schemas/report.schema';

describe('Report Validation Schemas', () => {
  describe('severityLevelSchema', () => {
    it('accepts low', () => {
      expect(severityLevelSchema.safeParse('low').success).toBe(true);
    });

    it('accepts moderate', () => {
      expect(severityLevelSchema.safeParse('moderate').success).toBe(true);
    });

    it('accepts high', () => {
      expect(severityLevelSchema.safeParse('high').success).toBe(true);
    });

    it('rejects invalid values', () => {
      expect(severityLevelSchema.safeParse('medium').success).toBe(false);
      expect(severityLevelSchema.safeParse('critical').success).toBe(false);
      expect(severityLevelSchema.safeParse('').success).toBe(false);
    });

    it('has correct levels array', () => {
      expect(severityLevels).toEqual(['low', 'moderate', 'high']);
    });
  });

  describe('relevanceLevelSchema', () => {
    it('accepts low', () => {
      expect(relevanceLevelSchema.safeParse('low').success).toBe(true);
    });

    it('accepts medium', () => {
      expect(relevanceLevelSchema.safeParse('medium').success).toBe(true);
    });

    it('accepts high', () => {
      expect(relevanceLevelSchema.safeParse('high').success).toBe(true);
    });

    it('rejects invalid values', () => {
      expect(relevanceLevelSchema.safeParse('moderate').success).toBe(false);
    });

    it('has correct levels array', () => {
      expect(relevanceLevels).toEqual(['low', 'medium', 'high']);
    });
  });

  describe('keyPointSchema', () => {
    it('accepts valid key point', () => {
      const result = keyPointSchema.safeParse({
        topic: 'Anxiety Management',
        summary: 'Discussed techniques for managing anxiety',
        relevance: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing topic', () => {
      const result = keyPointSchema.safeParse({
        summary: 'Summary',
        relevance: 'high',
      });
      expect(result.success).toBe(false);
    });

    it('rejects topic exceeding max length', () => {
      const result = keyPointSchema.safeParse({
        topic: 'a'.repeat(201),
        summary: 'Summary',
        relevance: 'high',
      });
      expect(result.success).toBe(false);
    });

    it('rejects summary exceeding max length', () => {
      const result = keyPointSchema.safeParse({
        topic: 'Topic',
        summary: 'a'.repeat(2001),
        relevance: 'high',
      });
      expect(result.success).toBe(false);
    });

    it('validates relevance enum', () => {
      const result = keyPointSchema.safeParse({
        topic: 'Topic',
        summary: 'Summary',
        relevance: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('keyPointsSchema', () => {
    it('accepts array of valid key points', () => {
      const result = keyPointsSchema.safeParse([
        { topic: 'Topic 1', summary: 'Summary 1', relevance: 'high' },
        { topic: 'Topic 2', summary: 'Summary 2', relevance: 'low' },
      ]);
      expect(result.success).toBe(true);
    });

    it('accepts empty array', () => {
      const result = keyPointsSchema.safeParse([]);
      expect(result.success).toBe(true);
    });

    it('rejects array exceeding max length', () => {
      const keyPoints = Array(51)
        .fill(null)
        .map((_, i) => ({
          topic: `Topic ${i}`,
          summary: `Summary ${i}`,
          relevance: 'medium' as const,
        }));
      const result = keyPointsSchema.safeParse(keyPoints);
      expect(result.success).toBe(false);
    });
  });

  describe('therapeuticInsightSchema', () => {
    it('accepts valid insight', () => {
      const result = therapeuticInsightSchema.safeParse({
        framework: 'CBT',
        insight: 'Cognitive restructuring shows promise',
        confidence: 85,
      });
      expect(result.success).toBe(true);
    });

    it('validates confidence range 0-100', () => {
      expect(
        therapeuticInsightSchema.safeParse({
          framework: 'CBT',
          insight: 'Test',
          confidence: 0,
        }).success
      ).toBe(true);

      expect(
        therapeuticInsightSchema.safeParse({
          framework: 'CBT',
          insight: 'Test',
          confidence: 100,
        }).success
      ).toBe(true);

      expect(
        therapeuticInsightSchema.safeParse({
          framework: 'CBT',
          insight: 'Test',
          confidence: -1,
        }).success
      ).toBe(false);

      expect(
        therapeuticInsightSchema.safeParse({
          framework: 'CBT',
          insight: 'Test',
          confidence: 101,
        }).success
      ).toBe(false);
    });
  });

  describe('patternIdentifiedSchema', () => {
    it('accepts valid pattern', () => {
      const result = patternIdentifiedSchema.safeParse({
        name: 'Avoidance Behavior',
        description: 'Client tends to avoid difficult situations',
        frequency: 7,
        severity: 'moderate',
      });
      expect(result.success).toBe(true);
    });

    it('validates frequency range 0-10', () => {
      expect(
        patternIdentifiedSchema.safeParse({
          name: 'Test',
          description: 'Test',
          frequency: 0,
          severity: 'low',
        }).success
      ).toBe(true);

      expect(
        patternIdentifiedSchema.safeParse({
          name: 'Test',
          description: 'Test',
          frequency: 10,
          severity: 'low',
        }).success
      ).toBe(true);

      expect(
        patternIdentifiedSchema.safeParse({
          name: 'Test',
          description: 'Test',
          frequency: 11,
          severity: 'low',
        }).success
      ).toBe(false);
    });

    it('validates severity enum', () => {
      const result = patternIdentifiedSchema.safeParse({
        name: 'Test',
        description: 'Test',
        frequency: 5,
        severity: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('actionItemSchema', () => {
    it('accepts valid action item', () => {
      const result = actionItemSchema.safeParse({
        action: 'Practice deep breathing exercises daily',
        priority: 'high',
        timeframe: '1 week',
      });
      expect(result.success).toBe(true);
    });

    it('validates priority enum', () => {
      expect(
        actionItemSchema.safeParse({
          action: 'Test',
          priority: 'low',
        }).success
      ).toBe(true);

      expect(
        actionItemSchema.safeParse({
          action: 'Test',
          priority: 'invalid',
        }).success
      ).toBe(false);
    });

    it('handles optional timeframe', () => {
      const result = actionItemSchema.safeParse({
        action: 'Test action',
        priority: 'medium',
      });
      expect(result.success).toBe(true);
    });

    it('validates timeframe max length', () => {
      const result = actionItemSchema.safeParse({
        action: 'Test',
        priority: 'low',
        timeframe: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('cognitiveDistortionSchema', () => {
    it('accepts valid distortion', () => {
      const result = cognitiveDistortionSchema.safeParse({
        id: 'cd-1',
        name: 'All-or-nothing thinking',
        description: 'Seeing things in black and white',
        examples: ['If I fail this test, I am a total failure'],
        severity: 'moderate',
        frequency: 6,
        therapeuticPriority: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('handles optional examples', () => {
      const result = cognitiveDistortionSchema.safeParse({
        id: 'cd-1',
        name: 'Catastrophizing',
        severity: 'high',
        frequency: 8,
        therapeuticPriority: 'high',
      });
      expect(result.success).toBe(true);
    });

    it('handles optional description', () => {
      const result = cognitiveDistortionSchema.safeParse({
        id: 'cd-1',
        name: 'Test',
        severity: 'low',
        frequency: 1,
        therapeuticPriority: 'low',
      });
      expect(result.success).toBe(true);
    });

    it('validates therapeuticPriority as relevance level', () => {
      expect(
        cognitiveDistortionSchema.safeParse({
          id: 'cd-1',
          name: 'Test',
          severity: 'low',
          frequency: 1,
          therapeuticPriority: 'invalid',
        }).success
      ).toBe(false);
    });

    it('limits examples array to 10 items', () => {
      const result = cognitiveDistortionSchema.safeParse({
        id: 'cd-1',
        name: 'Test',
        examples: Array(11).fill('example'),
        severity: 'low',
        frequency: 1,
        therapeuticPriority: 'low',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('schemaAnalysisSchema', () => {
    it('accepts valid analysis', () => {
      const result = schemaAnalysisSchema.safeParse({
        activeModes: ['Vulnerable Child', 'Healthy Adult'],
        triggeredSchemas: ['abandonment', 'defectiveness'],
        predominantMode: 'Vulnerable Child',
        behavioralPatterns: ['withdrawal', 'people-pleasing'],
        copingStrategies: {
          adaptive: ['journaling', 'exercise'],
          maladaptive: ['avoidance', 'rumination'],
        },
        therapeuticRecommendations: ['Schema therapy', 'Inner child work'],
      });
      expect(result.success).toBe(true);
    });

    it('handles all optional fields', () => {
      const result = schemaAnalysisSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts undefined', () => {
      const result = schemaAnalysisSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('handles null predominantMode', () => {
      const result = schemaAnalysisSchema.safeParse({
        predominantMode: null,
      });
      expect(result.success).toBe(true);
    });

    it('validates copingStrategies structure', () => {
      const result = schemaAnalysisSchema.safeParse({
        copingStrategies: {
          adaptive: ['valid strategy'],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('therapeuticFrameworkApplicationSchema', () => {
    it('accepts valid framework application', () => {
      const result = therapeuticFrameworkApplicationSchema.safeParse({
        name: 'Cognitive Behavioral Therapy',
        applicability: 'high',
        specificTechniques: ['thought records', 'behavioral experiments'],
        rationale: 'Client shows cognitive distortions that respond well to CBT',
        priority: 1,
      });
      expect(result.success).toBe(true);
    });

    it('validates priority range 1-5', () => {
      expect(
        therapeuticFrameworkApplicationSchema.safeParse({
          name: 'Test',
          applicability: 'low',
          specificTechniques: ['technique'],
          rationale: 'Test',
          priority: 0,
        }).success
      ).toBe(false);

      expect(
        therapeuticFrameworkApplicationSchema.safeParse({
          name: 'Test',
          applicability: 'low',
          specificTechniques: ['technique'],
          rationale: 'Test',
          priority: 6,
        }).success
      ).toBe(false);

      expect(
        therapeuticFrameworkApplicationSchema.safeParse({
          name: 'Test',
          applicability: 'low',
          specificTechniques: ['technique'],
          rationale: 'Test',
          priority: 3,
        }).success
      ).toBe(true);
    });
  });

  describe('recommendationSchema', () => {
    it('accepts valid recommendation', () => {
      const result = recommendationSchema.safeParse({
        framework: 'CBT',
        technique: 'Thought Record',
        rationale: 'Helps identify and challenge negative automatic thoughts',
        urgency: 'short-term',
        expectedOutcome: 'Improved cognitive flexibility',
      });
      expect(result.success).toBe(true);
    });

    it('validates urgency enum', () => {
      expect(
        recommendationSchema.safeParse({
          framework: 'Test',
          technique: 'Test',
          rationale: 'Test',
          urgency: 'immediate',
        }).success
      ).toBe(true);

      expect(
        recommendationSchema.safeParse({
          framework: 'Test',
          technique: 'Test',
          rationale: 'Test',
          urgency: 'long-term',
        }).success
      ).toBe(true);

      expect(
        recommendationSchema.safeParse({
          framework: 'Test',
          technique: 'Test',
          rationale: 'Test',
          urgency: 'invalid',
        }).success
      ).toBe(false);
    });

    it('handles optional expectedOutcome', () => {
      const result = recommendationSchema.safeParse({
        framework: 'Test',
        technique: 'Test',
        rationale: 'Test',
        urgency: 'immediate',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('reportMessageSchema', () => {
    it('accepts valid message', () => {
      const result = reportMessageSchema.safeParse({
        role: 'user',
        content: 'Hello, I need help with anxiety',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty content', () => {
      const result = reportMessageSchema.safeParse({
        role: 'user',
        content: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects content exceeding max length', () => {
      const result = reportMessageSchema.safeParse({
        role: 'user',
        content: 'a'.repeat(50001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('reportGenerationSchema', () => {
    it('accepts valid generation request', () => {
      const result = reportGenerationSchema.safeParse({
        sessionId: 'session-123',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        model: 'gpt-4',
        reportStyle: 'clinical_notes',
      });
      expect(result.success).toBe(true);
    });

    it('requires at least one message', () => {
      const result = reportGenerationSchema.safeParse({
        sessionId: 'session-123',
        messages: [],
      });
      expect(result.success).toBe(false);
    });

    it('limits messages to 1000', () => {
      const messages = Array(1001)
        .fill(null)
        .map(() => ({
          role: 'user' as const,
          content: 'Test',
        }));
      const result = reportGenerationSchema.safeParse({
        sessionId: 'session-123',
        messages,
      });
      expect(result.success).toBe(false);
    });

    it('validates reportStyle enum', () => {
      expect(
        reportGenerationSchema.safeParse({
          sessionId: 'test',
          messages: [{ role: 'user', content: 'test' }],
          reportStyle: 'client_friendly',
        }).success
      ).toBe(true);

      expect(
        reportGenerationSchema.safeParse({
          sessionId: 'test',
          messages: [{ role: 'user', content: 'test' }],
          reportStyle: 'invalid',
        }).success
      ).toBe(false);
    });

    it('handles optional fields', () => {
      const result = reportGenerationSchema.safeParse({
        sessionId: 'session-123',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sessionReportSchema', () => {
    const validReport = {
      sessionId: 'session-123',
      reportContent: 'This is the report content',
      keyPoints: [{ topic: 'Topic', summary: 'Summary', relevance: 'high' as const }],
      therapeuticInsights: [{ framework: 'CBT', insight: 'Insight', confidence: 80 }],
      patternsIdentified: [
        { name: 'Pattern', description: 'Desc', frequency: 5, severity: 'moderate' as const },
      ],
      actionItems: [{ action: 'Action', priority: 'high' as const }],
      createdAt: 1705312800000,
    };

    it('accepts complete valid report', () => {
      const result = sessionReportSchema.safeParse(validReport);
      expect(result.success).toBe(true);
    });

    it('validates nested schemas', () => {
      const invalidReport = {
        ...validReport,
        keyPoints: [{ topic: '', summary: 'Summary', relevance: 'high' }],
      };
      const result = sessionReportSchema.safeParse(invalidReport);
      expect(result.success).toBe(false);
    });

    it('handles optional fields', () => {
      const reportWithOptionals = {
        ...validReport,
        moodAssessment: 'Generally positive',
        progressNotes: 'Making good progress',
        cognitiveDistortions: [
          {
            id: 'cd-1',
            name: 'All-or-nothing',
            severity: 'low' as const,
            frequency: 3,
            therapeuticPriority: 'medium' as const,
          },
        ],
        schemaAnalysis: { activeModes: ['Healthy Adult'] },
        therapeuticFrameworks: [
          {
            name: 'CBT',
            applicability: 'high' as const,
            specificTechniques: ['thought records'],
            rationale: 'Test',
            priority: 1,
          },
        ],
        recommendations: [
          { framework: 'CBT', technique: 'Test', rationale: 'Test', urgency: 'immediate' as const },
        ],
        analysisConfidence: 85,
        analysisVersion: '1.0.0',
      };
      const result = sessionReportSchema.safeParse(reportWithOptionals);
      expect(result.success).toBe(true);
    });

    it('validates createdAt as positive integer', () => {
      const result = sessionReportSchema.safeParse({
        ...validReport,
        createdAt: -1,
      });
      expect(result.success).toBe(false);
    });

    it('validates analysisConfidence range', () => {
      expect(
        sessionReportSchema.safeParse({
          ...validReport,
          analysisConfidence: 101,
        }).success
      ).toBe(false);

      expect(
        sessionReportSchema.safeParse({
          ...validReport,
          analysisConfidence: -1,
        }).success
      ).toBe(false);
    });
  });
});
