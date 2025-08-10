/**
 * Therapeutic Content Priority System
 * 
 * Implements a 3-tier data quality hierarchy to ensure appropriate therapeutic analysis
 * and prevent over-pathologizing of casual conversations. Prioritizes user's explicit
 * self-assessments over AI inference.
 */

import { analyzeCBTMessage, hasSchemaReflection, type CBTMessageSignature } from '@/lib/chat/cbt-message-detector';
import { 
  assessSchemaReflectionDepth,
  hasUserQuantifiedAssessments,
  isBriefRequest,
  analyzeContentMetrics,
  type UserDataPriority as UtilUserDataPriority
} from './analysis-utils';
import { validateTherapeuticContext, type ValidationResult } from '@/lib/therapy/context-validator';

// ========================================
// DATA TIER DEFINITIONS
// ========================================

export type ContentTier = 'tier1_premium' | 'tier2_standard' | 'tier3_minimal';

export type ReportType = 'client_friendly' | 'clinical_notes';

export interface ContentTierAnalysis {
  tier: ContentTier;
  confidence: number; // 0-100 confidence in tier assignment
  triggers: string[]; // What triggered this tier classification
  analysisRecommendation: AnalysisRecommendation;
  reportType: ReportType;
  userSelfAssessmentPresent: boolean; // User provided their own ratings/assessments
  schemaReflectionDepth: 'none' | 'minimal' | 'moderate' | 'comprehensive';
}

export interface AnalysisRecommendation {
  shouldAnalyzeCognitiveDistortions: boolean;
  shouldAnalyzeSchemas: boolean;
  shouldGenerateActionItems: boolean;
  shouldProvideTherapeuticInsights: boolean;
  analysisDepth: 'surface' | 'moderate' | 'comprehensive';
  prioritizeUserAssessments: boolean; // Prioritize user's self-ratings over AI inference
}

// ========================================
// TIER 1 (PREMIUM): CBT DIARY + SCHEMA REFLECTION
// ========================================

/**
 * Tier 1 represents the highest quality therapeutic data:
 * - Structured CBT diary entries with emotion ratings
 * - Schema reflection content with self-assessments
 * - User-provided credibility ratings for thoughts
 * - Quantified self-assessments and personal insights
 * 
 * Triggers comprehensive analysis with high confidence in findings
 * User's explicit self-assessments take precedence over AI inference
 */
function analyzeTier1Content(content: string, cbtSignature: CBTMessageSignature): ContentTierAnalysis {
  const triggers: string[] = [];
  let confidence = 85; // High base confidence for structured content
  
  // CBT diary triggers
  if (cbtSignature.hasCBTHeader) {
    triggers.push('CBT diary header detected');
    confidence += 5;
  }
  
  if (cbtSignature.hasEmotionRatings) {
    triggers.push('User emotion ratings (quantified self-assessment)');
    confidence += 8; // User ratings are premium data
  }
  
  if (cbtSignature.hasAutomaticThoughts) {
    triggers.push('Automatic thoughts with user credibility ratings');
    confidence += 7; // User-provided credibility assessments
  }
  
  // Schema reflection triggers
  const schemaDepth = assessSchemaReflectionDepth(content);
  if (schemaDepth !== 'none' || hasSchemaReflection(content)) {
    triggers.push(`Schema reflection content (${schemaDepth} depth)`);
    if (hasSchemaReflection(content)) {
      triggers.push('schema reflection');
    }
    confidence += schemaDepth === 'comprehensive' ? 10 : 6;
  }
  
  // User self-assessment patterns
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
      prioritizeUserAssessments: true // Key: User ratings override AI inference
    },
    reportType: 'client_friendly',
    userSelfAssessmentPresent,
    schemaReflectionDepth: schemaDepth
  };
}

// ========================================
// TIER 2 (STANDARD): THERAPEUTIC CONVERSATION
// ========================================

/**
 * Tier 2 represents quality therapeutic conversation:
 * - Emotionally rich content with contextual validation
 * - Genuine therapeutic dialogue without structured format
 * - Some emotional intensity and therapeutic relevance
 * 
 * Triggers moderate analysis with contextual awareness
 */
