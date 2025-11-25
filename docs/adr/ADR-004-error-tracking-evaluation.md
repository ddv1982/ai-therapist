# ADR-004: Error Tracking Service Evaluation

## Status

Accepted

## Date

2024-11-25

## Context

Production applications require visibility into errors, crashes, and performance issues that users encounter. Without centralized error tracking, issues may go unnoticed until users report them, leading to poor user experience and difficulty debugging.

The AI Therapist application handles sensitive therapeutic content, so any error tracking solution must balance observability needs with strict privacy requirements. HIPAA-like considerations apply even though this is not a medical application—we must not inadvertently expose therapeutic content through error logs.

## Decision

We evaluated several error tracking services and recommend **conditional adoption of Sentry** with strict data filtering, pending privacy review.

### Options Evaluated

| Service                         | Pros                                                                                                     | Cons                                                                | Monthly Cost (Estimated)              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| **Sentry**                      | Industry standard, excellent stack traces, Next.js integration, replay sessions, good TypeScript support | Requires careful PII filtering, potential data residency concerns   | Free tier: 5K errors/mo; Team: $26/mo |
| **LogRocket**                   | Session replay, performance monitoring, combined with error tracking                                     | More expensive, heavier client bundle, privacy concerns with replay | $99/mo starting                       |
| **Bugsnag**                     | Good grouping, stability scores, release tracking                                                        | Less Next.js specific, more expensive                               | $59/mo starting                       |
| **Highlight.io**                | Open source option available, session replay, full-stack monitoring                                      | Newer, smaller community                                            | Free tier available; $150/mo team     |
| **Self-hosted (Sentry)**        | Full data control, no external data transfer                                                             | Operational overhead, infrastructure cost                           | Infrastructure costs only             |
| **Custom Logger + Aggregation** | Complete control, use existing logger                                                                    | No stack traces, no grouping, manual setup                          | Depends on log aggregation service    |

### Recommended Approach

1. **Phase 1 (Current)**: Continue with enhanced structured logging
   - Our existing `logger.ts` already filters sensitive data
   - Add log aggregation via Vercel Logs or similar
   - Monitor for patterns that indicate need for full error tracking

2. **Phase 2 (If needed)**: Implement Sentry with strict configuration
   - Enable only after privacy review
   - Configure `beforeSend` to filter all therapeutic content
   - Disable session replay initially
   - Use `denyUrls` to prevent capturing sensitive routes

### Privacy Requirements for Error Tracking

Any error tracking implementation MUST:

1. **Filter therapeutic content** - No user messages, session reports, or therapy data
2. **Redact PII** - Email, names, session IDs must be scrubbed
3. **Limit stack traces** - No variable values containing user content
4. **Secure transmission** - TLS only, no plaintext
5. **Data retention** - Maximum 30 days, preferably less
6. **User consent** - Clear privacy policy disclosure

### Implementation Guidance (If Sentry is Adopted)

```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

const SENSITIVE_PATHS = ['/api/chat', '/api/sessions', '/api/reports'];

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1, // Low sampling for privacy
    environment: process.env.NODE_ENV,

    beforeSend(event) {
      // Filter events from sensitive routes
      const url = event.request?.url;
      if (url && SENSITIVE_PATHS.some((path) => url.includes(path))) {
        return null;
      }

      // Remove all breadcrumbs that might contain user content
      event.breadcrumbs = event.breadcrumbs?.filter(
        (b) => b.category !== 'console' && b.category !== 'xhr'
      );

      // Remove request body
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
      }

      return event;
    },

    // Disable features that capture user content
    integrations: (integrations) => integrations.filter((i) => i.name !== 'Replay'),
  });
}
```

## Consequences

### Positive

- Clear decision framework for error tracking
- Privacy requirements documented upfront
- Phased approach reduces initial complexity
- Existing logging already handles sensitive data filtering

### Negative

- Deferred error tracking means less visibility initially
- Manual log analysis required until Phase 2
- May miss some errors that would be caught by automatic tracking

### Neutral

- Cost is minimal with current approach
- Team must revisit decision as application scales

## Alternatives Considered

1. **Immediate Sentry adoption** - Rejected due to privacy review requirements
2. **LogRocket for session replay** - Rejected due to cost and privacy concerns with replay
3. **No error tracking** - Rejected; some visibility is needed
4. **Self-hosted only** - Deferred; operational overhead not justified yet

## Cost Analysis

| Approach               | Monthly Cost | Notes                          |
| ---------------------- | ------------ | ------------------------------ |
| Current (logging only) | $0           | Uses existing infrastructure   |
| Sentry Free Tier       | $0           | 5K errors, 1 user              |
| Sentry Team            | $26          | 50K errors, unlimited users    |
| LogRocket              | $99+         | Includes replay                |
| Self-hosted Sentry     | $50-200      | Server costs, maintenance time |

**Recommendation**: Start with free tier when privacy review complete.

## References

- [Sentry Privacy & Security](https://sentry.io/security/)
- [Sentry Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [HIPAA and Error Tracking](https://sentry.io/for/healthcare/)
- [Data Scrubbing in Sentry](https://docs.sentry.io/product/data-management-settings/scrubbing/)
