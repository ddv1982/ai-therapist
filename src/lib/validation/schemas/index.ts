/**
 * Shared Validation Schemas
 *
 * This module exports all shared validation schemas used across client and server.
 * These schemas are designed to be consistent with Convex validators in `convex/validators.ts`.
 *
 * @module validation/schemas
 *
 * ## Adding New Schemas
 *
 * When adding a new validation schema:
 *
 * 1. **Create the Zod schema** in the appropriate file (message.schema.ts, session.schema.ts, etc.)
 *    or create a new schema file for a new domain.
 *
 * 2. **Export from index.ts** - Add both the schema and its inferred type to this barrel export.
 *
 * 3. **Mirror in Convex validators** - Update `convex/validators.ts` to create equivalent Convex
 *    validators using `v.object()`, `v.string()`, `v.union()`, etc.
 *
 * 4. **Add type tests** (optional but recommended) - Create type tests to verify Zod and Convex
 *    types are compatible.
 *
 * ## Schema Naming Conventions
 *
 * - Schema names end with `Schema` (e.g., `messageContentSchema`)
 * - Type names are PascalCase without suffix (e.g., `MessageContent`)
 * - Array schemas end with `sSchema` or describe the collection (e.g., `keyPointsSchema`)
 *
 * ## Validation Best Practices
 *
 * - Use `.transform()` for sanitization (e.g., trimming whitespace)
 * - Use `.strict()` for objects that should not accept extra properties
 * - Use descriptive error messages with `.min()`, `.max()`, etc.
 * - Keep max lengths reasonable for the data type (e.g., 10KB for messages)
 *
 * @example
 * ```typescript
 * import { messageContentSchema, sendMessageSchema } from '@/lib/validation/schemas';
 *
 * // Validate message content
 * const result = messageContentSchema.safeParse(userInput);
 * if (!result.success) {
 *   console.error(result.error.issues);
 * }
 *
 * // Validate full send message request
 * const validated = sendMessageSchema.parse(requestBody);
 * ```
 */

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

export {
  // Enums and types
  therapeuticFrameworks,
  emotionalTones,
  messageRoles,
  therapeuticFrameworkSchema,
  emotionalToneSchema,
  messageRoleSchema,
  // Schemas
  messageContentSchema,
  messageMetadataSchema,
  sendMessageSchema,
  messageSchema,
  messagesQuerySchema,
} from './message.schema';

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

export {
  // Enums and types
  sessionStatuses,
  sessionStatusSchema,
  // Schemas
  sessionTitleSchema,
  createSessionSchema,
  updateSessionSchema,
  sessionIdSchema,
  sessionSchema,
} from './session.schema';

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

export {
  // Enums and types
  severityLevels,
  relevanceLevels,
  severityLevelSchema,
  relevanceLevelSchema,
  // Schemas
  keyPointSchema,
  keyPointsSchema,
  therapeuticInsightSchema,
  therapeuticInsightsSchema,
  patternIdentifiedSchema,
  patternsIdentifiedSchema,
  actionItemSchema,
  actionItemsSchema,
  cognitiveDistortionSchema,
  cognitiveDistortionsSchema,
  schemaAnalysisSchema,
  therapeuticFrameworkApplicationSchema,
  therapeuticFrameworksSchema,
  recommendationSchema,
  recommendationsSchema,
  reportMessageSchema,
  reportGenerationSchema,
  sessionReportSchema,
} from './report.schema';
