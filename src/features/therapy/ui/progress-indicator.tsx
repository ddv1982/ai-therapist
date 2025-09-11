import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  current?: boolean;
  error?: boolean;
  optional?: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  showDescription?: boolean;
  className?: string;
  onStepClick?: (stepId: string) => void;
}

const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({
    steps,
    orientation = "horizontal",
    size = "md",
    showLabels = true,
    showDescription = false,
    className,
    onStepClick,
    ...props
  }, ref) => {
    const isVertical = orientation === "vertical";
    const sizeClasses = {
      sm: { step: "w-6 h-6", text: "text-sm", spacing: "gap-2" },
      md: { step: "w-8 h-8", text: "text-sm", spacing: "gap-3" },
      lg: { step: "w-10 h-10", text: "text-base", spacing: "gap-4" },
    }[size];

    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;

    return (
      <div
        ref={ref}
        className={cn("therapy-progress-indicator", className)}
        {...props}
      >
        {/* Overall Progress Bar */}
        <div className="mb-therapy-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">
              Overall Progress
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">
                {Math.round(progressPercentage)}%
              </span>
              <Badge variant="outline" size="sm">
                {completedSteps}/{totalSteps}
              </Badge>
            </div>
          </div>
          <div className="h-2 bg-muted rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div
          className={cn(
            "flex",
            isVertical ? "flex-col" : "flex-row items-center",
            sizeClasses.spacing
          )}
        >
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isClickable = onStepClick && (step.completed || step.current);

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center",
                  isVertical ? "w-full" : "flex-1",
                  sizeClasses.spacing
                )}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex items-center",
                    isVertical ? "flex-row w-full" : "flex-col"
                  )}
                >
                  <div className="relative">
                    <button
                      onClick={isClickable ? () => onStepClick!(step.id) : undefined}
                      disabled={!isClickable}
                      className={cn(
                        "flex items-center justify-center rounded-full border-2 transition-all duration-200",
                        sizeClasses.step,
                        {
                          // Completed step
                          "bg-primary border-primary text-primary-foreground shadow-sm":
                            step.completed,
                          // Current step
                          "bg-background border-primary text-primary ring-2 ring-primary/20":
                            step.current && !step.completed,
                          // Error step
                          "bg-destructive/10 border-destructive text-destructive":
                            step.error,
                          // Default/future step
                          "bg-background border-muted-foreground/30 text-muted-foreground":
                            !step.completed && !step.current && !step.error,
                          // Clickable
                          "cursor-pointer": isClickable,
                          // Disabled
                          "cursor-not-allowed opacity-60": !isClickable && !step.current,
                        }
                      )}
                    >
                      {step.error ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : step.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Circle className="w-3 h-3" />
                      )}
                    </button>

                    {/* Optional indicator */}
                    {step.optional && (
                      <Badge
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 text-[10px] px-1 py-0.5 h-4"
                      >
                        Optional
                      </Badge>
                    )}
                  </div>

                  {/* Step Label and Description */}
                  {showLabels && (
                    <div
                      className={cn(
                        "flex flex-col",
                        isVertical ? "ml-3 flex-1" : "mt-2 text-center",
                        sizeClasses.text
                      )}
                    >
                      <span
                        className={cn(
                          "font-semibold transition-colors duration-200",
                          {
                            "text-primary": step.current || step.completed,
                            "text-destructive": step.error,
                            "text-foreground": !step.current && !step.completed && !step.error,
                          }
                        )}
                      >
                        {step.label}
                      </span>
                      {showDescription && step.description && (
                        <span className="text-muted-foreground text-sm mt-1">
                          {step.description}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={cn(
                      "flex-1",
                      isVertical
                        ? "h-8 w-0.5 ml-4 bg-gradient-to-b"
                        : "h-0.5 mx-2 bg-gradient-to-r",
                      step.completed
                        ? "from-primary to-accent"
                        : "from-muted to-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

ProgressIndicator.displayName = "ProgressIndicator";

export { ProgressIndicator, type ProgressStep, type ProgressIndicatorProps };