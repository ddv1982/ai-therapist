/**
 * Tests for memory management API with full content support
 * Testing GET /api/reports/memory/manage with includeFullContent parameter
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/database/db';
import { GET } from '@/app/api/reports/memory/manage/route';

// Mock the dependencies
jest.mock('@/lib/database/db', () => ({
  prisma: {
    sessionReport: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/api/api-auth', () => ({
  validateApiAuth: jest.fn(() => Promise.resolve({ isValid: true })),
  createAuthErrorResponse: jest.fn(() => 
    Response.json({ error: 'Authentication required' }, { status: 401 })
  ),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  createRequestLogger: jest.fn(() => ({ requestId: 'test-request-id' })),
}));

jest.mock('@/lib/chat/message-encryption', () => ({
  decryptSessionReportContent: jest.fn(),
}));

const mockPrisma = prisma as any;
const mockDecrypt = require('@/lib/chat/message-encryption').decryptSessionReportContent;

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
    mockPrisma.sessionReport.findMany.mockResolvedValue(mockReportData);
    mockDecrypt.mockReturnValue('This is the full decrypted therapeutic session content with detailed insights and analysis.');
  });

  describe('Basic functionality tests', () => {
    it('should call prisma with correct parameters', async () => {
      const request = createMockRequest({ includeFullContent: 'true' });
      await GET(request);

      expect(mockPrisma.sessionReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            reportContent: true, // Should include reportContent for full content
          }),
        })
      );
    });

    it('should handle empty results', async () => {
      mockPrisma.sessionReport.findMany.mockResolvedValue([]);
      
      const request = createMockRequest({ includeFullContent: 'true' });
      const response = await GET(request);
      
      // Basic check that we get a response
      expect(response).toBeDefined();
      expect(mockPrisma.sessionReport.findMany).toHaveBeenCalled();
    });

    it('should work with combined parameters', async () => {
      const request = createMockRequest({ 
        excludeSessionId: 'current-session',
        includeFullContent: 'true' 
      });
      
      await GET(request);

      expect(mockPrisma.sessionReport.findMany).toHaveBeenCalledWith({
        where: {
          sessionId: {
            not: 'current-session'
          }
        },
        select: expect.objectContaining({
          id: true,
          sessionId: true,
          reportContent: true,
          keyPoints: true,
          therapeuticInsights: true,
          patternsIdentified: true,
          createdAt: true,
          session: {
            select: {
              title: true,
              startedAt: true
            }
          }
        }),
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    });
  });
});