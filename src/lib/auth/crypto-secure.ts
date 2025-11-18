/**
 * Consolidated cryptographically secure utility functions
 * Eliminates duplication across utils.ts and crypto-utils.ts
 */

/**
 * Generate a UUID v4 compatible string using cryptographically secure methods
 * SECURITY: No fallback to Math.random() - fails hard if crypto not available
 */
export function generateSecureUUID(): string {
  // Try modern crypto.randomUUID() first (Node.js 19+ and modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for browsers and older Node.js versions using crypto.getRandomValues()
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);

    // Set version (4) and variant bits according to RFC 4122
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;

    const hex = Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-');
  }

  // SECURITY: No fallback to Math.random() - fail hard if crypto is unavailable
  throw new Error(
    'Cryptographically secure random number generation is not available. Please ensure your environment supports crypto.randomUUID() or crypto.getRandomValues()'
  );
}

/**
 * Generate cryptographically secure random string for general purposes
 * SECURITY: No fallback to Math.random() - fails hard if crypto not available
 */
export function generateSecureRandomString(length: number = 32, charset?: string): string {
  const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const chars = charset || defaultCharset;

  // Use Web Crypto API (available in browsers and Node.js 16+)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }

  // SECURITY: No fallback to Math.random() - fail hard if crypto is unavailable
  throw new Error(
    'Cryptographically secure random number generation is not available. Please ensure your environment supports crypto.getRandomValues()'
  );
}

/**
 * Generate cryptographically secure random bytes as base64 string
 * Useful for encryption keys, tokens, etc.
 */
export function generateSecureBytes(length: number = 32): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    // Convert to base64 in Node.js or browser compatible way
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      return Buffer.from(array).toString('base64');
    } else {
      // Browser environment
      return btoa(String.fromCharCode(...Array.from(array)));
    }
  }

  throw new Error('Cryptographically secure random number generation is not available');
}

/**
 * Generate cryptographically secure hex string
 * Useful for session tokens, request IDs, etc.
 */
export function generateSecureHex(length: number = 32): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  throw new Error('Cryptographically secure random number generation is not available');
}

/**
 * Generate a secure session token with specific format
 */
export function generateSessionToken(): string {
  return `st_${generateSecureHex(24)}`;
}

/**
 * Generate a secure request ID for logging and tracing
 */
export function generateRequestId(): string {
  return `req_${generateSecureHex(16)}`;
}

/**
 * Generate secure backup codes for authentication
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    codes.push(generateSecureRandomString(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'));
  }
  return codes;
}

/**
 * Validate that crypto APIs are available in the current environment
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && !!(crypto.randomUUID || crypto.getRandomValues);
}

/**
 * Get environment info about crypto capabilities
 */
export function getCryptoCapabilities(): {
  hasRandomUUID: boolean;
  hasGetRandomValues: boolean;
  isSecure: boolean;
} {
  return {
    hasRandomUUID: typeof crypto !== 'undefined' && !!crypto.randomUUID,
    hasGetRandomValues: typeof crypto !== 'undefined' && !!crypto.getRandomValues,
    isSecure: typeof crypto !== 'undefined' && (!!crypto.randomUUID || !!crypto.getRandomValues),
  };
}
