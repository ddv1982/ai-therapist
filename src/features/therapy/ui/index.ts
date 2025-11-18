/**
 * Therapeutic UI Components
 * Specialized components designed for therapeutic and mental health applications
 * Built on modern shadcn/ui patterns with 8pt grid system
 */

// Specialized therapeutic components
export * from './therapy-card';
export * from './progress-indicator';

// Re-export commonly used types
export type { TherapyCardProps } from './therapy-card';
export type { ProgressIndicatorProps, ProgressStep } from './progress-indicator';

// EmotionSlider merged into unified TherapySlider component
