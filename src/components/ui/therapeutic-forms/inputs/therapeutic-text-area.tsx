import { memo } from 'react';
import { Textarea } from '@/components/ui/textarea';
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

export interface TherapeuticTextAreaProps {
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  isValid?: boolean;
  validate?: ValidationFunction;
  isDraftSaved?: boolean;
  onDraftSave?: (value: FormFieldValue) => void;
  draftSaveDelay?: number;
  variant?: FieldVariant;
  size?: FieldSize;
  className?: string;
  fieldClassName?: string;
  labelClassName?: string;
  rows?: number;
}

const TherapeuticTextAreaComponent = function TherapeuticTextArea({
  label,
  description,
  placeholder,
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
  variant = 'default',
  size = 'md',
  className,
  fieldClassName,
  labelClassName,
  rows,
}: TherapeuticTextAreaProps) {
  const { handleChange, displayError, fieldIsValid } = useTherapeuticField({
    onChange: onChange ? (val) => onChange(val as string) : undefined,
    validate,
    onDraftSave,
    draftSaveDelay,
    error,
    isValid,
  });

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
      <Textarea
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(!fieldIsValid && 'border-destructive', fieldClassName)}
      />
    </TherapeuticFieldWrapper>
  );
};

export const TherapeuticTextArea = memo(TherapeuticTextAreaComponent);
