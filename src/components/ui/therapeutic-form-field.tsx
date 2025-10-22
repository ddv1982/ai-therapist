'use client';

import React, { useState, useCallback, ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {useTranslations} from 'next-intl';

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
export function TherapeuticFormField({
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
  const handleChange = useCallback((newValue: FormFieldValue) => {
    onChange?.(newValue);
    
    // Validate if validation function provided
    if (validate) {
      const validationError = validate(newValue);
      setLocalError(validationError);
    }
    
    // Handle draft saving with debounce
    if (onDraftSave && draftSaveDelay > 0) {
      setDraftTimeout(prevTimeout => {
        if (prevTimeout) {
          clearTimeout(prevTimeout);
        }
        
        return setTimeout(() => {
          onDraftSave(newValue);
        }, draftSaveDelay);
      });
    }
  }, [onChange, validate, onDraftSave, draftSaveDelay]);

  // Variant-specific styling
  const variantStyles = {
    default: 'space-y-2',
    therapeutic: 'space-y-3 therapy-form-group',
    compact: 'space-y-1',
    inline: 'flex items-center space-x-4 space-y-0'
  };

  // Size variations
  const sizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  const displayError = error || localError;
  const fieldIsValid = isValid !== undefined ? isValid : !displayError;

  // Render emotion scale
  const renderEmotionScale = () => {
    // Fix: Removed hooks from render function - now using component-level state
    
    return (
      <div className="space-y-4">
        {/* Core emotions grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {emotions.map((emotion) => {
            const emotionValue = emotionValues[emotion.key] || 0;
            const isSelected = emotionValue > 0;
            
            return (
              <div
                key={emotion.key}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
                  isSelected 
                    ? "ring-2 ring-primary bg-primary/5 border-primary/30" 
                    : "hover:border-primary/20 bg-muted/30"
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
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                        emotion.color
                      )}>
                        {emotion.emoji}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{emotion.label.startsWith('cbt.') ? (cbtT(emotion.label as Parameters<typeof cbtT>[0]) as string) : emotion.label}</h4>
                        {isSelected && (
                          <p className="text-sm text-muted-foreground">
                            {getIntensityLabel(emotionValue)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <>
                          <span className="text-sm font-semibold text-primary">{emotionValue}/10</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEmotionChange?.(emotion.key, 0);
                            }}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-muted-foreground/20" />
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
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground px-1">
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
                <Plus className="w-4 h-4 mr-2" />
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
                  <div className="p-3 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg">
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
        <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
          <div className="flex-1">
            {arrayItemRender ? arrayItemRender(item, index) : (
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
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
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
          <Plus className="w-4 h-4 mr-2" />
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
          <span className="font-mono font-semibold text-primary">
            {typeof value === 'number' ? value : 0}
          </span>
          <span className="text-muted-foreground">/{max}</span>
        </div>
        {sliderVariant === 'emotion' && (
          <span className="text-sm font-semibold text-muted-foreground">
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
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{min}</span>
          <span>{Math.floor((min + max) / 2)}</span>
          <span>{max}</span>
        </div>
      )}

      {sliderVariant === 'emotion' && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-300"
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
          <Label className={cn(
            "flex items-center gap-1",
            variant === 'inline' && "mb-0",
            labelClassName
          )}>
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
        
        <div className="flex items-center gap-2">
          {/* Draft saved indicator */}
          {isDraftSaved !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-sm px-2 py-1 rounded transition-all duration-300',
              isDraftSaved 
                ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 opacity-100 scale-100' 
                : 'opacity-0 scale-95'
            )}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
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
        <p className={cn(
          "text-sm text-muted-foreground",
          variant === 'compact' && "text-sm"
        )}>
          {description}
        </p>
      )}

      {/* Field content */}
      <div className={cn("space-y-2", fieldClassName)}>
        {type === 'input' && (
          <Input
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(!fieldIsValid && "border-destructive")}
            {...props}
          />
        )}

        {type === 'textarea' && (
          <Textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(!fieldIsValid && "border-destructive")}
            {...props}
          />
        )}

        {type === 'slider' && renderSlider()}
        {type === 'emotion-scale' && renderEmotionScale()}
        {type === 'array' && renderArrayField()}
        {type === 'custom' && (customField || children)}
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}
    </div>
  );
}

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
  if (value === 0) return "None";
  if (value <= 2) return "Mild";
  if (value <= 5) return "Moderate";
  if (value <= 7) return "Strong";
  if (value <= 9) return "Very strong";
  return "Overwhelming";
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
    ...props
  }),

  // CBT thought input
  thoughtField: (props: Partial<TherapeuticFormFieldProps>) => ({
    type: 'textarea' as const,
    variant: 'therapeutic' as const,
    mobileOptimized: true,
    ...props
  }),

  // Dynamic list management  
  listField: (props: Partial<TherapeuticFormFieldProps>) => ({
    type: 'array' as const,
    variant: 'default' as const,
    maxItems: 10,
    ...props
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
      { key: 'guilt', label: 'cbt.emotions.guilt', emoji: '😔', color: 'bg-indigo-600' }
    ],
    ...props
  })
} as const;
