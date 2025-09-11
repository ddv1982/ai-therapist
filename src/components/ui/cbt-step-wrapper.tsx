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
  'situation': <MessageCircle className="w-6 h-6" />,
  'emotions': <Heart className="w-6 h-6" />,
  'final-emotions': <Heart className="w-6 h-6" />,
  'thoughts': <Brain className="w-6 h-6" />,
  'core-belief': <Target className="w-6 h-6" />,
  'challenge-questions': <HelpCircle className="w-6 h-6" />,
  'rational-thoughts': <Lightbulb className="w-6 h-6" />,
  'schema-modes': <Users className="w-6 h-6" />,
  'actions': <Activity className="w-6 h-6" />,
  'complete': <CheckCircle className="w-6 h-6" />
};

const STEP_COLORS: Record<CBTStepType, string> = {
  'situation': 'bg-muted/50 border-border/50 text-foreground',
  'emotions': 'bg-muted/50 border-border/50 text-foreground',
  'final-emotions': 'bg-muted/50 border-border/50 text-foreground',
  'thoughts': 'bg-muted/50 border-border/50 text-foreground',
  'core-belief': 'bg-muted/50 border-border/50 text-foreground',
  'challenge-questions': 'bg-muted/50 border-border/50 text-foreground',
  'rational-thoughts': 'bg-muted/50 border-border/50 text-foreground',
  'schema-modes': 'bg-muted/50 border-border/50 text-foreground',
  'actions': 'bg-muted/50 border-border/50 text-foreground',
  'complete': 'bg-accent/10 border-primary/30 text-foreground'
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
      "mb-3 p-3 rounded border",
      stepColorClass,
      headerClassName
    )}>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-shrink-0">
          {React.isValidElement(stepIcon)
            ? React.cloneElement(stepIcon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })
            : stepIcon}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm opacity-80 mt-1">{subtitle}</p>
          )}
        </div>
        {isStepValid && (
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
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
              <div key={index} className="font-semibold">{error.message}</div>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  };
  
  const renderAutoSaveStatus = () => {
    if (!autoSave) return null;
    
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground autosave">
        {status.isDraftSaved ? (
          <>
            <Save className="w-3 h-3" />
            <span>{t('status.saved')}</span>
            {lastSaveTime && (
              <span className="hidden md:inline">{t('status.at', { time: lastSaveTime.toLocaleTimeString() })}</span>
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
      <div className="pt-6 border-t border-border sticky-footer">
        <div className="flex items-center justify-between nav-container">
          <div className="flex items-center gap-2 nav-left">
            {canGoPrevious && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isProcessing}
                className="flex items-center gap-2 h-12"
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
                className="text-muted-foreground h-12"
              >
                {t('nav.skip')}
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3 nav-right">
            <div className="autosave flex items-center">
              {renderAutoSaveStatus()}
            </div>
            {canGoNext && (
              <Button
                onClick={handleNext}
                disabled={isProcessing || (!isStepValid && !allowPartialCompletion)}
                className="flex items-center gap-2 h-12"
              >
                {nextButtonText || t('nav.next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
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
        "bg-card rounded-lg p-6 shadow-sm",
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
