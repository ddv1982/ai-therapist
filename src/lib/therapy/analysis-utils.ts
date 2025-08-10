/**
 * Consolidated Analysis Utilities
 * 
 * Centralized utility functions to eliminate DRY violations across the therapeutic
 * analysis system. Provides shared pattern detection, content analysis, and 
 * assessment logic used by multiple analysis modules.
 */

// ========================================
// SHARED PATTERN DEFINITIONS
// ========================================

/**
 * Enhanced patterns for user-provided quantified assessments
 * These patterns detect when users provide explicit self-ratings
 */
export const USER_QUANTIFIED_ASSESSMENT_PATTERNS = [
  /I feel.*\d+\/10/i,  // "I feel anxiety at 7/10"
  /my.*level.*is.*\d+/i,  // "My stress level is 8"
  /I would rate.*\d+/i,  // "I would rate this feeling as 6"
  /on a scale.*\d+/i,  // "On a scale of 1-10, I'm at 7"
  /I assess.*\d+/i,  // "I assess my confidence as 4"
  /personally.*\d+.*out of/i,  // "Personally I'd say 6 out of 10"
  /\d+\/10.*intensity/i,  // "7/10 intensity"
  /feeling.*\d+.*percent/i,  // "feeling about 80 percent confident"
  /-\s*\w+:\s*\d+\/10/g,  // Structured ratings like "- Anxiety: 7/10"
  /\*\(\d+\/10\)\*/g,  // Credibility ratings like "*(7/10)*"
  /I rate this as \d+/i,  // "I rate this as 6"
  /self-assessment:\s*\d+/i,  // "self-assessment: 8"
  /my rating:\s*\d+/i,  // "my rating: 5"
  /I'd rate.*\d+\/10/i,  // "I'd rate as about 6/10 intensity"
  /.*is probably \d+\/10/i,  // "confidence in social situations is probably 3/10"
  /was about \d+\/10/i,  // "My anxiety level was about 7/10"
  /rate.*as.*\d+\/10/i,  // "rate this as 8/10"
  /my.*is \d+\/10/i,  // "My anxiety is 9/10"
  /.*anxiety.*\d+\/10/i,  // "anxiety is 9/10"
  /.*stress.*\d+\/10/i,  // "stress is 8/10"
  /.*depression.*\d+\/10/i  // "depression is 7/10"
];

/**
 * Enhanced schema reflection patterns for comprehensive detection
 */
export const SCHEMA_REFLECTION_INDICATORS = [
  /SCHEMA\s+REFLECTION/i,
  /Personal\s+Self-Assessment/i,
  /Therapeutic\s+Insights/i,
  /Guided\s+Reflection\s+Insights/i,
  /childhood.*patterns/i,
  /childhood.*criticism/i,
  /core\s+beliefs?/i, // Allow both singular and plural
  /schema\s+modes/i,
  /maladaptive.*patterns/i,
  /early.*experiences.*influence/i,
  /protective.*mechanisms.*learned/i,
  /inner.*critic.*voice/i,
  /vulnerable.*child.*part/i,
  /healing.*journey.*insights/i,
  /self-awareness/i,
  /shaped.*beliefs/i,
  /triggered.*situations/i
];

/**
 * Brief request patterns that indicate minimal analysis needs
 */
export const BRIEF_REQUEST_PATTERNS = [
  /^(can you |could you |please )?search (for|about)/i,
  /^(can you |could you |please )?find.*information/i,
  /^(can you |could you |please )?look up/i,
  /^(can you |could you |please )?help me find/i,
  /^what are some.*resources/i,
  /^where can I find/i,
  /^do you know.*about/i,
  /^tell me about/i
];

// ========================================
// SHARED INTERFACES
// ========================================

export interface UserRatingExtraction {
  rating: number;
  context: string;
  type: 'emotion' | 'credibility' | 'general';
}

export interface ContentAnalysisMetrics {
  wordCount: number;
  hasUserAssessments: boolean;
  userAssessmentCount: number;
  schemaReflectionDepth: 'none' | 'minimal' | 'moderate' | 'comprehensive';
  isBriefRequest: boolean;
  userDataReliability: number; // 0-100
}

