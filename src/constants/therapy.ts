/**
 * Therapy Constants
 * Constants related to therapeutic AI features and CBT functionality
 */

// AI Models for different purposes
export const THERAPY_MODELS = {
  FAST: 'openai/gpt-oss-20b',
  ANALYTICAL: 'openai/gpt-oss-120b',
} as const;

// CBT-related constants
export const CBT = {
  THOUGHT_RECORD_SECTIONS: [
    'Situation',
    'Thoughts', 
    'Emotions',
    'Physical Sensations',
    'Behaviors'
  ] as const,
  DISTORTION_TYPES: [
    'All-or-Nothing Thinking',
    'Overgeneralization',
    'Mental Filter',
    'Discounting the Positive',
    'Jumping to Conclusions',
    'Magnification',
    'Emotional Reasoning',
    'Should Statements',
    'Labeling',
    'Personalization'
  ] as const,
} as const;

// Session timing
export const SESSION = {
  MIN_DURATION_MINUTES: 5,
  MAX_DURATION_MINUTES: 120,
  SUGGESTED_DURATION_MINUTES: 45,
} as const;

// Crisis intervention keywords
export const CRISIS_KEYWORDS = [
  'suicide',
  'self-harm',
  'hurt myself',
  'kill myself',
  'end it all',
  'not worth living',
] as const;