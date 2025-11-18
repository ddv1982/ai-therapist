import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompulsionFormState } from './types';

interface CompulsionFormProps {
  form: CompulsionFormState;
  errors: Record<string, string>;
  onChange: (updater: (prev: CompulsionFormState) => CompulsionFormState) => void;
  frequencyLabel: string;
  durationLabel: string;
  reliefLabel: string;
  durationUnit: string;
  descriptionPlaceholder: string;
}

export function CompulsionForm({
  form,
  errors,
  onChange,
  frequencyLabel,
  durationLabel,
  reliefLabel,
  durationUnit,
  descriptionPlaceholder,
}: CompulsionFormProps) {
  const update = (partial: Partial<CompulsionFormState>) =>
    onChange((prev) => ({ ...prev, ...partial }));

  return (
    <div className="space-y-4">
      <div>
        <Textarea
          value={form.compulsion}
          onChange={(event) => update({ compulsion: event.target.value })}
          placeholder={descriptionPlaceholder}
          className={cn('min-h-[100px]', errors.compulsion && 'border-destructive')}
        />
        {errors.compulsion && (
          <div className="text-destructive mt-1 flex items-center gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            {errors.compulsion}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label className="text-muted-foreground text-xs">
            {frequencyLabel}: {form.frequency}/10
          </Label>
          <Slider
            value={[form.frequency]}
            onValueChange={([value]) => update({ frequency: value })}
            min={1}
            max={10}
            step={1}
            className="mt-1 w-full"
          />
          {errors.frequency && (
            <div className="text-destructive mt-1 flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              {errors.frequency}
            </div>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">
            {durationLabel}: {form.duration} {durationUnit}
          </Label>
          <Input
            type="number"
            value={form.duration}
            onChange={(event) => update({ duration: Number(event.target.value) || 0 })}
            className={cn('text-sm', errors.duration && 'border-destructive')}
          />
          {errors.duration && (
            <div className="text-destructive mt-1 flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              {errors.duration}
            </div>
          )}
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">
            {reliefLabel}: {form.reliefLevel}/10
          </Label>
          <Slider
            value={[form.reliefLevel]}
            onValueChange={([value]) => update({ reliefLevel: value })}
            min={1}
            max={10}
            step={1}
            className="mt-1 w-full"
          />
          {errors.reliefLevel && (
            <div className="text-destructive mt-1 flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              {errors.reliefLevel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