export interface UserDataPriority {
  hasUserProvidedData: boolean;
  userRatingCount: number;
  userDataReliability: number;
  shouldPrioritizeUserData: boolean;
  extractedRatings: UserRatingExtraction[];
  userAssessmentTypes: string[];
}

// ========================================
// CORE ANALYSIS FUNCTIONS
// ========================================

/**
 * Comprehensive extraction of user-provided ratings and assessments
 * Consolidates logic from cbt-message-detector and content-priority modules
 */
export function extractUserRatings(content: string): UserRatingExtraction[] {
  const ratings: UserRatingExtraction[] = [];
  
  // Extract structured emotion ratings (- Emotion: 7/10)
  const emotionMatches = content.match(/-\s*(\w+):\s*(\d+)\/10/g);
  if (emotionMatches) {
    emotionMatches.forEach(match => {
      const [, emotion, rating] = match.match(/-\s*(\w+):\s*(\d+)\/10/) || [];
      if (emotion && rating) {
        ratings.push({
          rating: parseInt(rating),
          context: emotion,
          type: 'emotion'
        });
      }
    });
  }
  
  // Extract credibility ratings (*(7/10)*)
  const credibilityMatches = content.match(/\*(\d+)\/10\*/g);
  if (credibilityMatches) {
    credibilityMatches.forEach(match => {
      const rating = match.match(/\*(\d+)\/10\*/)?.[1];
      if (rating) {
        ratings.push({
          rating: parseInt(rating),
          context: 'thought credibility',
          type: 'credibility'
        });
      }
    });
  }
  
  // Extract general self-assessments
  const generalPatterns = [
    {pattern: /I feel.*?(\d+)\/10/i, type: 'emotion' as const},
    {pattern: /my.*level.*is.*(\d+)/i, type: 'general' as const},
    {pattern: /I would rate.*?(\d+)/i, type: 'general' as const}
  ];
  
  generalPatterns.forEach(({pattern, type}) => {
    const match = content.match(pattern);
    if (match && match[1]) {
      const rating = parseInt(match[1]);
      if (rating >= 0 && rating <= 10) {
        ratings.push({
          rating,
          context: 'self-assessment',
          type
        });
      }
    }
  });
  
  return ratings;
}

/**
 * Detects if user provided explicit self-assessments and ratings
 * Consolidates detection logic across multiple modules
 */
