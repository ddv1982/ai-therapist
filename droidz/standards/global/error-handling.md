# Error Handling

## Overview
Consistent patterns for capturing, mapping, logging, and surfacing errors across Next.js (App Router), Convex, and client hooks—without leaking sensitive therapeutic data.

## When to Apply
- API routes, server actions, Convex functions
- Encryption/decryption, AI calls, external APIs
- Client hooks/services with network or parsing risk
- Any user input parsing (Zod) and form handling

## Core Principles
1. **Fail safe**: Prefer safe defaults; block risky actions on uncertainty.
2. **No PHI in logs**: Never log decrypted content or tokens; log IDs and codes.
3. **Typed errors**: Map unknown errors to a small set of typed codes.
4. **Boundary handling**: Validate at edges; surface friendly UI messages.
5. **Bounded retries**: Retry only idempotent operations with caps and jitter.

## ✅ DO
### Use typed mappers
**✅ DO**: Normalize errors before responding.
```ts
type AppError = { code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'VALIDATION' | 'NOT_FOUND' | 'SERVER'; message: string };

export function toAppError(err: unknown): AppError {
  if (err instanceof ZodError) return { code: 'VALIDATION', message: 'Invalid input' };
  if ((err as Error)?.message === 'UNAUTHENTICATED') return { code: 'UNAUTHENTICATED', message: 'Sign in required' };
  return { code: 'SERVER', message: 'Something went wrong' };
}
```

### Log safely
**✅ DO**: Redact sensitive fields.
```ts
logger.error('convex:messages.create', {
  sessionId,
  userId,
  error: err instanceof Error ? err.message : 'unknown',
});
```

### Validate inputs
**✅ DO**: Parse before use.
```ts
const payload = schema.parse(await req.json());
```

### UI-friendly messaging
**✅ DO**: Show concise, actionable errors.
```tsx
if (error) {
  return <ErrorState title="We hit a snag" message="Please retry. If it persists, contact support." />;
}
```

### Guard critical ops
**✅ DO**: Wrap encryption/Convex/AI calls.
```ts
try {
  const ciphertext = encrypt(content);
  await ctx.runMutation(api.messages.create, { ciphertext });
} catch (err) {
  logger.error('messages.create', { sessionId, err });
  throw new Error('SAVE_FAILED');
}
```

## ❌ DON'T
### Leak data
**❌ DON'T**: Log decrypted text, tokens, or PII.
```ts
logger.debug('payload', { content });
```

### Swallow errors
**❌ DON'T**: Empty catches.
```ts
try { await doWork(); } catch (_) {}
```

### Expose internals to users
**❌ DON'T**: Return stack traces or raw error objects.
```ts
return NextResponse.json(err, { status: 500 });
```

### Unbounded retries
**❌ DON'T**: Infinite loops on failure.
```ts
while (true) await callApi();
```

### Mix domains
**❌ DON'T**: Conflate validation with auth errors.
```ts
if (!res.ok) throw new Error('validation');
```

## Patterns & Examples
### Pattern: API handler with validation + mapped errors
```ts
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const result = await createReport(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const appErr = toAppError(err);
    logger.error('api/reports', { code: appErr.code, err });
    const status = appErr.code === 'VALIDATION' ? 400 : appErr.code === 'UNAUTHENTICATED' ? 401 : 500;
    return NextResponse.json({ error: appErr.message }, { status });
  }
}
```

### Pattern: Client hook with typed states
```ts
export function useReports(sessionId: string) {
  return useQuery({
    queryKey: ['reports', sessionId],
    queryFn: () => fetchReports(sessionId),
    retry: 1,
    meta: { errorMap: toAppError },
  });
}
```

## Common Mistakes
1. Logging decrypted content → redact; log IDs only.
2. Returning 200 on failure → set appropriate status (400/401/403/404/500).
3. Rethrowing raw Zod errors → map to user-friendly messages.
4. Missing try/catch around Convex/AI/encryption → wrap and log.
5. Using `console.error` in prod code → use structured logger.

## Testing Standards
- Unit-test error mappers and validation branches.
- Assert UI shows friendly text, not internal codes or stacks.
- Mock failure paths in hooks/services (network, validation, 500).

## Pattern: Error boundary with recovery
**✅ DO**: Use error boundaries with retry capability.
```tsx
'use client';

import { useEffect, startTransition } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error monitoring service
    logger.error('error-boundary', { 
      message: error.message, 
      digest: error.digest 
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">
        We encountered an error. Please try again.
      </p>
      <button
        onClick={() => startTransition(() => reset())}
        className="btn btn-primary"
      >
        Try again
      </button>
    </div>
  );
}
```

## Pattern: Async error handling with useTransition
**✅ DO**: Handle errors in transitions gracefully.
```tsx
'use client';

import { useTransition, useState } from 'react';

export function ActionButton({ action }: { action: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed');
      }
    });
  };

  return (
    <div>
      <button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Processing...' : 'Submit'}
      </button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
```

## Resources
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- Convex error patterns
- [Zod error formatting](https://zod.dev/ERROR_HANDLING)
