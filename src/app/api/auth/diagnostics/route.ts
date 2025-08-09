import { NextRequest, NextResponse } from 'next/server';
import { getTOTPDiagnostics, isTOTPSetup } from '@/lib/totp-service';

// GET /api/auth/diagnostics - Get TOTP diagnostics for debugging
export async function GET(_request: NextRequest) {
  try {
    // Check if TOTP is set up
    const isSetup = await isTOTPSetup();
    if (!isSetup) {
      return NextResponse.json({ error: 'TOTP not configured' }, { status: 400 });
    }

    // Get diagnostics
    const diagnostics = await getTOTPDiagnostics();
    
    return NextResponse.json({
      serverTime: new Date(diagnostics.currentTime * 1000).toISOString(),
      serverTimestamp: diagnostics.currentTime,
      currentValidToken: diagnostics.currentToken,
      message: 'Use this information to debug time sync issues between devices'
    });
  } catch (error) {
    console.error('TOTP diagnostics failed:', error);
    return NextResponse.json({ error: 'Diagnostics failed' }, { status: 500 });
  }
}

// POST /api/auth/diagnostics - Test a specific token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

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
    
    return NextResponse.json({
      serverTime: new Date(diagnostics.currentTime * 1000).toISOString(),
      serverTimestamp: diagnostics.currentTime,
      currentValidToken: diagnostics.currentToken,
      providedToken: diagnostics.providedToken,
      providedTokenValid: diagnostics.providedTokenValid,
      message: diagnostics.providedTokenValid 
        ? 'Token is valid with current server time' 
        : 'Token is NOT valid with current server time - possible time sync issue'
    });
  } catch (error) {
    console.error('TOTP diagnostics failed:', error);
    return NextResponse.json({ error: 'Diagnostics failed' }, { status: 500 });
  }
}