/**
 * User session management for single-user therapeutic AI application
 * Provides unified sessions across all devices for the same user
 */

// Fixed user ID for single-user setup - allows unified sessions across devices
const SINGLE_USER_ID = 'therapeutic-ai-user';

/**
 * Generate a consistent user ID based on browser characteristics
 * This ensures each device gets its own private therapy sessions
 * @deprecated Use getSingleUserInfo() instead for unified cross-device sessions
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
 * Get single user info for unified sessions across all devices
 * This allows the same user to see all their sessions on any device
 */
export function getSingleUserInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';
  
  // Extract device type for friendly display (but use same user ID)
  let deviceType = 'Device';
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    deviceType = 'Mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    deviceType = 'Tablet';
  } else if (userAgent.includes('Windows') || userAgent.includes('Mac') || userAgent.includes('Linux')) {
    deviceType = 'Computer';
  }
  
  return {
    userId: SINGLE_USER_ID,
    email: 'user@therapeutic-ai.local',
    name: 'Therapeutic AI User',
    currentDevice: deviceType,
  };
}

/**
 * Get or create user for this device session
 * @deprecated Use getSingleUserInfo() instead for unified cross-device sessions
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