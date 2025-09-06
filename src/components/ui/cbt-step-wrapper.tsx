/**
 * CBT STEP WRAPPER COMPONENT
 * =============================================================================
 * 
 * A reusable wrapper component that provides consistent layout, state management,
 * and navigation for all CBT chat components using a composition pattern.
 * 
 * This eliminates the need for each CBT component to manage its own:
 * - State management boilerplate
 * - Navigation controls
 * - Progress indicators
 * - Error handling
 * - Auto-save functionality
 * - Validation display
 * 
 * FEATURES:
 * - Consistent step-by-step flow
 * - Unified validation and error display
 * - Built-in navigation controls
 * - Progress tracking
 * - Auto-save with visual feedback
 * - Responsive design with mobile support
 * - Accessibility features
 */

'use client';

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils/utils';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import { logger } from '@/lib/utils/logger';
import { CBTStepType, CBTFormValidationError } from '@/types/therapy';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Clock,
  Brain,
  Heart,
  MessageCircle,
  Target,
  HelpCircle,
  Lightbulb,
  Users,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {useTranslations} from 'next-intl';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface CBTStepWrapperProps {
  // Step Configuration
  step: CBTStepType;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  
  // Content
  children: ReactNode;
  
  // Step Validation
  isValid?: boolean;
  validationErrors?: CBTFormValidationError[];
  customValidation?: () => CBTFormValidationError[];
  
  // Navigation Control
  canSkip?: boolean;
  hideNavigation?: boolean;
  nextButtonText?: string;
  previousButtonText?: string;
  onNext?: () => void | Promise<void>;
  onPrevious?: () => void | Promise<void>;
  onSkip?: () => void;
  
  // Step Behavior
  autoSave?: boolean;
  autoSaveDelay?: number;
  showProgress?: boolean;
  hideProgressBar?: boolean; // Hide internal progress when parent shows it
  allowPartialCompletion?: boolean;
  
  // Styling
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  
  // Accessibility
  ariaLabel?: string;
  helpText?: string;
}

// =============================================================================
// STEP ICONS CONFIGURATION
// =============================================================================

const STEP_ICONS: Record<CBTStepType, ReactNode> = {
  'situation': <MessageCircle className="w-5 h-5" />,
  'emotions': <Heart className="w-5 h-5" />,
  'final-emotions': <Heart className="w-5 h-5" />,
  'thoughts': <Brain className="w-5 h-5" />,
  'core-belief': <Target className="w-5 h-5" />,
  'challenge-questions': <HelpCircle className="w-5 h-5" />,
  'rational-thoughts': <Lightbulb className="w-5 h-5" />,
  'schema-modes': <Users className="w-5 h-5" />,
  'actions': <Activity className="w-5 h-5" />,
  'complete': <CheckCircle className="w-5 h-5" />
};

const STEP_COLORS: Record<CBTStepType, string> = {
  'situation': 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  'emotions': 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  'final-emotions': 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  'thoughts': 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
  'core-belief': 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
  'challenge-questions': 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
  'rational-thoughts': 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
  'schema-modes': 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300',
  'actions': 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
  'complete': 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
};

// =============================================================================
// STEP ORDER CONFIGURATION
// =============================================================================

