export interface SessionReport {
  id: string;
  sessionId: string;
  keyPoints: string[];
  therapeuticInsights: string[];
  patternsIdentified: string[];
  actionItems: string[];
  moodAssessment?: string;
  progressNotes?: string;
  
  // Enhanced Psychological Analysis
  cognitiveDistortions: CognitiveDistortion[];
  schemaAnalysis: SchemaAnalysis;
  therapeuticFrameworks: TherapeuticFramework[];
  recommendations: TherapeuticRecommendation[];
  
  // Analysis Metadata
  analysisConfidence: number; // 0-100 scale indicating AI confidence in analysis
  analysisVersion: string; // Version of analysis framework used
  
  // Enhanced fields for client-friendly reporting and data priority
  contentTier?: ContentTier;
  analysisScope?: AnalysisScope;
  userDataPriority?: boolean;
  gatingConfidence?: number;
  clientFriendlyReport?: ReportContent;
  reportStyle?: ReportStyle;
  
  // User data integration metadata
  userDataMetadata?: UserDataMetadata;
  tierAnalysis?: string; // JSON string of ContentTierAnalysis
  
  createdAt: Date;
}

export interface SessionReportProps {
  report: SessionReport;
  session: Session;
}

export interface ReportSummaryProps {
  reports: SessionReport[];
}

export interface GenerateReportRequest {
  sessionId: string;
  messages: Message[];
  reportStyle?: 'client_friendly' | 'clinical_notes';
  forceAnalysisDepth?: 'skip' | 'surface' | 'moderate' | 'comprehensive';
}

import type { Session, Message } from './index';
import type { ContextualAnalysis, ValidationResult } from '@/lib/therapy/context-validator';
// import type { ContentTierAnalysis, AnalysisRecommendation } from '@/lib/therapy/content-priority';
// Removed broken imports - simplified approach

export interface ReportContent {
  summary: string;
  insights: string[];
  recommendations: string[];
}

// ========================================
// COGNITIVE DISTORTION ANALYSIS TYPES
// ========================================

export interface CognitiveDistortion {
  id: string;
  name: string;
  description: string;
  examples: string[];
  severity: 'low' | 'moderate' | 'high';
  frequency: number; // How often it appeared in the session (0-10 scale)
  therapeuticPriority: 'low' | 'medium' | 'high';
  
  // Enhanced contextual validation fields
  emotionalContext: number; // 0-10 scale of emotional intensity
  contextualSupport: string[]; // Evidence phrases supporting therapeutic relevance
  contextAwareConfidence: number; // 0-100 confidence adjusted for context
  validationRationale: string; // Explanation of therapeutic vs neutral context
  neutralContextFlags: string[]; // Flags for non-therapeutic contexts
  falsePositiveRisk: 'low' | 'medium' | 'high'; // Risk assessment
  
  // User data integration fields
  userDataSupported?: boolean; // Whether this distortion is supported by user's own assessment
  analysisGatingTier?: ContentTier; // Which content tier this distortion was identified in
}

