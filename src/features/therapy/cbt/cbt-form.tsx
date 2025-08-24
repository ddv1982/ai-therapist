'use client';

import React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cbtRHFSchema, type CBTFormInput, getDefaultCBTValues } from './cbt-form-schema';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useCBTDraftPersistence } from './hooks/use-cbt-draft-persistence';

interface CBTFormProps {
  onSubmit: (data: CBTFormInput) => void;
  defaultValues?: Partial<CBTFormInput>;
  onDraftChange?: (data: CBTFormInput) => void;
}

export function CBTForm({ onSubmit, defaultValues, onDraftChange }: CBTFormProps) {
  const form = useForm<CBTFormInput>({
    resolver: zodResolver(cbtRHFSchema),
    mode: 'onChange',
    defaultValues: (defaultValues as CBTFormInput) || (getDefaultCBTValues() as unknown as CBTFormInput),
  });

  const { control, handleSubmit, formState } = form;
  const current = useWatch({ control });
  useCBTDraftPersistence(current as CBTFormInput, true, 600);
  React.useEffect(() => {
    if (onDraftChange) {
      onDraftChange(current as CBTFormInput);
    }
  }, [current, onDraftChange]);

  const isSituationValid = (String((current as Partial<CBTFormInput>)?.situation || '').trim().length) >= 5;

  return (
    <Card className="p-4 space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="text-sm font-medium">Situation</label>
          <Controller
            control={control}
            name="situation"
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Describe the situation..."
                className="mt-2"
                onChange={(e) => {
                  field.onChange(e);
                }}
              />
            )}
          />
          {formState.errors.situation?.message && (
            <p className="text-xs text-red-600 mt-1">{formState.errors.situation.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Initial emotions</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
            {(['fear','anger','sadness','joy','anxiety','shame','guilt'] as const).map((emotion) => (
              <Controller
                key={emotion}
                control={control}
                name={`initialEmotions.${emotion}` as const}
                render={({ field }) => (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
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


