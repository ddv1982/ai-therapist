// DEPRECATED: This file is deprecated and should not be used.
// All CBT functionality has been migrated to Redux-only patterns.
// These are stub implementations to prevent build errors during migration.

import { logger } from '@/lib/utils/logger';

export const CBT_DRAFT_KEYS = {
  SITUATION: 'cbt-situation',
  EMOTIONS: 'cbt-emotions', 
  THOUGHTS: 'cbt-thoughts',
  CORE_BELIEF: 'cbt-core-belief',
  CHALLENGE_QUESTIONS: 'cbt-challenge-questions',
  RATIONAL_THOUGHTS: 'cbt-rational-thoughts',
  SCHEMA_MODES: 'cbt-schema-modes',
  ACTION_PLAN: 'cbt-action-plan',
  FINAL_EMOTIONS: 'cbt-final-emotions',
  NEW_BEHAVIORS: 'cbt-new-behaviors',
  ALTERNATIVE_RESPONSES: 'cbt-alternative-responses',
  SCHEMA_REFLECTION_ASSESSMENT: 'cbt-schema-reflection-assessment',
  SCHEMA_REFLECTION_PATTERNS: 'cbt-schema-reflection-patterns',
  SCHEMA_REFLECTION_MODES: 'cbt-schema-reflection-modes'
};

// Stub functions - DO NOT USE, migrate to Redux instead
export const loadCBTDraftSync = <T>(_key: string, defaultValue: T): T => {
  logger.warn('Deprecated function called', { 
    function: 'loadCBTDraftSync',
    message: 'Use Redux store instead',
    category: 'deprecation'
  });
  return defaultValue;
};

export const useDraftSaver = (_key: string, _data: unknown) => {
  logger.warn('Deprecated function called', { 
    function: 'useDraftSaver',
    message: 'Use Redux store instead',
    category: 'deprecation'
  });
  return { isDraftSaved: true };
};

export const clearCBTDraft = (_key: string) => {
  logger.warn('Deprecated function called', { 
    function: 'clearCBTDraft',
    message: 'Data is managed by Redux',
    category: 'deprecation'
  });
};

export const saveCBTDraft = (_key: string, _data: unknown) => {
  logger.warn('Deprecated function called', { 
    function: 'saveCBTDraft',
    message: 'Use Redux actions instead',
    category: 'deprecation'
  });
  return {};
};

export const loadCBTDraft = <T>(_key: string, defaultValue: T): Promise<T> => {
  logger.warn('Deprecated function called', { 
    function: 'loadCBTDraft',
    message: 'Use Redux store instead',
    category: 'deprecation'
  });
  return Promise.resolve(defaultValue);
};

export const clearAllCBTDrafts = () => {
  logger.warn('Deprecated function called', { 
    function: 'clearAllCBTDrafts',
    message: 'Use Redux clearCBTSession instead',
    category: 'deprecation'
  });
};