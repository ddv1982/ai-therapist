import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react';
import type { BuilderState, ObsessionFormState, CompulsionFormState } from './types';
import { ObsessionForm } from './obsession-form';
import { CompulsionForm } from './compulsion-form';

interface ObsessionBuilderProps {
  builderState: BuilderState;
  obsessionForm: ObsessionFormState;
  compulsionForm: CompulsionFormState;
  errors: Record<string, string>;
  isSaving: boolean;
  onObsessionChange: (updater: (prev: ObsessionFormState) => ObsessionFormState) => void;
  onCompulsionChange: (updater: (prev: CompulsionFormState) => CompulsionFormState) => void;
  onSetStep: (step: BuilderState['step']) => void;
  onCancel: () => void;
  onSavePair: () => void;
  onNext: () => void;
  text: {
    obsessionStepTitle: string;
    obsessionStepSubtitle: string;
    compulsionStepTitle: string;
    compulsionStepSubtitle: string;
    continueLabel: string;
    backLabel: string;
    cancelLabel: string;
    savePair: string;
    updatePair: string;
    intensityLabel: string;
    triggersPlaceholder: string;
    obsessionPlaceholder: string;
    frequencyLabel: string;
    durationLabel: string;
    reliefLabel: string;
    durationUnit: string;
    compulsionPlaceholder: string;
  };
}

export function ObsessionBuilder({
  builderState,
  obsessionForm,
  compulsionForm,
  errors,
  isSaving,
  onObsessionChange,
  onCompulsionChange,
  onSetStep,
  onCancel,
  onSavePair,
  onNext,
  text,
}: ObsessionBuilderProps) {
  const isObsessionStep = builderState.step === 'obsession';
  const isEdit = builderState.mode === 'edit';
  const stepTitle = isObsessionStep ? text.obsessionStepTitle : text.compulsionStepTitle;
  const stepSubtitle = isObsessionStep ? text.obsessionStepSubtitle : text.compulsionStepSubtitle;

  const formContent = isObsessionStep ? (
    <ObsessionForm
      form={obsessionForm}
      errors={errors}
      onChange={onObsessionChange}
      intensityLabel={text.intensityLabel}
      triggersPlaceholder={text.triggersPlaceholder}
      descriptionPlaceholder={text.obsessionPlaceholder}
    />
  ) : (
    <CompulsionForm
      form={compulsionForm}
      errors={errors}
      onChange={onCompulsionChange}
      frequencyLabel={text.frequencyLabel}
      durationLabel={text.durationLabel}
      reliefLabel={text.reliefLabel}
      durationUnit={text.durationUnit}
      descriptionPlaceholder={text.compulsionPlaceholder}
    />
  );

  const primaryLabel = isObsessionStep
    ? text.continueLabel
    : isEdit
      ? text.updatePair
      : text.savePair;
  const PrimaryIcon = isObsessionStep ? ArrowRight : isSaving ? Loader2 : Save;
  const primaryIconClass = isSaving && !isObsessionStep ? 'h-4 w-4 animate-spin' : 'h-4 w-4';
  const primaryAction = isObsessionStep ? onNext : onSavePair;

  const secondaryLabel = isObsessionStep ? text.cancelLabel : text.backLabel;
  const secondaryAction = isObsessionStep ? onCancel : () => onSetStep('obsession');

  return (
    <Card className="border-primary/20 bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {stepTitle}
            </span>
            {isEdit && (
              <span className="text-muted-foreground rounded border px-2 py-0.5 text-xs">
                {text.updatePair}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{stepSubtitle}</p>
        </div>
      </div>

      <div className="space-y-6">
        {formContent}

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={secondaryAction} disabled={isSaving}>
            {!isObsessionStep && <ArrowLeft className="mr-1 h-4 w-4" />}
            {secondaryLabel}
          </Button>

          <Button
            size="sm"
            onClick={primaryAction}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <span>{primaryLabel}</span>
            <PrimaryIcon className={primaryIconClass} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
