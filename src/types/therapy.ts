// =============================================================================
// CBT (Cognitive Behavioral Therapy) Types - CONSOLIDATED ARCHITECTURE
// =============================================================================
// This file now imports from the consolidated types and maintains legacy compatibility

// Import all consolidated types
export * from './therapy-consolidated';

// Re-export commonly used types with original names for compatibility
export type {
  EmotionData as CBTDiaryEmotions,
  ThoughtData as CBTDiaryAutomaticThought,
  SchemaMode as CBTDiarySchemaMode,
  ChallengeQuestionData as CBTDiaryChallengeQuestion,
  RationalThoughtData as CBTDiaryRationalThought
} from './therapy-consolidated';

// For legacy compatibility, CBTDiaryFormData should be the extended version
export type CBTDiaryFormData = ExtendedCBTFormData;

// Override ParsedCBTData to use extended form data
export interface ParsedCBTData {
  formData: ExtendedCBTFormData;
  isComplete: boolean;
  missingFields: string[];
  parsingErrors: string[];
}

// Legacy numeric emotions type  
import type { 
  EmotionData, 
  NumericEmotionKeys, 
  ThoughtData, 
  ChallengeQuestionData, 
  RationalThoughtData, 
  SchemaMode 
} from './therapy-consolidated';
import { createInitialCBTFormData } from './therapy-consolidated';
export type NumericEmotions = Pick<EmotionData, NumericEmotionKeys>;

// Alternative response interface (still used in some legacy code)
export interface CBTDiaryAlternativeResponse {
  response: string;
}

// ========================================
// EXTENDED LEGACY TYPES (Specialized features not yet consolidated)
// ========================================

// Schema reflection types (advanced feature)
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

// Extended form data with schema reflection (for specialized CBT diary forms)
export interface ExtendedCBTFormData {
  // All base CBT form fields
  date: string;
  situation: string;
  initialEmotions: EmotionData;
  finalEmotions: EmotionData;
  automaticThoughts: ThoughtData[];
  coreBeliefText: string;
  coreBeliefCredibility: number;
  challengeQuestions: ChallengeQuestionData[];
  rationalThoughts: RationalThoughtData[];
  schemaModes: SchemaMode[];
  newBehaviors: string;
  alternativeResponses: Array<{ response: string }>;
  originalThoughtCredibility: number;
  
  // Additional schema behavior fields
  confirmingBehaviors: string;
  avoidantBehaviors: string;
  overridingBehaviors: string;
  
  // Schema reflection (optional advanced feature)
  schemaReflection: SchemaReflectionData;
  
  // Additional challenge questions
  additionalQuestions: ChallengeQuestionData[];
}

// Form state management
export interface CBTDiaryFormState {
  data: ExtendedCBTFormData;
  isDirty: boolean;
  isValid: boolean;
  lastSaved?: Date;
  errors: Record<string, string>;
}

// Legacy 7-column thought record format
export interface CBTEmotion {
  name: string;
  intensity: number;
}

// Default schema reflection questions
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

// Legacy form data creation (with extended features)
export const getInitialCBTFormData = (): ExtendedCBTFormData => {
  const baseData = createInitialCBTFormData();
  
  return {
    ...baseData,
    confirmingBehaviors: '',
    avoidantBehaviors: '',
    overridingBehaviors: '',
    schemaReflection: {
      enabled: false,
      questions: DEFAULT_SCHEMA_REFLECTION_QUESTIONS.map(q => ({ ...q })),
      selfAssessment: ''
    },
    additionalQuestions: [{ question: '', answer: '' }]
  };
};

// Note: All consolidated types are now imported from therapy-consolidated.ts
// This file maintains backward compatibility for legacy code.