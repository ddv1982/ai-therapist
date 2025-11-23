'use client';

import { useState, useCallback, ReactNode, memo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

// Type definitions for better type safety
type FormFieldValue = string | number | Array<unknown> | Record<string, unknown>;
type ArrayItem = string | { value: string; [key: string]: unknown };
type ValidationFunction = (value: FormFieldValue) => string | null;

// Unified interface for all form field patterns
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
  sliderVariant?: 'default' | 'emotion' | 'intensity';

  // Array field props
  items?: Array<ArrayItem>;
  onAddItem?: () => void;
  onRemoveItem?: (index: number) => void;
  onUpdateItem?: (index: number, value: FormFieldValue) => void;
  arrayItemRender?: (item: ArrayItem, index: number) => ReactNode;
  addButtonText?: string;
  maxItems?: number;

  // Emotion scale props
  emotions?: Array<{
    key: string;
    label: string;
    emoji: string;
    color: string;
  }>;
  emotionValues?: Record<string, number>;
  onEmotionChange?: (key: string, value: number) => void;
  allowCustomEmotion?: boolean;

  // Visual variants
  variant?: 'default' | 'therapeutic' | 'compact' | 'inline';
  size?: 'sm' | 'md' | 'lg';

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

  // Mobile optimization
  mobileOptimized?: boolean;
}

/**
 * Unified therapeutic form field component that consolidates all form patterns
 * Replaces: EmotionSlider, CBT form sections, array fields, validation patterns
 *
 * Features:
 * - Multiple field types with consistent styling
 * - Built-in validation and error display
 * - Draft saving with visual indicators
 * - Emotion scale with customizable emotions
 * - Dynamic array management
 * - Mobile optimization
 * - Therapeutic styling variants
 */
