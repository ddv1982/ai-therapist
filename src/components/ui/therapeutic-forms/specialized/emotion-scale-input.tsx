import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  TherapeuticFieldWrapper,
  type FieldVariant,
  type FieldSize,
} from '@/components/ui/therapeutic-forms/base/therapeutic-field-wrapper';

export interface Emotion {
  key: string;
  label: string;
  emoji: string;
  color: string;
}

export interface EmotionScaleInputProps {
  label?: string;
  description?: string;
  required?: boolean;
  emotions?: Emotion[];
  emotionValues?: Record<string, number>;
  onEmotionChange?: (key: string, value: number) => void;
  allowCustomEmotion?: boolean;
  variant?: FieldVariant;
  size?: FieldSize;
  className?: string;
  labelClassName?: string;
}

function getIntensityLabel(value: number, t: (key: string) => string): string {
  if (value === 0) return t('cbt.emotionIntensity.none');
  if (value <= 2) return t('cbt.emotionIntensity.mild');
  if (value <= 5) return t('cbt.emotionIntensity.moderate');
  if (value <= 7) return t('cbt.emotionIntensity.strong');
  if (value <= 9) return t('cbt.emotionIntensity.veryStrong');
  return t('cbt.emotionIntensity.overwhelming');
}

const EmotionScaleInputComponent = function EmotionScaleInput({
  label,
  description,
  required = false,
  emotions = [],
  emotionValues = {},
  onEmotionChange,
  allowCustomEmotion = false,
  variant = 'default',
  size = 'md',
  className,
  labelClassName,
}: EmotionScaleInputProps) {
  const cbtT = useTranslations('cbt');
  const [showCustom, setShowCustom] = useState(false);
  const [customEmotion, setCustomEmotion] = useState('');

  return (
    <TherapeuticFieldWrapper
      label={label}
      description={description}
      required={required}
      variant={variant}
      size={size}
      className={className}
      labelClassName={labelClassName}
    >
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
                            {getIntensityLabel(emotionValue, cbtT)}
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
              </div>
            )}
          </div>
        )}
      </div>
    </TherapeuticFieldWrapper>
  );
};

export const EmotionScaleInput = memo(EmotionScaleInputComponent);
