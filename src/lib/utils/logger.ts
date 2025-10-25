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

import { generateRequestId } from '../auth/crypto-secure';
import { SENSITIVE_THERAPEUTIC_KEYS, SENSITIVE_PATTERNS } from './logger.data';
import { publicEnv, isDevelopment, isTest } from '@/config/env.public';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// Keys and patterns now come from logger.data.ts

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
  private isDevelopment = isDevelopment;
  private minLevel: LogLevel = (publicEnv.LOG_LEVEL as LogLevel) || LogLevel.INFO;

  /**
   * Filter sensitive therapeutic data from any object
   * This prevents HIPAA violations and data exposure
   */
  private filterSensitiveData(obj: unknown, depth = 0): unknown {
    if (depth > 5 || obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      // Check for sensitive patterns in strings
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(obj)) {
          return '[FILTERED_THERAPEUTIC_CONTENT]';
        }
      }
      // Filter long strings that might contain therapeutic content
      if (obj.length > 100) {
        return '[FILTERED_LONG_TEXT]';
      }
      return obj;
    }
    
    if (typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.filterSensitiveData(item, depth + 1));
    }
    
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Filter sensitive keys (including any IP fields)
      if (SENSITIVE_THERAPEUTIC_KEYS.has(key) || 
          SENSITIVE_THERAPEUTIC_KEYS.has(lowerKey) ||
          lowerKey === 'ip' ||
          lowerKey.endsWith('ip') ||
          lowerKey.includes('clientip') ||
          lowerKey.includes('remoteaddress') ||
          lowerKey.includes('x-forwarded-for') ||
          lowerKey.includes('x-real-ip') ||
          lowerKey.includes('therapeutic') ||
          lowerKey.includes('patient') ||
          lowerKey.includes('emotion') ||
          lowerKey.includes('thought') ||
          lowerKey.includes('belief') ||
          lowerKey.includes('session')) {
        filtered[key] = '[FILTERED_SENSITIVE_DATA]';
      } else {
        filtered[key] = this.filterSensitiveData(value, depth + 1);
      }
    }
    
    return filtered;
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, context, error, timestamp } = entry;
    
    // Filter sensitive data from context
    const filteredContext = context ? this.filterSensitiveData(context) : undefined;
    
    const logData = {
      timestamp,
      level,
      message,
      ...(filteredContext && typeof filteredContext === 'object' ? { context: filteredContext } : {}),
      ...(error && { 
        error: {
          name: error.name,
          message: error.message,
          // Only include stack trace in development for non-sensitive errors
          ...(this.isDevelopment && { stack: error.stack })
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
    // Drop logs below configured minimum level on the server
    const levelOrder: Record<LogLevel, number> = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 1,
      [LogLevel.INFO]: 2,
      [LogLevel.DEBUG]: 3,
    };
    if (typeof window === 'undefined' && levelOrder[level] > levelOrder[this.minLevel]) {
      return;
    }
    const entry: LogEntry = {
      level,
      message,
      context,
      error,
      timestamp: new Date().toISOString()
    };

    // Suppress noisy logs in the browser console, especially API call logs
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      // Never log API endpoint entries in the browser console
      if (entry.context && typeof entry.context.apiEndpoint === 'string') {
        return;
      }
      // In the browser, only surface errors; drop info/warn/debug
      if (level !== LogLevel.ERROR) {
        return;
      }
    }

    const formattedLog = this.formatLog(entry);

    // In development, use console methods for better readability
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedLog);
          break;
        case LogLevel.WARN:
          // In tests, avoid duplicating warn into console.log to reduce noise
          if (isTest) {
            console.warn(formattedLog);
          } else {
            console.warn(formattedLog);
            try { console.log(formattedLog); } catch {}
          }
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

  /**
   * SECURE: Log therapeutic operations without exposing sensitive data
   * Use this instead of console.log for any therapeutic operations
   */
  therapeuticOperation(operation: string, metadata?: { [key: string]: string | number | boolean }): void {
    this.info(`Therapeutic Operation: ${operation}`, {
      operation,
      operationType: 'therapeutic',
      // Only log safe metadata (no patient data)
      ...(metadata ? this.filterSensitiveData(metadata) || {} : {})
    });
  }

  /**
   * SECURE: Log session report operations without exposing content
   * Use this instead of console.log for session reports
   */
  reportOperation(operation: string, reportId?: string, metadata?: { [key: string]: string | number }): void {
    this.info(`Report Operation: ${operation}`, {
      operation,
      operationType: 'report',
      ...(reportId && { reportId }),
      // Only log safe metadata
      ...(metadata ? this.filterSensitiveData(metadata) || {} : {})
    });
  }

  /**
   * SECURE: Development-only logging that filters sensitive data
   * Use this instead of console.log for development debugging
   */
  secureDevLog(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      this.debug(`DEV: ${message}`, data ? { debugData: this.filterSensitiveData(data) } : undefined);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Development-only console logging - will not output anything in production
 * Use this for debug/development console.log statements
 */
export function devLog(...args: unknown[]): void {
if (isDevelopment) {
    console.log(...args);
  }
}

// Helper to get header value from NextRequest
function getHeaderValue(headers: Headers | Record<string, string | string[] | undefined>, key: string): string | undefined {
  if (!headers) {
    return undefined;
  }
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