const TherapeuticFormFieldComponent = function TherapeuticFormField({
  label,
  description,
  placeholder,
  required = false,
  disabled = false,
  type,
  value,
  onChange,
  error,
  isValid,
  validate,
  min = 0,
  max = 10,
  step = 1,
  showScale = true,
  sliderVariant = 'default',
  items = [],
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  arrayItemRender,
  addButtonText = 'Add Item',
  maxItems,
  emotions = [],
  emotionValues = {},
  onEmotionChange,
  allowCustomEmotion = false,
  variant = 'default',
  size = 'md',
  isDraftSaved,
  onDraftSave,
  draftSaveDelay = 500,
  className,
  fieldClassName,
  labelClassName,
  children,
  customField,
  ...props
}: TherapeuticFormFieldProps) {
  const t = useTranslations('ui');
  const cbtT = useTranslations('cbt');

  const [, setDraftTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Fix: Move emotion scale hooks to component level (prevents React hooks rules violation)
  const [showCustom, setShowCustom] = useState(false);
  const [customEmotion, setCustomEmotion] = useState('');

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
        setDraftTimeout((prevTimeout) => {
          if (prevTimeout) {
            clearTimeout(prevTimeout);
          }

          return setTimeout(() => {
            onDraftSave(newValue);
          }, draftSaveDelay);
        });
      }
    },
    [onChange, validate, onDraftSave, draftSaveDelay]
  );

  // Variant-specific styling
  const variantStyles = {
    default: 'space-y-2',
    therapeutic: 'space-y-3 therapy-form-group',
    compact: 'space-y-1',
    inline: 'flex items-center space-x-4 space-y-0',
  };

  // Size variations
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const displayError = error || localError;
  const fieldIsValid = isValid !== undefined ? isValid : !displayError;

  // Render emotion scale
  const renderEmotionScale = () => {
    // Fix: Removed hooks from render function - now using component-level state

    return (
      <div className="space-y-4">
        {/* Core emotions grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {emotions.map((emotion) => {
            const emotionValue = emotionValues[emotion.key] || 0;
            const isSelected = emotionValue > 0;

            return (
              <div
                key={emotion.key}
                className={cn(
                  'cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                  isSelected
                    ? 'ring-primary bg-primary/5 border-primary/30 ring-2'
                    : 'hover:border-primary/20 bg-muted/30'
                )}
                onClick={() => {
                  if (!isSelected) {
                    onEmotionChange?.(emotion.key, 5);
                  }
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white',
                          emotion.color
                        )}
                      >
                        {emotion.emoji}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">
                          {emotion.label.startsWith('cbt.')
                            ? (cbtT(emotion.label as Parameters<typeof cbtT>[0]) as string)
                            : emotion.label}
                        </h4>
                        {isSelected && (
                          <p className="text-muted-foreground text-sm">
                            {getIntensityLabel(emotionValue)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <>
                          <span className="text-primary text-sm font-semibold">
                            {emotionValue}/10
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEmotionChange?.(emotion.key, 0);
                            }}
                            className="hover:bg-destructive/10 hover:text-destructive h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <div className="border-muted-foreground/20 h-6 w-6 rounded-full border" />
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={emotionValue}
                        onChange={(e) => onEmotionChange?.(emotion.key, parseInt(e.target.value))}
                        className="bg-muted h-2 w-full cursor-pointer appearance-none rounded-lg"
                      />
                      <div className="text-muted-foreground flex justify-between px-1 text-sm">
                        <span>1</span>
                        <span className="hidden sm:inline">5</span>
                        <span>10</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom emotion */}
        {allowCustomEmotion && (
          <div className="border-t pt-4">
            {!showCustom ? (
              <Button
                variant="outline"
                onClick={() => setShowCustom(true)}
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                {cbtT('emotions.addCustom')}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder={cbtT('emotions.customPlaceholder')}
                    value={customEmotion}
                    onChange={(e) => setCustomEmotion(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCustom(false);
                      setCustomEmotion('');
                    }}
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {customEmotion && (
                  <div className="from-primary/5 to-accent/5 border-primary/20 rounded-lg border bg-gradient-to-r p-3">
                    {/* Custom emotion slider would go here */}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render array field
  const renderArrayField = () => (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="bg-muted/30 flex items-center gap-2 rounded-lg p-3">
          <div className="flex-1">
            {arrayItemRender ? (
              arrayItemRender(item, index)
            ) : (
              <Input
                value={typeof item === 'string' ? item : item.value || ''}
                onChange={(e) => onUpdateItem?.(index, e.target.value)}
                placeholder={placeholder}
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveItem?.(index)}
            className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {(!maxItems || items.length < maxItems) && (
        <Button
          variant="outline"
          onClick={onAddItem}
          className="w-full border-dashed"
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          {addButtonText}
        </Button>
      )}
    </div>
  );

  // Render slider field
  const renderSlider = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono font-semibold">
            {typeof value === 'number' ? value : 0}
          </span>
          <span className="text-muted-foreground">/{max}</span>
        </div>
        {sliderVariant === 'emotion' && (
          <span className="text-muted-foreground text-sm font-semibold">
            {getIntensityLabel(typeof value === 'number' ? value : 0)}
          </span>
        )}
      </div>

      <Slider
        value={[typeof value === 'number' ? value : 0]}
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
            style={{ width: `${((typeof value === 'number' ? value : 0) / max) * 100}%` }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className={cn(variantStyles[variant], sizeStyles[size], className)}>
      {/* Label and status indicators */}
      {label && (
        <div className="flex items-center justify-between">
          <Label
            className={cn(
              'flex items-center gap-1',
              variant === 'inline' && 'mb-0',
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>

          <div className="flex items-center gap-2">
            {/* Draft saved indicator */}
            {isDraftSaved !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-1 text-sm transition-all duration-300',
                  isDraftSaved
                    ? 'scale-100 bg-green-50 text-green-600 opacity-100 dark:bg-green-900/20 dark:text-green-400'
                    : 'scale-95 opacity-0'
                )}
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                {t('saved')}
              </div>
            )}

            {/* Validation indicator */}
            {isValid !== undefined && (
              <Badge variant={fieldIsValid ? 'default' : 'destructive'} size="sm">
                {fieldIsValid ? t('valid') : t('invalid')}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className={cn('text-muted-foreground text-sm', variant === 'compact' && 'text-sm')}>
          {description}
        </p>
      )}

      {/* Field content */}
      <div className={cn('space-y-2', fieldClassName)}>
        {type === 'input' && (
          <Input
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(!fieldIsValid && 'border-destructive')}
            {...props}
          />
        )}

        {type === 'textarea' && (
          <Textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(!fieldIsValid && 'border-destructive')}
            {...props}
          />
        )}

        {type === 'slider' && renderSlider()}
        {type === 'emotion-scale' && renderEmotionScale()}
        {type === 'array' && renderArrayField()}
        {type === 'custom' && (customField || children)}
      </div>

      {/* Error message */}
      {displayError && <p className="text-destructive text-sm">{displayError}</p>}
    </div>
  );
};

// Memoized export - only re-render when props actually change
export const TherapeuticFormField = memo(TherapeuticFormFieldComponent);

// Helper function for intensity labels
function getIntensityLabel(value: number, t?: (key: string) => string): string {
  if (t) {
    if (value === 0) return t('cbt.emotionIntensity.none');
    if (value <= 2) return t('cbt.emotionIntensity.mild');
    if (value <= 5) return t('cbt.emotionIntensity.moderate');
    if (value <= 7) return t('cbt.emotionIntensity.strong');
    if (value <= 9) return t('cbt.emotionIntensity.veryStrong');
    return t('cbt.emotionIntensity.overwhelming');
  }
  if (value === 0) return 'None';
  if (value <= 2) return 'Mild';
  if (value <= 5) return 'Moderate';
  if (value <= 7) return 'Strong';
  if (value <= 9) return 'Very strong';
  return 'Overwhelming';
}

// Pre-configured field types for common therapeutic use cases
export const therapeuticFieldPresets = {
  // Emotion intensity slider
  emotionSlider: (props: Partial<TherapeuticFormFieldProps>) => ({
    type: 'slider' as const,
    sliderVariant: 'emotion' as const,
    min: 0,
    max: 10,
    step: 1,
    showScale: true,
    variant: 'therapeutic' as const,
    ...props,
  }),

  // CBT thought input
  thoughtField: (props: Partial<TherapeuticFormFieldProps>) => ({
    type: 'textarea' as const,
    variant: 'therapeutic' as const,
    mobileOptimized: true,
    ...props,
  }),

  // Dynamic list management
  listField: (props: Partial<TherapeuticFormFieldProps>) => ({
    type: 'array' as const,
    variant: 'default' as const,
    maxItems: 10,
    ...props,
  }),

  // Full emotion scale
  emotionScale: (props: Partial<TherapeuticFormFieldProps>) => ({
    type: 'emotion-scale' as const,
    variant: 'therapeutic' as const,
    allowCustomEmotion: true,
    emotions: [
      { key: 'fear', label: 'cbt.emotions.fear', emoji: '😨', color: 'bg-slate-600' },
      { key: 'anger', label: 'cbt.emotions.anger', emoji: '😠', color: 'bg-red-600' },
      { key: 'sadness', label: 'cbt.emotions.sadness', emoji: '😢', color: 'bg-blue-600' },
      { key: 'joy', label: 'cbt.emotions.joy', emoji: '😊', color: 'bg-yellow-500' },
      { key: 'anxiety', label: 'cbt.emotions.anxiety', emoji: '😰', color: 'bg-orange-500' },
      { key: 'shame', label: 'cbt.emotions.shame', emoji: '😳', color: 'bg-pink-600' },
      { key: 'guilt', label: 'cbt.emotions.guilt', emoji: '😔', color: 'bg-indigo-600' },
    ],
    ...props,
  }),
} as const;
