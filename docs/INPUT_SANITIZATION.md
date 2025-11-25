# Input Sanitization & Validation Guide

This document outlines the input handling and sanitization requirements for the AI Therapist application.

## Overview

The application uses a defense-in-depth approach to input validation:

1. **Client-side validation** - Immediate feedback using Zod schemas
2. **API middleware validation** - Request validation before handler execution
3. **Convex function validation** - Database-level validation with Convex validators

## Validation Points

### 1. Client-Side Validation

Location: `src/lib/validation/schemas/`

Client-side validation provides immediate feedback to users:

```typescript
import { sendMessageSchema } from '@/lib/validation/schemas';

// Validate before sending
const result = sendMessageSchema.safeParse(userInput);
if (!result.success) {
  // Show validation errors to user
  displayErrors(result.error.issues);
}
```

### 2. API Middleware Validation

Location: `src/lib/api/middleware.ts`

The `withValidation` middleware automatically validates request bodies:

```typescript
import { withValidation } from '@/lib/api/middleware';
import { sendMessageSchema } from '@/lib/validation/schemas';

export const POST = withValidation(sendMessageSchema, async (req, ctx, data) => {
  // data is validated and typed
  const { content, sessionId, metadata } = data;
  // ...
});
```

### 3. Convex Function Validation

Location: `convex/validators.ts`

Convex validators provide database-level validation:

```typescript
import { sendMessageArgsValidator } from './validators';

export const sendMessage = mutation({
  args: sendMessageArgsValidator,
  handler: async (ctx, args) => {
    // args are validated by Convex
  },
});
```

## Sanitization Rules

### Message Content

| Rule               | Implementation              | Rationale                                 |
| ------------------ | --------------------------- | ----------------------------------------- |
| Trim whitespace    | `.transform(s => s.trim())` | Remove accidental leading/trailing spaces |
| Min length: 1      | `.min(1)`                   | Prevent empty messages                    |
| Max length: 10,000 | `.max(10000)`               | Prevent DoS via large payloads            |

**No HTML sanitization required**: Messages are stored as plain text and rendered safely by React (auto-escaping).

### Session Titles

| Rule            | Implementation              | Rationale               |
| --------------- | --------------------------- | ----------------------- |
| Trim whitespace | `.transform(s => s.trim())` | Clean user input        |
| Min length: 1   | `.min(1)`                   | Prevent empty titles    |
| Max length: 200 | `.max(200)`                 | Reasonable title length |

### String Arrays (e.g., toolsUsed)

| Rule             | Implementation       | Rationale               |
| ---------------- | -------------------- | ----------------------- |
| Item max length  | `.string().max(100)` | Prevent oversized items |
| Array max length | `.max(20)`           | Limit array size        |

## XSS Prevention

### React Auto-Escaping

React automatically escapes content rendered in JSX:

```tsx
// Safe - React escapes messageContent
<div>{message.content}</div>

// UNSAFE - dangerouslySetInnerHTML bypasses escaping
<div dangerouslySetInnerHTML={{ __html: message.content }} /> // NEVER DO THIS
```

### Guidelines

1. **Never use `dangerouslySetInnerHTML`** with user content
2. **Use React's auto-escaping** for all user-generated content
3. **Sanitize before storage** only if HTML rendering is needed (not applicable here)

## SQL Injection

**Not Applicable** - The application uses Convex, which:

- Uses type-safe query builders, not raw SQL
- Parameterizes all queries automatically
- Provides schema-enforced type safety

## Validation Points Map

```
User Input
    │
    ▼
┌─────────────────────────┐
│ Client-Side Validation  │  ◄── Zod schemas
│ (src/lib/validation/)   │      Immediate feedback
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ API Middleware          │  ◄── withValidation()
│ (src/lib/api/middleware)│      Request validation
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Convex Validators       │  ◄── convex/validators.ts
│ (Database Layer)        │      Type-safe mutations
└───────────┬─────────────┘
            │
            ▼
      Database Storage
```

## Adding New Input Fields

When adding new input fields that accept user data:

1. **Add Zod schema** in `src/lib/validation/schemas/`
   - Include appropriate length limits
   - Add sanitization transforms (trim, etc.)
2. **Add Convex validator** in `convex/validators.ts`
   - Mirror the Zod schema structure
   - Use proper Convex value types

3. **Use middleware validation** for API routes
   - Apply `withValidation` to the route handler

4. **Document** special sanitization requirements here

## Security Checklist

For each new user input field:

- [ ] Length limits defined (min/max)
- [ ] Type validated (string, number, etc.)
- [ ] Special characters handled appropriately
- [ ] Zod schema created with transforms
- [ ] Convex validator mirrors Zod schema
- [ ] API middleware uses `withValidation`
- [ ] Rendered safely in UI (React auto-escaping)

## Related Documentation

- [Zod Schemas](../src/lib/validation/schemas/index.ts) - Shared validation schemas
- [Convex Validators](../convex/validators.ts) - Database-level validators
- [API Middleware](../src/lib/api/middleware.ts) - Request validation
