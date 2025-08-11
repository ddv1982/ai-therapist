import { NextRequest, NextResponse } from 'next/server';
import { getTrustedDevices, revokeDeviceTrust } from '@/lib/auth/device-fingerprint';
import { verifyAuthSession } from '@/lib/auth/device-fingerprint';
import { regenerateBackupCodes, getUnusedBackupCodesCount } from '@/lib/auth/totp-service';

// GET /api/auth/devices - Get trusted devices and backup codes info
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    if (!deviceInfo) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get trusted devices
    const devices = await getTrustedDevices();
    
    // Get backup codes info
    const unusedBackupCodes = await getUnusedBackupCodesCount();

    return NextResponse.json({
      devices,
      backupCodesCount: unusedBackupCodes,
    });
  } catch (error) {
    console.error('Failed to get devices:', error);
    return NextResponse.json({ error: 'Failed to get devices' }, { status: 500 });
  }
}

// DELETE /api/auth/devices - Revoke device trust
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    if (!deviceInfo) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    // Don't allow revoking the current device
    if (deviceId === deviceInfo.deviceId) {
      return NextResponse.json({ error: 'Cannot revoke current device' }, { status: 400 });
    }

    const success = await revokeDeviceTrust(deviceId);
    
    if (!success) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke device:', error);
    return NextResponse.json({ error: 'Failed to revoke device' }, { status: 500 });
  }
}

// POST /api/auth/devices/regenerate-backup-codes - Regenerate backup codes
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    if (!deviceInfo) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'regenerate-backup-codes') {
      const newBackupCodes = await regenerateBackupCodes();
      return NextResponse.json({ backupCodes: newBackupCodes });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process device action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}