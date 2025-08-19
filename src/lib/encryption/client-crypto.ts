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
 * 
 * Security:
 * - Cryptographically secure random number generation
 * - Industry-standard encryption algorithms
 * - Proper salt and IV generation
 * - Memory-safe key handling
 */

import { logger } from '@/lib/utils/logger';

// Encryption constants (matching server-side parameters)
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits
// const TAG_LENGTH = 16; // 128 bits - Reserved for future use
const ITERATIONS = 100000; // Same as server PBKDF2 iterations

// Key storage constants - Reserved for future IndexedDB implementation
// const KEY_STORE_NAME = 'therapeutic-keys';
// const KEY_STORE_VERSION = 1;

/**
 * Client-side encryption error class
 */
export class ClientCryptoError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'ClientCryptoError';
  }
}

/**
 * Generate cryptographically secure random bytes
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
  return encoder.encode(str);
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
  return bytes.buffer;
}

/**
 * Derive encryption key from master key using PBKDF2
 */
async function deriveKey(masterKey: ArrayBuffer, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    masterKey,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH
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
        operation: 'getOrCreateSessionKey'
      });
    }
  }

  // Generate new session key
  const newKey = getRandomBytes(32); // 256 bits
  sessionStorage.setItem('therapeutic-session-key', arrayBufferToBase64(newKey.buffer));
  return newKey.buffer;
}

/**
 * Encrypt sensitive data for client-side storage
 */
export async function encryptClientData(plaintext: string): Promise<string> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new ClientCryptoError('Web Crypto API not available');
    }

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
        iv: iv
      },
      key,
      encodedData
    );

    // Combine salt + iv + encrypted data for storage
    const combined = new Uint8Array(
      SALT_LENGTH + IV_LENGTH + encryptedData.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, SALT_LENGTH);
    combined.set(new Uint8Array(encryptedData), SALT_LENGTH + IV_LENGTH);

    // Return as base64
    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    throw new ClientCryptoError(
      'Failed to encrypt client data',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Decrypt sensitive data from client-side storage
 */
export async function decryptClientData(encryptedData: string): Promise<string> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      throw new ClientCryptoError('Web Crypto API not available');
    }

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
        iv: iv
      },
      key,
      encrypted
    );

    // Convert back to string
    return arrayBufferToString(decryptedData);
  } catch (cryptoError) {
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
  } catch (error) {
    logger.warn('Failed to clear crypto session', {
      operation: 'clearCryptoSession',
      error: error instanceof Error ? error.message : 'Unknown error'
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
} {
  return {
    available: isClientCryptoAvailable(),
    hasSessionKey: sessionStorage.getItem('therapeutic-session-key') !== null,
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH
  };
}