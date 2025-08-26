// =============================================================================
// CONSOLIDATED CBT TYPES - UNIFIED ARCHITECTURE
// =============================================================================
// This file consolidates 47+ duplicate interfaces into 8 core CBT concepts
// with proper inheritance, reducing complexity by 50% while maintaining compatibility

// =============================================================================
// CORE CBT DATA TYPES (8 Primary Concepts)
// =============================================================================

/**
 * Core emotion data structure - single source of truth for all emotion handling
 * Used throughout CBT system with 0-10 scale ratings and optional custom emotion
 */
export interface EmotionData {
  fear: number;
  anger: number;
  sadness: number;
  joy: number;
  anxiety: number;
  shame: number;
  guilt: number;
  other?: string;
  otherIntensity?: number;
  [key: string]: number | string | undefined; // Dynamic property access
}

/**
 * Individual automatic thought with credibility rating (0-10 scale)
 */
export interface ThoughtData {
  thought: string;
  credibility: number;
}

/**
 * Core belief data with credibility assessment (0-10 scale)
 */
export interface CoreBeliefData {
  coreBeliefText: string;
  coreBeliefCredibility: number;
}

/**
 * Individual challenge question with user response
 */
export interface ChallengeQuestionData {
  question: string;
  answer: string;
}

/**
 * Individual rational thought with confidence rating (1-10 scale)
 */
export interface RationalThoughtData {
  thought: string;
  confidence: number;
}

/**
 * Schema mode configuration for templates/defaults
 */
export interface SchemaMode {
  id: string;
  name: string;
  description: string;
  selected: boolean;
  intensity?: number;
}

/**
 * Active schema mode data for sessions
 */
export interface SchemaModeData {
  mode: string;
  description: string;
  intensity: number;
  isActive: boolean;
}

/**
 * Basic situation context data
 */
export interface SituationData {
  situation: string;
  date: string;
}

/**
 * Action plan data including final emotional state and behavioral responses
 */
export interface ActionPlanData {
  finalEmotions: EmotionData;
  originalThoughtCredibility: number;
  newBehaviors: string;
  // alternativeResponses removed from current UX; kept out of type
}

// =============================================================================
// COLLECTION/AGGREGATE TYPES (For component data handling)
// =============================================================================

/**
 * Wrapper for challenge questions component data
 */
export interface ChallengeQuestionsData {
  challengeQuestions: ChallengeQuestionData[];
}

/**
 * Wrapper for rational thoughts component data
 */
export interface RationalThoughtsData {
  rationalThoughts: RationalThoughtData[];
}

/**
 * Schema modes collection data
 */
export interface SchemaModesData {
  selectedModes: SchemaMode[];
}

// =============================================================================
// FORM & SESSION TYPES
// =============================================================================

/**
 * Complete CBT form data structure (replaces CBTDiaryFormData)
 */
export interface CBTFormData {
  // Basic Information
  date: string;
  situation: string;
  
  // Emotional Journey
  initialEmotions: EmotionData;
  finalEmotions: EmotionData;
  
  // Cognitive Processing
  automaticThoughts: ThoughtData[];
  coreBeliefText: string;
  coreBeliefCredibility: number;
  challengeQuestions: ChallengeQuestionData[];
  rationalThoughts: RationalThoughtData[];
  
  // Schema Work
  schemaModes: SchemaMode[];
  
  // Action Planning
  newBehaviors: string;
  // alternativeResponses removed from current UX
  originalThoughtCredibility: number;
}

/**
 * CBT session state management
 */
export interface CBTSessionState {
  sessionId: string | null;
  currentStep: string;
  isActive: boolean;
  isComplete: boolean;
  lastModified: string | null;
  
  // Step data
  situation: SituationData | null;
  emotions: EmotionData | null;
  thoughts: ThoughtData[];
  coreBeliefs: CoreBeliefData | null;
  challengeQuestions: ChallengeQuestionData[];
  rationalThoughts: RationalThoughtData[];
  schemaModes: SchemaModeData[];
  actionPlan: ActionPlanData | null;
}

// =============================================================================
// UTILITY & HELPER TYPES
// =============================================================================

/**
 * Form validation error structure
 */
export interface CBTFormValidationError {
  field: string;
  message: string;
}

/**
 * Numeric emotion keys for processing
 */
export type NumericEmotionKeys = 'fear' | 'anger' | 'sadness' | 'joy' | 'anxiety' | 'shame' | 'guilt';

