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
}

import type { Session, Message } from './index';

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