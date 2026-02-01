'use client';

import { useEffect, useActionState, useCallback } from 'react';
import { useForm, Controller, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cbtRHFSchema, type CBTFormInput } from './cbt-form-schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
import type { EmotionData } from '@/types';
import { Loader2 } from 'lucide-react';

type CBTFormState = {
  message: string;
  errors?: {
    situation?: string[];
    initialEmotions?: string[];
    _form?: string[];
  };
  success?: boolean;
};

const initialFormState: CBTFormState = { message: '' };

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

  const { control, formState, getValues } = form;
  const current = useWatch({ control });

  // Redux auto-save integration
  const { sessionActions } = useCBTDataManager({
    autoSaveDelay: 600, // Match the original debounce timing
    enableValidation: false, // Disable validation to avoid conflicts with RHF
  });

  // Form action for useActionState
  const formAction = useCallback(
    async (_prevState: CBTFormState, _formData: FormData): Promise<CBTFormState> => {
      try {
        // Validate with RHF first
        const isValid = await form.trigger();
        if (!isValid) {
          const errors: CBTFormState['errors'] = {};
          if (formState.errors.situation?.message) {
            errors.situation = [String(formState.errors.situation.message)];
          }
          return {
            message: 'Please fix the validation errors.',
            errors,
            success: false,
          };
        }

        // Get validated data and submit
        const data = getValues();
        onSubmit(data);
        return { message: 'Draft saved successfully.', success: true };
      } catch (error) {
        return {
          message: error instanceof Error ? error.message : 'An error occurred.',
          errors: { _form: ['Failed to save draft. Please try again.'] },
          success: false,
        };
      }
    },
    [form, formState.errors, getValues, onSubmit]
  );

  const [state, submitAction, isPending] = useActionState(formAction, initialFormState);

  // Auto-save to Redux on form changes
  useEffect(() => {
    // Convert RHF form data to Redux-compatible format and update session
    if (current?.situation) {
      sessionActions.updateSituation({
        situation: current.situation,
        date: current.date || new Date().toISOString().split('T')[0],
      });
    }

    if (current?.initialEmotions) {
      sessionActions.updateEmotions(current.initialEmotions as EmotionData);
    }

    if (onDraftChange) {
      onDraftChange(current as CBTFormInput);
    }
  }, [current, sessionActions, onDraftChange]);

  const isSituationValid = String(current?.situation || '').trim().length >= 5;

  return (
    <Card className="space-y-6 p-4">
      <form action={submitAction} className="space-y-6">
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
                aria-invalid={!!formState.errors.situation || !!state.errors?.situation}
                aria-describedby={
                  formState.errors.situation || state.errors?.situation
                    ? 'situation-error'
                    : undefined
                }
                onChange={(e) => {
                  field.onChange(e);
                }}
              />
            )}
          />
          {(formState.errors.situation?.message || state.errors?.situation) && (
            <p id="situation-error" className="text-destructive mt-1 text-sm" role="alert">
              {String(formState.errors.situation?.message || state.errors?.situation?.[0])}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold">Initial emotions</label>
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(['fear', 'anger', 'sadness', 'joy', 'anxiety', 'shame', 'guilt'] as const).map(
              (emotion) => (
                <Controller
                  key={emotion}
                  control={control}
                  name={`initialEmotions.${emotion}` as const}
                  render={({ field }) => (
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="capitalize">{emotion}</span>
                        <span>{field.value}</span>
                      </div>
                      <Slider
                        value={[Number(field.value ?? 0)]}
                        max={10}
                        step={1}
                        onValueChange={(v) => field.onChange(v[0])}
                      />
                    </div>
                  )}
                />
              )
            )}
          </div>
        </div>

        {/* Form-level error display */}
        {state.errors?._form && (
          <p className="text-destructive text-sm" role="alert">
            {state.errors._form[0]}
          </p>
        )}

        {/* Success message */}
        {state.success && state.message && (
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {state.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={!isSituationValid || isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Draft'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
