/**
 * Development Request/Response Logging
 *
 * Provides logging middleware for API calls in development mode.
 * Includes timing information, request/response details, and sensitive data redaction.
 *
 * @module devLogging
 * @fileoverview Development-only API logging utilities
 *
 * ## Features
 *
 * - Request/response logging in development mode only
 * - Automatic sensitive data redaction
 * - Timing information for performance analysis
 * - Toggle via DEV_API_LOGGING environment variable
 *
 * @example
 * ```typescript
 * // Wrap fetch calls with logging
 * const response = await loggedFetch('/api/sessions', {
 *   method: 'POST',
 *   body: JSON.stringify({ title: 'New Session' }),
 * });
 *
 * // Or use the decorator pattern
 * const apiClientWithLogging = withApiLogging(apiClient);
 * ```
 */

import { isDevelopment } from '@/config/env.public';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Check if API logging is enabled
 * Defaults to true in development, false otherwise
 */
export function isApiLoggingEnabled(): boolean {
  if (!isDevelopment) return false;

  // Check for explicit override
  if (typeof window !== 'undefined') {
    // Client-side: check localStorage for toggle
    try {
      const stored = localStorage.getItem('DEV_API_LOGGING');
      if (stored !== null) return stored === 'true';
    } catch {
      // localStorage not available
    }
  }

  // Server-side: check environment variable
  if (typeof process !== 'undefined' && process.env) {
    const envValue = process.env.DEV_API_LOGGING;
    if (envValue !== undefined) return envValue === 'true';
  }

  // Default: enabled in development
  return isDevelopment;
}

/**
 * Enable or disable API logging at runtime (client-side only)
 */
export function setApiLoggingEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('DEV_API_LOGGING', String(enabled));
    } catch {
      // localStorage not available
    }
  }
}

// ============================================================================
// Sensitive Data Redaction
// ============================================================================

/**
 * Keys that contain sensitive data and should be redacted
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'apiKey',
  'api_key',
  'authorization',
  'auth',
  'credential',
  'credentials',
  'sessionKey',
  'refreshToken',
  'accessToken',
  'access_token',
  'refresh_token',
  'csrfToken',
  'csrf_token',
  'totpSecret',
  'totp_secret',
  'content', // Therapeutic content
  'message', // Chat messages
  'messages',
  'therapeuticContent',
  'sessionData',
  'chatHistory',
  'emotion',
  'emotions',
  'thought',
  'thoughts',
  'belief',
  'beliefs',
]);

/**
 * Headers that should be redacted
 */
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-csrf-token',
]);

/**
 * Redact sensitive values from an object
 */
export function redactSensitiveData(data: unknown, depth = 0, maxDepth = 5): unknown {
  if (depth > maxDepth) return '[MAX_DEPTH_EXCEEDED]';
  if (data === null || data === undefined) return data;

  // Redact strings that look sensitive
  if (typeof data === 'string') {
    // Redact long strings (likely content)
    if (data.length > 200) {
      return `[REDACTED_STRING:${data.length}chars]`;
    }
    // Redact JWT tokens
    if (data.match(/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/)) {
      return '[REDACTED_JWT]';
    }
    // Redact bearer tokens
    if (data.toLowerCase().startsWith('bearer ')) {
      return 'Bearer [REDACTED]';
    }
    return data;
  }

  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    // For large arrays, just show count
    if (data.length > 10) {
      return `[ARRAY:${data.length}items]`;
    }
    return data.map((item) => redactSensitiveData(item, depth + 1, maxDepth));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();

    // Redact sensitive keys
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = '[REDACTED]';
    } else if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token')
    ) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactSensitiveData(value, depth + 1, maxDepth);
    }
  }

  return result;
}

/**
 * Redact sensitive headers
 */
