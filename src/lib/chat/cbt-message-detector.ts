// Utility to detect and identify CBT diary messages in chat

export interface CBTMessageSignature {
  hasCBTHeader: boolean;
  hasCBTSections: boolean;
  hasEmotionRatings: boolean;
  hasAutomaticThoughts: boolean;
  hasSchemaAnalysis: boolean;
  hasReflection: boolean;

  // Enhanced detection for quantified self-assessments
  hasQuantifiedSelfAssessment: boolean;
  hasUserProvidedRatings: boolean;
  hasSchemaReflectionContent: boolean;
  schemaReflectionDepth: 'none' | 'minimal' | 'moderate' | 'comprehensive';

  confidence: number; // 0-1 score indicating confidence this is a CBT message
}

// Primary patterns that indicate a CBT diary entry
const CBT_HEADER_PATTERNS = [
  /🌟\s*CBT\s+Diary\s+Entry/i,
  /CBT\s+Diary\s+Entry\s+with/i,
  /#\s*🌟\s*CBT\s+Diary/i,
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
  /##?\s*✨\s*Final\s+Reflection/i,
];

// Patterns for emotion ratings (e.g., "- Fear: 7/10", "- Anxiety: 5/10")
const EMOTION_RATING_PATTERNS = [/-\s*\w+:\s*\d+\/10/g, /-\s*[A-Z][a-z]+:\s*\d+\/10/g];

// Patterns for automatic thoughts with credibility ratings
const AUTOMATIC_THOUGHT_PATTERNS = [/-\s*"[^"]+"\s*\*\(\d+\/10\)\*/g, /\*\(\d+\/10\)\*/g];

// Patterns for schema analysis elements
const SCHEMA_ANALYSIS_PATTERNS = [
  /\*Credibility:\s*\d+\/10\*/i,
  /Core\s+Belief:/i,
  /Behavioral\s+Patterns/i,
  /Confirming\s+behaviors:/i,
  /Avoidant\s+behaviors:/i,
  /Schema\s+Modes/i,
];

// Enhanced patterns for quantified self-assessments
const QUANTIFIED_SELF_PATTERNS = [
  /I feel.*\d+\/10/i, // "I feel anxiety at 7/10"
  /my.*level.*is.*\d+/i, // "My stress level is 8"
  /I would rate.*\d+/i, // "I would rate this feeling as 6"
  /on a scale.*\d+/i, // "On a scale of 1-10, I'm at 7"
  /I assess.*\d+/i, // "I assess my confidence as 4"
  /personally.*\d+.*out of/i, // "Personally I'd say 6 out of 10"
  /\d+\/10.*intensity/i, // "7/10 intensity"
  /feeling.*\d+.*percent/i, // "feeling about 80 percent confident"
];

// Enhanced patterns for user-provided ratings (take precedence over AI inference)
const USER_RATING_PATTERNS = [
  /-\s*\w+:\s*\d+\/10/g, // Structured ratings like "- Anxiety: 7/10"
  /\*\(\d+\/10\)\*/g, // Credibility ratings like "*(7/10)*"
  /I rate this as \d+/i, // "I rate this as 6"
  /self-assessment:\s*\d+/i, // "self-assessment: 8"
  /my rating:\s*\d+/i, // "my rating: 5"
];

// Comprehensive schema reflection patterns
const ENHANCED_SCHEMA_REFLECTION_PATTERNS = [
  /SCHEMA\s+REFLECTION[\s\S]*THERAPEUTIC\s+INSIGHTS/i,
  /Personal\s+Self-Assessment/i,
  /Guided\s+Reflection\s+Insights/i,
  /childhood.*patterns.*shaped/i,
  /early.*experiences.*influence/i,
  /core.*beliefs?.*formed/i,
  /schema\s+modes.*activated/i,
  /maladaptive.*patterns.*developed/i,
  /protective.*mechanisms.*learned/i,
  /inner.*critic.*voice/i,
  /vulnerable.*child.*part/i,
  /healing.*journey.*insights/i,
];

