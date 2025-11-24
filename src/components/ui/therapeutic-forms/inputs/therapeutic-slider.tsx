import { memo } from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  TherapeuticFieldWrapper,
  type FieldVariant,
  type FieldSize,
} from '@/components/ui/therapeutic-forms/base/therapeutic-field-wrapper';
import {
  useTherapeuticField,
  type FormFieldValue,
  type ValidationFunction,
} from '@/components/ui/therapeutic-forms/base/use-therapeutic-field';

export type SliderVariant = 'default' | 'emotion' | 'intensity';

export interface TherapeuticSliderProps {
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  value?: number;
  onChange?: (value: number) => void;
  error?: string;
  isValid?: boolean;
  validate?: ValidationFunction;
  isDraftSaved?: boolean;
  onDraftSave?: (value: FormFieldValue) => void;
  draftSaveDelay?: number;
  min?: number;
  max?: number;
  step?: number;
  showScale?: boolean;
  sliderVariant?: SliderVariant;
  variant?: FieldVariant;
  size?: FieldSize;
  className?: string;
  fieldClassName?: string;
  labelClassName?: string;
}

function getIntensityLabel(value: number): string {
  if (value === 0) return 'None';
  if (value <= 2) return 'Mild';
  if (value <= 5) return 'Moderate';
  if (value <= 7) return 'Strong';
  if (value <= 9) return 'Very strong';
  return 'Overwhelming';
}

const TherapeuticSliderComponent = function TherapeuticSlider({
  label,
  description,
  required = false,
  disabled = false,
  value,
  onChange,
  error,
  isValid,
  validate,
  isDraftSaved,
  onDraftSave,
  draftSaveDelay,
  min = 0,
  max = 10,
  step = 1,
  showScale = true,
  sliderVariant = 'default',
  variant = 'default',
  size = 'md',
  className,
  fieldClassName,
  labelClassName,
}: TherapeuticSliderProps) {
  const { handleChange, displayError, fieldIsValid } = useTherapeuticField({
    onChange: onChange ? (val) => onChange(val as number) : undefined,
    validate,
    onDraftSave,
    draftSaveDelay,
    error,
    isValid,
  });

  const numericValue = typeof value === 'number' ? value : 0;

  return (
    <TherapeuticFieldWrapper
      label={label}
      description={description}
      required={required}
      error={displayError}
      isValid={fieldIsValid}
      isDraftSaved={isDraftSaved}
      variant={variant}
      size={size}
      className={className}
      labelClassName={labelClassName}
    >
      <div className={cn('space-y-3', fieldClassName)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono font-semibold">{numericValue}</span>
            <span className="text-muted-foreground">/{max}</span>
          </div>
          {sliderVariant === 'emotion' && (
            <span className="text-muted-foreground text-sm font-semibold">
              {getIntensityLabel(numericValue)}
            </span>
          )}
        </div>

        <Slider
          value={[numericValue]}
          onValueChange={([newValue]) => handleChange(newValue)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full"
        />

        {showScale && (
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>{min}</span>
            <span>{Math.floor((min + max) / 2)}</span>
            <span>{max}</span>
          </div>
        )}

        {sliderVariant === 'emotion' && (
          <div className="bg-muted h-1 overflow-hidden rounded-full">
            <div
              className="from-primary via-accent to-primary h-full bg-gradient-to-r transition-all duration-300"
              style={{ width: `${(numericValue / max) * 100}%` }}
            />
          </div>
        )}
      </div>
    </TherapeuticFieldWrapper>
  );
};

export const TherapeuticSlider = memo(TherapeuticSliderComponent);