export function redactHeaders(
  headers: Headers | Record<string, string> | undefined
): Record<string, string> {
  if (!headers) return {};

  const result: Record<string, string> = {};

  const entries: Iterable<[string, string]> =
    headers instanceof Headers ? headers.entries() : Object.entries(headers);

  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.has(lowerKey)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ============================================================================
// Log Entry Types
// ============================================================================

export interface ApiLogEntry {
  type: 'request' | 'response' | 'error';
  timestamp: string;
  method: string;
  url: string;
  requestId?: string;
  duration?: number;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
  error?: {
    message: string;
    name: string;
  };
}

// ============================================================================
// Logging Functions
// ============================================================================

/**
 * Format and log an API log entry
 */
function logApiEntry(entry: ApiLogEntry): void {
  if (!isApiLoggingEnabled()) return;

  const prefix = entry.type === 'request' ? '→' : entry.type === 'response' ? '←' : '✕';
  const color =
    entry.type === 'request'
      ? '\x1b[36m' // Cyan
      : entry.type === 'response'
        ? entry.status && entry.status >= 400
          ? '\x1b[31m' // Red for errors
          : '\x1b[32m' // Green for success
        : '\x1b[31m'; // Red for errors
  const reset = '\x1b[0m';

  // Determine which console to use based on environment
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    // Browser-friendly logging with grouping
    const groupLabel = `${prefix} ${entry.method} ${entry.url}${
      entry.duration ? ` (${entry.duration}ms)` : ''
    }${entry.status ? ` [${entry.status}]` : ''}`;

    // Use console.groupCollapsed for cleaner output
    // eslint-disable-next-line no-console
    console.groupCollapsed(groupLabel);
    // eslint-disable-next-line no-console
    console.log('Timestamp:', entry.timestamp);
    if (entry.requestId) {
      // eslint-disable-next-line no-console
      console.log('Request ID:', entry.requestId);
    }
    if (entry.headers && Object.keys(entry.headers).length > 0) {
      // eslint-disable-next-line no-console
      console.log('Headers:', entry.headers);
    }
    if (entry.body !== undefined) {
      // eslint-disable-next-line no-console
      console.log('Body:', entry.body);
    }
    if (entry.error) {
      // eslint-disable-next-line no-console
      console.error('Error:', entry.error);
    }
    // eslint-disable-next-line no-console
    console.groupEnd();
  } else {
    // Server-side logging (JSON format for log aggregation)
    const logData = {
      ...entry,
      _devApiLog: true, // Marker for filtering
    };
    // eslint-disable-next-line no-console
    console.log(
      `${color}[API ${entry.type.toUpperCase()}]${reset}`,
      JSON.stringify(logData, null, 2)
    );
  }
}

/**
 * Log an outgoing API request
 */
export function logRequest(
  method: string,
  url: string,
  options: {
    headers?: Headers | Record<string, string>;
    body?: unknown;
    requestId?: string;
  } = {}
): void {
  if (!isApiLoggingEnabled()) return;

  const entry: ApiLogEntry = {
    type: 'request',
    timestamp: new Date().toISOString(),
    method: method.toUpperCase(),
    url,
    requestId: options.requestId,
    headers: redactHeaders(options.headers),
    body: options.body ? redactSensitiveData(options.body) : undefined,
  };

  logApiEntry(entry);
}

/**
 * Log an API response
 */
export function logResponse(
  method: string,
  url: string,
  response: {
    status: number;
    statusText?: string;
    headers?: Headers | Record<string, string>;
    body?: unknown;
    requestId?: string;
    startTime?: number;
  }
): void {
  if (!isApiLoggingEnabled()) return;

  const entry: ApiLogEntry = {
    type: 'response',
    timestamp: new Date().toISOString(),
    method: method.toUpperCase(),
    url,
    status: response.status,
    statusText: response.statusText,
    requestId: response.requestId,
    duration: response.startTime ? Date.now() - response.startTime : undefined,
    headers: redactHeaders(response.headers),
    body: response.body ? redactSensitiveData(response.body) : undefined,
  };

  logApiEntry(entry);
}

/**
 * Log an API error
 */
