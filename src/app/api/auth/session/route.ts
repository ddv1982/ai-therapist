import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthSession, revokeAuthSession } from '@/lib/auth/device-fingerprint';
import { createLogoutResponse } from '@/lib/auth/auth-middleware';
import { isTOTPSetup } from '@/lib/auth/totp-service';

// GET /api/auth/session - Check session status
export async function GET(request: NextRequest) {
  try {
    // Check if TOTP is set up
    const isSetup = await isTOTPSetup();
    
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ 
        isAuthenticated: false, 
        needsSetup: !isSetup,
        needsVerification: isSetup 
      });
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    
    if (!deviceInfo) {
      return NextResponse.json({ 
        isAuthenticated: false, 
        needsSetup: !isSetup,
        needsVerification: isSetup 
      });
    }

    return NextResponse.json({
      isAuthenticated: true,
      needsSetup: false,
      needsVerification: false,
      device: {
        name: deviceInfo.name,
        deviceId: deviceInfo.deviceId,
      },
    });
  } catch (error) {
    console.error('Failed to check session:', error);
    return NextResponse.json({ error: 'Failed to check session' }, { status: 500 });
  }
}

// DELETE /api/auth/session - Logout (revoke session)
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    
    if (sessionToken) {
      await revokeAuthSession(sessionToken);
    }

    return createLogoutResponse('/auth/verify');
  } catch (error) {
    console.error('Failed to logout:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}