export const COGNITIVE_DISTORTIONS = {
  ALL_OR_NOTHING: {
    id: 'all_or_nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Seeing things in black and white categories with no middle ground'
  },
  CATASTROPHIZING: {
    id: 'catastrophizing', 
    name: 'Catastrophizing',
    description: 'Imagining the worst possible outcome and treating it as likely'
  },
  MIND_READING: {
    id: 'mind_reading',
    name: 'Mind Reading',
    description: 'Assuming you know what others are thinking without evidence'
  },
  FORTUNE_TELLING: {
    id: 'fortune_telling',
    name: 'Fortune Telling',
    description: 'Predicting negative outcomes without sufficient evidence'
  },
  EMOTIONAL_REASONING: {
    id: 'emotional_reasoning',
    name: 'Emotional Reasoning',
    description: 'Believing that negative emotions reflect reality ("I feel guilty, so I must have done something bad")'
  },
  SHOULD_STATEMENTS: {
    id: 'should_statements',
    name: 'Should Statements',
    description: 'Using "should", "must", or "ought" in ways that create guilt and pressure'
  },
  LABELING: {
    id: 'labeling',
    name: 'Labeling and Mislabeling',
    description: 'Assigning negative labels to yourself or others based on limited information'
  },
  MENTAL_FILTERING: {
    id: 'mental_filtering',
    name: 'Mental Filtering',
    description: 'Focusing exclusively on negative details while filtering out positive aspects'
  },
  PERSONALIZATION: {
    id: 'personalization',
    name: 'Personalization',
    description: 'Taking responsibility for events outside your control'
  },
  MAGNIFICATION_MINIMIZATION: {
    id: 'magnification_minimization',
    name: 'Magnification/Minimization',
    description: 'Exaggerating negatives or minimizing positives'
  },
  OVERGENERALIZATION: {
    id: 'overgeneralization',
    name: 'Overgeneralization',
    description: 'Drawing broad conclusions based on single incidents'
  },
  DISQUALIFYING_POSITIVE: {
    id: 'disqualifying_positive',
    name: 'Disqualifying the Positive',
    description: 'Dismissing positive experiences as "not counting" for arbitrary reasons'
  },
  JUMPING_TO_CONCLUSIONS: {
    id: 'jumping_to_conclusions',
    name: 'Jumping to Conclusions',
    description: 'Making negative interpretations without definite facts'
  },
  BLAME: {
    id: 'blame',
    name: 'Blame',
    description: 'Blaming others for your emotional pain or blaming yourself for everything'
  },
  ALWAYS_BEING_RIGHT: {
    id: 'always_being_right',
    name: 'Always Being Right',
    description: 'Being continually on trial to prove opinions and actions are correct'
  }
} as const;

// ========================================
// SCHEMA THERAPY ANALYSIS TYPES  
// ========================================

export interface SchemaMode {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  intensity: number; // 0-10 scale
  behavioralIndicators: string[];
  therapeuticResponse: string;
}

export interface EarlyMaladaptiveSchema {
  id: string;
  name: string;
  domain: string;
  description: string;
  isTriggered: boolean;
  severity: 'low' | 'moderate' | 'high';
  manifestations: string[];
}

export interface SchemaAnalysis {
  activeModes: SchemaMode[];
  triggeredSchemas: EarlyMaladaptiveSchema[];
  predominantMode: string | null;
  behavioralPatterns: string[];
  copingStrategies: {
    adaptive: string[];
    maladaptive: string[];
  };
  therapeuticRecommendations: string[];
}

export const SCHEMA_MODES = {
  VULNERABLE_CHILD: {
    id: 'vulnerable_child',
    name: 'Vulnerable Child Mode',
    description: 'Feels sad, scared, lonely, helpless, or needy'
  },
  ANGRY_CHILD: {
    id: 'angry_child', 
    name: 'Angry Child Mode',
    description: 'Feels frustrated, enraged, or defiant when needs are not met'
  },
  ENRAGED_CHILD: {
    id: 'enraged_child',
    name: 'Enraged Child Mode', 
    description: 'Experiences intense, uncontrolled anger and may be destructive'
  },
  IMPULSIVE_CHILD: {
    id: 'impulsive_child',
    name: 'Impulsive Child Mode',
    description: 'Acts impulsively to get needs met or express emotions'
  },
  UNDISCIPLINED_CHILD: {
    id: 'undisciplined_child',
    name: 'Undisciplined Child Mode',
    description: 'Has difficulty with self-control and following rules'
  },
  HAPPY_CHILD: {
    id: 'happy_child',
    name: 'Happy Child Mode',
    description: 'Feels loved, contented, optimistic, and playful'
  },
  COMPLIANT_SURRENDERER: {
    id: 'compliant_surrenderer',
    name: 'Compliant Surrenderer Mode',
    description: 'Gives up own needs to avoid conflict or abandonment'
  },
  DETACHED_PROTECTOR: {
    id: 'detached_protector',
    name: 'Detached Protector Mode',
    description: 'Withdraws emotionally to avoid pain'
  },
  DETACHED_SELF_SOOTHER: {
    id: 'detached_self_soother',
    name: 'Detached Self-Soother Mode',
    description: 'Engages in addictive or compulsive behaviors to soothe emotions'
  },
  PUNITIVE_PARENT: {
    id: 'punitive_parent',
    name: 'Punitive Parent Mode', 
    description: 'Criticizes, punishes, or blames self harshly'
  },
  DEMANDING_PARENT: {
    id: 'demanding_parent',
    name: 'Demanding Parent Mode',
    description: 'Believes only the highest standards are acceptable'
  },
  HEALTHY_ADULT: {
    id: 'healthy_adult',
    name: 'Healthy Adult Mode',
    description: 'Functions in a balanced, self-caring, and effective manner'
  }
} as const;