export function hasUserQuantifiedAssessments(content: string): boolean {
  return USER_QUANTIFIED_ASSESSMENT_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Assesses schema reflection depth in content
 * Consolidates schema detection logic
 */
export function assessSchemaReflectionDepth(content: string): 'none' | 'minimal' | 'moderate' | 'comprehensive' {
  const matches = SCHEMA_REFLECTION_INDICATORS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
  
  if (matches >= 8) return 'comprehensive';
  if (matches >= 4) return 'moderate';  
  if (matches >= 1) return 'minimal';
  return 'none';
}

/**
 * Identifies if content represents a brief request
 * Consolidates brief request detection
 */
export function isBriefRequest(content: string): boolean {
  return BRIEF_REQUEST_PATTERNS.some(pattern => pattern.test(content.trim()));
}

/**
 * Comprehensive content analysis providing key metrics
 * Consolidates analysis logic used across modules
 */
export function analyzeContentMetrics(content: string): ContentAnalysisMetrics {
  const wordCount = content.split(/\s+/).length;
  const hasUserAssessments = hasUserQuantifiedAssessments(content);
  const extractedRatings = extractUserRatings(content);
  const userAssessmentCount = extractedRatings.length;
  const schemaReflectionDepth = assessSchemaReflectionDepth(content);
  const isBrief = isBriefRequest(content);
  
  // Calculate user data reliability
  let userDataReliability = 50;
  if (extractedRatings.length >= 3) userDataReliability += 25;
  if (extractedRatings.length >= 1) userDataReliability += 10;
  
  // Structured ratings are more reliable
  const hasStructuredRatings = extractedRatings.some(r => r.type === 'emotion' || r.type === 'credibility');
  if (hasStructuredRatings) userDataReliability += 15;
  
  // Self-reflective language increases reliability
  const selfReflectivePatterns = [
    /I feel.*like/i,
    /in my experience/i,
    /I notice.*that/i,
    /I'm aware.*that/i,
    /personally.*I/i
  ];
  
  const selfReflectiveCount = selfReflectivePatterns.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
  
  if (selfReflectiveCount >= 2) userDataReliability += 10;
  
  return {
    wordCount,
    hasUserAssessments,
    userAssessmentCount,
    schemaReflectionDepth,
    isBriefRequest: isBrief,
    userDataReliability: Math.min(100, userDataReliability)
  };
}

/**
 * Comprehensive assessment of user data priority
 * Consolidates user data priority logic from multiple modules
 */
export function assessUserDataPriority(content: string): UserDataPriority {
  const extractedRatings = extractUserRatings(content);
  const hasUserData = extractedRatings.length > 0 || hasUserQuantifiedAssessments(content);
  const metrics = analyzeContentMetrics(content);
  
  const assessmentTypes = Array.from(new Set(extractedRatings.map(r => r.type)));
  const shouldPrioritize = hasUserData && metrics.userDataReliability >= 60;
  
  return {
    hasUserProvidedData: hasUserData,
    userRatingCount: extractedRatings.length,
    userDataReliability: metrics.userDataReliability,
    shouldPrioritizeUserData: shouldPrioritize,
    extractedRatings,
    userAssessmentTypes: assessmentTypes
  };
}

// ========================================
// TEMPLATE AND FORMATTING UTILITIES  
// ========================================

/**
 * Generic template placeholder replacement utility
 * Consolidates template logic used in report generation
 */
export function replaceTemplatePlaceholders(
  template: string, 
  replacements: { [key: string]: string }
): string {
  let result = template;
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || `[${key} content]`);
  });
  return result;
}

/**
 * Converts clinical language to client-friendly language
 * Shared utility for report generation
 */
export function convertToClientFriendlyLanguage(text: string): string {
  return text
    .replace(/cognitive distortion/gi, 'thinking pattern')
    .replace(/maladaptive/gi, 'protective but limiting')
    .replace(/pathological/gi, 'challenging')
    .replace(/disorder/gi, 'experience')
    .replace(/dysfunction/gi, 'difficulty');
}

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Calculates weighted confidence based on user data reliability
 * Consolidates confidence calculation logic
 */
export function calculateUserDataWeightedConfidence(
  aiConfidence: number,
  userDataPriority: UserDataPriority,
  baseWeight: number = 0.7
): number {
  if (!userDataPriority.hasUserProvidedData) {
    return aiConfidence;
  }
  
  // Calculate user data weight based on reliability
  const reliabilityAdjustment = (userDataPriority.userDataReliability - 50) / 100; // -0.5 to +0.5
  const userWeight = Math.min(0.95, Math.max(0.3, baseWeight + reliabilityAdjustment));
  const aiWeight = 1 - userWeight;
  
  // Assume user data has higher baseline confidence for self-assessments
  const userDataConfidence = Math.min(95, 60 + (userDataPriority.userDataReliability * 0.4));
  
  return (userDataConfidence * userWeight) + (aiConfidence * aiWeight);
}

/**
 * Determines minimum word count threshold based on analysis type
 * Consolidates threshold logic
 */
export function getMinimumWordCountThreshold(analysisType: 'comprehensive' | 'moderate' | 'surface'): number {
  switch (analysisType) {
    case 'comprehensive': return 100;
    case 'moderate': return 50;
    case 'surface': return 25;
    default: return 25;
  }
}

// ========================================
// EXPORT CONSOLIDATION
// ========================================

/**
 * Main analysis bundle for external modules
 */
export const AnalysisUtils = {
  // Content analysis
  analyzeContentMetrics,
  assessSchemaReflectionDepth,
  isBriefRequest,
  
  // User data
  extractUserRatings,
  hasUserQuantifiedAssessments,  
  assessUserDataPriority,
  
  // Utilities
  replaceTemplatePlaceholders,
  convertToClientFriendlyLanguage,
  calculateUserDataWeightedConfidence,
  getMinimumWordCountThreshold
};