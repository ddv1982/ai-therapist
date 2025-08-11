import { NextRequest, NextResponse } from 'next/server';
import { getTOTPDiagnostics, isTOTPSetup } from '@/lib/auth/totp-service';
import { getClientIP } from '@/lib/auth/auth-middleware';

// GET /api/auth/mobile-debug - Get detailed mobile debugging info
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'TOTP not configured' }, { status: 400 });
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
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Mobile debug endpoint failed:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST /api/auth/mobile-debug - Test token with mobile debugging
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, clientTime } = body;
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = getClientIP(request);
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Check if TOTP is set up
    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      return NextResponse.json({ error: 'TOTP not configured' }, { status: 400 });
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
    
    return NextResponse.json(debugResult);
  } catch (error) {
    console.error('Mobile debug test failed:', error);
    return NextResponse.json({ 
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}