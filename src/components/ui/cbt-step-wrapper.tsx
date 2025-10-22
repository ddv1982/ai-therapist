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
import { useTranslations } from 'next-intl';
import {
  MessageCircle,
  Heart,
  Brain,
  Target,
  HelpCircle,
  Lightbulb,
  Users,
  Activity,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import { CBT_STEP_CONFIG } from '@/features/therapy/cbt/flow';
import { CBT_STEPS, getStepInfo } from '@/features/therapy/cbt/utils/step-mapping';
import type { CBTStepType, CBTFormValidationError } from '@/types/therapy';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface CBTStepWrapperProps {
  // Step Configuration
  step: CBTStepType;
  title?: string;
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
  onNavigateStep?: (step: CBTStepType) => void;
  
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
  situation: <MessageCircle className="w-6 h-6" />,
  emotions: <Heart className="w-6 h-6" />,
  'final-emotions': <Heart className="w-6 h-6" />,
  thoughts: <Brain className="w-6 h-6" />,
  'core-belief': <Target className="w-6 h-6" />,
  'challenge-questions': <HelpCircle className="w-6 h-6" />,
  'rational-thoughts': <Lightbulb className="w-6 h-6" />,
  'schema-modes': <Users className="w-6 h-6" />,
  actions: <Activity className="w-6 h-6" />,
  complete: <CheckCircle className="w-6 h-6" />,
};

const STEP_COLORS: Record<CBTStepType, string> = {
  situation: 'bg-muted/50 border-border/50 text-foreground',
  emotions: 'bg-muted/50 border-border/50 text-foreground',
  'final-emotions': 'bg-muted/50 border-border/50 text-foreground',
  thoughts: 'bg-muted/50 border-border/50 text-foreground',
  'core-belief': 'bg-muted/50 border-border/50 text-foreground',
  'challenge-questions': 'bg-muted/50 border-border/50 text-foreground',
  'rational-thoughts': 'bg-muted/50 border-border/50 text-foreground',
  'schema-modes': 'bg-muted/50 border-border/50 text-foreground',
  actions: 'bg-muted/50 border-border/50 text-foreground',
  complete: 'bg-accent/10 border-primary/30 text-foreground',
};

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
  helpText,
  onNavigateStep,
}: CBTStepWrapperProps) {
  const t = useTranslations('cbt');

  const { navigation, validation, status } = useCBTDataManager();

  const stepConfig =
    step !== 'complete' ? CBT_STEP_CONFIG[step as keyof typeof CBT_STEP_CONFIG] : undefined;
  const resolvedTitle = title ??
    (stepConfig
      ? (t(stepConfig.metadata.title.translationKey as Parameters<typeof t>[0], {
          default: stepConfig.metadata.title.defaultText,
        }) as string)
      : t('complete.title'));
  const resolvedSubtitle = subtitle ??
    (stepConfig?.metadata.subtitle
      ? (t(stepConfig.metadata.subtitle.translationKey as Parameters<typeof t>[0], {
          default: stepConfig.metadata.subtitle.defaultText,
        }) as string)
      : undefined);
  const resolvedHelpText = helpText ??
    (stepConfig?.metadata.helpText
      ? (t(stepConfig.metadata.helpText.translationKey as Parameters<typeof t>[0], {
          default: stepConfig.metadata.helpText.defaultText,
        }) as string)
      : undefined);

  const [isProcessing, setIsProcessing] = useState(false);

  const { stepNumber, totalSteps } =
    step === 'complete'
      ? { stepNumber: CBT_STEPS.length, totalSteps: CBT_STEPS.length }
      : getStepInfo(step);
  const progressPercentage = showProgress ? (stepNumber / totalSteps) * 100 : 0;

  let stepValidationErrors: CBTFormValidationError[] = [];
  if (propValidationErrors) {
    stepValidationErrors = propValidationErrors;
  } else if (typeof customValidation === 'function') {
    stepValidationErrors = customValidation() || [];
  } else if (validation.errors[step]) {
    stepValidationErrors = [{ field: step, message: validation.errors[step] }];
  }

  const isStepValid =
    propIsValid ?? (stepValidationErrors.length === 0 && (!validation.errors[step] || allowPartialCompletion));

  const handleNavigation = useCallback(
    async (action: 'next' | 'previous' | 'skip') => {
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        if (action === 'next') {
          if (!isStepValid) {
            logger.warn('Attempted to advance with invalid step', { step });
            return;
          }
          await onNext?.();
          navigation.goNext();
        } else if (action === 'previous') {
          await onPrevious?.();
          // Keep Redux progress in sync when possible
          if (navigation.canGoPrevious) {
            navigation.goPrevious();
          }
          // Always inform parent to navigate the flow engine if a previous step exists
          if (onNavigateStep && step !== 'complete') {
            const stepIndex = CBT_STEPS.indexOf(step as Exclude<CBTStepType, 'complete'>);
            if (stepIndex > 0) {
              const previousStep = CBT_STEPS[stepIndex - 1];
              onNavigateStep(previousStep);
            }
          }
        } else if (action === 'skip') {
          onSkip?.();
          navigation.goNext();
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, isStepValid, navigation, onNext, onPrevious, onSkip, onNavigateStep, step],
  );

  useEffect(() => {
    if (!autoSave) return;
    const timer = setTimeout(() => {
      if (status.progress) {
        logger.debug?.('Auto-save tick', { step });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [autoSave, status.progress, step]);

  const renderProgress = () => {
    if (!showProgress || hideProgressBar) return null;
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {stepNumber}/{totalSteps}
        </span>
      </div>
    );
  };

  const renderValidation = () => {
    if (isStepValid || stepValidationErrors.length === 0) return null;
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <ul className="space-y-1 text-sm">
            {stepValidationErrors.map((error) => (
              <li key={error.field}>{error.message}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  const renderNavigation = () => {
    if (hideNavigation) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {t('progress.status', {
              step: stepNumber,
              total: totalSteps,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('previous')}
            disabled={isProcessing || stepNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          {previousButtonText ?? (t('nav.back', { default: 'Back' }) as string)}
          </Button>
          {canSkip && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation('skip')}
              disabled={isProcessing}
            >
            {t('nav.skip', { default: 'Skip' })}
            </Button>
          )}
          <Button
            type="button"
            onClick={() => handleNavigation('next')}
            disabled={isProcessing || (!allowPartialCompletion && !isStepValid)}
          >
          {nextButtonText ?? (t('nav.next', { default: 'Continue' }) as string)}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const resolvedIcon = icon ?? STEP_ICONS[step];
  const headerStyle = cn(
    'flex flex-col gap-2 rounded-xl border px-4 py-3 transition-colors sm:flex-row sm:items-start sm:justify-between',
    STEP_COLORS[step],
    headerClassName,
  );

  return (
    <section className={cn('space-y-5', className)} aria-label={ariaLabel}>
      <header className={headerStyle}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-background/80 p-2 shadow-sm">
            {resolvedIcon}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{resolvedTitle}</h2>
            {resolvedSubtitle ? (
              <p className="text-sm text-muted-foreground">{resolvedSubtitle}</p>
            ) : null}
            {resolvedHelpText ? (
              <p className="text-xs text-muted-foreground/80">{resolvedHelpText}</p>
            ) : null}
          </div>
        </div>
        {renderProgress()}
      </header>

      {renderValidation()}

      <div className={cn('rounded-2xl border border-muted/30 bg-card/80 p-5 shadow-sm', contentClassName)}>
        {children}
      </div>

      {renderNavigation()}
    </section>
  );
}
