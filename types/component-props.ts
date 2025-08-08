/**
 * Consolidated component props interfaces for therapeutic AI application
 * Reduces duplication and provides consistent typing across components
 */

import { ReactNode } from 'react';
import { ModelConfig, Message, Session, ChatSettings } from './index';

// ============================================================================
// COMMON PROP PATTERNS
// ============================================================================

/**
 * Standard props for components that handle show/hide state
 */
export interface ToggleComponentProps {
  show: boolean;
  setShow: (show: boolean) => void;
}

/**
 * Standard props for components with children
 */
export interface ContainerComponentProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Standard props for components that handle loading states
 */
export interface LoadingComponentProps {
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Standard props for components with error handling
 */
export interface ErrorComponentProps {
  error?: string | null;
  onErrorDismiss?: () => void;
}

/**
 * Combined props for components with common state management
 */
export interface StatefulComponentProps 
  extends ToggleComponentProps, 
          LoadingComponentProps, 
          ErrorComponentProps {}

// ============================================================================
// THERAPEUTIC MESSAGE COMPONENTS
// ============================================================================

/**
 * Props for message-related components
 */
export interface MessageComponentProps {
  message: Message;
  isStreaming?: boolean;
  onRetry?: () => void;
}

/**
 * Props for message lists and containers
 */
export interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

/**
 * Extended message props with therapeutic context
 */
export interface TherapeuticMessageProps extends MessageComponentProps {
  sessionId?: string;
  isTherapeuticResponse?: boolean;
  showTimestamp?: boolean;
  enableReactions?: boolean;
}

// ============================================================================
// SESSION MANAGEMENT COMPONENTS
// ============================================================================

/**
 * Standard session props used across multiple components
 */
export interface SessionProps {
  session: Session;
  isActive?: boolean;
  onSelect?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
}

/**
 * Props for session list components
 */
export interface SessionListProps {
  sessions: Session[];
  currentSession: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onNewSession: () => void;
}

/**
 * Extended session props with therapeutic context
 */
export interface TherapeuticSessionProps extends SessionProps {
  messageCount?: number;
  lastActivity?: Date;
  progressNotes?: string;
  moodAssessment?: string;
}

// ============================================================================
// SETTINGS AND CONFIGURATION COMPONENTS
// ============================================================================

/**
 * AI model configuration props
 */
export interface ModelConfigProps {
  model: string;
  setModel: (model: string) => void;
  availableModels: ModelConfig[];
  isLoading?: boolean;
}

/**
 * API key management props
 */
export interface ApiKeyProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  hasEnvApiKey: boolean;
  isValidating?: boolean;
}

/**
 * AI parameters configuration props
 */
export interface AIParametersProps {
  temperature: number;
  setTemperature: (temp: number) => void;
  maxTokens: number;
  setMaxTokens: (tokens: number) => void;
  topP: number;
  setTopP: (topP: number) => void;
  browserSearchEnabled?: boolean;
  setBrowserSearchEnabled?: (enabled: boolean) => void;
  reasoningEffort?: 'low' | 'medium' | 'high';
  setReasoningEffort?: (effort: 'low' | 'medium' | 'high') => void;
}

/**
 * Complete chat settings props (combining all configuration)
 */
export interface ChatSettingsProps 
  extends ModelConfigProps, 
          ApiKeyProps, 
          AIParametersProps,
          ToggleComponentProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  onSave?: () => void;
  onReset?: () => void;
}

// ============================================================================
// UI AND LAYOUT COMPONENTS
// ============================================================================

/**
 * Responsive layout props
 */
export interface ResponsiveLayoutProps {
  isMobile: boolean;
  isTablet?: boolean;
  viewportHeight?: string;
  viewportWidth?: string;
}

/**
 * Sidebar component props
 */
export interface SidebarProps 
  extends ToggleComponentProps,
          ResponsiveLayoutProps,
          ContainerComponentProps {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  position?: 'left' | 'right';
  width?: string;
}

/**
 * Modal component props
 */
