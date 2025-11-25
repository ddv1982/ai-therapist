# Next.js App Router Standards

## Overview

This document defines routing conventions for our Next.js 16 App Router application. Following these standards ensures consistent navigation, proper authentication flows, optimized loading states, and maintainable code organization.

## When to Apply

- Creating new pages or routes
- Adding API endpoints
- Implementing navigation between pages
- Setting up route protection and authentication
- Adding loading, error, or not-found states

## Core Principles

1. **Colocation Over Separation**
   - Keep route-specific components close to their route files
   - Use route groups to share layouts without affecting URL structure
   - Why: Reduces cognitive load and makes routes self-contained

2. **Convention Over Configuration**
   - Use Next.js file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`)
   - Avoid custom routing solutions when built-in features suffice
   - Why: Leverages framework optimizations and reduces maintenance

3. **Progressive Enhancement**
   - Every route should have loading and error boundaries
   - Server Components by default, Client Components when needed
   - Why: Better UX and performance

## Project Structure

```
src/app/
├── (auth)/                           # Public auth routes (no auth required)
│   ├── layout.tsx                    # Minimal layout for auth pages
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── (dashboard)/                      # Protected app routes
│   ├── layout.tsx                    # Dashboard layout with nav
│   ├── loading.tsx                   # Shared loading state
│   ├── error.tsx                     # Shared error boundary
│   ├── chat/page.tsx                 # Chat feature
│   ├── cbt-diary/page.tsx            # CBT diary feature
│   ├── profile/page.tsx              # User profile
│   └── reports/page.tsx              # Reports feature
├── api/                              # API routes
│   ├── chat/route.ts
│   ├── health/route.ts
│   └── sessions/
│       ├── route.ts                  # GET /api/sessions, POST /api/sessions
│       ├── current/route.ts          # GET /api/sessions/current
│       └── [sessionId]/
│           ├── route.ts              # GET/PATCH/DELETE /api/sessions/:id
│           └── messages/
│               ├── route.ts          # GET/POST /api/sessions/:id/messages
│               └── [messageId]/route.ts
├── layout.tsx                        # Root layout with providers
├── page.tsx                          # Landing/redirect page
├── loading.tsx                       # Root loading state
├── error.tsx                         # Root error boundary
└── not-found.tsx                     # 404 page
```

---

## ✅ DO

### Route Organization

**✅ DO**: Use route groups for layout separation without URL impact

```
src/app/
├── (auth)/           # URL: /sign-in, /sign-up (not /auth/sign-in)
│   └── sign-in/
├── (dashboard)/      # URL: /chat, /profile (not /dashboard/chat)
│   └── chat/
```

**✅ DO**: Use dynamic segments for resource-based routes

```
src/app/api/sessions/[sessionId]/route.ts
// Handles: /api/sessions/abc123
```

**✅ DO**: Use catch-all routes for third-party auth providers

```
src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
// Handles: /sign-in, /sign-in/factor-one, /sign-in/sso-callback
```

**✅ DO**: Keep route files minimal, delegate to feature modules

```typescript
// src/app/(dashboard)/chat/page.tsx
import { ChatPage } from '@/features/chat/components/chat-page';

export default function Page() {
  return <ChatPage />;
}
```

### Layouts

**✅ DO**: Use layouts for shared UI that persists across navigation

```typescript
// src/app/(dashboard)/layout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="h-screen">{children}</main>
    </div>
  );
}
```

**✅ DO**: Keep root layout focused on essential providers

```typescript
// src/app/layout.tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Loading States

**✅ DO**: Add loading.tsx for routes with data fetching

```typescript
// src/app/(dashboard)/reports/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

**✅ DO**: Use Suspense boundaries for granular loading states

```typescript
// src/app/(dashboard)/chat/page.tsx
import { Suspense } from 'react';
import { ChatSkeleton } from '@/features/chat/components/chat-skeleton';

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatContent />
    </Suspense>
  );
}
```

### Error Handling

**✅ DO**: Add error.tsx for graceful error recovery

```typescript
// src/app/(dashboard)/error.tsx
'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
```

### API Routes

**✅ DO**: Use consistent middleware wrappers for API routes

```typescript
// src/app/api/sessions/route.ts
import { withAuth, withValidation } from '@/lib/api/api-middleware';
import { createSessionSchema } from '@/lib/utils/validation';

