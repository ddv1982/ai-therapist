/**
 * Database Types
 * Type definitions for database models and operations
 */

// Database model types (defined here to avoid circular imports)
// These match the Prisma schema definitions

// Database operation types
export interface DatabaseConnectionConfig {
  url: string;
  maxConnections?: number;
  timeout?: number;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Encryption-related database types
export interface EncryptedField {
  encrypted: string;
  iv: string;
  tag: string;
}

export interface DatabaseStats {
  totalUsers: number;
  totalSessions: number;
  totalMessages: number;
  totalReports: number;
  lastActivity: Date;
}