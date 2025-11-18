/**
 * Therapeutic Analysis Utilities & Content Priority System
 * Consolidated analysis tools and content tier management
 */

import {
  analyzeCBTMessage,
  hasSchemaReflection,
  type CBTMessageSignature,
} from '@/lib/chat/cbt-message-detector';
import { validateTherapeuticContext, type ValidationResult } from './validators';

// ========================================
// SHARED PATTERN DEFINITIONS
// ========================================

export const HIGH_CONFIDENCE_ASSESSMENT_PATTERNS = [
  /-\s*\w+:\s*\d+\/10/g,
  /\*\(\d+\/10\)\*/g,
  /self-assessment:\s*\d+/i,
  /my rating:\s*\d+/i,
];

export const MEDIUM_CONFIDENCE_ASSESSMENT_PATTERNS = [
  /I feel.*(?:anxiety|stress|depression|fear|worry).*(?:is|at|around|about)\s*(\d+)(?:\/10|\s*out of\s*10)/i,
  /my.*(?:anxiety|stress|depression|confidence|mood).*(?:level|is).*(?:is|has been|was).*(?:around|about)?\s*(\d+)(?:\/10|\s*out of\s*10)?/i,
  /I would rate.*(?:this|my|the).*(?:feeling|emotion|anxiety|stress).*(?:as|at)\s*(\d+)(?:\/10|\s*out of\s*10)?/i,
  /on a scale.*(?:of\s*)?1.*10.*(?:I'm|I am).*(?:at|around)\s*(\d+)/i,
  /I assess.*(?:my|this).*(?:as|at)\s*(\d+)(?:\/10|\s*out of\s*10)?/i,
  /(?:my|the).*(?:anxiety|stress|depression|fear|worry|confidence).*(?:is|was).*(?:probably|about|around)\s*(\d+)(?:\/10|\s*out of\s*10)?/i,
  /I'd rate.*(?:my|this|the).*(?:as|at).*(?:about|around)?\s*(\d+)(?:\/10|\s*out of\s*10)?/i,
];

export const LOW_CONFIDENCE_ASSESSMENT_PATTERNS = [
  /feeling.*(?:about|around)\s*(\d+)\s*percent/i,
  /(\d+)\/10.*intensity/i,
  /I rate this as\s*(\d+)/i,
  /personally.*(?:I'd say|I think).*(\d+)\s*out of\s*10/i,
];

export const USER_QUANTIFIED_ASSESSMENT_PATTERNS = [
  ...HIGH_CONFIDENCE_ASSESSMENT_PATTERNS,
  ...MEDIUM_CONFIDENCE_ASSESSMENT_PATTERNS,
  ...LOW_CONFIDENCE_ASSESSMENT_PATTERNS,
];

export const SCHEMA_REFLECTION_INDICATORS = [
  /SCHEMA\s+REFLECTION/i,
  /Personal\s+Self-Assessment/i,
  /Therapeutic\s+Insights/i,
  /Guided\s+Reflection\s+Insights/i,
  /childhood.*patterns/i,
  /childhood.*criticism/i,
  /childhood.*when/i,
  /in my experience.*childhood/i,
  /this started.*childhood/i,
  /core\s+beliefs?/i,
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
  /patterns.*in.*thinking/i,
  /I notice.*patterns/i,
  /I'm aware.*that/i,
];

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

export const COMPULSIVE_BEHAVIOR_PATTERNS = [
  /mental.*checking/i,
  /thought.*neutrali[zs]ing/i,
  /mental.*ritual/i,
  /replay.*in.*mind/i,
  /count.*in.*head/i,
  /repeat.*phrase.*mentally/i,
  /undo.*thought/i,
  /wash.*hands.*repeatedly/i,
  /check.*door.*lock/i,
  /check.*stove/i,
  /arrange.*symmetry/i,
  /tap.*specific.*number/i,
  /touch.*even.*number/i,
  /organize.*perfectly/i,
  /clean.*excessively/i,
  /ask.*others.*reassurance/i,
  /need.*constant.*validation/i,
  /seek.*confirmation/i,
  /google.*symptoms/i,
  /research.*obsessively/i,
  /avoid.*touching/i,
  /carry.*sanitizer/i,
  /wear.*gloves/i,
  /take.*longer.*route/i,
  /avoid.*certain.*numbers/i,
  /ritual.*before.*leaving/i,
];

export const INTRUSIVE_THOUGHT_PATTERNS = [
  /contamination.*fear/i,
  /afraid.*germs/i,
  /dirty.*unclean/i,
  /infection.*disease/i,
  /poison.*toxic/i,
  /intrusive.*thoughts.*harm/i,
  /afraid.*hurt.*someone/i,
  /violent.*thoughts/i,
  /lose.*control.*hurt/i,
  /stabbing.*thoughts/i,
  /driving.*hit.*someone/i,
  /blasphemous.*thoughts/i,
  /immoral.*thinking/i,
  /sinful.*thoughts/i,
  /religious.*doubt/i,
  /moral.*contamination/i,
  /things.*must.*be.*perfect/i,
  /asymmetry.*bothers/i,
  /need.*everything.*even/i,
  /numbers.*must.*match/i,
  /doubt.*love.*partner/i,
  /right.*person.*for.*me/i,
  /analyze.*relationship/i,
  /question.*attraction/i,
];

export const AVOIDANCE_BEHAVIOR_PATTERNS = [
  /avoid.*public.*restrooms/i,
  /avoid.*hospitals/i,
  /avoid.*crowds/i,
  /avoid.*sharp.*objects/i,
  /avoid.*driving/i,
  /avoid.*certain.*places/i,
  /avoid.*thinking.*about/i,
  /avoid.*news/i,
  /avoid.*movies.*violence/i,
  /avoid.*certain.*words/i,
  /avoid.*numbers/i,
  /avoid.*making.*decisions/i,
  /avoid.*being.*alone.*with/i,
  /avoid.*handling.*knives/i,
  /avoid.*being.*responsible/i,
];

export const THOUGHT_ACTION_FUSION_PATTERNS = [
  /thinking.*makes.*happen/i,
  /thoughts.*cause.*harm/i,
  /bad.*thought.*means.*bad.*person/i,
  /thinking.*equals.*doing/i,
  /thoughts.*have.*power/i,
  /imagine.*means.*want/i,
];

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
// INTERFACES
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
  userDataReliability: number;
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

export type ContentTier = 'tier1_premium' | 'tier2_standard' | 'tier3_minimal';

export type ReportType = 'client_friendly' | 'clinical_notes';

export interface ContentTierAnalysis {
  tier: ContentTier;
  confidence: number;
  triggers: string[];
  analysisRecommendation: AnalysisRecommendation;
  reportType: ReportType;
  userSelfAssessmentPresent: boolean;
  schemaReflectionDepth: 'none' | 'minimal' | 'moderate' | 'comprehensive';
}

export interface AnalysisRecommendation {
  shouldAnalyzeCognitiveDistortions: boolean;
  shouldAnalyzeSchemas: boolean;
  shouldGenerateActionItems: boolean;
  shouldProvideTherapeuticInsights: boolean;
  analysisDepth: 'surface' | 'moderate' | 'comprehensive';
  prioritizeUserAssessments: boolean;
}

// ========================================
// CORE ANALYSIS FUNCTIONS
// ========================================

export function extractUserRatings(content: string): UserRatingExtraction[] {
  const ratings: UserRatingExtraction[] = [];

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

  const enhancedPatterns = [
    {
      pattern: /my.*(?:anxiety|stress|depression|fear|worry).*(?:is|at)\s*(\d+)\/10/i,
      type: 'emotion' as const,
    },
    {
      pattern:
        /(?:anxiety|stress|depression|fear|worry).*(?:is|around|about)\s*(\d+)\s*out of\s*10/i,
      type: 'emotion' as const,
    },
    {
      pattern:
        /my.*(?:anxiety|stress|depression|confidence|mood).*(?:level).*(?:has been|was).*(?:around|about)\s*(\d+)(?:\/10|\s*out of\s*10)?/i,
      type: 'emotion' as const,
    },
    {
      pattern:
        /(?:my|the).*(?:confidence).*(?:is|was).*(?:probably|about|around)\s*(\d+)(?:\/10|\s*out of\s*10)?/i,
      type: 'general' as const,
    },
    { pattern: /I feel.*?(\d+)\/10/i, type: 'emotion' as const },
    { pattern: /my.*level.*is.*(\d+)/i, type: 'general' as const },
    { pattern: /I would rate.*?(\d+)/i, type: 'general' as const },
  ];

  enhancedPatterns.forEach(({ pattern, type }) => {
    const match = content.match(pattern);
    if (match && match[1]) {
      const rating = parseInt(match[1]);
      if (rating >= 0 && rating <= 10) {
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

export function hasUserQuantifiedAssessments(content: string): boolean {
  const extractedRatings = extractUserRatings(content);
  if (extractedRatings.length > 0) {
    return true;
  }
  return USER_QUANTIFIED_ASSESSMENT_PATTERNS.some((pattern) => pattern.test(content));
}

export function assessSchemaReflectionDepth(
  content: string
): 'none' | 'minimal' | 'moderate' | 'comprehensive' {
  const matches = SCHEMA_REFLECTION_INDICATORS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);

  if (matches >= 6) return 'comprehensive';
  if (matches >= 3) return 'moderate';
  if (matches >= 1) return 'minimal';
  return 'none';
}

export function isBriefRequest(content: string): boolean {
  return BRIEF_REQUEST_PATTERNS.some((pattern) => pattern.test(content.trim()));
}

export function analyzeContentMetrics(content: string): ContentAnalysisMetrics {
  const wordCount = content.split(/\s+/).length;
  const hasUserAssessments = hasUserQuantifiedAssessments(content);
  const extractedRatings = extractUserRatings(content);
  const userAssessmentCount = extractedRatings.length;
  const schemaReflectionDepth = assessSchemaReflectionDepth(content);
  const isBrief = isBriefRequest(content);

  let userDataReliability = 50;
  if (extractedRatings.length >= 3) userDataReliability += 25;
  if (extractedRatings.length >= 1) userDataReliability += 10;

  const hasStructuredRatings = extractedRatings.some(
    (r) => r.type === 'emotion' || r.type === 'credibility'
  );
  if (hasStructuredRatings) userDataReliability += 15;

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

export function detectCompulsiveBehaviors(content: string): number {
  return COMPULSIVE_BEHAVIOR_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
}

export function detectIntrusiveThoughts(content: string): number {
  return INTRUSIVE_THOUGHT_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
}

export function detectAvoidanceBehaviors(content: string): number {
  return AVOIDANCE_BEHAVIOR_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
}

export function scoreThoughtActionFusion(content: string): number {
  const matches = THOUGHT_ACTION_FUSION_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
  return Math.min(10, Math.round((matches / THOUGHT_ACTION_FUSION_PATTERNS.length) * 10));
}

export function scoreUncertaintyIntolerance(content: string): number {
  const matches = UNCERTAINTY_INTOLERANCE_PATTERNS.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);
  return Math.min(10, Math.round((matches / UNCERTAINTY_INTOLERANCE_PATTERNS.length) * 10));
}

export function analyzeERPApplicability(content: string): ERPAnalysisResult {
  const compulsiveBehaviorCount = detectCompulsiveBehaviors(content);
  const intrusiveThoughtCount = detectIntrusiveThoughts(content);
  const avoidanceBehaviorCount = detectAvoidanceBehaviors(content);
  const thoughtActionFusionScore = scoreThoughtActionFusion(content);
  const uncertaintyIntoleranceScore = scoreUncertaintyIntolerance(content);

  let erpScore = 0;

  erpScore += Math.min(30, compulsiveBehaviorCount * 5);
  erpScore += Math.min(25, intrusiveThoughtCount * 4);
  erpScore += Math.min(20, avoidanceBehaviorCount * 3);
  erpScore += Math.min(15, thoughtActionFusionScore * 1.5);
  erpScore += Math.min(10, uncertaintyIntoleranceScore * 1);

  const erpApplicabilityScore = Math.round(erpScore);

  const dominantPatterns: string[] = [];
  if (compulsiveBehaviorCount >= 2) dominantPatterns.push('compulsive behaviors');
  if (intrusiveThoughtCount >= 2) dominantPatterns.push('intrusive thoughts');
  if (avoidanceBehaviorCount >= 2) dominantPatterns.push('avoidance behaviors');
  if (thoughtActionFusionScore >= 6) dominantPatterns.push('thought-action fusion');
  if (uncertaintyIntoleranceScore >= 6) dominantPatterns.push('uncertainty intolerance');

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

export function replaceTemplatePlaceholders(
  template: string,
  replacements: { [key: string]: string }
): string {
  let result = template;

  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(
      new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
      value || `[${key} content]`
    );
  });

  result = result.replace(/\{([^}]+)\}/g, (_match, key) => `[${key} content]`);

  return result;
}

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

export function calculateUserDataWeightedConfidence(
  aiConfidence: number,
  userDataPriority: UserDataPriority,
  baseWeight: number = 0.7
): number {
  if (!userDataPriority.hasUserProvidedData) {
    return aiConfidence;
  }

  const reliabilityAdjustment = (userDataPriority.userDataReliability - 50) / 100;
  const userWeight = Math.min(0.85, Math.max(0.2, baseWeight + reliabilityAdjustment));
  const aiWeight = 1 - userWeight;

  let userDataConfidence;
  if (userDataPriority.userDataReliability < 50) {
    userDataConfidence = aiConfidence + (userDataPriority.userDataReliability - 50) * 0.05;
  } else {
    userDataConfidence = Math.min(88, 55 + userDataPriority.userDataReliability * 0.35);
  }

  return userDataConfidence * userWeight + aiConfidence * aiWeight;
}

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
// CONTENT TIER ANALYSIS
// ========================================

function analyzeTier1Content(
  content: string,
  cbtSignature: CBTMessageSignature
): ContentTierAnalysis {
  const triggers: string[] = [];
  let confidence = 85;

  if (cbtSignature.hasCBTHeader) {
    triggers.push('CBT diary header detected');
    confidence += 5;
  }

  if (cbtSignature.hasEmotionRatings) {
    triggers.push('User emotion ratings (quantified self-assessment)');
    confidence += 8;
  }

  if (cbtSignature.hasAutomaticThoughts) {
    triggers.push('Automatic thoughts with user credibility ratings');
    confidence += 7;
  }

  const schemaDepth = assessSchemaReflectionDepth(content);
  if (schemaDepth !== 'none' || hasSchemaReflection(content)) {
    triggers.push(`Schema reflection content (${schemaDepth} depth)`);
    if (hasSchemaReflection(content)) {
      triggers.push('schema reflection');
    }
    confidence += schemaDepth === 'comprehensive' ? 10 : 6;
  }

  const userSelfAssessmentPresent = hasUserQuantifiedAssessments(content);
  if (userSelfAssessmentPresent) {
    triggers.push('User self-assessments and ratings detected');
    confidence += 5;
  }

  return {
    tier: 'tier1_premium',
    confidence: Math.min(100, confidence),
    triggers,
    analysisRecommendation: {
      shouldAnalyzeCognitiveDistortions: true,
      shouldAnalyzeSchemas: true,
      shouldGenerateActionItems: true,
      shouldProvideTherapeuticInsights: true,
      analysisDepth: 'comprehensive',
      prioritizeUserAssessments: true,
    },
    reportType: 'client_friendly',
    userSelfAssessmentPresent,
    schemaReflectionDepth: schemaDepth,
  };
}

function analyzeTier2Content(
  content: string,
  contextValidation: ValidationResult,
  cbtSignature: CBTMessageSignature
): ContentTierAnalysis {
  const triggers: string[] = [];
  let confidence = 65;

  if (contextValidation.isValidTherapeuticContext) {
    triggers.push('therapeutic context');
    const therapeuticRelevance = contextValidation.contextualAnalysis.therapeuticRelevance;
    if (therapeuticRelevance >= 7) {
      confidence += 10;
    } else if (therapeuticRelevance >= 5) {
      confidence += 7;
    } else {
      confidence += 4;
    }
  }

  const emotionalIntensity = contextValidation.contextualAnalysis.emotionalIntensity;
  if (emotionalIntensity >= 6) {
    triggers.push(`emotional intensity`);
    triggers.push(`High emotional intensity (${emotionalIntensity}/10)`);
    confidence += 8;
  } else if (emotionalIntensity >= 4) {
    triggers.push(`emotional intensity`);
    triggers.push(`Moderate emotional intensity (${emotionalIntensity}/10)`);
    confidence += 4;
  } else if (emotionalIntensity >= 2) {
    triggers.push(`Low-moderate emotional intensity (${emotionalIntensity}/10)`);
    confidence += 2;
  }

  const therapeuticRelevance = contextValidation.contextualAnalysis.therapeuticRelevance;
  if (therapeuticRelevance >= 7) {
    triggers.push('High therapeutic relevance detected');
    confidence += 6;
  }

  if (contextValidation.contextualAnalysis.stressIndicators.length >= 2) {
    triggers.push('Multiple emotional distress indicators');
    confidence += 5;
  }

  if (cbtSignature.confidence > 0.3 && cbtSignature.confidence < 0.7) {
    triggers.push('Partial CBT-style content detected');
    confidence += 3;
  }

  const userSelfAssessmentPresent = hasUserQuantifiedAssessments(content);
  if (userSelfAssessmentPresent) {
    triggers.push('User self-assessments and ratings detected');
    confidence += 8;
  }

  const schemaDepth = assessSchemaReflectionDepth(content);

  const numStressIndicators = contextValidation.contextualAnalysis.stressIndicators.length;

  if (contextValidation.contextualAnalysis.emotionalIntensity <= 3) {
    confidence = Math.min(72, confidence);
  } else if (
    contextValidation.contextualAnalysis.emotionalIntensity >= 8 ||
    numStressIndicators >= 4
  ) {
    confidence = Math.max(81, confidence);
  } else if (contextValidation.contextualAnalysis.emotionalIntensity >= 6) {
    confidence = Math.min(82, confidence);
  } else {
    confidence = Math.min(78, confidence);
  }

  return {
    tier: 'tier2_standard',
    confidence: Math.min(95, confidence),
    triggers,
    analysisRecommendation: {
      shouldAnalyzeCognitiveDistortions: contextValidation.isValidTherapeuticContext,
      shouldAnalyzeSchemas: emotionalIntensity >= 6 || schemaDepth !== 'none',
      shouldGenerateActionItems: emotionalIntensity >= 5,
      shouldProvideTherapeuticInsights: true,
      analysisDepth: 'moderate',
      prioritizeUserAssessments: userSelfAssessmentPresent,
    },
    reportType: 'client_friendly',
    userSelfAssessmentPresent,
    schemaReflectionDepth: schemaDepth,
  };
}

function analyzeTier3Content(
  content: string,
  contextValidation: ValidationResult
): ContentTierAnalysis {
  const triggers: string[] = [];
  let confidence = 60;

  if (isBriefRequest(content)) {
    triggers.push('Brief request or casual interaction');
    confidence += 15;
  }

  if (contextValidation.contextualAnalysis.neutralContextFlags.length > 0) {
    triggers.push('Neutral/organizational context flags');
    contextValidation.contextualAnalysis.neutralContextFlags.forEach((flag) => {
      triggers.push(`Context: ${flag}`);
    });
    confidence += 10;
  }

  const emotionalIntensity = contextValidation.contextualAnalysis.emotionalIntensity;
  if (emotionalIntensity < 4) {
    triggers.push('Low emotional intensity');
    triggers.push(`Low emotional intensity (${emotionalIntensity}/10)`);
    confidence += 8;
  }

  if (contextValidation.exclusionReason) {
    triggers.push(`Excluded from analysis: ${contextValidation.exclusionReason}`);
    confidence += 12;
  }

  const userSelfAssessmentPresent = hasUserQuantifiedAssessments(content);
  const schemaDepth = assessSchemaReflectionDepth(content);

  return {
    tier: 'tier3_minimal',
    confidence: Math.min(90, confidence + (userSelfAssessmentPresent ? 20 : 0)),
    triggers,
    analysisRecommendation: {
      shouldAnalyzeCognitiveDistortions: false,
      shouldAnalyzeSchemas: false,
      shouldGenerateActionItems: false,
      shouldProvideTherapeuticInsights: false,
      analysisDepth: 'surface',
      prioritizeUserAssessments: userSelfAssessmentPresent,
    },
    reportType: 'client_friendly',
    userSelfAssessmentPresent,
    schemaReflectionDepth: schemaDepth,
  };
}

export function analyzeContentTier(
  messages: Array<{ content: string; role: string }>
): ContentTierAnalysis {
  const userMessages = messages.filter((m) => m.role === 'user');
  const fullContent = userMessages.map((m) => m.content).join(' ');

  if (!fullContent.trim()) {
    return analyzeTier3Content('', {
      isValidTherapeuticContext: false,
      contextualAnalysis: {
        emotionalIntensity: 0,
        therapeuticRelevance: 0,
        neutralContextFlags: [],
        stressIndicators: [],
        contextType: 'neutral',
        confidence: 100,
      },
      confidenceAdjustment: 1.0,
    });
  }

  const cbtSignature = analyzeCBTMessage(fullContent);
  const contextValidation = validateTherapeuticContext(fullContent);

  const hasStrongCBT = cbtSignature.confidence >= 0.7;
  const hasSchemaContent = hasSchemaReflection(fullContent);
  const hasUserData = hasUserQuantifiedAssessments(fullContent);
  const schemaDepth = assessSchemaReflectionDepth(fullContent);

  if (
    hasStrongCBT ||
    hasSchemaContent ||
    (hasUserData && schemaDepth !== 'none') ||
    (cbtSignature.confidence >= 0.4 && hasUserData)
  ) {
    return analyzeTier1Content(fullContent, cbtSignature);
  }

  const contentMetrics = analyzeContentMetrics(fullContent);

  const isMinimalContent =
    !contextValidation.isValidTherapeuticContext &&
    contextValidation.contextualAnalysis.emotionalIntensity < 3 &&
    contextValidation.contextualAnalysis.therapeuticRelevance < 3 &&
    !contentMetrics.hasUserAssessments;

  const isBriefMinimal =
    isBriefRequest(fullContent) &&
    !contextValidation.isValidTherapeuticContext &&
    contextValidation.contextualAnalysis.emotionalIntensity < 2 &&
    !contentMetrics.hasUserAssessments;

  if (isMinimalContent || isBriefMinimal) {
    return analyzeTier3Content(fullContent, contextValidation);
  }

  return analyzeTier2Content(fullContent, contextValidation, cbtSignature);
}

export function getContentTierExplanation(analysis: ContentTierAnalysis): string {
  const tierNames = {
    tier1_premium: 'Premium CBT/Schema Analysis',
    tier2_standard: 'Standard Therapeutic Conversation',
    tier3_minimal: 'Brief Supportive Response',
  };

  const parts = [
    `Content classified as: ${tierNames[analysis.tier]}`,
    `Confidence: ${analysis.confidence}%`,
  ];

  if (analysis.triggers.length > 0) {
    parts.push(`Triggers: ${analysis.triggers.join(', ')}`);
  }

  if (analysis.userSelfAssessmentPresent) {
    parts.push('User self-assessments detected - will prioritize over AI inference');
  }

  if (analysis.schemaReflectionDepth !== 'none') {
    parts.push(`Schema reflection depth: ${analysis.schemaReflectionDepth}`);
  }

  return parts.join('; ');
}

export function meetsAnalysisThreshold(analysis: ContentTierAnalysis): boolean {
  return (
    analysis.tier !== 'tier3_minimal' ||
    analysis.analysisRecommendation.shouldProvideTherapeuticInsights
  );
}

// ========================================
// EXPORT CONSOLIDATION
// ========================================

export const AnalysisUtils = {
  analyzeContentMetrics,
  assessSchemaReflectionDepth,
  isBriefRequest,
  extractUserRatings,
  hasUserQuantifiedAssessments,
  assessUserDataPriority,
  analyzeERPApplicability,
  detectCompulsiveBehaviors,
  detectIntrusiveThoughts,
  detectAvoidanceBehaviors,
  scoreThoughtActionFusion,
  scoreUncertaintyIntolerance,
  replaceTemplatePlaceholders,
  convertToClientFriendlyLanguage,
  calculateUserDataWeightedConfidence,
  getMinimumWordCountThreshold,
};
