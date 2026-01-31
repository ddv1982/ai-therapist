import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TextareaConfig = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
};

type SliderField = {
  kind: 'slider';
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  error?: string;
  showError?: boolean;
};

type InputField = {
  kind: 'input';
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  showError?: boolean;
  className?: string;
};

type FieldConfig = SliderField | InputField;

interface ObsessionsFormSectionProps {
  textarea: TextareaConfig;
  fields: FieldConfig[];
  fieldsClassName?: string;
}

export function ObsessionsFormSection({
  textarea,
  fields,
  fieldsClassName,
}: ObsessionsFormSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <Textarea
          value={textarea.value}
          onChange={(event) => textarea.onChange(event.target.value)}
          placeholder={textarea.placeholder}
          className={cn('min-h-[100px]', textarea.error && 'border-destructive')}
        />
        {textarea.error && (
          <div className="text-destructive mt-1 flex items-center gap-1 text-xs">
            <AlertCircle className="h-3 w-3" />
            {textarea.error}
          </div>
        )}
      </div>

      <div className={fieldsClassName ?? 'grid gap-4 sm:grid-cols-2'}>
        {fields.map((field, index) => {
          if (field.kind === 'slider') {
            return (
              <div key={`${field.kind}-${index}`} className="flex-1">
                <Label className="text-muted-foreground text-xs">{field.label}</Label>
                <Slider
                  value={[field.value]}
                  onValueChange={([value]) => field.onChange(value)}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  className="mt-1 w-full"
                />
                {field.showError !== false && field.error && (
                  <div className="text-destructive mt-1 flex items-center gap-1 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    {field.error}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={`${field.kind}-${index}`} className="flex-1">
              {field.label && (
                <Label className="text-muted-foreground text-xs">{field.label}</Label>
              )}
              <Input
                type={field.type}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                placeholder={field.placeholder}
                className={cn('text-sm', field.error && 'border-destructive', field.className)}
              />
              {field.showError !== false && field.error && (
                <div className="text-destructive mt-1 flex items-center gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {field.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
