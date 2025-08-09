/**
 * TypeScript definitions for streaming message diffusion system
 * 
 * Provides comprehensive type safety for the streaming animation states,
 * content complexity detection, and integration with the therapeutic AI chat system.
 */

// Core streaming animation stages
export type StreamingStage = 'blur' | 'stabilizing' | 'revealed';

// Content complexity levels for animation optimization
export type ContentComplexity = 'simple' | 'complex' | 'table' | 'markdown-heavy';

// Animation performance modes
export type AnimationPerformanceMode = 'high' | 'balanced' | 'battery-saver';

// Streaming animation state interface
export interface StreamingAnimationState {
  /** Current animation stage */
  stage: StreamingStage;
  /** Whether animation is currently active */
  isAnimating: boolean;
  /** Content complexity level */
  contentComplexity: ContentComplexity;
  /** Performance mode for mobile optimization */
  performanceMode: AnimationPerformanceMode;
  /** Animation start timestamp */
  startTime?: number;
  /** Total animation duration (ms) */
  duration?: number;
}

// Content analysis result for streaming optimization
export interface ContentAnalysisResult {
  /** Whether content contains markdown tables */
  hasTable: boolean;
  /** Whether content has complex markdown structures */
  hasComplexMarkdown: boolean;
  /** Estimated content lines */
  lineCount: number;
  /** Content length in characters */
  characterCount: number;
  /** Recommended complexity level */
  complexity: ContentComplexity;
  /** Whether streaming animation should be applied */
  shouldAnimate: boolean;
}

// Dimension estimation for layout stability
export interface EstimatedDimensions {
  /** Minimum estimated height in pixels */
  minHeight: number;
  /** Minimum estimated width in pixels */
  minWidth?: number;
  /** Whether content contains tables */
  hasTable: boolean;
  /** Number of estimated table rows */
  tableRows?: number;
  /** Number of estimated table columns */
  tableColumns?: number;
}

// Streaming message wrapper props interface
export interface StreamingMessageWrapperProps {
  /** The message content being streamed */
  content: string;
  /** Whether streaming is currently active */
  isStreaming: boolean;
  /** Whether this is the last message (actively being streamed) */
  isLastMessage: boolean;
  /** Message role for styling context */
  role: 'user' | 'assistant';
  /** Children to wrap with streaming effect */
  children: React.ReactNode;
  /** Optional className override */
  className?: string;
  /** Animation performance mode */
  performanceMode?: AnimationPerformanceMode;
  /** Custom animation duration overrides */
  animationDuration?: {
    blur?: number;
    stabilizing?: number;
    revealed?: number;
  };
  /** Callback when animation stage changes */
  onStageChange?: (stage: StreamingStage) => void;
  /** Callback when animation completes */
  onAnimationComplete?: (stage: StreamingStage) => void;
  /** Callback for content analysis results */
  onContentAnalysis?: (analysis: ContentAnalysisResult) => void;
}

// Animation configuration interface
export interface StreamingAnimationConfig {
  /** Enable/disable streaming animations */
  enabled: boolean;
  /** Respect user's reduced motion preference */
  respectReducedMotion: boolean;
  /** Performance mode */
  performanceMode: AnimationPerformanceMode;
  /** Minimum content length to trigger animation */
  minContentLength: number;
  /** Animation duration settings */
  durations: {
    blur: number;
    stabilizing: number;
    revealed: number;
  };
  /** Content thresholds for complexity detection */
  complexityThresholds: {
    simpleContent: number;
    complexContent: number;
    heavyContent: number;
  };
}

// Streaming context for React context provider
export interface StreamingContext {
  /** Global animation configuration */
  config: StreamingAnimationConfig;
  /** Update animation configuration */
  updateConfig: (config: Partial<StreamingAnimationConfig>) => void;
  /** Current performance mode */
  performanceMode: AnimationPerformanceMode;
  /** Set performance mode */
  setPerformanceMode: (mode: AnimationPerformanceMode) => void;
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;
}

// Hook return type for streaming animation state management
export interface UseStreamingAnimationReturn {
  /** Current animation state */
  animationState: StreamingAnimationState;
  /** Content analysis result */
  contentAnalysis: ContentAnalysisResult;
  /** Estimated dimensions for layout stability */
  estimatedDimensions: EstimatedDimensions;
  /** Whether animation should be applied */
  shouldAnimate: boolean;
  /** Performance-optimized animation configuration */
  effectiveConfig: StreamingAnimationConfig;
}

