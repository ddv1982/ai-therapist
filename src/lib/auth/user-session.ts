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
  if (
    userAgent.includes('Mobile') ||
    userAgent.includes('Android') ||
    userAgent.includes('iPhone')
  ) {
    return 'Mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    return 'Tablet';
  } else if (
    userAgent.includes('Windows') ||
    userAgent.includes('Mac') ||
    userAgent.includes('Linux')
  ) {
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


