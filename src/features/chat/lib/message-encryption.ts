import { encryptSensitiveData, decryptSensitiveData } from '@/lib/auth/crypto-utils';
import { logger } from '@/lib/utils/logger';

/**
 * Message encryption service for therapeutic content
 * Provides field-level encryption for sensitive therapeutic messages
 */

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
    logger.error('Failed to decrypt therapeutic message', {
      operation: 'decryptMessage',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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
export function encryptMessages(
  messages: Array<{ role: string; content: string; timestamp?: Date }>
): Array<{
  role: string;
  content: string;
  timestamp: Date;
}> {
  return messages.map((message) => encryptMessage(message));
}

/**
 * Decrypt multiple messages (bulk operation)
 */
export function decryptMessages(
  encryptedMessages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>
): Array<{
  role: string;
  content: string;
  timestamp: Date;
}> {
  return encryptedMessages.map((message) => decryptMessage(message));
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
    logger.error('Failed to decrypt session report content', {
      operation: 'decryptSessionReportContent',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return '[Report content unavailable]';
  }
}

/**
 * Check if content appears to be encrypted (basic heuristic)
 */
export function isContentEncrypted(content: string): boolean {
  try {
    // Encrypted content should be base64 and longer than typical plain text
    // Also check if it looks like our encryption format (base64 with sufficient length)
    if (content.length > 50 && /^[A-Za-z0-9+/=]+$/.test(content)) {
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
export function safeDecryptMessage(message: { role: string; content: string; timestamp: Date }): {
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
export function safeDecryptMessages(
  messages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>
): Array<{
  role: string;
  content: string;
  timestamp: Date;
}> {
  return messages.map((message) => safeDecryptMessage(message));
}

// ========================================
// ENHANCED PSYCHOLOGICAL ANALYSIS ENCRYPTION
// ========================================

/**
 * Encrypt cognitive distortions analysis data
 */
export function encryptCognitiveDistortions(distortions: unknown[]): string {
  return encryptSensitiveData(JSON.stringify(distortions));
}

/**
 * Decrypt cognitive distortions analysis data
 */
export function decryptCognitiveDistortions(encryptedDistortions: string): unknown[] {
  try {
    const decryptedData = decryptSensitiveData(encryptedDistortions);
    return JSON.parse(decryptedData) as unknown[];
  } catch (error) {
    logger.error('Failed to decrypt cognitive distortions data', {
      operation: 'decryptCognitiveDistortions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Encrypt schema analysis data
 */
export function encryptSchemaAnalysis(schemaAnalysis: Record<string, unknown>): string {
  return encryptSensitiveData(JSON.stringify(schemaAnalysis));
}

/**
 * Decrypt schema analysis data
 */
export function decryptSchemaAnalysis(encryptedSchemaAnalysis: string): Record<string, unknown> {
  try {
    const decryptedData = decryptSensitiveData(encryptedSchemaAnalysis);
    return JSON.parse(decryptedData) as Record<string, unknown>;
  } catch (error) {
    logger.error('Failed to decrypt schema analysis data', {
      operation: 'decryptSchemaAnalysis',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      activeModes: [],
      triggeredSchemas: [],
      predominantMode: null,
      behavioralPatterns: [],
      copingStrategies: { adaptive: [], maladaptive: [] },
      therapeuticRecommendations: [],
    };
  }
}

/**
 * Encrypt therapeutic frameworks data
 */
export function encryptTherapeuticFrameworks(frameworks: unknown[]): string {
  return encryptSensitiveData(JSON.stringify(frameworks));
}

/**
 * Decrypt therapeutic frameworks data
 */
export function decryptTherapeuticFrameworks(encryptedFrameworks: string): unknown[] {
  try {
    const decryptedData = decryptSensitiveData(encryptedFrameworks);
    return JSON.parse(decryptedData) as unknown[];
  } catch (error) {
    logger.error('Failed to decrypt therapeutic frameworks data', {
      operation: 'decryptTherapeuticFrameworks',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Encrypt therapeutic recommendations data
 */
export function encryptTherapeuticRecommendations(recommendations: unknown[]): string {
  return encryptSensitiveData(JSON.stringify(recommendations));
}

/**
 * Decrypt therapeutic recommendations data
 */
export function decryptTherapeuticRecommendations(encryptedRecommendations: string): unknown[] {
  try {
    const decryptedData = decryptSensitiveData(encryptedRecommendations);
    return JSON.parse(decryptedData) as unknown[];
  } catch (error) {
    logger.error('Failed to decrypt therapeutic recommendations data', {
      operation: 'decryptTherapeuticRecommendations',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Comprehensive encryption for all enhanced analysis data
 */
export function encryptEnhancedAnalysisData(analysisData: {
  cognitiveDistortions?: unknown[];
  schemaAnalysis?: Record<string, unknown>;
  therapeuticFrameworks?: unknown[];
  recommendations?: unknown[];
}) {
  return {
    cognitiveDistortions: analysisData.cognitiveDistortions
      ? encryptCognitiveDistortions(analysisData.cognitiveDistortions)
      : null,
    schemaAnalysis: analysisData.schemaAnalysis
      ? encryptSchemaAnalysis(analysisData.schemaAnalysis)
      : null,
    therapeuticFrameworks: analysisData.therapeuticFrameworks
      ? encryptTherapeuticFrameworks(analysisData.therapeuticFrameworks)
      : null,
    recommendations: analysisData.recommendations
      ? encryptTherapeuticRecommendations(analysisData.recommendations)
      : null,
  };
}

/**
 * Comprehensive decryption for all enhanced analysis data
 */
export function decryptEnhancedAnalysisData(encryptedData: {
  cognitiveDistortions?: string | null;
  schemaAnalysis?: string | null;
  therapeuticFrameworks?: string | null;
  recommendations?: string | null;
}) {
  return {
    cognitiveDistortions: encryptedData.cognitiveDistortions
      ? decryptCognitiveDistortions(encryptedData.cognitiveDistortions)
      : [],
    schemaAnalysis: encryptedData.schemaAnalysis
      ? decryptSchemaAnalysis(encryptedData.schemaAnalysis)
      : {
          activeModes: [],
          triggeredSchemas: [],
          predominantMode: null,
          behavioralPatterns: [],
          copingStrategies: { adaptive: [], maladaptive: [] },
          therapeuticRecommendations: [],
        },
    therapeuticFrameworks: encryptedData.therapeuticFrameworks
      ? decryptTherapeuticFrameworks(encryptedData.therapeuticFrameworks)
      : [],
    recommendations: encryptedData.recommendations
      ? decryptTherapeuticRecommendations(encryptedData.recommendations)
      : [],
  };
}
