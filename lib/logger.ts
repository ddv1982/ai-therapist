// Structured logging utility for better error tracking and debugging

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  apiEndpoint?: string;
  userAgent?: string;
  timestamp?: string;
  requestId?: string;
  [key: string]: any;
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

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    // Only log debug messages in development
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  // Specialized methods for common scenarios
  apiError(endpoint: string, error: Error, context?: LogContext): void {
    this.error(`API Error: ${endpoint}`, {
      ...context,
      apiEndpoint: endpoint,
      errorCode: (error as any).code,
      errorType: error.constructor.name
    }, error);
  }

  databaseError(operation: string, error: Error, context?: LogContext): void {
    this.error(`Database Error: ${operation}`, {
      ...context,
      operation,
      errorCode: (error as any).code,
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

// Express-style middleware for request logging
export function createRequestLogger(req: any): LogContext {
  return {
    requestId: req.headers['x-request-id'] || Math.random().toString(36).substring(7),
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    method: req.method,
    url: req.url
  };
}

// Helper for safely logging objects with potential circular references
export function safeStringify(obj: any, maxDepth = 3): string {
  const seen = new WeakSet();
  
  function stringify(value: any, depth = 0): any {
    if (depth > maxDepth) return '[Max depth reached]';
    if (value === null) return null;
    if (typeof value !== 'object') return value;
    if (seen.has(value)) return '[Circular reference]';
    
    seen.add(value);
    
    if (Array.isArray(value)) {
      return value.map(item => stringify(item, depth + 1));
    }
    
    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = stringify(val, depth + 1);
    }
    
    return result;
  }
  
  try {
    return JSON.stringify(stringify(obj));
  } catch (error) {
    return '[Failed to stringify object]';
  }
}