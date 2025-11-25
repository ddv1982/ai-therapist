# AI Therapist Codebase Improvement Plan

## Specification Document

**Version:** 1.0  
**Created:** 2024-11-25  
**Status:** Ready for Implementation

---

## 1. Overview

### 1.1 Purpose

This specification outlines a comprehensive, phased approach to improving the AI Therapist codebase. The improvements focus on code architecture, type safety, testing, performance, security, developer experience, and infrastructure.

### 1.2 Current State Summary

| Aspect | Status |
|--------|--------|
| Framework | Next.js 16 with React 19 |
| Backend | Convex (BaaS) |
| Authentication | Clerk |
| Test Suite | 1,529 passing tests, 139 test suites |
| TypeScript | Strict mode enabled, `noImplicitAny: false` |
| Code Quality | ESLint configured, Prettier formatting |
| Coverage | High overall (~87-99% per module) |

### 1.3 Key Strengths

- Clean ESLint configuration with meaningful rules
- Well-structured Convex schema with indexes
- Comprehensive error code system (326+ lines)
- Good security headers implementation
- High test coverage overall
- Good separation of concerns in most areas

### 1.4 Areas of Concern

- Large hook files handling multiple concerns (e.g., `use-chat-controller.ts` at 366 lines, `use-chat-messages.ts` at 598 lines)
- `v.any()` usage in Convex schema for metadata fields
- Overlapping feature modules (`chat`, `therapy`, `therapy-chat`)
- In-memory rate limiting (won't scale horizontally)
- `noImplicitAny: false` allows loose typing

### 1.5 Tech Stack Reference

```
Frontend: Next.js 16, React 19, Tailwind CSS v4, TanStack Query v5
Backend: Convex, Clerk Auth
Validation: Zod v4
Testing: Jest 30, Playwright 1.56
AI: AI SDK 5, Groq
```

---

## 2. Phase 1: Code Architecture & Organization

**Priority:** High  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** None

### 2.1 Hook Complexity Reduction

#### 2.1.1 Current State

| File | Size | Lines | Concerns |
|------|------|-------|----------|
| `src/hooks/use-chat-controller.ts` | 11KB | 366 | 15+ hooks orchestration |
| `src/hooks/use-chat-messages.ts` | 20KB | 598 | Messages, persistence, metadata |

The `useChatController` hook imports and orchestrates:
- `useChatMessages`
- `useScrollToBottom`
- `useChatTransport`
- `useMemoryContext`
- `useChatSessions`
- `useChatViewport`
- `useChatUiState`
- `useChatStreaming`
- `useSendMessage`
- `useGenerateReport`

#### 2.1.2 Problems

- Difficult to test individual concerns in isolation
- Hard to reason about data flow between hooks
- Performance implications from large dependency arrays
- Single responsibility principle violations

#### 2.1.3 Proposed Solution

**Extract Domain Services:**

```typescript
// src/services/chat/message-persistence.service.ts
export class MessagePersistenceService {
  async saveMessage(message: Message): Promise<void>;
  async loadMessages(sessionId: string): Promise<Message[]>;
  async deleteMessages(sessionIds: string[]): Promise<void>;
}

// src/services/chat/metadata-manager.service.ts
export class MetadataManager {
  updateMessageMetadata(messageId: string, metadata: MessageMetadata): void;
  getMetadata(messageId: string): MessageMetadata | null;
}
```

**Simplify Hook Dependencies:**

```typescript
// Refactored use-chat-controller.ts
export function useChatController() {
  // Core state
  const { messages, actions } = useChatCore();
  
  // UI concerns (extracted)
  const ui = useChatUI();
  
  // Session management (extracted)
  const sessions = useChatSessionManager();
  
  return { messages, actions, ui, sessions };
}
```

#### 2.1.4 Success Criteria

- [ ] No hook file exceeds 200 lines
- [ ] Each hook handles a single concern
- [ ] All existing tests continue to pass
- [ ] Performance benchmarks maintained or improved

### 2.2 Feature Module Boundaries

#### 2.2.1 Current Structure

```
src/features/
├── auth/           # Authentication UI
├── chat/           # Chat UI components
├── shared/         # Shared utilities
├── therapy/        # Therapy-specific features
└── therapy-chat/   # Overlapping concerns (unclear boundary)

src/lib/chat/       # Chat utilities (tightly coupled to features)
```

#### 2.2.2 Problems

- Unclear separation between `features/chat` and `features/therapy-chat`
- Business logic scattered between `src/lib` and `src/features`
- Some utilities in `src/lib/chat/` are tightly coupled to feature components

#### 2.2.3 Proposed Solution

**Option A: Consolidate into Chat Feature**
```
src/features/
├── auth/
├── chat/
│   ├── components/     # UI components
│   ├── hooks/          # Feature-specific hooks
│   ├── services/       # Business logic
│   ├── types/          # Type definitions
│   └── utils/          # Utilities
├── therapy/
│   ├── analysis/       # Therapeutic analysis
│   ├── frameworks/     # CBT, Schema, etc.
│   └── reports/        # Report generation
└── shared/
```

**Option B: Keep Separated with Clear Boundaries**
- `features/chat` - Generic chat infrastructure
- `features/therapy` - Therapy-specific features and frameworks
- Remove `features/therapy-chat` and distribute to appropriate modules

#### 2.2.4 Success Criteria

- [ ] Clear documentation of module boundaries
- [ ] No circular dependencies between features
- [ ] `therapy-chat` either absorbed or clearly justified
- [ ] Import paths simplified with barrel exports

### 2.3 Component Organization

#### 2.3.1 Current State

```
src/components/ui/     # 48 files
├── therapeutic-button.tsx
├── therapeutic-card.tsx
├── therapeutic-cards/
├── therapeutic-forms/
├── therapeutic-layouts/
├── therapeutic-modals/
└── ... (primitive components)
```

#### 2.3.2 Problems

- Large UI directory makes discovery difficult
- Naming inconsistency (`therapeutic-button.tsx` vs `therapeutic-cards/`)
- Mix of primitive and compound components

#### 2.3.3 Proposed Solution

```
src/components/
├── primitives/         # Base shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── therapeutic/        # Therapy-specific components
│   ├── buttons/
│   ├── cards/
│   ├── forms/
│   ├── layouts/
│   └── modals/
└── composed/           # Compound components
    ├── command-palette.tsx
    ├── error-boundary.tsx
    └── ...
```

#### 2.3.4 Success Criteria

- [ ] Components organized by category
- [ ] Consistent naming convention
- [ ] Index files for easy imports
- [ ] Storybook or documentation for discovery

---

## 3. Phase 2: Type Safety & Code Quality

**Priority:** High  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** None

### 3.1 TypeScript Strict Mode

#### 3.1.1 Current State

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": false  // <-- Problem
  }
}
```

#### 3.1.2 Convex Schema Issues

```typescript
// convex/schema.ts - Current
messages: defineTable({
  metadata: v.optional(v.any()),  // <-- Untyped
  // ...
}),