const STEP_ORDER: CBTStepType[] = [
  'situation',
  'emotions', 
  'thoughts',
  'core-belief',
  'challenge-questions',
  'rational-thoughts',
  'schema-modes',
  'final-emotions',
  'actions'
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CBTStepWrapper({
  step,
  title,
  subtitle,
  icon,
  children,
  isValid: propIsValid,
  validationErrors: propValidationErrors,
  customValidation,
  canSkip = false,
  hideNavigation = false,
  nextButtonText,
  previousButtonText,
  onNext,
  onPrevious,
  onSkip,
  autoSave = true,
  showProgress = true,
  hideProgressBar = false,
  allowPartialCompletion = false,
  className,
  contentClassName,
  headerClassName,
  ariaLabel,
  helpText
}: CBTStepWrapperProps) {
  const t = useTranslations('cbt');
  
  // =============================================================================
  // HOOKS & STATE
  // =============================================================================
  
  const { 
    navigation, 
    validation, 
    status 
  } = useCBTDataManager();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================
  
  const currentStepIndex = STEP_ORDER.indexOf(step);
  const progressPercentage = showProgress ? ((currentStepIndex + 1) / STEP_ORDER.length) * 100 : 0;
  
  // Determine step validation state
  const stepValidationErrors = propValidationErrors !== undefined ? propValidationErrors :
    (customValidation ? customValidation() : []) ||
    validation.errors[step] ? [{ field: step, message: validation.errors[step] }] : [];
    
  const isStepValid = propIsValid ?? (
    stepValidationErrors.length === 0 && 
    (allowPartialCompletion || validation.isFormValid)
  );
  
  const stepIcon = icon || STEP_ICONS[step];
  const stepColorClass = STEP_COLORS[step];
  
  // Navigation state
  const canGoNext = navigation.canGoNext && (isStepValid || allowPartialCompletion);
  const canGoPrevious = navigation.canGoPrevious;
  
  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  
  const handleNext = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      if (onNext) {
        await onNext();
      } else {
        navigation.goNext();
      }
    } catch (error) {
      logger.error('Error in CBT step navigation forward', {
        component: 'CBTStepWrapper',
        operation: 'handleNext',
        step
      }, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsProcessing(false);
    }
  }, [onNext, navigation, step]);
  
  const handlePrevious = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      if (onPrevious) {
        await onPrevious();
      } else {
        navigation.goPrevious();
      }
    } catch (error) {
      logger.error('Error in CBT step navigation backward', {
        component: 'CBTStepWrapper',
        operation: 'handlePrevious',
        step
      }, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsProcessing(false);
    }
  }, [onPrevious, navigation, step]);
  
  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    } else {
      navigation.goNext();
    }
  }, [onSkip, navigation]);
  
  // =============================================================================
  // AUTO-SAVE EFFECT
  // =============================================================================
  
  useEffect(() => {
    if (autoSave && status.isDraftSaved) {
      setLastSaveTime(new Date());
    }
  }, [autoSave, status.isDraftSaved]);
  
  // =============================================================================
  // RENDER HELPERS
  // =============================================================================
  
  const renderProgressBar = () => {
    if (!showProgress || hideProgressBar) return null;
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {t('progress.step', { current: currentStepIndex + 1, total: STEP_ORDER.length })}
          </span>
          <span className="text-sm text-muted-foreground">
            {t('progress.complete', { percent: Math.round(progressPercentage) })}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    );
  };
  
  const renderStepHeader = () => (
    <div className={cn(
      "mb-3 p-2.5 rounded border",
      stepColorClass,
      headerClassName
    )}>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-shrink-0">
          {React.isValidElement(stepIcon)
            ? React.cloneElement(stepIcon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })
            : stepIcon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm opacity-80 mt-1">{subtitle}</p>
          )}
        </div>
        {isStepValid && (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        )}
      </div>
      
      {helpText && (
        <p className="text-sm opacity-70 mt-2">{helpText}</p>
      )}
    </div>
  );
  
  const renderValidationErrors = () => {
    if (stepValidationErrors.length === 0) return null;
    
    return (
      <Alert className="mb-4" variant="destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <AlertDescription className="ml-2">
          <div className="space-y-1 text-sm">
            {stepValidationErrors.map((error, index) => (
              <div key={index} className="font-medium">{error.message}</div>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  };
  
  const renderAutoSaveStatus = () => {
    if (!autoSave) return null;
    
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {status.isDraftSaved ? (
          <>
            <Save className="w-3 h-3" />
            <span>{t('status.saved')}</span>
            {lastSaveTime && (
              <span>{t('status.at', { time: lastSaveTime.toLocaleTimeString() })}</span>
            )}
          </>
        ) : (
          <>
            <Clock className="w-3 h-3 animate-pulse" />
            <span>{t('status.saving')}</span>
          </>
        )}
      </div>
    );
  };
  
  const renderNavigationControls = () => {
    if (hideNavigation) return null;
    
    return (
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <div className="flex items-center gap-2">
          {canGoPrevious && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {previousButtonText || t('nav.back')}
            </Button>
          )}
          
          {canSkip && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isProcessing}
              className="text-muted-foreground"
            >
              {t('nav.skip')}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {renderAutoSaveStatus()}
          
          {canGoNext && (
            <Button
              onClick={handleNext}
              disabled={isProcessing || (!isStepValid && !allowPartialCompletion)}
              className="flex items-center gap-2"
            >
              {nextButtonText || t('nav.next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // =============================================================================
  // MAIN RENDER
  // =============================================================================
  
  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg p-6 shadow-sm",
        className
      )}
      role="region"
      aria-label={ariaLabel || `CBT Step: ${title}`}
    >
      {renderProgressBar()}
      {renderStepHeader()}
      {renderValidationErrors()}
      
      <div className={cn("space-y-4", contentClassName)}>
        {children}
      </div>
      
      {renderNavigationControls()}
    </div>
  );
}

// =============================================================================
// STEP-SPECIFIC WRAPPER COMPONENTS
// =============================================================================

export function SituationStepWrapper(props: Omit<CBTStepWrapperProps, 'step' | 'title'>) {
  const t = useTranslations('cbt');
  return (
    <CBTStepWrapper
      step="situation"
      title={t('situation.title')}
      subtitle={t('situation.subtitle')}
      {...props}
    />
  );
}

export function EmotionStepWrapper(props: Omit<CBTStepWrapperProps, 'step' | 'title'>) {
  const t = useTranslations('cbt');
  return (
    <CBTStepWrapper
      step="emotions"
      title={t('emotions.title')}
      subtitle={t('emotions.subtitle')}
      {...props}
    />
  );
}

export function FinalEmotionStepWrapper(props: Omit<CBTStepWrapperProps, 'step' | 'title'>) {
  const t = useTranslations('cbt');
  return (
    <CBTStepWrapper
      step="final-emotions"
      title={t('emotions.titleNow')}
      subtitle={t('emotions.subtitleNow')}
      {...props}
    />
  );
}

export function ThoughtStepWrapper(props: Omit<CBTStepWrapperProps, 'step' | 'title'>) {
  const t = useTranslations('cbt');
  return (
    <CBTStepWrapper
      step="thoughts"
      title={t('thoughts.title')}
      subtitle={t('thoughts.subtitle')}
      {...props}
    />
  );
}

export function CoreBeliefStepWrapper(props: Omit<CBTStepWrapperProps, 'step' | 'title'>) {
  const t = useTranslations('cbt');
  return (
    <CBTStepWrapper
      step="core-belief"
      title={t('coreBelief.title')}
      subtitle={t('coreBelief.subtitle')}
      {...props}
    />
  );
}

export function ChallengeStepWrapper(props: Omit<CBTStepWrapperProps, 'step' | 'title'>) {
  const t = useTranslations('cbt');
  return (
    <CBTStepWrapper
      step="challenge-questions"
      title={t('challenge.title')}
      subtitle={t('challenge.subtitle')}
      {...props}
    />
  );
}

export function RationalStepWrapper(props: Omit<CBTStepWrapperProps, 'step' | 'title'>) {
  const t = useTranslations('cbt');
  return (
    <CBTStepWrapper
      step="rational-thoughts"
      title={t('rational.title')}
      subtitle={t('rational.subtitle')}
      {...props}
    />
  );
}

export function SchemaStepWrapper(props: Omit<CBTStepWrapperProps, 'step' | 'title'>) {
  const t = useTranslations('cbt');
  return (
    <CBTStepWrapper
      step="schema-modes"
      title={t('schema.title')}
      subtitle={t('schema.subtitle')}
      {...props}
    />
  );
}

export function ActionStepWrapper(props: Omit<CBTStepWrapperProps, 'step' | 'title'>) {
  const t = useTranslations('cbt');
  return (
    <CBTStepWrapper
      step="actions"
      title={t('actionPlan.title')}
      subtitle={t('actionPlan.subtitle')}
      {...props}
    />
  );
}

// =============================================================================
// COMPOUND COMPONENT PATTERN
// =============================================================================

CBTStepWrapper.Situation = SituationStepWrapper;
CBTStepWrapper.Emotion = EmotionStepWrapper;
CBTStepWrapper.FinalEmotion = FinalEmotionStepWrapper;
CBTStepWrapper.Thought = ThoughtStepWrapper;
CBTStepWrapper.CoreBelief = CoreBeliefStepWrapper;
CBTStepWrapper.Challenge = ChallengeStepWrapper;
CBTStepWrapper.Rational = RationalStepWrapper;
CBTStepWrapper.Schema = SchemaStepWrapper;
CBTStepWrapper.Action = ActionStepWrapper;

export default CBTStepWrapper;