// Mobile-specific streaming optimizations
export interface MobileStreamingOptimizations {
  /** Reduce animation intensity on mobile */
  reduceAnimationIntensity: boolean;
  /** Faster animation durations for mobile */
  useFasterDurations: boolean;
  /** Disable complex animations on low-end devices */
  disableComplexAnimations: boolean;
  /** Use battery-saver mode automatically */
  autoBatterySaver: boolean;
}

// Accessibility streaming configuration
export interface AccessibilityStreamingConfig {
  /** Respect prefers-reduced-motion */
  respectReducedMotion: boolean;
  /** Provide ARIA live region updates */
  ariaLiveUpdates: boolean;
  /** Announce animation state changes */
  announceStateChanges: boolean;
  /** Focus management during streaming */
  manageFocus: boolean;
}

// Performance metrics for streaming animations
export interface StreamingPerformanceMetrics {
  /** Animation frame rate */
  frameRate: number;
  /** Memory usage during animation */
  memoryUsage: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** Battery impact level */
  batteryImpact: 'low' | 'medium' | 'high';
  /** User device performance tier */
  deviceTier: 'low' | 'mid' | 'high';
}

// Events emitted by streaming system
export interface StreamingEvents {
  /** Animation started */
  'streaming:started': { messageId: string; stage: StreamingStage };
  /** Animation stage changed */
  'streaming:stage-changed': { messageId: string; stage: StreamingStage; previousStage: StreamingStage };
  /** Animation completed */
  'streaming:completed': { messageId: string; duration: number };
  /** Performance mode changed */
  'streaming:performance-mode-changed': { previousMode: AnimationPerformanceMode; newMode: AnimationPerformanceMode };
  /** Content analysis completed */
  'streaming:content-analyzed': { messageId: string; analysis: ContentAnalysisResult };
}

// Default configuration values
export const DEFAULT_STREAMING_CONFIG: StreamingAnimationConfig = {
  enabled: true,
  respectReducedMotion: true,
  performanceMode: 'balanced',
  minContentLength: 100,
  durations: {
    blur: 600,
    stabilizing: 400,
    revealed: 300,
  },
  complexityThresholds: {
    simpleContent: 200,
    complexContent: 500,
    heavyContent: 1000,
  },
};

// Mobile performance optimizations
export const MOBILE_STREAMING_CONFIG: Partial<StreamingAnimationConfig> = {
  performanceMode: 'battery-saver',
  durations: {
    blur: 400,
    stabilizing: 300,
    revealed: 200,
  },
};

// High performance mode configuration
export const HIGH_PERFORMANCE_CONFIG: Partial<StreamingAnimationConfig> = {
  performanceMode: 'high',
  durations: {
    blur: 800,
    stabilizing: 500,
    revealed: 400,
  },
};

// Type guards and utility functions
export function isValidStreamingStage(stage: string): stage is StreamingStage {
  return ['blur', 'stabilizing', 'revealed'].includes(stage);
}

export function isValidContentComplexity(complexity: string): complexity is ContentComplexity {
  return ['simple', 'complex', 'table', 'markdown-heavy'].includes(complexity);
}

export function isValidPerformanceMode(mode: string): mode is AnimationPerformanceMode {
  return ['high', 'balanced', 'battery-saver'].includes(mode);
}

// Base message interface for streaming system
export interface BaseMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Streaming system integration with existing chat types
export interface ChatMessageWithStreaming extends BaseMessage {
  /** Streaming animation state */
  streamingState?: StreamingAnimationState;
  /** Content analysis result */
  contentAnalysis?: ContentAnalysisResult;
  /** Whether this message is currently being animated */
  isAnimating?: boolean;
}

// Extended chat state with streaming support
export interface ChatStateWithStreaming {
  messages: ChatMessageWithStreaming[];
  isStreaming: boolean;
  currentMessage: string;
  streamingConfig: StreamingAnimationConfig;
  globalStreamingState: {
    activeAnimations: Map<string, StreamingAnimationState>;
    performanceMetrics: StreamingPerformanceMetrics;
  };
}