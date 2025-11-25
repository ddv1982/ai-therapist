# Shared Validation Schemas

This directory contains Zod validation schemas that are shared between client and server code. These schemas ensure consistent validation across the application and must be kept in sync with Convex validators.

## Overview

The schemas are organized by domain:

- **`message.schema.ts`** - Message content, metadata, and related schemas
- **`session.schema.ts`** - Session creation, update, and retrieval schemas
- **`report.schema.ts`** - Therapeutic report generation and storage schemas

## Usage

Import schemas from the barrel export:

```typescript
import {
  messageContentSchema,
  sendMessageSchema,
  createSessionSchema,
  type MessageMetadata,
} from '@/lib/validation/schemas';

// Validate input
const result = messageContentSchema.safeParse(userInput);
if (!result.success) {
  // Handle validation errors
  console.error(result.error.issues);
}

// Parse with automatic error throwing
const validated = sendMessageSchema.parse(requestBody);
```

## Adding New Schemas

When adding a new schema, follow these steps:

### 1. Create the Schema

Add your schema to the appropriate domain file or create a new file:

```typescript
// src/lib/validation/schemas/my-domain.schema.ts
import { z } from 'zod';

export const myDataSchema = z.object({
  field1: z.string().min(1).max(100),
  field2: z.number().int().positive(),
});

export type MyDataInput = z.infer<typeof myDataSchema>;
```

### 2. Export from Index

Add exports to `index.ts`:

```typescript
export { myDataSchema, type MyDataInput } from './my-domain.schema';
```

### 3. Create Convex Validator (if needed)

If the data will be stored in Convex, add a matching validator to `convex/validators.ts`:

```typescript
// convex/validators.ts
import { v } from 'convex/values';

export const myDataValidator = v.object({
  field1: v.string(), // Convex doesn't support min/max in schema
  field2: v.number(),
});
```

### 4. Add Type Tests (recommended)

Add type tests to ensure schemas stay aligned:

```typescript
// __tests__/lib/validation/schema-parity.test.ts
import { myDataSchema } from '@/lib/validation/schemas';

describe('MyData schema parity', () => {
  it('validates expected structure', () => {
    const valid = { field1: 'test', field2: 42 };
    expect(myDataSchema.safeParse(valid).success).toBe(true);
  });
});
```

## Schema Design Guidelines

### 1. Validation Constraints

- Use meaningful min/max lengths for strings
- Add descriptive error messages
- Use `.transform()` for normalization (e.g., trimming)

```typescript
export const titleSchema = z
  .string()
  .min(1, 'Title cannot be empty')
  .max(200, 'Title too long (max 200 characters)')
  .transform((s) => s.trim());
```

### 2. Enums

Define enums as `const` arrays for type inference:

```typescript
export const statusValues = ['active', 'completed'] as const;
export type Status = (typeof statusValues)[number];
export const statusSchema = z.enum(statusValues);
```

### 3. Optional Fields

Use `.optional()` for fields that may not be present:

```typescript
export const metadataSchema = z
  .object({
    required: z.string(),
    optional: z.string().optional(),
  })
  .optional(); // entire object is optional
```

### 4. Strict Objects

Use `.strict()` to reject unknown fields:

```typescript
export const strictSchema = z
  .object({
    known: z.string(),
  })
  .strict(); // rejects { known: 'a', unknown: 'b' }
```

## Convex Validator Alignment

The schemas in this directory must be kept in sync with `convex/validators.ts`. Key differences:

| Zod Feature               | Convex Equivalent                         |
| ------------------------- | ----------------------------------------- |
| `z.string().min(1)`       | `v.string()` (no min/max)                 |
| `z.number().int()`        | `v.number()`                              |
| `z.enum(['a', 'b'])`      | `v.union(v.literal('a'), v.literal('b'))` |
| `z.array(z.string())`     | `v.array(v.string())`                     |
| `z.object({}).optional()` | `v.optional(v.object({}))`                |
| `.transform()`            | N/A (runtime only in Zod)                 |

### Parity Checklist

When modifying schemas:

- [ ] Update Zod schema in `src/lib/validation/schemas/`
- [ ] Update Convex validator in `convex/validators.ts`
- [ ] Run type tests: `npm run test -- --testPathPattern=schema-parity`
- [ ] Update this documentation if adding new patterns

## Security Considerations

These schemas provide input validation but are not a complete security solution:

1. **Always validate on server**: Client validation can be bypassed
2. **Sanitize output**: Use HTML escaping when rendering user content
3. **Use Convex validators**: They run in a trusted environment
4. **Rate limiting**: Applied separately in API middleware

See `docs/security/input-sanitization.md` for comprehensive security guidelines.
