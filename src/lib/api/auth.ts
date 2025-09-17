import { NextRequest } from 'next/server';
import { validateApiAuth } from '@/lib/api/api-auth';
import { getSingleUserInfo } from '@/lib/auth/user-session';

export async function authenticateRequest(request: NextRequest) {
  const authResult = await validateApiAuth(request);
  if (!authResult.isValid) {
    return { isAuthenticated: false as const, error: authResult.error || 'Authentication required' };
  }
  const userInfo = getSingleUserInfo(request);
  return { isAuthenticated: true as const, userInfo };
}

export type AuthenticateResult = Awaited<ReturnType<typeof authenticateRequest>>;


