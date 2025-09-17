import { NextRequest } from 'next/server';
import { createRequestLogger } from '@/lib/utils/logger';

export function createRequestContext(request: NextRequest) {
  const base = createRequestLogger(request);
  return {
    requestId: base.requestId || 'unknown',
    method: base.method as string | undefined,
    url: base.url as string | undefined,
    userAgent: base.userAgent as string | undefined,
  };
}


