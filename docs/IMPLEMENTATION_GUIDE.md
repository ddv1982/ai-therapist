# Implementation Guide

A guide for developers implementing new features in the AI Therapist application.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Adding a New API Endpoint](#adding-a-new-api-endpoint)
3. [Working with the Database](#working-with-the-database)
4. [Error Handling](#error-handling)
5. [State Management](#state-management)
6. [Testing](#testing)
7. [Performance Considerations](#performance-considerations)
8. [Security Considerations](#security-considerations)

---

## Project Structure

### Directory Layout

```
ai-therapist/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Main application routes
│   │   └── api/               # API endpoints
│   │
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components (buttons, cards, etc.)
│   │   ├── layout/           # Layout components
│   │   └── therapy/          # Therapy-specific components
│   │
│   ├── features/             # Feature modules
│   │   ├── auth/            # Authentication
│   │   ├── chat/            # Chat functionality
│   │   └── therapy/         # Therapy features (CBT, memory, etc.)
│   │
│   ├── lib/                 # Utility functions and helpers
│   │   ├── api/            # API utilities
│   │   ├── auth/           # Authentication utilities
│   │   ├── chat/           # Chat utilities
│   │   ├── database/       # Database queries
│   │   ├── errors/         # Error classes
│   │   ├── services/       # Business logic services
│   │   ├── therapy/        # Therapy utilities
│   │   └── utils/          # General utilities
│   │
│   ├── store/              # Redux state management
│   ├── hooks/              # React hooks
│   ├── types/              # TypeScript type definitions
│   ├── config/             # Configuration files
│   └── i18n/              # Internationalization
│
├── __tests__/             # Test files
├── docs/                  # Documentation
├── prisma/               # Database schema
└── convex/              # Convex backend (if used)
```

### Key Files

| File | Purpose |
|------|---------|
| `/src/config/env.ts` | Environment variables (server-only) |
| `/src/config/env.public.ts` | Public environment variables (client-safe) |
| `/src/lib/api/api-response.ts` | Standard API response helpers |
| `/src/lib/api/api-middleware.ts` | Authentication and rate limiting middleware |
| `/src/lib/errors/chat-errors.ts` | Error class definitions |
| `/src/lib/api/error-codes.ts` | Error code registry |
| `/src/store/` | Redux store configuration |

---

## Adding a New API Endpoint

### Step 1: Define the Route

Create a new file in `/src/app/api/` following the structure:

```
/src/app/api/features/[featureName]/route.ts
```

### Step 2: Implement the Endpoint

Follow the standard API response format:

```typescript
import { NextRequest } from 'next/server';
import { withAuthAndRateLimit } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { ChatError, MessageValidationError } from '@/lib/errors/chat-errors';
import { logger } from '@/lib/utils/logger';

interface RequestBody {
  // Define your request structure
  field1: string;
  field2: number;
}

interface ResponseData {
  // Define your response structure
  success: boolean;
  data?: unknown;
}

export const POST = withAuthAndRateLimit(async (req: NextRequest, context) => {
  try {
    // Parse and validate request body
    const body = await req.json() as RequestBody;

    if (!body.field1) {
      throw new MessageValidationError('field1 is required', {
        endpoint: '/api/features/endpoint',
        requestId: context.requestId
      });
    }

    // Process the request
    const result = await processFeature(body);

    // Return success response
    return createSuccessResponse(result, {
      requestId: context.requestId
    });

  } catch (error) {
    // Handle known errors
    if (error instanceof ChatError) {
      logger.error('Feature endpoint error', {
        apiEndpoint: '/api/features/endpoint',
        requestId: context.requestId,
        errorCode: error.code,
        userMessage: error.userMessage
      });

      return createErrorResponse(
        error.userMessage,
        error.statusCode,
        {
          code: error.code,
          details: error.message,
          suggestedAction: error.suggestedAction,
          requestId: context.requestId
        }
      );
    }

    // Handle unexpected errors
    logger.apiError('/api/features/endpoint', error as Error, {
      requestId: context.requestId
    });

    return createErrorResponse(
      'An unexpected error occurred',
      500,
      { requestId: context.requestId }
    );
  }
});
```

### Step 3: Add Type Definitions

Create types in `/src/types/` or near the feature:

```typescript
// src/types/features/endpoint.ts
export interface FeatureRequest {
  field1: string;
  field2: number;
}

export interface FeatureResponse {
  success: boolean;
  id: string;
  createdAt: Date;
}
```

### Step 4: Add Unit Tests

Create tests in `/__tests__/api/features/`:

```typescript
describe('POST /api/features/endpoint', () => {
  it('should process valid request', async () => {
    const response = await fetch('/api/features/endpoint', {
      method: 'POST',
      body: JSON.stringify({ field1: 'value', field2: 42 })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should reject invalid request', async () => {
    const response = await fetch('/api/features/endpoint', {
      method: 'POST',
      body: JSON.stringify({ field2: 42 }) // missing field1
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## Working with the Database

### Querying Data

Use type-safe queries from `/src/lib/database/queries.ts`:

```typescript
import { verifySessionOwnership, getUserMessages } from '@/lib/database/queries';

// Get user's sessions
const sessions = await getUserSessions(userId);

// Get session with ownership check
const session = await verifySessionOwnership(sessionId, userId);
```

### Creating a New Query

Add to `/src/lib/database/queries.ts`:

```typescript
import { getConvexHttpClient, anyApi } from '@/lib/convex/httpClient';
import type { SessionWithMessages } from '@/types/database';

export async function getFeatureData(
  userId: string,
  options?: { limit?: number }
): Promise<FeatureData[]> {
  const client = getConvexHttpClient();

  // Validate input
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  // Query the database
  const data = await client.query(anyApi.features.getByUser, {
    userId,
    limit: options?.limit ?? 50
  });

  // Return typed result
  return data as FeatureData[];
}
```

### Adding Pagination

Always include pagination for list queries:

```typescript
interface PaginationOptions {
  limit?: number;
  offset?: number;
}

interface PaginatedResult<T> {
  items: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export async function getSessionsWithPagination(
  userId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<Session>> {
  const limit = Math.min(options.limit ?? 50, 100); // Max 100
  const offset = options.offset ?? 0;

  const [items, total] = await Promise.all([
    client.query(anyApi.sessions.listByUser, {
      userId,
      limit: limit + 1,
      offset
    }),
    client.query(anyApi.sessions.countByUser, { userId })
  ]);

  return {
    items: items.slice(0, limit),
    pagination: {
      limit,
      offset,
      total,
      hasMore: items.length > limit
    }
  };
}
```

---

## Error Handling

### Using Error Classes

```typescript
import { ChatError, MessageValidationError, SessionError } from '@/lib/errors/chat-errors';

// Validation error
if (!message) {
  throw new MessageValidationError('Message is required');
}

// Session error
if (!session) {
  throw new SessionError('fetch', new Error('Not found'));
}

// Custom error with context
throw new ChatError({
  code: ApiErrorCode.VALIDATION_ERROR,
  userMessage: 'Invalid input',
  details: `Field validation failed: ${error.message}`,
  context: { field: 'email', value: input.email }
});
```

### Error Response Format

All errors should return standardized responses:

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly error message",
    "statusCode": 400,
    "details": "Technical details for debugging",
    "suggestedAction": "What the user should do next",
    "requestId": "req-uuid-1234"
  }
}
```

See `/docs/ERROR_CODES.md` for complete error code reference.

---

## State Management

### Using Redux

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateSettings } from '@/store/slices/chatSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectChatSettings);

  const handleUpdate = (newSettings) => {
    dispatch(updateSettings(newSettings));
  };

  return (
    // component JSX
  );
}
```

### Creating a New Slice

```typescript
// src/store/slices/featureSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FeatureState {
  data: FeatureData[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FeatureState = {
  data: [],
  isLoading: false,
  error: null
};

const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<FeatureData[]>) => {
      state.data = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  }
});

export const { setData, setLoading, setError } = featureSlice.actions;
export default featureSlice.reducer;
```

---

## Testing

### Unit Tests

Run with: `npm run test`

```typescript
import { describe, it, expect } from '@jest/globals';
import { myFunction } from '@/lib/utils';

describe('myFunction', () => {
  it('should work correctly', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### E2E Tests

Run with: `npm run test:e2e`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test('should send message and receive response', async ({ page }) => {
    await page.goto('/');

    // Authenticate
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for chat to load
    await page.waitForSelector('[role="textbox"]');

    // Send message
    await page.fill('[role="textbox"]', 'Hello');
    await page.press('[role="textbox"]', 'Enter');

    // Verify response
    await expect(page.locator('.message')).toContainText('Hello');
  });
});
```

### Coverage

Run with: `npm run test:coverage`

Target: 85%+ overall coverage, 100% for security code

---

## Performance Considerations

### Code Splitting

Use dynamic imports for heavy features:

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/features/heavy/component'),
  { loading: () => <LoadingSpinner /> }
);
```

### Memoization

Use React memoization to prevent unnecessary renders:

```typescript
import { memo, useMemo, useCallback } from 'react';

const MyComponent = memo(function MyComponent({ data }) {
  const processed = useMemo(() => processData(data), [data]);

  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <div onClick={handleClick}>{processed}</div>;
});
```

### Database Query Optimization

Always use pagination:

```typescript
// ✅ Good - paginated
const result = await getSessionsWithPagination(userId, { limit: 50 });

// ❌ Bad - loads all records
const result = await getAllSessions(userId);
```

### Bundle Size

Monitor with: `npm run build`

Target: Keep initial bundle <200KB, API routes <50KB

---

## Security Considerations

### Input Validation

Always validate user input:

```typescript
import { z } from 'zod';

const messageSchema = z.object({
  content: z.string().min(1).max(10000),
  sessionId: z.string().uuid()
});

const validated = messageSchema.parse(userInput);
```

### Authentication

All API routes should use middleware:

```typescript
export const POST = withAuthAndRateLimit(async (req, context) => {
  // User is already authenticated here
  const userId = context.userInfo.userId;
});
```

### Encryption

For sensitive data:

```typescript
import { encryptData, decryptData } from '@/lib/auth/crypto-utils';

// Encrypt before storing
const encrypted = encryptData(sensitiveData, encryptionKey);
await database.save(encrypted);

// Decrypt when retrieving
const decrypted = decryptData(encrypted, encryptionKey);
```

### HIPAA Compliance

Ensure therapeutic data is:
- Encrypted at rest (AES-256-GCM)
- Encrypted in transit (HTTPS)
- Access controlled (user owns their data)
- Audit logged (all access recorded)

---

## Environment Variables

Add new variables to `/src/config/env.ts` with Zod validation:

```typescript
export const env = z.object({
  // ... existing variables
  NEW_FEATURE_API_KEY: z.string(),
  NEW_FEATURE_ENABLED: z.boolean().default(false)
}).parse(process.env);
```

Then use in code:

```typescript
import { env } from '@/config/env';

const apiKey = env.NEW_FEATURE_API_KEY;
```

---

## Debugging

### Logging

Use the logger utility:

```typescript
import { logger } from '@/lib/utils/logger';

logger.info('User action', { userId, action: 'login' });
logger.warn('Unusual activity', { userId, attempts: 5 });
logger.error('Operation failed', { operation: 'save' }, error);
```

### Request IDs

All requests include unique request IDs for tracing:

```typescript
// Automatically added by middleware
context.requestId // e.g., "req-12345-abcde"

// Use in logs and error responses
logger.info('Processing request', { requestId: context.requestId });
```

### Development

Run dev server:
```bash
npm run dev
```

Available at: `http://localhost:3000`

---

## Common Tasks

### Add a New Redux Slice

1. Create `/src/store/slices/featureName.ts`
2. Define state interface and initial state
3. Create slice with reducers
4. Export actions and reducer
5. Register in store configuration

### Add a New Utility Function

1. Create `/src/lib/utils/featureName.ts`
2. Write function with TypeScript types
3. Add JSDoc comments
4. Create `/src/lib/utils/featureName.test.ts`
5. Run `npm run test` to verify

### Add a New API Endpoint

1. Create `/src/app/api/path/route.ts`
2. Implement with standard middleware
3. Add error handling
4. Create tests
5. Update API documentation

### Add a New Component

1. Create `/src/components/ComponentName.tsx`
2. Use TypeScript and React best practices
3. Add JSDoc comments
4. Create tests if complex
5. Add to appropriate category (ui, layout, feature)

---

## Resources

- **Architecture**: See `/CLAUDE.md` for detailed architecture
- **Error Codes**: See `/docs/ERROR_CODES.md`
- **API Standards**: See CLAUDE.md "API Interface Standards"
- **Security**: See CLAUDE.md "Recent Security Improvements"
- **Database**: See `prisma/schema.prisma` for schema

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
