import { clerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/utils/logger';

interface ClerkEmailAddress {
  id?: string | null;
  emailAddress?: string | null;
}

interface ClerkUserLike {
  primaryEmailAddressId?: string | null;
  emailAddresses?: ClerkEmailAddress[] | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  username?: string | null;
}

export interface TrustedClerkProfile {
  email: string;
  name?: string;
}

function normalizeNonEmpty(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolvePrimaryEmail(user: ClerkUserLike): string | undefined {
  const addresses = Array.isArray(user.emailAddresses) ? user.emailAddresses : [];
  const primary = normalizeNonEmpty(user.primaryEmailAddressId);

  if (primary) {
    const primaryMatch = addresses.find((address) => normalizeNonEmpty(address.id) === primary);
    const primaryEmail = normalizeNonEmpty(primaryMatch?.emailAddress);
    if (primaryEmail) return primaryEmail;
  }

  for (const address of addresses) {
    const candidate = normalizeNonEmpty(address.emailAddress);
    if (candidate) return candidate;
  }

  return undefined;
}

function resolveDisplayName(user: ClerkUserLike): string | undefined {
  const fullName = normalizeNonEmpty(user.fullName);
  if (fullName) return fullName;

  const firstName = normalizeNonEmpty(user.firstName);
  const lastName = normalizeNonEmpty(user.lastName);
  const composed = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (composed.length > 0) return composed;

  return normalizeNonEmpty(user.username);
}

export async function getTrustedClerkProfile(clerkId: string): Promise<TrustedClerkProfile | null> {
  try {
    const client = await clerkClient();
    const user = (await client.users.getUser(clerkId)) as ClerkUserLike;
    const email = resolvePrimaryEmail(user);
    if (!email) return null;

    return {
      email,
      name: resolveDisplayName(user),
    };
  } catch (error) {
    logger.warn('Failed to resolve Clerk profile for session bootstrap', {
      operation: 'resolve_clerk_profile',
      clerkId: '[FILTERED]',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
