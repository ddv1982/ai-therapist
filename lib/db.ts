import { PrismaClient } from '@prisma/client';
import path from 'path';

// Always set DATABASE_URL programmatically
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;