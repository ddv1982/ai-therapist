import type { AuthValidationResult } from '@/lib/api/api-auth';
import { resolvePrincipalFromAuth } from '@/server/infrastructure/auth/resolve-principal';

export function resolvePrincipal(authResult: Pick<AuthValidationResult, 'clerkId' | 'userId'>) {
  return resolvePrincipalFromAuth(authResult);
}
