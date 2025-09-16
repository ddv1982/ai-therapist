import { PrismaClient } from '@prisma/client';
import path from 'path';

// Provide a local SQLite fallback when DATABASE_URL is not supplied by the environment.
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const defaultDatabaseUrl = `file:${dbPath}`;

const resolveDatabaseUrl = (rawUrl: string | undefined): string => {
  if (!rawUrl || rawUrl.trim() === '') {
    return defaultDatabaseUrl;
  }

  if (!rawUrl.startsWith('file:')) {
    return rawUrl;
  }

  const filePath = rawUrl.slice('file:'.length);
  if (!filePath || path.isAbsolute(filePath)) {
    return rawUrl;
  }

  return `file:${path.join(process.cwd(), filePath)}`;
};

const resolvedDatabaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL);
process.env.DATABASE_URL = resolvedDatabaseUrl;

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
      url: resolvedDatabaseUrl,
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
