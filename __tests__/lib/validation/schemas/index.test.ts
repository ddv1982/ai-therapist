/**
 * Tests for Validation Schemas Index
 *
 * Validates that all schema exports are correctly re-exported from the barrel
 */

import * as schemas from '@/lib/validation/schemas';

describe('Validation Schemas Index', () => {
  describe('Message schema exports', () => {
    it('exports therapeuticFrameworks', () => {
      expect(schemas.therapeuticFrameworks).toBeDefined();
      expect(Array.isArray(schemas.therapeuticFrameworks)).toBe(true);
    });

    it('exports emotionalTones', () => {
      expect(schemas.emotionalTones).toBeDefined();
      expect(Array.isArray(schemas.emotionalTones)).toBe(true);
    });

    it('exports messageRoles', () => {
      expect(schemas.messageRoles).toBeDefined();
      expect(Array.isArray(schemas.messageRoles)).toBe(true);
    });

    it('exports therapeuticFrameworkSchema', () => {
      expect(schemas.therapeuticFrameworkSchema).toBeDefined();
    });

    it('exports emotionalToneSchema', () => {
      expect(schemas.emotionalToneSchema).toBeDefined();
    });

    it('exports messageRoleSchema', () => {
      expect(schemas.messageRoleSchema).toBeDefined();
    });

    it('exports messageContentSchema', () => {
      expect(schemas.messageContentSchema).toBeDefined();
    });

    it('exports messageMetadataSchema', () => {
      expect(schemas.messageMetadataSchema).toBeDefined();
    });

    it('exports sendMessageSchema', () => {
      expect(schemas.sendMessageSchema).toBeDefined();
    });

    it('exports messageSchema', () => {
      expect(schemas.messageSchema).toBeDefined();
    });

    it('exports messagesQuerySchema', () => {
      expect(schemas.messagesQuerySchema).toBeDefined();
    });
  });

  describe('Session schema exports', () => {
    it('exports sessionStatuses', () => {
      expect(schemas.sessionStatuses).toBeDefined();
      expect(Array.isArray(schemas.sessionStatuses)).toBe(true);
    });

    it('exports sessionStatusSchema', () => {
      expect(schemas.sessionStatusSchema).toBeDefined();
    });

    it('exports sessionTitleSchema', () => {
      expect(schemas.sessionTitleSchema).toBeDefined();
    });

    it('exports createSessionSchema', () => {
      expect(schemas.createSessionSchema).toBeDefined();
    });

    it('exports updateSessionSchema', () => {
      expect(schemas.updateSessionSchema).toBeDefined();
    });

    it('exports sessionIdSchema', () => {
      expect(schemas.sessionIdSchema).toBeDefined();
    });

    it('exports sessionSchema', () => {
      expect(schemas.sessionSchema).toBeDefined();
    });
  });

  describe('Report schema exports', () => {
    it('exports severityLevels', () => {
      expect(schemas.severityLevels).toBeDefined();
      expect(Array.isArray(schemas.severityLevels)).toBe(true);
    });

    it('exports relevanceLevels', () => {
      expect(schemas.relevanceLevels).toBeDefined();
      expect(Array.isArray(schemas.relevanceLevels)).toBe(true);
    });

    it('exports severityLevelSchema', () => {
      expect(schemas.severityLevelSchema).toBeDefined();
    });

    it('exports relevanceLevelSchema', () => {
      expect(schemas.relevanceLevelSchema).toBeDefined();
    });

    it('exports keyPointSchema', () => {
      expect(schemas.keyPointSchema).toBeDefined();
    });

    it('exports keyPointsSchema', () => {
      expect(schemas.keyPointsSchema).toBeDefined();
    });

    it('exports therapeuticInsightSchema', () => {
      expect(schemas.therapeuticInsightSchema).toBeDefined();
    });

    it('exports therapeuticInsightsSchema', () => {
      expect(schemas.therapeuticInsightsSchema).toBeDefined();
    });

    it('exports patternIdentifiedSchema', () => {
      expect(schemas.patternIdentifiedSchema).toBeDefined();
    });

    it('exports patternsIdentifiedSchema', () => {
      expect(schemas.patternsIdentifiedSchema).toBeDefined();
    });

    it('exports actionItemSchema', () => {
      expect(schemas.actionItemSchema).toBeDefined();
    });

    it('exports actionItemsSchema', () => {
      expect(schemas.actionItemsSchema).toBeDefined();
    });

    it('exports cognitiveDistortionSchema', () => {
      expect(schemas.cognitiveDistortionSchema).toBeDefined();
    });

    it('exports cognitiveDistortionsSchema', () => {
      expect(schemas.cognitiveDistortionsSchema).toBeDefined();
    });

    it('exports schemaAnalysisSchema', () => {
      expect(schemas.schemaAnalysisSchema).toBeDefined();
    });

    it('exports therapeuticFrameworkApplicationSchema', () => {
      expect(schemas.therapeuticFrameworkApplicationSchema).toBeDefined();
    });

    it('exports therapeuticFrameworksSchema', () => {
      expect(schemas.therapeuticFrameworksSchema).toBeDefined();
    });

    it('exports recommendationSchema', () => {
      expect(schemas.recommendationSchema).toBeDefined();
    });

    it('exports recommendationsSchema', () => {
      expect(schemas.recommendationsSchema).toBeDefined();
    });

    it('exports reportMessageSchema', () => {
      expect(schemas.reportMessageSchema).toBeDefined();
    });

    it('exports reportGenerationSchema', () => {
      expect(schemas.reportGenerationSchema).toBeDefined();
    });

    it('exports sessionReportSchema', () => {
      expect(schemas.sessionReportSchema).toBeDefined();
    });
  });

  describe('Schema functionality', () => {
    it('messageRoleSchema validates correctly', () => {
      expect(schemas.messageRoleSchema.safeParse('user').success).toBe(true);
      expect(schemas.messageRoleSchema.safeParse('assistant').success).toBe(true);
      expect(schemas.messageRoleSchema.safeParse('invalid').success).toBe(false);
    });

    it('sessionStatusSchema validates correctly', () => {
      expect(schemas.sessionStatusSchema.safeParse('active').success).toBe(true);
      expect(schemas.sessionStatusSchema.safeParse('completed').success).toBe(true);
      expect(schemas.sessionStatusSchema.safeParse('invalid').success).toBe(false);
    });

    it('severityLevelSchema validates correctly', () => {
      expect(schemas.severityLevelSchema.safeParse('low').success).toBe(true);
      expect(schemas.severityLevelSchema.safeParse('moderate').success).toBe(true);
      expect(schemas.severityLevelSchema.safeParse('high').success).toBe(true);
      expect(schemas.severityLevelSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('Export completeness', () => {
    const expectedExports = [
      // Message schemas
      'therapeuticFrameworks',
      'emotionalTones',
      'messageRoles',
      'therapeuticFrameworkSchema',
      'emotionalToneSchema',
      'messageRoleSchema',
      'messageContentSchema',
      'messageMetadataSchema',
      'sendMessageSchema',
      'messageSchema',
      'messagesQuerySchema',
      // Session schemas
      'sessionStatuses',
      'sessionStatusSchema',
      'sessionTitleSchema',
      'createSessionSchema',
      'updateSessionSchema',
      'sessionIdSchema',
      'sessionSchema',
      // Report schemas
      'severityLevels',
      'relevanceLevels',
      'severityLevelSchema',
      'relevanceLevelSchema',
      'keyPointSchema',
      'keyPointsSchema',
      'therapeuticInsightSchema',
      'therapeuticInsightsSchema',
      'patternIdentifiedSchema',
      'patternsIdentifiedSchema',
      'actionItemSchema',
      'actionItemsSchema',
      'cognitiveDistortionSchema',
      'cognitiveDistortionsSchema',
      'schemaAnalysisSchema',
      'therapeuticFrameworkApplicationSchema',
      'therapeuticFrameworksSchema',
      'recommendationSchema',
      'recommendationsSchema',
      'reportMessageSchema',
      'reportGenerationSchema',
      'sessionReportSchema',
    ];

    it.each(expectedExports)('exports %s', (exportName) => {
      expect((schemas as Record<string, unknown>)[exportName]).toBeDefined();
    });
  });
});
