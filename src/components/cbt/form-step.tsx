'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

interface FormStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  isValid?: boolean;
  isLoading?: boolean;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

export function FormStep({
  title,
  subtitle,
  children,
  onNext,
  onPrev,
  nextLabel = "Next",
  prevLabel = "Previous",
  isValid = true,
  isLoading = false,
  stepNumber,
  totalSteps,
  className
}: FormStepProps) {
  return (
    <Card className={cn("max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {stepNumber && totalSteps && (
            <div className="text-sm text-muted-foreground">
              {stepNumber} of {totalSteps}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {children}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={!onPrev || isLoading}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {prevLabel}
          </Button>

          <Button
            onClick={onNext}
            disabled={!isValid || isLoading || !onNext}
            className="flex items-center gap-2"
          >
            {nextLabel}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
