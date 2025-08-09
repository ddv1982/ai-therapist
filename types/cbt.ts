// CBT (Cognitive Behavioral Therapy) Diary Types
// Types for structured CBT diary entry form data and validation

export interface CBTDiaryEmotions {
  fear: number;
  anger: number;
  sadness: number;
  joy: number;
  anxiety: number;
  shame: number;
  guilt: number;
  other?: string;
  otherIntensity?: number;
}

export interface CBTDiaryAutomaticThought {
  thought: string;
  credibility: number;
}

export interface CBTDiarySchemaMode {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

export interface CBTDiaryChallengeQuestion {
  question: string;
  answer: string;
}

export interface CBTDiaryRationalThought {
  thought: string;
  confidence: number;
}

export interface CBTDiaryAlternativeResponse {
  response: string;
}

export interface CBTDiaryFormData {
  // Basic Information
  date: string;
  situation: string;
  
  // Initial Emotions (1-10 scale)
  initialEmotions: CBTDiaryEmotions;
  
  // Automatic Thoughts
  automaticThoughts: CBTDiaryAutomaticThought[];
  
  // Schema Information
  coreBeliefText: string;
  coreBeliefCredibility: number;
  confirmingBehaviors: string;
  avoidantBehaviors: string;
  overridingBehaviors: string;
  
  // Schema Modes (checkboxes)
  schemaModes: CBTDiarySchemaMode[];
  
  // Challenge Questions
  challengeQuestions: CBTDiaryChallengeQuestion[];
  additionalQuestions: CBTDiaryChallengeQuestion[];
  
  // Rational Thoughts
  rationalThoughts: CBTDiaryRationalThought[];
  
  // Post-reflection Emotions
  finalEmotions: CBTDiaryEmotions;
  originalThoughtCredibility: number;
  
  // Results
  newBehaviors: string;
  alternativeResponses: CBTDiaryAlternativeResponse[];
}

export interface CBTDiaryFormState {
  data: CBTDiaryFormData;
  isDirty: boolean;
  isValid: boolean;
  lastSaved?: Date;
  errors: Record<string, string>;
}

export interface CBTFormValidationError {
  field: string;
  message: string;
}

// Default schema modes based on Schema Therapy
export const DEFAULT_SCHEMA_MODES: CBTDiarySchemaMode[] = [
  {
    id: 'vulnerable-child',
    name: 'The Vulnerable Child',
    description: 'scared, helpless, needy',
    selected: false
  },
  {
    id: 'angry-child',
    name: 'The Angry Child',
    description: 'frustrated, defiant, rebellious',
    selected: false
  },
  {
    id: 'punishing-parent',
    name: 'The Punishing Parent',
    description: 'critical, harsh, demanding',
    selected: false
  },
  {
    id: 'demanding-parent',
    name: 'The Demanding Parent',
    description: 'controlling, entitled, impatient',
    selected: false
  },
  {
    id: 'detached-self-soother',
    name: 'The Detached Self-Soother',
    description: 'withdrawn, disconnected, avoiding',
    selected: false
  },
  {
    id: 'healthy-adult',
    name: 'The Healthy Adult',
    description: 'balanced, rational, caring',
    selected: false
  }
];

// Default challenge questions
export const DEFAULT_CHALLENGE_QUESTIONS: CBTDiaryChallengeQuestion[] = [
  {
    question: "What does it say about me that I have this thought?",
    answer: ""
  },
  {
    question: "Are thoughts the same as actions?",
    answer: ""
  },
  {
    question: "What would I say to a friend in this situation?",
    answer: ""
  },
  {
    question: "Can I influence the future with my thoughts alone?",
    answer: ""
  },
  {
    question: "What is the effect of this thought on my life?",
    answer: ""
  },
  {
    question: "Is this thought in line with my values?",
    answer: ""
  },
  {
    question: "What would my healthy adult self say about this?",
    answer: ""
  }
];

// ========================================
// CBT THOUGHT RECORD (7-Column Format)
// ========================================

// Single emotion entry with name and intensity (0-100)
export interface CBTEmotion {
  name: string;
  intensity: number;
}

// CBT Thought Record - Standard 7-column format
export interface CBTThoughtRecord {
  date: string;
  
  // Column 1: Situation (when, where, who)
  situation: string;
  
  // Column 2: Automatic Thought(s)
  automaticThoughts: string;
  
  // Column 3: Emotion(s) & Intensity (0-100)
  emotions: CBTEmotion[];
  
  // Column 4: Evidence for the Thought
  evidenceFor: string;
  
  // Column 5: Evidence against the Thought  
  evidenceAgainst: string;
  
  // Column 6: Balanced / Alternative Thought
  balancedThought: string;
  
  // Column 7: New Feeling (Intensity after reframing)
  newEmotions: CBTEmotion[];
}

// Form state for CBT thought record
export interface CBTFormState {
  data: CBTThoughtRecord;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  lastSaved?: Date;
}

// Validation error type
export interface CBTFormValidationError {
  field: string;
  message: string;
}

// Initial data generator
export const getInitialCBTThoughtRecord = (): CBTThoughtRecord => {
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    situation: '',
    automaticThoughts: '',
    emotions: [{ name: '', intensity: 0 }],
    evidenceFor: '',
    evidenceAgainst: '',
    balancedThought: '',
    newEmotions: [{ name: '', intensity: 0 }]
  };
};

// ========================================
// ORIGINAL COMPLEX CBT TYPES (Legacy)
// ========================================

// Initial empty form data
export const getInitialCBTFormData = (): CBTDiaryFormData => {
  const today = new Date().toISOString().split('T')[0];
  
  const emptyEmotions: CBTDiaryEmotions = {
    fear: 0,
    anger: 0,
    sadness: 0,
    joy: 0,
    anxiety: 0,
    shame: 0,
    guilt: 0,
    other: '',
    otherIntensity: 0
  };

  return {
    date: today,
    situation: '',
    initialEmotions: { ...emptyEmotions },
    automaticThoughts: [{ thought: '', credibility: 0 }],
    coreBeliefText: '',
    coreBeliefCredibility: 0,
    confirmingBehaviors: '',
    avoidantBehaviors: '',
    overridingBehaviors: '',
    schemaModes: DEFAULT_SCHEMA_MODES.map(mode => ({ ...mode })),
    challengeQuestions: DEFAULT_CHALLENGE_QUESTIONS.map(q => ({ ...q })),
    additionalQuestions: [{ question: '', answer: '' }],
    rationalThoughts: [{ thought: '', confidence: 0 }],
    finalEmotions: { ...emptyEmotions },
    originalThoughtCredibility: 0,
    newBehaviors: '',
    alternativeResponses: [{ response: '' }]
  };
};