// Utility to detect and identify CBT diary messages in chat

export interface CBTMessageSignature {
  hasCBTHeader: boolean;
  hasCBTSections: boolean;
  hasEmotionRatings: boolean;
  hasAutomaticThoughts: boolean;
  hasSchemaAnalysis: boolean;
  hasReflection: boolean;
  confidence: number; // 0-1 score indicating confidence this is a CBT message
}

// Primary patterns that indicate a CBT diary entry
const CBT_HEADER_PATTERNS = [
  /🌟\s*CBT\s+Diary\s+Entry/i,
  /CBT\s+Diary\s+Entry\s+with/i,
  /#\s*🌟\s*CBT\s+Diary/i
];

// Section headers that are characteristic of CBT diary entries
const CBT_SECTION_PATTERNS = [
  /##?\s*📍\s*Situation\s+Context/i,
  /##?\s*💭\s*(Emotional\s+Landscape|Initial\s+Emotions)/i,
  /##?\s*🧠\s*Automatic\s+Thoughts/i,
  /##?\s*🎯\s*Core\s+Schema\s+Analysis/i,
  /##?\s*Challenge\s+Questions/i,
  /##?\s*Final\s+Reflection/i,
  /##?\s*🔄\s*Rational\s+Thoughts/i,
  /##?\s*✨\s*Final\s+Reflection/i
];

// Patterns for emotion ratings (e.g., "- Fear: 7/10", "- Anxiety: 5/10")
const EMOTION_RATING_PATTERNS = [
  /-\s*\w+:\s*\d+\/10/g,
  /-\s*[A-Z][a-z]+:\s*\d+\/10/g
];

// Patterns for automatic thoughts with credibility ratings
const AUTOMATIC_THOUGHT_PATTERNS = [
  /-\s*"[^"]+"\s*\*\(\d+\/10\)\*/g,
  /\*\(\d+\/10\)\*/g
];

// Patterns for schema analysis elements
const SCHEMA_ANALYSIS_PATTERNS = [
  /\*Credibility:\s*\d+\/10\*/i,
  /Core\s+Belief:/i,
  /Behavioral\s+Patterns/i,
  /Confirming\s+behaviors:/i,
  /Avoidant\s+behaviors:/i,
  /Schema\s+Modes/i
];

// Patterns for reflection elements
const REFLECTION_PATTERNS = [
  /SCHEMA\s+REFLECTION/i,
  /Therapeutic\s+Insights/i,
  /Personal\s+Self-Assessment/i,
  /Guided\s+Reflection\s+Insights/i,
  /Updated\s+Feelings/i,
  /Alternative\s+Responses/i
];

/**
 * Analyzes a message to determine if it's a CBT diary entry
 * @param content - The message content to analyze
 * @returns CBTMessageSignature with analysis results
 */
export function analyzeCBTMessage(content: string): CBTMessageSignature {
  const signature: CBTMessageSignature = {
    hasCBTHeader: false,
    hasCBTSections: false,
    hasEmotionRatings: false,
    hasAutomaticThoughts: false,
    hasSchemaAnalysis: false,
    hasReflection: false,
    confidence: 0
  };

  // Check for CBT header patterns
  signature.hasCBTHeader = CBT_HEADER_PATTERNS.some(pattern => pattern.test(content));

  // Check for CBT section patterns (need at least 3 for high confidence)
  const sectionMatches = CBT_SECTION_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
  signature.hasCBTSections = sectionMatches >= 3;

  // Check for emotion ratings
  signature.hasEmotionRatings = EMOTION_RATING_PATTERNS.some(pattern => {
    const matches = content.match(pattern);
    return matches && matches.length >= 2; // Need at least 2 emotion ratings
  });

  // Check for automatic thoughts with credibility ratings
  signature.hasAutomaticThoughts = AUTOMATIC_THOUGHT_PATTERNS.some(pattern => pattern.test(content));

  // Check for schema analysis elements
  const schemaMatches = SCHEMA_ANALYSIS_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
  signature.hasSchemaAnalysis = schemaMatches >= 2;

  // Check for reflection elements
  const reflectionMatches = REFLECTION_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
  signature.hasReflection = reflectionMatches >= 2;

  // Calculate confidence score (0-1)
  let confidenceScore = 0;
  
  // Strong indicators (high weight)
  if (signature.hasCBTHeader) confidenceScore += 0.3;
  if (signature.hasCBTSections) confidenceScore += 0.25;
  if (signature.hasEmotionRatings) confidenceScore += 0.2;
  
  // Medium indicators
  if (signature.hasAutomaticThoughts) confidenceScore += 0.15;
  if (signature.hasSchemaAnalysis) confidenceScore += 0.1;
  
  // Supporting indicators
  if (signature.hasReflection) confidenceScore += 0.05;
  
  // Bonus for having multiple strong indicators
  const strongIndicators = [
    signature.hasCBTHeader,
    signature.hasCBTSections,
    signature.hasEmotionRatings
  ].filter(Boolean).length;
  
  if (strongIndicators >= 2) {
    confidenceScore += 0.1;
  }

  signature.confidence = Math.min(confidenceScore, 1.0);

  return signature;
}

/**
 * Simple boolean check if a message is likely a CBT diary entry
 * @param content - The message content to check
 * @param threshold - Confidence threshold (default: 0.7)
 * @returns boolean indicating if this is likely a CBT diary entry
 */
export function isCBTDiaryMessage(content: string, threshold: number = 0.7): boolean {
  const signature = analyzeCBTMessage(content);
  return signature.confidence >= threshold;
}

/**
 * Get a human-readable description of why a message was identified as CBT
 * @param signature - The CBT message signature
 * @returns string description
 */
export function getCBTIdentificationReason(signature: CBTMessageSignature): string {
  const reasons: string[] = [];
  
  if (signature.hasCBTHeader) reasons.push('CBT diary header');
  if (signature.hasCBTSections) reasons.push('structured CBT sections');
  if (signature.hasEmotionRatings) reasons.push('emotion intensity ratings');
  if (signature.hasAutomaticThoughts) reasons.push('automatic thoughts with credibility');
  if (signature.hasSchemaAnalysis) reasons.push('schema analysis elements');
  if (signature.hasReflection) reasons.push('therapeutic reflection content');
  
  if (reasons.length === 0) return 'No CBT indicators found';
  if (reasons.length === 1) return `Contains ${reasons[0]}`;
  
  const lastReason = reasons.pop();
  return `Contains ${reasons.join(', ')} and ${lastReason}`;
}

/**
 * Extract the date from a CBT diary entry if present
 * @param content - The message content
 * @returns string date or null if not found
 */
export function extractCBTDate(content: string): string | null {
  // Look for patterns like "**Date:** 2024-01-15" or "Date: January 15, 2024"
  const datePatterns = [
    /\*\*Date:\*\*\s*([^\n\r]+)/i,
    /Date:\s*([^\n\r]+)/i
  ];
  
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Determine if a CBT message has schema reflection content
 * @param content - The message content
 * @returns boolean indicating if schema reflection is present
 */
export function hasSchemaReflection(content: string): boolean {
  return /SCHEMA\s+REFLECTION[\s\S]*THERAPEUTIC\s+INSIGHTS/i.test(content) ||
         /Personal\s+Self-Assessment/i.test(content) ||
         /Guided\s+Reflection\s+Insights/i.test(content);
}