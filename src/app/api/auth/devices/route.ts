import { NextRequest } from 'next/server';
import { getTrustedDevices, revokeDeviceTrust } from '@/lib/auth/device-fingerprint';
import { verifyAuthSession } from '@/lib/auth/device-fingerprint';
import { regenerateBackupCodes, getUnusedBackupCodesCount } from '@/lib/auth/totp-service';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { withAuthAndRateLimit } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

// GET /api/auth/devices - Get trusted devices and backup codes info
export const GET = withAuthAndRateLimit(async (request: NextRequest) => {
  try {
    // Verify authentication
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    if (!sessionToken) {
      return createErrorResponse('Not authenticated', 401);
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    if (!deviceInfo) {
      return createErrorResponse('Invalid session', 401);
    }

    // Get trusted devices
    const devices = await getTrustedDevices();
    
    // Get backup codes info
    const unusedBackupCodes = await getUnusedBackupCodesCount();

    return createSuccessResponse({
      devices,
      backupCodesCount: unusedBackupCodes,
    });
  } catch (error) {
    logger.apiError('/api/auth/devices', error as Error, createRequestLogger(request));
    return createErrorResponse('Failed to get devices', 500);
  }
});

// DELETE /api/auth/devices - Revoke device trust
export const DELETE = withAuthAndRateLimit(async (request: NextRequest) => {
  try {
    // Verify authentication
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    if (!sessionToken) {
      return createErrorResponse('Not authenticated', 401);
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    if (!deviceInfo) {
      return createErrorResponse('Invalid session', 401);
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return createErrorResponse('Device ID is required', 400);
    }

    // Don't allow revoking the current device
    if (deviceId === deviceInfo.deviceId) {
      return createErrorResponse('Cannot revoke current device', 400);
    }

    const success = await revokeDeviceTrust(deviceId);
    
    if (!success) {
      return createErrorResponse('Device not found', 404);
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    logger.apiError('/api/auth/devices', error as Error, createRequestLogger(request));
    return createErrorResponse('Failed to revoke device', 500);
  }
});

// POST /api/auth/devices/regenerate-backup-codes - Regenerate backup codes
export const POST = withAuthAndRateLimit(async (request: NextRequest) => {
  try {
    // Verify authentication
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    if (!sessionToken) {
      return createErrorResponse('Not authenticated', 401);
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    if (!deviceInfo) {
      return createErrorResponse('Invalid session', 401);
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'regenerate-backup-codes') {
      const newBackupCodes = await regenerateBackupCodes();
      return createSuccessResponse({ backupCodes: newBackupCodes });
    }

    return createErrorResponse('Invalid action', 400);
  } catch (error) {
    logger.apiError('/api/auth/devices', error as Error, createRequestLogger(request));
    return createErrorResponse('Failed to process action', 500);
  }
});