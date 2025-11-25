/**
 * Session Validation Schemas
 *
 * These schemas are shared between client and server for consistent validation.
 * They must be kept in sync with Convex validators in `convex/validators.ts`.
 *
 * @module validation/schemas/session
 */

import { z } from 'zod';

// ============================================================================
// SESSION STATUS ENUM
// ============================================================================

export const sessionStatuses = ['active', 'completed'] as const;
export type SessionStatus = (typeof sessionStatuses)[number];

export const sessionStatusSchema = z.enum(sessionStatuses);

// ============================================================================
// SESSION TITLE SCHEMA
// ============================================================================

/**
 * Session title validation schema
 *
 * Validates session titles with:
 * - Minimum length of 1 character (non-empty)
 * - Maximum length of 200 characters
 * - Automatic trimming of whitespace
 */
export const sessionTitleSchema = z
  .string()
  .min(1, 'Session title cannot be empty')
  .max(200, 'Session title too long (max 200 characters)')
  .transform((title) => title.trim());

export type SessionTitle = z.infer<typeof sessionTitleSchema>;

// ============================================================================
// CREATE SESSION SCHEMA
// ============================================================================

/**
 * Schema for creating a new session
 */
export const createSessionSchema = z.object({
  title: sessionTitleSchema,
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// ============================================================================
// UPDATE SESSION SCHEMA
// ============================================================================

/**
 * Schema for updating a session
 *
 * At least one field must be provided.
 */
export const updateSessionSchema = z
  .object({
    title: sessionTitleSchema.optional(),
    status: sessionStatusSchema.optional(),
    endedAt: z.number().int().positive().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

// ============================================================================
// SESSION ID SCHEMA
// ============================================================================

/**
 * Schema for session ID parameter validation
 */
export const sessionIdSchema = z.object({
  id: z.string().min(1, 'Session ID cannot be empty'),
});

export type SessionIdInput = z.infer<typeof sessionIdSchema>;

// ============================================================================
// FULL SESSION SCHEMA
// ============================================================================

/**
 * Full session schema for stored sessions
 *
 * Represents a complete session as stored in the database.
 */
export const sessionSchema = z.object({
  userId: z.string().min(1, 'User ID cannot be empty'),
  title: sessionTitleSchema,
  messageCount: z.number().int().nonnegative(),
  startedAt: z.number().int().positive(),
  endedAt: z.number().int().positive().nullable(),
  status: sessionStatusSchema,
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export type SessionInput = z.infer<typeof sessionSchema>;