export function logApiError(
  method: string,
  url: string,
  error: Error,
  options: {
    requestId?: string;
    startTime?: number;
  } = {}
): void {
  if (!isApiLoggingEnabled()) return;

  const entry: ApiLogEntry = {
    type: 'error',
    timestamp: new Date().toISOString(),
    method: method.toUpperCase(),
    url,
    requestId: options.requestId,
    duration: options.startTime ? Date.now() - options.startTime : undefined,
    error: {
      message: error.message,
      name: error.name,
    },
  };

  logApiEntry(entry);
}

// ============================================================================
// Fetch Wrapper
// ============================================================================

/**
 * Wrapper around fetch that adds development logging
 *
 * @example
 * ```typescript
 * const response = await loggedFetch('/api/sessions', {
 *   method: 'POST',
 *   body: JSON.stringify({ title: 'New Session' }),
 * });
 * ```
 */
export async function loggedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  const startTime = Date.now();
  const requestId =
    (init?.headers as Record<string, string> | undefined)?.['X-Request-Id'] ||
    `log-${Date.now().toString(36)}`;

  // Parse body for logging if it's a string (JSON)
  let bodyForLogging: unknown;
  if (init?.body && typeof init.body === 'string') {
    try {
      bodyForLogging = JSON.parse(init.body);
    } catch {
      bodyForLogging = '[UNPARSEABLE_BODY]';
    }
  }

  // Log request
  logRequest(method, url, {
    headers: init?.headers as Headers | Record<string, string> | undefined,
    body: bodyForLogging,
    requestId,
  });

  try {
    const response = await fetch(input, init);

    // Clone response to read body for logging
    let responseBody: unknown;
    try {
      const cloned = response.clone();
      const contentType = cloned.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await cloned.json();
      }
    } catch {
      // Couldn't parse response body
    }

    // Log response
    logResponse(method, url, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      body: responseBody,
      requestId,
      startTime,
    });

    return response;
  } catch (error) {
    // Log error
    logApiError(method, url, error instanceof Error ? error : new Error(String(error)), {
      requestId,
      startTime,
    });

    throw error;
  }
}

// ============================================================================
// API Client Decorator
// ============================================================================

/**
 * Create a logging decorator for API client methods
 *
 * @example
 * ```typescript
 * const loggedMethod = createLoggingDecorator('createSession');
 * const originalMethod = apiClient.createSession.bind(apiClient);
 * apiClient.createSession = loggedMethod(originalMethod);
 * ```
 */
export function createLoggingDecorator<TArgs extends unknown[], TResult>(
  methodName: string
): (fn: (...args: TArgs) => Promise<TResult>) => (...args: TArgs) => Promise<TResult> {
  return (fn: (...args: TArgs) => Promise<TResult>) => {
    return async (...args: TArgs): Promise<TResult> => {
      if (!isApiLoggingEnabled()) {
        return fn(...args);
      }

      const startTime = Date.now();
      const requestId = `${methodName}-${Date.now().toString(36)}`;

      // Log invocation
      logRequest('CALL', methodName, {
        requestId,
        body: redactSensitiveData(args),
      });

      try {
        const result = await fn(...args);

        // Log result
        logResponse('CALL', methodName, {
          status: 200,
          body: redactSensitiveData(result),
          requestId,
          startTime,
        });

        return result;
      } catch (error) {
        logApiError('CALL', methodName, error instanceof Error ? error : new Error(String(error)), {
          requestId,
          startTime,
        });
        throw error;
      }
    };
  };
}

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Get recent API logs (browser only, requires storage)
 * This is a placeholder for potential future implementation
 */
export function getRecentApiLogs(): ApiLogEntry[] {
  // Future: Could store logs in memory or localStorage for debugging
  return [];
}

/**
 * Clear stored API logs
 */
export function clearApiLogs(): void {
  // Future: Clear stored logs
}

/**
 * Export logs for debugging
 */
export function exportApiLogs(): string {
  const logs = getRecentApiLogs();
  return JSON.stringify(logs, null, 2);
}
