import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TherapeuticFieldLabel } from '@/components/ui/therapeutic-forms/base/therapeutic-field-label';
import { TherapeuticFieldError } from '@/components/ui/therapeutic-forms/base/therapeutic-field-error';

export type FieldVariant = 'default' | 'therapeutic' | 'compact' | 'inline';
export type FieldSize = 'sm' | 'md' | 'lg';

export interface TherapeuticFieldWrapperProps {
  children: ReactNode;
  label?: string;
  description?: string;
  required?: boolean;
  error?: string | null;
  isValid?: boolean;
  isDraftSaved?: boolean;
  variant?: FieldVariant;
  size?: FieldSize;
  className?: string;
  labelClassName?: string;
}

const variantStyles: Record<FieldVariant, string> = {
  default: 'space-y-2',
  therapeutic: 'space-y-3 therapy-form-group',
  compact: 'space-y-1',
  inline: 'flex items-center space-x-4 space-y-0',
};

const sizeStyles: Record<FieldSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function TherapeuticFieldWrapper({
  children,
  label,
  description,
  required,
  error,
  isValid,
  isDraftSaved,
  variant = 'default',
  size = 'md',
  className,
  labelClassName,
}: TherapeuticFieldWrapperProps) {
  return (
    <div className={cn(variantStyles[variant], sizeStyles[size], className)}>
      <TherapeuticFieldLabel
        label={label}
        required={required}
        isValid={isValid}
        isDraftSaved={isDraftSaved}
        className={labelClassName}
        inline={variant === 'inline'}
      />

      {description && (
        <p className={cn('text-muted-foreground text-sm', variant === 'compact' && 'text-xs')}>
          {description}
        </p>
      )}

      {children}

      <TherapeuticFieldError error={error} />
    </div>
  );
}
