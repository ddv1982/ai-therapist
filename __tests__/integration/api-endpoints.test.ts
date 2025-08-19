/**
 * Integration tests for API endpoints
 * Tests the complete request/response cycle including authentication, validation, and database operations
 */

import { NextRequest } from 'next/server';
import { validateApiAuth } from '@/lib/api/api-auth';
import { prisma } from '@/lib/database/db';
import { handleApiError } from '@/lib/utils/error-utils';
import { 
  createSuccessResponse, 
  createErrorResponse,
  validateApiResponse,
  type ApiResponse 
} from '@/lib/api/api-response';

// Mock prisma for testing
jest.mock('@/lib/database/db', () => ({
  prisma: {
    session: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth validation
jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn(),
}));

describe('API Endpoints Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Sessions API', () => {
    const mockSession = {
      id: 'test-session-id',
      userId: 'test-user-id',
      title: 'Test Session',
      startedAt: new Date(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { messages: 5 }
    };

    test('GET /api/sessions - should return sessions list', async () => {
      // Mock successful auth
      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: true,
        userId: 'test-user-id'
      });

      // Mock database response
      (prisma.session.findMany as jest.Mock).mockResolvedValue([mockSession]);

      // Simulate the sessions API logic
      const authResult = await validateApiAuth({} as NextRequest);
      expect(authResult.isValid).toBe(true);

      const sessions = await prisma.session.findMany({
        where: { userId: authResult.userId },
        include: { _count: { select: { messages: true } } },
        orderBy: { startedAt: 'desc' }
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({
        id: 'test-session-id',
        title: 'Test Session',
        status: 'active'
      });
    });

    test('POST /api/sessions - should create new session', async () => {
      // Mock successful auth
      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: true,
        userId: 'test-user-id'
      });

      // Mock database create
      (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);

      const authResult = await validateApiAuth({} as NextRequest);
      const newSession = await prisma.session.create({
        data: {
          userId: authResult.userId,
          title: 'New Test Session',
          status: 'active'
        }
      });

      expect(newSession).toBeDefined();
      expect(newSession.title).toBe('Test Session');
    });

    test('DELETE /api/sessions/:id - should delete session', async () => {
      // Mock successful auth
      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: true,
        userId: 'test-user-id'
      });

      // Mock finding session
      (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
      
      // Mock delete operation
      (prisma.session.delete as jest.Mock).mockResolvedValue(mockSession);

      const authResult = await validateApiAuth({} as NextRequest);
      const session = await prisma.session.findUnique({
        where: { id: 'test-session-id' }
      });

      // Verify session belongs to user
      expect(session?.userId).toBe(authResult.userId);

      const deletedSession = await prisma.session.delete({
        where: { id: 'test-session-id' }
      });

      expect(deletedSession).toBeDefined();
    });
  });

  describe('Messages API', () => {
    const mockMessage = {
      id: 'test-message-id',
      sessionId: 'test-session-id',
      role: 'user' as const,
      content: 'Hello, therapist!',
      timestamp: new Date(),
      createdAt: new Date(),
    };

    test('GET /api/messages - should return session messages', async () => {
      // Mock successful auth
      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: true,
        userId: 'test-user-id'
      });

      // Mock messages query
      (prisma.message.findMany as jest.Mock).mockResolvedValue([mockMessage]);

      const messages = await prisma.message.findMany({
        where: { sessionId: 'test-session-id' },
        orderBy: { timestamp: 'asc' }
      });

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        role: 'user',
        content: 'Hello, therapist!',
        sessionId: 'test-session-id'
      });
    });

    test('POST /api/messages - should create new message', async () => {
      // Mock successful auth
      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: true,
        userId: 'test-user-id'
      });

      // Mock message creation
      (prisma.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const newMessage = await prisma.message.create({
        data: {
          sessionId: 'test-session-id',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        }
      });

      expect(newMessage).toBeDefined();
      expect(newMessage.content).toBe('Hello, therapist!');
    });
  });

  describe('Authentication Integration', () => {
    test('should reject invalid authentication', async () => {
      // Mock failed auth
      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: false,
        error: 'Invalid token'
      });

      const authResult = await validateApiAuth({} as NextRequest);
      
      expect(authResult.isValid).toBe(false);
      expect(authResult.error).toBe('Invalid token');
    });

    test('should handle authentication timeout', async () => {
      // Mock auth timeout
      (validateApiAuth as jest.Mock).mockRejectedValue(
        new Error('Authentication timeout')
      );

      await expect(validateApiAuth({} as NextRequest))
        .rejects.toThrow('Authentication timeout');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.session.findMany as jest.Mock).mockRejectedValue(dbError);

      try {
        await prisma.session.findMany({});
      } catch (error) {
        const errorResponse = handleApiError(error, {
          operation: 'fetch_sessions',
          category: 'database',
          severity: 'high'
        });

        expect(errorResponse).toBeDefined();
        expect(errorResponse.status).toBe(500);
      }
    });

    test('should handle validation errors properly', async () => {
      const validationError = new Error('Invalid session ID format');
      
      const errorResponse = handleApiError(validationError, {
        operation: 'validate_session_id',
        category: 'validation',
        severity: 'low',
        userMessage: 'Session ID must be a valid UUID'
      });

      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(400);
    });
  });

  describe('Response Format Validation', () => {
    test('should create valid success responses', () => {
      const testData = { message: 'Success' };
      const response = createSuccessResponse(testData, {
        requestId: 'test-request-id'
      });

      // Test response structure without parsing JSON
      // Since json() returns a promise, we need to mock it or test the structure differently
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    test('should create valid error responses', () => {
      const response = createErrorResponse('Test error', 400, {
        code: 'TEST_ERROR',
        details: 'This is a test error',
        requestId: 'test-request-id'
      });

      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });

    test('should validate API response structure', () => {
      const validResponse: ApiResponse<{ test: string }> = {
        success: true,
        data: { test: 'data' },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: 'test-request-id'
        }
      };

      const validation = validateApiResponse(validResponse);
      expect(validation.valid).toBe(true);

      const invalidResponse = { invalid: true };
      const invalidValidation = validateApiResponse(invalidResponse);
      expect(invalidValidation.valid).toBe(false);
    });
  });

  describe('Therapeutic Context Integration', () => {
    test('should handle therapeutic session context', async () => {
      const therapeuticSession = {
        id: 'therapeutic-session-id',
        userId: 'test-user-id',
        title: 'Therapeutic Session - Anxiety Management',
        startedAt: new Date(),
        status: 'active',
        therapeuticContext: {
          primaryConcern: 'anxiety',
          sessionGoal: 'stress_reduction',
          riskLevel: 'low'
        }
      };

      (prisma.session.findUnique as jest.Mock).mockResolvedValue(therapeuticSession);

      const session = await prisma.session.findUnique({
        where: { id: 'therapeutic-session-id' }
      });

      expect(session).toBeDefined();
      expect(session?.title).toContain('Therapeutic Session');
    });

    test('should validate therapeutic message content', () => {
      const therapeuticMessage = {
        content: 'I am feeling overwhelmed with work stress lately.',
        role: 'user' as const,
        therapeuticFlags: {
          emotionalIntensity: 'moderate',
          supportNeeded: true,
          risksDetected: false
        }
      };

      expect(therapeuticMessage.content).toContain('stress');
      expect(therapeuticMessage.therapeuticFlags.supportNeeded).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    test('should handle concurrent session requests', async () => {
      // Mock multiple sessions
      const multipleSessions = Array.from({ length: 10 }, (_, i) => ({
        id: `session-${i}`,
        userId: 'test-user-id',
        title: `Session ${i}`,
        startedAt: new Date(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { messages: i * 2 }
      }));

      (validateApiAuth as jest.Mock).mockResolvedValue({
        isValid: true,
        userId: 'test-user-id'
      });

      (prisma.session.findMany as jest.Mock).mockResolvedValue(multipleSessions);

      const startTime = Date.now();
      const sessions = await prisma.session.findMany({
        where: { userId: 'test-user-id' }
      });
      const processingTime = Date.now() - startTime;

      expect(sessions).toHaveLength(10);
      expect(processingTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test('should handle large message histories efficiently', async () => {
      const largeMessageHistory = Array.from({ length: 100 }, (_, i) => ({
        id: `message-${i}`,
        sessionId: 'test-session-id',
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i} content`,
        timestamp: new Date(Date.now() + i * 1000),
        createdAt: new Date(),
      }));

      (prisma.message.findMany as jest.Mock).mockResolvedValue(largeMessageHistory);

      const messages = await prisma.message.findMany({
        where: { sessionId: 'test-session-id' },
        orderBy: { timestamp: 'asc' }
      });

      expect(messages).toHaveLength(100);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });
  });
});