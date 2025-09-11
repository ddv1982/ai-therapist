'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import {useTranslations} from 'next-intl';

export type SliderType = 'credibility' | 'confidence' | 'intensity' | 'generic';

export interface TherapySliderProps {
  /** The label text displayed above the slider */
  label: string;
  /** Current slider value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Type of slider that determines range and labels */
  type?: SliderType;
  /** Custom minimum value (overrides type default) */
  min?: number;
  /** Custom maximum value (overrides type default) */
  max?: number;
  /** Custom scale labels (overrides type default) */
  scaleLabels?: {
    left: string;
    center?: string;
    right: string;
  };
  /** Additional CSS classes */
  className?: string;
  /** Size variant for label text */
  labelSize?: 'sm' | 'xs';
}

/**
 * Unified therapy slider component for CBT forms
 * Eliminates duplication across credibility, confidence, and intensity sliders
 */
export const TherapySlider: React.FC<TherapySliderProps> = ({
  label,
  value,
  onChange,
  type = 'generic',
  min: customMin,
  max: customMax,
  scaleLabels: customLabels,
  className,
  labelSize = 'sm'
}) => {
  const t = useTranslations('cbt');
  // Default configurations for different slider types
  const typeConfigs = {
    credibility: {
      min: 0,
      max: 10,
      labels: {
        left: t('slider.credLeft'),
        center: t('slider.credCenter'),
        right: t('slider.credRight')
      }
    },
    confidence: {
      min: 1,
      max: 10,
      labels: {
        left: t('slider.confLeft'),
        center: t('slider.confCenter'), 
        right: t('slider.confRight')
      }
    },
    intensity: {
      min: 1,
      max: 10,
      labels: {
        left: t('slider.intLeft'),
        center: t('slider.intCenter'),
        right: t('slider.intRight')
      }
    },
    generic: {
      min: 0,
      max: 10,
      labels: {
        left: '0',
        center: '5',
        right: '10'
      }
    }
  };

  const config = typeConfigs[type];
  const minValue = customMin ?? config.min;
  const maxValue = customMax ?? config.max;
  const scaleLabels = customLabels ?? config.labels;

  // Ensure value is within bounds
  const clampedValue = Math.max(minValue, Math.min(maxValue, value));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value, 10);
    onChange(newValue);
  };

  const labelClassName = labelSize === 'xs' ? 'text-sm' : 'text-sm';

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label and Value Display */}
      <div className="flex justify-between items-center">
        <label className={cn("font-semibold text-foreground", labelClassName)}>
          {label}
        </label>
        <span className={cn("text-muted-foreground font-mono", labelClassName)}>
          {clampedValue}/{maxValue}
        </span>
      </div>

      {/* Slider Input */}
      <input
        type="range"
        min={minValue}
        max={maxValue}
        step="1"
        value={clampedValue}
        onChange={handleChange}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer slider-track:bg-muted slider-track:rounded-lg"
        aria-label={label}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
        aria-valuenow={clampedValue}
      />

      {/* Scale Labels */}
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{scaleLabels.left}</span>
        {scaleLabels.center && (
          <span className="hidden sm:inline">{scaleLabels.center}</span>
        )}
        <span>{scaleLabels.right}</span>
      </div>
    </div>
  );
};

export default TherapySlider;