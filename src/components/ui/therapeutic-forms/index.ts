// Base components and hooks
export {
  useTherapeuticField,
  type FormFieldValue,
  type ValidationFunction,
  type UseTherapeuticFieldOptions,
} from '@/components/ui/therapeutic-forms/base/use-therapeutic-field';

export { TherapeuticFieldLabel } from '@/components/ui/therapeutic-forms/base/therapeutic-field-label';
export { TherapeuticFieldError } from '@/components/ui/therapeutic-forms/base/therapeutic-field-error';
export {
  TherapeuticFieldWrapper,
  type FieldVariant,
  type FieldSize,
} from '@/components/ui/therapeutic-forms/base/therapeutic-field-wrapper';

// Input components
export { TherapeuticTextInput, type TherapeuticTextInputProps } from '@/components/ui/therapeutic-forms/inputs/therapeutic-text-input';
export { TherapeuticTextArea, type TherapeuticTextAreaProps } from '@/components/ui/therapeutic-forms/inputs/therapeutic-text-area';
export {
  TherapeuticSlider,
  type TherapeuticSliderProps,
  type SliderVariant,
} from '@/components/ui/therapeutic-forms/inputs/therapeutic-slider';

// Specialized components
export {
  EmotionScaleInput,
  type EmotionScaleInputProps,
  type Emotion,
} from '@/components/ui/therapeutic-forms/specialized/emotion-scale-input';
export {
  ArrayFieldInput,
  type ArrayFieldInputProps,
  type ArrayItem,
} from '@/components/ui/therapeutic-forms/specialized/array-field-input';

// Backward compatible wrapper (maintains old API)
export { TherapeuticFormField, type TherapeuticFormFieldProps } from '@/components/ui/therapeutic-forms/therapeutic-form-field-new';
