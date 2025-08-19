import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync, pbkdf2 } from 'crypto';
import { promisify } from 'util';

/**
 * Encryption configuration
 */
const ALGORITHM = 'aes-256-gcm';
const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

// Promisified async version of pbkdf2
const pbkdf2Async = promisify(pbkdf2);

/**
 * Generate a secure encryption key for production use
 */
export function generateSecureEncryptionKey(): string {
  // Generate 256-bit (32 bytes) random key and encode as base64
  const keyBytes = randomBytes(32);
  return keyBytes.toString('base64');
}

/**
 * Validate encryption key format and strength
 */
export function validateEncryptionKey(key: string): { valid: boolean; error?: string } {
  if (!key) {
    return { valid: false, error: 'Encryption key is required' };
  }
  
  if (key.length < 32) {
    return { valid: false, error: 'Encryption key must be at least 32 characters long' };
  }
  
  // Check if it's a properly formatted base64 key (recommended)
  try {
    const decoded = Buffer.from(key, 'base64');
    if (decoded.length < 32) {
      return { valid: false, error: 'Encryption key must decode to at least 32 bytes' };
    }
  } catch {
    // If base64 decoding fails, check if it's at least 32 UTF-8 characters
    if (Buffer.from(key, 'utf8').length < 32) {
      return { valid: false, error: 'Encryption key must be at least 32 bytes when encoded as UTF-8' };
    }
  }
  
  return { valid: true };
}

/**
 * Get encryption key from environment with secure initialization support
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    // In development, provide guidance for setup
    if (process.env.NODE_ENV === 'development') {
      const generatedKey = generateSecureEncryptionKey();
      throw new Error(
        `ENCRYPTION_KEY environment variable is required. For development, you can use:\n` +
        `ENCRYPTION_KEY="${generatedKey}"\n\n` +
        `For production, generate a secure key and store it safely in your deployment environment.`
      );
    }
    
    throw new Error('ENCRYPTION_KEY environment variable is required for production deployment');
  }
  
  // Validate the key
  const validation = validateEncryptionKey(key);
  if (!validation.valid) {
    throw new Error(`Invalid encryption key: ${validation.error}`);
  }
  
  // Try to decode as base64 first (recommended format)
  try {
    const decoded = Buffer.from(key, 'base64');
    if (decoded.length >= 32) {
      return decoded;
    }
  } catch {
    // Fall back to UTF-8 encoding for backward compatibility
  }
  
  return Buffer.from(key, 'utf8');
}

/**
 * Derive key from master key using PBKDF2 (synchronous version)
 */
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Derive key from master key using PBKDF2 (asynchronous version)
 */
async function deriveKeyAsync(masterKey: Buffer, salt: Buffer): Promise<Buffer> {
  return pbkdf2Async(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt sensitive data (like TOTP secrets)
 */
export function encryptSensitiveData(plaintext: string): string {
  const masterKey = getEncryptionKey();
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(masterKey, salt);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + tag + encrypted data
  const combined = Buffer.concat([
    salt,
    iv, 
    tag,
    Buffer.from(encrypted, 'hex')
  ]);
  
  return combined.toString('base64');
}

/**
 * Decrypt sensitive data (like TOTP secrets)
 */
export function decryptSensitiveData(encryptedData: string): string {
  const masterKey = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = deriveKey(masterKey, salt);
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encrypt sensitive data asynchronously (for better performance in bulk operations)
 */
export async function encryptSensitiveDataAsync(plaintext: string): Promise<string> {
  const masterKey = getEncryptionKey();
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = await deriveKeyAsync(masterKey, salt);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + tag + encrypted data
  const combined = Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, 'hex')
  ]);
  
  return combined.toString('base64');
}

/**
 * Decrypt sensitive data asynchronously (for better performance in bulk operations)
 */
export async function decryptSensitiveDataAsync(encryptedData: string): Promise<string> {
  const masterKey = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = await deriveKeyAsync(masterKey, salt);
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Backup code interface for type safety
 */
interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
}

/**
 * Encrypt backup codes array
 */
export function encryptBackupCodes(backupCodes: BackupCode[]): string {
  return encryptSensitiveData(JSON.stringify(backupCodes));
}

/**
 * Decrypt backup codes array
 */
export function decryptBackupCodes(encryptedBackupCodes: string): BackupCode[] {
  const decrypted = decryptSensitiveData(encryptedBackupCodes);
  return JSON.parse(decrypted);
}

/**
 * Generate a cryptographically secure encryption key for environment setup
 * This is a utility function for initial setup - the key should be stored securely
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('base64');
}

// Re-export backup code generation from consolidated crypto module
export { generateBackupCodes } from './crypto-secure';

