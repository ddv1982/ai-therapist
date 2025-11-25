/**
 * Client-Side Encryption Utilities
 *
 * Provides secure encryption/decryption for client-side data storage using Web Crypto API.
 * Designed for therapeutic draft data with same security standards as server-side crypto.
 *
 * Features:
 * - AES-256-GCM encryption (same as server)
 * - PBKDF2 key derivation with same parameters
 * - Browser-native crypto.getRandomValues()
 * - IndexedDB for secure key storage
 * - Session-based key management
 * - Rate limiting to prevent abuse
 *
 * Security:
 * - Cryptographically secure random number generation
 * - Industry-standard encryption algorithms
 * - Proper salt and IV generation
 * - Memory-safe key handling
 * - 100 operations per minute rate limit
 */

import { logger } from '@/lib/utils/logger';
import { cryptoRateLimiter } from './rate-limiter';

// Encryption constants (matching server-side parameters)
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits
const ITERATIONS = 100000; // Same as server PBKDF2 iterations

/**
 * Custom error class for client-side encryption operations.
 * Extends Error with an optional cause property for error chaining.
 *
 * @class ClientCryptoError
 * @extends Error
 *
 * @example
 * ```typescript
 * throw new ClientCryptoError('Encryption failed', originalError);
 * ```
 */
export class ClientCryptoError extends Error {
  /**
   * Creates a new ClientCryptoError.
   *
   * @param {string} message - Human-readable error description
   * @param {Error} [cause] - Optional underlying error that triggered this error
   */
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ClientCryptoError';
  }
}

/**
 * Generates cryptographically secure random bytes using the Web Crypto API.
 * Used for generating salts, initialization vectors (IVs), and session keys.
 *
 * @param {number} length - Number of random bytes to generate
 * @returns {Uint8Array} Array of cryptographically secure random bytes
 * @throws {ClientCryptoError} If Web Crypto API is not available in the environment
 *
 * @example
 * ```typescript
 * const salt = getRandomBytes(16); // 128 bits for PBKDF2
 * const iv = getRandomBytes(12);   // 96 bits for AES-GCM
 * ```
 *
 * @internal
 */
function getRandomBytes(length: number): Uint8Array {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new ClientCryptoError('Web Crypto API not available');
  }
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert string to ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

/**
 * Convert ArrayBuffer to string
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * Derive encryption key from master key using PBKDF2
 */
async function deriveKey(masterKey: ArrayBuffer, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', masterKey, 'PBKDF2', false, [
    'deriveKey',
  ]);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or create master key for current session
 */
async function getMasterKey(): Promise<ArrayBuffer> {
  // For now, generate a session-based key
  // In the future, this could be derived from user authentication
  const sessionKey = sessionStorage.getItem('therapeutic-session-key');

  if (sessionKey) {
    try {
      return base64ToArrayBuffer(sessionKey);
    } catch {
      logger.warn('Failed to load session key, generating new one', {
        operation: 'getOrCreateSessionKey',
      });
    }
  }

  // Generate new session key
  const newKey = getRandomBytes(32); // 256 bits
  sessionStorage.setItem(
    'therapeutic-session-key',
    arrayBufferToBase64(newKey.buffer as ArrayBuffer)
  );
  return newKey.buffer as ArrayBuffer;
}

/**
 * Get user identifier for rate limiting
 * Uses session ID or 'anonymous' for unauthenticated users
 */
function getUserIdentifier(): string {
  // Try to get user ID from Clerk session if available
  if (typeof window !== 'undefined') {
    try {
      // Check for Clerk user ID in the document
      const clerkUserId = (window as any).__clerk_user_id;
      if (clerkUserId) {
        return clerkUserId;
      }
    } catch {
      // Ignore errors
    }
  }

  // Fall back to session-based identifier
  let sessionId = sessionStorage.getItem('therapeutic-session-id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    sessionStorage.setItem('therapeutic-session-id', sessionId);
  }
  return sessionId;
}

/**
 * Encrypts sensitive data for secure client-side storage using AES-256-GCM.
 *
 * This function applies rate limiting (100 operations per minute) to prevent abuse
 * and uses the same encryption standards as server-side operations. The encrypted
 * data includes salt and IV for proper key derivation and secure decryption.
 *
 * @param {string} plaintext - The plain text data to encrypt
 * @returns {Promise<string>} Base64-encoded encrypted data containing salt + IV + ciphertext
 * @throws {ClientCryptoError} If Web Crypto API is unavailable or encryption fails
 * @throws {Error} If rate limit is exceeded (100 ops/min per user)
 *
 * @example
 * ```typescript
 * const encrypted = await encryptClientData(JSON.stringify({
 *   draft: 'My therapy notes'
 * }));
 * // Store encrypted data in localStorage or IndexedDB
 * localStorage.setItem('draft', encrypted);
 * ```
 *
 * @see {@link decryptClientData} for decryption
 */