sessionReports: defineTable({
  keyPoints: v.any(),             // <-- Untyped
  therapeuticInsights: v.any(),   // <-- Untyped
  patternsIdentified: v.any(),    // <-- Untyped
  actionItems: v.any(),           // <-- Untyped
  cognitiveDistortions: v.optional(v.any()),
  schemaAnalysis: v.optional(v.any()),
  therapeuticFrameworks: v.optional(v.any()),
  recommendations: v.optional(v.any()),
})
```

#### 3.1.3 Proposed Solution

**Step 1: Define Metadata Types**

```typescript
// src/types/therapy-metadata.ts
export interface MessageMetadata {
  therapeuticFramework?: 'CBT' | 'Schema' | 'ERP' | 'General';
  emotionalTone?: 'positive' | 'negative' | 'neutral' | 'mixed';
  crisisIndicators?: boolean;
  toolsUsed?: string[];
}

export interface ReportKeyPoint {
  topic: string;
  summary: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface TherapeuticInsight {
  framework: string;
  insight: string;
  confidence: number;
}
```

**Step 2: Update Convex Schema**

```typescript
// convex/schema.ts - Improved
const messageMetadataValidator = v.optional(v.object({
  therapeuticFramework: v.optional(v.union(
    v.literal('CBT'),
    v.literal('Schema'),
    v.literal('ERP'),
    v.literal('General')
  )),
  emotionalTone: v.optional(v.string()),
  crisisIndicators: v.optional(v.boolean()),
  toolsUsed: v.optional(v.array(v.string())),
}));

const keyPointValidator = v.array(v.object({
  topic: v.string(),
  summary: v.string(),
  relevance: v.union(
    v.literal('high'),
    v.literal('medium'),
    v.literal('low')
  ),
}));
```

**Step 3: Enable noImplicitAny**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

#### 3.1.4 Migration Strategy

1. Run `npx tsc --noImplicitAny` to identify affected files
2. Fix type errors systematically by module
3. Add Zod schemas for runtime validation
4. Update Convex schema with proper validators
5. Enable flag permanently

#### 3.1.5 Success Criteria

- [ ] `noImplicitAny: true` enabled
- [ ] Zero `v.any()` in Convex schema
- [ ] Zod schemas mirror Convex validators
- [ ] All tests pass with strict types

### 3.2 Error Handling Patterns

#### 3.2.1 Current State

- Good error boundary implementation (`src/components/ui/error-boundary.tsx`)
- Comprehensive error codes (`src/lib/api/error-codes.ts` - 326 lines)
- Inconsistent error handling in hooks

#### 3.2.2 Proposed Solution

**Implement Result Type:**

```typescript
// src/lib/utils/result.ts
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}
```

**Standardize Hook Error Handling:**

```typescript
// Before
const sendMessage = async () => {
  try {
    await api.sendMessage(content);
  } catch (e) {
    console.error(e);  // Silent failure
  }
};