export const GET = withAuth(async (request, context) => {
  // Handler receives authenticated context
  const sessions = await getSessions(context.userInfo.userId);
  return createSuccessResponse(sessions, { requestId: context.requestId });
});

export const POST = withValidation(createSessionSchema, async (request, context, data) => {
  // Handler receives validated data
  const session = await createSession(data);
  return createSuccessResponse(session, { requestId: context.requestId });
});
```

**✅ DO**: Follow RESTful conventions for API routes

```
GET    /api/sessions              # List sessions
POST   /api/sessions              # Create session
GET    /api/sessions/[id]         # Get session
PATCH  /api/sessions/[id]         # Update session
DELETE /api/sessions/[id]         # Delete session
GET    /api/sessions/[id]/messages  # List messages
POST   /api/sessions/[id]/messages  # Create message
```

**✅ DO**: Use route handlers for streaming responses

```typescript
// src/app/api/chat/route.ts
export const POST = withAuthAndRateLimitStreaming(async (req, context) => {
  const stream = await streamChatCompletion({ ... });
  return stream.toUIMessageStreamResponse();
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
```

### Metadata

**✅ DO**: Export metadata for SEO and sharing

```typescript
// src/app/(dashboard)/reports/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports | AI Therapist',
  description: 'View your therapy session reports and insights',
};

export default function ReportsPage() { ... }
```

**✅ DO**: Use generateMetadata for dynamic pages

```typescript
// src/app/(dashboard)/sessions/[sessionId]/page.tsx
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  return {
    title: `${session.title} | AI Therapist`,
  };
}
```

### Navigation

**✅ DO**: Use Next.js Link for client-side navigation

```typescript
import Link from 'next/link';

<Link href="/reports" className="text-primary hover:underline">
  View Reports
</Link>
```

**✅ DO**: Use useRouter for programmatic navigation

```typescript
'use client';
import { useRouter } from 'next/navigation';

function ChatActions() {
  const router = useRouter();

  const handleNewSession = async () => {
    const session = await createSession();
    router.push(`/chat?session=${session.id}`);
  };
}
```

---

## ❌ DON'T

### Route Organization

**❌ DON'T**: Create redundant redirect routes

```typescript
// BAD: src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
export default function DashboardRedirect() {
  redirect('/');
}
```

**Why**: Adds unnecessary files and potential for stale redirects. Use middleware or remove the route.

**❌ DON'T**: Mix concerns in route files

```typescript
// BAD: src/app/(dashboard)/chat/page.tsx
'use client';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  // 500 lines of component logic...
}
```

**Why**: Makes routes hard to test and maintain. Extract to feature modules.

**❌ DON'T**: Use Pages Router patterns in App Router

```typescript
// BAD: Don't use getServerSideProps or getStaticProps
export async function getServerSideProps() { ... }

// GOOD: Use async Server Components or route handlers
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}
```

**Why**: App Router has different data fetching patterns.

### Layouts

**❌ DON'T**: Add heavy providers in nested layouts

```typescript
// BAD: src/app/(dashboard)/chat/layout.tsx
export default function ChatLayout({ children }) {
  return (
    <HeavyProvider>
      <AnotherProvider>
        {children}
      </AnotherProvider>
    </HeavyProvider>
  );
}
```

**Why**: Causes unnecessary re-renders. Keep providers in root layout.

**❌ DON'T**: Duplicate layout structure

```typescript
// BAD: Repeating the same wrapper in multiple layouts
// src/app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return <div className="min-h-screen bg-background"><main>{children}</main></div>;
}