export interface ModalProps 
  extends ToggleComponentProps,
          ContainerComponentProps {
  title?: string;
  description?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Button with state props
 */
export interface ActionButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  loadingText?: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// AUTHENTICATION COMPONENTS
// ============================================================================

/**
 * Authentication status props
 */
export interface AuthStatusProps {
  isAuthenticated: boolean;
  needsSetup: boolean;
  needsVerification: boolean;
  isLoading: boolean;
  deviceName?: string;
}

/**
 * TOTP setup props
 */
export interface TOTPSetupProps {
  qrCodeUrl?: string;
  manualEntryKey?: string;
  backupCodes?: string[];
  onVerification: (token: string) => Promise<boolean>;
  onComplete: () => void;
}

/**
 * Authentication form props
 */
export interface AuthFormProps extends LoadingComponentProps, ErrorComponentProps {
  onSubmit: (data: any) => Promise<void>;
  submitText?: string;
  showBackupCodeInput?: boolean;
}

// ============================================================================
// CBT AND THERAPEUTIC TOOLS COMPONENTS
// ============================================================================

/**
 * CBT diary entry props
 */
export interface CBTDiaryProps {
  sessionId?: string;
  onSave: (entry: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

/**
 * Emotion scale props
 */
export interface EmotionScaleProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Therapeutic tool props
 */
export interface TherapeuticToolProps {
  sessionId?: string;
  toolType: 'cbt_diary' | 'mood_tracker' | 'thought_record' | 'progress_notes';
  onComplete: (data: any) => void;
  onCancel: () => void;
}

// ============================================================================
// REPORT AND ANALYTICS COMPONENTS
// ============================================================================

/**
 * Report generation props
 */
export interface ReportGenerationProps {
  sessionId: string;
  reportType: 'session_summary' | 'progress_report' | 'therapeutic_insights';
  onGenerate: () => Promise<void>;
  onSend?: (email: string) => Promise<void>;
  isGenerating: boolean;
}

/**
 * Session analytics props
 */
export interface SessionAnalyticsProps {
  sessionId: string;
  messageCount: number;
  duration?: number;
  keyInsights?: string[];
  moodProgression?: number[];
}

// ============================================================================
// COMPOSITE COMPONENT PROPS
// ============================================================================

/**
 * Main chat interface props (combining multiple concerns)
 */
export interface ChatInterfaceProps 
  extends SessionListProps,
          ChatSettingsProps,
          ResponsiveLayoutProps,
          MessageListProps {
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
  onStopGeneration?: () => void;
}

/**
 * Complete session sidebar props
 */
export interface SessionSidebarProps 
  extends SidebarProps,
          SessionListProps {
  loadMessages: (sessionId: string) => void;
  startNewSession: () => void;
}

/**
 * Settings panel props (complete configuration interface)
 */
export interface SettingsPanelProps extends ChatSettingsProps {
  // Additional therapeutic-specific settings
  enableTherapeuticMode?: boolean;
  setEnableTherapeuticMode?: (enabled: boolean) => void;
  sessionTimeout?: number;
  setSessionTimeout?: (timeout: number) => void;
}

// ============================================================================
// UTILITY TYPES FOR PROP COMPOSITION
// ============================================================================

/**
 * Extract handler props from component props
 */
export type HandlerProps<T> = {
  [K in keyof T as K extends `on${string}` ? K : never]: T[K];
};

/**
 * Extract state props from component props
 */
export type StateProps<T> = {
  [K in keyof T as K extends `is${string}` | `has${string}` | `show${string}` ? K : never]: T[K];
};

/**
 * Extract setter props from component props
 */
export type SetterProps<T> = {
  [K in keyof T as K extends `set${string}` ? K : never]: T[K];
};

/**
 * Make certain props optional for partial component updates
 */
export type PartialComponentProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Props with required handlers
 */
export type WithRequiredHandlers<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ============================================================================
// LEGACY SUPPORT (for backward compatibility)
// ============================================================================

/**
 * Legacy props interfaces (marked as deprecated, should be migrated)
 * @deprecated Use the new consolidated interfaces above
 */
export interface LegacyChatMessageProps extends MessageComponentProps {}

/**
 * @deprecated Use SessionSidebarProps instead
 */
export interface LegacySessionSidebarProps extends SessionSidebarProps {}

/**
 * @deprecated Use ChatSettingsProps instead  
 */
export interface LegacySettingsPanelProps extends SettingsPanelProps {}