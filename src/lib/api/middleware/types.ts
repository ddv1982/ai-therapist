import type { getSingleUserInfo } from '@/lib/auth/user-session';
import type { Principal } from '@/server/domain/auth/principal';

export interface RequestContext {
  requestId: string;
  method?: string;
  url?: string;
  userAgent?: string;
  userInfo?: ReturnType<typeof getSingleUserInfo>;
  jwtToken?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequestContext extends RequestContext {
  principal: Principal;
  userInfo: ReturnType<typeof getSingleUserInfo>;
  jwtToken?: string;
}
