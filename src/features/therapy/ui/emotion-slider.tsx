import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface EmotionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  showScale?: boolean;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  variant?: "default" | "compact";
}

const EmotionSlider = React.forwardRef<HTMLDivElement, EmotionSliderProps>(
  ({
    label,
    value,
    onChange,
    className,
    min = 0,
    max = 10,
    step = 1,
    showScale = true,
    disabled = false,
    required = false,
    description,
    variant = "default",
    ...props
  }, ref) => {
    const handleValueChange = (newValue: number[]) => {
      onChange(newValue[0]);
    };

    const isCompact = variant === "compact";

    return (
      <div
        ref={ref}
        className={cn(
          "therapy-form-group",
          isCompact ? "space-y-1" : "space-y-therapy-xs",
          className
        )}
        {...props}
      >
        {/* Label and Value Display */}
        <div className="flex items-center justify-between">
          <Label
            className="flex items-center gap-1"
          >
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
          <div className={cn(
            "flex items-center gap-2",
            isCompact ? "text-xs" : "text-sm"
          )}>
            <span className="font-mono font-semibold text-primary">
              {value}
            </span>
            <span className="text-muted-foreground">
              /{max}
            </span>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className={cn(
            "therapy-form-description",
            isCompact && "text-xs"
          )}>
            {description}
          </p>
        )}

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={[value]}
            onValueChange={handleValueChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="w-full"
          />

          {/* Scale indicators */}
          {showScale && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min}</span>
              <span>{Math.floor((min + max) / 2)}</span>
              <span>{max}</span>
            </div>
          )}
        </div>

        {/* Intensity indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-1 flex-1 rounded-therapy-sm overflow-hidden bg-muted",
            isCompact && "h-0.5"
          )}>
            <div
              className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-300"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className={cn(
            "text-xs font-medium text-muted-foreground min-w-[3rem]",
            isCompact && "text-[10px] min-w-[2rem]"
          )}>
            {value === 0 && "None"}
            {value > 0 && value <= 2 && "Low"}
            {value > 2 && value <= 5 && "Mild"}
            {value > 5 && value <= 7 && "Moderate"}
            {value > 7 && value <= 9 && "High"}
            {value === 10 && "Intense"}
          </span>
        </div>
      </div>
    );
  }
);

EmotionSlider.displayName = "EmotionSlider";

export { EmotionSlider, type EmotionSliderProps };