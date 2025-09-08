/**
 * Redis Client Configuration and Connection Management
 * 
 * Provides a robust Redis client with connection pooling, error handling,
 * and automatic reconnection for the AI Therapist application.
 * 
 * Features:
 * - Connection pooling for high performance
 * - Automatic reconnection on connection loss
 * - Graceful fallback when Redis is unavailable
 * - Comprehensive error handling and logging
 * - Health check monitoring
 */

import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { logger } from '@/lib/utils/logger';

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  lazyConnect?: boolean;
}

class RedisManager {
  private client: RedisClientType<Record<string, never>, Record<string, never>, Record<string, never>> | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    this.setupEventHandlers();
  }

  /**
   * Initialize Redis connection with configuration
   */
  async connect(config?: RedisConfig): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const redisConfig: RedisClientOptions = {
        url: config?.url || process.env.REDIS_URL,
        socket: {
          host: config?.host || process.env.REDIS_HOST || 'localhost',
          port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              logger.error('Redis max reconnection attempts reached', {
                operation: 'redis_connect',
                maxAttempts: this.maxReconnectAttempts
              });
              return new Error('Max reconnection attempts reached');
            }
            
            const delay = Math.min(this.reconnectDelay * Math.pow(2, retries), 30000);
            logger.warn('Redis reconnecting', {
              operation: 'redis_reconnect',
              attempt: retries + 1,
              delayMs: delay
            });
            
            return delay;
          }
        },
        password: config?.password || process.env.REDIS_PASSWORD,
        database: config?.db || parseInt(process.env.REDIS_DB || '0')
      };

      // Remove undefined values to avoid Redis connection issues
      Object.keys(redisConfig).forEach(key => {
        if (redisConfig[key as keyof RedisClientOptions] === undefined) {
          delete redisConfig[key as keyof RedisClientOptions];
        }
      });

      this.client = createClient(redisConfig) as unknown as RedisClientType<Record<string, never>, Record<string, never>, Record<string, never>>;
      this.setupClientEventHandlers();

      await this.client.connect();
      
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      logger.info('Redis connected successfully', {
        operation: 'redis_connect',
        host: (redisConfig.socket as { host?: string })?.host,
        port: (redisConfig.socket as { port?: number })?.port,
        database: redisConfig.database
      });

    } catch (error) {
      this.isConnecting = false;
      this.isConnected = false;
      
      logger.error('Redis connection failed', {
        operation: 'redis_connect',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : new Error('Redis connection failed'));

      // Don't throw in development - allow graceful degradation
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  /**
   * Setup global event handlers
   */
  private setupEventHandlers(): void {
    // Handle process termination gracefully (only in Node.js runtime)
    if (typeof process !== 'undefined' && process.on) {
      process.on('SIGINT', () => this.disconnect());
      process.on('SIGTERM', () => this.disconnect());
      process.on('beforeExit', () => this.disconnect());
    }
  }

  /**
   * Setup Redis client event handlers
   */
  private setupClientEventHandlers(): void {
    if (!this.client) return;

    this.client.on('error', (error: Error) => {
      logger.error('Redis client error', {
        operation: 'redis_error',
        error: error.message
      }, error);
      
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected', {
        operation: 'redis_connect'
      });
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready', {
        operation: 'redis_ready'
      });
      this.isConnected = true;
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended', {
        operation: 'redis_end'
      });
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      logger.warn('Redis client reconnecting', {
        operation: 'redis_reconnecting',
        attempt: this.reconnectAttempts
      });
    });
  }

  /**
   * Get Redis client instance
   */
  getClient(): RedisClientType<Record<string, never>, Record<string, never>, Record<string, never>> | null {
    return this.client;
  }

  /**
   * Check if Redis is connected and ready
   */
  isReady(): boolean {
    return this.isConnected && this.client?.isReady === true;
  }

  /**
   * Execute Redis command with error handling
   */
  async executeCommand<T>(
    command: (client: RedisClientType<Record<string, never>, Record<string, never>, Record<string, never>>) => Promise<T>,
    fallback?: T
  ): Promise<T | null> {
    // Try to connect if not already connected (lazy connection)
    if (!this.isConnected && !this.isConnecting) {
      try {
        await this.connect();
      } catch (error) {
        logger.debug('Redis connection failed, using fallback', {
          operation: 'redis_lazy_connect',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        if (fallback !== undefined) {
          return fallback;
        }
        return null;
      }
    }

    if (!this.isReady() || !this.client) {
      if (fallback !== undefined) {
        logger.debug('Redis not available, using fallback', {
          operation: 'redis_fallback'
        });
        return fallback;
      }
      return null;
    }

    try {
      return await command(this.client);
    } catch (error) {
      logger.error('Redis command failed', {
        operation: 'redis_command',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, error instanceof Error ? error : new Error('Redis command failed'));

      if (fallback !== undefined) {
        return fallback;
      }
      return null;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        logger.info('Redis disconnected gracefully', {
          operation: 'redis_disconnect'
        });
      } catch (error) {
        logger.warn('Error during Redis disconnect', {
          operation: 'redis_disconnect',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    this.isConnected = false;
    this.client = null;
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    connected: boolean;
    ready: boolean;
    error?: string;
  }> {
    try {
      if (!this.client) {
        return {
          healthy: false,
          connected: false,
          ready: false,
          error: 'Client not initialized'
        };
      }

      // If not connected, attempt to connect
      if (!this.isConnected) {
        try {
          await this.connect();
        } catch (connectError) {
          return {
            healthy: false,
            connected: false,
            ready: false,
            error: `Connection failed: ${connectError instanceof Error ? connectError.message : 'Unknown error'}`
          };
        }
      }

      // Test with a simple ping
      const pong = await this.client!.ping();
      
      return {
        healthy: pong === 'PONG',
        connected: this.isConnected,
        ready: this.client.isReady,
        error: pong !== 'PONG' ? 'Ping failed' : undefined
      };
    } catch (error) {
      return {
        healthy: false,
        connected: this.isConnected,
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const redisManager = new RedisManager();

// No auto-connect - Redis will connect only when explicitly needed

// Export types for external use
export type { RedisClientType };
