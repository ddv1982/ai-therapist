import { useState, useCallback } from 'react';

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
  const [draftTimeout, setDraftTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle value changes with validation and draft saving
  const handleChange = useCallback(
    (newValue: FormFieldValue) => {
      onChange?.(newValue);

      // Validate if validation function provided
      if (validate) {
        const validationError = validate(newValue);
        setLocalError(validationError);
      }

      // Handle draft saving with debounce
      if (onDraftSave && draftSaveDelay > 0) {
        if (draftTimeout) {
          clearTimeout(draftTimeout);
        }

        const timeout = setTimeout(() => {
          onDraftSave(newValue);
        }, draftSaveDelay);

        setDraftTimeout(timeout);
      }
    },
    [onChange, validate, onDraftSave, draftSaveDelay, draftTimeout]
  );

  const displayError = error || localError;
  const fieldIsValid = isValid !== undefined ? isValid : !displayError;

  return {
    handleChange,
    displayError,
    fieldIsValid,
  };
}
