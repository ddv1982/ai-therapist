/**
 * StreamingMessageWrapper - Sophisticated streaming message diffusion effect
 * 
 * Provides smooth blur-to-reveal animation that prevents layout bouncing/shifts
 * during AI response streaming, especially for complex markdown content and tables.
 * 
 * Features:
 * - 3-stage animation: Blur → Stabilizing → Revealed
 * - GPU-accelerated CSS transforms to prevent CLS (Cumulative Layout Shift)
 * - Smart detection of markdown tables and complex content
 * - Dimension pre-calculation for layout stability
 * - Mobile optimization with reduced motion support
 * - Accessibility-compliant with proper ARIA states
 */

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type {
  StreamingStage,
  StreamingMessageWrapperProps,
  ContentAnalysisResult,
  EstimatedDimensions,
  ContentComplexity,
  AnimationPerformanceMode
} from '@/types/streaming';

/**
 * Analyzes content complexity for streaming animation optimization
 */
function analyzeContent(content: string): ContentAnalysisResult {
  // Check for markdown tables (| characters in multiple lines)
  const tablePattern = /\|.*\|[\r\n]+\|.*\|/;
  const hasTable = tablePattern.test(content);
  
  // Check for multiple headings, lists, or code blocks
  const complexMarkdown = /#{1,6}\s|```|^\s*[\*\-\+]\s|^\s*\d+\.\s/m;
  const hasComplexMarkdown = complexMarkdown.test(content);
  
  // Count lines and characters
  const lineCount = content.split('\n').length;
  const characterCount = content.length;
  
  // Determine complexity level
  let complexity: ContentComplexity = 'simple';
  if (hasTable) {
    complexity = 'table';
  } else if (hasComplexMarkdown && characterCount > 500) {
    complexity = 'markdown-heavy';
  } else if (hasComplexMarkdown || characterCount > 200) {
    complexity = 'complex';
  }
  
  // Determine if animation should be applied
  const shouldAnimate = complexity !== 'simple' || characterCount > 100;
  
  return {
    hasTable,
    hasComplexMarkdown,
    lineCount,
    characterCount,
    complexity,
    shouldAnimate
  };
}

/**
 * Estimates dimensions for complex content to prevent layout shifts
 */
