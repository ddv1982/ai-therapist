import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ObsessionFormState } from './types';

interface ObsessionFormProps {
  form: ObsessionFormState;
  errors: Record<string, string>;
  onChange: (updater: (prev: ObsessionFormState) => ObsessionFormState) => void;
  intensityLabel: string;
  triggersPlaceholder: string;
  descriptionPlaceholder: string;
}

export function ObsessionForm({
  form,
  errors,
  onChange,
  intensityLabel,
  triggersPlaceholder,
  descriptionPlaceholder,
}: ObsessionFormProps) {
  const update = (partial: Partial<ObsessionFormState>) =>
    onChange((prev) => ({ ...prev, ...partial }));

  return (
    <div className="space-y-4">
      <div>
        <Textarea
          value={form.obsession}
          onChange={(event) => update({ obsession: event.target.value })}
          placeholder={descriptionPlaceholder}
          className={cn('min-h-[100px]', errors.obsession && 'border-destructive')}
        />
        {errors.obsession && (
          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            {errors.obsession}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">
            {intensityLabel}: {form.intensity}/10
          </Label>
          <Slider
            value={[form.intensity]}
            onValueChange={([value]) => update({ intensity: value })}
            min={1}
            max={10}
            step={1}
            className="w-full mt-1"
          />
        </div>
        <div className="flex-1">
          <Input
            value={form.triggers}
            onChange={(event) => update({ triggers: event.target.value })}
            placeholder={triggersPlaceholder}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}