export const EARLY_MALADAPTIVE_SCHEMAS = {
  // Disconnection and Rejection Domain
  ABANDONMENT: {
    id: 'abandonment',
    name: 'Abandonment/Instability',
    domain: 'Disconnection and Rejection'
  },
  MISTRUST: {
    id: 'mistrust',
    name: 'Mistrust/Abuse',
    domain: 'Disconnection and Rejection'
  },
  EMOTIONAL_DEPRIVATION: {
    id: 'emotional_deprivation',
    name: 'Emotional Deprivation',
    domain: 'Disconnection and Rejection'
  },
  DEFECTIVENESS: {
    id: 'defectiveness',
    name: 'Defectiveness/Shame',
    domain: 'Disconnection and Rejection'
  },
  SOCIAL_ISOLATION: {
    id: 'social_isolation',
    name: 'Social Isolation/Alienation',
    domain: 'Disconnection and Rejection'
  },
  
  // Impaired Autonomy and Performance Domain
  DEPENDENCE: {
    id: 'dependence',
    name: 'Dependence/Incompetence',
    domain: 'Impaired Autonomy and Performance'
  },
  VULNERABILITY: {
    id: 'vulnerability',
    name: 'Vulnerability to Harm',
    domain: 'Impaired Autonomy and Performance'
  },
  ENMESHMENT: {
    id: 'enmeshment',
    name: 'Enmeshment/Undeveloped Self',
    domain: 'Impaired Autonomy and Performance'
  },
  FAILURE: {
    id: 'failure',
    name: 'Failure',
    domain: 'Impaired Autonomy and Performance'
  },
  
  // Impaired Limits Domain
  ENTITLEMENT: {
    id: 'entitlement',
    name: 'Entitlement/Grandiosity',
    domain: 'Impaired Limits'
  },
  INSUFFICIENT_SELF_CONTROL: {
    id: 'insufficient_self_control',
    name: 'Insufficient Self-Control',
    domain: 'Impaired Limits'
  },
  
  // Other-Directedness Domain
  SUBJUGATION: {
    id: 'subjugation',
    name: 'Subjugation',
    domain: 'Other-Directedness'
  },
  SELF_SACRIFICE: {
    id: 'self_sacrifice',
    name: 'Self-Sacrifice',
    domain: 'Other-Directedness'
  },
  APPROVAL_SEEKING: {
    id: 'approval_seeking',
    name: 'Approval-Seeking/Recognition-Seeking',
    domain: 'Other-Directedness'
  },
  
  // Overvigilance and Inhibition Domain
  NEGATIVITY: {
    id: 'negativity',
    name: 'Negativity/Pessimism',
    domain: 'Overvigilance and Inhibition'
  },
  EMOTIONAL_INHIBITION: {
    id: 'emotional_inhibition',
    name: 'Emotional Inhibition',
    domain: 'Overvigilance and Inhibition'
  },
  UNRELENTING_STANDARDS: {
    id: 'unrelenting_standards',
    name: 'Unrelenting Standards/Hypercriticalness',
    domain: 'Overvigilance and Inhibition'
  },
  PUNITIVENESS: {
    id: 'punitiveness',
    name: 'Punitiveness',
    domain: 'Overvigilance and Inhibition'
  }
} as const;

