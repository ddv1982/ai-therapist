import { NextRequest } from 'next/server';
import { getTOTPDiagnostics, isTOTPSetup } from '@/lib/auth/totp-service';
import { getClientIP } from '@/lib/auth/auth-middleware';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { withRateLimitUnauthenticated } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

// GET /api/auth/mobile-debug - Get detailed mobile debugging info
export const GET = withRateLimitUnauthenticated(async (request: NextRequest, context) => {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = getClientIP(request);
    const host = request.headers.get('host');
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    // Detect if this is a mobile device
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Check if TOTP is set up
    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      return createErrorResponse('TOTP not configured', 400, { requestId: context.requestId });
    }

    // Get diagnostics
    const diagnostics = await getTOTPDiagnostics();
    
    // Get client time from request (if provided in query params)
    const url = new URL(request.url);
    const clientTime = url.searchParams.get('clientTime');
    const clientTimeMs = clientTime ? parseInt(clientTime) : null;
    
    let timeSync = null;
    if (clientTimeMs) {
      const serverTimeMs = Date.now();
      const timeDiff = Math.abs(serverTimeMs - clientTimeMs);
      timeSync = {
        clientTime: new Date(clientTimeMs).toISOString(),
        serverTime: new Date(serverTimeMs).toISOString(),
        differenceMs: timeDiff,
        differenceSec: Math.round(timeDiff / 1000),
        syncStatus: timeDiff < 30000 ? 'good' : timeDiff < 60000 ? 'warning' : 'poor'
      };
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      device: {
        isMobile,
        userAgent,
      },
      network: {
        ipAddress,
        host,
        origin: origin || null,
        referer: referer || null,
        forwardedFor: forwarded || null,
        realIp: realIp || null,
      },
      totp: {
        isSetup: true,
        serverTime: new Date(diagnostics.currentTime * 1000).toISOString(),
        serverTimestamp: diagnostics.currentTime,
        currentValidToken: diagnostics.currentToken,
      },
      timeSync,
      troubleshooting: {
        commonIssues: [
          'Device time not synchronized with server time',
          'Network delays causing time-sensitive token mismatches',
          'Mobile browser or app caching old tokens',
          'Different timezone settings between device and server'
        ],
        recommendations: isMobile ? [
          'Check if device automatic time setting is enabled',
          'Try refreshing the page to get a new token',
          'Ensure stable internet connection',
          'Clear browser cache if using mobile web browser'
        ] : [
          'Check system time synchronization',
          'Verify timezone settings',
          'Try refreshing the authenticator app'
        ]
      }
    };
    return createSuccessResponse(debugInfo, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/auth/mobile-debug', error as Error, createRequestLogger(request));
    return createErrorResponse('Debug failed', 500, { requestId: context.requestId });
  }
}, { bucket: 'api' });

// POST /api/auth/mobile-debug - Test token with mobile debugging
export const POST = withRateLimitUnauthenticated(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const { token, clientTime } = body;
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = getClientIP(request);
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (!token) {
      return createErrorResponse('Token is required', 400, { requestId: context.requestId });
    }

    // Check if TOTP is set up
    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      return createErrorResponse('TOTP not configured', 400, { requestId: context.requestId });
    }

    // Get diagnostics for the provided token
    const diagnostics = await getTOTPDiagnostics(token);
    
    let timeSync = null;
    if (clientTime) {
      const clientTimeMs = typeof clientTime === 'number' ? clientTime : Date.now();
      const serverTimeMs = Date.now();
      const timeDiff = Math.abs(serverTimeMs - clientTimeMs);
      timeSync = {
        clientTime: new Date(clientTimeMs).toISOString(),
        serverTime: new Date(serverTimeMs).toISOString(),
        differenceMs: timeDiff,
        differenceSec: Math.round(timeDiff / 1000),
        syncStatus: timeDiff < 30000 ? 'good' : timeDiff < 60000 ? 'warning' : 'poor'
      };
    }
    
    const debugResult = {
      timestamp: new Date().toISOString(),
      device: {
        isMobile,
        ipAddress,
        userAgent,
      },
      tokenTest: {
        providedToken: diagnostics.providedToken,
        isValid: diagnostics.providedTokenValid,
        serverTime: new Date(diagnostics.currentTime * 1000).toISOString(),
        serverTimestamp: diagnostics.currentTime,
        currentValidToken: diagnostics.currentToken,
        tokensMatch: diagnostics.currentToken === token,
      },
      timeSync,
      diagnosis: diagnostics.providedTokenValid 
        ? {
            status: 'success',
            message: 'Token is valid with current server time'
          }
        : {
            status: 'failure',
            message: 'Token is NOT valid with current server time',
            possibleCauses: [
              timeSync && timeSync.syncStatus !== 'good' ? 'Time synchronization issue detected' : null,
              'Token may have expired (30-second window)',
              'Device time may not match server time',
              'Token was generated for a different time period'
            ].filter(Boolean)
          }
    };
    return createSuccessResponse(debugResult, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/auth/mobile-debug', error as Error, createRequestLogger(request));
    return createErrorResponse('Debug test failed', 500, { requestId: context.requestId });
  }
}, { bucket: 'api' });