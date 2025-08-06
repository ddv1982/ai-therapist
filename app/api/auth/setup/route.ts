import { NextRequest, NextResponse } from 'next/server';
import { generateTOTPSetup, saveTOTPConfig, isTOTPSetup } from '@/lib/totp-service';
import { getOrCreateDevice, createAuthSession } from '@/lib/device-fingerprint';
import { createAuthResponse, getClientIP } from '@/lib/auth-middleware';

// GET /api/auth/setup - Get setup data (QR code, backup codes)
export async function GET() {
  try {
    // Check if TOTP is already set up
    const isSetup = await isTOTPSetup();
    if (isSetup) {
      return NextResponse.json({ error: 'TOTP already configured' }, { status: 400 });
    }

    // Generate TOTP setup data
    const setupData = await generateTOTPSetup();
    
    return NextResponse.json({
      qrCodeUrl: setupData.qrCodeUrl,
      manualEntryKey: setupData.manualEntryKey,
      backupCodes: setupData.backupCodes,
      secret: setupData.secret, // Keep for verification
    });
  } catch (error) {
    console.error('TOTP setup generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate setup data' }, { status: 500 });
  }
}

// POST /api/auth/setup - Complete TOTP setup with verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, backupCodes, verificationToken } = body;

    if (!secret || !backupCodes || !verificationToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if TOTP is already set up
    const isSetup = await isTOTPSetup();
    if (isSetup) {
      return NextResponse.json({ error: 'TOTP already configured' }, { status: 400 });
    }

    // Verify the TOTP token with the provided secret
    const speakeasy = await import('speakeasy');
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: verificationToken,
      window: 2,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // Save TOTP configuration
    await saveTOTPConfig(secret, backupCodes);

    // Create device and session for immediate authentication
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = getClientIP(request);
    
    const device = await getOrCreateDevice(userAgent, ipAddress);
    const session = await createAuthSession(device.deviceId, ipAddress);

    // Return success with authentication
    return createAuthResponse(session.sessionToken, '/');
  } catch (error) {
    console.error('TOTP setup failed:', error);
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}