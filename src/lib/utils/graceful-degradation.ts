/**
 * Graceful degradation utilities for external API failures
 * Provides fallback mechanisms when external services are unavailable
 */

import { logger } from '@/lib/utils/logger';

export interface ServiceStatus {
  name: string;
  available: boolean;
  lastChecked: number;
  consecutiveFailures: number;
  lastError?: string;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitorWindow: number;
}

/**
 * Circuit breaker pattern implementation for external services
 */
export class ServiceCircuitBreaker {
  private services = new Map<string, ServiceStatus>();
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: 3, // Open circuit after 3 consecutive failures
      resetTimeout: 60000, // Try to reset after 1 minute
      monitorWindow: 300000, // 5 minute monitoring window
      ...options,
    };
  }

  /**
   * Execute a service call with circuit breaker protection
   */
  async executeWithBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T> | T
  ): Promise<T> {
    const status = this.getServiceStatus(serviceName);
    const now = Date.now();

    // Check if circuit is open (service marked as unavailable)
    if (!status.available) {
      // Try to reset if enough time has passed
      if (now - status.lastChecked > this.options.resetTimeout) {
        logger.info(`Attempting to reset circuit breaker for ${serviceName}`, {
          lastChecked: new Date(status.lastChecked).toISOString(),
          consecutiveFailures: status.consecutiveFailures,
        });
        // Half-open state - try one request
        try {
          const result = await operation();
          this.recordSuccess(serviceName);
          return result;
        } catch (error) {
          this.recordFailure(serviceName, error);
          if (fallback) {
            logger.warn(`${serviceName} still failing, using fallback`, {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            return await this.executeFallback(fallback);
          }
          throw error;
        }
      } else {
        // Circuit still open, use fallback immediately
        if (fallback) {
          logger.info(`Circuit open for ${serviceName}, using fallback immediately`);
          return await this.executeFallback(fallback);
        } else {
          throw new Error(`Service ${serviceName} is currently unavailable (circuit open)`);
        }
      }
    }

    // Circuit is closed, try the operation
    try {
      const result = await operation();
      this.recordSuccess(serviceName);
      return result;
    } catch (error) {
      this.recordFailure(serviceName, error);

      // Use fallback if available
      if (fallback) {
        logger.warn(`${serviceName} failed, using fallback`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          consecutiveFailures: status.consecutiveFailures + 1,
        });
        return await this.executeFallback(fallback);
      }

      throw error;
    }
  }

  /**
   * Execute fallback with error handling
   */
  private async executeFallback<T>(fallback: () => Promise<T> | T): Promise<T> {
    try {
      return await fallback();
    } catch (fallbackError) {
      logger.error('Fallback operation also failed', {
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error',
      });
      throw fallbackError;
    }
  }

  /**
   * Record successful service call
   */
  private recordSuccess(serviceName: string): void {
    this.services.set(serviceName, {
      name: serviceName,
      available: true,
      lastChecked: Date.now(),
      consecutiveFailures: 0,
    });
  }

  /**
   * Record failed service call
   */
  private recordFailure(serviceName: string, error: unknown): void {
    const current = this.getServiceStatus(serviceName);
    const newFailures = current.consecutiveFailures + 1;

    this.services.set(serviceName, {
      name: serviceName,
      available: newFailures < this.options.failureThreshold,
      lastChecked: Date.now(),
      consecutiveFailures: newFailures,
      lastError: error instanceof Error ? error.message : 'Unknown error',
    });

    if (newFailures >= this.options.failureThreshold) {
      logger.warn(`Circuit breaker opened for ${serviceName}`, {
        consecutiveFailures: newFailures,
        threshold: this.options.failureThreshold,
        resetTimeout: this.options.resetTimeout,
      });
    }
  }

  /**
   * Get current service status
   */
  private getServiceStatus(serviceName: string): ServiceStatus {
    return (
      this.services.get(serviceName) || {
        name: serviceName,
        available: true,
        lastChecked: 0,
        consecutiveFailures: 0,
      }
    );
  }

  /**
   * Get all service statuses for monitoring
   */
  getAllStatuses(): ServiceStatus[] {
    return Array.from(this.services.values());
  }

  /**
   * Manually reset a service (for admin use)
   */
  resetService(serviceName: string): void {
    this.services.set(serviceName, {
      name: serviceName,
      available: true,
      lastChecked: Date.now(),
      consecutiveFailures: 0,
    });
    logger.info(`Manually reset circuit breaker for ${serviceName}`);
  }

  /**
   * Get service health summary
   */
  getHealthSummary(): { healthy: number; degraded: number; total: number } {
    const statuses = this.getAllStatuses();
    const healthy = statuses.filter((s) => s.available).length;
    const degraded = statuses.filter((s) => !s.available).length;

    return {
      healthy,
      degraded,
      total: statuses.length,
    };
  }
}

// Global circuit breaker instance
const circuitBreaker = new ServiceCircuitBreaker();

/**
 * Convenient wrapper for AI service calls with fallback
 */
export async function withAIFallback<T>(
  operation: () => Promise<T>,
  fallbackResponse: T,
  serviceName = 'ai-service'
): Promise<T> {
  return circuitBreaker.executeWithBreaker(serviceName, operation, () => fallbackResponse);
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break; // Don't delay on the last attempt
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      logger.debug(
        `Retry attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Timeout wrapper for operations
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

/**
 * Get circuit breaker status for health checks
 */
export function getCircuitBreakerStatus() {
  return {
    services: circuitBreaker.getAllStatuses(),
    summary: circuitBreaker.getHealthSummary(),
  };
}

/**
 * Reset circuit breaker for a service (admin function)
 */
export function resetServiceCircuitBreaker(serviceName: string) {
  circuitBreaker.resetService(serviceName);
}

export { circuitBreaker };
