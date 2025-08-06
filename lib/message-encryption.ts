import { encryptSensitiveData, decryptSensitiveData } from '@/lib/crypto-utils';

/**
 * Message encryption service for therapeutic content
 * Provides field-level encryption for sensitive therapeutic messages
 */

export interface EncryptedMessage {
  role: string;
  content: string; // This will be encrypted
  timestamp: Date;
}

export interface DecryptedMessage {
  role: string;
  content: string; // This will be decrypted
  timestamp: Date;
}

/**
 * Encrypt a message before storing in database
 */
export function encryptMessage(message: { role: string; content: string; timestamp?: Date }): {
  role: string;
  content: string;
  timestamp: Date;
} {
  // Only encrypt the sensitive content, keep role and timestamp as-is
  const encryptedContent = encryptSensitiveData(message.content);
  
  return {
    role: message.role,
    content: encryptedContent,
    timestamp: message.timestamp || new Date(),
  };
}

/**
 * Decrypt a message after retrieving from database
 */
export function decryptMessage(encryptedMessage: {
  role: string;
  content: string;
  timestamp: Date;
}): {
  role: string;
  content: string;
  timestamp: Date;
} {
  try {
    // Decrypt the sensitive content
    const decryptedContent = decryptSensitiveData(encryptedMessage.content);
    
    return {
      role: encryptedMessage.role,
      content: decryptedContent,
      timestamp: encryptedMessage.timestamp,
    };
  } catch (error) {
    console.error('Failed to decrypt message:', error);
    // Return a safe fallback for corrupted/undecryptable messages
    return {
      role: encryptedMessage.role,
      content: '[Message content unavailable]',
      timestamp: encryptedMessage.timestamp,
    };
  }
}

/**
 * Encrypt multiple messages (bulk operation)
 */
export function encryptMessages(messages: Array<{ role: string; content: string; timestamp?: Date }>): Array<{
  role: string;
  content: string;
  timestamp: Date;
}> {
  return messages.map(message => encryptMessage(message));
}

/**
 * Decrypt multiple messages (bulk operation)
 */
export function decryptMessages(encryptedMessages: Array<{
  role: string;
  content: string;
  timestamp: Date;
}>): Array<{
  role: string;
  content: string;
  timestamp: Date;
}> {
  return encryptedMessages.map(message => decryptMessage(message));
}

/**
 * Encrypt session report content
 */
export function encryptSessionReportContent(reportContent: string): string {
  return encryptSensitiveData(reportContent);
}

/**
 * Decrypt session report content
 */
export function decryptSessionReportContent(encryptedReportContent: string): string {
  try {
    return decryptSensitiveData(encryptedReportContent);
  } catch (error) {
    console.error('Failed to decrypt session report content:', error);
    return '[Report content unavailable]';
  }
}

/**
 * Check if content appears to be encrypted (basic heuristic)
 */
export function isContentEncrypted(content: string): boolean {
  try {
    // Encrypted content should be base64 and longer than typical plain text
    if (content.length > 100 && /^[A-Za-z0-9+/=]+$/.test(content)) {
      // Try to decode as base64 to verify format
      Buffer.from(content, 'base64');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Safe message retrieval that handles both encrypted and unencrypted content
 * Useful during migration or when encryption is being rolled out gradually
 */
export function safeDecryptMessage(message: {
  role: string;
  content: string;
  timestamp: Date;
}): {
  role: string;
  content: string;
  timestamp: Date;
} {
  // If content appears to be encrypted, decrypt it
  if (isContentEncrypted(message.content)) {
    return decryptMessage(message);
  }
  
  // Otherwise, return as-is (unencrypted legacy content)
  return message;
}

/**
 * Bulk safe decryption for multiple messages
 */
export function safeDecryptMessages(messages: Array<{
  role: string;
  content: string;
  timestamp: Date;
}>): Array<{
  role: string;
  content: string;
  timestamp: Date;
}> {
  return messages.map(message => safeDecryptMessage(message));
}