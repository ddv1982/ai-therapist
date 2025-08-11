/**
 * Streaming animation stage definitions for therapeutic chat interface
 */

export type StreamingStage = 'blur' | 'stabilizing' | 'revealed';

export interface StreamingState {
  stage: StreamingStage;
  isStreamingComplete: boolean;
  hasComplexContent: boolean;
}

export interface StreamingConfig {
  enableAnimations: boolean;
  respectMotionPreferences: boolean;
  mobileOptimized: boolean;
}