// After
const sendMessage = async (): Promise<Result<void, ApiError>> => {
  const result = await api.sendMessage(content);
  if (!result.success) {
    logger.error('Message send failed', { error: result.error });
    toast.error(getErrorMessage(result.error.code));
    return result;
  }
  return ok(undefined);
};
```

#### 3.2.3 Success Criteria

- [ ] Result type used for fallible operations
- [ ] Consistent error recovery patterns
- [ ] No silent failures in production code
- [ ] Error logging with context

### 3.3 API Response Consistency

#### 3.3.1 Current State

- Well-defined `ApiResponse<T>` type exists
- Client-side code sometimes bypasses response helpers
- Error extraction patterns vary

#### 3.3.2 Proposed Solution

**Create Unified API Hooks:**

```typescript
// src/lib/api/hooks/use-api-mutation.ts
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<TData, ApiError, TVariables>
) {
  return useMutation({
    mutationFn: async (variables) => {
      const response = await mutationFn(variables);
      if (!response.success) {
        throw new ApiError(response.error);
      }
      return response.data;
    },
    onError: (error) => {
      // Centralized error handling
      handleApiError(error);
    },
    ...options,
  });
}
```

**Add Retry Logic:**

```typescript
// src/lib/api/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<T> {
  let lastError: Error;
  for (let attempt = 0; attempt < options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (!isRetryable(error) || attempt === options.maxAttempts - 1) {
        throw error;
      }
      await sleep(getBackoffDelay(attempt, options));
    }
  }
  throw lastError!;
}
```

#### 3.3.3 Success Criteria

- [ ] All API calls use unified hooks
- [ ] Retry logic for transient failures
- [ ] Request/response logging in development
- [ ] Consistent error messages to users

---

## 4. Phase 3: Testing & Quality Assurance

**Priority:** Medium  
**Estimated Effort:** 2 weeks  
**Dependencies:** Phase 2 (for typed tests)

### 4.1 Test Coverage Analysis

#### 4.1.1 Current State

| Module | Coverage |
|--------|----------|
| lib/therapy | ~99% |
| lib/utils | ~89% |
| repositories | ~87% |
| services | ~92% |

**Gaps Identified:**
- Complex paths in `session-repository.ts`
- E2E tests limited to 2 main flow specs
- No visual regression testing

#### 4.1.2 Proposed Solution

**Expand Unit Tests:**

```typescript
// __tests__/lib/repositories/session-repository.test.ts
describe('SessionRepository', () => {
  describe('edge cases', () => {
    it('handles concurrent session updates', async () => {
      // Test race condition handling
    });
    
    it('recovers from partial save failures', async () => {
      // Test transaction rollback
    });
    
    it('handles max message limit per session', async () => {
      // Test boundary conditions
    });
  });
});
```

**Add E2E Test Scenarios:**

```typescript
// e2e/edge-cases.spec.ts
test.describe('Edge Cases', () => {
  test('handles network interruption during message send', async ({ page }) => {
    // Simulate offline mode
  });
  
  test('recovers from session expiration', async ({ page }) => {
    // Test auth refresh flow
  });
  
  test('handles rapid session switching', async ({ page }) => {
    // Test state consistency
  });
});
```

#### 4.1.3 Success Criteria

- [ ] Repository coverage ≥ 95%
- [ ] Services coverage ≥ 95%
- [ ] 5+ E2E test scenarios
- [ ] Critical path coverage documented

### 4.2 Integration Test Gaps

#### 4.2.1 Current State

- Unit tests cover most utilities
- Limited integration tests for full flows
- Convex queries/mutations have basic tests
- Real Convex interactions not tested

#### 4.2.2 Proposed Solution

**Create Integration Test Suite:**

```typescript
// __tests__/integration/chat-flow.test.ts
describe('Chat Flow Integration', () => {
  let convexMock: ConvexMock;
  let clerkMock: ClerkMock;
  
  beforeEach(() => {
    convexMock = setupConvexMock();
    clerkMock = setupClerkMock();
  });
  
  it('completes full message send cycle', async () => {
    const { result } = renderHook(() => useChatController(), {
      wrapper: IntegrationTestWrapper,
    });
    
    // Send message
    await act(async () => {
      result.current.setInput('Hello');
      await result.current.sendMessage();
    });
    
    // Verify Convex mutation called
    expect(convexMock.messages.send).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Hello' })
    );
    
    // Verify optimistic update
    expect(result.current.messages).toContainEqual(
      expect.objectContaining({ content: 'Hello', status: 'pending' })
    );
  });
});
```

**Test Auth Flows:**

```typescript
// __tests__/integration/auth-flow.test.ts
describe('Auth Flow Integration', () => {
  it('syncs Clerk user to Convex on login', async () => {
    // Simulate Clerk webhook
    await webhookHandler(mockClerkUserCreated);
    
    // Verify Convex user created
    expect(convexMock.users.getByClerkId).toHaveBeenCalled();
  });
});
```

#### 4.2.3 Success Criteria

- [ ] Integration test suite for critical paths
- [ ] Convex mock utilities established
- [ ] Auth flow integration tested
- [ ] CI runs integration tests

---

## 5. Phase 4: Performance Optimization

**Priority:** Medium  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** None

### 5.1 Bundle Analysis

#### 5.1.1 Current State

- Bundle analyzer configured (`@next/bundle-analyzer`)
- Good code splitting with dynamic imports
- Large dependencies: recharts, framer-motion

#### 5.1.2 Proposed Solution

**Step 1: Establish Baseline**

```bash
npm run analyze
# Document current bundle sizes
```

**Step 2: Optimize Large Dependencies**

```typescript
// Before - Full import
import { motion } from 'framer-motion';

