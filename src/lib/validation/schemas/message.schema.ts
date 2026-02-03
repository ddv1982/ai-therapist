/**
 * Message Validation Schemas
 *
 * These schemas are shared between client and server for consistent validation.
 * They must be kept in sync with Convex validators in `convex/validators.ts`.
 *
 * @module validation/schemas/message
 */

import { z } from 'zod';

// ============================================================================
// THERAPEUTIC FRAMEWORK ENUM
// ============================================================================

export const therapeuticFrameworks = ['CBT', 'Schema', 'ERP', 'General'] as const;

export const therapeuticFrameworkSchema = z.enum(therapeuticFrameworks);

// ============================================================================
// EMOTIONAL TONE ENUM
// ============================================================================

export const emotionalTones = ['positive', 'negative', 'neutral', 'mixed'] as const;

export const emotionalToneSchema = z.enum(emotionalTones);

// ============================================================================
// MESSAGE ROLE ENUM
// ============================================================================

export const messageRoles = ['user', 'assistant'] as const;

export const messageRoleSchema = z.enum(messageRoles);

// ============================================================================
// MESSAGE CONTENT SCHEMA
// ============================================================================

/**
 * Message content validation schema
 *
 * Validates message content with:
 * - Minimum length of 1 character (non-empty)
 * - Maximum length of 10,000 characters
 * - Automatic trimming of whitespace
 */
export const messageContentSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(10000, 'Message too long (max 10,000 characters)')
  .transform((content) => content.trim());

// ============================================================================
// MESSAGE METADATA SCHEMA
// ============================================================================

/**
 * Message metadata validation schema
 *
 * Validates optional metadata attached to messages:
 * - therapeuticFramework: The therapeutic approach used (CBT, Schema, ERP, General)
 * - emotionalTone: Detected emotional tone of the message
 * - crisisIndicators: Whether crisis indicators were detected
 * - toolsUsed: Array of therapeutic tools referenced in the message
 */
export const messageMetadataSchema = z
  .object({
    therapeuticFramework: therapeuticFrameworkSchema.optional(),
    emotionalTone: emotionalToneSchema.optional(),
    crisisIndicators: z.boolean().optional(),
    toolsUsed: z.array(z.string().max(100)).max(20).optional(),
  })
  .strict()
  .optional();

// ============================================================================
// SEND MESSAGE SCHEMA
// ============================================================================

/**
 * Schema for sending a new message
 *
 * Used for validating client requests to send messages.
 */
export const sendMessageSchema = z.object({
  content: messageContentSchema,
  sessionId: z.string().min(1, 'Session ID cannot be empty'),
  metadata: messageMetadataSchema,
});

// ============================================================================
// FULL MESSAGE SCHEMA
// ============================================================================

/**
 * Full message schema for stored messages
 *
 * Represents a complete message as stored in the database.
 */
export const messageSchema = z.object({
  role: messageRoleSchema,
  content: messageContentSchema,
  sessionId: z.string().min(1, 'Session ID cannot be empty'),
  modelUsed: z.string().max(100).optional(),
  metadata: messageMetadataSchema,
  timestamp: z.number().int().positive(),
  createdAt: z.number().int().positive(),
});

// ============================================================================
// MESSAGE QUERY SCHEMA
// ============================================================================

/**
 * Schema for querying messages
 *
 * Used for paginated message retrieval.
 */
export const messagesQuerySchema = z.object({
  sessionId: z.string().min(1, 'Session ID cannot be empty'),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});
