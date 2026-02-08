import type { Principal } from '@/server/domain/auth/principal';

interface AuthPrincipalSource {
  clerkId?: string;
  userId?: string;
}

export function resolvePrincipalFromAuth(source: AuthPrincipalSource): Principal | null {
  const clerkId = source.clerkId ?? source.userId;
  if (!clerkId) {
    return null;
  }

  return { clerkId };
}
