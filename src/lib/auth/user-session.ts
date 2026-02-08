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
 *
 * IMPORTANT:
 * - This helper is intentionally request-scoped and lightweight.
 * - `email`/`name` values are fallback display placeholders and must not be used
 *   as authoritative identity for persistence.
 */
export interface RequestUserInfo {
  email: string;
  name: string;
  currentDevice: string;
}

export function getSingleUserInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || '';
  const deviceType = getDeviceTypeFromUserAgent(userAgent);

  // NOTE: In route handlers, use Clerk's auth()/clerkClient() for authoritative profile fields.
  // This middleware helper only provides minimal request metadata.

  return {
    email: 'user@therapeutic-ai.local',
    name: 'Therapeutic AI User',
    currentDevice: deviceType,
  } satisfies RequestUserInfo;
}
