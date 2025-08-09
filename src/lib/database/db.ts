import { PrismaClient } from '@prisma/client';
import path from 'path';

// Always set DATABASE_URL programmatically
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Enhanced Prisma client with connection pooling and optimized configuration
 * for therapeutic AI application with SQLite database
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Database connection health check utility
 */
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, message: 'Database connection successful' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return { healthy: false, message: `Database connection failed: ${errorMessage}` };
  }
}

/**
 * Graceful database disconnect for application shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}