function analyzeTier2Content(
  content: string, 
  contextValidation: ValidationResult,
  cbtSignature: CBTMessageSignature
): ContentTierAnalysis {
  const triggers: string[] = [];
  let confidence = 65; // Moderate base confidence
  
  // Therapeutic context validation
  if (contextValidation.isValidTherapeuticContext) {
    triggers.push('therapeutic context');
    // Adjust confidence boost based on therapeutic relevance score
    const therapeuticRelevance = contextValidation.contextualAnalysis.therapeuticRelevance;
    if (therapeuticRelevance >= 7) {
      confidence += 10;
    } else if (therapeuticRelevance >= 5) {
      confidence += 7;
    } else {
      confidence += 4; // Lower boost for borderline therapeutic content
    }
  }
  
  // Emotional intensity assessment
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
    // Borderline therapeutic content gets lower confidence boost
    triggers.push(`Low-moderate emotional intensity (${emotionalIntensity}/10)`);
    confidence += 2;
  }
  
  // Therapeutic relevance
  const therapeuticRelevance = contextValidation.contextualAnalysis.therapeuticRelevance;
  if (therapeuticRelevance >= 7) {
    triggers.push('High therapeutic relevance detected');
    confidence += 6;
  }
  
  // Stress indicators
  if (contextValidation.contextualAnalysis.stressIndicators.length >= 2) {
    triggers.push('Multiple emotional distress indicators');
    confidence += 5;
  }
  
  // Some CBT elements (partial structured content)
  if (cbtSignature.confidence > 0.3 && cbtSignature.confidence < 0.7) {
    triggers.push('Partial CBT-style content detected');
    confidence += 3;
  }
  
  const userSelfAssessmentPresent = hasUserQuantifiedAssessments(content);
  if (userSelfAssessmentPresent) {
    triggers.push('User self-assessments and ratings detected');
    confidence += 8; // User assessments are valuable even in Tier 2
  }
  
  const schemaDepth = assessSchemaReflectionDepth(content);
  
  // Adjust final confidence based on emotional intensity and content characteristics
  const numStressIndicators = contextValidation.contextualAnalysis.stressIndicators.length;
  
  if (contextValidation.contextualAnalysis.emotionalIntensity <= 3) {
    // Borderline therapeutic content - cap confidence 
    confidence = Math.min(72, confidence);
  } else if (contextValidation.contextualAnalysis.emotionalIntensity >= 8 ||
             numStressIndicators >= 4) {
    // Very high-intensity therapeutic content
    confidence = Math.max(81, confidence);
  } else if (contextValidation.contextualAnalysis.emotionalIntensity >= 6) {
    // High therapeutic content but cap to avoid over-confidence
    confidence = Math.min(82, confidence);
  } else {
    // Moderate therapeutic content
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
      prioritizeUserAssessments: userSelfAssessmentPresent
    },
    reportType: 'client_friendly',
    userSelfAssessmentPresent,
    schemaReflectionDepth: schemaDepth
  };
}

// ========================================
// TIER 3 (MINIMAL): BRIEF CONVERSATION
// ========================================

/**
 * Tier 3 represents minimal therapeutic content:
 * - Brief requests like "search for meditation videos"
 * - Casual check-ins without emotional depth
 * - Organizational or informational queries
 * 
 * Triggers supportive response only - prevents over-pathologizing
 */
function analyzeTier3Content(
  content: string,
  contextValidation: ValidationResult
): ContentTierAnalysis {
  const triggers: string[] = [];
  let confidence = 60;
  
  // Identify brief/casual patterns
  if (isBriefRequest(content)) {
    triggers.push('Brief request or casual interaction');
    confidence += 15;
  }
  
  // Neutral/organizational context
  if (contextValidation.contextualAnalysis.neutralContextFlags.length > 0) {
    triggers.push('Neutral/organizational context flags');
    contextValidation.contextualAnalysis.neutralContextFlags.forEach(flag => {
      triggers.push(`Context: ${flag}`);
    });
    confidence += 10;
  }
  
  // Low emotional intensity
  const emotionalIntensity = contextValidation.contextualAnalysis.emotionalIntensity;
  if (emotionalIntensity < 4) {
    triggers.push('Low emotional intensity');
    triggers.push(`Low emotional intensity (${emotionalIntensity}/10)`);
    confidence += 8;
  }
  
  // Exclusion reason present
  if (contextValidation.exclusionReason) {
    triggers.push(`Excluded from analysis: ${contextValidation.exclusionReason}`);
    confidence += 12;
  }
  
  // Check if user provided assessments in brief content - should elevate confidence
  const userSelfAssessmentPresent = hasUserQuantifiedAssessments(content);
  const schemaDepth = assessSchemaReflectionDepth(content);
  
  return {
    tier: 'tier3_minimal',
    confidence: Math.min(90, confidence + (userSelfAssessmentPresent ? 20 : 0)),
    triggers,
    analysisRecommendation: {
      shouldAnalyzeCognitiveDistortions: false, // CRITICAL: Don't over-pathologize
      shouldAnalyzeSchemas: false,
      shouldGenerateActionItems: false,
      shouldProvideTherapeuticInsights: false, // Just supportive response
      analysisDepth: 'surface',
      prioritizeUserAssessments: userSelfAssessmentPresent
    },
    reportType: 'client_friendly', // Brief, supportive summary only
    userSelfAssessmentPresent,
    schemaReflectionDepth: schemaDepth
  };
}