function estimateContentDimensions(content: string, analysis: ContentAnalysisResult): EstimatedDimensions {
  const { lineCount, hasTable } = analysis;
  
  // Base line height estimation
  let minHeight = lineCount * 24; // ~24px per line
  
  // Add extra space for tables
  if (hasTable) {
    const tableRows = (content.match(/\|.*\|/g) || []).length;
    minHeight += tableRows * 16; // Extra padding for table structure
  }
  
  // Add space for headings and lists
  const headings = (content.match(/#{1,6}\s/g) || []).length;
  minHeight += headings * 12; // Extra space for heading margins
  
  return {
    minHeight: Math.max(minHeight, 60), // Minimum reasonable height
    hasTable,
    tableRows: hasTable ? (content.match(/\|.*\|/g) || []).length : undefined,
    tableColumns: hasTable ? ((content.match(/\|[^|\n]*\|/g)?.[0]?.split('|').length ?? 2) - 2) : undefined
  };
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
  onContentAnalysis,
  performanceMode = 'balanced',
  animationDuration
}: StreamingMessageWrapperProps) {
  const [currentStage, setCurrentStage] = useState<StreamingStage>('revealed');
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysisResult | null>(null);
  const [dimensions, setDimensions] = useState<EstimatedDimensions | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevContentRef = useRef<string>('');
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect when streaming starts for this message
  useEffect(() => {
    const contentChanged = content !== prevContentRef.current;
    const shouldStartStreaming = isStreaming && isLastMessage && role === 'assistant' && contentChanged;
    
    if (shouldStartStreaming && content.length > 0) {
      // Analyze content complexity
      const analysis = analyzeContent(content);
      setContentAnalysis(analysis);
      onContentAnalysis?.(analysis);
      
      // Calculate dimensions for layout stability
      const estimatedDims = estimateContentDimensions(content, analysis);
      setDimensions(estimatedDims);
      
      // Determine if animation should be used
      const shouldUseAnimation = analysis.shouldAnimate;
      
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
          revealed: animationDuration?.revealed ?? (performanceMode === 'battery-saver' ? 200 : 300)
        };
        
        // Progress through animation stages
        animationTimeoutRef.current = setTimeout(() => {
          setCurrentStage('stabilizing');
          onStageChange?.('stabilizing');
          onAnimationComplete?.('stabilizing');
          
          animationTimeoutRef.current = setTimeout(() => {
            setCurrentStage('revealed');
            setShouldAnimate(false);
            onStageChange?.('revealed');
            onAnimationComplete?.('revealed');
          }, durations.stabilizing); // Stabilizing to revealed
        }, durations.blur); // Blur to stabilizing
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
  }, [content, isStreaming, isLastMessage, role, currentStage, onAnimationComplete, onStageChange, onContentAnalysis, performanceMode, animationDuration]);

  // Handle reduced motion preference
  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Skip animation if user prefers reduced motion or performance mode is battery-saver
  const shouldSkipAnimation = prefersReducedMotion() || performanceMode === 'battery-saver';
  const effectiveStage = shouldSkipAnimation || !shouldAnimate ? 'revealed' : currentStage;

  // Dynamic styles for smooth transitions
  const containerStyles: React.CSSProperties = {
    ...(dimensions?.minHeight && dimensions.minHeight > 0 && shouldAnimate && {
      minHeight: `${dimensions.minHeight}px`,
    }),
    ...(dimensions?.hasTable && shouldAnimate && {
      contain: 'layout style', // CSS containment for better performance
    })
  };

  // CSS classes for different animation stages
  const stageClasses = {
    blur: 'streaming-blur',
    stabilizing: 'streaming-stabilizing', 
    revealed: 'streaming-revealed'
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'streaming-message-wrapper',
        'transition-all duration-700 ease-out',
        stageClasses[effectiveStage],
        {
          'streaming-active': shouldAnimate,
          'streaming-table-content': dimensions?.hasTable,
          'streaming-complex-content': contentAnalysis?.complexity === 'complex' || contentAnalysis?.complexity === 'markdown-heavy',
          'streaming-table-content-active': contentAnalysis?.complexity === 'table',
          [`streaming-performance-${performanceMode}`]: true,
        },
        className
      )}
      style={containerStyles}
      data-streaming-stage={effectiveStage}
      data-content-length={content.length}
      data-content-complexity={contentAnalysis?.complexity}
      data-performance-mode={performanceMode}
      aria-busy={shouldAnimate}
      aria-live={isStreaming && isLastMessage ? 'polite' : 'off'}
    >
      {/* Optional loading overlay for heavy blur stage */}
      {shouldAnimate && effectiveStage === 'blur' && (
        <div className="streaming-overlay absolute inset-0 pointer-events-none z-10">
          <div className="streaming-pulse-indicator" />
        </div>
      )}
      
      {/* Main content with streaming effects applied */}
      <div
        className={cn(
          'streaming-content-container',
          'transform-gpu', // Force GPU acceleration
          {
            'will-change-transform': shouldAnimate,
            'streaming-preserve-3d': dimensions?.hasTable,
          }
        )}
      >
        {children}
      </div>
      
      {/* Invisible stabilizing layer for dimension calculation */}
      {shouldAnimate && dimensions?.hasTable && (
        <div 
          className="streaming-dimension-stabilizer absolute inset-0 opacity-0 pointer-events-none z-0"
          aria-hidden="true"
        >
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}
    </div>
  );
}

// Additional utility hook for streaming state management
export function useStreamingAnimation(
  content: string,
  isStreaming: boolean,
  isLastMessage: boolean,
  performanceMode: AnimationPerformanceMode = 'balanced'
) {
  const [animationState, setAnimationState] = useState<{
    stage: StreamingStage;
    isAnimating: boolean;
    contentComplexity: ContentComplexity;
    performanceMode: AnimationPerformanceMode;
  }>({
    stage: 'revealed',
    isAnimating: false,
    contentComplexity: 'simple',
    performanceMode
  });

  useEffect(() => {
    if (isStreaming && isLastMessage && content.length > 0) {
      const analysis = analyzeContent(content);
      
      setAnimationState({
        stage: 'blur',
        isAnimating: true,
        contentComplexity: analysis.complexity,
        performanceMode
      });
    } else if (!isStreaming) {
      setAnimationState(prev => ({
        ...prev,
        stage: 'revealed',
        isAnimating: false
      }));
    }
  }, [content, isStreaming, isLastMessage, performanceMode]);

  return animationState;
}

export default StreamingMessageWrapper;