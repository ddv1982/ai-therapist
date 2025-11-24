import { useState, useCallback } from 'react';
import { useDraftSaving } from '@/hooks/use-draft-saving';

export type FormFieldValue = string | number | Array<unknown> | Record<string, unknown>;
export type ValidationFunction = (value: FormFieldValue) => string | null;

export interface UseTherapeuticFieldOptions {
  onChange?: (value: FormFieldValue) => void;
  validate?: ValidationFunction;
  onDraftSave?: (value: FormFieldValue) => void;
  draftSaveDelay?: number;
  error?: string;
  isValid?: boolean;
}

/**
 * Shared hook for all therapeutic form fields
 * Handles validation, draft saving, and error state
 */
export function useTherapeuticField({
  onChange,
  validate,
  onDraftSave,
  draftSaveDelay = 500,
  error,
  isValid,
}: UseTherapeuticFieldOptions) {
  const [localError, setLocalError] = useState<string | null>(null);

  // Use the reusable draft saving hook
  const { saveDraft } = useDraftSaving({
    onSave: (value: FormFieldValue) => {
      onDraftSave?.(value);
    },
    debounceMs: draftSaveDelay,
    enabled: Boolean(onDraftSave),
  });

  // Handle value changes with validation and draft saving
  const handleChange = useCallback(
    (newValue: FormFieldValue) => {
      onChange?.(newValue);

      // Validate if validation function provided
      if (validate) {
        const validationError = validate(newValue);
        setLocalError(validationError);
      }

      // Save draft using the reusable hook
      if (onDraftSave) {
        saveDraft(newValue);
      }
    },
    [onChange, validate, onDraftSave, saveDraft]
  );

  const displayError = error || localError;
  const fieldIsValid = isValid !== undefined ? isValid : !displayError;

  return {
    handleChange,
    displayError,
    fieldIsValid,
  };
}
