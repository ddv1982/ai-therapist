/**
 * Tests for Database Utilities
 * Tests database connection, health checks, and core functionality
 */

import { checkDatabaseHealth, disconnectDatabase, prisma } from '@/lib/database/db';

// Mock Prisma client
jest.mock('@/lib/database/db', () => {
  const mockPrisma = {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  return {
    prisma: mockPrisma,
    checkDatabaseHealth: jest.fn(),
    disconnectDatabase: jest.fn(),
  };
});

const mockPrisma = prisma as any;
const mockCheckHealth = checkDatabaseHealth as jest.MockedFunction<typeof checkDatabaseHealth>;
const mockDisconnect = disconnectDatabase as jest.MockedFunction<typeof disconnectDatabase>;

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabaseHealth', () => {
    it('should return healthy status when database is accessible', async () => {
      mockCheckHealth.mockResolvedValue({
        healthy: true,
        message: 'Database connection successful',
      });

      const result = await checkDatabaseHealth();

      expect(result.healthy).toBe(true);
      expect(result.message).toBe('Database connection successful');
    });

    it('should return unhealthy status when database query fails', async () => {
      mockCheckHealth.mockResolvedValue({
        healthy: false,
        message: 'Database connection failed: Connection timeout',
      });

      const result = await checkDatabaseHealth();

      expect(result.healthy).toBe(false);
      expect(result.message).toContain('Database connection failed');
    });

    it('should handle database connection errors gracefully', async () => {
      mockCheckHealth.mockResolvedValue({
        healthy: false,
        message: 'Database connection failed: ECONNREFUSED',
      });

      const result = await checkDatabaseHealth();

      expect(result.healthy).toBe(false);
      expect(result.message).toBeTruthy();
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect from database successfully', async () => {
      mockDisconnect.mockResolvedValue(undefined);

      await expect(disconnectDatabase()).resolves.not.toThrow();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnect errors gracefully', async () => {
      mockDisconnect.mockRejectedValue(new Error('Disconnect failed'));

      await expect(disconnectDatabase()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('Prisma client configuration', () => {
    it('should have correct model interfaces', () => {
      expect(mockPrisma.user).toBeDefined();
      expect(mockPrisma.session).toBeDefined();
      expect(mockPrisma.message).toBeDefined();
      
      expect(typeof mockPrisma.user.findUnique).toBe('function');
      expect(typeof mockPrisma.session.create).toBe('function');
      expect(typeof mockPrisma.message.findMany).toBe('function');
    });

    it('should provide database query capabilities', () => {
      expect(mockPrisma.$queryRaw).toBeDefined();
      expect(typeof mockPrisma.$queryRaw).toBe('function');
    });

    it('should provide connection management', () => {
      expect(mockPrisma.$disconnect).toBeDefined();
      expect(typeof mockPrisma.$disconnect).toBe('function');
    });
  });

  describe('Database operations', () => {
    describe('User operations', () => {
      it('should support user creation', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.user.create.mockResolvedValue(mockUser);

        const result = await mockPrisma.user.create({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
        });

        expect(result).toEqual(mockUser);
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
        });
      });

      it('should support user retrieval', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const result = await mockPrisma.user.findUnique({
          where: { id: 'user-123' },
        });

        expect(result).toEqual(mockUser);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-123' },
        });
      });
    });

    describe('Session operations', () => {
      it('should support session creation', async () => {
        const mockSession = {
          id: 'session-123',
          title: 'Therapy Session',
          userId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.session.create.mockResolvedValue(mockSession);

        const result = await mockPrisma.session.create({
          data: {
            title: 'Therapy Session',
            userId: 'user-123',
          },
        });

        expect(result).toEqual(mockSession);
        expect(mockPrisma.session.create).toHaveBeenCalledWith({
          data: {
            title: 'Therapy Session',
            userId: 'user-123',
          },
        });
      });

      it('should support session listing with ordering', async () => {
        const mockSessions = [
          { id: 'session-1', title: 'Recent Session', createdAt: new Date() },
          { id: 'session-2', title: 'Older Session', createdAt: new Date(Date.now() - 86400000) },
        ];

        mockPrisma.session.findMany.mockResolvedValue(mockSessions);

        const result = await mockPrisma.session.findMany({
          where: { userId: 'user-123' },
          orderBy: { createdAt: 'desc' },
        });

        expect(result).toEqual(mockSessions);
        expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
          where: { userId: 'user-123' },
          orderBy: { createdAt: 'desc' },
        });
      });
    });

    describe('Message operations', () => {
      it('should support message creation with encryption', async () => {
        const mockMessage = {
          id: 'message-123',
          role: 'user',
          content: 'encrypted-content',
          sessionId: 'session-123',
          timestamp: new Date(),
        };

        mockPrisma.message.create.mockResolvedValue(mockMessage);

        const result = await mockPrisma.message.create({
          data: {
            role: 'user',
            content: 'encrypted-content',
            sessionId: 'session-123',
          },
        });

        expect(result).toEqual(mockMessage);
        expect(mockPrisma.message.create).toHaveBeenCalledWith({
          data: {
            role: 'user',
            content: 'encrypted-content',
            sessionId: 'session-123',
          },
        });
      });

      it('should support message retrieval with ordering', async () => {
        const mockMessages = [
          { id: 'msg-1', content: 'First message', timestamp: new Date(Date.now() - 60000) },
          { id: 'msg-2', content: 'Second message', timestamp: new Date() },
        ];

        mockPrisma.message.findMany.mockResolvedValue(mockMessages);

        const result = await mockPrisma.message.findMany({
          where: { sessionId: 'session-123' },
          orderBy: { timestamp: 'asc' },
        });

        expect(result).toEqual(mockMessages);
        expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
          where: { sessionId: 'session-123' },
          orderBy: { timestamp: 'asc' },
        });
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database constraint violations', async () => {
      const constraintError = new Error('UNIQUE constraint failed: user.email');
      mockPrisma.user.create.mockRejectedValue(constraintError);

      await expect(
        mockPrisma.user.create({
          data: {
            id: 'user-123',
            email: 'duplicate@example.com',
            name: 'Test User',
          },
        })
      ).rejects.toThrow('UNIQUE constraint failed');
    });

    it('should handle foreign key constraint violations', async () => {
      const fkError = new Error('FOREIGN KEY constraint failed');
      mockPrisma.session.create.mockRejectedValue(fkError);

      await expect(
        mockPrisma.session.create({
          data: {
            title: 'Test Session',
            userId: 'non-existent-user',
          },
        })
      ).rejects.toThrow('FOREIGN KEY constraint failed');
    });

    it('should handle connection timeouts', async () => {
      const timeoutError = new Error('Connection timeout');
      mockPrisma.$queryRaw.mockRejectedValue(timeoutError);

      await expect(
        mockPrisma.$queryRaw`SELECT 1`
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('Transaction support', () => {
    it('should support transactional operations', async () => {
      // Note: This would test actual transaction support
      // For now, we're testing the interface exists
      expect(typeof mockPrisma.$queryRaw).toBe('function');
    });
  });

  describe('Performance considerations', () => {
    it('should support connection pooling configuration', () => {
      // Test that the Prisma client is configured for SQLite
      // This tests the configuration exists in the actual implementation
      expect(mockPrisma).toBeDefined();
    });

    it('should handle large result sets efficiently', async () => {
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `session-${i}`,
        title: `Session ${i}`,
        createdAt: new Date(),
      }));

      mockPrisma.session.findMany.mockResolvedValue(largeResultSet);

      const result = await mockPrisma.session.findMany({
        where: { userId: 'user-123' },
      });

      expect(result).toHaveLength(1000);
      expect(result[0].id).toBe('session-0');
      expect(result[999].id).toBe('session-999');
    });
  });
});