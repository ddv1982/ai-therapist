'use client';

import React, { useState, ReactNode } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCBTTokens } from '@/lib/design-system/message';

interface BaseCBTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendToChat: (formattedContent: string) => void;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  isValid?: boolean;
  isDirty?: boolean;
  lastSaved?: Date;
  onReset?: () => void;
  onSubmit?: () => void;
}

export const BaseCBTModal: React.FC<BaseCBTModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  isValid = true,
  isDirty = false,
  lastSaved,
  onReset,
  onSubmit
}) => {
  const tokens = getCBTTokens();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleReset = () => {
    if (onReset) {
      onReset();
      setShowConfirmReset(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl w-full h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className={tokens.modal.header}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pl-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                {icon}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {description}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {onReset && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmReset(true)}
                  disabled={!isDirty}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                ✕
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className={cn(tokens.modal.content, "space-y-8 flex-1 overflow-y-auto")}>
          {children}
        </div>

        {/* Footer */}
        <DialogFooter className={cn(tokens.modal.footer, "pb-6")}>
          <div className="flex items-center justify-end w-full pr-2">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                disabled={!isValid}
              >
                <Send className="w-4 h-4 mr-2" />
                Send to Chat
              </Button>
            </div>
          </div>
        </DialogFooter>

        {/* Reset Confirmation Dialog */}
        {showConfirmReset && onReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div className="bg-background p-6 rounded-lg border max-w-md">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Reset Form?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will clear all your entries and start fresh. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmReset(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Shared emotion slider component for CBT forms
export interface EmotionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  showScale?: boolean;
}

export const EmotionSlider: React.FC<EmotionSliderProps> = ({ 
  label, 
  value, 
  onChange, 
  className,
  min = 0,
  max = 100,
  step = 5,
  showScale = true
}) => {
  const tokens = getCBTTokens();
  
  return (
    <div className={cn(tokens.slider.container, className)}>
      <div className={tokens.slider.label}>
        <label className={tokens.slider.labelText}>{label}</label>
        <span className={tokens.slider.value}>{value}/{max}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={cn(tokens.slider.track, "slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer slider-track:bg-muted slider-track:rounded-lg")}
      />
      {showScale && (
        <div className={tokens.slider.scale}>
          <span>{min}</span>
          <span>{Math.round((min + max) / 2)}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};