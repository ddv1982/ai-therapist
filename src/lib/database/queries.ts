import { prisma } from '@/lib/database/db';
import { getSingleUserInfo } from '@/lib/auth/user-session';
import { logger } from '@/lib/utils/logger';
import type { Session, Message } from '@prisma/client';

export async function verifySessionOwnership(
  sessionId: string,
  userId: string,
  options: { includeMessages?: boolean } = {}
): Promise<{ valid: boolean; session?: (Session & { messages?: Message[] }) }> {
  try {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId,
        userId: userId,
      },
      ...(options.includeMessages
        ? {
            include: {
              messages: {
                orderBy: { timestamp: 'asc' },
              },
            },
          }
        : {}),
    });

    return {
      valid: !!session,
      session: (session as (Session & { messages?: Message[] }) | null) || undefined,
    };
  } catch (error) {
    logger.databaseError('verify session ownership', error as Error, {
      sessionId,
      userId,
    });
    return { valid: false };
  }
}

export async function ensureUserExists(userInfo: ReturnType<typeof getSingleUserInfo>): Promise<boolean> {
  try {
    await prisma.user.upsert({
      where: { id: userInfo.userId },
      update: {},
      create: {
        id: userInfo.userId,
        email: userInfo.email,
        name: userInfo.name,
      },
    });
    return true;
  } catch (error) {
    logger.databaseError('ensure user exists', error as Error, {
      userId: userInfo.userId,
    });
    return false;
  }
}

export async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { messages: true } },
    },
  });
}

export async function getSessionWithMessages(sessionId: string, userId: string) {
  return prisma.session.findUnique({
    where: {
      id: sessionId,
      userId: userId,
    },
    include: {
      messages: { orderBy: { timestamp: 'asc' } },
      reports: true,
    },
  });
}