// After - Tree-shakeable import
import { motion } from 'framer-motion/dist/es/render/dom/motion';

// Or lazy load
const MotionDiv = dynamic(() => 
  import('framer-motion').then(m => m.motion.div)
);
```

**Step 3: Add CI Monitoring**

```yaml
# .github/workflows/bundle-size.yml
- name: Check bundle size
  uses: preactjs/compressed-size-action@v2
  with:
    repo-token: "${{ secrets.GITHUB_TOKEN }}"
```

#### 5.1.3 Success Criteria

- [ ] Bundle size baseline documented
- [ ] 10% reduction in main bundle
- [ ] CI alerts on size regression
- [ ] Large dependencies lazy-loaded

### 5.2 Render Optimization

#### 5.2.1 Current State

- Good use of `useMemo` and `useCallback`
- React 19 with Server Components
- Chat message list may need virtualization

#### 5.2.2 Proposed Solution

**Implement Virtual Scrolling:**

```typescript
// src/features/chat/components/message-list.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function MessageList({ messages }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <MessageItem 
            key={virtualRow.index}
            message={messages[virtualRow.index]}
            style={{
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

**Profile Re-renders:**

```typescript
// Development only
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  if (actualDuration > 16) {
    console.warn(`Slow render: ${id} took ${actualDuration}ms`);
  }
}
```

#### 5.2.3 Success Criteria

- [ ] Virtual scrolling for 100+ messages
- [ ] No unnecessary re-renders in chat
- [ ] Render time < 16ms for updates
- [ ] Memory stable with large histories

### 5.3 Data Fetching Patterns

#### 5.3.1 Current State

- Convex for real-time data
- TanStack Query available but not heavily used
- Manual cache management in some places

#### 5.3.2 Proposed Solution

**Consolidate with TanStack Query:**

```typescript
// src/lib/queries/use-sessions.ts
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => convex.query(api.sessions.list),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

// Prefetch on navigation
export function prefetchSessions(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: ['sessions'],
    queryFn: () => convex.query(api.sessions.list),
  });
}
```

**Cache Invalidation Strategy:**

```typescript
// src/lib/queries/invalidation.ts
export const invalidationMap = {
  'session.create': ['sessions'],
  'session.delete': ['sessions', 'messages'],
  'message.send': ['messages', 'sessions'], // Update message count
};

export function invalidateRelated(mutation: string, queryClient: QueryClient) {
  const keys = invalidationMap[mutation] ?? [];
  keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
}
```

#### 5.3.3 Success Criteria

- [ ] TanStack Query for all data fetching
- [ ] Clear cache invalidation strategy
- [ ] Prefetching on common paths
- [ ] No duplicate fetches

---

## 6. Phase 5: Security Hardening

**Priority:** High  
**Estimated Effort:** 1 week  
**Dependencies:** None

### 6.1 CSP Refinement

#### 6.1.1 Current State

- Good CSP implementation with nonce
- Security headers properly configured
- Some `unsafe-inline` fallbacks present
- Development mode allows `unsafe-eval`

#### 6.1.2 Proposed Solution

**Add CSP Reporting:**

```typescript
// middleware.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-${nonce}';
  style-src 'self' 'unsafe-inline';
  report-uri /api/csp-report;
  report-to csp-endpoint;
`;

// src/app/api/csp-report/route.ts
export async function POST(req: Request) {
  const report = await req.json();
  logger.warn('CSP Violation', { report });
  // Send to monitoring service
  return new Response(null, { status: 204 });
}
```

**Document Required Exceptions:**

```typescript
// src/lib/security/csp-config.ts
export const CSP_EXCEPTIONS = {
  'clerk.com': 'Authentication provider requires external scripts',
  'unsafe-inline styles': 'Tailwind CSS requires inline styles',
} as const;
```

#### 6.1.3 Success Criteria

- [ ] CSP violation reporting active
- [ ] All exceptions documented
- [ ] No unnecessary `unsafe-*` directives
- [ ] Monthly CSP audit process

### 6.2 Input Validation

#### 6.2.1 Current State

- Zod v4 for schema validation
- API middleware validates requests
- Convex functions validate arguments
- Client/server validation not always aligned

#### 6.2.2 Proposed Solution

**Shared Validation Schemas:**

```typescript
// src/lib/validation/schemas/message.ts
import { z } from 'zod';

export const messageContentSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(10000, 'Message too long')
  .transform(content => content.trim());

export const messageMetadataSchema = z.object({
  therapeuticFramework: z.enum(['CBT', 'Schema', 'ERP', 'General']).optional(),
  emotionalTone: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional(),
  crisisIndicators: z.boolean().optional(),
}).strict();

// Used on both client and server
export const sendMessageSchema = z.object({
  content: messageContentSchema,
  sessionId: z.string().uuid(),
  metadata: messageMetadataSchema.optional(),
});
```

**Convex Validation Alignment:**

```typescript
// convex/validators.ts
import { v } from 'convex/values';

// Mirror Zod schemas for Convex
export const messageContentValidator = v.string();
export const messageMetadataValidator = v.optional(v.object({
  therapeuticFramework: v.optional(v.union(
    v.literal('CBT'),
    v.literal('Schema'),
    v.literal('ERP'),
    v.literal('General')
  )),
  emotionalTone: v.optional(v.union(
    v.literal('positive'),
    v.literal('negative'),
    v.literal('neutral'),
    v.literal('mixed')
  )),
  crisisIndicators: v.optional(v.boolean()),
}));
```

#### 6.2.3 Success Criteria

- [ ] Shared schemas for client/server
- [ ] All metadata fields typed
- [ ] Validation documentation
- [ ] Input sanitization where needed

### 6.3 Rate Limiting Review

#### 6.3.1 Current State

- In-memory rate limiter with configurable buckets
- Different limits for chat vs API
- Block duration on limit exceeded
- Won't scale horizontally

#### 6.3.2 Proposed Solution

**Option A: Redis-based Rate Limiting**

```typescript
// src/lib/api/rate-limiter-redis.ts
import { Redis } from '@upstash/redis';

export class RedisRateLimiter {
  constructor(private redis: Redis) {}
  
  async check(key: string, limit: number, window: number): Promise<RateLimitResult> {
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      reset: await this.redis.ttl(key),
    };
  }
}
```

**Add Rate Limit Headers:**

```typescript
// src/lib/api/middleware/rate-limit.ts
export function withRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.reset));
  return response;
}
```

#### 6.3.3 Success Criteria

- [ ] Distributed rate limiting ready
- [ ] Rate limit headers in responses
- [ ] Progressive penalties for abuse
- [ ] Monitoring for rate limit hits

---

## 7. Phase 6: Developer Experience

**Priority:** Low  
**Estimated Effort:** 1-2 weeks  
**Dependencies:** Phases 1-2

### 7.1 Documentation

#### 7.1.1 Current State

- AGENTS.md with good guidelines
- API documented in `docs/api.yaml`
- Test README comprehensive
- Architecture documentation missing

#### 7.1.2 Proposed Solution

**Add Architecture Decision Records:**

```markdown
<!-- docs/adr/001-convex-backend.md -->
# ADR 001: Using Convex as Backend

