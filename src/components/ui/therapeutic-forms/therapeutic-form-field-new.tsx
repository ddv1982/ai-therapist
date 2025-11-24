/**
 * Backward Compatible Wrapper for TherapeuticFormField
 * 
 * This component maintains the old API for backward compatibility while using
 * the new focused components under the hood.
 * 
 * MIGRATION GUIDE:
 * Instead of using this wrapper, prefer the specific components:
 * 
 * OLD:
 *   <TherapeuticFormField type="input" ... />
 * NEW:
 *   <TherapeuticTextInput ... />
 * 
 * OLD:
 *   <TherapeuticFormField type="textarea" ... />
 * NEW:
 *   <TherapeuticTextArea ... />
 * 
 * OLD:
 *   <TherapeuticFormField type="slider" ... />
 * NEW:
 *   <TherapeuticSlider ... />
 * 
 * OLD:
 *   <TherapeuticFormField type="emotion-scale" ... />
 * NEW:
 *   <EmotionScaleInput ... />
 * 
 * OLD:
 *   <TherapeuticFormField type="array" ... />
 * NEW:
 *   <ArrayFieldInput ... />
 */

import { ReactNode } from 'react';
import { TherapeuticTextInput } from '@/components/ui/therapeutic-forms/inputs/therapeutic-text-input';
import { TherapeuticTextArea } from '@/components/ui/therapeutic-forms/inputs/therapeutic-text-area';
import { TherapeuticSlider, type SliderVariant } from '@/components/ui/therapeutic-forms/inputs/therapeutic-slider';
import { EmotionScaleInput, type Emotion } from '@/components/ui/therapeutic-forms/specialized/emotion-scale-input';
import { ArrayFieldInput, type ArrayItem } from '@/components/ui/therapeutic-forms/specialized/array-field-input';
import type { FieldVariant, FieldSize } from '@/components/ui/therapeutic-forms/base/therapeutic-field-wrapper';
import type { FormFieldValue, ValidationFunction } from '@/components/ui/therapeutic-forms/base/use-therapeutic-field';

export interface TherapeuticFormFieldProps {
  // Field identification
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;

  // Field type and behavior
  type: 'input' | 'textarea' | 'slider' | 'emotion-scale' | 'array' | 'custom';
  value?: FormFieldValue;
  onChange?: (value: FormFieldValue) => void;

  // Validation
  error?: string;
  isValid?: boolean;
  validate?: ValidationFunction;

  // Slider-specific props
  min?: number;
  max?: number;
  step?: number;
  showScale?: boolean;
  sliderVariant?: SliderVariant;

  // Array field props
  items?: ArrayItem[];
  onAddItem?: () => void;
  onRemoveItem?: (index: number) => void;
  onUpdateItem?: (index: number, value: FormFieldValue) => void;
  arrayItemRender?: (item: ArrayItem, index: number) => ReactNode;
  addButtonText?: string;
  maxItems?: number;

  // Emotion scale props
  emotions?: Emotion[];
  emotionValues?: Record<string, number>;
  onEmotionChange?: (key: string, value: number) => void;
  allowCustomEmotion?: boolean;

  // Visual variants
  variant?: FieldVariant;
  size?: FieldSize;

  // Draft saving
  isDraftSaved?: boolean;
  onDraftSave?: (value: FormFieldValue) => void;
  draftSaveDelay?: number;

  // Layout and styling
  className?: string;
  fieldClassName?: string;
  labelClassName?: string;

  // Custom content
  children?: ReactNode;
  customField?: ReactNode;

  // Textarea specific
  rows?: number;
}

/**
 * @deprecated Use specific components instead: TherapeuticTextInput, TherapeuticTextArea, etc.
 * This wrapper is maintained for backward compatibility only.
 */
export function TherapeuticFormField(props: TherapeuticFormFieldProps) {
  const {
    type,
    label,
    description,
    placeholder,
    required,
    disabled,
    value,
    onChange,
    error,
    isValid,
    validate,
    isDraftSaved,
    onDraftSave,
    draftSaveDelay,
    variant,
    size,
    className,
    fieldClassName,
    labelClassName,
  } = props;

  // Common props shared by all components
  const commonProps = {
    label,
    description,
    required,
    disabled,
    value,
    onChange,
    error,
    isValid,
    validate,
    isDraftSaved,
    onDraftSave,
    draftSaveDelay,
    variant,
    size,
    className,
    labelClassName,
  };

  // Route to appropriate component based on type
  switch (type) {
    case 'input':
      return (
        <TherapeuticTextInput
          {...commonProps}
          value={value as string}
          onChange={onChange as ((value: string) => void) | undefined}
          placeholder={placeholder}
          fieldClassName={fieldClassName}
        />
      );

    case 'textarea':
      return (
        <TherapeuticTextArea
          {...commonProps}
          value={value as string}
          onChange={onChange as ((value: string) => void) | undefined}
          placeholder={placeholder}
          fieldClassName={fieldClassName}
          rows={props.rows}
        />
      );

    case 'slider':
      return (
        <TherapeuticSlider
          {...commonProps}
          value={value as number}
          onChange={onChange as ((value: number) => void) | undefined}
          min={props.min}
          max={props.max}
          step={props.step}
          showScale={props.showScale}
          sliderVariant={props.sliderVariant}
          fieldClassName={fieldClassName}
        />
      );

    case 'emotion-scale':
      return (
        <EmotionScaleInput
          label={label}
          description={description}
          required={required}
          emotions={props.emotions}
          emotionValues={props.emotionValues}
          onEmotionChange={props.onEmotionChange}
          allowCustomEmotion={props.allowCustomEmotion}
          variant={variant}
          size={size}
          className={className}
          labelClassName={labelClassName}
        />
      );

    case 'array':
      return (
        <ArrayFieldInput
          label={label}
          description={description}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          items={props.items}
          onAddItem={props.onAddItem}
          onRemoveItem={props.onRemoveItem}
          onUpdateItem={props.onUpdateItem}
          arrayItemRender={props.arrayItemRender}
          addButtonText={props.addButtonText}
          maxItems={props.maxItems}
          variant={variant}
          size={size}
          className={className}
          labelClassName={labelClassName}
        />
      );

    case 'custom':
      return <div className={className}>{props.customField || props.children}</div>;

    default:
      console.warn(`Unknown TherapeuticFormField type: ${type}`);
      return null;
  }
}