// ========================================
// MAIN ANALYSIS FUNCTION
// ========================================

/**
 * Analyzes therapeutic content and assigns appropriate tier with analysis recommendations
 * Prioritizes user's explicit self-assessments over AI inference
 */
export function analyzeContentTier(messages: Array<{ content: string; role: string }>): ContentTierAnalysis {
  // Combine all user messages for analysis
  const userMessages = messages.filter(m => m.role === 'user');
  const fullContent = userMessages.map(m => m.content).join(' ');
  
  if (!fullContent.trim()) {
    return analyzeTier3Content('', {
      isValidTherapeuticContext: false,
      contextualAnalysis: {
        emotionalIntensity: 0,
        therapeuticRelevance: 0,
        neutralContextFlags: [],
        stressIndicators: [],
        contextType: 'neutral',
        confidence: 100
      },
      confidenceAdjustment: 1.0
    });
  }
  
  // Get CBT signature analysis
  const cbtSignature = analyzeCBTMessage(fullContent);
  
  // Get contextual validation
  const contextValidation = validateTherapeuticContext(fullContent);
  
  // Tier 1: Premium CBT + Schema Reflection Data
  // Check for strong CBT indicators OR schema reflection
  const hasStrongCBT = cbtSignature.confidence >= 0.7;
  const hasSchemaContent = hasSchemaReflection(fullContent);
  const hasUserData = hasUserQuantifiedAssessments(fullContent);
  const schemaDepth = assessSchemaReflectionDepth(fullContent);
  
  if (hasStrongCBT || hasSchemaContent || 
      (hasUserData && schemaDepth !== 'none') ||
      (cbtSignature.confidence >= 0.4 && hasUserData)) {
    return analyzeTier1Content(fullContent, cbtSignature);
  }
  
  // Check for user assessments that should elevate content
  const contentMetrics = analyzeContentMetrics(fullContent);
  
  // Tier 3: Minimal/Brief Content (check before Tier 2)
  // Only assign Tier 3 for truly minimal content without user assessments or therapeutic elements
  const isMinimalContent = (
    !contextValidation.isValidTherapeuticContext && 
    contextValidation.contextualAnalysis.emotionalIntensity < 3 &&
    contextValidation.contextualAnalysis.therapeuticRelevance < 3 &&
    !contentMetrics.hasUserAssessments
  );
  
  const isBriefMinimal = (
    isBriefRequest(fullContent) && 
    !contextValidation.isValidTherapeuticContext &&
    contextValidation.contextualAnalysis.emotionalIntensity < 2 &&
    !contentMetrics.hasUserAssessments
  );
  
  if (isMinimalContent || isBriefMinimal) {
    return analyzeTier3Content(fullContent, contextValidation);
  }
  
  // Tier 2: Standard Therapeutic Conversation (includes user assessments)
  return analyzeTier2Content(fullContent, contextValidation, cbtSignature);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// Schema reflection depth assessment moved to analysis-utils.ts

// User self-assessment detection moved to analysis-utils.ts

// Brief request detection moved to analysis-utils.ts

/**
 * Generates a human-readable explanation of the content tier analysis
 */
export function getContentTierExplanation(analysis: ContentTierAnalysis): string {
  const tierNames = {
    tier1_premium: 'Premium CBT/Schema Analysis',
    tier2_standard: 'Standard Therapeutic Conversation',
    tier3_minimal: 'Brief Supportive Response'
  };
  
  const parts = [
    `Content classified as: ${tierNames[analysis.tier]}`,
    `Confidence: ${analysis.confidence}%`
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

/**
 * Validates if content meets minimum requirements for therapeutic analysis
 */
export function meetsAnalysisThreshold(analysis: ContentTierAnalysis): boolean {
  return analysis.tier !== 'tier3_minimal' || 
         analysis.analysisRecommendation.shouldProvideTherapeuticInsights;
}