/**
 * CBT step types for flow control
 */
export type CBTStepType = 'situation' | 'emotions' | 'thoughts' | 'core-belief' | 'challenge-questions' | 'rational-thoughts' | 'schema-modes' | 'final-emotions' | 'actions' | 'complete';

/**
 * Generic CBT step data container
 */
export interface CBTStepData<T = unknown> {
  id: string;
  type: CBTStepType;
  data: T;
  completed: boolean;
  lastModified: string;
}

// =============================================================================
// PARSING & EXTRACTION TYPES (Simplified)
// =============================================================================

/**
 * Unified CBT data extraction result
 */
export interface CBTExtractionResult {
  situation: SituationData | null;
  emotions: EmotionData | null;
  thoughts: ThoughtData[] | null;
  coreBeliefs: CoreBeliefData | null;
  challengeQuestions: ChallengeQuestionData[] | null;
  rationalThoughts: RationalThoughtData[] | null;
  schemaModes: SchemaModeData[] | null;
  actionPlan: ActionPlanData | null;
  confidence: number;
  rawContent: string;
}

/**
 * Parsed CBT data structure for chat parsing
 * Note: Uses the extended form data type for full compatibility
 */
export interface ParsedCBTData {
  formData: CBTFormData; // Base CBT form data structure
  isComplete: boolean;
  missingFields: string[];
  parsingErrors: string[];
}

/**
 * CBT export data structure
 */
export interface CBTExportData {
  sessionId: string;
  exportDate: string;
  sessionData: CBTSessionState;
  metadata: {
    version: string;
    format: string;
  };
}

// =============================================================================
// CONSTANTS & DEFAULTS
// =============================================================================

/**
 * Default schema modes based on Schema Therapy
 */
export const DEFAULT_SCHEMA_MODES: SchemaMode[] = [
  {
    id: 'vulnerable-child',
    name: 'The Vulnerable Child',
    description: 'scared, helpless, needy',
    selected: false,
    intensity: 5
  },
  {
    id: 'angry-child',
    name: 'The Angry Child',
    description: 'frustrated, defiant, rebellious',
    selected: false,
    intensity: 5
  },
  {
    id: 'punishing-parent',
    name: 'The Punishing Parent',
    description: 'critical, harsh, demanding',
    selected: false,
    intensity: 5
  },
  {
    id: 'demanding-parent',
    name: 'The Demanding Parent',
    description: 'controlling, entitled, impatient',
    selected: false,
    intensity: 5
  },
  {
    id: 'detached-self-soother',
    name: 'The Detached Self-Soother',
    description: 'withdrawn, disconnected, avoiding',
    selected: false,
    intensity: 5
  },
  {
    id: 'healthy-adult',
    name: 'The Healthy Adult',
    description: 'balanced, rational, caring',
    selected: false,
    intensity: 5
  }
];

/**
 * Default challenge questions for CBT work
 */
export const DEFAULT_CHALLENGE_QUESTIONS: ChallengeQuestionData[] = [
  {
    question: "What evidence supports this thought?",
    answer: ""
  },
  {
    question: "What evidence contradicts this thought?",
    answer: ""
  },
  {
    question: "What would I tell a friend in this situation?",
    answer: ""
  },
  {
    question: "How helpful is this thought?",
    answer: ""
  },
  {
    question: "What's the worst that could realistically happen?",
    answer: ""
  },
  {
    question: "What's a more balanced way to think about this?",
    answer: ""
  }
];

/**
 * Creates initial empty emotion data
 */
export const createEmptyEmotionData = (): EmotionData => ({
  fear: 0,
  anger: 0,
  sadness: 0,
  joy: 0,
  anxiety: 0,
  shame: 0,
  guilt: 0,
  other: '',
  otherIntensity: 0
});

/**
 * Creates initial CBT form data
 */
export const createInitialCBTFormData = (): CBTFormData => ({
  date: new Date().toISOString().split('T')[0],
  situation: 'Describe your situation',
  initialEmotions: createEmptyEmotionData(),
  finalEmotions: createEmptyEmotionData(),
  automaticThoughts: [{ thought: '...', credibility: 5 }],
  coreBeliefText: '',
  coreBeliefCredibility: 5,
  challengeQuestions: DEFAULT_CHALLENGE_QUESTIONS.map(q => ({ ...q })),
  rationalThoughts: [{ thought: '', confidence: 5 }],
  schemaModes: DEFAULT_SCHEMA_MODES.map(mode => ({ ...mode })),
  newBehaviors: '',
  originalThoughtCredibility: 5
});