## Status
Accepted

## Context
We needed a real-time backend with strong TypeScript support.

## Decision
We chose Convex for:
- Real-time reactivity out of the box
- Type-safe queries and mutations
- Automatic scaling

## Consequences
- Vendor lock-in to Convex
- Learning curve for team
- Simplified backend development
```

**Create Development Guide:**

```markdown
<!-- docs/DEVELOPMENT.md -->
# Development Guide

## Prerequisites
- Node.js 24+
- npm 10+

## Quick Start
1. Clone repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Run `npm run dev`

## Architecture Overview
[Diagram and explanation]

## Common Tasks
- Adding a new feature
- Creating a new component
- Writing tests
```

#### 7.1.3 Success Criteria

- [ ] ADRs for major decisions
- [ ] Development setup guide
- [ ] Component documentation
- [ ] Architecture overview

### 7.2 Tooling Improvements

#### 7.2.1 Current State

- ESLint with good rule set
- Prettier configured
- No pre-commit hooks visible
- No automated dependency updates

#### 7.2.2 Proposed Solution

**Add Husky Pre-commit Hooks:**

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
npx tsc --noEmit
```

**Configure Dependabot:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      minor-and-patch:
        update-types:
          - "minor"
          - "patch"
```

#### 7.2.3 Success Criteria

- [ ] Pre-commit hooks active
- [ ] Lint-staged for efficiency
- [ ] Dependabot configured
- [ ] Bundle size CI checks

### 7.3 Logging & Observability

#### 7.3.1 Current State

- Structured logger in place
- Performance metrics collection
- Web vitals tracking
- No centralized log aggregation

#### 7.3.2 Proposed Solution

**Add Log Filtering:**

```typescript
// src/lib/utils/logger.ts
export const logger = {
  debug: (msg: string, meta?: object) => {
    if (process.env.LOG_LEVEL !== 'debug') return;
    console.debug(formatLog('DEBUG', msg, meta));
  },
  info: (msg: string, meta?: object) => {
    if (['debug', 'info'].includes(process.env.LOG_LEVEL || 'info')) {
      console.info(formatLog('INFO', msg, meta));
    }
  },
  // ...
};
```

**Consider Sentry Integration:**

```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    });
  }
}
```

#### 7.3.3 Success Criteria

- [ ] Log levels configurable
- [ ] Error tracking service integrated
- [ ] Performance monitoring active
- [ ] Debug logging toggleable

---

## 8. Phase 7: Infrastructure & DevOps

**Priority:** Low  
**Estimated Effort:** 1 week  
**Dependencies:** Phases 5-6

### 8.1 CI/CD Pipeline

#### 8.1.1 Current State

- QA smoke and full commands available
- Playwright for E2E
- Jest for unit tests
- CI configuration not visible

#### 8.1.2 Proposed Solution

**GitHub Actions Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-type-check, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

#### 8.1.3 Success Criteria

- [ ] CI runs on all PRs
- [ ] Tests required to pass
- [ ] Build verification
- [ ] Artifacts preserved on failure

### 8.2 Environment Management

#### 8.2.1 Current State

- Good env configuration with validation
- Public/private env separation
- Setup scripts available
- Multiple env files can get out of sync

#### 8.2.2 Proposed Solution

**Single Source of Truth:**

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  CONVEX_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().length(32),
  GROQ_API_KEY: z.string().min(1),
  
  // Optional with defaults
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  RATE_LIMIT_DISABLED: z.coerce.boolean().default(false),
  
  // Public (client-safe)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

**Environment Parity Check:**

```bash
#!/bin/bash
# scripts/check-env-parity.sh
required_vars=$(grep -E '^[A-Z_]+=' .env.example | cut -d= -f1)
for var in $required_vars; do
  if [ -z "${!var}" ]; then
    echo "Missing: $var"
    exit 1
  fi
