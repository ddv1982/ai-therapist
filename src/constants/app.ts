/**
 * Application Constants
 * App-wide constants and configuration values
 */

export const APP_NAME = 'AI Therapist';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Compassionate AI Mental Health Support';

// API Configuration
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  SESSIONS: '/api/sessions',
  MESSAGES: '/api/messages',
  REPORTS: '/api/reports',
  AUTH: '/api/auth',
  MODELS: '/api/models',
} as const;

// Application Limits
export const LIMITS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_SESSIONS: 100,
  MAX_MESSAGES_PER_SESSION: 1000,
  SESSION_TIMEOUT_MINUTES: 30,
} as const;

// Default Settings
export const DEFAULTS = {
  THEME: 'system' as const,
  TEMPERATURE: 0.6,
  MAX_TOKENS: 30000,
  TOP_P: 1,
  MODEL: 'openai/gpt-oss-20b',
} as const;