// src/app/(auth)/layout.tsx
export default function AuthLayout({ children }) {
  return <div className="min-h-screen bg-background"><main>{children}</main></div>;
}
```

**Why**: Use a shared layout component or consolidate in root layout.

### API Routes

**❌ DON'T**: Skip authentication middleware

```typescript
// BAD: No auth check
export async function GET(request: NextRequest) {
  const sessions = await db.sessions.findMany();
  return Response.json(sessions);
}

// GOOD: Use auth middleware
export const GET = withAuth(async (request, context) => {
  const sessions = await getSessions(context.userInfo.userId);
  return createSuccessResponse(sessions);
});
```

**Why**: Exposes data to unauthenticated users.

**❌ DON'T**: Return plain Response without standard format

```typescript
// BAD: Inconsistent response format
export async function GET() {
  return Response.json({ data: sessions });
}

// GOOD: Use response helpers
export const GET = withAuth(async (request, context) => {
  return createSuccessResponse(sessions, { requestId: context.requestId });
});
```

**Why**: Inconsistent API responses make frontend error handling harder.

**❌ DON'T**: Use GET for mutations

```typescript
// BAD: Mutation via GET
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('delete')) {
    await deleteSession(searchParams.get('id'));
  }
}

// GOOD: Use appropriate HTTP method
export const DELETE = withAuth(async (request, context, params) => {
  const { sessionId } = await params;
  await deleteSession(sessionId);
  return createSuccessResponse({ success: true });
});
```

**Why**: Violates REST principles, can be triggered by crawlers/prefetch.

### Navigation

**❌ DON'T**: Use anchor tags for internal navigation

```typescript
// BAD: Full page reload
<a href="/reports">View Reports</a>

// GOOD: Client-side navigation
<Link href="/reports">View Reports</Link>
```

**Why**: Loses client-side state and causes full page reloads.

**❌ DON'T**: Hard-code URLs in multiple places

```typescript
// BAD: URL strings everywhere
router.push('/api/sessions');
fetch('/api/sessions');
<Link href="/api/sessions">

// GOOD: Centralize route constants
// src/lib/routes.ts
export const routes = {
  api: {
    sessions: '/api/sessions',
    chat: '/api/chat',
  },
  pages: {
    home: '/',
    reports: '/reports',
    profile: '/profile',
  },
} as const;
```

**Why**: Makes refactoring routes error-prone.

---

## Patterns & Examples

### Pattern 1: Protected Route Group

**Use Case**: Group routes that require authentication with shared layout

**Implementation**:

```typescript
// src/app/(dashboard)/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-4">{children}</main>
    </div>
  );
}
```

**Explanation**:

- Route group `(dashboard)` doesn't affect URL
- Layout checks auth and redirects if needed
- All child routes inherit protection

### Pattern 2: API Route with Validation

**Use Case**: Create API endpoint with request validation and consistent responses

**Implementation**:

```typescript
// src/app/api/sessions/route.ts
import { withValidation, withAuth } from '@/lib/api/api-middleware';
import { createSessionSchema } from '@/lib/utils/validation';
import { createSuccessResponse } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';

// POST /api/sessions - Create new session
export const POST = withValidation(
  createSessionSchema,
  async (_request, context, validatedData) => {
    try {
      const { title } = validatedData;

      const session = await createSession({
        userId: context.userInfo.userId,
        title,
      });

      logger.info('Session created', {
        requestId: context.requestId,
        sessionId: session.id,
      });

      return createSuccessResponse(session, { requestId: context.requestId });
    } catch (error) {
      return enhancedErrorHandlers.handleDatabaseError(error, 'create session', context);
    }
  }
);

// GET /api/sessions - List sessions
export const GET = withAuth(async (request, context) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') ?? '10');
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  const result = await getSessions(context.userInfo.userId, { limit, offset });

  return createSuccessResponse(result, { requestId: context.requestId });
});
```

**Explanation**:

- `withValidation` wraps `withAuth` - validated requests are always authenticated
- Schema validation happens before handler executes
- Consistent error handling and response format

### Pattern 3: Dynamic Route with Params

**Use Case**: Handle routes with URL parameters (Next.js 15+ async params)

**Implementation**:

```typescript
// src/app/api/sessions/[sessionId]/route.ts
import { withAuth } from '@/lib/api/api-middleware';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