// ========================================
// THERAPEUTIC FRAMEWORK ANALYSIS TYPES
// ========================================

export interface TherapeuticFramework {
  name: string;
  applicability: 'high' | 'medium' | 'low';
  specificTechniques: string[];
  rationale: string;
  priority: number; // 1-5 scale for treatment planning
}

export interface TherapeuticRecommendation {
  framework: string;
  technique: string;
  rationale: string;
  urgency: 'immediate' | 'short-term' | 'long-term';
  expectedOutcome: string;
}

// ========================================
// CONTEXTUAL ANALYSIS INTERFACES
// ========================================

export interface EnhancedCognitiveAnalysis {
  distortions: CognitiveDistortion[];
  contextualValidation: ValidationResult;
  overallConfidence: number;
  falsePositiveCount: number;
  therapeuticRelevanceScore: number;
}

export interface SessionContextSummary {
  emotionalIntensityRange: [number, number]; // Min/max intensity in session
  predominantContextType: 'therapeutic' | 'neutral' | 'organizational' | 'mixed';
  validationFlags: string[];
  confidenceDistribution: {
    high: number;    // Count of high confidence distortions (80+)
    medium: number;  // Count of medium confidence distortions (50-79)
    low: number;     // Count of low confidence distortions (<50)
  };
}

// ========================================
// CLIENT-FRIENDLY REPORT TYPES
// ========================================

export type ContentTier = 'tier1_premium' | 'tier2_standard' | 'tier3_minimal';
export type AnalysisScope = 'comprehensive' | 'targeted' | 'supportive_only' | 'skip';
export type ReportStyle = 'client_friendly' | 'clinical_notes' | 'brief_supportive';

export interface UserDataMetadata {
  hasUserData: boolean;
  userRatingCount: number;
  userDataReliability: number;
  assessmentTypes: string[];
  shouldPrioritizeUserData: boolean;
}

export interface ClientFriendlySessionReport {
  id: string;
  sessionId: string;
  
  // Client-friendly metadata
  contentTier: ContentTier;
  reportStyle: ReportStyle;
  analysisApproach: AnalysisScope;
  
  // User data integration
  userDataHighlights: string[];
  userProvidedAssessments: UserProvidedAssessment[];
  
  // Growth-focused insights
  growthInsights: GrowthInsight[];
  strengthsIdentified: string[];
  healingJourneyHighlights: string[];
  
  // Supportive recommendations
  gentleActionSteps: ActionStep[];
  supportiveResources: Resource[];
  selfCareReminders: string[];
  
  // Pattern recognition (client-friendly language)
  patternsDiscovered: Pattern[];
  connectionsMade: string[];
  
  // Encouragement and validation
  validationMessages: string[];
  courageAcknowledgments: string[];
  progressRecognition: string[];
  
  createdAt: Date;
}

export interface UserProvidedAssessment {
  type: 'emotion_rating' | 'thought_credibility' | 'self_evaluation' | 'general';
  rating?: number;
  context: string;
  clientInsight: string;
  therapeuticValue: 'high' | 'medium' | 'low';
}

export interface GrowthInsight {
  category: 'self_awareness' | 'pattern_recognition' | 'emotional_growth' | 'behavioral_change';
  insight: string;
  clientFriendlyExplanation: string;
  encouragingPerspective: string;
  growthOpportunity: string;
}

