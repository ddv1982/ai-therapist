'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useTranslations } from 'next-intl';



interface ThoughtInputProps {
  thought: string;
  credibility: number;
  onThoughtChange: (thought: string) => void;
  onCredibilityChange: (credibility: number) => void;
  placeholder?: string;
  className?: string;
}

export function ThoughtInput({
  thought,
  credibility,
  onThoughtChange,
  onCredibilityChange,
  placeholder = "Enter your thought...",
  className
}: ThoughtInputProps) {
  const t = useTranslations('cbt');
  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-5 h-5 text-primary" />
        <span className="font-medium text-sm">{t('thoughts.entryLabel')}</span>
      </div>

      <Textarea
        value={thought}
        onChange={(e) => onThoughtChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('thoughts.credibilityLabel')}</span>
          <span className="text-sm text-muted-foreground">{credibility}/10</span>
        </div>
        <Slider
          value={[credibility]}
          onValueChange={([newValue]) => onCredibilityChange(newValue)}
          min={0}
          max={10}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('thoughts.scaleLeft')}</span>
          <span>{t('thoughts.scaleRight')}</span>
        </div>
      </div>
    </Card>
  );
}
