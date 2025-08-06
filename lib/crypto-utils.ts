import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

/**
 * Encryption configuration
 */
const ALGORITHM = 'aes-256-gcm';
const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

/**
 * Get encryption key from environment or generate error
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for TOTP secret encryption');
  }
  
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  
  return Buffer.from(key, 'utf8');
}

/**
 * Derive key from master key using PBKDF2
 */
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
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
 * Encrypt backup codes array
 */
export function encryptBackupCodes(backupCodes: any[]): string {
  return encryptSensitiveData(JSON.stringify(backupCodes));
}

/**
 * Decrypt backup codes array
 */
export function decryptBackupCodes(encryptedBackupCodes: string): any[] {
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

/**
 * Validate encryption key strength
 */
export function validateEncryptionKey(key: string): boolean {
  if (key.length < 32) return false;
  
  // Check for sufficient entropy (basic check)
  const uniqueChars = new Set(key).size;
  return uniqueChars >= 16; // Should have reasonable character diversity
}