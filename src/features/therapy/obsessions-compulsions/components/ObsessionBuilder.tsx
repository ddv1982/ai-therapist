import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react';
import type { BuilderState, ObsessionFormState, CompulsionFormState } from './types';
import { ObsessionForm } from './ObsessionForm';
import { CompulsionForm } from './CompulsionForm';

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

  return (
    <Card className="p-5 border-primary/20 bg-card">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isObsessionStep ? text.obsessionStepTitle : text.compulsionStepTitle}
            </span>
            {isEdit && (
              <span className="rounded border px-2 py-0.5 text-xs text-muted-foreground">
                {text.updatePair}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isObsessionStep ? text.obsessionStepSubtitle : text.compulsionStepSubtitle}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {isObsessionStep ? (
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
        )}

        <div className="flex items-center justify-between">
          {isObsessionStep ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              {text.cancelLabel}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetStep('obsession')}
              disabled={isSaving}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {text.backLabel}
            </Button>
          )}

          <Button
            size="sm"
            onClick={isObsessionStep ? onNext : onSavePair}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isObsessionStep ? (
              <>
                <span>{text.continueLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>{isEdit ? text.updatePair : text.savePair}</span>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