export const GET = withAuth(async (_request, context, params) => {
  const { sessionId } = await params;

  // Validate ownership
  const session = await getSession(sessionId);
  if (session.userId !== context.userInfo.userId) {
    return createNotFoundErrorResponse('Session', context.requestId);
  }

  return createSuccessResponse(session, { requestId: context.requestId });
});

export const DELETE = withAuth(async (_request, context, params) => {
  const { sessionId } = await params;

  await deleteSession(sessionId, context.userInfo.userId);

  return createSuccessResponse({ success: true }, { requestId: context.requestId });
});
```

**Explanation**:

- Next.js 15+ requires `await` on params
- Always verify resource ownership
- Support multiple HTTP methods in same file

### Pattern 4: Streaming API Route

**Use Case**: AI chat endpoint with streaming response

**Implementation**:

```typescript
// src/app/api/chat/route.ts
import { withAuthAndRateLimitStreaming } from '@/lib/api/api-middleware';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const POST = withAuthAndRateLimitStreaming(async (req, context) => {
  const { message, sessionId } = await req.json();

  const streamResult = await streamChatCompletion({
    messages: [{ role: 'user', content: message }],
    model: languageModels.default,
  });

  // Return streaming response
  return streamResult.toUIMessageStreamResponse({
    onError: (error) => {
      logger.error('Stream error', { error, requestId: context.requestId });
      return 'An error occurred. Please try again.';
    },
  });
});
```

**Explanation**:

- Use streaming-specific middleware wrapper
- Set `maxDuration` for long-running requests
- Handle stream errors gracefully

### Pattern 5: Page with Server-Side Data

**Use Case**: Page that fetches data on the server

**Implementation**:

```typescript
// src/app/(dashboard)/reports/page.tsx
import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ReportsView } from '@/features/reports/components/reports-view';
import { getReports } from '@/lib/repositories/report-repository';

export const metadata: Metadata = {
  title: 'Reports | AI Therapist',
  description: 'View your therapy session reports',
};

export default async function ReportsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const reports = await getReports(userId);

  return <ReportsView initialReports={reports} />;
}
```

**Explanation**:

- Server Component fetches data directly
- Pass initial data to client component
- Metadata defined for SEO

---

## Common Mistakes

1. **Forgetting to await params in Next.js 15+**
   - Problem: TypeScript error or runtime crash
   - Solution: Always `const { id } = await params;`
   - Example: See Pattern 3 above

2. **Using 'use client' unnecessarily**
   - Problem: Disables server-side rendering benefits
   - Solution: Only add when using hooks, event handlers, or browser APIs
   - Example: Keep data-fetching pages as Server Components

3. **Missing loading states**
   - Problem: Users see blank screen during navigation
   - Solution: Add `loading.tsx` to routes with data fetching
   - Example: See Loading States section

4. **Inconsistent API response formats**
   - Problem: Frontend needs special handling per endpoint
   - Solution: Use `createSuccessResponse` and `createErrorResponse` helpers
   - Example: See Pattern 2 above

---

## Testing Standards

### Page Routes

- Test that pages render without errors
- Test navigation between pages
- Test loading and error states
- Use Playwright for E2E tests

### API Routes

- Unit test with mocked request/response
- Test authentication requirements
- Test validation error responses
- Test success and error cases

```typescript
// __tests__/api/sessions.test.ts
describe('POST /api/sessions', () => {
  it('requires authentication', async () => {
    const response = await POST(mockRequest());
    expect(response.status).toBe(401);
  });

  it('validates request body', async () => {
    const response = await POST(mockAuthenticatedRequest({ title: '' }));
    expect(response.status).toBe(400);
  });

  it('creates session with valid data', async () => {
    const response = await POST(mockAuthenticatedRequest({ title: 'New Session' }));
    expect(response.status).toBe(200);
  });
});
```

---

## Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Clerk Next.js Integration](https://clerk.com/docs/references/nextjs/overview)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

## Changelog

- **2025-11-25**: Initial version based on project analysis