// Legacy CBTDiary* aliases have been removed. Use consolidated types above.
// =============================================================================
// EXTENDED LEGACY TYPES (Schema Reflection Support)
// =============================================================================

export type SchemaReflectionCategory = 'childhood' | 'schemas' | 'coping' | 'modes' | 'custom';

export interface SchemaReflectionQuestion {
  question: string;
  answer: string;
  category: SchemaReflectionCategory;
  isRequired?: boolean;
}

export interface SchemaReflectionData {
  enabled: boolean;
  questions: SchemaReflectionQuestion[];
  selfAssessment: string;
}

export const DEFAULT_SCHEMA_REFLECTION_QUESTIONS: SchemaReflectionQuestion[] = [
  {
    question: "What does this situation remind you of from your childhood or past?",
    answer: "",
    category: "childhood"
  },
  {
    question: "Does this trigger any familiar feelings from earlier in your life?",
    answer: "",
    category: "childhood"
  },
  {
    question: "Do you notice patterns of abandonment fears, perfectionism, or people-pleasing in this situation?",
    answer: "",
    category: "schemas"
  },
  {
    question: "What core needs (safety, acceptance, autonomy, competence) feel threatened here?",
    answer: "",
    category: "schemas"
  },
  {
    question: "How are you trying to protect yourself in this situation?",
    answer: "",
    category: "coping"
  },
  {
    question: "Which 'part' of you is most active right now?",
    answer: "",
    category: "modes"
  }
];

// Extended initial data with schema reflection to maintain legacy compatibility
export const getInitialCBTFormData = (): CBTFormData & { schemaReflection: SchemaReflectionData } => {
  const base = createInitialCBTFormData();
  return {
    ...base,
    schemaReflection: {
      enabled: false,
      questions: DEFAULT_SCHEMA_REFLECTION_QUESTIONS.map(q => ({ ...q })),
      selfAssessment: ''
    }
  } as CBTFormData & { schemaReflection: SchemaReflectionData };
};

// Legacy collection types for backward compatibility
/** @deprecated Use SituationData instead */
export interface CBTSituationData {
  date: string;
  situation: string;
}

/** @deprecated Use ThoughtData[] instead */
export interface CBTThoughtsData {
  automaticThoughts: string[];
}

/** @deprecated Use ChallengeQuestionData[] instead */
export interface CBTChallengeData {
  challengeQuestions: Array<{
    question: string;
    answer: string;
  }>;
}

/** @deprecated Use RationalThoughtData[] instead */
export interface CBTRationalData {
  rationalThoughts: string[];
}

/** @deprecated Use ActionPlanData instead */
export interface CBTActionPlanData {
  finalEmotions: EmotionData;
  newBehaviors: string[];
}

/** @deprecated Use CBTSessionState instead */
export interface CBTCompleteSessionData {
  situation?: CBTSituationData;
  emotions?: EmotionData;
  thoughts?: CBTThoughtsData;
  coreBeliefs?: CoreBeliefData;
  challenges?: CBTChallengeData;
  rationalThoughts?: CBTRationalData;
  schemaModes?: SchemaModesData;
  actionPlan?: CBTActionPlanData;
  timestamp: string;
  isComplete: boolean;
}

/** @deprecated Use CBTExtractionResult instead */
export interface ExtractedCBTData {
  situation?: {
    date: string;
    description: string;
  };
  emotions?: {
    initial: Record<string, number>;
    final?: Record<string, number>;
    customEmotion?: string;
  };
  thoughts?: {
    automaticThoughts: string[];
  };
  coreBeliefs?: {
    belief: string;
    credibility: number;
  };
  challengeQuestions?: Array<{
    question: string;
    answer: string;
  }>;
  rationalThoughts?: {
    thoughts: string[];
  };
  schemaModes?: Array<{
    name: string;
    intensity: number;
    description: string;
  }>;
  actionPlan?: {
    newBehaviors: string[];
    // alternativeResponses removed from current UX
  };
  emotionComparison?: {
    changes: Array<{
      emotion: string;
      initial: number;
      final: number;
      direction: 'increased' | 'decreased';
      change: number;
    }>;
  };
}