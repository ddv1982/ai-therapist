'use client';

import React from 'react';
import { useForm, Controller, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cbtRHFSchema, type CBTFormInput } from './cbt-form-schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { EmotionData } from '@/types/therapy';

interface CBTFormProps {
  onSubmit: (data: CBTFormInput) => void;
  defaultValues?: Partial<CBTFormInput>;
  onDraftChange?: (data: CBTFormInput) => void;
}

export function CBTForm({ onSubmit, defaultValues, onDraftChange }: CBTFormProps) {
  const form = useForm<CBTFormInput>({
    resolver: zodResolver(cbtRHFSchema) as unknown as Resolver<CBTFormInput>,
    mode: 'onChange',
    defaultValues: defaultValues || {
      date: new Date().toISOString().split('T')[0],
      situation: '',
      initialEmotions: {
        fear: 0,
        anger: 0,
        sadness: 0,
        joy: 0,
        anxiety: 0,
        shame: 0,
        guilt: 0,
      },
      finalEmotions: {
        fear: 0,
        anger: 0,
        sadness: 0,
        joy: 0,
        anxiety: 0,
        shame: 0,
        guilt: 0,
      },
      automaticThoughts: [{ thought: '', credibility: 5 }],
      coreBeliefText: '',
      coreBeliefCredibility: 5,
      challengeQuestions: [],
      rationalThoughts: [],
      schemaModes: [],
    },
  });

  const { control, handleSubmit, formState } = form;
  const current = useWatch({ control });

  // Redux auto-save integration
  const { sessionActions } = useCBTDataManager({
    autoSaveDelay: 600, // Match the original debounce timing
    enableValidation: false // Disable validation to avoid conflicts with RHF
  });

  // Auto-save to Redux on form changes
  React.useEffect(() => {
    // Convert RHF form data to Redux-compatible format and update session
    if (current?.situation) {
      sessionActions.updateSituation({
        situation: current.situation,
        date: current.date || new Date().toISOString().split('T')[0]
      });
    }

    if (current?.initialEmotions) {
      sessionActions.updateEmotions(current.initialEmotions as EmotionData);
    }

    if (onDraftChange) {
      onDraftChange(current as CBTFormInput);
    }
  }, [current, sessionActions, onDraftChange]);

  const isSituationValid = (String(current?.situation || '').trim().length) >= 5;

  return (
    <Card className="p-4 space-y-6">
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-6">
        <div>
          <label className="text-sm font-semibold" htmlFor="situation-input">
            Situation
          </label>
          <Controller
            control={control}
            name="situation"
            render={({ field }) => (
              <Textarea
                {...field}
                id="situation-input"
                placeholder="Describe the situation..."
                className="mt-2"
                aria-invalid={!!formState.errors.situation}
                aria-describedby={formState.errors.situation ? 'situation-error' : undefined}
                onChange={(e) => {
                  field.onChange(e);
                }}
              />
            )}
          />
          {formState.errors.situation?.message && (
            <p id="situation-error" className="text-sm text-red-600 mt-1" role="alert">
              {String(formState.errors.situation.message)}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold">Initial emotions</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
            {(['fear','anger','sadness','joy','anxiety','shame','guilt'] as const).map((emotion) => (
              <Controller
                key={emotion}
                control={control}
                name={`initialEmotions.${emotion}` as const}
                render={({ field }) => (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="capitalize">{emotion}</span>
                      <span>{field.value}</span>
                    </div>
                    <Slider value={[Number(field.value ?? 0)]} max={10} step={1} onValueChange={(v) => field.onChange(v[0])} />
                  </div>
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={!isSituationValid}>Save Draft</Button>
        </div>
      </form>
    </Card>
  );
}
