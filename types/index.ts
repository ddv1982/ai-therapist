// Centralized TypeScript type definitions for the AI Therapist application

// Database Models (matching Prisma schema)
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  title: string;
  startedAt: Date;
  endedAt?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  createdAt: Date;
}

export interface SessionReport {
  id: string;
  sessionId: string;
  keyPoints: string; // JSON string
  therapeuticInsights: string; // JSON string
  patternsIdentified: string; // JSON string
  actionItems: string; // JSON string
  moodAssessment?: string;
  progressNotes?: string;
  createdAt: Date;
}

// API Request/Response Types
export interface ChatRequest {
  messages: Message[];
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  sessionId?: string;
}

export interface ChatResponse {
  choices: Array<{
    delta: {
      content: string;
    };
  }>;
}

export interface CreateSessionRequest {
  title: string;
}

export interface SessionsResponse {
  sessions: Session[];
}


// UI Component Types
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  category: 'featured' | 'production' | 'preview';
}

export interface ChatSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Validation Types (re-exported from validation schema)
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Logging Types
export interface LogContext {
  userId?: string;
  sessionId?: string;
  apiEndpoint?: string;
  userAgent?: string;
  timestamp?: string;
  requestId?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
  timestamp: string;
}

// Error Types
export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: LogContext;
}

// Groq API Types
export interface GroqModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  active: boolean;
  context_window: number;
}

export interface GroqChoice {
  index: number;
  delta: {
    role?: string;
    content?: string;
  };
  finish_reason?: string;
}

export interface GroqStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChoice[];
}

// Environment Configuration Types
export interface AppConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  databaseUrl: string;
  groqApiKey?: string;
  nextAuthSecret?: string;
  nextAuthUrl?: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event Types for custom hooks
export interface ChatEvent {
  type: 'message_sent' | 'message_received' | 'error_occurred';
  payload: any;
  timestamp: Date;
}

// Mobile/Responsive Types
export interface ViewportDimensions {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Session Management Types
export interface SessionState {
  currentSession?: Session;
  sessions: Session[];
  loading: boolean;
  error?: string;
}

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentMessage: string;
  settings: ChatSettings;
  error?: string;
}