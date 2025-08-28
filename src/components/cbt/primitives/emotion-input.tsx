'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

import { cn } from '@/lib/utils/utils';
import type { EmotionData } from '@/types/therapy';

interface EmotionInputProps {
  emotion: {
    key: keyof EmotionData;
    label: string;
    emoji: string;
    color: string;
  };
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function EmotionInput({
  emotion,
  value,
  onChange,
  className
}: EmotionInputProps) {
  return (
    <Card className={cn("p-4 transition-all hover:shadow-md", className)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", emotion.color)}>
          {emotion.emoji}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">{emotion.label}</h3>
          <div className="text-xs text-muted-foreground">{value}/10</div>
        </div>
      </div>

      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={0}
        max={10}
        step={1}
        className="w-full"
      />
    </Card>
  );
}
