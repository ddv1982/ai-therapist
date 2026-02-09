import { NextRequest } from 'next/server';
import { getSingleUserInfo } from '@/lib/auth/user-session';
import { resolvePrincipal } from '@/server/application/auth/resolve-principal';
import type { AuthenticatedRequestContext, RequestContext } from '@/lib/api/middleware/types';

function createFallbackUserInfo(req: NextRequest): ReturnType<typeof getSingleUserInfo> {
  const ua = req.headers.get('user-agent') || '';
  let deviceType = 'Device';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    deviceType = 'Mobile';
  } else if (ua.includes('iPad') || ua.includes('Tablet')) {
    deviceType = 'Tablet';
  } else if (ua.includes('Windows') || ua.includes('Mac') || ua.includes('Linux')) {
    deviceType = 'Computer';
  }

  return {
    email: 'user@therapeutic-ai.local',
    name: 'Therapeutic AI User',
    currentDevice: deviceType,
  };
}

export function buildAuthenticatedContext(
  request: NextRequest,
  baseContext: RequestContext,
  authResult: { jwtToken?: string; clerkId?: string; userId?: string }
): AuthenticatedRequestContext {
  const principal = resolvePrincipal(authResult);
  if (!principal) {
    throw new Error('Authentication succeeded but no canonical clerkId was provided');
  }

  let userInfo: ReturnType<typeof getSingleUserInfo>;
  try {
    userInfo = getSingleUserInfo(request);
  } catch {
    userInfo = createFallbackUserInfo(request);
  }

  return {
    ...baseContext,
    principal,
    userInfo,
    jwtToken: authResult.jwtToken,
  };
}
