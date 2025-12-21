# Routing (Next.js App Router)

## Overview
Conventions for Next.js 16 App Router: server-first routes, authenticated groups, async params, and consistent loading/error states.

## When to Apply
- Adding pages, route groups, layouts, loading/error/not-found
- Creating route handlers (API) and streaming endpoints
- Navigation helpers and redirects

## Core Principles
1. **Server-first routes**: Keep pages/layouts as Server Components unless interactivity is needed.
2. **Route groups for structure**: Use `(group)` to share layouts without URL changes.
3. **Async params**: Always `await params` (Next.js 15+).
4. **UX states**: Provide `loading.tsx`, `error.tsx`, and `not-found.tsx` where data is fetched.
5. **Feature-first**: Keep route components thin; delegate to feature modules.

## ✅ DO
### Route organization
**✅ DO**: Use groups for auth vs app.
```txt
src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
src/app/(dashboard)/chat/page.tsx
```

### Thin route files
**✅ DO**:
```tsx
// src/app/(dashboard)/chat/page.tsx
import { ChatPage } from '@/features/chat/components/chat-page';
export default function Page() { return <ChatPage />; }
```

### Loading/error states
**✅ DO**: Add `loading.tsx` and `error.tsx` in route groups with data fetching.

### Dynamic params
**✅ DO**:
```ts
interface Props { params: Promise<{ sessionId: string }>; }
export default async function Page({ params }: Props) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  return <SessionView session={session} />;
}
```

### Metadata
**✅ DO**: Export `metadata` or `generateMetadata` for SEO/social.

## ❌ DON'T
### Client-first pages
**❌ DON'T**: Add `'use client'` to top-level pages without interactivity.

### Mixing concerns
**❌ DON'T**: Put heavy data fetching + UI + logic in the route file; delegate to feature components/hooks.

### Missing UX states
**❌ DON'T**: Ship data-fetching routes without `loading.tsx` and `error.tsx`.

### Forgetting async params
**❌ DON'T**: Destructure `params` synchronously (`const { id } = params`) in Next 15+.

### GET for mutations
**❌ DON'T**: Use GET to mutate data in route handlers.

## Patterns & Examples
### Pattern: Protected route group
```tsx
// src/app/(dashboard)/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return <DashboardShell>{children}</DashboardShell>;
}
```

### Pattern: Route handler with validation
```ts
export async function POST(req: NextRequest) {
  const body = schema.parse(await req.json());
  const result = await createSession(body);
  return NextResponse.json(result, { status: 201 });
}
```

### Pattern: Streaming endpoint
```ts
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const stream = await streamChat(message);
  return stream.toAIStreamResponse();
}
```

## Common Mistakes
1. Forgetting to await params → runtime errors.
2. Using Pages Router patterns (`getServerSideProps`) → not supported in App Router.
3. No loading/error states → poor UX.
4. Heavy client layouts/providers in nested groups → move to root where possible.
5. Hard-coded URLs in multiple places → centralize in route constants.

## Testing Standards
- RTL/Playwright: verify navigation, loading, and error states.
- API route handlers: unit test validation/auth branches.

## Resources
- Next.js App Router & route handlers
- Clerk middleware/auth for App Router
- Vercel AI SDK streaming
