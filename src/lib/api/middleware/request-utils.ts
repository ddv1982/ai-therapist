import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import type { RequestContext } from '@/lib/api/middleware/factory';

// Safely reads a header value from a Headers object or a plain object (case-insensitive)
export function readHeaderValue(
  headers: Headers | Record<string, string | string[] | undefined> | undefined,
  name: string
): string | undefined {
  try {
    if (!headers) return undefined;
    if (headers instanceof Headers) {
      return headers.get(name) || headers.get(name.toLowerCase()) || undefined;
    }
    const map = headers as Record<string, string | string[] | undefined>;
    const direct = map[name] || map[name.toLowerCase()];
    if (Array.isArray(direct)) return String(direct[0]);
    return direct !== undefined ? String(direct) : undefined;
  } catch {
    return undefined;
  }
}

// Extracts the client IP address from request headers
export function getClientIPFromRequest(request: NextRequest): string {
  // Prefer explicit proxy headers when present
  const forwarded = readHeaderValue(request.headers, 'x-forwarded-for');
  if (forwarded && typeof forwarded === 'string') {
    const first = forwarded
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)[0];
    if (first) return first;
  }

  const realIP = readHeaderValue(request.headers, 'x-real-ip');
  if (realIP && typeof realIP === 'string' && realIP.trim().length > 0) {
    return realIP.trim();
  }

  // Fallback to request.ip if provided by runtime
  const ip = (request as { ip?: string | null }).ip;
  return (ip && ip.length > 0) ? ip : 'unknown';
}

// Safely extracts request context information from a raw request logger result
export function toRequestContext(raw: unknown, fallbackRequestId: string = 'unknown'): RequestContext {
  const obj = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {};
  return {
    requestId: (obj.requestId as string) || fallbackRequestId,
    method: obj.method as string | undefined,
    url: obj.url as string | undefined,
    userAgent: obj.userAgent as string | undefined,
  };
}

// Sets standard response headers (X-Request-Id, Server-Timing) on a Response
export function setResponseHeaders(response: NextResponse | Response, requestId: string, durationMs?: number): void {
  try {
    response.headers.set('X-Request-Id', requestId);
    if (durationMs !== undefined) {
      response.headers.set('Server-Timing', `total;dur=${durationMs}`);
    }
  } catch (error) {
    logger.warn('Failed to set response headers', { requestId, error: (error as Error).message });
  }
}