export interface ActionStep {
  category: 'self_compassion' | 'mindfulness' | 'reflection' | 'self_care' | 'relationship';
  suggestion: string;
  rationale: string;
  difficulty: 'gentle' | 'moderate' | 'challenging';
  timeframe: 'immediate' | 'this_week' | 'ongoing';
  optional: boolean;
}

export interface Resource {
  type: 'technique' | 'tool' | 'reading' | 'practice' | 'support';
  name: string;
  description: string;
  helpfulFor: string[];
  accessibilityLevel: 'easy' | 'moderate' | 'requires_guidance';
}

export interface Pattern {
  patternType: 'thinking' | 'emotional' | 'behavioral' | 'relational';
  description: string;
  clientFriendlyExplanation: string;
  positiveReframe: string;
  growthOpportunity: string;
  userRecognitionLevel: 'high' | 'emerging' | 'unconscious';
}

// ========================================
// ENHANCED COGNITIVE DISTORTION TYPES
// ========================================

export interface EnhancedCognitiveDistortion extends CognitiveDistortion {
  // User data integration
  userDataSupported: boolean;
  analysisGatingTier: ContentTier;
  
  // Client-friendly fields
  clientFriendlyName: string;
  clientFriendlyDescription: string;
  growthOpportunity: string;
  gentleChallenge: string;
  
  // Pattern context
  patternFrequency: 'rare' | 'occasional' | 'frequent' | 'persistent';
  emotionalImpact: 'mild' | 'moderate' | 'significant';
  readinessForWork: 'not_ready' | 'exploring' | 'ready' | 'actively_working';
}

// ========================================
// REPORT GENERATION TYPES
// ========================================

export interface ReportGenerationContext {
  contentTier: ContentTier;
  analysisScope: AnalysisScope;
  requestedStyle: ReportStyle;
  userPreferences?: ReportUserPreferences;
}

export interface ReportUserPreferences {
  preferGentleLanguage: boolean;
  focusOnGrowth: boolean;
  includeActionItems: boolean;
  emphasizeStrengths: boolean;
  minimizePathology: boolean;
}

export interface ReportGenerationResult {
  success: boolean;
  reportContent: string;
  analysisApproach: AnalysisScope;
  contentTier: ContentTier;
  userDataPriority: boolean;
  confidence: number;
  hasUserData: boolean;
  userRatingCount: number;
  modelUsed: string;
  modelDisplayName: string;
  
  // Error handling
  warnings?: string[];
  limitations?: string[];
}

// ========================================
// ANALYTICS AND METRICS TYPES
// ========================================

export interface ReportAnalytics {
  contentTierDistribution: Record<ContentTier, number>;
  analysisScopeDistribution: Record<AnalysisScope, number>;
  userDataPriorityRate: number;
  averageGatingConfidence: number;
  
  // Quality metrics
  falsePositivePreventionRate: number;
  userDataIntegrationRate: number;
  clientFriendlyReportRate: number;
  
  // Therapeutic outcomes
  supportiveResponseRate: number;
  comprehensiveAnalysisRate: number;
  overAnalysisPreventionRate: number;
}

export interface SessionReportMetrics {
  reportId: string;
  sessionId: string;
  
  // Gating metrics
  contentTier: ContentTier;
  analysisScope: AnalysisScope;
  gatingConfidence: number;
  
  // User data metrics
  userDataPresent: boolean;
  userRatingCount: number;
  userDataReliability: number;
  
  // Analysis quality metrics
  cognitiveDistortionsIdentified: number;
  falsePositivesFiltered: number;
  contextualConfidenceAverage: number;
  
  // Report characteristics
  reportStyle: ReportStyle;
  clientFriendlyGenerated: boolean;
  wordCount: number;
  processingTimeMs: number;
  
  // Therapeutic appropriateness
  therapeuticRelevanceScore: number;
  overAnalysisRisk: 'low' | 'medium' | 'high';
  supportiveAppropriatenessScore: number;
  
  createdAt: Date;
}