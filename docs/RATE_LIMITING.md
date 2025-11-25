# Rate Limiting Analysis & Design

This document evaluates the current rate limiting implementation and provides recommendations for scaling.

## Current Implementation

### Location

- `src/lib/api/rate-limiter.ts` - Core rate limiter class
- `src/lib/api/middleware.ts` - Rate limiting middleware

### Architecture

The current implementation uses an **in-memory rate limiter** with the following characteristics:

| Aspect      | Current State            |
| ----------- | ------------------------ |
| Storage     | In-memory Map            |
| Persistence | None (resets on restart) |
| Scaling     | Single-instance only     |
| Buckets     | default, api, chat       |

### Configuration

Environment variables (from `src/config/env.ts`):

```
RATE_LIMIT_WINDOW_MS    - Default window (5 min default)
RATE_LIMIT_MAX_REQS     - Default max requests (50 default)
RATE_LIMIT_BLOCK_MS     - Block duration (5 min default)
API_WINDOW_MS           - API-specific window
API_MAX_REQS            - API-specific limit
CHAT_WINDOW_MS          - Chat-specific window
CHAT_MAX_REQS           - Chat-specific limit
CHAT_MAX_CONCURRENCY    - Max concurrent chat streams
```

### Current Limits

| Bucket  | Window | Max Requests | Block Duration |
| ------- | ------ | ------------ | -------------- |
| default | 5 min  | 50           | 5 min          |
| api     | 5 min  | 50           | 5 min          |
| chat    | 5 min  | 20           | 5 min          |

### IP Exemptions

The following IPs are exempt from rate limiting (development only):

- `localhost`, `127.0.0.1`, `::1`
- Private networks: `10.x.x.x`, `192.168.x.x`, `172.16-31.x.x`
- Unknown IPs

**Note**: In production, no IPs are exempt.

## Scaling Requirements Analysis

### Current Deployment

The application currently runs on:

- **Vercel** (serverless functions)
- **Single region deployment**

### Scaling Considerations

1. **Serverless Architecture**: Each function invocation is stateless
2. **Cold Starts**: Rate limiter state is lost between cold starts
3. **Horizontal Scaling**: In-memory storage doesn't share state

### When Distributed Rate Limiting is Needed

Distributed rate limiting (e.g., Redis) becomes necessary when:

| Scenario                | Current         | With Redis      |
| ----------------------- | --------------- | --------------- |
| Single instance         | ✅ Works        | ✅ Works        |
| Multi-instance          | ❌ Inconsistent | ✅ Shared state |
| Serverless              | ⚠️ Limited      | ✅ Persistent   |
| Geographic distribution | ❌ No state     | ✅ Global state |

## Redis Option Evaluation

### Recommended Service: Upstash Redis

[Upstash](https://upstash.com) is recommended for serverless Redis:

**Pros:**

- Pay-per-request pricing (no idle costs)
- Global replication available
- Native REST API (no TCP connections)
- Edge-compatible
- Free tier available

**Cons:**

- Added latency (~1-5ms per request)
- External dependency
- Cost at scale

### Implementation Approach

```typescript
// Proposed: src/lib/api/rate-limiter-redis.ts
import { Redis } from '@upstash/redis';

export class RedisRateLimiter {
  constructor(private redis: Redis) {}

  async check(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, windowSec);
    }

    const ttl = await this.redis.ttl(key);

    return {
      allowed: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      reset: Math.ceil(Date.now() / 1000) + ttl,
    };
  }
}
```

### Cost Analysis (Upstash)

| Usage             | Free Tier | Pay-as-you-go |
| ----------------- | --------- | ------------- |
| Up to 10K req/day | $0        | $0            |
| 100K req/day      | $0.20/day | ~$6/month     |
| 1M req/day        | N/A       | ~$60/month    |

## Decision & Rationale

### Current Decision: **Keep In-Memory Rate Limiting**

**Rationale:**

1. **Current Scale**: Single-instance deployment doesn't require distributed state
2. **Acceptable Trade-offs**:
   - Cold start resets are rare and not exploitable
   - Users don't notice rate limit state loss
3. **Simplicity**: No external dependencies to manage
4. **Cost**: Zero additional cost

### When to Upgrade to Redis

Consider upgrading when:

- [ ] Multi-region deployment is needed
- [ ] Consistent rate limiting across instances is required
- [ ] Abuse patterns require persistent tracking
- [ ] Geographic load balancing is implemented

### Migration Path

When ready to upgrade:

1. Add Upstash Redis as a dependency:

   ```bash
   npm install @upstash/redis
   ```

2. Create `RedisRateLimiter` class (see implementation above)

3. Add environment variables:

   ```
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   ```

4. Update middleware to use Redis limiter when configured:
   ```typescript
   const limiter = process.env.UPSTASH_REDIS_REST_URL
     ? new RedisRateLimiter(redis)
     : new InMemoryRateLimiter();
   ```

## Rate Limit Headers

The application now includes standard rate limit headers:

| Header                  | Description                          |
| ----------------------- | ------------------------------------ |
| `X-RateLimit-Limit`     | Maximum requests allowed in window   |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset`     | Unix timestamp when window resets    |
| `Retry-After`           | Seconds to wait (when rate limited)  |

### Client Usage

```typescript
// Example: Reading rate limit headers
const response = await fetch('/api/chat', { ... });

const limit = response.headers.get('X-RateLimit-Limit');
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');

if (remaining === '0') {
  const retryAfter = new Date(Number(reset) * 1000);
  console.log(`Rate limited. Try again at ${retryAfter}`);
}
```

## Progressive Rate Limiting

### Current Implementation

The current implementation uses a simple block-after-exceed model:

1. Track requests in a sliding window
2. Block for `blockDuration` after exceeding limit
3. Reset after block expires

### Evaluation: Progressive Penalties

Progressive rate limiting (escalating penalties) is **not currently needed** because:

1. **Abuse is rare**: Therapeutic chat application with authenticated users
2. **Existing protection is sufficient**: 5-minute block is adequate
3. **Complexity vs. benefit**: Added complexity with minimal security gain

### When to Implement Progressive Limits

Consider implementing when:

- [ ] Repeated abuse patterns are detected
- [ ] Bot traffic becomes a problem
- [ ] API is exposed publicly

### Proposed Progressive Model (Future)

If needed, implement escalating penalties:

| Violation         | Block Duration |
| ----------------- | -------------- |
| 1st               | 5 minutes      |
| 2nd (within 24h)  | 15 minutes     |
| 3rd (within 24h)  | 1 hour         |
| 4th+ (within 24h) | 24 hours       |

## Related Files

- `src/lib/api/rate-limiter.ts` - Rate limiter implementation
- `src/lib/api/middleware.ts` - Rate limiting middleware
- `src/config/env.ts` - Rate limit configuration
- `__tests__/lib/rate-limiter.test.ts` - Rate limiter tests
