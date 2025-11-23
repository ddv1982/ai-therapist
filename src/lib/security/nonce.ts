import { headers } from 'next/headers';

/**
 * Get the CSP nonce for the current request.
 * Use in server components to add nonce to inline scripts/styles.
 */
export async function getNonce(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('x-csp-nonce') ?? undefined;
}

/**
 * Get the CSP nonce as an attribute object.
 * Returns {nonce: string} or empty object for spreading into JSX.
 */
export async function getNonceAttr(): Promise<{ nonce?: string }> {
  const nonce = await getNonce();
  return nonce ? { nonce } : {};
}