// Patterns for reflection elements
const REFLECTION_PATTERNS = [
  /SCHEMA\s+REFLECTION/i,
  /Therapeutic\s+Insights/i,
  /Personal\s+Self-Assessment/i,
  /Guided\s+Reflection\s+Insights/i,
  /Updated\s+Feelings/i,
  /Alternative\s+Responses/i,
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

    // Enhanced detection fields
    hasQuantifiedSelfAssessment: false,
    hasUserProvidedRatings: false,
    hasSchemaReflectionContent: false,
    schemaReflectionDepth: 'none',

    confidence: 0,
  };

  // Check for CBT header patterns
  signature.hasCBTHeader = CBT_HEADER_PATTERNS.some((pattern) => pattern.test(content));

  // Check for CBT section patterns (need at least 3 for high confidence)
  const sectionMatches = CBT_SECTION_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
  signature.hasCBTSections = sectionMatches >= 3;

  // Check for emotion ratings
  signature.hasEmotionRatings = EMOTION_RATING_PATTERNS.some((pattern) => {
    const matches = content.match(pattern);
    return matches && matches.length >= 2; // Need at least 2 emotion ratings
  });

  // Check for automatic thoughts with credibility ratings
  signature.hasAutomaticThoughts = AUTOMATIC_THOUGHT_PATTERNS.some((pattern) =>
    pattern.test(content)
  );

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

  // Enhanced detection: Quantified self-assessments
  signature.hasQuantifiedSelfAssessment = QUANTIFIED_SELF_PATTERNS.some((pattern) =>
    pattern.test(content)
  );

  // Enhanced detection: User-provided ratings (prioritized over AI inference)
  signature.hasUserProvidedRatings = USER_RATING_PATTERNS.some((pattern) => pattern.test(content));

  // Enhanced detection: Schema reflection content
  const schemaReflectionMatches = ENHANCED_SCHEMA_REFLECTION_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);

  signature.hasSchemaReflectionContent = schemaReflectionMatches > 0;

  // Assess schema reflection depth
  if (schemaReflectionMatches >= 8) {
    signature.schemaReflectionDepth = 'comprehensive';
  } else if (schemaReflectionMatches >= 4) {
    signature.schemaReflectionDepth = 'moderate';
  } else if (schemaReflectionMatches >= 1) {
    signature.schemaReflectionDepth = 'minimal';
  } else {
    signature.schemaReflectionDepth = 'none';
  }

  // Calculate confidence score (0-1) with enhanced detection
  let confidenceScore = 0;

  // Strong indicators (high weight) - User assessments are premium data
  if (signature.hasCBTHeader) confidenceScore += 0.25;
  if (signature.hasCBTSections) confidenceScore += 0.2;
  if (signature.hasEmotionRatings) confidenceScore += 0.15;
  if (signature.hasUserProvidedRatings) confidenceScore += 0.2; // User ratings are premium
  if (signature.hasQuantifiedSelfAssessment) confidenceScore += 0.15; // Self-quantification is valuable

  // Medium indicators
  if (signature.hasAutomaticThoughts) confidenceScore += 0.1;
  if (signature.hasSchemaAnalysis) confidenceScore += 0.08;

  // Schema reflection bonuses (high therapeutic value)
  if (signature.hasSchemaReflectionContent) {
    switch (signature.schemaReflectionDepth) {
      case 'comprehensive':
        confidenceScore += 0.25;
        break;
      case 'moderate':
        confidenceScore += 0.15;
        break;
      case 'minimal':
        confidenceScore += 0.08;
        break;
    }
  }

  // Supporting indicators
  if (signature.hasReflection) confidenceScore += 0.04;

  // Bonus for having multiple premium indicators (user assessments + structure)
  const premiumIndicators = [
    signature.hasCBTHeader,
    signature.hasCBTSections,
    signature.hasUserProvidedRatings,
    signature.hasQuantifiedSelfAssessment,
    signature.hasSchemaReflectionContent,
  ].filter(Boolean).length;

  if (premiumIndicators >= 3) {
    confidenceScore += 0.1; // Strong multi-indicator bonus
  } else if (premiumIndicators >= 2) {
    confidenceScore += 0.05;
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

  // Prioritize user-provided assessments (premium indicators)
  if (signature.hasUserProvidedRatings) reasons.push('user-provided ratings (premium data)');
  if (signature.hasQuantifiedSelfAssessment) reasons.push('quantified self-assessments');

  // Schema reflection content
  if (signature.hasSchemaReflectionContent) {
    reasons.push(`schema reflection (${signature.schemaReflectionDepth} depth)`);
  }

  // Traditional CBT indicators
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
  const datePatterns = [/\*\*Date:\*\*\s*([^\n\r]+)/i, /Date:\s*([^\n\r]+)/i];

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
  return ENHANCED_SCHEMA_REFLECTION_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Determine if content contains user-provided quantified assessments
 * These should take priority over AI inference in analysis
 * @param content - The message content
 * @returns boolean indicating presence of user self-assessments
 */
export function hasUserQuantifiedAssessments(content: string): boolean {
  return (
    QUANTIFIED_SELF_PATTERNS.some((pattern) => pattern.test(content)) ||
    USER_RATING_PATTERNS.some((pattern) => pattern.test(content))
  );
}

/**
 * Extract user-provided emotion/distress ratings from content
 * @param content - The message content
 * @returns array of extracted ratings with context
 */
export function extractUserRatings(
  content: string
): Array<{ rating: number; context: string; type: 'emotion' | 'credibility' | 'general' }> {
  const ratings: Array<{
    rating: number;
    context: string;
    type: 'emotion' | 'credibility' | 'general';
  }> = [];

  // Extract structured emotion ratings (- Emotion: 7/10)
  const emotionMatches = content.match(/-\s*(\w+):\s*(\d+)\/10/g);
  if (emotionMatches) {
    emotionMatches.forEach((match) => {
      const [, emotion, rating] = match.match(/-\s*(\w+):\s*(\d+)\/10/) || [];
      if (emotion && rating) {
        ratings.push({
          rating: parseInt(rating),
          context: emotion,
          type: 'emotion',
        });
      }
    });
  }

  // Extract credibility ratings (*(7/10)*)
  const credibilityMatches = content.match(/\*(\d+)\/10\*/g);
  if (credibilityMatches) {
    credibilityMatches.forEach((match) => {
      const rating = match.match(/\*(\d+)\/10\*/)?.[1];
      if (rating) {
        ratings.push({
          rating: parseInt(rating),
          context: 'thought credibility',
          type: 'credibility',
        });
      }
    });
  }

  // Extract general self-assessments
  const generalPatterns = [
    { pattern: /I feel.*?(\d+)\/10/i, type: 'emotion' as const },
    { pattern: /my.*level.*is.*(\d+)/i, type: 'general' as const },
    { pattern: /I would rate.*?(\d+)/i, type: 'general' as const },
  ];

  generalPatterns.forEach(({ pattern, type }) => {
    const match = content.match(pattern);
    if (match && match[1]) {
      const rating = parseInt(match[1]);
      if (rating >= 0 && rating <= 10) {
        ratings.push({
          rating,
          context: 'self-assessment',
          type,
        });
      }
    }
  });

  return ratings;
}
