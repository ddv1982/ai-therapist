/**
 * StreamingMessageWrapper - Simple streaming message diffusion effect
 * 
 * Provides smooth blur-to-reveal animation during AI response streaming.
 * 
 * Features:
 * - 3-stage animation: Blur → Stabilizing → Revealed
 * - Simple, reliable animation without complex monitoring
 * - Mobile optimization with reduced motion support
 * - Accessibility-compliant with proper ARIA states
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type {
  StreamingStage,
  AnimationPerformanceMode
} from '@/types/streaming';

interface StreamingMessageWrapperProps {
  content: string;
  isStreaming: boolean;
  isLastMessage: boolean;
  role: 'user' | 'assistant';
  children: React.ReactNode;
  className?: string;
  performanceMode?: AnimationPerformanceMode;
  animationDuration?: {
    blur?: number;
    stabilizing?: number;
    revealed?: number;
  };
  onStageChange?: (stage: StreamingStage) => void;
  onAnimationComplete?: (stage: StreamingStage) => void;
}

// Simple check if content should animate - no complex analysis needed
function shouldAnimateContent(content: string): boolean {
  return content.length > 50; // Simple threshold for animation
}

export function StreamingMessageWrapper({
  content,
  isStreaming,
  isLastMessage,
  role,
  children,
  className,
  onAnimationComplete,
  onStageChange,
  performanceMode = 'balanced',
  animationDuration
}: StreamingMessageWrapperProps) {
  const [currentStage, setCurrentStage] = useState<StreamingStage>('revealed');
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevContentRef = useRef<string>('');
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple animation trigger - no complex analysis
  useEffect(() => {
    const contentChanged = content !== prevContentRef.current;
    const shouldStartStreaming = isStreaming && isLastMessage && role === 'assistant' && contentChanged;
    
    if (shouldStartStreaming && content.length > 0) {
      // Simple check if we should animate
      const shouldUseAnimation = shouldAnimateContent(content);
      
      if (shouldUseAnimation) {
        setShouldAnimate(true);
        setCurrentStage('blur');
        onStageChange?.('blur');
        
        // Clear any existing timeout
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        
        // Get performance-adjusted durations
        const durations = {
          blur: animationDuration?.blur ?? (performanceMode === 'battery-saver' ? 400 : 600),
          stabilizing: animationDuration?.stabilizing ?? (performanceMode === 'battery-saver' ? 300 : 400),
        };
        
        // Simple 3-stage animation
        animationTimeoutRef.current = setTimeout(() => {
          setCurrentStage('stabilizing');
          onStageChange?.('stabilizing');
          onAnimationComplete?.('stabilizing');
          
          animationTimeoutRef.current = setTimeout(() => {
            setCurrentStage('revealed');
            setShouldAnimate(false);
            onStageChange?.('revealed');
            onAnimationComplete?.('revealed');
          }, durations.stabilizing);
        }, durations.blur);
      }
    }
    
    prevContentRef.current = content;
    
    // When streaming stops, ensure we're in revealed state
    if (!isStreaming && currentStage !== 'revealed') {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      setCurrentStage('revealed');
      setShouldAnimate(false);
      onStageChange?.('revealed');
      onAnimationComplete?.('revealed');
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [content, isStreaming, isLastMessage, role, currentStage, onAnimationComplete, onStageChange, performanceMode, animationDuration]);

  // Handle reduced motion preference
  const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // Skip animation if user prefers reduced motion 
  const shouldSkipAnimation = prefersReducedMotion();
  const effectiveStage = shouldSkipAnimation || !shouldAnimate ? 'revealed' : currentStage;

  // CSS classes for different animation stages
  const stageClasses = {
    blur: 'streaming-blur',
    stabilizing: 'streaming-stabilizing', 
    revealed: 'streaming-revealed'
  };

  return (
    <div
      className={cn(
        'streaming-message-wrapper',
        'transition-all duration-700 ease-out',
        stageClasses[effectiveStage],
        {
          'streaming-active': shouldAnimate,
        },
        className
      )}
      data-streaming-stage={effectiveStage}
      aria-busy={shouldAnimate}
      aria-live={isStreaming && isLastMessage ? 'polite' : 'off'}
    >
      {/* Main content with streaming effects applied */}
      <div className="streaming-content-container">
        {children}
      </div>
    </div>
  );
}

export default StreamingMessageWrapper;