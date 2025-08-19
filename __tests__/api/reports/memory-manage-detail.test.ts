/**
 * Tests for memory management API with full content support
 * Testing GET /api/reports/memory/manage with includeFullContent parameter
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/reports/memory/manage/route';
import { ComponentTestUtils } from '../../utils/test-utilities';

// Mock the dependencies using traditional approach
jest.mock('@/lib/database/db', () => ({
  prisma: {
    sessionReport: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  },
}));

jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn().mockResolvedValue({ isValid: true, userId: 'test-user' }),
  createAuthErrorResponse: jest.fn().mockReturnValue(
    new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 })
  ),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    therapeuticOperation: jest.fn(),
  },
  createRequestLogger: jest.fn(() => ({
    requestId: 'test-request-id',
    timestamp: new Date().toISOString(),
    method: 'GET',
    url: '/api/reports/memory/manage',
  })),
}));

jest.mock('@/lib/chat/message-encryption', () => ({
  decryptSessionReportContent: jest.fn().mockImplementation((content) => content),
}));

// Access mocked modules
const { prisma } = require('@/lib/database/db');
const { decryptSessionReportContent } = require('@/lib/chat/message-encryption');

const mockPrisma = prisma;
const mockDecrypt = decryptSessionReportContent;

// Helper to create mock NextRequest
const createMockRequest = (searchParams: Record<string, string> = {}): NextRequest => {
  const url = new URL('http://localhost:3000/api/reports/memory/manage');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return new NextRequest(url, { method: 'GET' });
};

const mockReportData = [
  {
    id: 'report-1',
    sessionId: 'session-1',
    reportContent: 'encrypted-content-1',
    keyPoints: ['Insight 1', 'Insight 2'],
    therapeuticInsights: {
      primaryInsights: ['Primary insight 1'],
      growthAreas: ['Growth area 1']
    },
    patternsIdentified: ['Pattern 1'],
    createdAt: new Date('2024-01-01'),
    session: {
      title: 'Test Session 1',
      startedAt: new Date('2024-01-01')
    }
  }
];

describe('Memory Management API - Full Content Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Apply proven API authentication mock pattern
    const { validateApiAuth } = require('@/lib/api/api-auth');
    validateApiAuth.mockResolvedValue({ isValid: true, userId: 'test-user' });
    
    mockPrisma.sessionReport.findMany.mockResolvedValue(mockReportData);
    mockDecrypt.mockReturnValue('This is the full decrypted therapeutic session content with detailed insights and analysis.');
  });

  describe('Basic functionality tests', () => {
    it('should return successful response with memory details', async () => {
      const request = createMockRequest({ includeFullContent: 'true' });
      
      const response = await GET(request);

      // Verify basic response structure
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should validate authentication', async () => {
      const { validateApiAuth } = require('@/lib/api/api-auth');
      const request = createMockRequest({ includeFullContent: 'true' });
      
      await GET(request);

      expect(validateApiAuth).toHaveBeenCalledWith(request);
    });

    it('should handle request parameters', async () => {
      const request = createMockRequest({ 
        excludeSessionId: 'current-session',
        includeFullContent: 'true' 
      });
      
      const response = await GET(request);

      // Just verify we get a successful response
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });
});