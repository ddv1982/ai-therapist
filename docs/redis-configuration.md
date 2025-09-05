# Redis Configuration Guide

This document outlines the Redis caching configuration for the AI Therapist application.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# Cache Configuration
CACHE_ENABLED="true"
CACHE_DEFAULT_TTL="300"
CACHE_SESSION_TTL="1800"
CACHE_MESSAGE_TTL="900"
```

## Redis Setup

### Local Development

1. **Install Redis locally:**
   ```bash
   # macOS with Homebrew
   brew install redis
   
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # Windows with WSL
   sudo apt-get install redis-server
   ```

2. **Start Redis server:**
   ```bash
   redis-server
   ```

3. **Verify Redis is running:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

### Production Setup

1. **Using Redis Cloud (Recommended):**
   - Sign up at [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
   - Create a new database
   - Copy the connection URL to `REDIS_URL`

2. **Using Docker:**
   ```bash
   docker run -d --name redis -p 6379:6379 redis:alpine
   ```

3. **Using AWS ElastiCache:**
   - Create an ElastiCache Redis cluster
   - Configure security groups
   - Update connection settings

## Cache Configuration

### TTL Settings

The application uses different TTL (Time To Live) values for different data types:

- **Session Data**: 30 minutes
- **Messages**: 15 minutes
- **CBT Data**: 1 hour
- **Reports**: 2 hours
- **User Sessions**: 10 minutes
- **Auth Config**: 5 minutes
- **Device Info**: 20 minutes
- **Therapy Prompts**: 24 hours

### Cache Keys

Cache keys are namespaced with the following patterns:

- `therapist:session:{sessionId}`
- `therapist:messages:{sessionId}:page:{page}`
- `therapist:cbt:{sessionId}`
- `therapist:report:{sessionId}:{reportId}`
- `therapist:user_session:{userId}`
- `therapist:auth:config`
- `therapist:device:{deviceId}`
- `therapist:therapy_prompt:{type}`

## Usage Examples

### Basic Caching

```typescript
import { cache } from '@/lib/cache';

// Get data from cache
const data = await cache.get('my-key');

// Set data in cache
await cache.set('my-key', { data: 'value' }, {}, { ttl: 300 });

// Delete from cache
await cache.delete('my-key');
```

### Session-Specific Caching

```typescript
import { SessionCache } from '@/lib/cache';

// Get session data
const session = await SessionCache.get('session-123');

// Set session data
await SessionCache.set('session-123', { userId: 'user-456' });

// Invalidate session cache
await SessionCache.invalidate('session-123');
```

### Using Decorators

```typescript
import { Cached, withApiCache } from '@/lib/cache';

// Method decorator
class MyService {
  @Cached({ ttl: 300 })
  async getData(id: string) {
    // Expensive operation
    return await this.fetchFromDatabase(id);
  }
}

// API route wrapper
const handler = withApiCache(
  (request) => `api:${request.url}`,
  { ttl: 600 }
)(async (request) => {
  // API logic
  return { data: 'response' };
});
```

## Monitoring

### Health Checks

```typescript
import { CacheHealthMonitor } from '@/lib/cache';

// Get cache health information
const health = await CacheHealthMonitor.getHealthInfo();
console.log(health);
```

### Statistics

```typescript
import { cache } from '@/lib/cache';

// Get cache statistics
const stats = cache.getStats();
console.log(stats);
```

## Performance Considerations

1. **Memory Usage**: Monitor Redis memory usage and set appropriate limits
2. **Key Expiration**: Use appropriate TTL values to prevent memory bloat
3. **Connection Pooling**: The Redis client uses connection pooling for efficiency
4. **Error Handling**: The system gracefully degrades when Redis is unavailable

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if Redis server is running
2. **Authentication Failed**: Verify Redis password configuration
3. **Memory Issues**: Check Redis memory usage and eviction policies
4. **Slow Performance**: Monitor Redis slow log and optimize queries

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL="debug"
```

This will provide detailed cache operation logs.

## Security Considerations

1. **Network Security**: Use TLS in production
2. **Authentication**: Set strong Redis passwords
3. **Access Control**: Restrict Redis access to application servers only
4. **Data Encryption**: Sensitive data is filtered from cache logs

## Migration from No-Cache

The caching system is designed to be backward compatible. If Redis is unavailable, the application will continue to function without caching, but with reduced performance.

To disable caching temporarily:

```bash
CACHE_ENABLED="false"
```
