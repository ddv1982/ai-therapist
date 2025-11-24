'use client';

import { ReactNode } from 'react';
import { CardRoot } from '@/components/ui/therapeutic-cards/compound/card-root';
import { CardHeader } from '@/components/ui/therapeutic-cards/compound/card-header';
import { CardContent } from '@/components/ui/therapeutic-cards/compound/card-content';

export interface EmotionCardProps {
  title: string;
  emotionColor?: string;
  isDraftSaved?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Specialized card for emotion ratings
 * Pre-configured with therapeutic styling and emotion color accent
 */
export function EmotionCard({
  title,
  emotionColor,
  isDraftSaved,
  children,
  className,
}: EmotionCardProps) {
  return (
    <CardRoot
      variant="therapeutic"
      size="md"
      emotionColor={emotionColor}
      mobileOptimized={true}
      className={className}
    >
      <CardHeader title={title} isDraftSaved={isDraftSaved} />

      <CardContent contentPadding="md">{children}</CardContent>
    </CardRoot>
  );
}