done
echo "All required environment variables present"
```

#### 8.2.3 Success Criteria

- [ ] Zod-validated env config
- [ ] Parity check script
- [ ] Secret rotation documented
- [ ] No env file drift

---

## 9. Implementation Strategy

### 9.1 Recommended Order

| Order | Phase | Rationale |
|-------|-------|-----------|
| 1 | 2.1 TypeScript Strict | Quick win, immediate benefits |
| 2 | 5.1 CSP Monitoring | Security visibility |
| 3 | 1.1 Hook Complexity | Foundation for maintainability |
| 4 | 3.1 Test Coverage | Quality assurance |
| 5 | 4.2 Render Optimization | User experience |
| 6 | 1.2 Feature Boundaries | Architecture clarity |
| 7 | 6.1 Documentation | Team scalability |
| 8 | 7.1 CI/CD | Deployment reliability |

### 9.2 Task Spec Creation

Each phase should be broken into individual task specs:

```
droidz/specs/023-enable-no-implicit-any/
droidz/specs/024-csp-violation-monitoring/
droidz/specs/025-hook-complexity-reduction/
droidz/specs/026-test-coverage-gaps/
droidz/specs/027-render-optimization/
droidz/specs/028-feature-module-boundaries/
droidz/specs/029-documentation-adr/
droidz/specs/030-ci-cd-pipeline/
```

### 9.3 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes from refactoring | Comprehensive test coverage before changes |
| TypeScript migration breaks | Incremental enablement with CI gates |
| Performance regressions | Bundle size and render time monitoring |
| Security gaps during changes | CSP monitoring active before changes |

### 9.4 Rollback Strategy

Each phase should be:
1. Implemented in a feature branch
2. Reviewed via PR with test evidence
3. Deployed to staging (if available)
4. Monitored for 24-48 hours post-deploy
5. Revertable via single commit if needed

---

## 10. Success Metrics

### 10.1 Code Quality

- [ ] `noImplicitAny: true` with zero errors
- [ ] Zero `v.any()` in Convex schema
- [ ] No hook file > 200 lines
- [ ] Test coverage > 95% for critical paths

### 10.2 Performance

- [ ] Bundle size reduced by 10%
- [ ] Chat renders < 16ms with 100+ messages
- [ ] No duplicate data fetches

### 10.3 Security

- [ ] CSP violations monitored
- [ ] Distributed rate limiting ready
- [ ] All inputs validated end-to-end

### 10.4 Developer Experience

- [ ] New developer onboarding < 1 hour
- [ ] CI runs < 10 minutes
- [ ] Architecture documented

---

## Appendix A: File References

### Key Files for Phase 1
- `src/hooks/use-chat-controller.ts` (366 lines)
- `src/hooks/use-chat-messages.ts` (598 lines)
- `src/features/therapy-chat/`
- `src/components/ui/` (48 files)

### Key Files for Phase 2
- `tsconfig.json`
- `convex/schema.ts`
- `src/lib/api/error-codes.ts` (326 lines)

### Key Files for Phase 5
- `middleware.ts`
- `src/lib/security/`
- `src/lib/api/middleware/`

---

## Appendix B: Dependencies to Add

```json
{
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  },
  "dependencies": {
    "@tanstack/react-virtual": "^3.0.0",
    "@upstash/redis": "^1.0.0",
    "@sentry/nextjs": "^8.0.0"
  }
}
```

Note: All dependencies are optional based on phase implementation decisions.
