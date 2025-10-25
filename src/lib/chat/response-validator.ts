/**
 * Validates AI responses for safety, format, and content quality
 *
 * This layer prevents:
 * - Malformed or corrupted responses
 * - Prompt injection attempts
 * - Response manipulation
 * - Invalid therapeutic content
 */

import { logger } from '@/lib/utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    length: number;
    contentType: 'text' | 'mixed' | 'unknown';
    hasCodeBlocks: boolean;
    hasMarkdown: boolean;
    suspiciousPatterns: string[];
  };
}

/**
 * Configuration for response validation
 */
export interface ValidationConfig {
  minLength?: number;
  maxLength?: number;
  forbiddenPatterns?: RegExp[];
  requireTherapeuticContext?: boolean;
}

const DEFAULT_CONFIG: ValidationConfig = {
  minLength: 10, // Responses should have meaningful content
  maxLength: 50000, // Prevent excessively long responses
  forbiddenPatterns: [
    // SQL injection patterns
    /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b)\s+(?:TABLE|FROM|INTO)/i,
    // Script injection patterns
    /<script[^>]*>.*?<\/script>/gi,
    // Shell command patterns
    /[;&|`$(){}[\]]/g,
  ],
};

/**
 * Patterns that indicate potential prompt injection attempts
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore.*previous.*instruction/i,
  /forget.*everything/i,
  /system.*override/i,
  /execute.*command/i,
  /run.*code/i,
  /pretend.*you.*are/i,
  /act.*as.*if/i,
];

/**
 * Validates AI response content
 */
export function validateResponse(content: string, config: ValidationConfig = DEFAULT_CONFIG): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suspiciousPatterns: string[] = [];

  // Check for empty or null content
  if (!content || typeof content !== 'string') {
    errors.push('Response must be a non-empty string');
    return {
      isValid: false,
      errors,
      warnings,
      metadata: {
        length: 0,
        contentType: 'unknown',
        hasCodeBlocks: false,
        hasMarkdown: false,
        suspiciousPatterns,
      },
    };
  }

  const trimmedContent = content.trim();

  // Check length constraints
  if (config.minLength && trimmedContent.length < config.minLength) {
    warnings.push(`Response is unusually short (${trimmedContent.length} chars, minimum: ${config.minLength})`);
  }

  if (config.maxLength && trimmedContent.length > config.maxLength) {
    errors.push(`Response exceeds maximum length (${trimmedContent.length} > ${config.maxLength})`);
  }

  // Check for forbidden patterns
  if (config.forbiddenPatterns) {
    for (const pattern of config.forbiddenPatterns) {
      if (pattern.test(trimmedContent)) {
        suspiciousPatterns.push(pattern.source);
        errors.push(`Response contains forbidden pattern: ${pattern.source}`);
      }
    }
  }

  // Check for prompt injection attempts
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmedContent)) {
      suspiciousPatterns.push(pattern.source);
      errors.push(`Potential prompt injection detected: ${pattern.source}`);
    }
  }

  // Analyze content structure
  const hasCodeBlocks = /```/g.test(trimmedContent);
  const hasMarkdown = /[*_`#\[\]()]/g.test(trimmedContent);
  const hasUnbalancedBrackets = (trimmedContent.match(/[{[\(]/g) || []).length !==
    (trimmedContent.match(/[}\]\)]/g) || []).length;

  if (hasUnbalancedBrackets) {
    warnings.push('Response has unbalanced brackets or parentheses');
  }

  // Check for excessively repeated characters (potential corruption)
  const repeatedChars = /(.)\1{10,}/g.test(trimmedContent);
  if (repeatedChars) {
    warnings.push('Response contains excessive repeated characters (possible corruption)');
  }

  // Check for unusual Unicode patterns that might indicate encoding issues
  const suspiciousUnicode = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g.test(trimmedContent);
  if (suspiciousUnicode) {
    warnings.push('Response contains suspicious control characters');
  }

  // Determine content type
  const contentType = hasCodeBlocks && hasMarkdown ? 'mixed' : (hasMarkdown ? 'text' : 'text');

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      length: trimmedContent.length,
      contentType,
      hasCodeBlocks,
      hasMarkdown,
      suspiciousPatterns,
    },
  };
}

/**
 * Validates response and throws error if invalid
 * Used in critical paths where response must be safe
 */
export function validateResponseStrict(content: string, config: ValidationConfig = DEFAULT_CONFIG): void {
  const result = validateResponse(content, config);

  if (!result.isValid) {
    const errorMessage = result.errors.join('; ');
    logger.error('Response validation failed', {
      content: content.substring(0, 200),
      errors: result.errors,
      warnings: result.warnings,
      suspiciousPatterns: result.metadata.suspiciousPatterns,
    });

    throw new Error(`Response validation failed: ${errorMessage}`);
  }

  if (result.warnings.length > 0) {
    logger.warn('Response validation warnings', {
      warnings: result.warnings,
      contentLength: result.metadata.length,
    });
  }
}

/**
 * Sanitizes AI response for safe storage and display
 * Removes potentially dangerous content while preserving therapeutic value
 */
export function sanitizeResponse(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let sanitized = content.trim();

  // Remove control characters while preserving newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove excessive whitespace while preserving paragraph breaks
  sanitized = sanitized
    .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    .replace(/\t{2,}/g, '\t'); // Max 1 tab

  // Remove incomplete markdown code blocks
  const codeBlockCount = (sanitized.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    // Odd number of backticks - remove the last incomplete block
    sanitized = sanitized.replace(/```[^`]*$/, '');
  }

  // Normalize quotes to prevent JSON parsing issues
  sanitized = sanitized
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes to apostrophe
    .replace(/[\u201C\u201D]/g, '"'); // Smart quotes to double quote

  return sanitized;
}

/**
 * Validates therapeutic context of response
 * Ensures response aligns with therapeutic principles
 */
export function validateTherapeuticContent(content: string): {
  isTherapeutic: boolean;
  concerns: string[];
  confidence: number;
} {
  const concerns: string[] = [];
  let confidence = 100;

  if (!content || content.length === 0) {
    return {
      isTherapeutic: false,
      concerns: ['Empty response cannot provide therapeutic value'],
      confidence: 0,
    };
  }

  // Check for harmful or non-therapeutic language
  const harmfulPatterns = [
    { pattern: /give.*medication|prescribe/i, message: 'Response appears to provide medical advice' },
    { pattern: /kill.*yourself|hurt.*yourself|self.*harm/i, message: 'Response contains harmful suggestions' },
    { pattern: /guaranteed.*cure|definite.*fix/i, message: 'Response makes unrealistic therapeutic claims' },
    { pattern: /i.*love.*you|marry.*me/i, message: 'Response contains inappropriate personal declarations' },
  ];

  for (const check of harmfulPatterns) {
    if (check.pattern.test(content)) {
      concerns.push(check.message);
      confidence -= 25;
    }
  }

  // Check for therapeutic elements
  const therapeuticIndicators = [
    /understand|listen|support|help|care/i,
    /feel.*better|improve|progress|growth/i,
    /explore|reflect|consider|think/i,
    /compassion|empathy|validation/i,
  ];

  let therapeuticCount = 0;
  for (const indicator of therapeuticIndicators) {
    if (indicator.test(content)) {
      therapeuticCount++;
    }
  }

  if (therapeuticCount === 0) {
    confidence = Math.max(0, confidence - 15);
    concerns.push('Response lacks therapeutic language elements');
  }

  return {
    isTherapeutic: confidence >= 50 && concerns.length === 0,
    concerns,
    confidence: Math.max(0, confidence),
  };
}

/**
 * Gets validation summary for logging and monitoring
 */
export function getValidationSummary(result: ValidationResult): string {
  const parts = [
    `Length: ${result.metadata.length} chars`,
    `Type: ${result.metadata.contentType}`,
    `Code blocks: ${result.metadata.hasCodeBlocks ? 'yes' : 'no'}`,
    `Markdown: ${result.metadata.hasMarkdown ? 'yes' : 'no'}`,
  ];

  if (result.warnings.length > 0) {
    parts.push(`Warnings: ${result.warnings.length}`);
  }

  if (result.errors.length > 0) {
    parts.push(`Errors: ${result.errors.length}`);
  }

  return parts.join(' | ');
}
