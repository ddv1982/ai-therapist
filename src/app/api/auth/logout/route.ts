import { withAuth } from '@/lib/api/api-middleware';
import { revokeAuthSession } from '@/lib/auth/device-fingerprint';
import { createSuccessResponse, createErrorResponse } from '@/lib/api/api-response';
import { env } from '@/config/env';

export const POST = withAuth(async (request, context) => {
  try {
    const token = request.cookies.get('auth-session-token')?.value;
    if (token) {
      await revokeAuthSession(token);
    }
    const res = createSuccessResponse({ success: true }, { requestId: context.requestId });
    try {
      res.cookies.set('auth-session-token', '', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
    } catch {}
    return res;
  } catch {
    return createErrorResponse('Failed to logout', 500, { requestId: context.requestId });
  }
});

