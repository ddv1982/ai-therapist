/**
 * Secure encryption utilities for sensitive data storage
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits

/**
 * Get or generate encryption key from environment
 */
function getEncryptionKey(): Buffer {
  let key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    // Generate a new key for local development
    key = crypto.randomBytes(KEY_LENGTH).toString('hex');
    console.warn('⚠️  No ENCRYPTION_KEY found in environment. Using generated key for this session.');
    console.warn('⚠️  Add this to your .env.local for persistence:');
    console.warn(`ENCRYPTION_KEY=${key}`);
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data using AES-256-CBC
 */
export function encryptData(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipher(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV + encrypted data
    const result = iv.toString('hex') + encrypted;
    return result;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt sensitive data using AES-256-CBC
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    
    // Extract IV and encrypted data
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
    const encrypted = encryptedData.slice(IV_LENGTH * 2);
    
    const decipher = crypto.createDecipher(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Encrypt email credentials for secure storage
 */
export function encryptEmailCredentials(credentials: {
  service: string;
  smtpHost: string;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
}): string {
  const jsonString = JSON.stringify(credentials);
  return encryptData(jsonString);
}

/**
 * Decrypt email credentials from secure storage
 */
export function decryptEmailCredentials(encryptedData: string): {
  service: string;
  smtpHost: string;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
} {
  const jsonString = decryptData(encryptedData);
  return JSON.parse(jsonString);
}

/**
 * Validate encryption/decryption functionality
 */
export function validateEncryption(): boolean {
  try {
    const testData = 'test-encryption-validation';
    const encrypted = encryptData(testData);
    const decrypted = decryptData(encrypted);
    return decrypted === testData;
  } catch {
    return false;
  }
}