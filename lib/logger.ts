/**
 * Structured logging utility for better error tracking and debugging
 * 
 * Provides comprehensive logging capabilities with context tracking,
 * error handling, and development-friendly formatting.
 * 
 * @fileoverview Logging system for AI Therapist application
 * @author AI Therapist Team
 * @version 1.0.0
 */

import { generateRequestId } from './crypto-secure';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface ErrorWithCode extends Error {
  code?: string | number;
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  apiEndpoint?: string;
  userAgent?: string;
  timestamp?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    const { level, message, context, error, timestamp } = entry;
    
    const logData = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && { 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };

    return JSON.stringify(logData, null, this.isDevelopment ? 2 : 0);
  }

  /**
   * Core logging method that formats and outputs log entries
   * 
   * @private
   * @param level - Log severity level
   * @param message - Human-readable log message
   * @param context - Additional context information
   * @param error - Optional error object for detailed error logging
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      error,
      timestamp: new Date().toISOString()
    };

    const formattedLog = this.formatLog(entry);

    // In development, use console methods for better readability
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedLog);
          break;
        case LogLevel.WARN:
          console.warn(formattedLog);
          break;
        case LogLevel.INFO:
          console.info(formattedLog);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedLog);
          break;
      }
    } else {
      // In production, everything goes to console.log for log aggregation services
      console.log(formattedLog);
    }
  }

  /**
   * Log an error message with optional context and error object
   * 
   * @param message - Error description
   * @param context - Additional context information
   * @param error - Optional Error object for stack trace
   * 
   * @example
   * ```typescript
   * logger.error('Database connection failed', { userId: '123' }, new Error('Connection timeout'));
   * ```
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log a warning message with optional context
   * 
   * @param message - Warning description
   * @param context - Additional context information
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an informational message with optional context
   * 
   * @param message - Information to log
   * @param context - Additional context information
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a debug message (only in development environment)
   * 
   * @param message - Debug information
   * @param context - Additional context information
   */
  debug(message: string, context?: LogContext): void {
    // Only log debug messages in development
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log API-specific errors with endpoint information
   * 
   * @param endpoint - API endpoint that failed
   * @param error - Error object
   * @param context - Additional request context
   */
  apiError(endpoint: string, error: Error, context?: LogContext): void {
    this.error(`API Error: ${endpoint}`, {
      ...context,
      apiEndpoint: endpoint,
      errorCode: (error as ErrorWithCode).code,
      errorType: error.constructor.name
    }, error);
  }

  databaseError(operation: string, error: Error, context?: LogContext): void {
    this.error(`Database Error: ${operation}`, {
      ...context,
      operation,
      errorCode: (error as ErrorWithCode).code,
      errorType: error.constructor.name
    }, error);
  }


  validationError(endpoint: string, validationErrors: string, context?: LogContext): void {
    this.warn(`Validation failed: ${endpoint}`, {
      ...context,
      apiEndpoint: endpoint,
      validationErrors
    });
  }

  securityEvent(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      securityEvent: event,
      requiresReview: true
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper to get header value from NextRequest
function getHeaderValue(headers: Headers | Record<string, string | string[] | undefined>, key: string): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(key) || undefined;
  }
  const value = headers[key];
  return Array.isArray(value) ? value[0] : value;
}

// Next.js and Express-style middleware for request logging
export function createRequestLogger(req: { 
  headers: Headers | Record<string, string | string[] | undefined>, 
  method?: string, 
  url?: string, 
  connection?: { remoteAddress?: string }
} | { headers: Headers, method: string, url: string }): LogContext {
  return {
    requestId: getHeaderValue(req.headers, 'x-request-id') || generateRequestId(),
    userAgent: getHeaderValue(req.headers, 'user-agent'),
    ip: getHeaderValue(req.headers, 'x-forwarded-for') || ('connection' in req ? req.connection?.remoteAddress : undefined),
    method: req.method,
    url: req.url
  };
}

// Helper for safely logging objects with potential circular references
export function safeStringify(obj: unknown, maxDepth = 3): string {
  const seen = new WeakSet();
  
  function stringify(value: unknown, depth = 0): unknown {
    if (depth > maxDepth) return '[Max depth reached]';
    if (value === null) return null;
    if (typeof value !== 'object') return value;
    if (seen.has(value)) return '[Circular reference]';
    
    seen.add(value);
    
    if (Array.isArray(value)) {
      return value.map(item => stringify(item, depth + 1));
    }
    
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = stringify(val, depth + 1);
    }
    
    return result;
  }
  
  try {
    return JSON.stringify(stringify(obj));
  } catch {
    return '[Failed to stringify object]';
  }
}