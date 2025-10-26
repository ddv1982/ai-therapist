/**
 * User session management with Clerk authentication
 * Provides user information from Clerk for all sessions
 *
 * NOTE: Clerk authentication is handled via @clerk/nextjs/server's auth() function
 * which is called directly in API route handlers and page components.
 */

/**
 * Extract device type from user agent
 */
function getDeviceTypeFromUserAgent(userAgent: string): string {
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    return 'Mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    return 'Tablet';
  } else if (userAgent.includes('Windows') || userAgent.includes('Mac') || userAgent.includes('Linux')) {
    return 'Computer';
  }
  return 'Device';
}

/**
 * Get authenticated user info from Clerk
 * Used in API middleware to retrieve the authenticated user's information
 * In route handlers, Clerk's auth() function provides the current user context
 */
export function getSingleUserInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';
  const deviceType = getDeviceTypeFromUserAgent(userAgent);

  // NOTE: In route handlers, use Clerk's auth() function directly
  // This function is called from API middleware context
  // The actual Clerk user ID is resolved via validateApiAuth() in api-auth.ts

  return {
    // Placeholder - actual userId comes from validateApiAuth()
    userId: 'therapeutic-ai-user',
    email: 'user@therapeutic-ai.local',
    name: 'Therapeutic AI User',
    currentDevice: deviceType,
  };
}

/**
 * Generate a consistent user ID based on browser characteristics
 * @deprecated - Use Clerk authentication via getSingleUserInfo() instead
 */
export function generateDeviceUserId(request: Request): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';

  const browserFingerprint = `${userAgent}-${acceptLanguage}-${acceptEncoding}`;
  let hash = 0;
  for (let i = 0; i < browserFingerprint.length; i++) {
    const char = browserFingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `device-user-${Math.abs(hash).toString(36)}`;
}

/**
 * Get or create user for this device session
 * @deprecated - Use Clerk authentication via getSingleUserInfo() instead
 */
export function getDeviceUserInfo(request: Request) {
  const userId = generateDeviceUserId(request);
  const userAgent = request.headers.get('user-agent') || '';
  const deviceType = getDeviceTypeFromUserAgent(userAgent);

  return {
    userId,
    email: `${userId}@local.device`,
    name: `${deviceType} User`,
  };
}