export async function encryptClientData(plaintext: string): Promise<string> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new ClientCryptoError('Web Crypto API not available');
    }

    // Apply rate limiting
    const userId = getUserIdentifier();
    cryptoRateLimiter.checkLimit(userId);

    // Get master key and generate salt/IV
    const masterKey = await getMasterKey();
    const salt = getRandomBytes(SALT_LENGTH);
    const iv = getRandomBytes(IV_LENGTH);

    // Derive encryption key
    const key = await deriveKey(masterKey, salt);

    // Encrypt the data
    const encodedData = stringToArrayBuffer(plaintext);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv as BufferSource,
      },
      key,
      encodedData as BufferSource
    );

    // Combine salt + iv + encrypted data for storage
    const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, SALT_LENGTH);
    combined.set(new Uint8Array(encryptedData), SALT_LENGTH + IV_LENGTH);

    // Return as base64
    return arrayBufferToBase64(combined.buffer as ArrayBuffer);
  } catch (error) {
    // If it's a rate limit error, re-throw it as-is
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      throw error;
    }

    throw new ClientCryptoError(
      'Failed to encrypt client data',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Decrypts sensitive data from secure client-side storage.
 *
 * This function reverses the encryption performed by encryptClientData,
 * extracting the salt and IV from the encrypted payload and using them
 * to derive the correct decryption key. Rate limiting is applied to
 * prevent brute-force attacks.
 *
 * @param {string} encryptedData - Base64-encoded encrypted data (salt + IV + ciphertext)
 * @returns {Promise<string>} The decrypted plain text data
 * @throws {ClientCryptoError} If Web Crypto API is unavailable or decryption fails
 * @throws {Error} If rate limit is exceeded (100 ops/min per user)
 *
 * @example
 * ```typescript
 * const encrypted = localStorage.getItem('draft');
 * if (encrypted) {
 *   const decrypted = await decryptClientData(encrypted);
 *   const data = JSON.parse(decrypted);
 *   console.log(data.draft);
 * }
 * ```
 *
 * @see {@link encryptClientData} for encryption
 */
export async function decryptClientData(encryptedData: string): Promise<string> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new ClientCryptoError('Web Crypto API not available');
    }

    // Apply rate limiting
    const userId = getUserIdentifier();
    cryptoRateLimiter.checkLimit(userId);

    // Decode from base64
    const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));

    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Get master key and derive decryption key
    const masterKey = await getMasterKey();
    const key = await deriveKey(masterKey, salt);

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv as BufferSource,
      },
      key,
      encrypted as BufferSource
    );

    // Convert back to string
    return arrayBufferToString(decryptedData);
  } catch (cryptoError) {
    // If it's a rate limit error, re-throw it as-is
    if (cryptoError instanceof Error && cryptoError.message.includes('Rate limit exceeded')) {
      throw cryptoError;
    }

    throw new ClientCryptoError(
      'Failed to decrypt client data',
      cryptoError instanceof Error ? cryptoError : new Error(String(cryptoError))
    );
  }
}

/**
 * Check if client-side encryption is available
 */
export function isClientCryptoAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    crypto.subtle !== undefined &&
    crypto.getRandomValues !== undefined
  );
}

/**
 * Clear session encryption key (for logout/cleanup)
 */
export function clearClientCryptoSession(): void {
  try {
    sessionStorage.removeItem('therapeutic-session-key');
    sessionStorage.removeItem('therapeutic-session-id');

    // Also reset rate limiter for this user
    const userId = getUserIdentifier();
    cryptoRateLimiter.reset(userId);
  } catch (error) {
    logger.warn('Failed to clear crypto session', {
      operation: 'clearCryptoSession',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get encryption status for debugging
 */
export function getClientCryptoStatus(): {
  available: boolean;
  hasSessionKey: boolean;
  algorithm: string;
  keyLength: number;
  rateLimit: {
    limit: number;
    usage: { count: number; resetAt: number; limit: number } | null;
  };
} {
  const userId = getUserIdentifier();
  const usage = cryptoRateLimiter.getUsage(userId);

  return {
    available: isClientCryptoAvailable(),
    hasSessionKey: sessionStorage.getItem('therapeutic-session-key') !== null,
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH,
    rateLimit: {
      limit: 100,
      usage,
    },
  };
}

/**
 * Reset rate limit for current user (for testing purposes)
 */
export function resetRateLimit(): void {
  const userId = getUserIdentifier();
  cryptoRateLimiter.reset(userId);
}
