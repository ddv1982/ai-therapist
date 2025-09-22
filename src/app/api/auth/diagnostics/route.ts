import { NextRequest } from 'next/server';
import { getTOTPDiagnostics, isTOTPSetup } from '@/lib/auth/totp-service';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { withRateLimitUnauthenticated } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

// GET /api/auth/diagnostics - Get TOTP diagnostics for debugging
export const GET = withRateLimitUnauthenticated(async (_request, context) => {
  try {
    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      return createErrorResponse('TOTP not configured', 400, { requestId: context.requestId });
    }

    const diagnostics = await getTOTPDiagnostics();
    return createSuccessResponse({
      serverTime: new Date(diagnostics.currentTime * 1000).toISOString(),
      serverTimestamp: diagnostics.currentTime,
      currentValidToken: diagnostics.currentToken,
      message: 'Use this information to debug time sync issues between devices'
    }, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/auth/diagnostics', error as Error, { apiEndpoint: '/api/auth/diagnostics' });
    return createErrorResponse('Diagnostics failed', 500, { requestId: context.requestId });
  }
}, { bucket: 'api' });

// POST /api/auth/diagnostics - Test a specific token
export const POST = withRateLimitUnauthenticated(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token) {
      return createErrorResponse('Token is required', 400, { requestId: context.requestId });
    }

    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      return createErrorResponse('TOTP not configured', 400, { requestId: context.requestId });
    }

    const diagnostics = await getTOTPDiagnostics(token);
    return createSuccessResponse({
      serverTime: new Date(diagnostics.currentTime * 1000).toISOString(),
      serverTimestamp: diagnostics.currentTime,
      currentValidToken: diagnostics.currentToken,
      providedToken: diagnostics.providedToken,
      providedTokenValid: diagnostics.providedTokenValid,
      message: diagnostics.providedTokenValid
        ? 'Token is valid with current server time'
        : 'Token is NOT valid with current server time - possible time sync issue'
    }, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/auth/diagnostics', error as Error, createRequestLogger(request));
    return createErrorResponse('Diagnostics failed', 500, { requestId: context.requestId });
  }
}, { bucket: 'api' });