/**
 * User session management for local network usage
 * Creates unique user sessions per device/browser for privacy
 */

import { generateUUID } from '@/lib/utils';

/**
 * Generate a consistent user ID based on browser characteristics
 * This ensures each device gets its own private therapy sessions
 */
export function generateDeviceUserId(request: Request): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  // Create a simple hash from browser characteristics
  const browserFingerprint = `${userAgent}-${acceptLanguage}-${acceptEncoding}`;
  
  // Create a consistent but unique user ID for this device
  let hash = 0;
  for (let i = 0; i < browserFingerprint.length; i++) {
    const char = browserFingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Create a user ID that's consistent for this device but different from others
  return `device-user-${Math.abs(hash).toString(36)}`;
}

/**
 * Get or create user for this device session
 */
export function getDeviceUserInfo(request: Request) {
  const userId = generateDeviceUserId(request);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Extract device type for friendly naming
  let deviceType = 'Device';
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    deviceType = 'Mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    deviceType = 'Tablet';
  } else if (userAgent.includes('Windows') || userAgent.includes('Mac') || userAgent.includes('Linux')) {
    deviceType = 'Computer';
  }
  
  return {
    userId,
    email: `${userId}@local.device`,
    name: `${deviceType} User`,
  };
}