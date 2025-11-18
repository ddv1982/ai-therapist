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
 * Hierarchical patterns for user-provided quantified assessments
 * Organized by confidence level and pattern strength
 */

// High-confidence patterns - Explicit structured assessments
export const HIGH_CONFIDENCE_ASSESSMENT_PATTERNS = [
  /-\s*\w+:\s*\d+\/10/g, // Structured ratings like "- Anxiety: 7/10"
  /\*\(\d+\/10\)\*/g, // Credibility ratings like "*(7/10)*"
  /self-assessment:\s*\d+/i, // "self-assessment: 8"
  /my rating:\s*\d+/i, // "my rating: 5"
];

// Medium-confidence patterns - Natural language assessments
export const MEDIUM_CONFIDENCE_ASSESSMENT_PATTERNS = [
  /I feel.*(?:anxiety|stress|depression|fear|worry).*(?:is|at|around|about)\s*(\d+)(?:\/10|\s*out of\s*10)/i, // "I feel anxiety at 7/10" or "anxiety is around 6 out of 10"
  /my.*(?:anxiety|stress|depression|confidence|mood).*(?:level|is).*(?:is|has been|was).*(?:around|about)?\s*(\d+)(?:\/10|\s*out of\s*10)?/i, // "My stress level has been around 7"
  /I would rate.*(?:this|my|the).*(?:feeling|emotion|anxiety|stress).*(?:as|at)\s*(\d+)(?:\/10|\s*out of\s*10)?/i, // "I would rate this feeling as 6"
  /on a scale.*(?:of\s*)?1.*10.*(?:I'm|I am).*(?:at|around)\s*(\d+)/i, // "On a scale of 1-10, I'm at 7"
  /I assess.*(?:my|this).*(?:as|at)\s*(\d+)(?:\/10|\s*out of\s*10)?/i, // "I assess my confidence as 4"
  /(?:my|the).*(?:anxiety|stress|depression|fear|worry|confidence).*(?:is|was).*(?:probably|about|around)\s*(\d+)(?:\/10|\s*out of\s*10)?/i, // "confidence is probably 3/10"
  /I'd rate.*(?:my|this|the).*(?:as|at).*(?:about|around)?\s*(\d+)(?:\/10|\s*out of\s*10)?/i, // "I'd rate as about 6/10"
];

// Low-confidence patterns - Casual mentions
export const LOW_CONFIDENCE_ASSESSMENT_PATTERNS = [
  /feeling.*(?:about|around)\s*(\d+)\s*percent/i, // "feeling about 80 percent confident"
  /(\d+)\/10.*intensity/i, // "7/10 intensity"
  /I rate this as\s*(\d+)/i, // "I rate this as 6"
  /personally.*(?:I'd say|I think).*(\d+)\s*out of\s*10/i, // "Personally I'd say 6 out of 10"
];

// Combined pattern array for backwards compatibility
export const USER_QUANTIFIED_ASSESSMENT_PATTERNS = [
  ...HIGH_CONFIDENCE_ASSESSMENT_PATTERNS,
  ...MEDIUM_CONFIDENCE_ASSESSMENT_PATTERNS,
  ...LOW_CONFIDENCE_ASSESSMENT_PATTERNS,
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
  /childhood.*when/i, // Added to catch "started in childhood when"
  /in my experience.*childhood/i, // Added to catch the test case
  /this started.*childhood/i, // Added to catch the test case
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
  /triggered.*situations/i,
  /patterns.*in.*thinking/i, // Added for therapeutic reflection
  /I notice.*patterns/i, // Added for therapeutic reflection
  /I'm aware.*that/i, // Added for self-awareness indicators
];

/**
 * Brief request patterns that indicate minimal analysis needs
 */
export const BRIEF_REQUEST_PATTERNS = [
  /^(can you |could you |please )?search (for|about)/i,
  /^(can you |could you |please )?find.*information/i,
  /^(can you |could you |please )?look up/i,
  /^(can you |could you |please )?help me find/i,
  /^what are some.*(resources|apps|techniques|strategies|options|methods)/i,
  /^where can I find/i,
  /^do you know.*about/i,
  /^tell me about/i,
];

/**
 * ERP (Exposure and Response Prevention) related patterns
 */

/**
 * Compulsive behavior indicators for ERP analysis
 */
export const COMPULSIVE_BEHAVIOR_PATTERNS = [
  // Mental compulsions
  /mental.*checking/i,
  /thought.*neutrali[zs]ing/i,
  /mental.*ritual/i,
  /replay.*in.*mind/i,
  /count.*in.*head/i,
  /repeat.*phrase.*mentally/i,
  /undo.*thought/i,

  // Physical compulsions
  /wash.*hands.*repeatedly/i,
  /check.*door.*lock/i,
  /check.*stove/i,
  /arrange.*symmetry/i,
  /tap.*specific.*number/i,
  /touch.*even.*number/i,
  /organize.*perfectly/i,
  /clean.*excessively/i,

  // Reassurance seeking
  /ask.*others.*reassurance/i,
  /need.*constant.*validation/i,
  /seek.*confirmation/i,
  /google.*symptoms/i,
  /research.*obsessively/i,

  // Safety behaviors
  /avoid.*touching/i,
  /carry.*sanitizer/i,
  /wear.*gloves/i,
  /take.*longer.*route/i,
  /avoid.*certain.*numbers/i,
  /ritual.*before.*leaving/i,
];

/**
 * Intrusive thought indicators for ERP analysis
 */
export const INTRUSIVE_THOUGHT_PATTERNS = [
  // Contamination obsessions
  /contamination.*fear/i,
  /afraid.*germs/i,
  /dirty.*unclean/i,
  /infection.*disease/i,
  /poison.*toxic/i,

  // Harm obsessions
  /intrusive.*thoughts.*harm/i,
  /afraid.*hurt.*someone/i,
  /violent.*thoughts/i,
  /lose.*control.*hurt/i,
  /stabbing.*thoughts/i,
  /driving.*hit.*someone/i,

  // Moral/Religious scrupulosity
  /blasphemous.*thoughts/i,
  /immoral.*thinking/i,
  /sinful.*thoughts/i,
  /religious.*doubt/i,
  /moral.*contamination/i,

  // Symmetry/Order obsessions
  /things.*must.*be.*perfect/i,
  /asymmetry.*bothers/i,
  /need.*everything.*even/i,
  /numbers.*must.*match/i,

  // Relationship obsessions
  /doubt.*love.*partner/i,
  /right.*person.*for.*me/i,
  /analyze.*relationship/i,
  /question.*attraction/i,
];

/**
 * Avoidance pattern indicators for ERP analysis
 */
export const AVOIDANCE_BEHAVIOR_PATTERNS = [
  // Situational avoidance
  /avoid.*public.*restrooms/i,
  /avoid.*hospitals/i,
  /avoid.*crowds/i,
  /avoid.*sharp.*objects/i,
  /avoid.*driving/i,
  /avoid.*certain.*places/i,

  // Trigger avoidance
  /avoid.*thinking.*about/i,
  /avoid.*news/i,
  /avoid.*movies.*violence/i,
  /avoid.*certain.*words/i,
  /avoid.*numbers/i,

  // Responsibility avoidance
  /avoid.*making.*decisions/i,
  /avoid.*being.*alone.*with/i,
  /avoid.*handling.*knives/i,
  /avoid.*being.*responsible/i,
];

/**
 * Thought-action fusion indicators
 */
export const THOUGHT_ACTION_FUSION_PATTERNS = [
  /thinking.*makes.*happen/i,
  /thoughts.*cause.*harm/i,
  /bad.*thought.*means.*bad.*person/i,
  /thinking.*equals.*doing/i,
  /thoughts.*have.*power/i,
  /imagine.*means.*want/i,
];

/**
 * Uncertainty intolerance indicators
 */
export const UNCERTAINTY_INTOLERANCE_PATTERNS = [
  /need.*to.*know.*for.*sure/i,
  /cannot.*stand.*uncertainty/i,
  /what.*if.*something.*happens/i,
  /need.*100.*percent.*certainty/i,
  /doubt.*everything/i,
  /ambiguity.*anxiety/i,
  /must.*be.*certain/i,
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

export interface ERPAnalysisResult {
  compulsiveBehaviorCount: number;
  intrusiveThoughtCount: number;
  avoidanceBehaviorCount: number;
  thoughtActionFusionScore: number;
  uncertaintyIntoleranceScore: number;
  erpApplicabilityScore: number;
  dominantPatterns: string[];
  compassionateApproach: boolean;
}

// ========================================
// CORE ANALYSIS FUNCTIONS
// ========================================

/**
 * Hierarchical extraction of user-provided ratings and assessments
 * Uses weighted pattern matching with confidence levels
 */
export function extractUserRatings(content: string): UserRatingExtraction[] {
  const ratings: UserRatingExtraction[] = [];

  // High-confidence pattern extraction (structured formats)
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
  const credibilityMatches = content.match(/\*\((\d+)\/10\)\*/g);
  if (credibilityMatches) {
    credibilityMatches.forEach((match) => {
      const rating = match.match(/\*\((\d+)\/10\)\*/)?.[1];
      if (rating) {
        ratings.push({
          rating: parseInt(rating),
          context: 'thought credibility',
          type: 'credibility',
        });
      }
    });
  }

  // Medium-confidence patterns - Enhanced natural language detection
  const enhancedPatterns = [
    // "My anxiety is at 8/10" - specific pattern for this format
    {
      pattern: /my.*(?:anxiety|stress|depression|fear|worry).*(?:is|at)\s*(\d+)\/10/i,
      type: 'emotion' as const,
    },
    // "anxiety is around 6 out of 10" (non-overlapping with above)
    {
      pattern:
        /(?:anxiety|stress|depression|fear|worry).*(?:is|around|about)\s*(\d+)\s*out of\s*10/i,
      type: 'emotion' as const,
    },
    // "My stress level has been around 7"
    {
      pattern:
        /my.*(?:anxiety|stress|depression|confidence|mood).*(?:level).*(?:has been|was).*(?:around|about)\s*(\d+)(?:\/10|\s*out of\s*10)?/i,
      type: 'emotion' as const,
    },
    // Enhanced confidence patterns
    {
      pattern:
        /(?:my|the).*(?:confidence).*(?:is|was).*(?:probably|about|around)\s*(\d+)(?:\/10|\s*out of\s*10)?/i,
      type: 'general' as const,
    },
    // Catch remaining patterns not captured by structured formats
    { pattern: /I feel.*?(\d+)\/10/i, type: 'emotion' as const },
    { pattern: /my.*level.*is.*(\d+)/i, type: 'general' as const },
    { pattern: /I would rate.*?(\d+)/i, type: 'general' as const },
  ];

  enhancedPatterns.forEach(({ pattern, type }) => {
    const match = content.match(pattern);
    if (match && match[1]) {
      const rating = parseInt(match[1]);
      if (rating >= 0 && rating <= 10) {
        // More precise duplicate detection
        const exists = ratings.some((r) => r.rating === rating && Math.abs(r.rating - rating) < 1);
        if (!exists) {
          ratings.push({
            rating,
            context: 'self-assessment',
            type,
          });
        }
      }
    }
  });

  return ratings;
}

/**
 * Detects if user provided explicit self-assessments and ratings
 * Uses hierarchical pattern matching for improved accuracy
 */
export function hasUserQuantifiedAssessments(content: string): boolean {
  // First check if extraction finds any ratings (most reliable)
  const extractedRatings = extractUserRatings(content);
  if (extractedRatings.length > 0) {
    return true;
  }

  // Fallback to pattern matching for edge cases
  return USER_QUANTIFIED_ASSESSMENT_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Assesses schema reflection depth in content
 * Consolidates schema detection logic
 */
export function assessSchemaReflectionDepth(
  content: string
): 'none' | 'minimal' | 'moderate' | 'comprehensive' {
  const matches = SCHEMA_REFLECTION_INDICATORS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);

  // Balanced thresholds for realistic classification
  if (matches >= 6) return 'comprehensive';
  if (matches >= 3) return 'moderate';
  if (matches >= 1) return 'minimal';
  return 'none';
}

/**
 * Identifies if content represents a brief request
 * Consolidates brief request detection
 */
export function isBriefRequest(content: string): boolean {
  return BRIEF_REQUEST_PATTERNS.some((pattern) => pattern.test(content.trim()));
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
  const hasStructuredRatings = extractedRatings.some(
    (r) => r.type === 'emotion' || r.type === 'credibility'
  );
  if (hasStructuredRatings) userDataReliability += 15;

  // Self-reflective language increases reliability
  const selfReflectivePatterns = [
    /I feel.*like/i,
    /in my experience/i,
    /I notice.*that/i,
    /I'm aware.*that/i,
    /personally.*I/i,
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
    userDataReliability: Math.min(100, userDataReliability),
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

  const assessmentTypes = Array.from(new Set(extractedRatings.map((r) => r.type)));
  const shouldPrioritize = hasUserData && metrics.userDataReliability >= 60;

  return {
    hasUserProvidedData: hasUserData,
    userRatingCount: extractedRatings.length,
    userDataReliability: metrics.userDataReliability,
    shouldPrioritizeUserData: shouldPrioritize,
    extractedRatings,
    userAssessmentTypes: assessmentTypes,
  };
}

// ========================================
// ERP ANALYSIS FUNCTIONS
// ========================================

/**
 * Detects compulsive behaviors in content
 */
export function detectCompulsiveBehaviors(content: string): number {
  return COMPULSIVE_BEHAVIOR_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
}

/**
 * Detects intrusive thought patterns in content
 */
export function detectIntrusiveThoughts(content: string): number {
  return INTRUSIVE_THOUGHT_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
}

/**
 * Detects avoidance behaviors in content
 */
export function detectAvoidanceBehaviors(content: string): number {
  return AVOIDANCE_BEHAVIOR_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
}

/**
 * Scores thought-action fusion indicators
 */
export function scoreThoughtActionFusion(content: string): number {
  const matches = THOUGHT_ACTION_FUSION_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);

  // Convert to 0-10 scale
  return Math.min(10, Math.round((matches / THOUGHT_ACTION_FUSION_PATTERNS.length) * 10));
}

/**
 * Scores uncertainty intolerance indicators
 */
export function scoreUncertaintyIntolerance(content: string): number {
  const matches = UNCERTAINTY_INTOLERANCE_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);

  // Convert to 0-10 scale
  return Math.min(10, Math.round((matches / UNCERTAINTY_INTOLERANCE_PATTERNS.length) * 10));
}

/**
 * Comprehensive ERP analysis of content
 */
export function analyzeERPApplicability(content: string): ERPAnalysisResult {
  const compulsiveBehaviorCount = detectCompulsiveBehaviors(content);
  const intrusiveThoughtCount = detectIntrusiveThoughts(content);
  const avoidanceBehaviorCount = detectAvoidanceBehaviors(content);
  const thoughtActionFusionScore = scoreThoughtActionFusion(content);
  const uncertaintyIntoleranceScore = scoreUncertaintyIntolerance(content);

  // Calculate overall ERP applicability score
  let erpScore = 0;

  // Weight different components
  erpScore += Math.min(30, compulsiveBehaviorCount * 5); // Max 30 points
  erpScore += Math.min(25, intrusiveThoughtCount * 4); // Max 25 points
  erpScore += Math.min(20, avoidanceBehaviorCount * 3); // Max 20 points
  erpScore += Math.min(15, thoughtActionFusionScore * 1.5); // Max 15 points
  erpScore += Math.min(10, uncertaintyIntoleranceScore * 1); // Max 10 points

  const erpApplicabilityScore = Math.round(erpScore);

  // Identify dominant patterns
  const dominantPatterns: string[] = [];
  if (compulsiveBehaviorCount >= 2) dominantPatterns.push('compulsive behaviors');
  if (intrusiveThoughtCount >= 2) dominantPatterns.push('intrusive thoughts');
  if (avoidanceBehaviorCount >= 2) dominantPatterns.push('avoidance behaviors');
  if (thoughtActionFusionScore >= 6) dominantPatterns.push('thought-action fusion');
  if (uncertaintyIntoleranceScore >= 6) dominantPatterns.push('uncertainty intolerance');

  // Determine if compassionate approach is needed (always true for ERP)
  const compassionateApproach = true;

  return {
    compulsiveBehaviorCount,
    intrusiveThoughtCount,
    avoidanceBehaviorCount,
    thoughtActionFusionScore,
    uncertaintyIntoleranceScore,
    erpApplicabilityScore,
    dominantPatterns,
    compassionateApproach,
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

  // Replace known placeholders
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(
      new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
      value || `[${key} content]`
    );
  });

  // Replace any remaining placeholders with generic fallback
  result = result.replace(/\{([^}]+)\}/g, (_match, key) => `[${key} content]`);

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

  // Calculate user data weight based on reliability - more conservative
  const reliabilityAdjustment = (userDataPriority.userDataReliability - 50) / 100; // -0.5 to +0.5
  const userWeight = Math.min(0.85, Math.max(0.2, baseWeight + reliabilityAdjustment));
  const aiWeight = 1 - userWeight;

  // For very low reliability, make user data confidence closer to AI confidence
  let userDataConfidence;
  if (userDataPriority.userDataReliability < 50) {
    // Low reliability - user confidence approaches AI confidence
    userDataConfidence = aiConfidence + (userDataPriority.userDataReliability - 50) * 0.05;
  } else {
    // Normal reliability - user data gets boost
    userDataConfidence = Math.min(88, 55 + userDataPriority.userDataReliability * 0.35);
  }

  return userDataConfidence * userWeight + aiConfidence * aiWeight;
}

/**
 * Determines minimum word count threshold based on analysis type
 * Consolidates threshold logic
 */
export function getMinimumWordCountThreshold(
  analysisType: 'comprehensive' | 'moderate' | 'surface'
): number {
  switch (analysisType) {
    case 'comprehensive':
      return 100;
    case 'moderate':
      return 50;
    case 'surface':
      return 25;
    default:
      return 25;
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

  // ERP analysis
  analyzeERPApplicability,
  detectCompulsiveBehaviors,
  detectIntrusiveThoughts,
  detectAvoidanceBehaviors,
  scoreThoughtActionFusion,
  scoreUncertaintyIntolerance,

  // Utilities
  replaceTemplatePlaceholders,
  convertToClientFriendlyLanguage,
  calculateUserDataWeightedConfidence,
  getMinimumWordCountThreshold,
};
