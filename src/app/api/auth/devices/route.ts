import { NextRequest } from 'next/server';
import { getTrustedDevices, revokeDeviceTrust, verifyAuthSession } from '@/lib/auth/device-fingerprint';
import { getUnusedBackupCodesCount } from '@/lib/auth/totp-service';
import { logger, createRequestLogger } from '@/lib/utils/logger';
import { withAuthAndRateLimit } from '@/lib/api/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';

// GET /api/auth/devices - Get trusted devices and backup codes info
export const GET = withAuthAndRateLimit(async (request: NextRequest, context) => {
  try {
    // Verify authentication (also needed for device context)
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    if (!sessionToken) {
      return createErrorResponse('Not authenticated', 401, { requestId: context.requestId });
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    if (!deviceInfo) {
      return createErrorResponse('Invalid session', 401, { requestId: context.requestId });
    }

    // Get trusted devices
    const devices = await getTrustedDevices();
    
    // Get backup codes info
    const unusedBackupCodes = await getUnusedBackupCodesCount();

    return createSuccessResponse({
      devices,
      backupCodesCount: unusedBackupCodes,
    }, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/auth/devices', error as Error, createRequestLogger(request));
    return createErrorResponse('Failed to get devices', 500, { requestId: context.requestId });
  }
}, { windowMs: 5 * 60 * 1000 });

// DELETE /api/auth/devices - Revoke device trust
export const DELETE = withAuthAndRateLimit(async (request: NextRequest, context) => {
  try {
    // Verify authentication (needed for current device id)
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    if (!sessionToken) {
      return createErrorResponse('Not authenticated', 401, { requestId: context.requestId });
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    if (!deviceInfo) {
      return createErrorResponse('Invalid session', 401, { requestId: context.requestId });
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return createErrorResponse('Device ID is required', 400, { requestId: context.requestId });
    }

    // Don't allow revoking the current device
    if (deviceId === deviceInfo.deviceId) {
      return createErrorResponse('Cannot revoke current device', 400, { requestId: context.requestId });
    }

    const success = await revokeDeviceTrust(deviceId);
    
    if (!success) {
      return createErrorResponse('Device not found', 404, { requestId: context.requestId });
    }

    return createSuccessResponse({ success: true }, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/auth/devices', error as Error, createRequestLogger(request));
    return createErrorResponse('Failed to revoke device', 500, { requestId: context.requestId });
  }
}, { windowMs: 5 * 60 * 1000 });

// POST /api/auth/devices - Device management (backup code regeneration removed for security)
export const POST = withAuthAndRateLimit(async (request: NextRequest, context) => {
  try {
    // Verify authentication
    const sessionToken = request.cookies.get('auth-session-token')?.value;
    if (!sessionToken) {
      return createErrorResponse('Not authenticated', 401, { requestId: context.requestId });
    }

    const deviceInfo = await verifyAuthSession(sessionToken);
    if (!deviceInfo) {
      return createErrorResponse('Invalid session', 401, { requestId: context.requestId });
    }

    return createErrorResponse('Action not supported. Use server-side scripts for TOTP management.', 400, { requestId: context.requestId });
  } catch (error) {
    logger.apiError('/api/auth/devices', error as Error, createRequestLogger(request));
    return createErrorResponse('Failed to process request', 500, { requestId: context.requestId });
  }
}, { windowMs: 5 * 60 * 1000 });
